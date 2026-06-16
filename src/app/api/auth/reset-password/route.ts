/**
 * POST /api/auth/reset-password - Reset password using Supabase
 *
 * SECURITY:
 * - Validates token before accepting
 * - Enforces password strength
 * - Rate limited
 * - Audit logs
 */

import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/api-client';
import { validatePasswordStrength } from '@/lib/auth';
import { apiResponse, apiError, validateBodySize, validateCSRF } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';
import { authRateLimiter, checkRateLimit } from '@/lib/middleware';

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
    const bodyCheck = validateBodySize(request, 4096);
    if (!bodyCheck.valid) return bodyCheck.error!;

    const body = await request.json();
    const { access_token, password } = body;

    if (!access_token || !password) {
      return apiError('Access token and new password are required', 400, 'MISSING_FIELDS');
    }

    if (typeof access_token !== 'string' || typeof password !== 'string') {
      return apiError('Invalid input format', 400, 'INVALID_FORMAT');
    }

    // Password strength validation
    const strengthCheck = validatePasswordStrength(password);
    if (!strengthCheck.valid) {
      return apiError(`Password does not meet requirements: ${strengthCheck.errors.join(', ')}`, 400, 'WEAK_PASSWORD');
    }

    // Verify the access token and get user ID
    const { data: tokenData, error: tokenError } = await db.auth.getUser(access_token);
    if (tokenError || !tokenData.user) {
      return apiError('Invalid or expired reset link. Please request a new one.', 401, 'INVALID_TOKEN');
    }

    // Update user password
    const { error: updateError } = await db.auth.admin.updateUserById(
      tokenData.user.id,
      { password }
    );

    if (updateError) {
      console.error('Password reset update error:', updateError.message);
      return apiError('Failed to reset password. The reset link may have expired.', 400, 'RESET_FAILED');
    }

    // Audit log
    await createAuditLog({
      user_id: tokenData.user.id,
      action: 'PASSWORD_RESET_COMPLETED',
      resource_type: 'user',
      resource_id: tokenData.user.id,
      ip_address: request.headers.get('x-forwarded-for') || undefined,
    });

    return apiResponse({ message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return apiError('Failed to reset password', 500, 'RESET_ERROR');
  }
}
