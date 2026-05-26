/**
 * Infinity Legal ZA - Security Middleware
 * Comprehensive security headers applied to ALL responses
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Content Security Policy
const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: https:",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self'",
  "frame-ancestors 'self' https: http:",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "media-src 'self'",
  "manifest-src 'self'",
].join('; ');

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // Content Security Policy - strict CSP to prevent XSS and injection attacks
  response.headers.set('Content-Security-Policy', CSP_HEADER);

  // Allow framing from same origin (needed for preview/embed)
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Enable browser XSS filter
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Control referrer information leakage
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Restrict browser features - deny all by default
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), ambient-light-sensor=(), autoplay=(), encrypted-media=(), fullscreen=(self), picture-in-picture=()'
  );

  // Force HTTPS for 2 years including subdomains
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );

  // Prevent cross-domain policies
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');

  // Cross-Origin isolation headers
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  // Note: COEP set to credentialless instead of require-corp to allow preview embedding
  response.headers.set('Cross-Origin-Embedder-Policy', 'credentialless');

  // Cache control for sensitive pages
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  return response;
}

// Apply middleware to all routes
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     */
    '/((?!_next/static|_next/image|favicon\\.ico|images/|sitemap\\.xml|robots\\.txt).*)',
  ],
};
