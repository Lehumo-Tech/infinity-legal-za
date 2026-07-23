/**
 * Infinity Legal ZA - PayFast Checkout API
 * POST /api/payfast/checkout
 * Creates a PayFast payment form and returns it for frontend redirect
 */

import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireAuth, apiResponse, apiError } from '@/lib/middleware';
import {
  buildPaymentForm,
  getPayFastUrl,
  generatePaymentId,
  formatAmount,
  billingCycleToFrequency,
  getBillingDate,
  calculatePeriodEnd,
  type BillingCycle,
} from '@/lib/payfast';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (!authResult.authenticated) {
      return authResult.error!;
    }
    const user = authResult.user;

    // Parse request body
    const body = await request.json();
    const { planId, planSlug, billingCycle } = body as { planId?: string; planSlug?: string; billingCycle: BillingCycle };

    // Accept either planId (UUID) or planSlug (e.g. 'civil', 'labour', 'extensive')
    // for consistency with /api/stripe/checkout which uses planSlug.
    const planIdentifier = planId || planSlug;
    if (!planIdentifier || !billingCycle) {
      return apiError('planId (or planSlug) and billingCycle are required', 400, 'MISSING_PARAMS');
    }

    if (!['monthly', 'annual'].includes(billingCycle)) {
      return apiError('billingCycle must be "monthly" or "annual"', 400, 'INVALID_BILLING_CYCLE');
    }

    // Fetch the pricing plan — look up by id if it looks like a UUID,
    // otherwise by slug. This maintains backward compatibility with callers
    // that send a UUID while also supporting slug-based lookups.
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(planIdentifier);
    const plan = isUuid
      ? await db.pricingPlan.findUnique({ where: { id: planIdentifier } })
      : await db.pricingPlan.findUnique({ where: { slug: planIdentifier } });

    if (!plan) {
      return apiError('Pricing plan not found', 404, 'PLAN_NOT_FOUND');
    }

    if (!plan.is_active) {
      return apiError('This pricing plan is no longer available', 400, 'PLAN_INACTIVE');
    }

    // Determine amount based on billing cycle
    const amount = billingCycle === 'annual'
      ? (plan.price_annual || plan.price_monthly * 12)
      : plan.price_monthly;

    if (amount <= 0) {
      return apiError('Invalid plan amount', 400, 'INVALID_AMOUNT');
    }

    // Check if user already has a client profile + ANY subscription.
    // UserSubscription.client_id is @unique, so a client can only have one
    // subscription regardless of status (active, trial, cancelled, etc.).
    const clientProfile = await db.client.findUnique({
      where: { user_id: user.userId },
      include: {
        subscriptions: {
          select: { id: true, status: true },
          take: 1,
        },
      },
    });

    if (clientProfile && clientProfile.subscriptions.length > 0) {
      const sub = clientProfile.subscriptions[0];
      const msg = sub.status === 'trial'
        ? 'You already have a pending subscription. Please complete payment or cancel it first.'
        : 'You already have an active subscription. Please cancel it first.';
      return apiError(msg, 409, 'SUBSCRIPTION_EXISTS');
    }

    // Fetch user details for PayFast
    const dbUser = await db.user.findUnique({
      where: { id: user.userId },
      select: { id: true, email: true, full_name: true },
    });

    if (!dbUser) {
      return apiError('User not found', 404, 'USER_NOT_FOUND');
    }

    // If no client profile yet, create one
    let clientId: string;
    if (clientProfile) {
      clientId = clientProfile.id;
    } else {
      const newClient = await db.client.create({
        data: { user_id: user.userId, subscription_status: 'none' },
      });
      clientId = newClient.id;
    }

    // Parse name parts
    const fullName = dbUser.full_name || dbUser.email;
    const nameParts = fullName.split(' ');
    const nameFirst = nameParts[0] || 'User';
    const nameLast = nameParts.slice(1).join(' ') || 'User';

    // Generate unique payment ID
    const mPaymentId = generatePaymentId();

    // Create a pending subscription (trial until ITN confirms)
    const periodStart = new Date();
    const periodEnd = calculatePeriodEnd(periodStart, billingCycle);

    const subscription = await db.userSubscription.create({
      data: {
        client_id: clientId,
        plan_id: plan.id,
        status: 'trial',
        current_period_start: periodStart,
        current_period_end: periodEnd,
        cancel_at_period_end: false,
      },
    });

    // Create a pending payment record
    try {
      await db.paymentRecord.create({
        data: {
          client_id: clientId,
          subscription_id: subscription.id,
          payfast_payment_id: mPaymentId,
          amount,
          status: 'pending',
          description: `${plan.name} - ${billingCycle === 'annual' ? 'Annual' : 'Monthly'}`,
          metadata: {
            billing_cycle: billingCycle,
            plan_name: plan.name,
          } as Prisma.InputJsonValue,
        },
      });
    } catch (paymentErr) {
      console.error('Failed to create payment record:', paymentErr);
      // Roll back the subscription so the user can retry
      await db.userSubscription.delete({ where: { id: subscription.id } }).catch(() => {});
      return apiError('Failed to create checkout session', 500, 'CHECKOUT_ERROR');
    }

    // Build PayFast form data
    const isSubscription = billingCycle === 'monthly';
    const frequency = billingCycleToFrequency(billingCycle);

    const paymentForm = buildPaymentForm({
      name_first: nameFirst,
      name_last: nameLast,
      email_address: dbUser.email,
      m_payment_id: mPaymentId,
      amount: formatAmount(amount),
      item_name: `${plan.name} - ${billingCycle === 'annual' ? 'Annual' : 'Monthly'} Subscription`,
      item_description: `Infinity Legal ZA - ${plan.name} plan, ${billingCycle} billing`,
      // Subscription fields for recurring monthly payments
      ...(isSubscription
        ? {
            subscription_type: 1,
            billing_date: getBillingDate(),
            recurring_amount: formatAmount(amount),
            frequency,
            cycles: 0, // Indefinite
          }
        : {}),
    });

    // Return form data and PayFast URL for frontend redirect
    return apiResponse({
      payfastUrl: getPayFastUrl(),
      formData: paymentForm,
      paymentId: mPaymentId,
      subscriptionId: subscription.id,
      amount: formatAmount(amount),
      currency: 'ZAR',
    }, 200);
  } catch (error) {
    console.error('PayFast checkout error:', error);
    return apiError('Failed to create checkout session', 500, 'CHECKOUT_ERROR');
  }
}
