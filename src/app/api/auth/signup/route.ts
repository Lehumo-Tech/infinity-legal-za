/**
 * POST /api/auth/signup
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, generateToken, validatePasswordStrength, getPasswordExpiryDate } from '@/lib/auth';
import { signupRateLimiter, isValidEmail, sanitizeString } from '@/lib/security';
import { createAuditLog, logConsent } from '@/lib/audit';
import { apiResponse, apiError, checkRateLimit } from '@/lib/middleware';

export async function POST(request: NextRequest) {
  try {
    const rateResult = checkRateLimit(request, signupRateLimiter);
    if (!rateResult.allowed) {
      return apiError('Too many signup attempts. Please try again later.', 429, 'RATE_LIMITED');
    }

    const body = await request.json();
    const { email, password, full_name, phone, role = 'client', consent_given, popia_consent } = body;

    // Validation
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

    // Check if user exists
    const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return apiError('An account with this email already exists', 409, 'EMAIL_EXISTS');
    }

    // Create user
    const hashedPassword = hashPassword(password);
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        full_name: sanitizeString(full_name),
        phone: phone ? sanitizeString(phone) : null,
        role: role || 'client',
        is_active: true,
        email_verified: false,
        password_expires_at: getPasswordExpiryDate(),
        last_password_change: new Date(),
      },
    });

    // Create profile
    await db.profile.create({
      data: {
        user_id: user.id,
        email: user.email,
        full_name: user.full_name || '',
        role: user.role,
        department: user.department,
        phone: user.phone,
      },
    });

    // Log consent
    await logConsent({
      user_id: user.id,
      consent_type: 'data_processing',
      purpose: 'Account creation and service provision',
      granted: true,
      ip_address: request.headers.get('x-forwarded-for') || undefined,
    });

    await logConsent({
      user_id: user.id,
      consent_type: 'popia_general',
      purpose: 'POPIA compliance - data processing consent',
      granted: true,
      ip_address: request.headers.get('x-forwarded-for') || undefined,
    });

    await createAuditLog({
      user_id: user.id,
      action: 'USER_SIGNUP',
      resource_type: 'user',
      resource_id: user.id,
      ip_address: request.headers.get('x-forwarded-for') || undefined,
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      department: user.department || undefined,
    });

    const { password: _, ...userWithoutPassword } = user;
    return apiResponse({ token, user: userWithoutPassword }, 201);
  } catch (error) {
    console.error('Signup error:', error);
    return apiError('Signup failed', 500, 'SIGNUP_ERROR');
  }
}
