/**
 * POST /api/auth/signup - Register new user via local Prisma/SQLite auth
 *
 * SECURITY:
 * - Strict rate limiting (3 per hour per IP)
 * - Password strength validation
 * - POPIA consent required (SA law)
 * - Email validation and normalization
 * - Input sanitization
 * - Audit logging
 * - CSRF protection
 * - No role escalation (always 'client' for self-signup)
 * - Creates User + Client + ConsentLog records
 * - Sends welcome email + SMS
 */

import { NextRequest } from 'next/server';
import { validatePasswordStrength } from '@/lib/auth';
import { signupRateLimiter, isValidEmail, sanitizeString } from '@/lib/security';
import { apiResponse, apiError, checkRateLimit, validateBodySize, validateCSRF } from '@/lib/middleware';
import { createAuditLog, logConsent } from '@/lib/audit';
import { createLocalUser } from '@/lib/local-auth';
import { ensureBootstrapUsers } from '@/lib/bootstrap-seed';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email-service';
import { sendSms, formatSaPhone } from '@/lib/sms-service';
import { renderEmailTemplate, renderSmsTemplate } from '@/lib/communication-templates';

export async function POST(request: NextRequest) {
  try {
    // CSRF validation
    const csrf = validateCSRF(request);
    if (!csrf.valid) return csrf.error!;

    // Rate limiting — very strict for signup
    const rateResult = await checkRateLimit(request, signupRateLimiter);
    if (!rateResult.allowed) {
      return apiError('Too many signup attempts. Please try again later.', 429, 'RATE_LIMITED');
    }

    // Body size check
    const bodyCheck = validateBodySize(request, 8192); // 8KB max for signup
    if (!bodyCheck.valid) return bodyCheck.error!;

    const body = await request.json();
    const { email, password, full_name, phone, consent_given, popia_consent } = body;

    // Signup is always 'client' role — no role escalation possible
    const role = 'client';

    // ---- Input Validation ----

    if (!email || !password || !full_name) {
      return apiError('Email, password, and full name are required', 400, 'MISSING_FIELDS');
    }

    if (typeof email !== 'string' || typeof password !== 'string' || typeof full_name !== 'string') {
      return apiError('Invalid input format', 400, 'INVALID_FORMAT');
    }

    if (!isValidEmail(email)) {
      return apiError('Invalid email format', 400, 'INVALID_EMAIL');
    }

    // Name length limits
    const sanitizedName = sanitizeString(full_name.trim());
    if (sanitizedName.length < 2 || sanitizedName.length > 100) {
      return apiError('Full name must be between 2 and 100 characters', 400, 'INVALID_NAME');
    }

    // Phone validation (if provided)
    if (phone && typeof phone !== 'string') {
      return apiError('Invalid phone format', 400, 'INVALID_PHONE');
    }

    // Password strength
    const strengthCheck = validatePasswordStrength(password);
    if (!strengthCheck.valid) {
      return apiError(`Password does not meet requirements: ${strengthCheck.errors.join(', ')}`, 400, 'WEAK_PASSWORD');
    }

    // POPIA consent required (South African law)
    if (!consent_given || !popia_consent) {
      return apiError('POPIA consent is required to create an account', 400, 'CONSENT_REQUIRED');
    }

    const ipAddress = request.headers.get('x-forwarded-for') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;
    const normalizedEmail = email.toLowerCase().trim();

    // ─── Self-healing first-run seed ────────────────────────────────────
    // Ensure staff accounts exist on a fresh production database before
    // allowing self-signup. No-op once any user exists.
    await ensureBootstrapUsers();

    // Create user via local auth helper (handles email uniqueness check + password hashing)
    const localResult = await createLocalUser({
      email: normalizedEmail,
      password,
      full_name: sanitizedName,
      phone: phone ? sanitizeString(phone.trim()) : undefined,
      role,
    });

    if ('error' in localResult) {
      if (localResult.error.includes('already exists')) {
        return apiError(localResult.error, 409, 'EMAIL_EXISTS');
      }
      return apiError(localResult.error, 500, 'SIGNUP_ERROR');
    }

    // Create the client profile
    try {
      await db.client.create({
        data: {
          user_id: localResult.user.id,
          subscription_status: 'none',
        },
      });
    } catch (clientErr) {
      console.error('[Signup] Failed to create client profile:', clientErr);
      // Non-fatal — the user was created, profile can be added later
    }

    // Log consent (POPIA + data_processing)
    await Promise.all([
      logConsent({
        user_id: localResult.user.id,
        consent_type: 'data_processing',
        granted: true,
        ip_address: ipAddress,
        user_agent: userAgent,
      }),
      logConsent({
        user_id: localResult.user.id,
        consent_type: 'popi_act',
        granted: true,
        ip_address: ipAddress,
        user_agent: userAgent,
      }),
    ]);

    // Audit log
    await createAuditLog({
      user_id: localResult.user.id,
      action: 'USER_SIGNUP',
      resource_type: 'user',
      resource_id: localResult.user.id,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    // Send welcome email + SMS (fire-and-forget, don't block signup)
    const welcomeVars = {
      full_name: sanitizedName,
      first_name: sanitizedName.split(' ')[0],
      email: normalizedEmail,
      phone: phone ? sanitizeString(phone.trim()) : '',
    };
    const welcomeEmail = renderEmailTemplate('welcome', welcomeVars);
    if (welcomeEmail) {
      sendEmail({
        to: normalizedEmail,
        subject: welcomeEmail.subject,
        html: welcomeEmail.html,
        text: welcomeEmail.text,
        category: 'welcome',
        userId: localResult.user.id,
        recipientName: sanitizedName,
      }).catch(err => console.error('[Signup] Welcome email failed:', err));
    }
    if (phone && formatSaPhone(phone)) {
      const smsText = renderSmsTemplate('welcome', welcomeVars);
      if (smsText) {
        sendSms({
          to: phone,
          message: smsText,
          category: 'welcome',
          userId: localResult.user.id,
          recipientName: sanitizedName,
        }).catch(err => console.error('[Signup] Welcome SMS failed:', err));
      }
    }

    const response = apiResponse({
      token: localResult.token,
      authProvider: 'local',
      user: {
        id: localResult.user.id,
        email: localResult.user.email,
        full_name: localResult.user.full_name,
        role: localResult.user.role,
        email_verified: localResult.user.email_verified,
      },
    }, 201);

    // Set httpOnly cookie for cookie-based auth
    response.cookies.set('auth-token', localResult.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return apiError('Signup failed', 500, 'SIGNUP_ERROR');
  }
}
