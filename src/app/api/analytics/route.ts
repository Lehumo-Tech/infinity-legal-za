/**
 * GET /api/analytics - Analytics data from PocketBase
 */

import { NextRequest } from 'next/server';
import { listRecords, countRecords, groupByField } from '@/lib/pb-client';
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
    let startDate = new Date();
    switch (period) {
      case '7d': startDate.setDate(startDate.getDate() - 7); break;
      case '30d': startDate.setDate(startDate.getDate() - 30); break;
      case '90d': startDate.setDate(startDate.getDate() - 90); break;
      case '1y': startDate.setFullYear(startDate.getFullYear() - 1); break;
    }

    const dateFilter = `created>='${startDate.toISOString().split('.')[0]}Z'`;

    const [apiCalls, errorCount, errorsByType, topEndpoints] = await Promise.all([
      countRecords('api_analytics', dateFilter),
      countRecords('error_logs', dateFilter),
      groupByField('error_logs', 'error_type', dateFilter),
      groupByField('api_analytics', 'endpoint', dateFilter),
    ]);

    return apiResponse({
      period,
      startDate,
      summary: {
        totalApiCalls: apiCalls,
        totalErrors: errorCount,
        errorRate: apiCalls > 0 ? ((errorCount / apiCalls) * 100).toFixed(2) : '0',
      },
      topEndpoints: Object.entries(topEndpoints)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([endpoint, count]) => ({ endpoint, calls: count })),
      errorsByType: Object.entries(errorsByType)
        .map(([type, count]) => ({ type, count })),
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return apiError('Failed to load analytics', 500, 'ANALYTICS_ERROR');
  }
}
