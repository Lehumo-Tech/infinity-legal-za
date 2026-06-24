/**
 * GET /api/auth/verify - Verify authentication token
 *
 * Supports both Supabase and local JWT tokens.
 * Used by the client to verify if a stored token is still valid.
 */

import { NextRequest } from 'next/server';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);

    if (!authResult.authenticated) {
      return apiError('Invalid or expired token', 401, 'AUTH_REQUIRED');
    }

    return apiResponse({
      valid: true,
      user: {
        id: authResult.user.userId,
        email: authResult.user.email,
        role: authResult.user.role,
      },
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return apiError('Token verification failed', 401, 'AUTH_REQUIRED');
  }
}
