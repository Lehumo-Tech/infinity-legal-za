/**
 * GET /api/management - Management Portal aggregated data
 * Access: managing_director, systems_admin only
 *
 * Uses Prisma to aggregate case, client, staff, attorney, and audit-log data.
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';
import { type RoleKey } from '@/lib/auth';

const ALLOWED_ROLES: RoleKey[] = ['managing_director', 'systems_admin'];

// Non-client roles
const STAFF_ROLES = ['attorney', 'paralegal', 'admin', 'managing_director', 'systems_admin'];

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const userRole = auth.user.role as RoleKey;
    if (!ALLOWED_ROLES.includes(userRole)) {
      return apiError('Insufficient role privileges', 403, 'ROLE_FORBIDDEN');
    }

    // Run all queries in parallel
    const [
      totalCases,
      activeCases,
      totalClients,
      totalStaff,
      attorneys,
      recentAuditLogs,
      casesRevenue,
      caseAttorneyIds,
    ] = await Promise.all([
      db.case.count(),
      db.case.count({
        where: { status: { notIn: ['closed', 'archived'] } },
      }),
      db.user.count({ where: { role: 'client' } }),
      db.user.count({ where: { role: { in: STAFF_ROLES } } }),
      db.user.findMany({
        where: { role: 'attorney', is_active: true },
        select: {
          id: true,
          full_name: true,
          email: true,
          practice_number: true,
          specialization: true,
        },
      }),
      db.auditLog.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        include: { user: { select: { id: true, full_name: true, email: true, role: true } } },
      }),
      db.case.findMany({
        where: { estimated_value: { not: null } },
        select: { estimated_value: true },
      }),
      db.case.findMany({
        where: { attorney_id: { not: null } },
        select: { attorney_id: true },
      }),
    ]);

    // Calculate total revenue
    const totalRevenue = casesRevenue.reduce(
      (sum, c) => sum + (c.estimated_value || 0),
      0
    );

    // Get case counts per attorney
    const caseCountsMap: Record<string, number> = {};
    for (const c of caseAttorneyIds) {
      const attId = c.attorney_id;
      if (attId) {
        caseCountsMap[attId] = (caseCountsMap[attId] || 0) + 1;
      }
    }

    // Attorney performance
    const attorneyPerformance = attorneys
      .filter((a) => (caseCountsMap[a.id] || 0) > 0)
      .map((a) => {
        const spec = a.specialization;
        let specialization: string[] = [];
        if (Array.isArray(spec)) {
          specialization = spec as string[];
        } else if (typeof spec === 'string') {
          try {
            const parsed = JSON.parse(spec);
            specialization = Array.isArray(parsed) ? parsed : [spec];
          } catch {
            specialization = [spec];
          }
        }
        return {
          id: a.id,
          full_name: a.full_name || 'Unknown',
          practice_number: a.practice_number,
          specialization,
          case_count: caseCountsMap[a.id] || 0,
        };
      });

    // Format recent audit logs (user already included)
    const recentAuditLogsFormatted = recentAuditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      resource_type: log.resource_type,
      resource_id: log.resource_id,
      details: log.details,
      ip_address: log.ip_address,
      created_at: log.created_at,
      user: log.user
        ? { id: log.user.id, full_name: log.user.full_name, email: log.user.email, role: log.user.role }
        : null,
    }));

    // Pending approvals — empty until approval system is built
    const pendingApprovals: unknown[] = [];

    // Key metrics
    const avgCaseValue = totalCases > 0 ? Math.round((totalRevenue / totalCases) * 100) / 100 : 0;
    const keyMetrics = {
      avg_case_value: avgCaseValue,
      avg_days_to_close: 0,
      client_satisfaction: 0,
      staff_utilization: 0,
      revenue_growth: 0,
      case_win_rate: 0,
    };

    // Financial summary — empty until billing system is built
    const financialSummary: unknown[] = [];

    return apiResponse({
      firm_overview: {
        total_cases: totalCases,
        active_cases: activeCases,
        total_revenue: totalRevenue,
        total_clients: totalClients,
        total_staff: totalStaff,
      },
      attorney_performance: attorneyPerformance,
      pending_approvals: pendingApprovals,
      key_metrics: keyMetrics,
      recent_audit_logs: recentAuditLogsFormatted,
      financial_summary: financialSummary,
    });
  } catch (error) {
    console.error('Management portal error:', error);
    return apiError('Failed to load management portal data', 500, 'MANAGEMENT_PORTAL_ERROR');
  }
}
