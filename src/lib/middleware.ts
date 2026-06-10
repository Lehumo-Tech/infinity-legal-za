/**
 * Infinity Legal ZA - API Middleware (Supabase)
 * Auth validation, rate limiting, input validation, audit tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, hasPermission, type RoleKey, type PermissionKey } from '@/lib/auth';
import { apiRateLimiter, authRateLimiter, sanitizeObject } from '@/lib/security';

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
// MIDDLEWARE: AUTHENTICATION (Async for Supabase)
// ============================================

type AuthSuccess = { authenticated: true; user: NonNullable<Awaited<ReturnType<typeof getUserFromToken>>>; error: null };
type AuthFailure = { authenticated: false; user: null; error: ReturnType<typeof apiError> };
type AuthResult = AuthSuccess | AuthFailure;

export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  const authHeader = request.headers.get('Authorization');
  const payload = await getUserFromToken(authHeader);

  if (!payload) {
    return { authenticated: false, user: null, error: apiError('Authentication required', 401, 'AUTH_REQUIRED') };
  }

  return { authenticated: true, user: payload, error: null };
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
