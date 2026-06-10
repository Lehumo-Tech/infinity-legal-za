/**
 * GET /api/management - Management Portal aggregated data
 * Access: managing_director, senior_partner, supervising_officer, systems_admin
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';
import { type RoleKey } from '@/lib/auth';

const ALLOWED_ROLES: RoleKey[] = ['managing_director', 'senior_partner', 'supervising_officer', 'systems_admin'];

export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const userRole = auth.user.role as RoleKey;
    if (!ALLOWED_ROLES.includes(userRole)) {
      return apiError('Insufficient role privileges', 403, 'ROLE_FORBIDDEN');
    }

    const nonClientRoles = [
      'managing_director', 'senior_partner', 'associate', 'paralegal',
      'legal_officer', 'supervising_officer', 'senior_consultant',
      'consultant', 'candidate_attorney', 'hr_manager', 'finance_manager',
      'office_administrator', 'systems_admin', 'receptionist',
    ];

    // Run all queries in parallel
    const [
      totalCasesResult,
      activeCasesResult,
      casesRevenueData,
      totalClientsResult,
      totalStaffResult,
      attorneysWithCasesData,
      staffData,
      riskAlertsData,
      recentAuditLogsData,
    ] = await Promise.all([
      // Total cases
      db.from('cases').select('*', { count: 'exact', head: true }),
      // Active cases (status not closed/archived)
      db.from('cases')
        .select('*', { count: 'exact', head: true })
        .not('status', 'in', '("closed","archived")'),
      // Revenue data (all estimated values)
      db.from('cases').select('estimated_value'),
      // Total clients
      db.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client'),
      // Total staff
      db.from('profiles').select('*', { count: 'exact', head: true }).in('role', nonClientRoles),
      // Attorneys with cases — fetch staff with case counts
      db.from('profiles')
        .select('id, full_name, department, role')
        .in('role', nonClientRoles),
      // Staff for department grouping
      db.from('profiles')
        .select('department, role')
        .in('role', nonClientRoles),
      // Risk alerts: high risk OR critical urgency, not closed/archived
      db.from('cases')
        .select('id, matter_number, title, case_type, urgency, is_high_risk, status, lead_attorney_id')
        .or('is_high_risk.eq.true,urgency.eq.critical')
        .not('status', 'in', '("closed","archived")')
        .order('updated_at', { ascending: false }),
      // Recent audit logs (last 10)
      db.from('audit_logs')
        .select('id, action, resource_type, resource_id, details, ip_address, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    const totalCases = totalCasesResult.count || 0;
    const activeCases = activeCasesResult.count || 0;
    const totalClients = totalClientsResult.count || 0;
    const totalStaff = totalStaffResult.count || 0;

    // Calculate total revenue
    const totalRevenue = (casesRevenueData.data || []).reduce(
      (sum: number, c: any) => sum + (c.estimated_value || 0), 0
    );

    // Build department performance from attorneys with cases
    // We need case counts per lead_attorney, so fetch those
    const attorneyIds = (attorneysWithCasesData.data || []).map((a: any) => a.id);

    // Get case counts per lead attorney
    let caseCountsMap: Record<string, number> = {};
    if (attorneyIds.length > 0) {
      const { data: caseCountsData } = await db
        .from('cases')
        .select('lead_attorney_id')
        .not('lead_attorney_id', 'is', null);

      for (const c of (caseCountsData || [])) {
        const attId = c.lead_attorney_id;
        if (attId) {
          caseCountsMap[attId] = (caseCountsMap[attId] || 0) + 1;
        }
      }
    }

    // Filter to attorneys who actually have cases
    const attorneysWithCases = (attorneysWithCasesData.data || []).filter(
      (a: any) => (caseCountsMap[a.id] || 0) > 0
    );

    const deptPerformanceMap: Record<string, { department: string; attorneys: any[]; total_cases: number }> = {};
    for (const attorney of attorneysWithCases) {
      const dept = attorney.department || 'unassigned';
      if (!deptPerformanceMap[dept]) {
        deptPerformanceMap[dept] = { department: dept, attorneys: [], total_cases: 0 };
      }
      const caseCount = caseCountsMap[attorney.id] || 0;
      deptPerformanceMap[dept].attorneys.push({
        id: attorney.id,
        full_name: attorney.full_name,
        case_count: caseCount,
      });
      deptPerformanceMap[dept].total_cases += caseCount;
    }

    const departmentPerformance = Object.values(deptPerformanceMap).map((dept) => ({
      department: dept.department,
      total_cases: dept.total_cases,
      attorney_count: dept.attorneys.length,
      attorneys: dept.attorneys,
    }));

    // Staff by department formatted
    const staffByDeptMap: Record<string, number> = {};
    for (const item of (staffData.data || [])) {
      const dept = item.department || 'unassigned';
      staffByDeptMap[dept] = (staffByDeptMap[dept] || 0) + 1;
    }
    const staffByDeptFormatted = Object.entries(staffByDeptMap).map(([department, count]) => ({
      department,
      count,
    }));

    // Enrich risk alerts with lead attorney info
    const riskAlertsFormatted = await Promise.all(
      (riskAlertsData.data || []).map(async (c: any) => {
        let leadAttorney = null;
        if (c.lead_attorney_id) {
          const { data: attorney } = await db
            .from('profiles')
            .select('id, full_name, department')
            .eq('id', c.lead_attorney_id)
            .single();
          leadAttorney = attorney;
        }
        return {
          id: c.id,
          matter_number: c.matter_number,
          title: c.title,
          case_type: c.case_type,
          urgency: c.urgency,
          is_high_risk: c.is_high_risk,
          status: c.status,
          lead_attorney: leadAttorney,
        };
      })
    );

    // Enrich recent audit logs with user info
    const recentAuditLogsFormatted = await Promise.all(
      (recentAuditLogsData.data || []).map(async (log: any) => {
        let user = null;
        if (log.user_id) {
          const { data: userData } = await db
            .from('profiles')
            .select('id, full_name, email, role')
            .eq('user_id', log.user_id)
            .single();
          user = userData;
        }
        return {
          id: log.id,
          action: log.action,
          resource_type: log.resource_type,
          resource_id: log.resource_id,
          details: log.details,
          ip_address: log.ip_address,
          created_at: log.created_at,
          user,
        };
      })
    );

    // Pending approvals — empty until approval system is built
    const pendingApprovals: any[] = [];

    // Key metrics — calculated from real data
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
    const financialSummary: any[] = [];

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
