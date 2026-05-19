/**
 * POST /api/auth/signup - Register new user via PocketBase
 */

import { NextRequest } from 'next/server';
import { createUser } from '@/lib/pb-client';
import { generateToken, validatePasswordStrength, getPasswordExpiryDate } from '@/lib/auth';
import { signupRateLimiter, isValidEmail, sanitizeString } from '@/lib/security';
import { apiResponse, apiError, checkRateLimit } from '@/lib/middleware';
import { createAuditLogPB, logConsentPB } from '@/lib/audit-pb';

export async function POST(request: NextRequest) {
  try {
    const rateResult = checkRateLimit(request, signupRateLimiter);
    if (!rateResult.allowed) {
      return apiError('Too many signup attempts. Please try again later.', 429, 'RATE_LIMITED');
    }

    const body = await request.json();
    const { email, password, full_name, phone, role = 'client', consent_given, popia_consent } = body;

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

    const passwordExpiry = getPasswordExpiryDate();

    // Create user in PocketBase
    const res = await createUser({
      email: email.toLowerCase(),
      password,
      passwordConfirm: password,
      full_name: sanitizeString(full_name),
      phone: phone ? sanitizeString(phone) : '',
      role: role || 'client',
      department: '',
      is_active: true,
      email_verified: false,
      password_expires_at: passwordExpiry.toISOString().split('.')[0] + 'Z',
      last_password_change: new Date().toISOString().split('.')[0] + 'Z',
    });

    if (res.status !== 200 && res.status !== 201) {
      const errData = res.data as any;
      if (errData?.data?.email?.code === 'validation_not_unique') {
        return apiError('An account with this email already exists', 409, 'EMAIL_EXISTS');
      }
      return apiError('Failed to create account: ' + (errData?.message || 'Unknown error'), 400, 'CREATE_FAILED');
    }

    const user = res.data as any;

    // Log consent
    await logConsentPB({
      user_id: user.id,
      consent_type: 'data_processing',
      purpose: 'Account creation and service provision',
      granted: true,
      ip_address: request.headers.get('x-forwarded-for') || undefined,
    });

    await logConsentPB({
      user_id: user.id,
      consent_type: 'popia_general',
      purpose: 'POPIA compliance - data processing consent',
      granted: true,
      ip_address: request.headers.get('x-forwarded-for') || undefined,
    });

    await createAuditLogPB({
      user_id: user.id,
      action: 'USER_SIGNUP',
      resource_type: 'user',
      resource_id: user.id,
      ip_address: request.headers.get('x-forwarded-for') || undefined,
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role || 'client',
      department: user.department || undefined,
    });

    return apiResponse({ 
      token, 
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name || '',
        role: user.role || 'client',
        department: user.department || null,
        is_active: true,
        email_verified: false,
      }
    }, 201);
  } catch (error) {
    console.error('Signup error:', error);
    return apiError('Signup failed', 500, 'SIGNUP_ERROR');
  }
}
