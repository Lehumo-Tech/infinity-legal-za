/**
 * GET /api/dashboard - Dashboard statistics via Prisma/SQLite
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, apiResponse, apiError } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    // Run all stat queries in parallel
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
      casesByTypeRaw,
      casesByStatusRaw,
      leadsBySourceRaw,
      recentCases,
      recentLeads,
      revenueResult,
      totalAttorneys,
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
      db.user.count({ where: { role: 'client' } }),
      db.case.groupBy({ by: ['case_type'], _count: { case_type: true } }),
      db.case.groupBy({ by: ['status'], _count: { status: true } }),
      db.lead.groupBy({ by: ['source'], _count: { source: true } }),
      db.case.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        include: {
          client: { select: { full_name: true, email: true } },
          lead_attorney: { select: { full_name: true } },
        },
      }),
      db.lead.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
      }),
      db.case.aggregate({ _sum: { estimated_value: true } }),
      db.attorney.count(),
    ]);

    const totalRevenue = revenueResult._sum.estimated_value || 0;

    const formatGrouped = (data: any[], key: string) =>
      data.map((item: any) => ({ [key]: item[key], count: item._count[key] }));

    const recentCasesData = recentCases.map(c => ({
      id: c.id,
      matter_number: c.matter_number,
      title: c.title,
      case_type: c.case_type,
      urgency: c.urgency,
      status: c.status,
      client: c.client,
      lead_attorney: c.lead_attorney,
      created_at: c.created_at,
    }));

    const recentLeadsData = recentLeads.map(l => ({
      id: l.id,
      name: l.name,
      email: l.email,
      source: l.source,
      status: l.status,
      lead_score: l.lead_score,
      created_at: l.created_at,
    }));

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
        totalRevenue,
      },
      charts: {
        casesByType: formatGrouped(casesByTypeRaw, 'case_type'),
        casesByStatus: formatGrouped(casesByStatusRaw, 'status'),
        leadsBySource: formatGrouped(leadsBySourceRaw, 'source'),
      },
      recent: {
        cases: recentCasesData,
        leads: recentLeadsData,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return apiError('Failed to load dashboard', 500, 'DASHBOARD_ERROR');
  }
}
