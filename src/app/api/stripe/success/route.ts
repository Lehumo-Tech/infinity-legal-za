/**
 * GET /api/stripe/success — redirect target after successful Stripe checkout.
 * Stripe redirects here with ?session_id=... — we redirect to the app home.
 */
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session_id');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '/';
  // Redirect to home with a success flag so the UI can show a confirmation
  const redirect = new URL(appUrl);
  redirect.searchParams.set('payment', 'success');
  if (sessionId) redirect.searchParams.set('session_id', sessionId);
  return NextResponse.redirect(redirect);
}
