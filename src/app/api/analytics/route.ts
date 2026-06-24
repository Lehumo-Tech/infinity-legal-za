/**
 * GET /api/analytics - Analytics data from Prisma/SQLite
 * Returns analytics data for admin dashboard.
 * Note: api_analytics and error_logs tables don't exist in Prisma schema,
 * so we generate analytics from the available models.
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
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

    // Run all queries in parallel using available Prisma models
    const [
      totalCases,
      newCasesInPeriod,
      casesByStatus,
      casesByType,
      totalClients,
      newClientsInPeriod,
      totalSubscriptions,
      activeSubscriptions,
      revenueData,
      totalConsultations,
      consultationsInPeriod,
      totalIntakeSubmissions,
      intakeInPeriod,
      totalTasks,
      completedTasksInPeriod,
      overdueTasks,
      auditLogsInPeriod,
    ] = await Promise.all([
      // Total cases
      db.case.count(),
      // New cases in period
      db.case.count({ where: { created_at: { gte: startDate } } }),
      // Cases by status
      db.case.findMany({ select: { status: true } }),
      // Cases by type
      db.case.findMany({ select: { case_type: true } }),
      // Total clients
      db.client.count(),
      // New clients in period
      db.client.count({ where: { created_at: { gte: startDate } } }),
      // Total subscriptions
      db.userSubscription.count(),
      // Active subscriptions
      db.userSubscription.count({ where: { status: 'active' } }),
      // Revenue from cases
      db.case.findMany({ select: { estimated_value: true, created_at: true } }),
      // Total consultations
      db.consultation.count(),
      // Consultations in period
      db.consultation.count({ where: { created_at: { gte: startDate } } }),
      // Total intake submissions
      db.intakeSubmission.count(),
      // Intake submissions in period
      db.intakeSubmission.count({ where: { created_at: { gte: startDate } } }),
      // Total tasks
      db.task.count(),
      // Completed tasks in period
      db.task.count({ where: { status: 'completed', completed_at: { gte: startDate } } }),
      // Overdue tasks
      db.task.count({ where: { due_date: { lt: new Date() }, status: { not: 'completed' } } }),
      // Audit logs in period
      db.auditLog.findMany({
        where: { created_at: { gte: startDate } },
        orderBy: { created_at: 'desc' },
        take: 50,
      }),
    ]);

    // Group cases by status
    const casesByStatusMap: Record<string, number> = {};
    for (const c of casesByStatus) {
      casesByStatusMap[c.status] = (casesByStatusMap[c.status] || 0) + 1;
    }
    const casesByStatusResult = Object.entries(casesByStatusMap).map(([status, count]) => ({ status, count }));

    // Group cases by type
    const casesByTypeMap: Record<string, number> = {};
    for (const c of casesByType) {
      casesByTypeMap[c.case_type] = (casesByTypeMap[c.case_type] || 0) + 1;
    }
    const casesByTypeResult = Object.entries(casesByTypeMap).map(([type, count]) => ({ type, count }));

    // Calculate revenue
    const totalRevenue = revenueData.reduce((sum, c) => sum + (c.estimated_value || 0), 0);
    const revenueInPeriod = revenueData
      .filter((c) => c.created_at >= startDate)
      .reduce((sum, c) => sum + (c.estimated_value || 0), 0);

    // Group audit logs by action
    const auditByActionMap: Record<string, number> = {};
    for (const log of auditLogsInPeriod) {
      auditByActionMap[log.action] = (auditByActionMap[log.action] || 0) + 1;
    }
    const topActions = Object.entries(auditByActionMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([action, count]) => ({ action, count }));

    return apiResponse({
      period,
      startDate,
      summary: {
        totalCases,
        newCasesInPeriod,
        totalClients,
        newClientsInPeriod,
        totalSubscriptions,
        activeSubscriptions,
        totalRevenue,
        revenueInPeriod,
        totalConsultations,
        consultationsInPeriod,
        totalIntakeSubmissions,
        intakeInPeriod,
        totalTasks,
        completedTasksInPeriod,
        overdueTasks,
      },
      casesByStatus: casesByStatusResult,
      casesByType: casesByTypeResult,
      topActions,
      conversionRate: totalIntakeSubmissions > 0
        ? ((totalCases / totalIntakeSubmissions) * 100).toFixed(1)
        : '0',
      subscriptionRate: totalClients > 0
        ? ((activeSubscriptions / totalClients) * 100).toFixed(1)
        : '0',
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return apiError('Failed to load analytics', 500, 'ANALYTICS_ERROR');
  }
}
