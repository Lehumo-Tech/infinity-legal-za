/**
 * POST /api/backup - Create database backup
 * GET /api/backup - List backup records
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { apiResponse, apiError, requireAuth, createPaginationResult, getPaginationParams } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

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
    const filename = `infinity-legal-backup-${timestamp}.db`;

    // Create backup record
    const record = await db.backupRecord.create({
      data: {
        filename,
        backup_type: backupType,
        status: 'in_progress',
      },
    });

    try {
      // Copy the SQLite database file
      const dbPath = path.join(process.cwd(), 'db', 'custom.db');
      const backupDir = path.join(process.cwd(), 'backups');

      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const backupPath = path.join(backupDir, filename);
      fs.copyFileSync(dbPath, backupPath);

      const stats = fs.statSync(backupPath);

      await db.backupRecord.update({
        where: { id: record.id },
        data: {
          status: 'completed',
          size_bytes: stats.size,
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
        filename,
        size_bytes: stats.size,
        backup_type: backupType,
        created_at: new Date().toISOString(),
      }, 201);
    } catch (backupError: any) {
      await db.backupRecord.update({
        where: { id: record.id },
        data: {
          status: 'failed',
          error: backupError.message,
        },
      });
      throw backupError;
    }
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
