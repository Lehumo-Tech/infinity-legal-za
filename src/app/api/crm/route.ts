/**
 * GET /api/crm - CRM Overview Metrics
 * Returns key metrics, user growth, subscription breakdown, lead funnel, case status, and recent activity.
 * Backed by Prisma/SQLite.
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, apiResponse, apiError } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    // Verify admin role
    const adminRoles = ['managing_director', 'systems_admin'];
    if (!adminRoles.includes(auth.user.role)) {
      return apiError('Insufficient privileges', 403, 'ROLE_FORBIDDEN');
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Fetch metrics in parallel
    const [
      totalUsers,
      activeSubscriptions,
      newLeads,
      userGrowthResult,
      subBreakdownResult,
      leadFunnelResult,
      caseStatusResult,
      recentActivityResult,
      revenueResult,
    ] = await Promise.all([
      // Total users
      db.user.count(),

      // Active subscriptions
      db.userSubscription.count({ where: { status: 'active' } }),

      // New leads — IntakeSubmission created in last 30 days
      db.intakeSubmission.count({
        where: { created_at: { gte: thirtyDaysAgo } },
      }),

      // User growth (last 7 days signups)
      (async () => {
        const days: { date: string; count: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
          const count = await db.user.count({
            where: {
              created_at: { gte: dayStart, lt: dayEnd },
            },
          });
          days.push({ date: d.toISOString().split('T')[0], count });
        }
        return days;
      })(),

      // Subscription breakdown by status
      (async () => {
        const statuses = ['active', 'past_due', 'cancelled', 'trial', 'expired'];
        const result: { status: string; count: number }[] = [];
        for (const status of statuses) {
          const count = await db.userSubscription.count({ where: { status } });
          if (count > 0) {
            result.push({ status, count });
          }
        }
        return result;
      })(),

      // Lead funnel — group IntakeSubmission by status
      (async () => {
        const stages = ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'additional_info_needed'];
        const result: { stage: string; count: number }[] = [];
        for (const stage of stages) {
          const count = await db.intakeSubmission.count({ where: { status: stage } });
          result.push({ stage, count });
        }
        return result;
      })(),

      // Case status breakdown — group Case by status
      (async () => {
        const cases = await db.case.findMany({ select: { status: true } });
        const counts: Record<string, number> = {};
        for (const c of cases) {
          counts[c.status] = (counts[c.status] || 0) + 1;
        }
        return Object.entries(counts).map(([status, count]) => ({ status, count }));
      })(),

      // Recent activity (last 10 audit logs with user relation)
      db.auditLog.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        include: {
          user: { select: { full_name: true } },
        },
      }),

      // Monthly revenue — sum of price_monthly from active subscriptions via their plans
      (async () => {
        const activeSubs = await db.userSubscription.findMany({
          where: { status: 'active' },
          select: { plan_id: true },
        });
        if (activeSubs.length === 0) return 0;
        const planIds = [...new Set(activeSubs.map(s => s.plan_id))];
        const plans = await db.pricingPlan.findMany({
          where: { id: { in: planIds } },
          select: { id: true, price_monthly: true },
        });
        const planMap: Record<string, number> = {};
        for (const p of plans) {
          planMap[p.id] = p.price_monthly || 0;
        }
        let totalRevenue = 0;
        for (const s of activeSubs) {
          totalRevenue += planMap[s.plan_id] || 0;
        }
        return totalRevenue;
      })(),
    ]);

    const recentActivity = recentActivityResult.map((entry) => ({
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
      totalUsers,
      activeSubscriptions,
      monthlyRevenue: revenueResult,
      newLeads,
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
