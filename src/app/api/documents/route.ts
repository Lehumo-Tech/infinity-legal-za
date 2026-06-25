/**
 * GET /api/documents - List documents with pagination and filtering via Prisma
 * POST /api/documents - Create a new document
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { apiResponse, apiError, requireAuth, getPaginationParams, createPaginationResult } from '@/lib/middleware';

// Valid enum values per schema
const VALID_DOCUMENT_TYPES = ['id_document', 'contract', 'court_filing', 'correspondence', 'evidence', 'financial', 'medical', 'police_report', 'affidavit', 'other'];
const VALID_STATUSES = ['uploading', 'uploaded', 'reviewing', 'approved', 'rejected', 'archived'];

// GET - List documents with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.VIEW_DOCUMENTS)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const { page, perPage } = getPaginationParams(request);
    const url = new URL(request.url);

    const case_id = url.searchParams.get('case_id');
    const document_type = url.searchParams.get('document_type');
    const status = url.searchParams.get('status');
    const uploaded_by = url.searchParams.get('uploaded_by');
    const search = url.searchParams.get('search');

    // Build where clause
    const where: Record<string, unknown> = {};

    if (case_id) where.case_id = case_id;
    if (document_type) where.document_type = document_type;
    if (status) where.status = status;
    if (uploaded_by) where.uploaded_by = uploaded_by;
    if (search) {
      where.OR = [
        { file_name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Role-based filtering
    const role = auth.user.role as RoleKey;
    if (!hasPermission(role, PERMISSIONS.VIEW_ALL_CASES)) {
      // Clients can only see documents for their cases
      const clientProfile = await db.client.findUnique({
        where: { user_id: auth.user.userId },
      });
      if (clientProfile) {
        where.case = { client_id: clientProfile.id };
      } else {
        // Attorney: see documents for cases assigned to them
        where.case = { attorney_id: auth.user.userId };
      }
    }

    const [documents, total] = await Promise.all([
      db.document.findMany({
        where,
        include: {
          uploader: { select: { id: true, full_name: true, email: true, role: true } },
          case: { select: { id: true, case_ref: true, title: true, status: true } },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      db.document.count({ where }),
    ]);

    return apiResponse({
      data: documents || [],
      pagination: createPaginationResult(total, page, perPage),
    });
  } catch (error) {
    console.error('Documents list error:', error);
    return apiError('Failed to load documents', 500, 'DOCUMENTS_ERROR');
  }
}

// POST - Create a new document
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.UPLOAD_DOCUMENT)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const body = await request.json();
    const {
      case_id,
      title,
      file_name,
      file_path,
      file_size,
      mime_type,
      document_type,
      description,
      is_confidential,
    } = body;

    // Validate required fields
    if (!file_name || !file_path || !document_type) {
      return apiError(
        'file_name, file_path, and document_type are required',
        400,
        'MISSING_FIELDS'
      );
    }

    // Validate document_type enum
    if (!VALID_DOCUMENT_TYPES.includes(document_type)) {
      return apiError(
        `Invalid document_type. Must be one of: ${VALID_DOCUMENT_TYPES.join(', ')}`,
        400,
        'INVALID_DOCUMENT_TYPE'
      );
    }

    // Validate case exists if provided
    if (case_id) {
      const caseRecord = await db.case.findUnique({ where: { id: case_id } });
      if (!caseRecord) {
        return apiError('Case not found', 404, 'CASE_NOT_FOUND');
      }
    }

    const document = await db.document.create({
      data: {
        case_id: case_id || null,
        uploaded_by: auth.user.userId,
        title: title || null,
        file_name,
        file_path,
        file_size: file_size || null,
        mime_type: mime_type || null,
        document_type,
        description: description || null,
        is_confidential: is_confidential || false,
        status: 'uploaded',
      },
      include: {
        uploader: { select: { id: true, full_name: true, email: true, role: true } },
        case: { select: { id: true, case_ref: true, title: true } },
      },
    });

    return apiResponse(document, 201);
  } catch (error) {
    console.error('Create document error:', error);
    return apiError('Failed to create document', 500, 'CREATE_DOCUMENT_ERROR');
  }
}
