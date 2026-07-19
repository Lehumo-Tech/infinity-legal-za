/**
 * POST /api/leads/[id]/convert - Convert a lead into a client (and optional case)
 *
 * Steps:
 * 1. Authenticate + require CONVERT_LEAD permission
 * 2. CSRF validation (Bearer header bypasses Origin check)
 * 3. Fetch the IntakeSubmission (lead) by id
 * 4. Find or create a User account with the lead's email (random temp password)
 * 5. Find or create a Client profile for that user
 * 6. Update the lead: status='retained', client_id, reviewed_by, reviewed_at
 * 7. Optionally create a Case (if create_case=true AND lead has a case_type)
 * 8. Send a welcome email via sendEmail()
 * 9. Track via serverTrack('lead_converted', {...})
 *
 * This route is idempotent for existing users/clients: if the user already
 * exists with a Client profile, we just link the lead to the existing client.
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { apiResponse, apiError, requireAuth, validateCSRF } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';
import { hashPassword } from '@/lib/local-auth';
import { sendEmail } from '@/lib/email-service';
import { serverTrack } from '@/lib/posthog';
import crypto from 'crypto';

interface LeadPersonalInfo {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  lead_score?: number | null;
  assigned_to?: string | null;
  notes?: string | null;
}

/**
 * Generate a unique case reference in format INF-YYYYMM-XXXXX.
 * Mirrors the helper in /api/cases/route.ts so generated refs are consistent
 * across both endpoints.
 */
