/**
 * GET /api/hr - HR Portal aggregated data
 * Access: hr_manager, managing_director, senior_partner, systems_admin
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';

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

    // Mock: Leave balances
    const leaveBalances = [
      { user_id: 'usr_001', full_name: 'Thabo Molefe', days_taken: 8, days_remaining: 14, department: 'litigation' },
      { user_id: 'usr_002', full_name: 'Nomsa Dlamini', days_taken: 5, days_remaining: 17, department: 'corporate' },
      { user_id: 'usr_003', full_name: 'Pieter van Wyk', days_taken: 12, days_remaining: 8, department: 'conveyancing' },
      { user_id: 'usr_004', full_name: 'Ayesha Khan', days_taken: 3, days_remaining: 19, department: 'family_law' },
      { user_id: 'usr_005', full_name: 'David Nkosi', days_taken: 7, days_remaining: 15, department: 'criminal_law' },
      { user_id: 'usr_006', full_name: 'Lerato Sithole', days_taken: 10, days_remaining: 12, department: 'estate_planning' },
      { user_id: 'usr_007', full_name: 'Johan Botha', days_taken: 1, days_remaining: 21, department: 'consulting' },
      { user_id: 'usr_008', full_name: 'Zanele Mkhize', days_taken: 6, days_remaining: 16, department: 'hr' },
    ];

    // Mock: Open positions
    const openPositions = [
      { id: 'pos_001', title: 'Senior Conveyancing Attorney', department: 'conveyancing', type: 'permanent' as const, posted_date: '2026-02-15', applicants: 12 },
      { id: 'pos_002', title: 'Legal Researcher', department: 'litigation', type: 'contract' as const, posted_date: '2026-02-20', applicants: 8 },
      { id: 'pos_003', title: 'Candidate Attorney', department: 'corporate', type: 'permanent' as const, posted_date: '2026-02-25', applicants: 34 },
      { id: 'pos_004', title: 'Office Administrator', department: 'administration', type: 'permanent' as const, posted_date: '2026-03-01', applicants: 19 },
      { id: 'pos_005', title: 'IT Support Technician', department: 'it', type: 'contract' as const, posted_date: '2026-03-03', applicants: 7 },
    ];

    // Mock: Upcoming reviews
    const upcomingReviews = [
      { user_id: 'usr_009', full_name: 'Amahle Zulu', review_type: 'Annual Performance', scheduled_date: '2026-03-10', department: 'litigation' },
      { user_id: 'usr_010', full_name: 'Craig Pillay', review_type: 'Probation Completion', scheduled_date: '2026-03-12', department: 'corporate' },
      { user_id: 'usr_011', full_name: 'Fatima Ebrahim', review_type: 'Mid-Year Check-in', scheduled_date: '2026-03-15', department: 'family_law' },
      { user_id: 'usr_012', full_name: 'Sipho Ndlovu', review_type: 'Annual Performance', scheduled_date: '2026-03-18', department: 'criminal_law' },
      { user_id: 'usr_013', full_name: 'Elana Roux', review_type: 'Promotion Review', scheduled_date: '2026-03-22', department: 'conveyancing' },
    ];

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
