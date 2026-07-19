/**
 * Infinity Legal ZA - Security Proxy (Next.js 16)
 *
 * Root-level proxy that:
 * 1. Refreshes Supabase auth sessions (cookie-based)
 * 2. Applies security headers to all responses
 * 3. Protects API routes (blocks unauthenticated access to protected endpoints)
 * 4. Adds CORS headers for API routes
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// ============================================
// PUBLIC ROUTES (no auth required)
// ============================================

const PUBLIC_API_ROUTES = [
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/callback',
  '/api/auth/auto-confirm', // Auto-confirm email after signup
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/signout',
  '/api/auth/profile',      // Reads auth-token cookie itself; must be reachable for session check
  '/api/contact',
  '/api/health',
  '/api/payfast/notify',    // PayFast server-to-server webhook
  '/api/payfast/success',   // PayFast return URL (browser redirect, no auth header)
  '/api/payfast/cancel',    // PayFast return URL (browser redirect, no auth header)
  '/api/stripe/webhook',    // Stripe server-to-server webhook (signature-verified, no auth header)
  '/api/stripe/success',    // Stripe return URL (browser redirect)
  '/api/stripe/cancel',     // Stripe return URL (browser redirect)
  '/api/report',            // Public report
  '/api/pricing',           // Public pricing info
  '/api/ai/intake',         // Public AI intake form on landing page
  '/api/intake',            // Public intake form (creates lead + case + AI analysis)
  '/api/ai/chat',           // Public AI chat (rate-limited for anonymous users)
  '/api/articles',          // Public legal articles
  '/api/holidays',          // Public holiday utility
];

// Allowed origin for CORS
const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_APP_URL || 'https://infinitylegal.org';

// Content Security Policy (updated for Stripe + Resend + PostHog + Sentry + Clerk)
const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://js.stripe.com/v3 https://www.payfast.co.za https://sandbox.payfast.co.za https://app.posthog.com https://browser.sentry-cdn.com https://clerk.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: https: blob:",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://js.stripe.com https://api.stripe.com https://www.payfast.co.za https://sandbox.payfast.co.za https://*.supabase.co https://app.posthog.com https://*.posthog.com https://o1.ingest.sentry.io https://*.ingest.sentry.io https://api.resend.com https://api.pinecone.io https://*.clerk.accounts.dev https://clerk.infinitylegal.org",
  "frame-ancestors 'self' https://*.space-z.ai http://*.space-z.ai",
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://*.clerk.accounts.dev",
  "base-uri 'self'",
  "form-action 'self' https://www.payfast.co.za https://sandbox.payfast.co.za https://js.stripe.com https://api.stripe.com",
  "object-src 'none'",
  "media-src 'self'",
  "manifest-src 'self'",
].join('; ');

// ============================================
// SECURITY HEADERS
// ============================================

function addSecurityHeaders(response: NextResponse): void {
  response.headers.set('Content-Security-Policy', CSP_HEADER);
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), ambient-light-sensor=(), autoplay=(), encrypted-media=(), fullscreen=(self), picture-in-picture=()'
  );
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  response.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
  // Note: COEP removed — it blocks cross-origin resources (preview iframe chunks)
}

// ============================================
// MAIN PROXY
// ============================================

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') // static files with extensions
  ) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase is not configured, skip session refresh but still add security headers
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://placeholder.supabase.co') {
    const response = NextResponse.next({ request });
    addSecurityHeaders(response);
    return response;
  }

  // Create Supabase client for session refresh
  let response = NextResponse.next({ request });

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Update request cookies for downstream
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Create new response with updated cookies
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    // Refresh the session — with a 3-second timeout to prevent blocking page loads
    // When Supabase is unreachable, we must not block the entire page load
    let user: any = null;
    try {
      const userResult = await Promise.race([
        supabase.auth.getUser(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
      ]);
      if (userResult && typeof userResult === 'object' && 'data' in userResult) {
        user = userResult.data?.user ?? null;
      }
    } catch {
      // Session refresh failed — continue without auth
    }

    // LOCAL AUTH FALLBACK: if Supabase didn't find a session, check for the
    // local auth-token cookie. This lets locally-authenticated users through
    // the proxy gate; the route handler's requireAuth() does the real JWT
    // validation. Without this, all authenticated API calls 401 at the proxy.
    if (!user) {
      const localToken = request.cookies.get('auth-token')?.value;
      if (localToken) {
        user = { _localAuth: true }; // sentinel — just to pass the !user gate
      }
    }

    // Add security headers to all responses
    addSecurityHeaders(response);

    // Handle CORS preflight requests for API routes
    if (pathname.startsWith('/api/')) {
      if (request.method === 'OPTIONS') {
        const origin = request.headers.get('origin');
        if (origin && (origin === ALLOWED_ORIGIN || origin === 'http://localhost:3000')) {
          response.headers.set('Access-Control-Allow-Origin', origin);
        }
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        response.headers.set('Access-Control-Max-Age', '86400');
        response.headers.set('Access-Control-Allow-Credentials', 'true');
        return new NextResponse(null, { status: 204, headers: response.headers });
      }

      // Check if this is a public API route
      const isPublicRoute = PUBLIC_API_ROUTES.some(
        route => pathname === route || pathname.startsWith(route + '/')
      );

      if (!isPublicRoute && !user) {
        // Check for Bearer token as fallback — the route handler's requireAuth() will validate it
        const authHeader = request.headers.get('Authorization');
        const hasBearerToken = authHeader?.startsWith('Bearer ');

        if (!hasBearerToken) {
          // No cookie session AND no Bearer token — block access
          return NextResponse.json(
            { success: false, error: { message: 'Authentication required', code: 'AUTH_REQUIRED' } },
            { status: 401 }
          );
        }
        // Has Bearer token — let the request through; route handler will validate it
      }

      // Add CORS headers for API routes
      const origin = request.headers.get('origin');
      if (origin && (origin === ALLOWED_ORIGIN || origin === 'http://localhost:3000')) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Credentials', 'true');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        response.headers.set('Access-Control-Max-Age', '86400');
      }

      // Cache control for API routes
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
    }
  } catch (error) {
    // If Supabase session refresh fails, continue without auth but still add security headers
    console.error('Proxy session refresh error:', error);
    addSecurityHeaders(response);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|images/|sitemap\\.xml|robots\\.txt).*)',
  ],
};
