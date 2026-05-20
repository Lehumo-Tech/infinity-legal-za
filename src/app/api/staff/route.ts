/**
 * GET /api/staff - List staff members with organizational hierarchy via Prisma/SQLite
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiResponse, apiError, requireAuth, getPaginationParams, createPaginationResult } from '@/lib/middleware';

// GET - List staff members with organizational hierarchy
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const { page, perPage, skip, take } = getPaginationParams(request);
    const url = new URL(request.url);

    const department = url.searchParams.get('department');
    const role = url.searchParams.get('role');
    const is_active = url.searchParams.get('is_active');
    const view = url.searchParams.get('view'); // 'flat' or 'hierarchy' (default: flat)

    // Build where clause - exclude client and guest roles by default for staff listing
    const where: Record<string, unknown> = {
      role: { notIn: ['client', 'guest'] },
    };

    if (department) where.department = department;
    if (role) where.role = role;
    if (is_active !== null && is_active !== undefined) {
      where.is_active = is_active === 'true';
    } else {
      // Default to active staff only
      where.is_active = true;
    }

    // If hierarchy view requested, return grouped by department
    if (view === 'hierarchy') {
      const staff = await db.user.findMany({
        where,
        orderBy: [{ department: 'asc' }, { role: 'asc' }, { full_name: 'asc' }],
        include: {
          supervisor: {
            select: {
              id: true,
              full_name: true,
              email: true,
              role: true,
            },
          },
          supervisees: {
            select: {
              id: true,
              full_name: true,
              email: true,
              role: true,
              department: true,
            },
          },
        },
      });

      // Group by department
      const departments: Record<string, typeof staff> = {};
      for (const member of staff) {
        const dept = member.department || 'unassigned';
        if (!departments[dept]) {
          departments[dept] = [];
        }
        departments[dept].push(member);
      }

      // Build hierarchy structure
      const hierarchy = Object.entries(departments).map(([dept, members]) => ({
        department: dept,
        members: members.map((m) => ({
          id: m.id,
          full_name: m.full_name,
          email: m.email,
          phone: m.phone,
          role: m.role,
          department: m.department,
          hire_date: m.hire_date,
          is_active: m.is_active,
          avatar: m.avatar,
          supervisor: m.supervisor,
          supervisees: m.supervisees,
        })),
        head_count: members.length,
      }));

      return apiResponse({
        data: hierarchy,
        total_departments: Object.keys(departments).length,
        total_staff: staff.length,
      });
    }

    // Flat list view (default)
    const [staff, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take,
        orderBy: [{ department: 'asc' }, { role: 'asc' }, { full_name: 'asc' }],
        include: {
          supervisor: {
            select: {
              id: true,
              full_name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      db.user.count({ where }),
    ]);

    const formattedStaff = staff.map((m) => ({
      id: m.id,
      full_name: m.full_name,
      email: m.email,
      phone: m.phone,
      role: m.role,
      department: m.department,
      hire_date: m.hire_date,
      is_active: m.is_active,
      avatar: m.avatar,
      supervisor: m.supervisor,
    }));

    return apiResponse({
      data: formattedStaff,
      pagination: createPaginationResult(total, page, perPage),
    });
  } catch (error) {
    console.error('Staff list error:', error);
    return apiError('Failed to load staff', 500, 'STAFF_ERROR');
  }
}
