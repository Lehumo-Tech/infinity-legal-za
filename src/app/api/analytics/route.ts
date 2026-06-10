/**
 * GET /api/analytics - Analytics data from Supabase
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    const auth = await requireAuth(request);
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

    const startDateIso = startDate.toISOString();

    // Run all queries in parallel
    const [
      apiCallsResult,
      errorCountResult,
      errorsData,
      topEndpointsData,
    ] = await Promise.all([
      // Total API calls in period
      db.from('api_analytics')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDateIso),
      // Total errors in period
      db.from('error_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDateIso),
      // Errors by type — select and group in JS
      db.from('error_logs')
        .select('error_type')
        .gte('created_at', startDateIso),
      // Top endpoints — select and group in JS
      db.from('api_analytics')
        .select('endpoint')
        .gte('created_at', startDateIso),
    ]);

    const apiCalls = apiCallsResult.count || 0;
    const errorCount = errorCountResult.count || 0;

    // Group errors by type in JS
    const errorsByTypeMap: Record<string, number> = {};
    for (const item of (errorsData.data || [])) {
      const t = item.error_type || 'unknown';
      errorsByTypeMap[t] = (errorsByTypeMap[t] || 0) + 1;
    }
    const errorsByType = Object.entries(errorsByTypeMap).map(([type, count]) => ({ type, count }));

    // Group endpoints in JS and get top 10
    const endpointMap: Record<string, number> = {};
    for (const item of (topEndpointsData.data || [])) {
      const ep = item.endpoint || 'unknown';
      endpointMap[ep] = (endpointMap[ep] || 0) + 1;
    }
    const topEndpoints = Object.entries(endpointMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([endpoint, calls]) => ({ endpoint, calls }));

    return apiResponse({
      period,
      startDate,
      summary: {
        totalApiCalls: apiCalls,
        totalErrors: errorCount,
        errorRate: apiCalls > 0 ? ((errorCount / apiCalls) * 100).toFixed(2) : '0',
      },
      topEndpoints,
      errorsByType,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return apiError('Failed to load analytics', 500, 'ANALYTICS_ERROR');
  }
}
