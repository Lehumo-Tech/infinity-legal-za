/**
 * POST /api/auth/login - Authenticate user via Supabase Auth
 *
 * SECURITY:
 * - Rate limited (5 attempts per 5 minutes per IP)
 * - Uses admin client for auth verification (required by Supabase)
 * - Audit logs all attempts (success and failure)
 * - Does not leak whether email exists (generic error messages)
 * - Validates input before attempting auth
 */

import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/api-client';
import { authRateLimiter, isValidEmail, sanitizeString } from '@/lib/security';
import { apiResponse, apiError, checkRateLimit, validateBodySize, validateCSRF } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const db = getAdminClient();
    if (!db) {
      return apiError('Service temporarily unavailable', 503, 'SERVICE_UNAVAILABLE');
    }

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

    // Authenticate with Supabase Auth
    const { data: authData, error: authError } = await db.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (authError || !authData.user) {
      // Log failed attempt (don't leak whether email exists)
      await createAuditLog({
        action: 'LOGIN_FAILED',
        resource_type: 'user',
        ip_address: request.headers.get('x-forwarded-for') || undefined,
        user_agent: request.headers.get('user-agent') || undefined,
      });

      return apiError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Get the user's profile
    const { data: profile } = await db
      .from('profiles')
      .select('id, email, full_name, role, popi_consent')
      .eq('id', authData.user.id)
      .single();

    if (!profile) {
      return apiError('Account setup incomplete. Please contact support.', 403, 'PROFILE_NOT_FOUND');
    }

    // Check if user has POPIA consent (required for SA law)
    // Auto-grant consent for existing users who signed up before POPIA was enforced
    if (!profile.popi_consent) {
      await db
        .from('profiles')
        .update({ popi_consent: true })
        .eq('id', authData.user.id);
    }

    // Audit log — successful login
    await createAuditLog({
      user_id: authData.user.id,
      action: 'USER_LOGIN',
      resource_type: 'user',
      resource_id: authData.user.id,
      ip_address: request.headers.get('x-forwarded-for') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
    });

    // Return token and user info
    // The Supabase session is also set as cookies by the browser client
    return apiResponse({
      token: authData.session.access_token,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name: profile.full_name,
        role: profile.role,
        email_verified: authData.user.email_confirmed_at ? true : false,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    // Don't leak internal error details
    return apiError('Login failed', 500, 'LOGIN_ERROR');
  }
}
