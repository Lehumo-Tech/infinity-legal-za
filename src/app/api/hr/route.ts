/**
 * GET /api/hr - HR Portal aggregated data
 * Access: admin, managing_director, systems_admin
 *
 * Uses Prisma to aggregate staff counts by role and attorney info.
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';
import { type RoleKey } from '@/lib/auth';

const ALLOWED_ROLES: RoleKey[] = ['admin', 'managing_director', 'systems_admin'];

// Non-client roles from the schema's role field
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
    const [totalEmployees, employees] = await Promise.all([
      db.user.count({ where: { role: { in: STAFF_ROLES } } }),
      db.user.findMany({
        where: { role: { in: STAFF_ROLES } },
        select: { role: true, is_active: true },
      }),
    ]);

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

    // Fetch attorney details for enrichment
    const attorneys = await db.user.findMany({
      where: { role: 'attorney' },
      select: {
        id: true,
        full_name: true,
        email: true,
        practice_number: true,
        specialization: true,
        is_active: true,
      },
    });

    const activeAttorneys = attorneys.filter(a => a.is_active).length;
    const totalAttorneys = attorneys.length;

    // Leave balances — empty until leave management system is built
    const leaveBalances: unknown[] = [];

    // Open positions — empty until recruitment system is built
    const openPositions: unknown[] = [];

    // Upcoming reviews — empty until performance review system is built
    const upcomingReviews: unknown[] = [];

    return apiResponse({
      total_employees: totalEmployees,
      active_employees: employees.filter(e => e.is_active).length,
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
