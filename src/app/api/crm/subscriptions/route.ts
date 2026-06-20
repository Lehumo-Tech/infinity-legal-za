/**
 * GET /api/crm/subscriptions - List all subscriptions with summary
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, apiResponse, apiError } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const adminRoles = ['managing_director', 'admin', 'systems_admin'];
    if (!adminRoles.includes(auth.user.role)) {
      return apiError('Insufficient privileges', 403, 'ROLE_FORBIDDEN');
    }

    if (!db) {
      return apiError('Database not configured', 503, 'DB_NOT_CONFIGURED');
    }

    // Fetch all subscriptions with user and plan info
    const { data: subscriptions, error } = await db
      .from('user_subscriptions')
      .select(`
        id,
        user_id,
        plan_id,
        status,
        current_period_start,
        current_period_end,
        created_at,
        profiles!user_subscriptions_user_id_fkey(full_name, email),
        pricing_plans!user_subscriptions_plan_id_fkey(name, price_monthly)
      `)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error('CRM subscriptions query error:', error);
      return apiError('Failed to fetch subscriptions', 500, 'SUBS_FETCH_ERROR');
    }

    const subsList = (subscriptions || []).map((sub: any) => ({
      id: sub.id,
      user_id: sub.user_id,
      user_name: sub.profiles?.full_name || null,
      user_email: sub.profiles?.email || '',
      plan_name: sub.pricing_plans?.name || 'Unknown',
      status: sub.status,
      current_period_start: sub.current_period_start,
      current_period_end: sub.current_period_end,
      amount: sub.pricing_plans?.price_monthly || 0,
      billing_cycle: 'monthly', // Derived default; schema has no billing_cycle column
    }));

    // Summary calculations
    const activeCount = subsList.filter(s => s.status === 'active').length;
    const monthlyRevenue = subsList
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + (s.amount || 0), 0);

    // Churn rate: cancelled in last 30 days / total that existed
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: cancelledCount } = await db
      .from('user_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'cancelled')
      .gte('updated_at', thirtyDaysAgo);

    const { count: totalCount } = await db
      .from('user_subscriptions')
      .select('*', { count: 'exact', head: true });

    const churnRate = totalCount ? ((cancelledCount || 0) / totalCount) * 100 : 0;

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
