/**
 * GET/PUT/DELETE /api/cases/[id] - Get/Update/Delete a single case via Supabase
 */

import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/api-client';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { sanitizeString } from '@/lib/security';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

// Valid enum values per Supabase schema
const VALID_CASE_TYPES = ['civil', 'criminal', 'family', 'corporate', 'property', 'labour', 'immigration', 'intellectual_property', 'tax', 'personal_injury', 'debt_recovery', 'other'];
const VALID_STATUSES = ['intake', 'review', 'active', 'on_hold', 'closed', 'archived'];

// GET - Get single case by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // SECURITY: Check auth FIRST (defense in depth)
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const db = getAdminClient();
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.VIEW_OWN_CASES)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const { id } = await params;

    // Fetch case with related data — attorney_id FK → attorneys(id) → profiles(id)
    const { data: caseRecord, error: caseError } = await db
      .from('cases')
      .select('*, client:profiles!cases_client_id_fkey(id, full_name, email, phone), attorney:attorneys!cases_attorney_id_fkey(id, profile:profiles(full_name, email, role))')
      .eq('id', id)
      .single();

    if (caseError || !caseRecord) {
      return apiError('Case not found', 404, 'CASE_NOT_FOUND');
    }

    // Non-admin users can only see cases they're assigned to
    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.VIEW_ALL_CASES)) {
      const isAssigned = caseRecord.client_id === auth.user.userId;
      if (!isAssigned) {
        return apiError('Case not found', 404, 'CASE_NOT_FOUND');
      }
    }

    // Fetch related documents — documents uses `status` not `workflow_status`, `file_name` not `title`
    const { data: documents } = await db
      .from('documents')
      .select('id, file_name, document_type, status, version, created_at')
      .eq('case_id', id)
      .order('created_at', { ascending: false });

    // Fetch related tasks
    const { data: tasks } = await db
      .from('tasks')
      .select('id, title, status, priority, due_date')
      .eq('case_id', id)
      .order('created_at', { ascending: false });

    // Fetch timeline — schema uses event_type, event_description, performed_by
    const { data: timeline } = await db
      .from('case_timeline')
      .select('*')
      .eq('case_id', id)
      .order('created_at', { ascending: false })
      .limit(20);

    const result = {
      ...caseRecord,
      lead_attorney: caseRecord.attorney?.profile || null,
      documents: documents || [],
      tasks: tasks || [],
      timeline: timeline || [],
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
    // SECURITY: Check auth FIRST (defense in depth)
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const db = getAdminClient();
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.EDIT_CASE)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const { id } = await params;

    // Verify case exists
    const { data: existingCase, error: fetchError } = await db
      .from('cases')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingCase) {
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

    // Validate attorney_id references attorneys table if provided
    if (attorney_id) {
      const { data: attorneyExists } = await db
        .from('attorneys')
        .select('id')
        .eq('id', attorney_id)
        .single();
      if (!attorneyExists) {
        return apiError('Attorney not found', 404, 'ATTORNEY_NOT_FOUND');
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = sanitizeString(title);
    if (description !== undefined) updateData.description = description ? sanitizeString(description) : null;
    if (case_type !== undefined) updateData.case_type = case_type;
    if (status !== undefined) updateData.status = status;
    if (attorney_id !== undefined) updateData.attorney_id = attorney_id || null;
    if (opposing_party !== undefined) updateData.opposing_party = opposing_party ? sanitizeString(opposing_party) : null;
    if (court_name !== undefined) updateData.court_name = court_name ? sanitizeString(court_name) : null;
    if (case_number !== undefined) updateData.case_number = case_number ? sanitizeString(case_number) : null;
    if (jurisdiction !== undefined) updateData.jurisdiction = jurisdiction ? sanitizeString(jurisdiction) : null;
    if (estimated_value !== undefined) updateData.estimated_value = estimated_value || null;
    if (retainer_amount !== undefined) updateData.retainer_amount = retainer_amount || null;
    if (contingency_fee !== undefined) updateData.contingency_fee = contingency_fee || null;
    if (notes !== undefined) updateData.notes = notes ? sanitizeString(notes) : null;
    if (tags !== undefined) updateData.tags = tags;

    const { data: updatedCase, error: updateError } = await db
      .from('cases')
      .update(updateData)
      .eq('id', id)
      .select('*, client:profiles!cases_client_id_fkey(id, full_name, email), attorney:attorneys!cases_attorney_id_fkey(profile:profiles(full_name, email))')
      .single();

    if (updateError || !updatedCase) {
      console.error('Update case error:', updateError);
      return apiError('Failed to update case', 500, 'UPDATE_CASE_ERROR');
    }

    // Create timeline entry on status change — schema uses event_type, event_description, performed_by
    if (status && status !== existingCase.status) {
      await db.from('case_timeline').insert({
        case_id: id,
        event_type: 'status_change',
        event_description: `Case status changed from ${existingCase.status} to ${status}`,
        performed_by: auth.user.userId,
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
    // SECURITY: Check auth FIRST (defense in depth)
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const db = getAdminClient();
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.ARCHIVE_CASE)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const { id } = await params;

    // Verify case exists
    const { data: existingCase, error: fetchError } = await db
      .from('cases')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingCase) {
      return apiError('Case not found', 404, 'CASE_NOT_FOUND');
    }

    // Soft delete by setting status to 'archived'
    const { data: archivedCase, error: archiveError } = await db
      .from('cases')
      .update({ status: 'archived' })
      .eq('id', id)
      .select()
      .single();

    if (archiveError) {
      console.error('Archive case error:', archiveError);
      return apiError('Failed to archive case', 500, 'DELETE_CASE_ERROR');
    }

    // Create timeline entry — schema uses event_type, event_description, performed_by
    await db.from('case_timeline').insert({
      case_id: id,
      event_type: 'CASE_ARCHIVED',
      event_description: `Case archived by ${auth.user.email}`,
      performed_by: auth.user.userId,
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
