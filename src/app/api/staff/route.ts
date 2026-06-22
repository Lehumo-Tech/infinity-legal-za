/**
 * GET /api/staff - List staff members via Supabase
 * profiles.role CHECK: ('client','attorney','paralegal','admin','managing_director','systems_admin')
 * profiles has no: is_active, department, supervisor_id, hire_date, avatar (has avatar_url)
 * profiles PK is `id` (not `user_id`)
 */

import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/api-client';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { apiResponse, apiError, requireAuth, getPaginationParams, createPaginationResult } from '@/lib/middleware';

// Roles included in staff listing — only roles that exist in profiles CHECK constraint
const STAFF_ROLES = ['attorney', 'paralegal', 'admin', 'managing_director', 'systems_admin'];

// GET - List staff members
export async function GET(request: NextRequest) {
  try {
    const db = getAdminClient();
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

    const role = url.searchParams.get('role');
    const view = url.searchParams.get('view'); // 'flat' or 'hierarchy' (default: flat)

    // Build query — exclude client role by default
    // profiles has no department, is_active, supervisor_id columns
    let query = db
      .from('profiles')
      .select('*', { count: 'exact' })
      .in('role', STAFF_ROLES);

    if (role) query = query.eq('role', role);

    // If hierarchy view requested, return grouped by role
    if (view === 'hierarchy') {
      const { data: staff, error } = await query
        .order('role', { ascending: true })
        .order('full_name', { ascending: true });

      if (error) {
        console.error('Staff hierarchy query error:', error);
        return apiError('Failed to load staff', 500, 'STAFF_ERROR');
      }

      // Also fetch attorneys for enriched data
      const staffIds = (staff || []).map((m: any) => m.id);
      let attorneysMap: Record<string, any> = {};

      if (staffIds.length > 0) {
        const { data: attorneys } = await db
          .from('attorneys')
          .select('id, practice_number, specialization, hourly_rate, available')
          .in('id', staffIds);

        if (attorneys) {
          for (const a of attorneys) {
            attorneysMap[a.id] = a;
          }
        }
      }

      // Group by role
      const roles: Record<string, any[]> = {};
      for (const member of staff || []) {
        const r = member.role || 'unknown';
        if (!roles[r]) {
          roles[r] = [];
        }
        roles[r].push({
          ...member,
          attorney_details: attorneysMap[member.id] || null,
        });
      }

      // Build hierarchy structure
      const hierarchy = Object.entries(roles).map(([role, members]) => ({
        role,
        members: members.map((m: any) => ({
          id: m.id,
          full_name: m.full_name,
          email: m.email,
          phone: m.phone,
          role: m.role,
          avatar_url: m.avatar_url,
          attorney_details: m.attorney_details,
        })),
        head_count: members.length,
      }));

      return apiResponse({
        data: hierarchy,
        total_roles: Object.keys(roles).length,
        total_staff: (staff || []).length,
      });
    }

    // Flat list view (default)
    const { data: staff, count, error } = await query
      .order('role', { ascending: true })
      .order('full_name', { ascending: true })
      .range(from, to);

    if (error) {
      console.error('Staff list query error:', error);
      return apiError('Failed to load staff', 500, 'STAFF_ERROR');
    }

    // Fetch attorney details for staff members who are attorneys
    const staffIds = (staff || []).map((m: any) => m.id);
    let attorneysMap: Record<string, any> = {};

    if (staffIds.length > 0) {
      const { data: attorneys } = await db
        .from('attorneys')
        .select('id, practice_number, specialization, hourly_rate, available')
        .in('id', staffIds);

      if (attorneys) {
        for (const a of attorneys) {
          attorneysMap[a.id] = a;
        }
      }
    }

    const formattedStaff = (staff || []).map((m: any) => ({
      id: m.id,
      full_name: m.full_name,
      email: m.email,
      phone: m.phone,
      role: m.role,
      avatar_url: m.avatar_url,
      attorney_details: attorneysMap[m.id] || null,
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
