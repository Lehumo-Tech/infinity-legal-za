/**
 * POST /api/auth/signup - Register new user via Supabase Auth with local fallback
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
 * - Falls back to local Prisma/SQLite auth when Supabase is unreachable
 */

import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/api-client';
import { validatePasswordStrength } from '@/lib/auth';
import { signupRateLimiter, isValidEmail, sanitizeString } from '@/lib/security';
import { apiResponse, apiError, checkRateLimit, validateBodySize, validateCSRF } from '@/lib/middleware';
import { createAuditLog, logConsent } from '@/lib/audit';
import { createLocalUser, isSupabaseReachable } from '@/lib/local-auth';
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

    // ============================================
    // Strategy 1: Try Supabase Auth first
    // ============================================
    const db = getAdminClient();
    const supabaseReachable = db && await isSupabaseReachable();

    if (supabaseReachable && db) {
      try {
        // Check for existing account in Supabase
        const { data: existingProfile } = await db
          .from('profiles')
          .select('id')
          .eq('email', email.toLowerCase().trim())
          .single();

        if (existingProfile) {
          return apiError('An account with this email already exists', 409, 'EMAIL_EXISTS');
        }

        // Create User in Supabase
        const { data: authData, error: authError } = await db.auth.admin.createUser({
          email: email.toLowerCase().trim(),
          password,
          email_confirm: true,
          user_metadata: {
            full_name: sanitizedName,
            phone: phone ? sanitizeString(phone.trim()) : undefined,
            role,
          },
        });

        if (authError || !authData.user) {
          if (authError?.message?.includes('already registered')) {
            return apiError('An account with this email already exists', 409, 'EMAIL_EXISTS');
          }
          console.error('Signup auth error:', authError?.message);
          // Fall through to local auth
        } else {
          // Update Profile in Supabase
          const { error: profileError } = await db
            .from('profiles')
            .update({
              full_name: sanitizedName,
              phone: phone ? sanitizeString(phone.trim()) : null,
              popi_consent: true,
            })
            .eq('id', authData.user.id);

          if (profileError) {
            console.error('Profile update error:', profileError);
          }

          // Log Consent
          await Promise.all([
            logConsent({
              user_id: authData.user.id,
              consent_type: 'data_processing',
              granted: true,
              ip_address: ipAddress,
              user_agent: userAgent,
            }),
            logConsent({
              user_id: authData.user.id,
              consent_type: 'popi_act',
              granted: true,
              ip_address: ipAddress,
              user_agent: userAgent,
            }),
          ]);

          // Audit Log
          await createAuditLog({
            user_id: authData.user.id,
            action: 'USER_SIGNUP',
            resource_type: 'user',
            resource_id: authData.user.id,
            ip_address: ipAddress,
            user_agent: userAgent,
          });

          // Send welcome email + SMS (fire-and-forget, don't block signup)
          const welcomeVars = {
            full_name: sanitizedName,
            first_name: sanitizedName.split(' ')[0],
            email: email.toLowerCase().trim(),
            phone: phone ? sanitizeString(phone.trim()) : '',
          };
          const welcomeEmail = renderEmailTemplate('welcome', welcomeVars);
          if (welcomeEmail) {
            sendEmail({
              to: email.toLowerCase().trim(),
              subject: welcomeEmail.subject,
              html: welcomeEmail.html,
              text: welcomeEmail.text,
              category: 'welcome',
              userId: authData.user.id,
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
                userId: authData.user.id,
                recipientName: sanitizedName,
              }).catch(err => console.error('[Signup] Welcome SMS failed:', err));
            }
          }

          // Sign In to Get Token
          const { data: signInData, error: signInError } = await db.auth.signInWithPassword({
            email: email.toLowerCase().trim(),
            password,
          });

          if (signInError || !signInData.session) {
            return apiResponse({
              message: 'Account created successfully. Please sign in.',
              authProvider: 'supabase',
              user: {
                id: authData.user.id,
                email: email.toLowerCase().trim(),
                full_name: sanitizedName,
                role,
                email_verified: true,
              },
            }, 201);
          }

          return apiResponse({
            token: signInData.session.access_token,
            authProvider: 'supabase',
            user: {
              id: authData.user.id,
              email: email.toLowerCase().trim(),
              full_name: sanitizedName,
              role,
              email_verified: true,
            },
          }, 201);
        }
      } catch (supabaseError) {
        console.warn('[Signup] Supabase signup failed, falling back to local auth:', supabaseError);
      }
    }

    // ============================================
    // Strategy 2: Local Auth Fallback (Prisma/SQLite)
    // ============================================
    const localResult = await createLocalUser({
      email: email.toLowerCase().trim(),
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

    // Log consent locally
    await createAuditLog({
      user_id: localResult.user.id,
      action: 'USER_SIGNUP_LOCAL',
      resource_type: 'user',
      resource_id: localResult.user.id,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    // Send welcome email + SMS (fire-and-forget, don't block signup)
    const localWelcomeVars = {
      full_name: sanitizedName,
      first_name: sanitizedName.split(' ')[0],
      email: email.toLowerCase().trim(),
      phone: phone ? sanitizeString(phone.trim()) : '',
    };
    const localWelcomeEmail = renderEmailTemplate('welcome', localWelcomeVars);
    if (localWelcomeEmail) {
      sendEmail({
        to: email.toLowerCase().trim(),
        subject: localWelcomeEmail.subject,
        html: localWelcomeEmail.html,
        text: localWelcomeEmail.text,
        category: 'welcome',
        userId: localResult.user.id,
        recipientName: sanitizedName,
      }).catch(err => console.error('[Signup/Local] Welcome email failed:', err));
    }
    if (phone && formatSaPhone(phone)) {
      const localSmsText = renderSmsTemplate('welcome', localWelcomeVars);
      if (localSmsText) {
        sendSms({
          to: phone,
          message: localSmsText,
          category: 'welcome',
          userId: localResult.user.id,
          recipientName: sanitizedName,
        }).catch(err => console.error('[Signup/Local] Welcome SMS failed:', err));
      }
    }

    return apiResponse({
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
  } catch (error) {
    console.error('Signup error:', error);
    return apiError('Signup failed', 500, 'SIGNUP_ERROR');
  }
}
