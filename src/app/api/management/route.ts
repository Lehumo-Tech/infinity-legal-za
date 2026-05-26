/**
 * GET /api/management - Management Portal aggregated data
 * Access: managing_director, senior_partner, supervising_officer, systems_admin
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';

const ALLOWED_ROLES: RoleKey[] = ['managing_director', 'senior_partner', 'supervising_officer', 'systems_admin'];

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const userRole = auth.user.role as RoleKey;
    if (!ALLOWED_ROLES.includes(userRole)) {
      return apiError('Insufficient role privileges', 403, 'ROLE_FORBIDDEN');
    }

    // Run all queries in parallel
    const [
      totalCases,
      activeCases,
      totalRevenueResult,
      totalClients,
      totalStaff,
      attorneysWithCases,
      staffByDepartment,
      riskAlerts,
      recentAuditLogs,
    ] = await Promise.all([
      // Total cases
      db.case.count(),
      // Active cases
      db.case.count({
        where: { status: { notIn: ['closed', 'archived'] } },
      }),
      // Total revenue
      db.case.aggregate({
        _sum: { estimated_value: true },
      }),
      // Total clients
      db.user.count({
        where: { role: 'client' },
      }),
      // Total staff
      db.user.count({
        where: { role: { notIn: ['client', 'guest'] } },
      }),
      // Cases grouped by lead_attorney's department
      db.user.findMany({
        where: {
          role: { notIn: ['client', 'guest'] },
          attorney_cases: { some: {} },
        },
        select: {
          id: true,
          full_name: true,
          department: true,
          _count: {
            select: { attorney_cases: true },
          },
        },
        orderBy: { department: 'asc' },
      }),
      // Staff grouped by department
      db.user.groupBy({
        by: ['department'],
        where: { role: { notIn: ['client', 'guest'] } },
        _count: { department: true },
      }),
      // Risk alerts: high risk OR critical urgency, not closed/archived
      db.case.findMany({
        where: {
          OR: [
            { is_high_risk: true },
            { urgency: 'critical' },
          ],
          status: { notIn: ['closed', 'archived'] },
        },
        select: {
          id: true,
          matter_number: true,
          title: true,
          case_type: true,
          urgency: true,
          is_high_risk: true,
          status: true,
          lead_attorney: {
            select: { id: true, full_name: true, department: true },
          },
        },
        orderBy: { updated_at: 'desc' },
      }),
      // Recent audit logs (last 10)
      db.auditLog.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              full_name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
    ]);

    const totalRevenue = totalRevenueResult._sum.estimated_value || 0;

    // Build department performance from attorneys with cases
    const deptPerformanceMap: Record<string, { department: string; attorneys: typeof attorneysWithCases; total_cases: number }> = {};
    for (const attorney of attorneysWithCases) {
      const dept = attorney.department || 'unassigned';
      if (!deptPerformanceMap[dept]) {
        deptPerformanceMap[dept] = { department: dept, attorneys: [], total_cases: 0 };
      }
      deptPerformanceMap[dept].attorneys.push(attorney);
      deptPerformanceMap[dept].total_cases += attorney._count.attorney_cases;
    }

    const departmentPerformance = Object.values(deptPerformanceMap).map((dept) => ({
      department: dept.department,
      total_cases: dept.total_cases,
      attorney_count: dept.attorneys.length,
      attorneys: dept.attorneys.map((a) => ({
        id: a.id,
        full_name: a.full_name,
        case_count: a._count.attorney_cases,
      })),
    }));

    // Staff by department formatted
    const staffByDeptFormatted = staffByDepartment.map((item) => ({
      department: item.department || 'unassigned',
      count: item._count.department,
    }));

    // Risk alerts formatted
    const riskAlertsFormatted = riskAlerts.map((c) => ({
      id: c.id,
      matter_number: c.matter_number,
      title: c.title,
      case_type: c.case_type,
      urgency: c.urgency,
      is_high_risk: c.is_high_risk,
      status: c.status,
      lead_attorney: c.lead_attorney,
    }));

    // Recent audit logs formatted
    const recentAuditLogsFormatted = recentAuditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      resource_type: log.resource_type,
      resource_id: log.resource_id,
      details: log.details,
      ip_address: log.ip_address,
      created_at: log.created_at,
      user: log.user,
    }));

    // Mock: Pending approvals
    const pendingApprovals = [
      { id: 'appr_001', type: 'leave' as const, requested_by: 'Thabo Molefe', department: 'litigation', date: '2026-03-08', priority: 'high' as const, status: 'pending' },
      { id: 'appr_002', type: 'expense' as const, requested_by: 'Nomsa Dlamini', department: 'corporate', date: '2026-03-07', priority: 'medium' as const, status: 'pending' },
      { id: 'appr_003', type: 'case_assignment' as const, requested_by: 'Pieter van Wyk', department: 'conveyancing', date: '2026-03-06', priority: 'urgent' as const, status: 'pending' },
      { id: 'appr_004', type: 'leave' as const, requested_by: 'Ayesha Khan', department: 'family_law', date: '2026-03-05', priority: 'low' as const, status: 'pending' },
      { id: 'appr_005', type: 'expense' as const, requested_by: 'David Nkosi', department: 'criminal_law', date: '2026-03-04', priority: 'medium' as const, status: 'pending' },
      { id: 'appr_006', type: 'case_assignment' as const, requested_by: 'Lerato Sithole', department: 'estate_planning', date: '2026-03-03', priority: 'high' as const, status: 'pending' },
    ];

    // Mock: Key metrics
    const avgCaseValue = totalCases > 0 ? Math.round((totalRevenue / totalCases) * 100) / 100 : 0;
    const keyMetrics = {
      avg_case_value: avgCaseValue,
      avg_days_to_close: 42,
      client_satisfaction: 87,
      staff_utilization: 78,
      revenue_growth: 12.5,
      case_win_rate: 73,
    };

    // Mock: Financial summary (6 months)
    const financialSummary = [
      { month: '2025-10', revenue: 425000, expenses: 298000, profit_margin: 29.9 },
      { month: '2025-11', revenue: 510000, expenses: 315000, profit_margin: 38.2 },
      { month: '2025-12', revenue: 395000, expenses: 287000, profit_margin: 27.3 },
      { month: '2026-01', revenue: 478000, expenses: 302000, profit_margin: 36.8 },
      { month: '2026-02', revenue: 442000, expenses: 295000, profit_margin: 33.3 },
      { month: '2026-03', revenue: 287000, expenses: 191000, profit_margin: 33.4 },
    ];

    return apiResponse({
      firm_overview: {
        total_cases: totalCases,
        active_cases: activeCases,
        total_revenue: totalRevenue,
        total_clients: totalClients,
        total_staff: totalStaff,
      },
      department_performance: departmentPerformance,
      pending_approvals: pendingApprovals,
      key_metrics: keyMetrics,
      risk_alerts: riskAlertsFormatted,
      recent_audit_logs: recentAuditLogsFormatted,
      financial_summary: financialSummary,
    });
  } catch (error) {
    console.error('Management portal error:', error);
    return apiError('Failed to load management portal data', 500, 'MANAGEMENT_PORTAL_ERROR');
  }
}
