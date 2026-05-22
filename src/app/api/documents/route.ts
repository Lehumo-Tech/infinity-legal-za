/**
 * GET /api/documents - List documents with pagination and filtering via Prisma/SQLite
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { apiResponse, apiError, requireAuth, getPaginationParams, createPaginationResult } from '@/lib/middleware';

// GET - List documents with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.VIEW_DOCUMENTS)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const { page, perPage, skip, take } = getPaginationParams(request);
    const url = new URL(request.url);

    const case_id = url.searchParams.get('case_id');
    const document_type = url.searchParams.get('document_type');
    const workflow_status = url.searchParams.get('workflow_status');
    const prepared_by = url.searchParams.get('prepared_by');
    const search = url.searchParams.get('search');

    // Build where clause
    const where: Record<string, unknown> = {};
    if (case_id) where.case_id = case_id;
    if (document_type) where.document_type = document_type;
    if (workflow_status) where.workflow_status = workflow_status;
    if (prepared_by) where.prepared_by = prepared_by;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { file_name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [documents, total] = await Promise.all([
      db.document.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: 'desc' },
        include: {
          prepared_by_user: {
            select: {
              id: true,
              full_name: true,
              email: true,
              role: true,
            },
          },
          approved_by_user: {
            select: {
              id: true,
              full_name: true,
              email: true,
              role: true,
            },
          },
          signed_by_user: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
          supervisor_user: {
            select: {
              id: true,
              full_name: true,
              email: true,
              role: true,
            },
          },
          case: {
            select: {
              id: true,
              matter_number: true,
              title: true,
              status: true,
            },
          },
        },
      }),
      db.document.count({ where }),
    ]);

    return apiResponse({
      data: documents,
      pagination: createPaginationResult(total, page, perPage),
    });
  } catch (error) {
    console.error('Documents list error:', error);
    return apiError('Failed to load documents', 500, 'DOCUMENTS_ERROR');
  }
}
