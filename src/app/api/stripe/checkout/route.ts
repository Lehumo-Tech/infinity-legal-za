/**
 * POST /api/stripe/checkout — create a Stripe Checkout Session for a plan
 *
 * Body: { planSlug, billingCycle, customerEmail, customerName }
 * Auth: required (Bearer token)
 *
 * Returns: { success, data: { url } } — redirect the browser to the URL
 */
import { NextRequest } from 'next/server';
import { apiResponse, apiError, requireAuth, validateCSRF, validateBodySize } from '@/lib/middleware';
import { createCheckoutSession, isStripeEnabled, getStripeStatus } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  // CSRF
  const csrf = validateCSRF(request);
  if (!csrf.valid) return csrf.error!;

  // Auth
  const auth = await requireAuth(request);
  if (!auth.authenticated) return auth.error!;

  // Body size
  const bodyCheck = validateBodySize(request, 4096);
  if (!bodyCheck.valid) return bodyCheck.error!;

  if (!isStripeEnabled) {
    return apiError(
      'Stripe is not configured. Set STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, and STRIPE_PRICE_* in .env',
      503,
      'STRIPE_NOT_CONFIGURED'
    );
  }

  try {
    const body = await request.json();
    const { planSlug, billingCycle, customerEmail, customerName } = body;

    if (!planSlug || !billingCycle || !customerEmail) {
      return apiError('planSlug, billingCycle, and customerEmail are required', 400, 'MISSING_FIELDS');
    }

    const result = await createCheckoutSession({
      planSlug,
      billingCycle: billingCycle === 'annual' ? 'annual' : 'monthly',
      customerEmail,
      customerName,
      userId: auth.user.userId,
    });

    if ('error' in result) {
      return apiError(result.error, 400, 'STRIPE_CHECKOUT_ERROR');
    }

    return apiResponse({ url: result.url, sessionId: result.sessionId });
  } catch (error: any) {
    console.error('[Stripe checkout] error:', error);
    return apiError('Failed to create checkout session', 500, 'STRIPE_CHECKOUT_ERROR');
  }
}

/** GET — status of Stripe integration (for the dashboard integrations panel). */
export async function GET() {
  return apiResponse(getStripeStatus());
}
