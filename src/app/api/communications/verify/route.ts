/**
 * POST /api/communications/verify - Send verification OTP via email or SMS
 *
 * Body: { email?, phone?, channel: 'email' | 'sms' | 'both', userId? }
 */

import { NextRequest } from 'next/server';
import { apiResponse, apiError, checkRateLimit, validateCSRF, requireAuth } from '@/lib/middleware';
import { sendEmail } from '@/lib/email-service';
import { sendSms, formatSaPhone } from '@/lib/sms-service';
import { renderEmailTemplate, renderSmsTemplate, generateOtp } from '@/lib/communication-templates';
import { db } from '@/lib/db';
import { signupRateLimiter } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const csrf = validateCSRF(request);
    if (!csrf.valid) return csrf.error!;

    // Rate limit OTP sends
    const rateResult = await checkRateLimit(request, signupRateLimiter);
    if (!rateResult.allowed) {
      return apiError('Too many verification attempts. Please try again later.', 429, 'RATE_LIMITED');
    }

    const body = await request.json();
    const { email, phone, channel = 'email', userId } = body;

    if (!email && !phone) {
      return apiError('Email or phone number is required', 400, 'MISSING_RECIPIENT');
    }

    // Generate 6-digit OTP
    const otpCode = generateOtp(6);
    const expiresMinutes = 10;
    const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);

    // Store OTP in database
    await db.otpVerification.create({
      data: {
        email: email || phone || '',
        otp_code: otpCode,
        status: 'pending',
        expires_at: expiresAt,
        ip_address: request.headers.get('x-forwarded-for') || undefined,
        user_agent: request.headers.get('user-agent') || undefined,
      },
    });

    const templateVars = {
      full_name: '',
      first_name: '',
      email: email || '',
      phone: phone || '',
      otp_code: otpCode,
      otp_expires_minutes: expiresMinutes.toString(),
    };

    let emailSent = false;
    let smsSent = false;

    // Send via email
    if ((channel === 'email' || channel === 'both') && email) {
      // Look up user name
      if (userId) {
        const user = await db.user.findUnique({ where: { id: userId }, select: { full_name: true } });
        if (user) {
          templateVars.full_name = user.full_name || '';
          templateVars.first_name = user.full_name?.split(' ')[0] || '';
        }
      }

      const rendered = renderEmailTemplate('verification', templateVars);
      if (rendered) {
        const result = await sendEmail({
          to: email,
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text,
          category: 'verification',
          userId,
          recipientName: templateVars.full_name,
        });
        emailSent = result.success;
      }
    }

    // Send via SMS
    if ((channel === 'sms' || channel === 'both') && phone && formatSaPhone(phone)) {
      const smsText = renderSmsTemplate('verification', templateVars);
      if (smsText) {
        const result = await sendSms({
          to: phone,
          message: smsText,
          category: 'verification',
          userId,
          recipientName: templateVars.full_name,
        });
        smsSent = result.success;
      }
    }

    return apiResponse({
      message: 'Verification OTP sent',
      channel: channel === 'both' ? 'email_and_sms' : channel,
      emailSent,
      smsSent,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('[Communications/Verify] Error:', error);
    return apiError('Failed to send verification code', 500, 'VERIFY_ERROR');
  }
}
