/**
 * GET /api/crm/activity - Paginated activity log with filter
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, apiError, getPaginationParams, createPaginationResult } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const adminRoles = ['managing_director', 'admin', 'systems_admin'];
    if (!adminRoles.includes(auth.user.role)) {
      return apiError('Insufficient privileges', 403, 'ROLE_FORBIDDEN');
    }

    if (!db) {
      return apiError('Database not configured', 503, 'DB_NOT_CONFIGURED');
    }

    const { page, perPage, from, to } = getPaginationParams(request);
    const action = request.nextUrl.searchParams.get('action') || 'all';

    // Build query
    let query = db
      .from('audit_logs')
      .select('id, created_at, user_id, action, resource_type, resource_id, details, user:profiles!audit_logs_user_id_fkey(full_name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (action !== 'all') {
      query = query.eq('action', action);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('CRM activity query error:', error);
      return apiError('Failed to fetch activity log', 500, 'ACTIVITY_FETCH_ERROR');
    }

    const activityEntries = (data || []).map((entry: any) => ({
      id: entry.id,
      created_at: entry.created_at,
      user_id: entry.user_id,
      user_name: entry.user?.full_name || null,
      action: entry.action,
      resource_type: entry.resource_type,
      resource_id: entry.resource_id,
      details: entry.details,
    }));

    return NextResponse.json({
      success: true,
      data: activityEntries,
      pagination: createPaginationResult(count || 0, page, perPage),
    });
  } catch (error) {
    console.error('CRM activity error:', error);
    return apiError('Failed to fetch activity log', 500, 'ACTIVITY_ERROR');
  }
}
