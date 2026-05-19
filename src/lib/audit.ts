/**
 * Infinity Legal ZA - Audit & Analytics Library
 * Uses Prisma + SQLite for reliable data persistence
 */

import { db } from '@/lib/db';

export async function createAuditLog(params: {
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: string;
  ip_address?: string;
  user_agent?: string;
}) {
  try {
    return await db.auditLog.create({
      data: {
        user_id: params.user_id || null,
        action: params.action,
        resource_type: params.resource_type,
        resource_id: params.resource_id || null,
        details: params.details || null,
        ip_address: params.ip_address || null,
        user_agent: params.user_agent || null,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    return null;
  }
}

export async function trackApiEvent(params: {
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms?: number;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
}) {
  try {
    return await db.apiAnalytic.create({
      data: {
        endpoint: params.endpoint,
        method: params.method,
        status_code: params.status_code,
        response_time_ms: params.response_time_ms || null,
        user_id: params.user_id || null,
        ip_address: params.ip_address || null,
        user_agent: params.user_agent || null,
      },
    });
  } catch (error) {
    console.error('Failed to track API event:', error);
    return null;
  }
}

export async function logError(params: {
  error_type: string;
  message: string;
  stack_trace?: string;
  url?: string;
  user_id?: string;
  metadata?: string;
}) {
  try {
    return await db.errorLog.create({
      data: {
        error_type: params.error_type as any,
        message: params.message,
        stack_trace: params.stack_trace || null,
        url: params.url || null,
        user_id: params.user_id || null,
        metadata: params.metadata || null,
      },
    });
  } catch (error) {
    console.error('Failed to log error:', error);
    return null;
  }
}

export async function logConsent(params: {
  user_id?: string;
  consent_type: string;
  purpose: string;
  granted: boolean;
  ip_address?: string;
  user_agent?: string;
}) {
  try {
    return await db.consentLog.create({
      data: {
        user_id: params.user_id || null,
        consent_type: params.consent_type as any,
        purpose: params.purpose,
        granted: params.granted,
        ip_address: params.ip_address || null,
        user_agent: params.user_agent || null,
      },
    });
  } catch (error) {
    console.error('Failed to log consent:', error);
    return null;
  }
}

// Dashboard analytics helpers
export async function getDashboardStats() {
  const [
    totalCases,
    activeCases,
    totalLeads,
    newLeads,
    totalDocuments,
    pendingTasks,
    totalClients,
    casesByTypeRaw,
    casesByStatusRaw,
    leadsBySourceRaw,
    recentActivity,
  ] = await Promise.all([
    db.case.count(),
    db.case.count({ where: { status: 'active' } }),
    db.lead.count(),
    db.lead.count({ where: { status: 'new' } }),
    db.document.count(),
    db.task.count({ where: { status: 'pending' } }),
    db.user.count({ where: { role: 'client' } }),
    db.case.groupBy({ by: ['case_type'], _count: { case_type: true } }),
    db.case.groupBy({ by: ['status'], _count: { status: true } }),
    db.lead.groupBy({ by: ['source'], _count: { source: true } }),
    db.auditLog.findMany({ take: 10, orderBy: { created_at: 'desc' } }),
  ]);

  // Calculate total revenue from case estimated values
  const revenueResult = await db.case.aggregate({ _sum: { estimated_value: true } });
  const totalRevenue = revenueResult._sum.estimated_value || 0;

  const mapGrouped = (data: any[], key: string) =>
    data.map((item: any) => ({ [key]: item[key], count: item._count[key] }));

  return {
    totalCases,
    activeCases,
    totalLeads,
    newLeads,
    totalDocuments,
    pendingTasks,
    totalClients,
    totalRevenue,
    casesByType: mapGrouped(casesByTypeRaw, 'case_type'),
    casesByStatus: mapGrouped(casesByStatusRaw, 'status'),
    leadsBySource: mapGrouped(leadsBySourceRaw, 'source'),
    recentActivity,
  };
}

// Backup tracking
export async function createBackupRecord(filename: string, backupType: string = 'scheduled') {
  return db.backupRecord.create({
    data: {
      filename,
      backup_type: backupType,
      status: 'in_progress',
    },
  });
}

export async function completeBackupRecord(id: string, sizeBytes: number) {
  return db.backupRecord.update({
    where: { id },
    data: {
      status: 'completed',
      size_bytes: sizeBytes,
      completed_at: new Date(),
    },
  });
}

export async function failBackupRecord(id: string, error: string) {
  return db.backupRecord.update({
    where: { id },
    data: {
      status: 'failed',
      error,
    },
  });
}
