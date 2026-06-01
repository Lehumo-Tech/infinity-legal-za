/**
 * Infinity Legal ZA - Subscription Management API
 * GET /api/subscriptions - Get user's current subscription
 * POST /api/subscriptions - Cancel subscription
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, apiResponse, apiError } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

// ============================================
// GET: Retrieve user's current subscription
// ============================================

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = requireAuth(request);
    if (!authResult.authenticated) {
      return authResult.error!;
    }
    const user = authResult.user;

    // Find active or trialing subscription
    const subscription = await db.userSubscription.findFirst({
      where: {
        user_id: user.userId,
        status: { in: ['active', 'trialing', 'past_due'] },
      },
      include: {
        plan: true,
        payment_records: {
          orderBy: { created_at: 'desc' },
          take: 10,
        },
      },
      orderBy: { created_at: 'desc' },
    });

    if (!subscription) {
      return apiResponse({
        subscription: null,
        message: 'No active subscription found',
      });
    }

    // Calculate subscription details
    const now = new Date();
    const periodEnd = subscription.current_period_end;
    const daysRemaining = periodEnd
      ? Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : null;

    return apiResponse({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan: {
          id: subscription.plan.id,
          name: subscription.plan.name,
          slug: subscription.plan.slug,
          price_monthly: subscription.plan.price_monthly,
          price_annual: subscription.plan.price_annual,
          currency: subscription.plan.currency,
          features: subscription.plan.features,
        },
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        days_remaining: daysRemaining,
        created_at: subscription.created_at,
        recent_payments: subscription.payment_records.map((pr) => ({
          id: pr.id,
          m_payment_id: pr.m_payment_id,
          amount_gross: pr.amount_gross,
          payment_status: pr.payment_status,
          billing_cycle: pr.billing_cycle,
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
    // Authenticate user
    const authResult = requireAuth(request);
    if (!authResult.authenticated) {
      return authResult.error!;
    }
    const user = authResult.user;

    // Find active subscription
    const subscription = await db.userSubscription.findFirst({
      where: {
        user_id: user.userId,
        status: { in: ['active', 'trialing', 'past_due'] },
      },
      include: { plan: true },
      orderBy: { created_at: 'desc' },
    });

    if (!subscription) {
      return apiError('No active subscription to cancel', 404, 'NO_SUBSCRIPTION');
    }

    if (subscription.cancel_at_period_end) {
      return apiError('Subscription is already scheduled for cancellation', 400, 'ALREADY_CANCELLING');
    }

    // Mark subscription for cancellation at period end
    // The subscription will remain active until the current period ends
    await db.userSubscription.update({
      where: { id: subscription.id },
      data: {
        cancel_at_period_end: true,
        updated_at: new Date(),
      },
    });

    // Create audit log
    await createAuditLog({
      user_id: user.userId,
      action: 'subscription_cancel_requested',
      resource_type: 'subscription',
      resource_id: subscription.id,
      details: `User requested cancellation of ${subscription.plan.name} subscription. Will cancel at period end: ${subscription.current_period_end?.toISOString() || 'N/A'}`,
    });

    const daysRemaining = subscription.current_period_end
      ? Math.max(0, Math.ceil((subscription.current_period_end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
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
