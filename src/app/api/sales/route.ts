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
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const userRole = auth.user.role as RoleKey;
    if (!ALLOWED_ROLES.includes(userRole)) {
      return apiError('Insufficient role privileges', 403, 'ROLE_FORBIDDEN');
    }

    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoIso = thirtyDaysAgo.toISOString();

    // Run all queries in parallel
    const [
      allLeadsData,
      convertedLeadsResult,
      recentConversionsData,
    ] = await Promise.all([
      // All leads (for grouping by status and source)
      db.from('leads')
        .select('status, source, estimated_value, lead_score, sla_deadline, name, email, updated_at, id')
        .order('updated_at', { ascending: false }),
      // Converted leads count
      db.from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'retained'),
      // Recent conversions (retained, updated last 30 days)
      db.from('leads')
        .select('id, name, email, source, estimated_value, updated_at')
        .eq('status', 'retained')
        .gte('updated_at', thirtyDaysAgoIso)
        .order('updated_at', { ascending: false })
        .limit(10),
    ]);

    const allLeads = allLeadsData.data || [];
    const totalLeads = allLeads.length;
    const convertedLeads = convertedLeadsResult.count || 0;
    const recentConversions = recentConversionsData.data || [];

    // Group by status with counts and sum of estimated_value
    const statusMap: Record<string, { count: number; totalEstimatedValue: number }> = {};
    for (const lead of allLeads) {
      const s = lead.status || 'unknown';
      if (!statusMap[s]) statusMap[s] = { count: 0, totalEstimatedValue: 0 };
      statusMap[s].count++;
      statusMap[s].totalEstimatedValue += lead.estimated_value || 0;
    }
    const pipelineSummary = Object.entries(statusMap).map(([status, data]) => ({
      status,
      count: data.count,
      total_estimated_value: data.totalEstimatedValue,
    }));

    // Group by source with counts
    const sourceMap: Record<string, number> = {};
    for (const lead of allLeads) {
      const src = lead.source || 'unknown';
      sourceMap[src] = (sourceMap[src] || 0) + 1;
    }
    const topLeadSources = Object.entries(sourceMap)
      .sort((a, b) => b[1] - a[1])
      .map(([source, count]) => ({ source, count }));

    // Average lead score
    const totalScore = allLeads.reduce((sum, l) => sum + (l.lead_score || 0), 0);
    const averageLeadScore = totalLeads > 0
      ? Math.round((totalScore / totalLeads) * 10) / 10
      : 0;

    // Revenue by source (retained leads only)
    const revenueSourceMap: Record<string, { revenue: number; convertedCount: number }> = {};
    for (const lead of allLeads.filter((l: any) => l.status === 'retained')) {
      const src = lead.source || 'unknown';
      if (!revenueSourceMap[src]) revenueSourceMap[src] = { revenue: 0, convertedCount: 0 };
      revenueSourceMap[src].revenue += lead.estimated_value || 0;
      revenueSourceMap[src].convertedCount++;
    }
    const revenueBySourceFormatted = Object.entries(revenueSourceMap).map(([source, data]) => ({
      source,
      revenue: data.revenue,
      converted_count: data.convertedCount,
    }));

    // Follow-ups due (sla_deadline <= now, status not in retained/lost/disqualified)
    const followUpStatuses = ['new', 'contacted', 'qualified', 'consultation_scheduled'];
    const followUpsDue = allLeads.filter((l: any) => {
      if (!followUpStatuses.includes(l.status)) return false;
      if (!l.sla_deadline) return false;
      return new Date(l.sla_deadline) <= now;
    }).length;

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
      average_lead_score: averageLeadScore,
      revenue_by_source: revenueBySourceFormatted,
      follow_ups_due: followUpsDue,
      recent_conversions: recentConversions,
    });
  } catch (error) {
    console.error('Sales portal error:', error);
    return apiError('Failed to load sales portal data', 500, 'SALES_PORTAL_ERROR');
  }
}
