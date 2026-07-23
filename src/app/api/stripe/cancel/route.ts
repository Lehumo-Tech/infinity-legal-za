/**
 * GET /api/stripe/cancel — redirect target when user cancels Stripe checkout.
 */
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Derive base URL from the request so this works even when
  // NEXT_PUBLIC_APP_URL is not configured (e.g. in dev/preview).
  const reqUrl = new URL(request.url);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${reqUrl.protocol}//${reqUrl.host}`;
  const redirect = new URL(appUrl);
  redirect.searchParams.set('payment', 'canceled');
  return NextResponse.redirect(redirect);
}
