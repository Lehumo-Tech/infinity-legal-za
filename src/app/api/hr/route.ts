/**
 * GET /api/hr - HR Portal aggregated data
 * Access: hr_manager, managing_director, senior_partner, systems_admin
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';
import { type RoleKey } from '@/lib/auth';

const ALLOWED_ROLES: RoleKey[] = ['hr_manager', 'managing_director', 'senior_partner', 'systems_admin'];

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const userRole = auth.user.role as RoleKey;
    if (!ALLOWED_ROLES.includes(userRole)) {
      return apiError('Insufficient role privileges', 403, 'ROLE_FORBIDDEN');
    }

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Run all queries in parallel
    const [
      totalEmployees,
      activeEmployees,
      employeesByDepartment,
      employeesByRole,
      recentHires,
    ] = await Promise.all([
      db.user.count({
        where: { role: { notIn: ['client', 'guest'] } },
      }),
      db.user.count({
        where: {
          role: { notIn: ['client', 'guest'] },
          is_active: true,
        },
      }),
      db.user.groupBy({
        by: ['department'],
        where: { role: { notIn: ['client', 'guest'] } },
        _count: { department: true },
      }),
      db.user.groupBy({
        by: ['role'],
        where: { role: { notIn: ['client', 'guest'] } },
        _count: { role: true },
      }),
      db.user.findMany({
        where: {
          role: { notIn: ['client', 'guest'] },
          hire_date: { gte: ninetyDaysAgo },
        },
        select: {
          id: true,
          full_name: true,
          role: true,
          department: true,
          hire_date: true,
        },
        orderBy: { hire_date: 'desc' },
      }),
    ]);

    // Format grouped data
    const employeesByDeptFormatted = employeesByDepartment.map((item) => ({
      department: item.department || 'unassigned',
      count: item._count.department,
    }));

    const employeesByRoleFormatted = employeesByRole.map((item) => ({
      role: item.role,
      count: item._count.role,
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
