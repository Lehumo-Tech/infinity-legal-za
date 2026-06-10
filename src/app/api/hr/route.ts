/**
 * GET /api/hr - HR Portal aggregated data
 * Access: hr_manager, managing_director, senior_partner, systems_admin
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';
import { type RoleKey } from '@/lib/auth';

const ALLOWED_ROLES: RoleKey[] = ['hr_manager', 'managing_director', 'senior_partner', 'systems_admin'];

const NON_CLIENT_ROLES = [
  'managing_director', 'senior_partner', 'associate', 'paralegal',
  'legal_officer', 'supervising_officer', 'senior_consultant',
  'consultant', 'candidate_attorney', 'hr_manager', 'finance_manager',
  'office_administrator', 'systems_admin', 'receptionist',
];

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

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const ninetyDaysAgoIso = ninetyDaysAgo.toISOString();

    // Run all queries in parallel
    const [
      totalEmployeesResult,
      activeEmployeesResult,
      employeesData,
      recentHiresData,
    ] = await Promise.all([
      // Total employees
      db.from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('role', NON_CLIENT_ROLES),
      // Active employees
      db.from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('role', NON_CLIENT_ROLES)
        .eq('is_active', true),
      // All employees for grouping (department + role)
      db.from('profiles')
        .select('department, role')
        .in('role', NON_CLIENT_ROLES),
      // Recent hires
      db.from('profiles')
        .select('id, full_name, role, department, hire_date')
        .in('role', NON_CLIENT_ROLES)
        .gte('hire_date', ninetyDaysAgoIso)
        .order('hire_date', { ascending: false }),
    ]);

    const totalEmployees = totalEmployeesResult.count || 0;
    const activeEmployees = activeEmployeesResult.count || 0;
    const employees = employeesData.data || [];
    const recentHires = recentHiresData.data || [];

    // Group by department in JS
    const deptMap: Record<string, number> = {};
    for (const item of employees) {
      const dept = item.department || 'unassigned';
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    }
    const employeesByDeptFormatted = Object.entries(deptMap).map(([department, count]) => ({
      department,
      count,
    }));

    // Group by role in JS
    const roleMap: Record<string, number> = {};
    for (const item of employees) {
      const r = item.role;
      roleMap[r] = (roleMap[r] || 0) + 1;
    }
    const employeesByRoleFormatted = Object.entries(roleMap).map(([role, count]) => ({
      role,
      count,
    }));

    // Leave balances — empty until leave management system is built
    const leaveBalances: any[] = [];

    // Open positions — empty until recruitment system is built
    const openPositions: any[] = [];

    // Upcoming reviews — empty until performance review system is built
    const upcomingReviews: any[] = [];

    return apiResponse({
      total_employees: totalEmployees,
      active_employees: activeEmployees,
      employees_by_department: employeesByDeptFormatted,
      employees_by_role: employeesByRoleFormatted,
      recent_hires: recentHires,
      leave_balances: leaveBalances,
      open_positions: openPositions,
      upcoming_reviews: upcomingReviews,
    });
  } catch (error) {
    console.error('HR portal error:', error);
    return apiError('Failed to load HR portal data', 500, 'HR_PORTAL_ERROR');
  }
}
