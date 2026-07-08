/**
 * Infinity Legal ZA - Audit & Analytics Library (Prisma/SQLite)
 *
 * Updated from Supabase to Prisma client for database operations.
 * Uses the Prisma schema models: AuditLog, ConsentLog.
 * Note: api_analytics and error_logs tables don't exist in Prisma schema,
 * so trackApiEvent and logError are no-ops.
 */

import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';

// ============================================
// AUDIT LOGGING
// ============================================

export async function createAuditLog(params: {
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}) {
  try {
    await db.auditLog.create({
      data: {
        user_id: params.user_id || null,
        action: params.action,
        resource_type: params.resource_type,
        resource_id: params.resource_id || null,
        details: params.details ? (params.details as Prisma.InputJsonValue) : Prisma.JsonNull,
        ip_address: params.ip_address || null,
        user_agent: params.user_agent || null,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

// ============================================
// API ANALYTICS (no-op - no api_analytics table in schema)
// ============================================

export async function trackApiEvent(_params: {
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms?: number;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
}) {
  // No-op: api_analytics table doesn't exist in Prisma schema
}

// ============================================
// ERROR LOGGING (no-op - no error_logs table in schema)
// ============================================

export async function logError(_params: {
  error_type: string;
  message: string;
  stack_trace?: string;
  request_path?: string;
  user_id?: string;
  metadata?: Record<string, unknown>;
}) {
  // No-op: error_logs table doesn't exist in Prisma schema
  // Errors are logged to console instead
}

// ============================================
// CONSENT LOGGING
// ============================================

export type ConsentType = 'terms_of_service' | 'privacy_policy' | 'popi_act' | 'marketing' | 'data_processing';

export async function logConsent(params: {
  user_id?: string;
  consent_type: ConsentType;
  granted: boolean;
  ip_address?: string;
  user_agent?: string;
  version?: string;
}) {
  try {
    await db.consentLog.create({
      data: {
        user_id: params.user_id || null,
        consent_type: params.consent_type,
        granted: params.granted,
        ip_address: params.ip_address || null,
        user_agent: params.user_agent || null,
        version: params.version || null,
      },
    });
  } catch (error) {
    console.error('Failed to log consent:', error);
  }
}

// ============================================
// DASHBOARD STATS (Prisma queries)
// ============================================

export async function getDashboardStats() {
  try {
    const [
      totalCases,
      activeCases,
      totalIntakeSubmissions,
      newIntakeSubmissions,
      totalDocuments,
      pendingTasks,
      totalClients,
    ] = await Promise.all([
      db.case.count(),
      db.case.count({ where: { status: 'active' } }),
      db.intakeSubmission.count(),
      db.intakeSubmission.count({ where: { status: 'submitted' } }),
      db.document.count(),
      db.task.count({ where: { status: 'pending' } }),
      db.client.count(),
    ]);

    // Cases by type
    const casesByTypeRaw = await db.case.findMany({
      select: { case_type: true },
    });
    const casesByTypeMap: Record<string, number> = {};
    for (const c of casesByTypeRaw) {
      casesByTypeMap[c.case_type] = (casesByTypeMap[c.case_type] || 0) + 1;
    }
    const casesByType = Object.entries(casesByTypeMap).map(([case_type, count]) => ({ case_type, count }));

    // Cases by status
    const casesByStatusRaw = await db.case.findMany({
      select: { status: true },
    });
    const casesByStatusMap: Record<string, number> = {};
    for (const c of casesByStatusRaw) {
      casesByStatusMap[c.status] = (casesByStatusMap[c.status] || 0) + 1;
    }
    const casesByStatus = Object.entries(casesByStatusMap).map(([status, count]) => ({ status, count }));

    // Revenue from cases estimated_value
    const revenueData = await db.case.findMany({
      select: { estimated_value: true },
    });
    const totalRevenue = revenueData.reduce((sum, c) => sum + (c.estimated_value || 0), 0);

    // Recent activity from audit logs
    const recentActivity = await db.auditLog.findMany({
      take: 10,
      orderBy: { created_at: 'desc' },
    });

    return {
      totalCases,
      activeCases,
      totalLeads: totalIntakeSubmissions,
      newLeads: newIntakeSubmissions,
      totalDocuments,
      pendingTasks,
      totalClients,
      totalRevenue,
      casesByType,
      casesByStatus,
      leadsBySource: [] as { source: string; count: number }[],
      recentActivity,
    };
  } catch (error) {
    console.error('Failed to get dashboard stats:', error);
    return {
      totalCases: 0, activeCases: 0, totalLeads: 0, newLeads: 0,
      totalDocuments: 0, pendingTasks: 0, totalClients: 0, totalRevenue: 0,
      casesByType: [], casesByStatus: [], leadsBySource: [], recentActivity: [],
    };
  }
}
