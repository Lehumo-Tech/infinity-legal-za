/**
 * GET /api/documents - List documents with pagination and filtering via Supabase
 */

import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/api-client';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { sanitizeSearchQuery } from '@/lib/security';
import { apiResponse, apiError, requireAuth, getPaginationParams, createPaginationResult } from '@/lib/middleware';

// Valid enum values per Supabase schema
const VALID_DOCUMENT_TYPES = ['id_document', 'contract', 'court_filing', 'correspondence', 'evidence', 'financial', 'medical', 'police_report', 'affidavit', 'other'];
const VALID_STATUSES = ['uploading', 'uploaded', 'reviewing', 'approved', 'rejected', 'archived'];

// GET - List documents with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const db = getAdminClient();
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.VIEW_DOCUMENTS)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const { page, perPage, from, to } = getPaginationParams(request);
    const url = new URL(request.url);

    const case_id = url.searchParams.get('case_id');
    const document_type = url.searchParams.get('document_type');
    const status = url.searchParams.get('status');
    const uploaded_by = url.searchParams.get('uploaded_by');
    const search = url.searchParams.get('search');

    // Build query — documents has `status` (not workflow_status), `uploaded_by` (not prepared_by), cases has `case_ref` (not matter_number)
    let query = db
      .from('documents')
      .select('*, uploader:profiles!documents_uploaded_by_fkey(id, full_name, email, role), case:cases(id, case_ref, title, status)', { count: 'exact' });

    if (case_id) query = query.eq('case_id', case_id);
    if (document_type) query = query.eq('document_type', document_type);
    if (status) query = query.eq('status', status);
    if (uploaded_by) query = query.eq('uploaded_by', uploaded_by);
    if (search) query = query.or(`file_name.ilike.%${sanitizeSearchQuery(search)}%,description.ilike.%${sanitizeSearchQuery(search)}%`);

    const { data: documents, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Documents list query error:', error);
      return apiError('Failed to load documents', 500, 'DOCUMENTS_ERROR');
    }

    return apiResponse({
      data: documents || [],
      pagination: createPaginationResult(count || 0, page, perPage),
    });
  } catch (error) {
    console.error('Documents list error:', error);
    return apiError('Failed to load documents', 500, 'DOCUMENTS_ERROR');
  }
}
