/**
 * GET /api/auth/clerk-webhook - Legacy Supabase Auth Callback (misnamed route)
 *
 * With local JWT auth, we don't receive auth codes via OAuth flow.
 * This route simply redirects to the home page (or `next` param if safe).
 * Kept for backwards compatibility with old email links that may still
 * point at this path.
 *
 * Security: `next` is validated against an allow-list to prevent open redirects.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const ALLOWED_NEXT_PREFIXES = ['/', '/dashboard', '/login', '/signup'];

function isSafeNext(next: string): boolean {
  return ALLOWED_NEXT_PREFIXES.some(
    (prefix) => next === prefix || next.startsWith(prefix + '/')
  );
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        const safeNext = isSafeNext(next) ? next : '/';
        return NextResponse.redirect(`${origin}${safeNext}`);
      }
      console.error('Auth callback error:', error.message);
    } catch (err) {
      console.error('Auth callback exception:', err);
    }
  }

  // Return to home on error or missing code
  return NextResponse.redirect(`${origin}/`);
}
