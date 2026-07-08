/**
 * GET /api/sales - Sales Portal aggregated data
 * Access: admin, managing_director, systems_admin, attorney
 *
 * Uses Prisma to aggregate lead (IntakeSubmission) pipeline data.
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';
import { type RoleKey } from '@/lib/auth';

const ALLOWED_ROLES: RoleKey[] = [
  'admin',
  'managing_director',
  'systems_admin',
  'attorney',
];

interface LeadInfo {
  status: string;
  source: string;
  estimated_value: number | null;
  lead_score: number | null;
  first_name: string;
  last_name: string;
  email: string;
  updated_at: Date;
  id: string;
  next_follow_up?: string | null;
}

function extractLeadInfo(personalInfo: unknown, status: string, estimatedValue: number | null, aiData: unknown, updatedAt: Date, id: string): LeadInfo {
  const pi = (personalInfo && typeof personalInfo === 'object' ? personalInfo : {}) as Record<string, unknown>;
  const ai = (aiData && typeof aiData === 'object' ? aiData : {}) as Record<string, unknown>;
  const fullName = (typeof pi.full_name === 'string' ? pi.full_name : '').trim();
  const parts = fullName.split(/\s+/);
  return {
    status,
    source: typeof pi.source === 'string' ? pi.source : 'website',
    estimated_value: estimatedValue,
    lead_score: typeof pi.lead_score === 'number'
      ? pi.lead_score
      : (typeof ai.confidence === 'number' ? Math.round(ai.confidence * 100) : null),
    first_name: typeof pi.first_name === 'string' ? pi.first_name : parts[0] || '',
    last_name: typeof pi.last_name === 'string' ? pi.last_name : parts.slice(1).join(' ') || '',
    email: typeof pi.email === 'string' ? pi.email : '',
    updated_at: updatedAt,
    id,
    next_follow_up: typeof pi.next_follow_up === 'string' ? pi.next_follow_up : null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const userRole = auth.user.role as RoleKey;
    if (!ALLOWED_ROLES.includes(userRole)) {
      return apiError('Insufficient role privileges', 403, 'ROLE_FORBIDDEN');
    }

    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch all leads (non-draft intake submissions)
    const submissions = await db.intakeSubmission.findMany({
      where: { status: { not: 'draft' } },
      select: {
        id: true,
        status: true,
        estimated_value: true,
        ai_confidence: true,
        personal_info: true,
        ai_extracted_data: true,
        updated_at: true,
        created_at: true,
      },
      orderBy: { updated_at: 'desc' },
    });

    const allLeads = submissions.map(s =>
      extractLeadInfo(s.personal_info, s.status, s.estimated_value, s.ai_extracted_data, s.updated_at, s.id)
    );

    const totalLeads = allLeads.length;
    const convertedLeads = allLeads.filter(l => l.status === 'retained').length;

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
    for (const lead of allLeads.filter(l => l.status === 'retained')) {
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

    // Follow-ups due — use next_follow_up field if present in personal_info
    const followUpStatuses = ['new', 'contacted', 'qualified', 'consultation_scheduled', 'submitted', 'under_review'];
    const followUpsDue = allLeads.filter(l => {
      if (!followUpStatuses.includes(l.status)) return false;
      if (!l.next_follow_up) return false;
      return new Date(l.next_follow_up) <= now;
    }).length;

    // Calculate conversion rate
    const conversionRate = totalLeads > 0
      ? Math.round((convertedLeads / totalLeads) * 100 * 10) / 10
      : 0;

    // Monthly targets — empty until target system is built
    const monthlyTargets: unknown[] = [];

    // Recent conversions (retained, updated last 30 days)
    const recentConversions = allLeads
      .filter(l => l.status === 'retained' && l.updated_at >= thirtyDaysAgo)
      .slice(0, 10)
      .map(l => ({
        id: l.id,
        name: `${l.first_name || ''} ${l.last_name || ''}`.trim(),
        email: l.email,
        source: l.source,
        estimated_value: l.estimated_value,
        updated_at: l.updated_at,
      }));

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
