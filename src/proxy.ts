/**
 * Infinity Legal ZA - Security Proxy (Next.js 16)
 *
 * Root-level proxy that:
 * 1. Applies security headers to all responses (FAST — no network calls)
 * 2. Refreshes Supabase auth sessions only for protected API routes
 * 3. Protects API routes (blocks unauthenticated access to protected endpoints)
 * 4. Adds CORS headers for API routes
 *
 * PERFORMANCE: Non-API routes (page loads, static files) skip Supabase
 * session verification entirely. This eliminates the 8+ second delay
 * caused by calling getUser() on every request. Auth state is checked
 * client-side via the useAuth hook instead.
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
  '/api/auth/signout',
  '/api/contact',
  '/api/health',
  '/api/payfast/notify', // PayFast server-to-server webhook
  '/api/report',         // Public report
  '/api/pricing',        // Public pricing info
  '/api/ai/intake',      // Public AI intake form on landing page
  '/api/ai/chat',        // Public AI chat (rate-limited for anonymous users)
  '/api/articles',       // Public legal articles
  '/api/holidays',       // Public SA holidays
];

// Allowed origin for CORS
const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_APP_URL || 'https://infinitylegal.org';

// Content Security Policy (updated for PayFast + Supabase)
const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.payfast.co.za https://sandbox.payfast.co.za",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: https: blob:",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://www.payfast.co.za https://sandbox.payfast.co.za https://*.supabase.co wss://*.supabase.co",
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

  // ===== FAST PATH: Non-API routes (page loads, etc.) =====
  // Just add security headers — NO Supabase network calls.
  // Auth state is checked client-side via useAuth hook.
  // This eliminates the 8+ second delay on initial page load.
  if (!pathname.startsWith('/api/')) {
    const response = NextResponse.next({ request });
    addSecurityHeaders(response);
    return response;
  }

  // ===== API ROUTES =====

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Handle CORS preflight requests first (no auth needed)
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    const origin = request.headers.get('origin');
    if (origin && (origin === ALLOWED_ORIGIN || origin === 'http://localhost:3000')) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    response.headers.set('Access-Control-Max-Age', '86400');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    addSecurityHeaders(response);
    return response;
  }

  // Check if this is a public API route
  const isPublicRoute = PUBLIC_API_ROUTES.some(
    route => pathname === route || pathname.startsWith(route + '/')
  );

  // For public API routes, just add headers — no auth check needed
  if (isPublicRoute) {
    const response = NextResponse.next({ request });
    addSecurityHeaders(response);
    addCorsHeaders(response, request);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return response;
  }

  // ===== PROTECTED API ROUTES — Auth check required =====

  // If Supabase is not configured, skip auth but still add security headers
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://placeholder.supabase.co') {
    const response = NextResponse.next({ request });
    addSecurityHeaders(response);
    addCorsHeaders(response, request);
    return response;
  }

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

    // Verify the user's session — only for protected API routes
    const { data: { user } } = await supabase.auth.getUser();

    // Add security headers to all responses
    addSecurityHeaders(response);
    addCorsHeaders(response, request);

    if (!user) {
      // Block unauthenticated access to protected API routes
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required', code: 'AUTH_REQUIRED' } },
        { status: 401 }
      );
    }

    // Cache control for API routes
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  } catch (error) {
    // If Supabase session refresh fails, continue without auth but still add security headers
    console.error('Proxy session refresh error:', error);
    addSecurityHeaders(response);
    addCorsHeaders(response, request);
  }

  return response;
}

function addCorsHeaders(response: NextResponse, request: NextRequest): void {
  const origin = request.headers.get('origin');
  if (origin && (origin === ALLOWED_ORIGIN || origin === 'http://localhost:3000')) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    response.headers.set('Access-Control-Max-Age', '86400');
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|images/|sitemap\\.xml|robots\\.txt).*)',
  ],
};
