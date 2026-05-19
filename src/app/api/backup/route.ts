/**
 * POST /api/backup - Create PocketBase backup
 * GET /api/backup - List backup records
 */

import { NextRequest } from 'next/server';
import { listRecords, createRecord, updateRecord } from '@/lib/pb-client';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';
import { getAdminToken } from '@/lib/pb-client';
import http from 'http';

const PB_HOST = '0.0.0.0';
const PB_PORT = 8090;

function pbBackupRequest(token: string): Promise<{ status: number; data: Buffer }> {
  return new Promise((resolve, reject) => {
    const options: http.RequestOptions = {
      hostname: PB_HOST,
      port: PB_PORT,
      path: '/api/backups',
      method: 'POST',
      headers: {
        Authorization: token,
      },
      // @ts-expect-error
      family: 4,
    };
    
    const req = http.request(options, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => {
        resolve({ status: res.statusCode || 500, data: Buffer.concat(chunks) });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

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

    // Create backup record
    const record = await createRecord('backup_records', {
      filename,
      backup_type: backupType,
      status: 'in_progress',
    });

    try {
      // Trigger PocketBase backup
      const adminToken = await getAdminToken();
      const backupRes = await pbBackupRequest(adminToken);
      
      await updateRecord('backup_records', (record.data as any).id, {
        status: 'completed',
        size_bytes: backupRes.data.length,
      });

      return apiResponse({
        filename,
        size_bytes: backupRes.data.length,
        backup_type: backupType,
        created_at: new Date().toISOString(),
      }, 201);
    } catch (backupError: any) {
      await updateRecord('backup_records', (record.data as any).id, {
        status: 'failed',
        error: backupError.message,
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

    const res = await listRecords('backup_records', {
      page: 1,
      perPage: 20,
      sort: '-created',
    });

    const pbData = res.data as any;
    return apiResponse(pbData?.items || []);
  } catch (error) {
    console.error('Backup list error:', error);
    return apiError('Failed to list backups', 500, 'BACKUP_LIST_ERROR');
  }
}
