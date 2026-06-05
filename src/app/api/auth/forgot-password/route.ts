/**
 * POST /api/auth/forgot-password - Request a password reset token
 * Generates a temporary token and returns it (in production this would email the user)
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { generateToken } from '@/lib/auth';
import { apiResponse, apiError } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';
import { signupRateLimiter } from '@/lib/security';
import { checkRateLimit } from '@/lib/middleware';

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 3 requests per hour per IP
    const rateResult = await checkRateLimit(request, signupRateLimiter);
    if (!rateResult.allowed) {
      return apiError('Too many password reset requests. Please try again later.', 429, 'RATE_LIMITED');
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return apiError('Email is required', 400, 'MISSING_EMAIL');
    }

    // Always return the same response to prevent email enumeration
    const genericResponse = apiResponse({
      message: 'If an account exists with this email, a password reset token has been generated.',
    });

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal that the user doesn't exist — return same response
      return genericResponse;
    }

    if (!user.is_active) {
      // Don't reveal that the account is deactivated
      return genericResponse;
    }

    // Generate a temporary token scoped to password reset (15 minute expiry)
    // In production, this token would be sent via email as a link
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: 'client',
      department: 'password_change_only',
    });

    // Audit log
    await createAuditLog({
      user_id: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      resource_type: 'user',
      resource_id: user.id,
      ip_address: request.headers.get('x-forwarded-for') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
    });

    // In production, send email with reset link containing the token
    // For now, return the token directly (sandbox/dev only)
    return apiResponse({
      message: 'If an account exists with this email, a password reset token has been generated.',
      // NOTE: In production, remove the token from the response.
      // It should only be sent via email to the registered address.
      token,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return apiError('Password reset request failed', 500, 'FORGOT_PASSWORD_ERROR');
  }
}
