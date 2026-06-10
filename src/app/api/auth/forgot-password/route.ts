/**
 * POST /api/auth/forgot-password - Send password reset email via Supabase
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
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
      return apiError('Too many attempts. Please try again later.', 429, 'RATE_LIMITED');
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return apiError('Email is required', 400, 'MISSING_EMAIL');
    }

    // Send password reset email via Supabase Auth
    const { error } = await db.auth.resetPasswordForEmail(email.toLowerCase(), {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://infinitylegal.org'}/reset-password`,
    });

    // Always return success to prevent email enumeration
    if (error) {
      console.error('Password reset error:', error.message);
    }

    await createAuditLog({
      action: 'PASSWORD_RESET_REQUESTED',
      resource_type: 'user',
      ip_address: request.headers.get('x-forwarded-for') || undefined,
    });

    return apiResponse({
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return apiError('Failed to process request', 500, 'RESET_ERROR');
  }
}
