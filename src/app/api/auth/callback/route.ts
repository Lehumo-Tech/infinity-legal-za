/**
 * GET /api/auth/callback - Supabase Auth Callback
 *
 * Handles email confirmation, password reset, and OAuth callbacks.
 * Exchanges the auth code from the URL for a session and sets cookies.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

function sanitizeRedirectPath(path: string): string {
  // Only allow relative paths that start with / and don't start with //
  if (!path.startsWith('/') || path.startsWith('//')) {
    return '/';
  }
  // Block any path with protocol-like patterns
  if (path.includes('://') || path.includes('\\')) {
    return '/';
  }
  return path;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = sanitizeRedirectPath(searchParams.get('next') ?? '/');
  const error = searchParams.get('error');

  // Handle error from Supabase — use generic message to avoid information leakage
  if (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent('Authentication failed. Please try again.')}`);
  }

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const response = NextResponse.redirect(`${origin}${next}`);

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    // Exchange the code for a session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Code exchange error:', exchangeError.message);
      return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent('Authentication failed. Please try again.')}`);
    }

    return response;
  }

  // No code in URL - redirect to home
  return NextResponse.redirect(`${origin}`);
}
