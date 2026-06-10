/**
 * GET /api/documents - List documents with pagination and filtering via Supabase
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { apiResponse, apiError, requireAuth, getPaginationParams, createPaginationResult } from '@/lib/middleware';

// GET - List documents with pagination and filters
export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.VIEW_DOCUMENTS)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const { page, perPage, from, to } = getPaginationParams(request);
    const url = new URL(request.url);

    const case_id = url.searchParams.get('case_id');
    const document_type = url.searchParams.get('document_type');
    const workflow_status = url.searchParams.get('workflow_status');
    const prepared_by = url.searchParams.get('prepared_by');
    const search = url.searchParams.get('search');

    // Build query
    let query = db
      .from('documents')
      .select('*, prepared_by_user:profiles!documents_prepared_by_fkey(user_id, full_name, email, role), approved_by_user:profiles!documents_approved_by_fkey(user_id, full_name, email, role), signed_by_user:profiles!documents_signed_by_fkey(user_id, full_name, email), supervisor_user:profiles!documents_supervising_officer_fkey(user_id, full_name, email, role), case:cases(id, matter_number, title, status)', { count: 'exact' });

    if (case_id) query = query.eq('case_id', case_id);
    if (document_type) query = query.eq('document_type', document_type);
    if (workflow_status) query = query.eq('workflow_status', workflow_status);
    if (prepared_by) query = query.eq('prepared_by', prepared_by);
    if (search) query = query.or(`title.ilike.%${search}%,file_name.ilike.%${search}%,description.ilike.%${search}%`);

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
