/**
 * Stripe Payments — Infinity Legal ZA
 *
 * Conditionally enabled: when STRIPE_SECRET_KEY is set, Stripe handles all
 * payments (checkout sessions, subscriptions, webhooks). When absent, the
 * payment routes return a clear "not configured" response.
 *
 * To activate Stripe:
 * 1. Create an account at https://dashboard.stripe.com
 * 2. Copy your Secret Key (sk_test_... or sk_live_...)
 * 3. Add to .env:
 *      STRIPE_SECRET_KEY=sk_test_...
 *      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
 *      STRIPE_WEBHOOK_SECRET=whsec_...   (from Stripe Dashboard → Webhooks)
 *      STRIPE_PRICE_CIVIL=price_...       (recurring prices for each plan)
 *      STRIPE_PRICE_LABOUR=price_...
 *      STRIPE_PRICE_EXTENSIVE=price_...
 * 4. Configure the webhook endpoint at https://dashboard.stripe.com/webhooks
 *    pointing to https://yourdomain.com/api/stripe/webhook
 *    with events: checkout.session.completed, customer.subscription.updated,
 *    customer.subscription.deleted, invoice.payment_succeeded
 */

import Stripe from 'stripe';

// ============================================
// CONFIG
// ============================================

export const isStripeEnabled: boolean = !!process.env.STRIPE_SECRET_KEY;
export const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
export const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

/** Map plan slugs → Stripe Price IDs from env. */
export const stripePriceMap: Record<string, string> = {
  civil_legal_plan: process.env.STRIPE_PRICE_CIVIL || '',
  labour_legal_plan: process.env.STRIPE_PRICE_LABOUR || '',
  extensive_plan: process.env.STRIPE_PRICE_EXTENSIVE || '',
};

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://infinitylegal.org';

// ============================================
// LAZY SINGLETON
// ============================================

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!isStripeEnabled) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-09-30.clover' as Stripe.LatestApiVersion,
      typescript: true,
    });
  }
  return stripeClient;
}

// ============================================
// CHECKOUT SESSION
// ============================================

export interface CreateCheckoutParams {
  planSlug: string;
  billingCycle: 'monthly' | 'annual';
  customerEmail: string;
  customerName?: string;
  userId: string;
  clientId?: string;
}

export async function createCheckoutSession(
  params: CreateCheckoutParams
): Promise<{ url: string; sessionId: string } | { error: string }> {
  const stripe = getStripe();
  if (!stripe) return { error: 'Stripe is not configured' };

  const priceId = stripePriceMap[params.planSlug];
  if (!priceId) return { error: `No Stripe price configured for plan "${params.planSlug}"` };

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${APP_URL}/api/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/api/stripe/cancel`,
      customer_email: params.customerEmail,
      client_reference_id: params.userId,
      subscription_data: {
        metadata: {
          userId: params.userId,
          clientId: params.clientId || '',
          planSlug: params.planSlug,
          billingCycle: params.billingCycle,
        },
      },
      metadata: {
        userId: params.userId,
        clientId: params.clientId || '',
        planSlug: params.planSlug,
        billingCycle: params.billingCycle,
        customerName: params.customerName || '',
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    });

    return { url: session.url!, sessionId: session.id };
  } catch (error: any) {
    console.error('[Stripe] createCheckoutSession error:', error.message);
    return { error: error.message };
  }
}

// ============================================
// CUSTOMER PORTAL (manage subscriptions)
// ============================================

export async function createBillingPortalSession(
  customerId: string
): Promise<{ url: string } | { error: string }> {
  const stripe = getStripe();
  if (!stripe) return { error: 'Stripe is not configured' };

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${APP_URL}/`,
    });
    return { url: session.url };
  } catch (error: any) {
    console.error('[Stripe] billingPortal error:', error.message);
    return { error: error.message };
  }
}

// ============================================
// STATUS HELPER
// ============================================

export function getStripeStatus() {
  return {
    enabled: isStripeEnabled,
    publishableKeyConfigured: !!stripePublishableKey,
    webhookSecretConfigured: !!stripeWebhookSecret,
    pricesConfigured: {
      civil: !!stripePriceMap.civil_legal_plan,
      labour: !!stripePriceMap.labour_legal_plan,
      extensive: !!stripePriceMap.extensive_plan,
    },
  };
}
