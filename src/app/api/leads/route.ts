/**
 * GET/POST /api/leads - List/Create leads via Prisma/SQLite
 * Since the Prisma schema uses IntakeSubmission as the leads model,
 * we query IntakeSubmission where status != 'draft' as leads.
 * Admin-only access for GET, open for POST (from AI intake form).
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { isValidEmail, sanitizeString } from '@/lib/security';
import { apiResponse, apiError, requireAuth, getPaginationParams, createPaginationResult } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

// Valid enum values per Prisma schema
const VALID_CASE_TYPES = ['civil', 'criminal', 'family', 'corporate', 'property', 'labour', 'immigration', 'tax', 'personal_injury', 'debt_recovery', 'other'];

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.VIEW_LEADS)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const { page, perPage } = getPaginationParams(request);
    const url = new URL(request.url);

    const status = url.searchParams.get('status');
    const case_type = url.searchParams.get('case_type');
    const search = url.searchParams.get('search');

    // Build where clause — leads are non-draft intake submissions
    const where: Record<string, unknown> = {
      status: { not: 'draft' },
    };

    if (status) where.status = status;
    if (case_type) where.case_type = case_type;

    // Search in case_description and personal_info
    if (search) {
      where.OR = [
        { case_description: { contains: search } },
        { ai_summary: { contains: search } },
      ];
    }

    const [submissions, total] = await Promise.all([
      db.intakeSubmission.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          client: { include: { user: { select: { full_name: true, email: true } } } },
          case: { select: { case_ref: true, title: true } },
          reviewer: { select: { full_name: true, email: true } },
        },
      }),
      db.intakeSubmission.count({ where }),
    ]);

    const formattedLeads = submissions.map((sub) => {
      const personalInfo = (sub.personal_info || {}) as Record<string, unknown>;
      return {
        id: sub.id,
        first_name: (personalInfo.full_name as string || '').split(' ')[0] || '',
        last_name: (personalInfo.full_name as string || '').split(' ').slice(1).join(' ') || '',
        name: (personalInfo.full_name as string || '').trim() || 'Unknown',
        email: personalInfo.email || '',
        phone: personalInfo.phone || '',
        source: 'website',
        status: sub.status,
        case_type: sub.case_type,
        description: sub.case_description,
        estimated_value: sub.estimated_value,
        urgency: sub.urgency,
        lead_score: sub.ai_confidence ? Math.round(sub.ai_confidence * 100) : null,
        ai_summary: sub.ai_summary,
        assigned_to: sub.reviewed_by,
        notes: sub.review_notes,
        tags: sub.ai_recommendations,
        created_at: sub.created_at,
        updated_at: sub.updated_at,
        submitted_at: sub.submitted_at,
        client: sub.client?.user ? { full_name: sub.client.user.full_name, email: sub.client.user.email } : null,
        case: sub.case ? { case_ref: sub.case.case_ref, title: sub.case.title } : null,
        reviewer: sub.reviewer ? { full_name: sub.reviewer.full_name, email: sub.reviewer.email } : null,
      };
    });

    return apiResponse({
      data: formattedLeads,
      pagination: createPaginationResult(total, page, perPage),
    });
  } catch (error) {
    console.error('Leads list error:', error);
    return apiError('Failed to load leads', 500, 'LEADS_ERROR');
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.CREATE_LEAD)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const body = await request.json();
    const { first_name, last_name, email, phone, case_type, description, estimated_value, urgency } = body;

    if (!first_name || !last_name || !email) {
      return apiError('First name, last name, and email are required', 400, 'MISSING_FIELDS');
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return apiError('Invalid email format', 400, 'INVALID_EMAIL');
    }

    // Validate case_type if provided
    if (case_type && !VALID_CASE_TYPES.includes(case_type)) {
      return apiError(`Invalid case_type. Must be one of: ${VALID_CASE_TYPES.join(', ')}`, 400, 'INVALID_CASE_TYPE');
    }

    // Try to find or create a client for this lead
    let clientId: string | null = null;
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { client_profile: true },
    });

    if (existingUser?.client_profile) {
      clientId = existingUser.client_profile.id;
    }

    const fullName = `${first_name} ${last_name}`.trim();

    const submission = await db.intakeSubmission.create({
      data: {
        client_id: clientId,
        case_type: case_type || null,
        case_description: description ? sanitizeString(description) : null,
        estimated_value: estimated_value || null,
        urgency: urgency || 'medium',
        personal_info: {
          full_name: sanitizeString(fullName),
          email: email.toLowerCase().trim(),
          phone: phone ? sanitizeString(phone) : null,
        },
        status: 'submitted',
        submitted_at: new Date(),
      },
    });

    await createAuditLog({
      user_id: auth.user.userId,
      action: 'CREATE_LEAD',
      resource_type: 'lead',
      resource_id: submission.id,
    });

    return apiResponse(submission, 201);
  } catch (error) {
    console.error('Create lead error:', error);
    return apiError('Failed to create lead', 500, 'CREATE_LEAD_ERROR');
  }
}
