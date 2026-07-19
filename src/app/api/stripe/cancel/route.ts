/**
 * GET /api/stripe/cancel — redirect target when user cancels Stripe checkout.
 */
import { NextResponse } from 'next/server';

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '/';
  const redirect = new URL(appUrl);
  redirect.searchParams.set('payment', 'canceled');
  return NextResponse.redirect(redirect);
}
