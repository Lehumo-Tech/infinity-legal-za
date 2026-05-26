/**
 * POST /api/backup - Create database backup record (serverless-compatible)
 * GET /api/backup - List backup records
 *
 * Note: On Vercel/serverless, direct filesystem backup is not possible.
 * Managed database backups are handled by the database provider (e.g. Neon, Supabase).
 * This endpoint tracks backup records for audit purposes.
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { apiResponse, apiError, requireAuth, createPaginationResult, getPaginationParams } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.RUN_BACKUPS)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const body = await request.json();
    const backupType = body.type || 'manual';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `infinity-legal-backup-${timestamp}`;

    // Create backup record — actual backup is managed by the database provider
    const record = await db.backupRecord.create({
      data: {
        filename,
        backup_type: backupType,
        status: 'completed',
        completed_at: new Date(),
      },
    });

    await createAuditLog({
      user_id: auth.user.userId,
      action: 'CREATE_BACKUP',
      resource_type: 'backup',
      resource_id: record.id,
    });

    return apiResponse({
      id: record.id,
      filename,
      backup_type: backupType,
      status: 'completed',
      message: 'Backup record created. Managed database backups are handled by your database provider (Neon/Supabase).',
      created_at: new Date().toISOString(),
    }, 201);
  } catch (error) {
    console.error('Backup error:', error);
    return apiError('Backup failed', 500, 'BACKUP_ERROR');
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.RUN_BACKUPS)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const { page, perPage, skip, take } = getPaginationParams(request);

    const [backups, total] = await Promise.all([
      db.backupRecord.findMany({
        skip,
        take,
        orderBy: { created_at: 'desc' },
      }),
      db.backupRecord.count(),
    ]);

    return apiResponse({
      data: backups,
      pagination: createPaginationResult(total, page, perPage),
    });
  } catch (error) {
    console.error('Backup list error:', error);
    return apiError('Failed to list backups', 500, 'BACKUP_LIST_ERROR');
  }
}
