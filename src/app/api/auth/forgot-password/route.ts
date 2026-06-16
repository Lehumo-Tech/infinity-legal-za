/**
 * POST /api/auth/forgot-password - Send password reset email via Supabase
 *
 * SECURITY:
 * - Rate limited
 * - Always returns success to prevent email enumeration
 * - Input validation
 * - Audit logging (without user ID to prevent enumeration)
 */

import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/api-client';
import { authRateLimiter, isValidEmail } from '@/lib/security';
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
      return apiError('Too many attempts. Please try again later.', 429, 'RATE_LIMITED');
    }

    // Body size check
    const bodyCheck = validateBodySize(request, 2048);
    if (!bodyCheck.valid) return bodyCheck.error!;

    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || !isValidEmail(email)) {
      // Don't reveal whether the email is valid or not
      return apiResponse({
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

    // Send password reset email via Supabase Auth
    const { error } = await db.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://infinitylegal.org'}/reset-password`,
    });

    // Always return success to prevent email enumeration
    if (error) {
      console.error('Password reset error:', error.message);
      // Still return success — don't leak whether the email exists
    }

    await createAuditLog({
      action: 'PASSWORD_RESET_REQUESTED',
      resource_type: 'user',
      ip_address: request.headers.get('x-forwarded-for') || undefined,
      // No user_id — prevents enumeration via audit logs
    });

    return apiResponse({
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    // Don't reveal internal error details
    return apiResponse({
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  }
}
