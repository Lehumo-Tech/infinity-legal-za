/**
 * POST /api/auth/login - Authenticate user via Prisma/PostgreSQL
 */

import { NextRequest } from 'next/server';
import { createHmac } from 'crypto';
import { db } from '@/lib/db';
import { generateToken, verifyPassword, isPasswordExpired } from '@/lib/auth';
import { authRateLimiter } from '@/lib/security';
import { apiResponse, apiError, checkRateLimit } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';
import { isSouthAfricanIP, getClientIP } from '@/lib/geolocation';

// Generate a temporary token scoped to only allow password changes (15 minute expiry)
function generatePasswordChangeToken(userId: string, email: string): string {
  const jwtSecret = process.env.JWT_SECRET!;
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    userId,
    email,
    role: 'client', // Minimal role - no real permissions
    department: 'password_change_only', // Special scope indicator
    purpose: 'password_reset',
    iat: now,
    exp: now + 900, // 15 minutes
  };

  function base64UrlEncode(data: string): string {
    return Buffer.from(data).toString('base64url');
  }

  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = createHmac('sha256', jwtSecret).update(`${header}.${body}`).digest('base64url');

  return `${header}.${body}.${signature}`;
}

export async function POST(request: NextRequest) {
  try {
    const rateResult = await checkRateLimit(request, authRateLimiter);
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
      // Generate a temporary token scoped to only allow password changes
      const temporaryToken = generatePasswordChangeToken(user.id, user.email);

      // Audit log for password expiry
      await createAuditLog({
        user_id: user.id,
        action: 'PASSWORD_EXPIRED_LOGIN_ATTEMPT',
        resource_type: 'user',
        resource_id: user.id,
        ip_address: request.headers.get('x-forwarded-for') || undefined,
        user_agent: request.headers.get('user-agent') || undefined,
      });

      // Return generic message WITHOUT userId to prevent info leak
      return apiResponse({
        requiresPasswordChange: true,
        message: 'Password update required',
        token: temporaryToken,
      });
    }

    // Generate JWT token with role info
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      department: user.department || undefined,
    });

    const clientIP = request.headers.get('x-forwarded-for') || undefined;

    // Audit log
    await createAuditLog({
      user_id: user.id,
      action: 'USER_LOGIN',
      resource_type: 'user',
      resource_id: user.id,
      ip_address: clientIP,
      user_agent: request.headers.get('user-agent') || undefined,
    });

    // IP Geolocation security check: log warning if login from outside South Africa
    // This does NOT block login, only creates an audit trail for security review
    try {
      const ip = getClientIP(request);
      const geoCheck = await isSouthAfricanIP(ip);

      if (!geoCheck.isSouthAfrican) {
        await createAuditLog({
          user_id: user.id,
          action: 'FOREIGN_LOGIN_DETECTED',
          resource_type: 'user',
          resource_id: user.id,
          details: `Login from non-SA location: ${geoCheck.country} (${geoCheck.countryCode})${geoCheck.city ? `, City: ${geoCheck.city}` : ''}, IP: ${ip}`,
          ip_address: clientIP,
          user_agent: request.headers.get('user-agent') || undefined,
        });
        console.warn(`[Security] User ${user.email} logged in from ${geoCheck.country} (${geoCheck.countryCode}), IP: ${ip}`);
      }
    } catch (error) {
      // Never block login if geolocation check fails
      console.warn('[Login] Geolocation check failed:', error);
    }

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
