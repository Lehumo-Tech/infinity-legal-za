/**
 * POST /api/auth/reset-password - Reset password using temporary token
 * Validates the temporary password-change token and updates the password
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, hashPassword, validatePasswordStrength } from '@/lib/auth';
import { apiResponse, apiError } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return apiError('Token and new password are required', 400, 'MISSING_FIELDS');
    }

    // Verify the temporary token
    const payload = verifyToken(token);
    if (!payload) {
      return apiError('Invalid or expired token', 401, 'INVALID_TOKEN');
    }

    // Verify this is a password-change scoped token
    if (payload.department !== 'password_change_only' || !(payload as unknown as Record<string, unknown>).purpose) {
      return apiError('Token is not authorized for password reset', 403, 'UNAUTHORIZED_TOKEN');
    }

    // Validate new password strength
    const strengthCheck = validatePasswordStrength(newPassword);
    if (!strengthCheck.valid) {
      return apiError(`Password does not meet requirements: ${strengthCheck.errors.join(', ')}`, 400, 'WEAK_PASSWORD');
    }

    // Find user by the email in the token
    const user = await db.user.findUnique({
      where: { email: payload.email.toLowerCase() },
    });

    if (!user) {
      return apiError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Verify the token's userId matches the user
    if (payload.userId !== user.id) {
      return apiError('Token does not match user', 403, 'TOKEN_USER_MISMATCH');
    }

    // Hash new password
    const hashedPassword = hashPassword(newPassword);

    // Update user password
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        last_password_change: new Date(),
        password_expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      },
    });

    // Audit log
    await createAuditLog({
      user_id: user.id,
      action: 'PASSWORD_RESET',
      resource_type: 'user',
      resource_id: user.id,
      ip_address: request.headers.get('x-forwarded-for') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
    });

    return apiResponse({
      message: 'Password has been reset successfully. Please log in with your new password.',
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return apiError('Password reset failed', 500, 'RESET_ERROR');
  }
}
