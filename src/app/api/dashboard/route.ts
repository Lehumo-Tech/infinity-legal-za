/**
 * GET /api/dashboard - Dashboard statistics
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/middleware';
import { apiResponse, apiError } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const [
      totalCases,
      activeCases,
      pendingCases,
      closedCases,
      totalLeads,
      newLeads,
      totalDocuments,
      pendingTasks,
      overdueTasks,
      totalClients,
      totalAttorneys,
      revenueData,
      casesByType,
      casesByStatus,
      leadsBySource,
      recentCases,
      recentLeads,
      upcomingDeadlines,
    ] = await Promise.all([
      db.case.count(),
      db.case.count({ where: { status: 'active' } }),
      db.case.count({ where: { status: 'pending_review' } }),
      db.case.count({ where: { status: 'closed' } }),
      db.lead.count(),
      db.lead.count({ where: { status: 'new' } }),
      db.document.count(),
      db.task.count({ where: { status: 'pending' } }),
      db.task.count({ where: { status: 'overdue' } }),
      db.user.count({ where: { role: 'client', is_active: true } }),
      db.attorney.count({ where: { is_verified: true } }),
      db.case.aggregate({ where: { estimated_value: { not: null } }, _sum: { estimated_value: true } }),
      db.case.groupBy({ by: ['case_type'], _count: { case_type: true } }),
      db.case.groupBy({ by: ['status'], _count: { status: true } }),
      db.lead.groupBy({ by: ['source'], _count: { source: true } }),
      db.case.findMany({ take: 5, orderBy: { created_at: 'desc' }, include: { client: { select: { full_name: true, email: true } }, lead_attorney: { select: { full_name: true } } } }),
      db.lead.findMany({ take: 5, orderBy: { created_at: 'desc' } }),
      db.task.findMany({ where: { due_date: { gte: new Date() }, status: { in: ['pending', 'in_progress'] } }, take: 5, orderBy: { due_date: 'asc' }, include: { assignee: { select: { full_name: true } } } }),
    ]);

    return apiResponse({
      stats: {
        totalCases,
        activeCases,
        pendingCases,
        closedCases,
        totalLeads,
        newLeads,
        totalDocuments,
        pendingTasks,
        overdueTasks,
        totalClients,
        totalAttorneys,
        totalRevenue: revenueData._sum.estimated_value || 0,
      },
      charts: {
        casesByType: casesByType.map(c => ({ type: c.case_type, count: c._count.case_type })),
        casesByStatus: casesByStatus.map(c => ({ status: c.status, count: c._count.status })),
        leadsBySource: leadsBySource.map(l => ({ source: l.source, count: l._count.source })),
      },
      recent: {
        cases: recentCases,
        leads: recentLeads,
        deadlines: upcomingDeadlines,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return apiError('Failed to load dashboard', 500, 'DASHBOARD_ERROR');
  }
}
