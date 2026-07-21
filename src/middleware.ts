/**
 * Infinity Legal ZA - Next.js Middleware
 *
 * Root-level middleware that:
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
];

const PUBLIC_PAGE_ROUTES = [
  '/',
];

// ============================================
// SECURITY HEADERS
// ============================================

function addSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.supabase.co",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://*.payfast.co.za https://api.openai.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self' https://*.payfast.co.za",
    ].join('; ')
  );

  // HTTP Strict Transport Security (2 years + preload)
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME-type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // XSS protection (legacy browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy — deny all by default
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
  );

  // Cross-origin policies
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Embedder-Policy', 'credentialless');

  return response;
}

// ============================================
// MAIN MIDDLEWARE
// ============================================

export async function middleware(request: NextRequest) {
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
    let response = NextResponse.next({ request });
    response = addSecurityHeaders(response);
    return response;
  }

  // Create Supabase client for session refresh
  let supabaseResponse = NextResponse.next({ request });

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
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    // Refresh the session — this validates the user's tokens and sets fresh cookies
    const { data: { user } } = await supabase.auth.getUser();

    // Add security headers to all responses
    supabaseResponse = addSecurityHeaders(supabaseResponse);

    // Protect API routes
    if (pathname.startsWith('/api/')) {
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
      const allowedOrigins = [
        process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      ];

      if (origin && allowedOrigins.includes(origin)) {
        supabaseResponse.headers.set('Access-Control-Allow-Origin', origin);
        supabaseResponse.headers.set('Access-Control-Allow-Credentials', 'true');
        supabaseResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        supabaseResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        supabaseResponse.headers.set('Access-Control-Max-Age', '86400');
      }

      // Handle preflight requests
      if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
          status: 204,
          headers: supabaseResponse.headers,
        });
      }
    }
  } catch (error) {
    // If Supabase session refresh fails, continue without auth but still add security headers
    console.error('Middleware session refresh error:', error);
    supabaseResponse = addSecurityHeaders(supabaseResponse);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder assets
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)$).*)',
  ],
};
