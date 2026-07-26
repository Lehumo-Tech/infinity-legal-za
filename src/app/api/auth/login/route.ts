/**
 * POST /api/auth/login - Authenticate user via local Prisma/SQLite auth
 *
 * SECURITY:
 * - Rate limited (5 attempts per 5 minutes per IP)
 * - Audit logs all attempts (success and failure)
 * - Does not leak whether email exists (generic error messages)
 * - Validates input before attempting auth
 * - Uses bcryptjs password hashing
 * - Issues a local JWT (HMAC-SHA256) stored in an httpOnly cookie
 */

import { NextRequest, NextResponse } from 'next/server';
import { authRateLimiter, isValidEmail } from '@/lib/security';
import { apiResponse, apiError, checkRateLimit, validateBodySize, validateCSRF } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';
import { authenticateLocalUser } from '@/lib/local-auth';
import { ensureBootstrapUsers } from '@/lib/bootstrap-seed';

export async function POST(request: NextRequest) {
  try {
    // CSRF validation
    const csrf = validateCSRF(request);
    if (!csrf.valid) return csrf.error!;

    // Rate limiting
    const rateResult = await checkRateLimit(request, authRateLimiter);
    if (!rateResult.allowed) {
      return apiError('Too many login attempts. Please try again later.', 429, 'RATE_LIMITED');
    }

    // Body size check
    const bodyCheck = validateBodySize(request, 4096); // 4KB max for login
    if (!bodyCheck.valid) return bodyCheck.error!;

    const body = await request.json();
    const { email, password } = body;

    // Input validation
    if (!email || !password) {
      return apiError('Email and password are required', 400, 'MISSING_CREDENTIALS');
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return apiError('Invalid input format', 400, 'INVALID_FORMAT');
    }

    if (!isValidEmail(email)) {
      return apiError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Password length check (prevents absurdly long passwords)
    if (password.length > 128) {
      return apiError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // ─── Self-healing first-run seed ────────────────────────────────────
    // If the database has ZERO users (e.g. a fresh production deployment),
    // seed the bootstrap admin + staff accounts before authenticating.
    // This is a no-op once any user exists, so it adds at most one COUNT
    // query to every login on a populated DB. Safe + idempotent.
    await ensureBootstrapUsers();

    // Authenticate via local Prisma/SQLite
    const localResult = await authenticateLocalUser(email, password);

    if (!localResult) {
      await createAuditLog({
        action: 'LOGIN_FAILED',
        resource_type: 'user',
        ip_address: request.headers.get('x-forwarded-for') || undefined,
        user_agent: request.headers.get('user-agent') || undefined,
      });

      return apiError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Audit log — successful login
    await createAuditLog({
      user_id: localResult.user.id,
      action: 'USER_LOGIN',
      resource_type: 'user',
      resource_id: localResult.user.id,
      ip_address: request.headers.get('x-forwarded-for') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
    });

    const response = apiResponse({
      token: localResult.token,
      authProvider: 'local',
      user: {
        id: localResult.user.id,
        email: localResult.user.email,
        full_name: localResult.user.full_name,
        role: localResult.user.role,
        email_verified: localResult.user.email_verified,
      },
    });

    // Set httpOnly cookie for cookie-based auth
    response.cookies.set('auth-token', localResult.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return apiError('Login failed', 500, 'LOGIN_ERROR');
  }
}
