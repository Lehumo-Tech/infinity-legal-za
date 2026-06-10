/**
 * GET/PUT/DELETE /api/documents/[id] - Get/Update/Delete a single document via Supabase
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { sanitizeString } from '@/lib/security';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

// Valid workflow_status enum values
const VALID_WORKFLOW_STATUSES = ['draft', 'review', 'approved', 'signed', 'filed', 'archived'];

// GET - Get single document by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.VIEW_DOCUMENTS)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const { id } = await params;

    const { data: document, error } = await db
      .from('documents')
      .select('*, case:cases(id, matter_number, title, status), prepared_by_user:profiles!documents_prepared_by_fkey(user_id, full_name, email, role), approved_by_user:profiles!documents_approved_by_fkey(user_id, full_name, email, role), signed_by_user:profiles!documents_signed_by_fkey(user_id, full_name, email), supervisor_user:profiles!documents_supervising_officer_fkey(user_id, full_name, email, role)')
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

    // Check if document is locked
    if (existingDoc.is_locked && existingDoc.locked_by !== auth.user.userId) {
      return apiError('Document is locked and cannot be edited', 423, 'DOCUMENT_LOCKED');
    }

    const body = await request.json();
    const {
      title,
      workflow_status,
      approved_by,
      signed_by,
      supervising_officer,
      is_locked,
    } = body;

    // Validate workflow_status enum if provided
    if (workflow_status && !VALID_WORKFLOW_STATUSES.includes(workflow_status)) {
      return apiError(`Invalid workflow_status. Must be one of: ${VALID_WORKFLOW_STATUSES.join(', ')}`, 400, 'INVALID_WORKFLOW_STATUS');
    }

    // If workflow_status changes to 'approved', require APPROVE_DOCUMENT permission
    if (workflow_status === 'approved' && existingDoc.workflow_status !== 'approved') {
      if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.APPROVE_DOCUMENT)) {
        return apiError('Insufficient permissions to approve document', 403, 'FORBIDDEN');
      }
    }

    // If workflow_status changes to 'signed', require SIGN_DOCUMENT permission
    if (workflow_status === 'signed' && existingDoc.workflow_status !== 'signed') {
      if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.SIGN_DOCUMENT)) {
        return apiError('Insufficient permissions to sign document', 403, 'FORBIDDEN');
      }
    }

    // Build update data — increment version on each update
    const updateData: Record<string, unknown> = {
      version: existingDoc.version + 1,
    };

    if (title !== undefined) updateData.title = sanitizeString(title);
    if (workflow_status !== undefined) updateData.workflow_status = workflow_status;
    if (approved_by !== undefined) updateData.approved_by = approved_by || null;
    if (signed_by !== undefined) updateData.signed_by = signed_by || null;
    if (supervising_officer !== undefined) updateData.supervising_officer = supervising_officer || null;
    if (is_locked !== undefined) updateData.is_locked = is_locked;

    // Auto-set approved_by when workflow_status changes to 'approved'
    if (workflow_status === 'approved' && existingDoc.workflow_status !== 'approved') {
      updateData.approved_by = auth.user.userId;
    }

    // Auto-set signed_by when workflow_status changes to 'signed'
    if (workflow_status === 'signed' && existingDoc.workflow_status !== 'signed') {
      updateData.signed_by = auth.user.userId;
    }

    const { data: updatedDoc, error: updateError } = await db
      .from('documents')
      .update(updateData)
      .eq('id', id)
      .select('*, case:cases(id, matter_number, title), prepared_by_user:profiles!documents_prepared_by_fkey(user_id, full_name, email), approved_by_user:profiles!documents_approved_by_fkey(user_id, full_name, email), signed_by_user:profiles!documents_signed_by_fkey(user_id, full_name, email)')
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
      details: `Document "${existingDoc.title}" updated (v${updatedDoc.version})`,
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
      .select('id, title')
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
      details: `Document "${existingDoc.title}" deleted`,
    });

    return apiResponse({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    return apiError('Failed to delete document', 500, 'DELETE_DOCUMENT_ERROR');
  }
}
