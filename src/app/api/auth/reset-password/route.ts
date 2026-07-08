/**
 * POST /api/auth/reset-password - Reset password using a token
 *
 * SECURITY:
 * - Validates token (stored in OtpVerification) before accepting
 * - Enforces password strength
 * - Rate limited
 * - Audit logs
 * - Marks token as verified after use (single-use)
 */

import { NextRequest } from 'next/server';
import { validatePasswordStrength } from '@/lib/auth';
import { apiResponse, apiError, validateBodySize, validateCSRF, checkRateLimit } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';
import { authRateLimiter } from '@/lib/security';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/local-auth';

export async function POST(request: NextRequest) {
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

  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return apiError('Token and new password are required', 400, 'MISSING_FIELDS');
    }

    if (typeof token !== 'string' || typeof password !== 'string') {
      return apiError('Invalid input format', 400, 'INVALID_FORMAT');
    }

    // Password strength validation
    const strengthCheck = validatePasswordStrength(password);
    if (!strengthCheck.valid) {
      return apiError(`Password does not meet requirements: ${strengthCheck.errors.join(', ')}`, 400, 'WEAK_PASSWORD');
    }

    // Verify the reset token (stored in OtpVerification)
    const resetRecord = await db.otpVerification.findFirst({
      where: {
        otp_code: token,
        status: 'pending',
        expires_at: { gte: new Date() },
      },
      orderBy: { created_at: 'desc' },
    });

    if (!resetRecord) {
      return apiError('Invalid or expired reset link. Please request a new one.', 401, 'INVALID_TOKEN');
    }

    // Find the user by email
    const user = await db.user.findUnique({
      where: { email: resetRecord.email.toLowerCase().trim() },
      select: { id: true, email: true },
    });

    if (!user) {
      // Mark token as failed so it can't be reused
      await db.otpVerification.update({
        where: { id: resetRecord.id },
        data: { status: 'failed' },
      });
      return apiError('Invalid or expired reset link. Please request a new one.', 401, 'INVALID_TOKEN');
    }

    // Hash the new password and update the user
    const passwordHash = await hashPassword(password);
    await db.user.update({
      where: { id: user.id },
      data: {
        password: passwordHash,
        last_password_change: new Date(),
      },
    });

    // Mark token as verified (single-use)
    await db.otpVerification.update({
      where: { id: resetRecord.id },
      data: {
        status: 'verified',
        verified_at: new Date(),
      },
    });

    // Audit log
    await createAuditLog({
      user_id: user.id,
      action: 'PASSWORD_RESET_COMPLETED',
      resource_type: 'user',
      resource_id: user.id,
      ip_address: request.headers.get('x-forwarded-for') || undefined,
    });

    return apiResponse({ message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return apiError('Failed to reset password', 500, 'RESET_ERROR');
  }
}
