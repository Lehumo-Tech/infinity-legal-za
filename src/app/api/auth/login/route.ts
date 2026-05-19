/**
 * POST /api/auth/login
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, generateToken, isPasswordExpired } from '@/lib/auth';
import { authRateLimiter, isValidEmail } from '@/lib/security';
import { createAuditLog } from '@/lib/audit';
import { apiResponse, apiError, checkRateLimit } from '@/lib/middleware';

export async function POST(request: NextRequest) {
  try {
    const rateResult = checkRateLimit(request, authRateLimiter);
    if (!rateResult.allowed) {
      return apiError('Too many login attempts. Please try again later.', 429, 'RATE_LIMITED');
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return apiError('Email and password are required', 400, 'MISSING_CREDENTIALS');
    }

    if (!isValidEmail(email)) {
      return apiError('Invalid email format', 400, 'INVALID_EMAIL');
    }

    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });

    if (!user || !verifyPassword(password, user.password)) {
      await createAuditLog({
        action: 'LOGIN_FAILED',
        resource_type: 'auth',
        ip_address: request.headers.get('x-forwarded-for') || undefined,
      });
      return apiError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.is_active) {
      return apiError('Account has been deactivated', 403, 'ACCOUNT_DEACTIVATED');
    }

    const passwordExpired = isPasswordExpired(user.last_password_change);
    if (passwordExpired) {
      return apiResponse({
        requiresPasswordChange: true,
        message: 'Your password has expired. Please change it to continue.',
        userId: user.id,
        email: user.email,
      });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      department: user.department || undefined,
    });

    await createAuditLog({
      user_id: user.id,
      action: 'LOGIN_SUCCESS',
      resource_type: 'auth',
      ip_address: request.headers.get('x-forwarded-for') || undefined,
    });

    const { password: _, ...userWithoutPassword } = user;
    return apiResponse({ token, user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    return apiError('Login failed', 500, 'LOGIN_ERROR');
  }
}
