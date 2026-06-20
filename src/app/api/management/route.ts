/**
 * GET /api/management - Management Portal aggregated data
 * Access: managing_director, admin, systems_admin
 * profiles.role CHECK: ('client','attorney','paralegal','admin','managing_director','systems_admin')
 * cases has: case_ref (not matter_number), attorney_id FK → attorneys(id) (not lead_attorney_id → profiles)
 * cases has NO: urgency, is_high_risk, support_paralegal_id
 * profiles has NO: department, is_active, supervisor_id, hire_date
 */

import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/api-client';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';
import { type RoleKey } from '@/lib/auth';

// Only roles in profiles CHECK constraint
const ALLOWED_ROLES: RoleKey[] = ['managing_director', 'admin', 'systems_admin'];

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const db = getAdminClient();
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    const userRole = auth.user.role as RoleKey;
    if (!ALLOWED_ROLES.includes(userRole)) {
      return apiError('Insufficient role privileges', 403, 'ROLE_FORBIDDEN');
    }

    // Non-client roles from the actual profiles CHECK constraint
    const staffRoles = ['attorney', 'paralegal', 'admin', 'managing_director', 'systems_admin'];

    // Run all queries in parallel
    const [
      totalCasesResult,
      activeCasesResult,
      casesRevenueData,
      totalClientsResult,
      totalStaffResult,
      attorneysData,
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
      db.from('profiles').select('*', { count: 'exact', head: true }).in('role', staffRoles),
      // Attorneys for performance tracking
      db.from('attorneys')
        .select('id, practice_number, specialization, available, profile:profiles(id, full_name, email, role)')
        .eq('available', true),
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

    // Get case counts per attorney — cases.attorney_id references attorneys(id)
    const attorneyIds = (attorneysData.data || []).map((a: any) => a.id);

    let caseCountsMap: Record<string, number> = {};
    if (attorneyIds.length > 0) {
      const { data: caseCountsData } = await db
        .from('cases')
        .select('attorney_id')
        .not('attorney_id', 'is', null);

      for (const c of (caseCountsData || [])) {
        const attId = c.attorney_id;
        if (attId) {
          caseCountsMap[attId] = (caseCountsMap[attId] || 0) + 1;
        }
      }
    }

    // Attorney performance
    const attorneyPerformance = (attorneysData.data || [])
      .filter((a: any) => (caseCountsMap[a.id] || 0) > 0)
      .map((a: any) => ({
        id: a.id,
        full_name: a.profile?.full_name || 'Unknown',
        practice_number: a.practice_number,
        specialization: a.specialization,
        case_count: caseCountsMap[a.id] || 0,
      }));

    // Enrich recent audit logs with user info
    const recentAuditLogsFormatted = await Promise.all(
      (recentAuditLogsData.data || []).map(async (log: any) => {
        let user = null;
        if (log.user_id) {
          const { data: userData } = await db
            .from('profiles')
            .select('id, full_name, email, role')
            .eq('id', log.user_id)
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
    const financialSummary: any[] = [];

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
