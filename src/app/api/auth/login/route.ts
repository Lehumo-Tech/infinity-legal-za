/**
 * POST /api/auth/login - Authenticate user via Prisma/PostgreSQL
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { generateToken, verifyPassword, isPasswordExpired } from '@/lib/auth';
import { authRateLimiter } from '@/lib/security';
import { apiResponse, apiError, checkRateLimit } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

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

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return apiError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Verify password
    const passwordValid = verifyPassword(password, user.password);
    if (!passwordValid) {
      return apiError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.is_active) {
      return apiError('Account has been deactivated', 403, 'ACCOUNT_DEACTIVATED');
    }

    // Check password expiration
    const passwordExpired = isPasswordExpired(user.last_password_change);

    if (passwordExpired) {
      return apiResponse({
        requiresPasswordChange: true,
        message: 'Your password has expired. Please change it to continue.',
        userId: user.id,
        email: user.email,
      });
    }

    // Generate JWT token with role info
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      department: user.department || undefined,
    });

    // Audit log
    await createAuditLog({
      user_id: user.id,
      action: 'USER_LOGIN',
      resource_type: 'user',
      resource_id: user.id,
      ip_address: request.headers.get('x-forwarded-for') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
    });

    return apiResponse({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        department: user.department,
        is_active: user.is_active,
        email_verified: user.email_verified,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return apiError('Login failed', 500, 'LOGIN_ERROR');
  }
}
