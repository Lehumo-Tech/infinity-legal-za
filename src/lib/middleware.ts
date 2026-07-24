/**
 * Infinity Legal ZA - API Middleware (Local JWT auth)
 * Auth validation, rate limiting, input validation, audit tracking
 *
 * SECURITY: Auth uses Bearer token (local JWT, validated against the SQLite
 * User table via validateLocalToken). Supabase has been removed.
 */

import { NextRequest, NextResponse } from 'next/server';
import { hasPermission, type RoleKey, type PermissionKey } from '@/lib/auth';
import { apiRateLimiter, sanitizeObject } from '@/lib/security';
import { validateLocalToken } from '@/lib/local-auth';

// ============================================
// API RESPONSE HELPERS
// ============================================

export function apiResponse(data: unknown, status: number = 200, headers?: Record<string, string>) {
  return NextResponse.json(
    { success: true, data },
    { status, headers: { 'Content-Type': 'application/json', ...headers } }
  );
}

export function apiError(message: string, status: number = 400, code?: string) {
  return NextResponse.json(
    { success: false, error: { message, code: code || `HTTP_${status}` } },
    { status }
  );
}

export function paginatedResponse(data: unknown[], pagination: {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}, status: number = 200) {
  return NextResponse.json(
    { success: true, data, pagination },
    { status, headers: { 'Content-Type': 'application/json' } }
  );
}

// ============================================
// PAGINATION HELPER
// ============================================

export function getPaginationParams(request: NextRequest) {
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const perPage = Math.min(100, Math.max(1, parseInt(url.searchParams.get('perPage') || '20')));
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  return { page, perPage, from, to };
}

export function createPaginationResult(total: number, page: number, perPage: number) {
  return {
    page,
    perPage,
    total,
    totalPages: Math.ceil(total / perPage),
  };
}

// ============================================
// AUTH PAYLOAD TYPE
// ============================================

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
  department?: string;
}

type AuthSuccess = { authenticated: true; user: AuthPayload; error: null };
type AuthFailure = { authenticated: false; user: null; error: ReturnType<typeof apiError> };
type AuthResult = AuthSuccess | AuthFailure;

// ============================================
// MIDDLEWARE: AUTHENTICATION
// ============================================

/**
 * Require authentication — validates the Bearer token (local JWT) against the
 * SQLite User table via validateLocalToken.
 */
export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = await validateLocalToken(token);
    if (payload) {
      return {
        authenticated: true,
        user: {
          userId: payload.userId,
          email: payload.email,
          role: payload.role,
          department: undefined,
        },
        error: null,
      };
    }
  }

  return { authenticated: false, user: null, error: apiError('Authentication required', 401, 'AUTH_REQUIRED') };
}

// ============================================
// MIDDLEWARE: AUTHORIZATION
// ============================================

export function requirePermission(role: string, permission: PermissionKey) {
  if (!hasPermission(role as RoleKey, permission)) {
    return apiError('Insufficient permissions', 403, 'FORBIDDEN');
  }
  return null;
}

export function requireRoles(role: string, allowedRoles: RoleKey[]) {
  if (!allowedRoles.includes(role as RoleKey)) {
    return apiError('Insufficient role privileges', 403, 'ROLE_FORBIDDEN');
  }
  return null;
}

// ============================================
// MIDDLEWARE: RATE LIMITING
// ============================================

export async function checkRateLimit(request: NextRequest, limiter = apiRateLimiter) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const endpoint = new URL(request.url).pathname;
  const key = `${ip}:${endpoint}`;

  const result = await limiter.check(key);
  if (!result.allowed) {
    return {
      allowed: false,
      error: apiError('Rate limit exceeded', 429, 'RATE_LIMITED'),
      headers: {
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': result.resetAt.toString(),
        'Retry-After': Math.ceil((result.resetAt - Date.now()) / 1000).toString(),
      },
    };
  }

  return {
    allowed: true,
    error: null,
    headers: {
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': result.resetAt.toString(),
    },
  };
}

// ============================================
// MIDDLEWARE: INPUT VALIDATION
// ============================================

