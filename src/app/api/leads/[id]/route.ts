/**
 * GET/PUT/DELETE /api/leads/[id] - Get/Update/Delete a single lead via Prisma
 *
 * In this Prisma schema, "leads" are represented by IntakeSubmission records
 * where status != 'draft'. We store lead-specific fields (first_name, last_name,
 * email, phone, source, lead_score, assigned_to, etc.) inside the personal_info
 * and ai_extracted_data JSON columns.
 */

import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { isValidEmail, sanitizeString } from '@/lib/security';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

// Valid enum values per Prisma schema
const VALID_SOURCES = ['website', 'referral', 'social_media', 'google_ads', 'walk_in', 'phone', 'email', 'partner', 'event', 'other'];
const VALID_STATUSES = ['new', 'contacted', 'qualified', 'consultation_scheduled', 'retained', 'lost', 'nurturing', 'submitted', 'under_review', 'approved', 'rejected', 'additional_info_needed'];
const VALID_CASE_TYPES = ['civil', 'criminal', 'family', 'corporate', 'property', 'labour', 'immigration', 'tax', 'personal_injury', 'debt_recovery', 'other'];

interface LeadPersonalInfo {
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  lead_score?: number | null;
  assigned_to?: string | null;
  notes?: string | null;
}

function extractLeadInfo(personalInfo: unknown, aiData: unknown): {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  source: string;
  lead_score: number | null;
  assigned_to: string | null;
  notes: string | null;
} {
  const pi = (personalInfo && typeof personalInfo === 'object' ? personalInfo : {}) as LeadPersonalInfo;
  const ai = (aiData && typeof aiData === 'object' ? aiData : {}) as Record<string, unknown>;
  const fullName = (pi.full_name || '').trim();
  const parts = fullName.split(/\s+/);
  return {
    first_name: pi.first_name || parts[0] || '',
    last_name: pi.last_name || parts.slice(1).join(' ') || '',
    email: pi.email || '',
    phone: pi.phone || '',
    source: pi.source || 'website',
    lead_score: pi.lead_score ?? (typeof ai.confidence === 'number' ? Math.round(ai.confidence * 100) : null),
    assigned_to: pi.assigned_to ?? null,
    notes: pi.notes ?? null,
  };
}

// GET - Get single lead by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.VIEW_LEADS)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const { id } = await params;

    const submission = await db.intakeSubmission.findUnique({
      where: { id },
      include: {
        client: {
          include: { user: { select: { id: true, full_name: true, email: true, role: true } } },
        },
        reviewer: { select: { id: true, full_name: true, email: true } },
        case: { select: { id: true, case_ref: true, title: true, status: true } },
      },
    });

    if (!submission) {
      return apiError('Lead not found', 404, 'LEAD_NOT_FOUND');
    }

    const info = extractLeadInfo(submission.personal_info, submission.ai_extracted_data);

    return apiResponse({
      id: submission.id,
      first_name: info.first_name,
      last_name: info.last_name,
      email: info.email,
      phone: info.phone,
      source: info.source,
      status: submission.status,
      case_type: submission.case_type,
      description: submission.case_description,
      estimated_value: submission.estimated_value,
      urgency: submission.urgency,
      lead_score: info.lead_score,
      ai_summary: submission.ai_summary,
      assigned_to: info.assigned_to,
      notes: info.notes,
      created_at: submission.created_at,
      updated_at: submission.updated_at,
      submitted_at: submission.submitted_at,
      client: submission.client?.user
        ? { id: submission.client.user.id, full_name: submission.client.user.full_name, email: submission.client.user.email, role: submission.client.user.role }
        : null,
      case: submission.case
        ? { id: submission.case.id, case_ref: submission.case.case_ref, title: submission.case.title, status: submission.case.status }
        : null,
      reviewer: submission.reviewer
        ? { id: submission.reviewer.id, full_name: submission.reviewer.full_name, email: submission.reviewer.email }
        : null,
    });
  } catch (error) {
    console.error('Get lead error:', error);
    return apiError('Failed to load lead', 500, 'LEAD_ERROR');
  }
}

