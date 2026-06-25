/**
 * GET /api/crm/activity - Paginated activity log with filter
 * Rewritten from Supabase to Prisma/SQLite.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, apiError, getPaginationParams, createPaginationResult } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const adminRoles = ['managing_director', 'systems_admin'];
    if (!adminRoles.includes(auth.user.role)) {
      return apiError('Insufficient privileges', 403, 'ROLE_FORBIDDEN');
    }

    const { page, perPage } = getPaginationParams(request);
    const action = request.nextUrl.searchParams.get('action') || 'all';

    const skip = (page - 1) * perPage;

    // Build where clause
    const where: Record<string, unknown> = {};
    if (action !== 'all') {
      where.action = action;
    }

    // Fetch paginated audit logs with user relation
    const [data, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { created_at: 'desc' },
        include: {
          user: { select: { full_name: true } },
        },
      }),
      db.auditLog.count({ where }),
    ]);

    const activityEntries = data.map((entry) => ({
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
      pagination: createPaginationResult(total, page, perPage),
    });
  } catch (error) {
    console.error('CRM activity error:', error);
    return apiError('Failed to fetch activity log', 500, 'ACTIVITY_ERROR');
  }
}
