/**
 * GET /api/crm - CRM Overview Metrics
 * Returns key metrics, user growth, subscription breakdown, lead funnel, case status, and recent activity.
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, apiResponse, apiError } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return apiError('Database not configured', 503, 'DB_NOT_CONFIGURED');
    }

    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    // Verify admin role
    const adminRoles = ['managing_director', 'admin', 'systems_admin'];
    if (!adminRoles.includes(auth.user.role)) {
      return apiError('Insufficient privileges', 403, 'ROLE_FORBIDDEN');
    }

    // Fetch metrics in parallel
    const [
      totalUsersResult,
      activeSubsResult,
      newLeadsResult,
      userGrowthResult,
      subBreakdownResult,
      leadFunnelResult,
      caseStatusResult,
      recentActivityResult,
      revenueResult,
    ] = await Promise.all([
      // Total users
      db.from('profiles').select('*', { count: 'exact', head: true }),

      // Active subscriptions
      db.from('user_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),

      // New leads (last 30 days)
      db.from('leads').select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),

      // User growth (last 7 days signups)
      (async () => {
        const days: { date: string; count: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
          const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).toISOString();
          const { count } = await db
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', dayStart)
            .lt('created_at', dayEnd);
          days.push({ date: d.toISOString().split('T')[0], count: count || 0 });
        }
        return days;
      })(),

      // Subscription breakdown by status
      (async () => {
        const statuses = ['active', 'past_due', 'cancelled', 'trial', 'expired'];
        const result: { status: string; count: number }[] = [];
        for (const status of statuses) {
          const { count } = await db
            .from('user_subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('status', status);
          if (count && count > 0) {
            result.push({ status, count });
          }
        }
        return result;
      })(),

      // Lead funnel
      (async () => {
        const stages = ['new', 'contacted', 'qualified', 'consultation_scheduled', 'retained'];
        const result: { stage: string; count: number }[] = [];
        for (const stage of stages) {
          const { count } = await db
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('status', stage);
          result.push({ stage, count: count || 0 });
        }
        return result;
      })(),

      // Case status breakdown
      (async () => {
        const { data } = await db
          .from('cases')
          .select('status');
        const counts: Record<string, number> = {};
        (data || []).forEach((row: any) => {
          counts[row.status] = (counts[row.status] || 0) + 1;
        });
        return Object.entries(counts).map(([status, count]) => ({ status, count }));
      })(),

      // Recent activity (last 10)
      db
        .from('audit_logs')
        .select('id, created_at, user_id, action, resource_type, resource_id, details, user:profiles!audit_logs_user_id_fkey(full_name)')
        .order('created_at', { ascending: false })
        .limit(10),

      // Monthly revenue (sum of active subscription amounts)
      (async () => {
        const { data: subs } = await db
          .from('user_subscriptions')
          .select('plan_id')
          .eq('status', 'active');
        let totalRevenue = 0;
        if (subs && subs.length > 0) {
          const planIds = [...new Set(subs.map((s: any) => s.plan_id))];
          const { data: plans } = await db
            .from('pricing_plans')
            .select('id, price_monthly')
            .in('id', planIds);
          const planMap: Record<string, number> = {};
          (plans || []).forEach((p: any) => { planMap[p.id] = p.price_monthly || 0; });
          subs.forEach((s: any) => { totalRevenue += planMap[s.plan_id] || 0; });
        }
        return totalRevenue;
      })(),
    ]);

    const recentActivity = (recentActivityResult.data || []).map((entry: any) => ({
      id: entry.id,
      created_at: entry.created_at,
      user_id: entry.user_id,
      user_name: entry.user?.full_name || null,
      action: entry.action,
      resource_type: entry.resource_type,
      resource_id: entry.resource_id,
      details: entry.details,
    }));

    return apiResponse({
      totalUsers: totalUsersResult.count || 0,
      activeSubscriptions: activeSubsResult.count || 0,
      monthlyRevenue: revenueResult || 0,
      newLeads: newLeadsResult.count || 0,
      userGrowth: userGrowthResult,
      subscriptionBreakdown: subBreakdownResult,
      leadFunnel: leadFunnelResult,
      caseStatusBreakdown: caseStatusResult,
      recentActivity,
    });
  } catch (error) {
    console.error('CRM overview error:', error);
    return apiError('Failed to load CRM data', 500, 'CRM_ERROR');
  }
}
