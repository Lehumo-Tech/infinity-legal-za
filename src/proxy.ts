/**
 * Infinity Legal ZA - Security Middleware (Next.js 16 Proxy)
 * Comprehensive security headers + CORS + Supabase session refresh
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Allowed origin for CORS
const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_APP_URL || 'https://infinitylegal.org';

// Content Security Policy (updated for PayFast + Supabase)
const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.payfast.co.za https://sandbox.payfast.co.za",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: https:",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://www.payfast.co.za https://sandbox.payfast.co.za https://*.supabase.co",
  "frame-ancestors 'self' https: http:",
  "base-uri 'self'",
  "form-action 'self' https://www.payfast.co.za https://sandbox.payfast.co.za",
  "object-src 'none'",
  "media-src 'self'",
  "manifest-src 'self'",
].join('; ');

export async function proxy(request: NextRequest) {
  // Refresh Supabase auth session
  const response = await updateSession(request);

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    response.headers.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    return response;
  }

  // ============================================
  // CORS HEADERS
  // ============================================
  response.headers.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');
  response.headers.set('Access-Control-Allow-Credentials', 'true');

  // ============================================
  // SECURITY HEADERS
  // ============================================
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
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Embedder-Policy', 'credentialless');

  // Cache control for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|images/|sitemap\\.xml|robots\\.txt).*)',
  ],
};
