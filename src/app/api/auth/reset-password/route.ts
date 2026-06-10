/**
 * POST /api/auth/reset-password - Reset password using Supabase
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { validatePasswordStrength } from '@/lib/auth';
import { apiResponse, apiError } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return apiError('Service temporarily unavailable', 503, 'SERVICE_UNAVAILABLE');
    }

    const body = await request.json();
    const { access_token, password } = body;

    if (!access_token || !password) {
      return apiError('Access token and new password are required', 400, 'MISSING_FIELDS');
    }

    const strengthCheck = validatePasswordStrength(password);
    if (!strengthCheck.valid) {
      return apiError(`Password does not meet requirements: ${strengthCheck.errors.join(', ')}`, 400, 'WEAK_PASSWORD');
    }

    // Update user password using the access token from the reset link
    const { error } = await db.auth.admin.updateUserById(
      // First get user from the token
      (await db.auth.getUser(access_token)).data.user?.id || '',
      { password }
    );

    if (error) {
      return apiError('Failed to reset password. The reset link may have expired.', 400, 'RESET_FAILED');
    }

    await createAuditLog({
      action: 'PASSWORD_RESET_COMPLETED',
      resource_type: 'user',
    });

    return apiResponse({ message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return apiError('Failed to reset password', 500, 'RESET_ERROR');
  }
}
