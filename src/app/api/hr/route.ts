/**
 * GET /api/hr - HR Portal aggregated data
 * Access: admin, managing_director, systems_admin
 * profiles.role CHECK: ('client','attorney','paralegal','admin','managing_director','systems_admin')
 * profiles has NO: is_active, department, hire_date, supervisor_id
 */

import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/api-client';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';
import { type RoleKey } from '@/lib/auth';

// Only roles in the actual profiles CHECK constraint
const ALLOWED_ROLES: RoleKey[] = ['admin', 'managing_director', 'systems_admin'];

// Non-client roles from profiles CHECK constraint
const STAFF_ROLES = ['attorney', 'paralegal', 'admin', 'managing_director', 'systems_admin'];

export async function GET(request: NextRequest) {
  try {
    const db = getAdminClient();
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const userRole = auth.user.role as RoleKey;
    if (!ALLOWED_ROLES.includes(userRole)) {
      return apiError('Insufficient role privileges', 403, 'ROLE_FORBIDDEN');
    }

    // Run all queries in parallel
    // profiles has no department, is_active, hire_date columns
    const [
      totalEmployeesResult,
      employeesData,
    ] = await Promise.all([
      // Total employees (non-client)
      db.from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('role', STAFF_ROLES),
      // All employees for grouping (role only, no department)
      db.from('profiles')
        .select('role')
        .in('role', STAFF_ROLES),
    ]);

    const totalEmployees = totalEmployeesResult.count || 0;
    const employees = employeesData.data || [];

    // Group by role in JS (no department column to group by)
    const roleMap: Record<string, number> = {};
    for (const item of employees) {
      const r = item.role;
      roleMap[r] = (roleMap[r] || 0) + 1;
    }
    const employeesByRoleFormatted = Object.entries(roleMap).map(([role, count]) => ({
      role,
      count,
    }));

    // Also fetch attorney details for enrichment
    const { data: attorneysData } = await db
      .from('attorneys')
      .select('id, practice_number, specialization, available, profile:profiles(id, full_name, email, role)');

    const activeAttorneys = (attorneysData || []).filter((a: any) => a.available).length;
    const totalAttorneys = (attorneysData || []).length;

    // Leave balances — empty until leave management system is built
    const leaveBalances: any[] = [];

    // Open positions — empty until recruitment system is built
    const openPositions: any[] = [];

    // Upcoming reviews — empty until performance review system is built
    const upcomingReviews: any[] = [];

    return apiResponse({
      total_employees: totalEmployees,
      active_employees: totalEmployees, // No is_active column, all are considered active
      employees_by_role: employeesByRoleFormatted,
      attorneys: {
        total: totalAttorneys,
        available: activeAttorneys,
      },
      leave_balances: leaveBalances,
      open_positions: openPositions,
      upcoming_reviews: upcomingReviews,
    });
  } catch (error) {
    console.error('HR portal error:', error);
    return apiError('Failed to load HR portal data', 500, 'HR_PORTAL_ERROR');
  }
}