export function validateInput<T extends Record<string, unknown>>(
  data: T,
  rules: Record<string, { required?: boolean; type?: string; min?: number; max?: number; pattern?: RegExp }>
): { valid: boolean; errors: Record<string, string>; sanitized: T } {
  const errors: Record<string, string> = {};
  const sanitized = sanitizeObject(data);

  for (const [field, rule] of Object.entries(rules)) {
    const value = sanitized[field];
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors[field] = `${field} is required`;
      continue;
    }
    if (value === undefined || value === null) continue;
    if (rule.type && typeof value !== rule.type) {
      errors[field] = `${field} must be a ${rule.type}`;
      continue;
    }
    if (typeof value === 'string') {
      if (rule.min && value.length < rule.min) errors[field] = `${field} must be at least ${rule.min} characters`;
      if (rule.max && value.length > rule.max) errors[field] = `${field} must be at most ${rule.max} characters`;
      if (rule.pattern && !rule.pattern.test(value)) errors[field] = `${field} format is invalid`;
    }
  }

  return { valid: Object.keys(errors).length === 0, errors, sanitized };
}

// ============================================
// MIDDLEWARE: REQUEST BODY SIZE CHECK
// ============================================

/**
 * Validate request body size to prevent oversized payload attacks.
 * Call this before request.json() in API handlers.
 */
export function validateBodySize(request: NextRequest, maxBytes: number = 10 * 1024 * 1024): { valid: boolean; error: ReturnType<typeof apiError> | null } {
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > maxBytes) {
    return {
      valid: false,
      error: apiError(`Request body too large (max ${Math.round(maxBytes / 1024 / 1024)}MB)`, 413, 'PAYLOAD_TOO_LARGE'),
    };
  }
  return { valid: true, error: null };
}

// ============================================
// MIDDLEWARE: CSRF PROTECTION
// ============================================

/**
 * Validate CSRF token for state-changing requests (POST, PUT, PATCH, DELETE).
 * Checks that the Origin/Referer header matches the application's domain.
 * This is a simple but effective CSRF protection for cookie-based auth.
 */
export function validateCSRF(request: NextRequest): { valid: boolean; error: ReturnType<typeof apiError> | null } {
  const method = request.method.toUpperCase();

  // Only check state-changing methods
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return { valid: true, error: null };
  }

  // Skip CSRF for API routes that use Bearer token auth (they're not vulnerable to CSRF)
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return { valid: true, error: null };
  }

  // For cookie-based auth, verify Origin/Referer matches our domain
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Derive the request's own host as an allowed origin (covers any deployment URL).
  // Prefer x-forwarded-host (set by the preview gateway / reverse proxy) over the
  // rewritten host header, so CSRF passes when the site runs inside the preview iframe.
  const requestHost = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const requestProto = request.headers.get('x-forwarded-proto') || 'https';
  const requestOrigin = requestHost ? `${requestProto}://${requestHost}` : null;

  const allowedOrigins = [
    appUrl,
    'http://localhost:3000',
    'https://infinitylegal.org',
    'https://www.infinitylegal.org',
    requestOrigin,
  ].filter(Boolean) as string[];

  // Allow the sandbox preview environment (preview-chat-*.space-z.ai) — the app
  // is served through this gateway in the preview panel, so the browser's Origin
  // header is the space-z.ai domain even though the app itself is localhost:3000.
  const isPreviewOrigin = (o: string | null): boolean => {
    if (!o) return false;
    try {
      const u = new URL(o);
      return u.hostname.endsWith('.space-z.ai');
    } catch {
      return false;
    }
  };

  // Check Origin header first (most reliable)
  if (origin) {
    if (
      isPreviewOrigin(origin) ||
      allowedOrigins.some(allowed => origin === allowed || origin.startsWith(allowed + '/'))
    ) {
      return { valid: true, error: null };
    }
    return {
      valid: false,
      error: apiError('CSRF validation failed: invalid origin', 403, 'CSRF_INVALID_ORIGIN'),
    };
  }

  // Fall back to Referer header
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (
        isPreviewOrigin(refererUrl.origin) ||
        allowedOrigins.some(allowed => refererUrl.origin === new URL(allowed).origin)
      ) {
        return { valid: true, error: null };
      }
    } catch {
      // malformed referer — fall through to block
    }
    return {
      valid: false,
      error: apiError('CSRF validation failed: invalid referer', 403, 'CSRF_INVALID_REFERER'),
    };
  }

  // No Origin or Referer — block by default for cookie-based auth
  // Exception: PayFast webhook (server-to-server, no browser headers)
  const pathname = new URL(request.url).pathname;
  if (pathname.startsWith('/api/payfast/') || pathname.startsWith('/api/auth/')) {
    return { valid: true, error: null };
  }

  return {
    valid: false,
    error: apiError('CSRF validation failed: missing origin/referer', 403, 'CSRF_MISSING_ORIGIN'),
  };
}
