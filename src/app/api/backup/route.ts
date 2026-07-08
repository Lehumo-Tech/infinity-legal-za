/**
 * POST /api/backup - Create database backup record (serverless-compatible)
 * GET /api/backup - List backup records
 *
 * Note: On Vercel/serverless, direct filesystem backup is not possible.
 * Managed database backups are handled by the database provider (e.g. Neon, Supabase).
 * This endpoint tracks backup records as AuditLog entries (action=CREATE_BACKUP / action=LIST_BACKUPS)
 * since the Prisma schema doesn't have a dedicated backup_records table.
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { apiResponse, apiError, requireAuth, createPaginationResult, getPaginationParams } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.RUN_BACKUPS)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const body = await request.json().catch(() => ({}));
    const backupType = body?.type || 'manual';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `infinity-legal-backup-${timestamp}`;
    const backupId = `${filename}-${Math.random().toString(36).slice(2, 8)}`;

    // Audit log the backup request
    await createAuditLog({
      user_id: auth.user.userId,
      action: 'CREATE_BACKUP',
      resource_type: 'backup',
      resource_id: backupId,
      details: { filename, backup_type: backupType, status: 'completed' },
      ip_address: request.headers.get('x-forwarded-for') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
    });

    return apiResponse({
      id: backupId,
      filename,
      backup_type: backupType,
      status: 'completed',
      message: 'Backup record created. Managed database backups are handled by your database provider.',
      created_at: new Date().toISOString(),
    }, 201);
  } catch (error) {
    console.error('Backup error:', error);
    return apiError('Backup failed', 500, 'BACKUP_ERROR');
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.RUN_BACKUPS)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const { page, perPage } = getPaginationParams(request);

    // Fetch audit logs of type CREATE_BACKUP as the "backup records" list
    const [backups, total] = await Promise.all([
      db.auditLog.findMany({
        where: { action: 'CREATE_BACKUP' },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      db.auditLog.count({ where: { action: 'CREATE_BACKUP' } }),
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
