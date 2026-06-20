/**
 * Infinity Legal ZA - Subscription Management API
 * GET /api/subscriptions - Get user's current subscription
 * POST /api/subscriptions - Cancel subscription
 */

import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/api-client';
import { requireAuth, apiResponse, apiError } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

// ============================================
// GET: Retrieve user's current subscription
// ============================================

export async function GET(request: NextRequest) {
  try {
    // Authenticate user (async for Supabase)
    const authResult = await requireAuth(request);
    if (!authResult.authenticated) {
      return authResult.error!;
    }
    const user = authResult.user;

    const db = getAdminClient();
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    // Find active or trialing subscription
    const { data: subscriptions, error: subError } = await db
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.userId)
      .in('status', ['active', 'trial', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (subError) {
      console.error('Subscription query error:', subError);
      return apiError('Failed to retrieve subscription', 500, 'SUBSCRIPTION_FETCH_ERROR');
    }

    const subscription = (subscriptions || [])[0];

    if (!subscription) {
      return apiResponse({
        subscription: null,
        message: 'No active subscription found',
      });
    }

    // Fetch plan details
    const { data: plan } = await db
      .from('pricing_plans')
      .select('*')
      .eq('id', subscription.plan_id)
      .single();

    // Fetch recent payment records
    const { data: paymentRecords } = await db
      .from('payment_records')
      .select('id, payfast_payment_id, amount, status, metadata, created_at')
      .eq('subscription_id', subscription.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Calculate subscription details
    const now = new Date();
    const periodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end)
      : null;
    const daysRemaining = periodEnd
      ? Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : null;

    return apiResponse({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan: plan ? {
          id: plan.id,
          name: plan.name,
          slug: plan.slug,
          price_monthly: plan.price_monthly,
          price_annual: plan.price_annual,
          currency: plan.currency,
          features: plan.features,
        } : null,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        days_remaining: daysRemaining,
        created_at: subscription.created_at,
        recent_payments: (paymentRecords || []).map((pr: any) => ({
          id: pr.id,
          payfast_payment_id: pr.payfast_payment_id,
          amount: pr.amount,
          status: pr.status,
          billing_cycle: pr.metadata?.billing_cycle || null,
          created_at: pr.created_at,
        })),
      },
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    return apiError('Failed to retrieve subscription', 500, 'SUBSCRIPTION_FETCH_ERROR');
  }
}

// ============================================
// POST: Cancel subscription
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Authenticate user (async for Supabase)
    const authResult = await requireAuth(request);
    if (!authResult.authenticated) {
      return authResult.error!;
    }
    const user = authResult.user;

    const db = getAdminClient();
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    // Find active subscription
    const { data: subscriptions } = await db
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.userId)
      .in('status', ['active', 'trial', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1);

    const subscription = (subscriptions || [])[0];

    if (!subscription) {
      return apiError('No active subscription to cancel', 404, 'NO_SUBSCRIPTION');
    }

    if (subscription.cancel_at_period_end) {
      return apiError('Subscription is already scheduled for cancellation', 400, 'ALREADY_CANCELLING');
    }

    // Fetch plan for audit log
    const { data: plan } = await db
      .from('pricing_plans')
      .select('name')
      .eq('id', subscription.plan_id)
      .single();

    // Mark subscription for cancellation at period end
    // The subscription will remain active until the current period ends
    const { error: updateError } = await db
      .from('user_subscriptions')
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('Failed to cancel subscription:', updateError);
      return apiError('Failed to cancel subscription', 500, 'SUBSCRIPTION_CANCEL_ERROR');
    }

    // Create audit log
    await createAuditLog({
      user_id: user.userId,
      action: 'subscription_cancel_requested',
      resource_type: 'subscription',
      resource_id: subscription.id,
      details: `User requested cancellation of ${plan?.name || 'unknown'} subscription. Will cancel at period end: ${subscription.current_period_end || 'N/A'}`,
    });

    const periodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end)
      : null;
    const daysRemaining = periodEnd
      ? Math.max(0, Math.ceil((periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : null;

    return apiResponse({
      message: 'Subscription scheduled for cancellation at end of billing period',
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancel_at_period_end: true,
        current_period_end: subscription.current_period_end,
        days_remaining: daysRemaining,
      },
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return apiError('Failed to cancel subscription', 500, 'SUBSCRIPTION_CANCEL_ERROR');
  }
}
