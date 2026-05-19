/**
 * GET /api/analytics - Analytics data from Prisma/SQLite
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.VIEW_ANALYTICS)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const url = new URL(request.url);
    const period = url.searchParams.get('period') || '30d';

    // Calculate date filter based on period
    const startDate = new Date();
    switch (period) {
      case '7d': startDate.setDate(startDate.getDate() - 7); break;
      case '30d': startDate.setDate(startDate.getDate() - 30); break;
      case '90d': startDate.setDate(startDate.getDate() - 90); break;
      case '1y': startDate.setFullYear(startDate.getFullYear() - 1); break;
    }

    const dateFilter = { gte: startDate };

    const [apiCalls, errorCount, errorsByType, topEndpoints] = await Promise.all([
      db.apiAnalytic.count({ where: { created_at: dateFilter } }),
      db.errorLog.count({ where: { created_at: dateFilter } }),
      db.errorLog.groupBy({
        by: ['error_type'],
        _count: { error_type: true },
        where: { created_at: dateFilter },
      }),
      db.apiAnalytic.groupBy({
        by: ['endpoint'],
        _count: { endpoint: true },
        where: { created_at: dateFilter },
      }),
    ]);

    return apiResponse({
      period,
      startDate,
      summary: {
        totalApiCalls: apiCalls,
        totalErrors: errorCount,
        errorRate: apiCalls > 0 ? ((errorCount / apiCalls) * 100).toFixed(2) : '0',
      },
      topEndpoints: topEndpoints
        .sort((a: any, b: any) => b._count.endpoint - a._count.endpoint)
        .slice(0, 10)
        .map((item: any) => ({ endpoint: item.endpoint, calls: item._count.endpoint })),
      errorsByType: errorsByType.map((item: any) => ({ type: item.error_type, count: item._count.error_type })),
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return apiError('Failed to load analytics', 500, 'ANALYTICS_ERROR');
  }
}
