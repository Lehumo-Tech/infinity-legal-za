/**
 * POST /api/auth/signup - Register new user via Supabase Auth
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { validatePasswordStrength } from '@/lib/auth';
import { signupRateLimiter, isValidEmail, sanitizeString } from '@/lib/security';
import { apiResponse, apiError, checkRateLimit } from '@/lib/middleware';
import { createAuditLog, logConsent } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return apiError('Service temporarily unavailable', 503, 'SERVICE_UNAVAILABLE');
    }

    const rateResult = await checkRateLimit(request, signupRateLimiter);
    if (!rateResult.allowed) {
      return apiError('Too many signup attempts. Please try again later.', 429, 'RATE_LIMITED');
    }

    const body = await request.json();
    const { email, password, full_name, phone, consent_given, popia_consent } = body;

    // Signup is always 'client' role
    const role = 'client';

    if (!email || !password || !full_name) {
      return apiError('Email, password, and full name are required', 400, 'MISSING_FIELDS');
    }

    if (!isValidEmail(email)) {
      return apiError('Invalid email format', 400, 'INVALID_EMAIL');
    }

    const strengthCheck = validatePasswordStrength(password);
    if (!strengthCheck.valid) {
      return apiError(`Password does not meet requirements: ${strengthCheck.errors.join(', ')}`, 400, 'WEAK_PASSWORD');
    }

    if (!consent_given || !popia_consent) {
      return apiError('POPIA consent is required to create an account', 400, 'CONSENT_REQUIRED');
    }

    // Check if email already exists in profiles
    const { data: existingProfile } = await db
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingProfile) {
      return apiError('An account with this email already exists', 409, 'EMAIL_EXISTS');
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await db.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true, // Auto-confirm for now
      user_metadata: {
        full_name: sanitizeString(full_name),
        phone: phone ? sanitizeString(phone) : undefined,
        role,
      },
    });

    if (authError || !authData.user) {
      if (authError?.message?.includes('already registered')) {
        return apiError('An account with this email already exists', 409, 'EMAIL_EXISTS');
      }
      return apiError('Failed to create account', 500, 'SIGNUP_ERROR');
    }

    // Update the profile with additional info (auto-created by trigger)
    const { error: profileError } = await db
      .from('profiles')
      .update({
        full_name: sanitizeString(full_name),
        phone: phone ? sanitizeString(phone) : null,
      })
      .eq('user_id', authData.user.id);

    if (profileError) {
      console.error('Profile update error:', profileError);
    }

    // Log consent
    const userId = authData.user.id;
    await logConsent({
      user_id: userId,
      consent_type: 'data_processing',
      purpose: 'Account creation and service provision',
      granted: true,
      ip_address: request.headers.get('x-forwarded-for') || undefined,
    });

    await logConsent({
      user_id: userId,
      consent_type: 'popia_general',
      purpose: 'POPIA compliance - data processing consent',
      granted: true,
      ip_address: request.headers.get('x-forwarded-for') || undefined,
    });

    await createAuditLog({
      user_id: userId,
      action: 'USER_SIGNUP',
      resource_type: 'user',
      resource_id: userId,
      ip_address: request.headers.get('x-forwarded-for') || undefined,
    });

    // Sign in to get access token
    const { data: signInData, error: signInError } = await db.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    });

    if (signInError || !signInData.session) {
      // User was created but can't sign in immediately — still return success
      return apiResponse({
        message: 'Account created successfully. Please sign in.',
        user: {
          id: userId,
          email: email.toLowerCase(),
          full_name: sanitizeString(full_name),
          role,
          department: null,
          is_active: true,
          email_verified: true,
        },
      }, 201);
    }

    return apiResponse({
      token: signInData.session.access_token,
      user: {
        id: userId,
        email: email.toLowerCase(),
        full_name: sanitizeString(full_name),
        role,
        department: null,
        is_active: true,
        email_verified: true,
      },
    }, 201);
  } catch (error) {
    console.error('Signup error:', error);
    return apiError('Signup failed', 500, 'SIGNUP_ERROR');
  }
}
