/**
 * Infinity Legal ZA - Subscription Management API (Prisma/SQLite)
 * GET /api/subscriptions - Get user's current subscription
 * POST /api/subscriptions - Create/update subscription (plan selection)
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
    const authResult = await requireAuth(request);
    if (!authResult.authenticated) return authResult.error!;
    const user = authResult.user;

    // Find client profile for this user
    const clientProfile = await db.client.findUnique({
      where: { user_id: user.userId },
    });

    if (!clientProfile) {
      return apiResponse({
        subscription: null,
        message: 'No client profile found',
      });
    }

    // Find active or trialing subscription
    const subscription = await db.userSubscription.findFirst({
      where: {
        client_id: clientProfile.id,
        status: { in: ['active', 'trial', 'past_due'] },
      },
      orderBy: { created_at: 'desc' },
      include: { plan: true },
    });

    if (!subscription) {
      return apiResponse({
        subscription: null,
        message: 'No active subscription found',
        client_status: clientProfile.subscription_status,
      });
    }

    // Fetch recent payment records
    const paymentRecords = await db.paymentRecord.findMany({
      where: { subscription_id: subscription.id },
      orderBy: { created_at: 'desc' },
      take: 10,
    });

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
        plan: subscription.plan
          ? {
              id: subscription.plan.id,
              name: subscription.plan.name,
              slug: subscription.plan.slug,
              price_monthly: subscription.plan.price_monthly,
              price_annual: subscription.plan.price_annual,
              currency: subscription.plan.currency,
              features: subscription.plan.features,
            }
          : null,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        trial_ends_at: subscription.trial_ends_at,
        days_remaining: daysRemaining,
        created_at: subscription.created_at,
        recent_payments: paymentRecords.map((pr) => ({
          id: pr.id,
          payfast_payment_id: pr.payfast_payment_id,
          amount: pr.amount,
          status: pr.status,
          description: pr.description,
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
// POST: Create or update subscription (plan selection)
// ============================================

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.authenticated) return authResult.error!;
    const user = authResult.user;

    const body = await request.json();
    const { plan_id, action } = body;

    // Find or create client profile
    let clientProfile = await db.client.findUnique({
      where: { user_id: user.userId },
    });

    if (!clientProfile) {
      // Auto-create client profile for user
      clientProfile = await db.client.create({
        data: {
          user_id: user.userId,
          subscription_status: 'none',
        },
      });
    }

    // Handle cancel action
    if (action === 'cancel') {
      const subscription = await db.userSubscription.findFirst({
        where: {
          client_id: clientProfile.id,
          status: { in: ['active', 'trial', 'past_due'] },
        },
        orderBy: { created_at: 'desc' },
      });

      if (!subscription) {
        return apiError('No active subscription to cancel', 404, 'NO_SUBSCRIPTION');
      }

      if (subscription.cancel_at_period_end) {
        return apiError('Subscription is already scheduled for cancellation', 400, 'ALREADY_CANCELLING');
      }

      await db.userSubscription.update({
        where: { id: subscription.id },
        data: { cancel_at_period_end: true },
      });

      await createAuditLog({
        user_id: user.userId,
        action: 'subscription_cancel_requested',
        resource_type: 'subscription',
        resource_id: subscription.id,
      });

      return apiResponse({
        message: 'Subscription scheduled for cancellation at end of billing period',
        subscription: {
          id: subscription.id,
          status: subscription.status,
          cancel_at_period_end: true,
          current_period_end: subscription.current_period_end,
        },
      });
    }

    // Create/update subscription with plan selection
    if (!plan_id) {
      return apiError('plan_id is required', 400, 'MISSING_PLAN_ID');
    }

    // Validate plan exists
    const plan = await db.pricingPlan.findUnique({
      where: { id: plan_id },
    });

    if (!plan || !plan.is_active) {
      return apiError('Invalid or inactive plan', 400, 'INVALID_PLAN');
    }

    // Check for existing active subscription
    const existingSub = await db.userSubscription.findFirst({
      where: {
        client_id: clientProfile.id,
        status: { in: ['active', 'trial', 'past_due'] },
      },
      orderBy: { created_at: 'desc' },
    });

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    if (existingSub) {
      // Update existing subscription to new plan
      const updated = await db.userSubscription.update({
        where: { id: existingSub.id },
        data: {
          plan_id: plan.id,
          status: 'active',
          cancel_at_period_end: false,
          current_period_start: now,
          current_period_end: periodEnd,
        },
        include: { plan: true },
      });

      // Update client subscription status
      await db.client.update({
        where: { id: clientProfile.id },
        data: { subscription_status: 'active', plan_id: plan.id },
      });

      await createAuditLog({
        user_id: user.userId,
        action: 'subscription_plan_changed',
        resource_type: 'subscription',
        resource_id: updated.id,
        details: { plan_name: plan.name, plan_slug: plan.slug },
      });

      return apiResponse({
        message: 'Subscription updated successfully',
        subscription: {
          id: updated.id,
          status: updated.status,
          plan: {
            id: plan.id,
            name: plan.name,
            slug: plan.slug,
            price_monthly: plan.price_monthly,
          },
          current_period_start: updated.current_period_start,
          current_period_end: updated.current_period_end,
          cancel_at_period_end: updated.cancel_at_period_end,
        },
      });
    }

    // Create new subscription
    const newSub = await db.userSubscription.create({
      data: {
        client_id: clientProfile.id,
        plan_id: plan.id,
        status: 'active',
        current_period_start: now,
        current_period_end: periodEnd,
      },
      include: { plan: true },
    });

    // Update client subscription status
    await db.client.update({
      where: { id: clientProfile.id },
      data: { subscription_status: 'active', plan_id: plan.id },
    });

    // Generate membership number if not set
    if (!clientProfile.membership_number) {
      const membershipNumber = `INF-${String(Date.now()).slice(-8)}`;
      await db.client.update({
        where: { id: clientProfile.id },
        data: { membership_number: membershipNumber },
      });
    }

    await createAuditLog({
      user_id: user.userId,
      action: 'subscription_created',
      resource_type: 'subscription',
      resource_id: newSub.id,
      details: { plan_name: plan.name, plan_slug: plan.slug },
    });

    return apiResponse({
      message: 'Subscription created successfully',
      subscription: {
        id: newSub.id,
        status: newSub.status,
        plan: {
          id: plan.id,
          name: plan.name,
          slug: plan.slug,
          price_monthly: plan.price_monthly,
        },
        current_period_start: newSub.current_period_start,
        current_period_end: newSub.current_period_end,
        cancel_at_period_end: newSub.cancel_at_period_end,
      },
    }, 201);
  } catch (error) {
    console.error('Create/update subscription error:', error);
    return apiError('Failed to process subscription', 500, 'SUBSCRIPTION_ERROR');
  }
}
