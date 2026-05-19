/**
 * Infinity Legal ZA - Audit & Analytics Library
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
    return await db.auditLog.create({ data: params });
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
    return await db.apiAnalytic.create({ data: params });
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
        stack_trace: params.stack_trace,
        url: params.url,
        user_id: params.user_id,
        metadata: params.metadata,
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
        ...params,
        consent_type: params.consent_type as any,
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
    totalRevenue,
    casesByType,
    casesByStatus,
    leadsBySource,
    recentActivity,
  ] = await Promise.all([
    db.case.count(),
    db.case.count({ where: { status: 'active' } }),
    db.lead.count(),
    db.lead.count({ where: { status: 'new' } }),
    db.document.count(),
    db.task.count({ where: { status: 'pending' } }),
    db.user.count({ where: { role: 'client' } }),
    db.case.aggregate({ where: { estimated_value: { not: null } }, _sum: { estimated_value: true } }),
    db.case.groupBy({ by: ['case_type'], _count: { case_type: true } }),
    db.case.groupBy({ by: ['status'], _count: { status: true } }),
    db.lead.groupBy({ by: ['source'], _count: { source: true } }),
    db.auditLog.findMany({ take: 10, orderBy: { created_at: 'desc' }, include: { user: { select: { full_name: true, email: true } } } }),
  ]);

  return {
    totalCases,
    activeCases,
    totalLeads,
    newLeads,
    totalDocuments,
    pendingTasks,
    totalClients,
    totalRevenue: totalRevenue._sum.estimated_value || 0,
    casesByType: casesByType.map(c => ({ type: c.case_type, count: c._count.case_type })),
    casesByStatus: casesByStatus.map(c => ({ status: c.status, count: c._count.status })),
    leadsBySource: leadsBySource.map(l => ({ source: l.source, count: l._count.source })),
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
      completed_at: new Date(),
      size_bytes: sizeBytes,
    },
  });
}

export async function failBackupRecord(id: string, error: string) {
  return db.backupRecord.update({
    where: { id },
    data: {
      status: 'failed',
      completed_at: new Date(),
      error,
    },
  });
}
