/**
 * GET /api/staff - List staff members via Prisma/SQLite
 * Returns attorneys, paralegals, admins, managing_director, systems_admin
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { apiResponse, apiError, requireAuth, getPaginationParams, createPaginationResult } from '@/lib/middleware';

// Roles included in staff listing
const STAFF_ROLES = ['attorney', 'paralegal', 'admin', 'managing_director', 'systems_admin'];

// GET - List staff members
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.VIEW_USERS)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const { page, perPage } = getPaginationParams(request);
    const url = new URL(request.url);

    const role = url.searchParams.get('role');
    const view = url.searchParams.get('view'); // 'flat' or 'hierarchy'

    // Build where clause
    const where: Record<string, unknown> = {
      is_active: true,
      role: { in: STAFF_ROLES },
    };

    if (role) {
      where.role = role;
    }

    // If hierarchy view requested, return grouped by role
    if (view === 'hierarchy') {
      const staff = await db.user.findMany({
        where,
        orderBy: [{ role: 'asc' }, { full_name: 'asc' }],
        select: {
          id: true,
          full_name: true,
          email: true,
          phone: true,
          role: true,
          avatar_url: true,
          department: true,
          practice_number: true,
          specialization: true,
          hourly_rate: true,
          bio: true,
        },
      });

      // Group by role
      const roles: Record<string, typeof staff> = {};
      for (const member of staff) {
        const r = member.role || 'unknown';
        if (!roles[r]) {
          roles[r] = [];
        }
        roles[r].push(member);
      }

      // Build hierarchy structure
      const hierarchy = Object.entries(roles).map(([roleName, members]) => ({
        role: roleName,
        members: members.map((m) => ({
          id: m.id,
          full_name: m.full_name,
          email: m.email,
          phone: m.phone,
          role: m.role,
          avatar_url: m.avatar_url,
          department: m.department,
          attorney_details: ['attorney', 'associate', 'candidate_attorney'].includes(m.role)
            ? {
                practice_number: m.practice_number,
                specialization: m.specialization,
                hourly_rate: m.hourly_rate,
                bio: m.bio,
              }
            : null,
        })),
        head_count: members.length,
      }));

      return apiResponse({
        data: hierarchy,
        total_roles: Object.keys(roles).length,
        total_staff: staff.length,
      });
    }

    // Flat list view (default)
    const [staff, total] = await Promise.all([
      db.user.findMany({
        where,
        orderBy: [{ role: 'asc' }, { full_name: 'asc' }],
        skip: (page - 1) * perPage,
        take: perPage,
        select: {
          id: true,
          full_name: true,
          email: true,
          phone: true,
          role: true,
          avatar_url: true,
          department: true,
          practice_number: true,
          specialization: true,
          hourly_rate: true,
          bio: true,
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
      avatar_url: m.avatar_url,
      department: m.department,
      attorney_details: ['attorney', 'associate', 'candidate_attorney'].includes(m.role)
        ? {
            practice_number: m.practice_number,
            specialization: m.specialization,
            hourly_rate: m.hourly_rate,
            bio: m.bio,
          }
        : null,
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
