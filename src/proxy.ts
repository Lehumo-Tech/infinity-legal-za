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
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/contact',
  '/api/health',
  '/api/payfast/notify', // PayFast server-to-server webhook
  '/api/report',         // Public report
  '/api/pricing',        // Public pricing info
  '/api/ai/intake',      // Public AI intake form on landing page
  '/api/ai/chat',        // Public AI chat (rate-limited for anonymous users)
  '/api/articles',       // Public legal articles
];

// Allowed origin for CORS
const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_APP_URL || 'https://infinitylegal.org';

// Content Security Policy (updated for PayFast + Supabase)
const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self' https://www.payfast.co.za https://sandbox.payfast.co.za",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: https: blob:",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://www.payfast.co.za https://sandbox.payfast.co.za https://*.supabase.co",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://www.payfast.co.za https://sandbox.payfast.co.za",
  "object-src 'none'",
  "media-src 'self'",
  "manifest-src 'self'",
].join('; ');

// ============================================
// SECURITY HEADERS
// ============================================

function addSecurityHeaders(response: NextResponse): void {
  response.headers.set('Content-Security-Policy', CSP_HEADER);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), ambient-light-sensor=(), autoplay=(), encrypted-media=(), fullscreen=(self), picture-in-picture=()'
  );
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
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

    // Refresh the session — this validates the user's tokens and sets fresh cookies
    const { data: { user } } = await supabase.auth.getUser();

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
        // Block unauthenticated access to protected API routes
        return NextResponse.json(
          { success: false, error: { message: 'Authentication required', code: 'AUTH_REQUIRED' } },
          { status: 401 }
        );
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
