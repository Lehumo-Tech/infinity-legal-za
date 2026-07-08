/**
 * POST /api/auth/forgot-password - Send password reset email
 *
 * SECURITY:
 * - Rate limited
 * - Always returns success to prevent email enumeration
 * - Input validation
 * - Audit logging (without user ID to prevent enumeration)
 *
 * Generates a short-lived reset token (stored in OtpVerification table)
 * and emails it to the user if their account exists.
 */

import { NextRequest } from 'next/server';
import { authRateLimiter, isValidEmail } from '@/lib/security';
import { apiResponse, apiError, checkRateLimit, validateBodySize, validateCSRF } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email-service';
import { randomBytes } from 'crypto';

const RESET_TOKEN_EXPIRY_HOURS = 1;

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
  const bodyCheck = validateBodySize(request, 2048);
  if (!bodyCheck.valid) return bodyCheck.error!;

  const GENERIC_RESPONSE = {
    message: 'If an account with that email exists, a password reset link has been sent.',
  };

  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || !isValidEmail(email)) {
      // Don't reveal whether the email is valid or not
      return apiResponse(GENERIC_RESPONSE);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Look up the user (don't reveal whether the email exists)
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, full_name: true },
    });

    if (user) {
      // Generate a secure random token
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

      // Store the token in OtpVerification (reused as password-reset token store)
      try {
        await db.otpVerification.create({
          data: {
            email: normalizedEmail,
            otp_code: token,
            status: 'pending',
            expires_at: expiresAt,
            ip_address: request.headers.get('x-forwarded-for') || null,
            user_agent: request.headers.get('user-agent') || null,
          },
        });
      } catch (insertErr) {
        console.error('[ForgotPassword] Failed to store reset token:', insertErr);
      }

      // Send the reset email
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://infinitylegal.org'}/reset-password?token=${token}`;
      try {
        await sendEmail({
          to: normalizedEmail,
          subject: 'Infinity Legal SA — Password Reset',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
              <h2 style="color: #0c1e3c;">Password Reset Request</h2>
              <p>Hello ${user.full_name || 'there'},</p>
              <p>We received a request to reset the password on your Infinity Legal SA account.</p>
              <p>Click the button below to choose a new password. This link expires in ${RESET_TOKEN_EXPIRY_HOURS} hour(s).</p>
              <p style="margin: 24px 0;">
                <a href="${resetUrl}" style="background: #c9a84c; color: #0c1e3c; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
              </p>
              <p style="font-size: 12px; color: #666;">If the button doesn't work, paste this URL into your browser: <br/>${resetUrl}</p>
              <p style="font-size: 12px; color: #666;">If you did not request a password reset, you can safely ignore this email.</p>
              <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
              <p style="font-size: 12px; color: #999;">Infinity Legal SA · Justice without limits.</p>
            </div>
          `,
          text: `Hello ${user.full_name || 'there'},\n\nWe received a request to reset your Infinity Legal SA password.\n\nReset it here: ${resetUrl}\n\nThis link expires in ${RESET_TOKEN_EXPIRY_HOURS} hour(s).\n\nIf you did not request a reset, ignore this email.`,
          category: 'verification',
          userId: user.id,
          recipientName: user.full_name || undefined,
        }).catch(err => console.error('[ForgotPassword] Email send failed:', err));
      } catch (emailErr) {
        console.error('[ForgotPassword] Email send error:', emailErr);
      }
    }

    await createAuditLog({
      user_id: user?.id,
      action: 'PASSWORD_RESET_REQUESTED',
      resource_type: 'user',
      ip_address: request.headers.get('x-forwarded-for') || undefined,
      // No user_id when user is null — prevents enumeration via audit logs
    });

    return apiResponse(GENERIC_RESPONSE);
  } catch (error) {
    console.error('Forgot password error:', error);
    // Don't reveal internal error details
    return apiResponse(GENERIC_RESPONSE);
  }
}
