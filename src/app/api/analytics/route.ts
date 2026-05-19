/**
 * GET /api/analytics - Analytics data for charts
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
    const period = url.searchParams.get('period') || '30d'; // 7d, 30d, 90d, 1y

    let startDate = new Date();
    switch (period) {
      case '7d': startDate.setDate(startDate.getDate() - 7); break;
      case '30d': startDate.setDate(startDate.getDate() - 30); break;
      case '90d': startDate.setDate(startDate.getDate() - 90); break;
      case '1y': startDate.setFullYear(startDate.getFullYear() - 1); break;
    }

    const [
      apiCalls,
      errorCount,
      avgResponseTime,
      topEndpoints,
      errorsByType,
      dailyApiCalls,
    ] = await Promise.all([
      db.apiAnalytic.count({ where: { created_at: { gte: startDate } } }),
      db.errorLog.count({ where: { created_at: { gte: startDate } } }),
      db.apiAnalytic.aggregate({ where: { created_at: { gte: startDate }, response_time_ms: { not: null } }, _avg: { response_time_ms: true } }),
      db.apiAnalytic.groupBy({ by: ['endpoint'], _count: { endpoint: true }, _avg: { response_time_ms: true }, where: { created_at: { gte: startDate } }, orderBy: { _count: { endpoint: 'desc' } }, take: 10 }),
      db.errorLog.groupBy({ by: ['error_type'], _count: { error_type: true }, where: { created_at: { gte: startDate } } }),
      db.apiAnalytic.groupBy({ by: ['created_at'], _count: { created_at: true }, where: { created_at: { gte: startDate } }, orderBy: { created_at: 'asc' } }),
    ]);

    return apiResponse({
      period,
      startDate,
      summary: {
        totalApiCalls: apiCalls,
        totalErrors: errorCount,
        avgResponseTime: Math.round(avgResponseTime._avg.response_time_ms || 0),
        errorRate: apiCalls > 0 ? ((errorCount / apiCalls) * 100).toFixed(2) : '0',
      },
      topEndpoints: topEndpoints.map(e => ({
        endpoint: e.endpoint,
        calls: e._count.endpoint,
        avgResponseTime: Math.round(e._avg.response_time_ms || 0),
      })),
      errorsByType: errorsByType.map(e => ({
        type: e.error_type,
        count: e._count.error_type,
      })),
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return apiError('Failed to load analytics', 500, 'ANALYTICS_ERROR');
  }
}
