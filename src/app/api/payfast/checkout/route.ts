/**
 * Infinity Legal ZA - PayFast Checkout API
 * POST /api/payfast/checkout
 * Creates a PayFast payment form and returns it for frontend redirect
 */

import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/api-client';
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
    const db = getAdminClient();
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    // Authenticate user (async for Supabase)
    const authResult = await requireAuth(request);
    if (!authResult.authenticated) {
      return authResult.error!;
    }
    const user = authResult.user;

    // Parse request body
    const body = await request.json();
    const { planId, billingCycle } = body as { planId: string; billingCycle: BillingCycle };

    if (!planId || !billingCycle) {
      return apiError('planId and billingCycle are required', 400, 'MISSING_PARAMS');
    }

    if (!['monthly', 'annual'].includes(billingCycle)) {
      return apiError('billingCycle must be "monthly" or "annual"', 400, 'INVALID_BILLING_CYCLE');
    }

    // Fetch the pricing plan
    const { data: plan, error: planError } = await db
      .from('pricing_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
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

    // Check if user already has an active subscription
    const { data: existingSub } = await db
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', user.userId)
      .eq('status', 'active')
      .maybeSingle();

    if (existingSub) {
      return apiError('You already have an active subscription. Please cancel it first.', 409, 'SUBSCRIPTION_EXISTS');
    }

    // Fetch user details for PayFast
    const { data: dbUser, error: userError } = await db
      .from('profiles')
      .select('*')
      .eq('id', user.userId)
      .single();

    if (userError || !dbUser) {
      return apiError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Parse name parts
    const fullName = dbUser.full_name || dbUser.email;
    const nameParts = fullName.split(' ');
    const nameFirst = nameParts[0] || 'User';
    const nameLast = nameParts.slice(1).join(' ') || 'User';

    // Generate unique payment ID
    const mPaymentId = generatePaymentId();

    // Create a pending subscription
    const periodStart = new Date();
    const periodEnd = calculatePeriodEnd(periodStart, billingCycle);

    const { data: subscription, error: subError } = await db
      .from('user_subscriptions')
      .insert({
        user_id: user.userId,
        plan_id: planId,
        status: 'trial', // Will be set to active on ITN confirmation
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
      })
      .select()
      .single();

    if (subError || !subscription) {
      console.error('Failed to create subscription:', subError);
      return apiError('Failed to create checkout session', 500, 'CHECKOUT_ERROR');
    }

    // Create a pending payment record
    const { error: paymentError } = await db
      .from('payment_records')
      .insert({
        user_id: user.userId,
        subscription_id: subscription.id,
        payfast_payment_id: mPaymentId,
        amount,
        status: 'pending',
        description: `${plan.name} - ${billingCycle === 'annual' ? 'Annual' : 'Monthly'}`,
        metadata: { billing_cycle: billingCycle, plan_name: plan.name },
      });

    if (paymentError) {
      console.error('Failed to create payment record:', paymentError);
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
