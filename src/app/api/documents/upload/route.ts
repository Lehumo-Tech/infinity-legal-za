/**
 * POST /api/documents/upload - Multipart file upload
 *
 * Accepts multipart/form-data with:
 *   - file:          the binary file (required)
 *   - title:         document title (optional)
 *   - document_type: one of VALID_DOCUMENT_TYPES (required)
 *   - case_id:       optional case to attach
 *   - description:   optional description
 *
 * Saves the file to /public/uploads/<uuid>-<filename> and creates a Document
 * row in the database with status 'uploaded'.
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';
import { randomUUID } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const VALID_DOCUMENT_TYPES = [
  'id_document', 'contract', 'court_filing', 'correspondence',
  'evidence', 'financial', 'medical', 'police_report', 'affidavit', 'other',
];

// 25 MB upload cap
const MAX_FILE_SIZE = 25 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.UPLOAD_DOCUMENT)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const title = (formData.get('title') as string | null)?.trim() || null;
    const document_type = (formData.get('document_type') as string | null)?.trim();
    const case_id = (formData.get('case_id') as string | null)?.trim() || null;
    const description = (formData.get('description') as string | null)?.trim() || null;

    if (!(file instanceof File)) {
      return apiError('No file provided. Use multipart/form-data with a "file" field.', 400, 'NO_FILE');
    }

    if (!document_type) {
      return apiError('document_type is required', 400, 'MISSING_DOCUMENT_TYPE');
    }

    if (!VALID_DOCUMENT_TYPES.includes(document_type)) {
      return apiError(
        `Invalid document_type. Must be one of: ${VALID_DOCUMENT_TYPES.join(', ')}`,
        400,
        'INVALID_DOCUMENT_TYPE',
      );
    }

    if (file.size === 0) {
      return apiError('Uploaded file is empty', 400, 'EMPTY_FILE');
    }

    if (file.size > MAX_FILE_SIZE) {
      return apiError(
        `File too large. Maximum size is ${Math.floor(MAX_FILE_SIZE / (1024 * 1024))} MB`,
        413,
        'FILE_TOO_LARGE',
      );
    }

    // Validate case exists if provided
    if (case_id) {
      const caseRecord = await db.case.findUnique({ where: { id: case_id } });
      if (!caseRecord) {
        return apiError('Case not found', 404, 'CASE_NOT_FOUND');
      }
    }

    // Persist file to /public/uploads
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    // Sanitize filename — keep extension, drop path traversal / weird chars
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
    const ext = path.extname(safeName) || '';
    const storedName = `${randomUUID()}${ext}`;
    const storedPath = path.join(uploadsDir, storedName);

    const arrayBuffer = await file.arrayBuffer();
    await writeFile(storedPath, Buffer.from(arrayBuffer));

    const publicPath = `/uploads/${storedName}`;

    const document = await db.document.create({
      data: {
        case_id: case_id || null,
        uploaded_by: auth.user.userId,
        title: title || file.name,
        file_name: file.name,
        file_path: publicPath,
        file_size: file.size,
        mime_type: file.type || null,
        document_type,
        description,
        status: 'uploaded',
      },
      include: {
        uploader: { select: { id: true, full_name: true, email: true, role: true } },
        case: { select: { id: true, case_ref: true, title: true } },
      },
    });

    await createAuditLog({
      user_id: auth.user.userId,
      action: 'UPLOAD_DOCUMENT',
      resource_type: 'document',
      resource_id: document.id,
      details: { file_name: file.name, document_type, case_id: case_id || null },
    });

    return apiResponse(document, 201);
  } catch (error) {
    console.error('Document upload error:', error);
    return apiError('Failed to upload document', 500, 'UPLOAD_ERROR');
  }
}
