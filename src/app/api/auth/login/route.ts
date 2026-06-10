/**
 * POST /api/auth/login - Authenticate user via Supabase Auth
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { validatePasswordStrength } from '@/lib/auth';
import { authRateLimiter } from '@/lib/security';
import { apiResponse, apiError, checkRateLimit } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return apiError('Service temporarily unavailable', 503, 'SERVICE_UNAVAILABLE');
    }

    const rateResult = await checkRateLimit(request, authRateLimiter);
    if (!rateResult.allowed) {
      return apiError('Too many login attempts. Please try again later.', 429, 'RATE_LIMITED');
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return apiError('Email and password are required', 400, 'MISSING_CREDENTIALS');
    }

    // Authenticate with Supabase Auth
    const { data: authData, error: authError } = await db.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    });

    if (authError || !authData.user) {
      return apiError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Get the user's profile
    const { data: profile } = await db
      .from('profiles')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();

    if (!profile || !profile.is_active) {
      return apiError('Account has been deactivated', 403, 'ACCOUNT_DEACTIVATED');
    }

    // Audit log
    await createAuditLog({
      user_id: authData.user.id,
      action: 'USER_LOGIN',
      resource_type: 'user',
      resource_id: authData.user.id,
      ip_address: request.headers.get('x-forwarded-for') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
    });

    return apiResponse({
      token: authData.session.access_token,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name: profile.full_name,
        role: profile.role,
        department: profile.department,
        is_active: profile.is_active,
        email_verified: authData.user.email_confirmed_at ? true : false,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return apiError('Login failed', 500, 'LOGIN_ERROR');
  }
}