async function generateCaseRef(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `INF-${year}${month}`;

  const existingCases = await db.case.findMany({
    where: { case_ref: { startsWith: prefix } },
    select: { case_ref: true },
    orderBy: { case_ref: 'desc' },
    take: 1,
  });

  let nextNum = 1;
  if (existingCases.length > 0) {
    const lastRef = existingCases[0].case_ref;
    const lastNum = parseInt(lastRef.split('-').pop() || '0', 10);
    nextNum = lastNum + 1;
  }

  return `${prefix}-${String(nextNum).padStart(5, '0')}`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.CONVERT_LEAD)) {
      return apiError('Insufficient permissions to convert leads', 403, 'FORBIDDEN');
    }

    // CSRF — Bearer header bypasses Origin check; this is safe.
    const csrf = validateCSRF(request);
    if (!csrf.valid) return csrf.error!;

    const { id } = await params;

    // Parse body (optional create_case flag)
    let createCaseFlag = false;
    try {
      const body = await request.json();
      createCaseFlag = !!body?.create_case;
    } catch {
      // Body may be empty — that's fine, default to no case creation
    }

    // 1. Fetch the lead
    const lead = await db.intakeSubmission.findUnique({
      where: { id },
      include: {
        client: { include: { user: { select: { id: true, email: true, full_name: true } } } },
        case: { select: { id: true, case_ref: true, title: true } },
      },
    });

    if (!lead) {
      return apiError('Lead not found', 404, 'LEAD_NOT_FOUND');
    }

    // Already converted? Return current state without duplicating.
    if (lead.status === 'retained' && lead.client_id) {
      return apiResponse({
        message: 'Lead is already converted',
        alreadyConverted: true,
        lead: { id: lead.id, status: lead.status },
        client: lead.client?.user
          ? { id: lead.client.user.id, full_name: lead.client.user.full_name, email: lead.client.user.email }
          : null,
        case: lead.case
          ? { id: lead.case.id, case_ref: lead.case.case_ref, title: lead.case.title }
          : null,
      });
    }

    // 2. Extract lead info from personal_info JSON
    const personalInfo = (lead.personal_info && typeof lead.personal_info === 'object'
      ? (lead.personal_info as LeadPersonalInfo)
      : {}) as LeadPersonalInfo;

    const leadEmail = (personalInfo.email || '').toString().toLowerCase().trim();
    const leadFullName = (personalInfo.full_name || 'New Client').toString().trim();
    const leadPhone = personalInfo.phone ? personalInfo.phone.toString() : null;

    if (!leadEmail) {
      return apiError(
        'Lead has no email address — cannot create a client account',
        400,
        'MISSING_EMAIL'
      );
    }

    // 3. Find or create a User account
    let user = await db.user.findUnique({
      where: { email: leadEmail },
      include: { client_profile: true },
    });

    let isNewUser = false;
    if (!user) {
      // Create user with a random temp password — the user will reset via
      // Clerk or the forgot-password flow once they're onboarded.
      const tempPassword = crypto.randomUUID();
      const passwordHash = await hashPassword(tempPassword);
      user = await db.user.create({
        data: {
          email: leadEmail,
          password: passwordHash,
          full_name: leadFullName,
          phone: leadPhone || null,
          role: 'client',
          email_verified: true,
          popi_consent: true,
          is_active: true,
        },
        include: { client_profile: true },
      });
      isNewUser = true;
    }

    // 4. Find or create a Client profile
    let client = user.client_profile;
    let isNewClient = false;
    if (!client) {
      client = await db.client.create({
        data: {
          user_id: user.id,
          subscription_status: 'none',
        },
      });
      isNewClient = true;
    }

    // 5. Optionally create a Case (only if requested AND lead has a case_type)
    let newCase: { id: string; case_ref: string; title: string } | null = null;
    if (createCaseFlag && lead.case_type) {
      const caseRef = await generateCaseRef();
      const caseTitle = lead.case_description
        ? lead.case_description.slice(0, 80)
        : `${leadFullName} — ${lead.case_type.replace(/_/g, ' ')} matter`;

      const createdCase = await db.case.create({
        data: {
          case_ref: caseRef,
          title: caseTitle,
          description: lead.case_description || null,
          case_type: lead.case_type,
          status: 'intake',
          urgency: lead.urgency || 'medium',
          client_id: client.id,
          estimated_value: lead.estimated_value || null,
        },
        select: { id: true, case_ref: true, title: true },
      });
      newCase = createdCase;

      // Initial timeline event
      try {
        await db.caseTimeline.create({
          data: {
            case_id: createdCase.id,
            event_type: 'CASE_CREATED',
            event_description: 'Case created from lead conversion',
            performed_by: auth.user.userId,
            is_system_event: false,
          },
        });
      } catch {
        // Non-fatal — timeline is best-effort
      }
    }

    // 6. Update the lead: status='retained', link client + case, mark reviewer
    const updatedLead = await db.intakeSubmission.update({
      where: { id },
      data: {
        status: 'retained',
        client_id: client.id,
        case_id: newCase?.id || lead.case_id || null,
        reviewed_by: auth.user.userId,
        reviewed_at: new Date(),
      },
      select: {
        id: true,
        status: true,
        client_id: true,
        case_id: true,
        reviewed_by: true,
        reviewed_at: true,
      },
    });

    // 7. Audit log
    await createAuditLog({
      user_id: auth.user.userId,
      action: 'CONVERT_LEAD',
      resource_type: 'lead',
      resource_id: id,
      details: {
        message: `Lead "${leadFullName}" converted to client`,
        new_user_id: user.id,
        new_client_id: client.id,
        new_case_id: newCase?.id || null,
        new_user_created: isNewUser,
        new_client_created: isNewClient,
      },
    });

    // 8. Send welcome email (fire-and-forget, don't block conversion on email failure)
    const firstName = leadFullName.split(' ')[0] || 'Client';
    const welcomeHtml = `
      <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 600px; margin: 0 auto; padding: 32px; color: #0c1e3c;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #c9a84c; font-size: 24px; margin: 0; letter-spacing: 2px;">INFINITY LEGAL SA</h1>
          <p style="color: #64748b; font-size: 12px; margin-top: 4px; letter-spacing: 1px;">SOUTH AFRICA'S PREMIER LEGAL SERVICES PLATFORM</p>
        </div>
        <h2 style="color: #0c1e3c; font-size: 22px; margin-bottom: 16px;">Welcome to Infinity Legal, ${firstName}!</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #334155;">
          Your lead has been officially converted into a client account with Infinity Legal SA. We're honoured to have you on board.
        </p>
        <p style="font-size: 15px; line-height: 1.6; color: #334155;">
          A dedicated legal advisor will be in touch with you shortly to discuss your matter${lead.case_type ? ` regarding <strong>${lead.case_type.replace(/_/g, ' ')}</strong>` : ''} and outline the next steps.
        </p>
        ${newCase ? `
        <div style="background: #f8fafc; border-left: 3px solid #c9a84c; padding: 16px 20px; margin: 24px 0; border-radius: 6px;">
          <p style="margin: 0; font-size: 13px; color: #64748b;">Your case reference</p>
          <p style="margin: 4px 0 0; font-size: 18px; font-weight: bold; color: #0c1e3c; letter-spacing: 1px;">${newCase.case_ref}</p>
        </div>
        ` : ''}
        <p style="font-size: 14px; line-height: 1.6; color: #334155;">
          If you have any urgent questions in the meantime, please reach out to our support team at <a href="mailto:info@infinitylegal.org" style="color: #c9a84c;">info@infinitylegal.org</a>.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">
          &copy; ${new Date().getFullYear()} Infinity Legal (Pty) Ltd. All rights reserved.<br>
          POPIA Compliant | 256-bit Encryption
        </p>
      </div>
    `;

    sendEmail({
      to: leadEmail,
      subject: `Welcome to Infinity Legal SA${newCase ? ` — Case ${newCase.case_ref}` : ''}`,
      html: welcomeHtml,
      text: `Welcome to Infinity Legal SA, ${leadFullName}!\n\nYour lead has been officially converted into a client account. A dedicated legal advisor will be in touch with you shortly to discuss your matter${lead.case_type ? ` regarding ${lead.case_type.replace(/_/g, ' ')}` : ''} and outline the next steps.${newCase ? `\n\nYour case reference: ${newCase.case_ref}` : ''}\n\nIf you have any urgent questions, please reach out to info@infinitylegal.org.\n\n— Infinity Legal SA`,
      category: 'welcome',
      userId: user.id,
      recipientName: leadFullName,
    }).catch((err) => console.error('[Lead Convert] Welcome email failed:', err));

    // 9. PostHog tracking (no-op when keys are absent)
    await serverTrack(auth.user.userId, 'lead_converted', {
      leadId: id,
      newClientId: client.id,
      newUserId: user.id,
      createdCaseId: newCase?.id || null,
      caseRef: newCase?.case_ref || null,
      isNewUser,
      isNewClient,
    });

    return apiResponse(
      {
        message: 'Lead converted to client successfully',
        lead: updatedLead,
        client: {
          id: client.id,
          user_id: user.id,
          email: user.email,
          full_name: user.full_name,
          subscription_status: client.subscription_status,
          is_new_user: isNewUser,
          is_new_client: isNewClient,
        },
        case: newCase
          ? { id: newCase.id, case_ref: newCase.case_ref, title: newCase.title }
          : null,
      },
      201
    );
  } catch (error) {
    console.error('[Lead Convert] Error:', error);
    return apiError('Failed to convert lead', 500, 'CONVERT_LEAD_ERROR');
  }
}
