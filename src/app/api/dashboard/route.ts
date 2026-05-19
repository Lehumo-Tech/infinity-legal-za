/**
 * GET /api/dashboard - Dashboard statistics via PocketBase
 */

import { NextRequest } from 'next/server';
import { listRecords, countRecords, groupByField, getFullList } from '@/lib/pb-client';
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
      casesByType,
      casesByStatus,
      leadsBySource,
      recentCases,
      recentLeads,
    ] = await Promise.all([
      countRecords('cases'),
      countRecords('cases', "status='active'"),
      countRecords('cases', "status='pending_review'"),
      countRecords('cases', "status='closed'"),
      countRecords('leads'),
      countRecords('leads', "status='new'"),
      countRecords('documents'),
      countRecords('tasks', "status='pending'"),
      countRecords('tasks', "status='overdue'"),
      countRecords('users', "role='client'"),
      groupByField('cases', 'case_type'),
      groupByField('cases', 'status'),
      groupByField('leads', 'source'),
      listRecords('cases', { page: 1, perPage: 5, sort: '-created', expand: 'client_id,lead_attorney_id' }),
      listRecords('leads', { page: 1, perPage: 5, sort: '-created' }),
    ]);

    const formatGrouped = (grouped: Record<string, number>, keyName: string) =>
      Object.entries(grouped).map(([key, count]) => ({ [keyName]: key, count }));

    const recentCasesData = ((recentCases.data as any)?.items || []).map((c: any) => ({
      id: c.id,
      matter_number: c.matter_number,
      title: c.title,
      case_type: c.case_type,
      urgency: c.urgency,
      status: c.status,
      client: c.expand?.client_id ? { full_name: c.expand.client_id.full_name, email: c.expand.client_id.email } : null,
      lead_attorney: c.expand?.lead_attorney_id ? { full_name: c.expand.lead_attorney_id.full_name } : null,
      created_at: c.created,
    }));

    const recentLeadsData = ((recentLeads.data as any)?.items || []).map((l: any) => ({
      id: l.id,
      name: l.name,
      email: l.email,
      source: l.source,
      status: l.status,
      lead_score: l.lead_score,
      created_at: l.created,
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
        totalAttorneys: 0,
        totalRevenue: 0,
      },
      charts: {
        casesByType: formatGrouped(casesByType, 'type'),
        casesByStatus: formatGrouped(casesByStatus, 'status'),
        leadsBySource: formatGrouped(leadsBySource, 'source'),
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