// PUT - Update a lead
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.EDIT_LEAD)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const { id } = await params;

    // Verify lead exists
    const existingLead = await db.intakeSubmission.findUnique({
      where: { id },
      select: { id: true, personal_info: true, case_id: true, status: true },
    });

    if (!existingLead) {
      return apiError('Lead not found', 404, 'LEAD_NOT_FOUND');
    }

    const body = await request.json();
    const {
      first_name,
      last_name,
      email,
      phone,
      source,
      status,
      case_type,
      description,
      assigned_to,
      lead_score,
      estimated_value,
      notes,
      converted_case_id,
    } = body;

    // Validate source enum if provided
    if (source && !VALID_SOURCES.includes(source)) {
      return apiError(`Invalid source. Must be one of: ${VALID_SOURCES.join(', ')}`, 400, 'INVALID_SOURCE');
    }

    // Validate status enum if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return apiError(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 400, 'INVALID_STATUS');
    }

    // Validate case_type enum if provided
    if (case_type && !VALID_CASE_TYPES.includes(case_type)) {
      return apiError(`Invalid case_type. Must be one of: ${VALID_CASE_TYPES.join(', ')}`, 400, 'INVALID_CASE_TYPE');
    }

    // Validate email format if provided
    if (email && !isValidEmail(email)) {
      return apiError('Invalid email format', 400, 'INVALID_EMAIL');
    }

    // Build update data
    const updateData: Prisma.IntakeSubmissionUpdateInput = {};

    if (status !== undefined) updateData.status = status;
    if (case_type !== undefined) updateData.case_type = case_type || null;
    if (description !== undefined) updateData.case_description = description ? sanitizeString(description) : null;
    if (estimated_value !== undefined) updateData.estimated_value = estimated_value || null;

    // Merge personal_info JSON
    const personalInfo = (existingLead.personal_info && typeof existingLead.personal_info === 'object'
      ? { ...(existingLead.personal_info as object) }
      : {}) as LeadPersonalInfo;

    if (first_name !== undefined || last_name !== undefined) {
      const currentFirst = personalInfo.first_name || '';
      const currentLast = personalInfo.last_name || '';
      personalInfo.first_name = first_name !== undefined ? sanitizeString(first_name) : currentFirst;
      personalInfo.last_name = last_name !== undefined ? sanitizeString(last_name) : currentLast;
      personalInfo.full_name = `${personalInfo.first_name} ${personalInfo.last_name}`.trim();
    }
    if (email !== undefined) personalInfo.email = email.toLowerCase();
    if (phone !== undefined) personalInfo.phone = phone ? sanitizeString(phone) : null;
    if (source !== undefined) personalInfo.source = source;
    if (assigned_to !== undefined) personalInfo.assigned_to = assigned_to ? String(assigned_to) : null;
    if (lead_score !== undefined) personalInfo.lead_score = lead_score ? Number(lead_score) : null;
    if (notes !== undefined) personalInfo.notes = notes ? sanitizeString(notes) : null;

    updateData.personal_info = personalInfo as Prisma.InputJsonValue;

    // If status changes to 'retained' and a converted_case_id is provided, link it
    if (status === 'retained' && converted_case_id) {
      const caseExists = await db.case.findUnique({
        where: { id: converted_case_id },
        select: { id: true },
      });
      if (!caseExists) {
        return apiError('Converted case not found', 404, 'CASE_NOT_FOUND');
      }
      updateData.case = { connect: { id: converted_case_id } };
    }

    const updatedLead = await db.intakeSubmission.update({
      where: { id },
      data: updateData,
      include: {
        reviewer: { select: { id: true, full_name: true, email: true } },
        case: { select: { id: true, case_ref: true, title: true } },
      },
    });

    const info = extractLeadInfo(updatedLead.personal_info, updatedLead.ai_extracted_data);

    await createAuditLog({
      user_id: auth.user.userId,
      action: 'UPDATE_LEAD',
      resource_type: 'lead',
      resource_id: id,
      details: { message: `Lead "${info.first_name} ${info.last_name}" updated` },
    });

    return apiResponse({
      id: updatedLead.id,
      first_name: info.first_name,
      last_name: info.last_name,
      email: info.email,
      phone: info.phone,
      source: info.source,
      status: updatedLead.status,
      case_type: updatedLead.case_type,
      description: updatedLead.case_description,
      estimated_value: updatedLead.estimated_value,
      urgency: updatedLead.urgency,
      lead_score: info.lead_score,
      ai_summary: updatedLead.ai_summary,
      assigned_to: info.assigned_to,
      notes: info.notes,
      created_at: updatedLead.created_at,
      updated_at: updatedLead.updated_at,
      submitted_at: updatedLead.submitted_at,
      case: updatedLead.case
        ? { id: updatedLead.case.id, case_ref: updatedLead.case.case_ref, title: updatedLead.case.title }
        : null,
      reviewer: updatedLead.reviewer
        ? { id: updatedLead.reviewer.id, full_name: updatedLead.reviewer.full_name, email: updatedLead.reviewer.email }
        : null,
    });
  } catch (error) {
    console.error('Update lead error:', error);
    return apiError('Failed to update lead', 500, 'UPDATE_LEAD_ERROR');
  }
}

// DELETE - Delete a lead
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.DELETE_LEAD)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const { id } = await params;

    // Verify lead exists
    const existingLead = await db.intakeSubmission.findUnique({
      where: { id },
      select: { id: true, personal_info: true },
    });

    if (!existingLead) {
      return apiError('Lead not found', 404, 'LEAD_NOT_FOUND');
    }

    await db.intakeSubmission.delete({ where: { id } });

    const info = extractLeadInfo(existingLead.personal_info, null);

    await createAuditLog({
      user_id: auth.user.userId,
      action: 'DELETE_LEAD',
      resource_type: 'lead',
      resource_id: id,
      details: { message: `Lead "${info.first_name} ${info.last_name}" deleted` },
    });

    return apiResponse({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Delete lead error:', error);
    return apiError('Failed to delete lead', 500, 'DELETE_LEAD_ERROR');
  }
}
