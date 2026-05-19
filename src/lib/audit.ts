/**
 * Infinity Legal ZA - Audit & Analytics Library
 * Uses PocketBase instead of Prisma
 */

import { createRecord, listRecords, getFullList, getRecordsGroupedBy, countRecords, sumField } from '@/lib/pb-client';

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
    return await createRecord('audit_logs', {
      user_id: params.user_id || null,
      action: params.action,
      resource_type: params.resource_type,
      resource_id: params.resource_id || null,
      details: params.details ? JSON.stringify({ message: params.details }) : null,
      ip_address: params.ip_address || null,
      user_agent: params.user_agent || null,
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
    return await createRecord('api_analytics', {
      endpoint: params.endpoint,
      method: params.method,
      status_code: params.status_code,
      response_time_ms: params.response_time_ms || null,
      user_id: params.user_id || null,
      ip_address: params.ip_address || null,
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
    return await createRecord('error_logs', {
      error_type: params.error_type,
      message: params.message,
      stack_trace: params.stack_trace || null,
      url: params.url || null,
      resolved: false,
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
    return await createRecord('consent_logs', {
      user_id: params.user_id || null,
      consent_type: params.consent_type,
      purpose: params.purpose,
      granted: params.granted,
      ip_address: params.ip_address || null,
      user_agent: params.user_agent || null,
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
    countRecords('cases'),
    countRecords('cases', `status='active'`),
    countRecords('leads'),
    countRecords('leads', `status='new'`),
    countRecords('documents'),
    countRecords('tasks', `status='pending'`),
    countRecords('users', `role='client'`),
    sumField('cases', 'estimated_value'),
    getRecordsGroupedBy('cases', 'case_type'),
    getRecordsGroupedBy('cases', 'status'),
    getRecordsGroupedBy('leads', 'source'),
    listRecords('audit_logs', { perPage: 10, sort: '-created' }),
  ]);

  return {
    totalCases,
    activeCases,
    totalLeads,
    newLeads,
    totalDocuments,
    pendingTasks,
    totalClients,
    totalRevenue,
    casesByType: Object.entries(casesByType).map(([type, count]) => ({ type, count })),
    casesByStatus: Object.entries(casesByStatus).map(([status, count]) => ({ status, count })),
    leadsBySource: Object.entries(leadsBySource).map(([source, count]) => ({ source, count })),
    recentActivity: recentActivity.items,
  };
}

// Backup tracking
export async function createBackupRecord(filename: string, backupType: string = 'scheduled') {
  return createRecord('backup_records', {
    filename,
    backup_type: backupType,
    status: 'in_progress',
  });
}

export async function completeBackupRecord(id: string, sizeBytes: number) {
  const { updateRecord } = await import('@/lib/pb-client');
  return updateRecord('backup_records', id, {
    status: 'completed',
    size_bytes: sizeBytes,
  });
}

export async function failBackupRecord(id: string, error: string) {
  const { updateRecord } = await import('@/lib/pb-client');
  return updateRecord('backup_records', id, {
    status: 'failed',
    error,
  });
}
