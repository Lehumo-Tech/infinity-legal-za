/**
 * POST /api/auth/login - Authenticate user via PocketBase
 */

import { NextRequest } from 'next/server';
import { authenticateUser, getUserById } from '@/lib/pb-client';
import { generateToken, isPasswordExpired } from '@/lib/auth';
import { authRateLimiter } from '@/lib/security';
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

    // Authenticate via PocketBase
    const authRes = await authenticateUser(email, password);
    
    if (authRes.status !== 200 || !(authRes.data as any)?.record) {
      return apiError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const pbUser = (authRes.data as any).record;
    
    if (pbUser.is_active === false) {
      return apiError('Account has been deactivated', 403, 'ACCOUNT_DEACTIVATED');
    }

    // Check password expiration
    const passwordExpired = isPasswordExpired(
      pbUser.last_password_change ? new Date(pbUser.last_password_change) : null
    );
    
    if (passwordExpired) {
      return apiResponse({
        requiresPasswordChange: true,
        message: 'Your password has expired. Please change it to continue.',
        userId: pbUser.id,
        email: pbUser.email,
      });
    }

    // Generate our custom JWT token with role info
    const token = generateToken({
      userId: pbUser.id,
      email: pbUser.email,
      role: pbUser.role || 'client',
      department: pbUser.department || undefined,
    });

    const { password: _, tokenKey: __, ...userWithoutSensitive } = pbUser;
    
    return apiResponse({ 
      token, 
      user: {
        id: pbUser.id,
        email: pbUser.email,
        full_name: pbUser.full_name || pbUser.name || '',
        role: pbUser.role || 'client',
        department: pbUser.department || null,
        is_active: pbUser.is_active !== false,
        email_verified: pbUser.email_verified || false,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return apiError('Login failed', 500, 'LOGIN_ERROR');
  }
}
