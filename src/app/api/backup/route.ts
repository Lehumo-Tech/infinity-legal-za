/**
 * POST /api/backup - Create database backup
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';
import { createBackupRecord, completeBackupRecord, failBackupRecord } from '@/lib/audit';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

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
    const backupPath = path.join(process.cwd(), 'db', 'backups', filename);

    // Create backup record
    const record = await createBackupRecord(filename, backupType);

    try {
      // Create backup directory
      execSync(`mkdir -p ${path.join(process.cwd(), 'db', 'backups')}`);
      
      // Copy SQLite database
      const dbPath = path.join(process.cwd(), 'db', 'custom.db');
      execSync(`cp ${dbPath} ${backupPath}`);
      
      // Get file size
      const stats = fs.statSync(backupPath);
      
      await completeBackupRecord(record.id, stats.size);

      return apiResponse({
        filename,
        size_bytes: stats.size,
        backup_type: backupType,
        created_at: new Date().toISOString(),
      }, 201);
    } catch (backupError: any) {
      await failBackupRecord(record.id, backupError.message);
      throw backupError;
    }
  } catch (error) {
    console.error('Backup error:', error);
    return apiError('Backup failed', 500, 'BACKUP_ERROR');
  }
}

// GET - List backup records
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.RUN_BACKUPS)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const backups = await db.backupRecord.findMany({
      take: 20,
      orderBy: { created_at: 'desc' },
    });

    return apiResponse(backups);
  } catch (error) {
    console.error('Backup list error:', error);
    return apiError('Failed to list backups', 500, 'BACKUP_LIST_ERROR');
  }
}
