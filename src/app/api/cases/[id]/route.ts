/**
 * GET/PUT/DELETE /api/cases/[id] - Get/Update/Delete a single case via Prisma
 */

import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { sanitizeString } from '@/lib/security';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

// Valid enum values per Prisma schema
const VALID_CASE_TYPES = ['civil', 'criminal', 'family', 'corporate', 'property', 'labour', 'immigration', 'tax', 'personal_injury', 'debt_recovery', 'other'];
const VALID_STATUSES = ['intake', 'review', 'active', 'on_hold', 'closed', 'archived'];

// GET - Get single case by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.VIEW_OWN_CASES)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const { id } = await params;

    // Fetch case with related data — attorney_id FK → User(id)
    const caseRecord = await db.case.findUnique({
      where: { id },
      include: {
        client: {
          include: {
            user: {
              select: { id: true, full_name: true, email: true, phone: true },
            },
          },
        },
        attorney: {
          select: { id: true, full_name: true, email: true, role: true },
        },
      },
    });

    if (!caseRecord) {
      return apiError('Case not found', 404, 'CASE_NOT_FOUND');
    }

    // Non-admin users can only see cases they're assigned to (via client → user_id)
    // or that they're the lead advisor on. Use optional chaining — a case may have
    // an orphan client (null) if data was migrated incorrectly.
    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.VIEW_ALL_CASES)) {
      const isAssigned = caseRecord.client?.user_id === auth.user.userId ||
                         caseRecord.attorney_id === auth.user.userId;
      if (!isAssigned) {
        return apiError('Case not found', 404, 'CASE_NOT_FOUND');
      }
    }

    // Fetch related documents
    const documents = await db.document.findMany({
      where: { case_id: id },
      select: { id: true, file_name: true, document_type: true, status: true, version: true, created_at: true },
      orderBy: { created_at: 'desc' },
    });

    // Fetch related tasks
    const tasks = await db.task.findMany({
      where: { case_id: id },
      select: { id: true, title: true, status: true, priority: true, due_date: true },
      orderBy: { created_at: 'desc' },
    });

    // Fetch timeline (last 20)
    const timeline = await db.caseTimeline.findMany({
      where: { case_id: id },
      orderBy: { created_at: 'desc' },
      take: 20,
    });

    const result = {
      ...caseRecord,
      lead_attorney: caseRecord.attorney || null,
      documents,
      tasks,
      timeline,
    };

    return apiResponse(result);
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
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.EDIT_CASE)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const { id } = await params;

    // Verify case exists
    const existingCase = await db.case.findUnique({
      where: { id },
      select: { id: true, status: true, title: true, attorney_id: true },
    });

    if (!existingCase) {
      return apiError('Case not found', 404, 'CASE_NOT_FOUND');
    }

    const body = await request.json();
    const {
      title,
      description,
      case_type,
      status,
      attorney_id,
      opposing_party,
      court_name,
      case_number,
      jurisdiction,
      estimated_value,
      retainer_amount,
      contingency_fee,
      notes,
      tags,
    } = body;

    // Validate enum fields if provided
    if (case_type && !VALID_CASE_TYPES.includes(case_type)) {
      return apiError(`Invalid case_type. Must be one of: ${VALID_CASE_TYPES.join(', ')}`, 400, 'INVALID_CASE_TYPE');
    }
    if (status && !VALID_STATUSES.includes(status)) {
      return apiError(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 400, 'INVALID_STATUS');
    }

    // Validate attorney_id references a User if provided
    if (attorney_id) {
      const attorneyExists = await db.user.findUnique({
        where: { id: attorney_id },
        select: { id: true },
      });
      if (!attorneyExists) {
        return apiError('Attorney not found', 404, 'ATTORNEY_NOT_FOUND');
      }
    }

    // Build update data
    const updateData: Prisma.CaseUpdateInput = {};
    if (title !== undefined) updateData.title = sanitizeString(title);
    if (description !== undefined) updateData.description = description ? sanitizeString(description) : null;
    if (case_type !== undefined) updateData.case_type = case_type;
    if (status !== undefined) updateData.status = status;
    if (attorney_id !== undefined) {
      updateData.attorney = attorney_id
        ? { connect: { id: attorney_id } }
        : { disconnect: true };
    }
    if (opposing_party !== undefined) updateData.opposing_party = opposing_party ? sanitizeString(opposing_party) : null;
    if (court_name !== undefined) updateData.court_name = court_name ? sanitizeString(court_name) : null;
    if (case_number !== undefined) updateData.case_number = case_number ? sanitizeString(case_number) : null;
    if (jurisdiction !== undefined) updateData.jurisdiction = jurisdiction ? sanitizeString(jurisdiction) : null;
    if (estimated_value !== undefined) updateData.estimated_value = estimated_value || null;
    if (retainer_amount !== undefined) updateData.retainer_amount = retainer_amount || null;
    if (notes !== undefined) updateData.notes = notes ? sanitizeString(notes) : null;
    if (tags !== undefined) {
      updateData.tags = tags ? (tags as Prisma.InputJsonValue) : Prisma.JsonNull;
    }
    // contingency_fee is not in the schema — ignore it

    const updatedCase = await db.case.update({
      where: { id },
      data: updateData,
      include: {
        client: { include: { user: { select: { id: true, full_name: true, email: true } } } },
        attorney: { select: { id: true, full_name: true, email: true } },
      },
    });

    // Create timeline entry on status change
    if (status && status !== existingCase.status) {
      await db.caseTimeline.create({
        data: {
          case_id: id,
          event_type: 'status_change',
          event_description: `Case status changed from ${existingCase.status} to ${status}`,
          performed_by: auth.user.userId,
        },
      });
    }

    await createAuditLog({
      user_id: auth.user.userId,
      action: 'UPDATE_CASE',
      resource_type: 'case',
      resource_id: id,
      details: { message: `Case "${existingCase.title}" updated` },
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
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.ARCHIVE_CASE)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const { id } = await params;

    // Verify case exists
    const existingCase = await db.case.findUnique({
      where: { id },
      select: { id: true, title: true },
    });

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
        event_type: 'CASE_ARCHIVED',
        event_description: `Case archived by ${auth.user.email}`,
        performed_by: auth.user.userId,
      },
    });

    await createAuditLog({
      user_id: auth.user.userId,
      action: 'ARCHIVE_CASE',
      resource_type: 'case',
      resource_id: id,
      details: { message: `Case "${existingCase.title}" archived` },
    });

    return apiResponse(archivedCase);
  } catch (error) {
    console.error('Delete case error:', error);
    return apiError('Failed to archive case', 500, 'DELETE_CASE_ERROR');
  }
}
