/**
 * GET /api/sales - Sales Portal aggregated data
 * Access: receptionist, office_administrator, managing_director, senior_partner, associate, legal_officer
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';
import { type RoleKey } from '@/lib/auth';

const ALLOWED_ROLES: RoleKey[] = [
  'receptionist',
  'office_administrator',
  'managing_director',
  'senior_partner',
  'associate',
  'legal_officer',
];

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const userRole = auth.user.role as RoleKey;
    if (!ALLOWED_ROLES.includes(userRole)) {
      return apiError('Insufficient role privileges', 403, 'ROLE_FORBIDDEN');
    }

    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Run all queries in parallel
    const [
      leadsByStatus,
      leadsBySource,
      totalLeads,
      convertedLeads,
      avgLeadScoreResult,
      revenueBySource,
      followUpsDue,
      recentConversions,
    ] = await Promise.all([
      // Leads grouped by status with counts and sum of estimated_value
      db.lead.groupBy({
        by: ['status'],
        _count: { status: true },
        _sum: { estimated_value: true },
      }),
      // Leads grouped by source with counts
      db.lead.groupBy({
        by: ['source'],
        _count: { source: true },
      }),
      // Total leads count
      db.lead.count(),
      // Converted leads count (status: retained)
      db.lead.count({
        where: { status: 'retained' },
      }),
      // Average lead score
      db.lead.aggregate({
        _avg: { lead_score: true },
      }),
      // Revenue by source (retained leads only)
      db.lead.groupBy({
        by: ['source'],
        where: { status: 'retained' },
        _sum: { estimated_value: true },
        _count: { source: true },
      }),
      // Follow-ups due (sla_deadline <= now, status not in retained/lost/disqualified)
      db.lead.count({
        where: {
          sla_deadline: { lte: now },
          status: { notIn: ['retained', 'lost', 'disqualified'] },
        },
      }),
      // Recent conversions (retained, updated last 30 days)
      db.lead.findMany({
        where: {
          status: 'retained',
          updated_at: { gte: thirtyDaysAgo },
        },
        orderBy: { updated_at: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          email: true,
          source: true,
          estimated_value: true,
          updated_at: true,
        },
      }),
    ]);

    // Format pipeline summary from leadsByStatus
    const pipelineSummary = leadsByStatus.map((item) => ({
      status: item.status,
      count: item._count.status,
      total_estimated_value: item._sum.estimated_value || 0,
    }));

    // Format top lead sources from leadsBySource
    const topLeadSources = leadsBySource
      .sort((a, b) => b._count.source - a._count.source)
      .map((item) => ({
        source: item.source,
        count: item._count.source,
      }));

    // Format revenue by source
    const revenueBySourceFormatted = revenueBySource.map((item) => ({
      source: item.source,
      revenue: item._sum.estimated_value || 0,
      converted_count: item._count.source,
    }));

    // Calculate conversion rate
    const conversionRate = totalLeads > 0
      ? Math.round((convertedLeads / totalLeads) * 100 * 10) / 10
      : 0;

    // Monthly targets — empty until target system is built
    const monthlyTargets: any[] = [];

    return apiResponse({
      pipeline_summary: pipelineSummary,
      conversion_rate: conversionRate,
      converted_leads: convertedLeads,
      total_leads: totalLeads,
      monthly_targets: monthlyTargets,
      top_lead_sources: topLeadSources,
      average_lead_score: avgLeadScoreResult._avg.lead_score
        ? Math.round(avgLeadScoreResult._avg.lead_score * 10) / 10
        : 0,
      revenue_by_source: revenueBySourceFormatted,
      follow_ups_due: followUpsDue,
      recent_conversions: recentConversions,
    });
  } catch (error) {
    console.error('Sales portal error:', error);
    return apiError('Failed to load sales portal data', 500, 'SALES_PORTAL_ERROR');
  }
}
