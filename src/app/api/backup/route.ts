/**
 * POST /api/backup - Create database backup record (serverless-compatible)
 * GET /api/backup - List backup records
 *
 * Note: On Vercel/serverless, direct filesystem backup is not possible.
 * Managed database backups are handled by the database provider (e.g. Neon, Supabase).
 * This endpoint tracks backup records for audit purposes.
 */

import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/api-client';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { apiResponse, apiError, requireAuth, createPaginationResult, getPaginationParams } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const db = getAdminClient();
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.RUN_BACKUPS)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const body = await request.json();
    const backupType = body.type || 'manual';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `infinity-legal-backup-${timestamp}`;

    // Create backup record — actual backup is managed by the database provider
    const { data: record, error: insertError } = await db
      .from('backup_records')
      .insert({
        filename,
        backup_type: backupType,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Backup record insert error:', insertError);
      return apiError('Backup failed', 500, 'BACKUP_ERROR');
    }

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
    const db = getAdminClient();
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.RUN_BACKUPS)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const { page, perPage, from, to } = getPaginationParams(request);

    const { data: backups, count: total, error: queryError } = await db
      .from('backup_records')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (queryError) {
      console.error('Backup list error:', queryError);
      return apiError('Failed to list backups', 500, 'BACKUP_LIST_ERROR');
    }

    return apiResponse({
      data: backups || [],
      pagination: createPaginationResult(total || 0, page, perPage),
    });
  } catch (error) {
    console.error('Backup list error:', error);
    return apiError('Failed to list backups', 500, 'BACKUP_LIST_ERROR');
  }
}
