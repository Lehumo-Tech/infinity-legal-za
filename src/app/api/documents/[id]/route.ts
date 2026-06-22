/**
 * GET/PUT/DELETE /api/documents/[id] - Get/Update/Delete a single document via Supabase
 */

import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/api-client';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { sanitizeString } from '@/lib/security';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

// Valid enum values per Supabase schema
const VALID_STATUSES = ['uploading', 'uploaded', 'reviewing', 'approved', 'rejected', 'archived'];
const VALID_DOCUMENT_TYPES = ['id_document', 'contract', 'court_filing', 'correspondence', 'evidence', 'financial', 'medical', 'police_report', 'affidavit', 'other'];

// GET - Get single document by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getAdminClient();
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.VIEW_DOCUMENTS)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const { id } = await params;

    // documents has `status` (not workflow_status), `uploaded_by` (not prepared_by/approved_by/signed_by/supervising_officer)
    // cases has `case_ref` (not matter_number)
    const { data: document, error } = await db
      .from('documents')
      .select('*, case:cases(id, case_ref, title, status), uploader:profiles!documents_uploaded_by_fkey(id, full_name, email, role)')
      .eq('id', id)
      .single();

    if (error || !document) {
      return apiError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
    }

    return apiResponse(document);
  } catch (error) {
    console.error('Get document error:', error);
    return apiError('Failed to load document', 500, 'DOCUMENT_ERROR');
  }
}

// PUT - Update a document
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getAdminClient();
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const { id } = await params;

    // Verify document exists
    const { data: existingDoc, error: fetchError } = await db
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingDoc) {
      return apiError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
    }

    const body = await request.json();
    const {
      description,
      document_type,
      status,
      tags,
      is_confidential,
    } = body;

    // Validate status enum if provided — schema uses `status` (not `workflow_status`)
    if (status && !VALID_STATUSES.includes(status)) {
      return apiError(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 400, 'INVALID_STATUS');
    }

    // Validate document_type if provided
    if (document_type && !VALID_DOCUMENT_TYPES.includes(document_type)) {
      return apiError(`Invalid document_type. Must be one of: ${VALID_DOCUMENT_TYPES.join(', ')}`, 400, 'INVALID_DOCUMENT_TYPE');
    }

    // If status changes to 'approved', require APPROVE_DOCUMENT permission
    if (status === 'approved' && existingDoc.status !== 'approved') {
      if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.APPROVE_DOCUMENT)) {
        return apiError('Insufficient permissions to approve document', 403, 'FORBIDDEN');
      }
    }

    // Build update data — increment version on each update
    const updateData: Record<string, unknown> = {
      version: existingDoc.version + 1,
    };

    if (description !== undefined) updateData.description = description ? sanitizeString(description) : null;
    if (document_type !== undefined) updateData.document_type = document_type;
    if (status !== undefined) updateData.status = status;
    if (tags !== undefined) updateData.tags = tags;
    if (is_confidential !== undefined) updateData.is_confidential = is_confidential;

    const { data: updatedDoc, error: updateError } = await db
      .from('documents')
      .update(updateData)
      .eq('id', id)
      .select('*, case:cases(id, case_ref, title), uploader:profiles!documents_uploaded_by_fkey(id, full_name, email)')
      .single();

    if (updateError || !updatedDoc) {
      console.error('Update document error:', updateError);
      return apiError('Failed to update document', 500, 'UPDATE_DOCUMENT_ERROR');
    }

    await createAuditLog({
      user_id: auth.user.userId,
      action: 'UPDATE_DOCUMENT',
      resource_type: 'document',
      resource_id: id,
      details: { message: `Document "${existingDoc.file_name}" updated (v${updatedDoc.version})` },
    });

    return apiResponse(updatedDoc);
  } catch (error) {
    console.error('Update document error:', error);
    return apiError('Failed to update document', 500, 'UPDATE_DOCUMENT_ERROR');
  }
}

// DELETE - Delete a document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getAdminClient();
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.DELETE_DOCUMENT)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const { id } = await params;

    // Verify document exists
    const { data: existingDoc, error: fetchError } = await db
      .from('documents')
      .select('id, file_name')
      .eq('id', id)
      .single();

    if (fetchError || !existingDoc) {
      return apiError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
    }

    const { error: deleteError } = await db
      .from('documents')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Delete document error:', deleteError);
      return apiError('Failed to delete document', 500, 'DELETE_DOCUMENT_ERROR');
    }

    await createAuditLog({
      user_id: auth.user.userId,
      action: 'DELETE_DOCUMENT',
      resource_type: 'document',
      resource_id: id,
      details: { message: `Document "${existingDoc.file_name}" deleted` },
    });

    return apiResponse({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    return apiError('Failed to delete document', 500, 'DELETE_DOCUMENT_ERROR');
  }
}
