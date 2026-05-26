/**
 * GET/PUT/DELETE /api/cases/[id] - Get/Update/Delete a single case
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { sanitizeString } from '@/lib/security';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

// Valid enum values
const VALID_CASE_TYPES = ['family_law', 'criminal_defence', 'civil_litigation', 'conveyancing', 'estate_planning', 'corporate_commercial', 'debt_collection', 'immigration', 'labour_law', 'personal_injury', 'other'];
const VALID_URGENCIES = ['low', 'medium', 'high', 'critical'];
const VALID_STATUSES = ['intake', 'pending_review', 'active', 'on_hold', 'settled', 'closed', 'archived'];

// GET - Get single case by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.VIEW_OWN_CASES)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const { id } = await params;

    const caseRecord = await db.case.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, full_name: true, email: true, phone: true } },
        lead_attorney: { select: { id: true, full_name: true, email: true, role: true } },
        documents: {
          select: { id: true, title: true, document_type: true, workflow_status: true, version: true, created_at: true },
          orderBy: { created_at: 'desc' },
        },
        tasks: {
          select: { id: true, title: true, status: true, priority: true, due_date: true },
          orderBy: { created_at: 'desc' },
        },
        timeline: {
          orderBy: { created_at: 'desc' },
          take: 20,
        },
      },
    });

    if (!caseRecord) {
      return apiError('Case not found', 404, 'CASE_NOT_FOUND');
    }

    // Non-admin users can only see cases they're assigned to
    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.VIEW_ALL_CASES)) {
      const isAssigned =
        caseRecord.client_id === auth.user.userId ||
        caseRecord.lead_attorney_id === auth.user.userId ||
        caseRecord.support_paralegal_id === auth.user.userId;
      if (!isAssigned) {
        return apiError('Case not found', 404, 'CASE_NOT_FOUND');
      }
    }

    return apiResponse(caseRecord);
  } catch (error) {
    console.error('Get case error:', error);
    return apiError('Failed to load case', 500, 'CASE_ERROR');
  }
}

// PUT - Update a case
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.EDIT_CASE)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const { id } = await params;

    // Verify case exists
    const existingCase = await db.case.findUnique({ where: { id } });
    if (!existingCase) {
      return apiError('Case not found', 404, 'CASE_NOT_FOUND');
    }

    const body = await request.json();
    const {
      title,
      description,
      case_type,
      urgency,
      status,
      lead_attorney_id,
      support_paralegal_id,
      court_date,
      next_action,
      next_action_date,
      estimated_value,
    } = body;

    // Validate enum fields if provided
    if (case_type && !VALID_CASE_TYPES.includes(case_type)) {
      return apiError(`Invalid case_type. Must be one of: ${VALID_CASE_TYPES.join(', ')}`, 400, 'INVALID_CASE_TYPE');
    }
    if (urgency && !VALID_URGENCIES.includes(urgency)) {
      return apiError(`Invalid urgency. Must be one of: ${VALID_URGENCIES.join(', ')}`, 400, 'INVALID_URGENCY');
    }
    if (status && !VALID_STATUSES.includes(status)) {
      return apiError(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 400, 'INVALID_STATUS');
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = sanitizeString(title);
    if (description !== undefined) updateData.description = description ? sanitizeString(description) : null;
    if (case_type !== undefined) updateData.case_type = case_type;
    if (urgency !== undefined) updateData.urgency = urgency;
    if (status !== undefined) updateData.status = status;
    if (lead_attorney_id !== undefined) updateData.lead_attorney_id = lead_attorney_id || null;
    if (support_paralegal_id !== undefined) updateData.support_paralegal_id = support_paralegal_id || null;
    if (court_date !== undefined) updateData.court_date = court_date ? new Date(court_date) : null;
    if (next_action !== undefined) updateData.next_action = next_action ? sanitizeString(next_action) : null;
    if (next_action_date !== undefined) updateData.next_action_date = next_action_date ? new Date(next_action_date) : null;
    if (estimated_value !== undefined) updateData.estimated_value = estimated_value || null;

    const updatedCase = await db.case.update({
      where: { id },
      data: updateData,
      include: {
        client: { select: { id: true, full_name: true, email: true } },
        lead_attorney: { select: { id: true, full_name: true } },
      },
    });

    // Create timeline entry on status change
    if (status && status !== existingCase.status) {
      await db.caseTimeline.create({
        data: {
          case_id: id,
          user_id: auth.user.userId,
          action: 'STATUS_CHANGED',
          description: `Case status changed from ${existingCase.status} to ${status}`,
          previous_value: existingCase.status,
          new_value: status,
        },
      });
    }

    await createAuditLog({
      user_id: auth.user.userId,
      action: 'UPDATE_CASE',
      resource_type: 'case',
      resource_id: id,
      details: `Case "${existingCase.title}" updated`,
    });

    return apiResponse(updatedCase);
  } catch (error) {
    console.error('Update case error:', error);
    return apiError('Failed to update case', 500, 'UPDATE_CASE_ERROR');
  }
}

// DELETE - Soft delete a case (set status to 'archived')
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.ARCHIVE_CASE)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const { id } = await params;

    // Verify case exists
    const existingCase = await db.case.findUnique({ where: { id } });
    if (!existingCase) {
      return apiError('Case not found', 404, 'CASE_NOT_FOUND');
    }

    // Soft delete by setting status to 'archived'
    const archivedCase = await db.case.update({
      where: { id },
      data: { status: 'archived' },
    });

    // Create timeline entry
    await db.caseTimeline.create({
      data: {
        case_id: id,
        user_id: auth.user.userId,
        action: 'CASE_ARCHIVED',
        description: `Case archived by ${auth.user.email}`,
        previous_value: existingCase.status,
        new_value: 'archived',
      },
    });

    await createAuditLog({
      user_id: auth.user.userId,
      action: 'ARCHIVE_CASE',
      resource_type: 'case',
      resource_id: id,
      details: `Case "${existingCase.title}" archived`,
    });

    return apiResponse(archivedCase);
  } catch (error) {
    console.error('Delete case error:', error);
    return apiError('Failed to archive case', 500, 'DELETE_CASE_ERROR');
  }
}
