/**
 * GET/PUT/DELETE /api/leads/[id] - Get/Update/Delete a single lead
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { isValidEmail, sanitizeString } from '@/lib/security';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

// Valid enum values
const VALID_SOURCES = ['website', 'referral', 'walk_in', 'social_media', 'advertisement', 'cold_call', 'other'];
const VALID_STATUSES = ['new', 'contacted', 'qualified', 'consultation_scheduled', 'retained', 'lost', 'disqualified'];
const VALID_CASE_TYPES = ['family_law', 'criminal_defence', 'civil_litigation', 'conveyancing', 'estate_planning', 'corporate_commercial', 'debt_collection', 'immigration', 'labour_law', 'personal_injury', 'other'];

// GET - Get single lead by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.VIEW_LEADS)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const { id } = await params;

    const lead = await db.lead.findUnique({
      where: { id },
      include: {
        assigned_paralegal: { select: { id: true, full_name: true, email: true, role: true } },
        assigned_officer: { select: { id: true, full_name: true, email: true, role: true } },
      },
    });

    if (!lead) {
      return apiError('Lead not found', 404, 'LEAD_NOT_FOUND');
    }

    return apiResponse(lead);
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
    const auth = requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.EDIT_LEAD)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const { id } = await params;

    // Verify lead exists
    const existingLead = await db.lead.findUnique({ where: { id } });
    if (!existingLead) {
      return apiError('Lead not found', 404, 'LEAD_NOT_FOUND');
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      source,
      status,
      case_type,
      description,
      assigned_paralegal_id,
      assigned_officer_id,
      lead_score,
      qualification_notes,
      estimated_value,
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
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = sanitizeString(name);
    if (email !== undefined) updateData.email = email.toLowerCase();
    if (phone !== undefined) updateData.phone = phone ? sanitizeString(phone) : null;
    if (source !== undefined) updateData.source = source;
    if (status !== undefined) updateData.status = status;
    if (case_type !== undefined) updateData.case_type = case_type || null;
    if (description !== undefined) updateData.description = description ? sanitizeString(description) : null;
    if (assigned_paralegal_id !== undefined) updateData.assigned_paralegal_id = assigned_paralegal_id || null;
    if (assigned_officer_id !== undefined) updateData.assigned_officer_id = assigned_officer_id || null;
    if (lead_score !== undefined) updateData.lead_score = lead_score || null;
    if (qualification_notes !== undefined) updateData.qualification_notes = qualification_notes ? sanitizeString(qualification_notes) : null;
    if (estimated_value !== undefined) updateData.estimated_value = estimated_value || null;

    // If status changes to 'retained', set converted_case_id if provided
    if (status === 'retained' && converted_case_id) {
      // Verify the case exists
      const caseExists = await db.case.findUnique({ where: { id: converted_case_id } });
      if (!caseExists) {
        return apiError('Converted case not found', 404, 'CASE_NOT_FOUND');
      }
      updateData.converted_case_id = converted_case_id;
    }

    const updatedLead = await db.lead.update({
      where: { id },
      data: updateData,
      include: {
        assigned_paralegal: { select: { id: true, full_name: true } },
        assigned_officer: { select: { id: true, full_name: true } },
      },
    });

    await createAuditLog({
      user_id: auth.user.userId,
      action: 'UPDATE_LEAD',
      resource_type: 'lead',
      resource_id: id,
      details: `Lead "${existingLead.name}" updated`,
    });

    return apiResponse(updatedLead);
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
    const auth = requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.DELETE_LEAD)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const { id } = await params;

    // Verify lead exists
    const existingLead = await db.lead.findUnique({ where: { id } });
    if (!existingLead) {
      return apiError('Lead not found', 404, 'LEAD_NOT_FOUND');
    }

    await db.lead.delete({ where: { id } });

    await createAuditLog({
      user_id: auth.user.userId,
      action: 'DELETE_LEAD',
      resource_type: 'lead',
      resource_id: id,
      details: `Lead "${existingLead.name}" deleted`,
    });

    return apiResponse({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Delete lead error:', error);
    return apiError('Failed to delete lead', 500, 'DELETE_LEAD_ERROR');
  }
}
