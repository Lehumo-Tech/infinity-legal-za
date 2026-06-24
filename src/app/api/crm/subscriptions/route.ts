/**
 * GET /api/crm/subscriptions - List all subscriptions with summary
 * Rewritten from Supabase to Prisma/SQLite.
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, apiResponse, apiError } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const adminRoles = ['managing_director', 'systems_admin'];
    if (!adminRoles.includes(auth.user.role)) {
      return apiError('Insufficient privileges', 403, 'ROLE_FORBIDDEN');
    }

    // Fetch all subscriptions with client (→ user) and plan relations
    const subscriptions = await db.userSubscription.findMany({
      take: 200,
      orderBy: { created_at: 'desc' },
      include: {
        client: {
          select: {
            user: {
              select: { full_name: true, email: true },
            },
          },
        },
        plan: {
          select: { name: true, price_monthly: true },
        },
      },
    });

    const subsList = subscriptions.map((sub) => ({
      id: sub.id,
      client_id: sub.client_id,
      user_name: sub.client?.user?.full_name || null,
      user_email: sub.client?.user?.email || '',
      plan_name: sub.plan?.name || 'Unknown',
      plan_id: sub.plan_id,
      status: sub.status,
      current_period_start: sub.current_period_start,
      current_period_end: sub.current_period_end,
      amount: sub.plan?.price_monthly || 0,
      billing_cycle: 'monthly' as const,
      created_at: sub.created_at,
    }));

    // Summary calculations
    const activeCount = subsList.filter(s => s.status === 'active').length;
    const monthlyRevenue = subsList
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + (s.amount || 0), 0);

    // Churn rate: cancelled in last 30 days / total subscriptions
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [cancelledCount, totalCount] = await Promise.all([
      db.userSubscription.count({
        where: {
          status: 'cancelled',
          updated_at: { gte: thirtyDaysAgo },
        },
      }),
      db.userSubscription.count(),
    ]);

    const churnRate = totalCount ? (cancelledCount / totalCount) * 100 : 0;

    return apiResponse({
      subscriptions: subsList,
      summary: {
        activeCount,
        monthlyRevenue,
        churnRate: Math.round(churnRate * 10) / 10,
      },
    });
  } catch (error) {
    console.error('CRM subscriptions error:', error);
    return apiError('Failed to fetch subscriptions', 500, 'SUBS_ERROR');
  }
}
