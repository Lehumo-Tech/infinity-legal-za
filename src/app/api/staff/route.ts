/**
 * GET /api/staff - List staff members with organizational hierarchy via Supabase
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { apiResponse, apiError, requireAuth, getPaginationParams, createPaginationResult } from '@/lib/middleware';

// Roles excluded from staff listing
const EXCLUDED_ROLES = ['client', 'guest'];

// GET - List staff members with organizational hierarchy
export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.VIEW_USERS)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const { page, perPage, from, to } = getPaginationParams(request);
    const url = new URL(request.url);

    const department = url.searchParams.get('department');
    const role = url.searchParams.get('role');
    const is_active = url.searchParams.get('is_active');
    const view = url.searchParams.get('view'); // 'flat' or 'hierarchy' (default: flat)

    // Build query — exclude client and guest roles by default
    let query = db
      .from('profiles')
      .select('*, supervisor:profiles!profiles_supervisor_id_fkey(user_id, full_name, email, role)', { count: 'exact' })
      .not('role', 'in', '("client","guest")');

    if (department) query = query.eq('department', department);
    if (role) query = query.eq('role', role);

    const isActiveFilter = is_active !== null && is_active !== undefined
      ? is_active === 'true'
      : true; // Default to active staff only

    query = query.eq('is_active', isActiveFilter);

    // If hierarchy view requested, return grouped by department
    if (view === 'hierarchy') {
      const { data: staff, error } = await query
        .order('department', { ascending: true })
        .order('role', { ascending: true })
        .order('full_name', { ascending: true });

      if (error) {
        console.error('Staff hierarchy query error:', error);
        return apiError('Failed to load staff', 500, 'STAFF_ERROR');
      }

      // Get all supervisees for the staff members
      const staffUserIds = (staff || []).map((m: any) => m.user_id);
      let superviseesMap: Record<string, any[]> = {};

      if (staffUserIds.length > 0) {
        const { data: supervisees } = await db
          .from('profiles')
          .select('user_id, full_name, email, role, department, supervisor_id')
          .in('supervisor_id', staffUserIds);

        if (supervisees) {
          for (const s of supervisees) {
            if (!superviseesMap[s.supervisor_id]) {
              superviseesMap[s.supervisor_id] = [];
            }
            superviseesMap[s.supervisor_id].push(s);
          }
        }
      }

      // Group by department
      const departments: Record<string, any[]> = {};
      for (const member of staff || []) {
        const dept = member.department || 'unassigned';
        if (!departments[dept]) {
          departments[dept] = [];
        }
        departments[dept].push({
          ...member,
          supervisees: superviseesMap[member.user_id] || [],
        });
      }

      // Build hierarchy structure
      const hierarchy = Object.entries(departments).map(([dept, members]) => ({
        department: dept,
        members: members.map((m: any) => ({
          user_id: m.user_id,
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
        total_staff: (staff || []).length,
      });
    }

    // Flat list view (default)
    const { data: staff, count, error } = await query
      .order('department', { ascending: true })
      .order('role', { ascending: true })
      .order('full_name', { ascending: true })
      .range(from, to);

    if (error) {
      console.error('Staff list query error:', error);
      return apiError('Failed to load staff', 500, 'STAFF_ERROR');
    }

    const formattedStaff = (staff || []).map((m: any) => ({
      user_id: m.user_id,
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
      pagination: createPaginationResult(count || 0, page, perPage),
    });
  } catch (error) {
    console.error('Staff list error:', error);
    return apiError('Failed to load staff', 500, 'STAFF_ERROR');
  }
}
