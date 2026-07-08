/**
 * GET /api/auth/callback - Auth Callback (legacy Supabase compatibility)
 *
 * With local auth, we don't receive auth codes via OAuth flow.
 * This route now simply redirects to the home page (or `next` param if safe).
 * Kept for backwards compatibility with old email links.
 */

import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_NEXT_PREFIXES = ['/', '/dashboard', '/login', '/signup'];

function isSafeNext(next: string): boolean {
  return ALLOWED_NEXT_PREFIXES.some(prefix => next === prefix || next.startsWith(prefix + '/'));
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get('next') ?? '/';
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle error param
  if (error) {
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(errorDescription || error)}`);
  }

  // Safe redirect
  const safeNext = isSafeNext(next) ? next : '/';
  return NextResponse.redirect(`${origin}${safeNext}`);
}
