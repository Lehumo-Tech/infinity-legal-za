/**
 * Profile API - Returns the current user's profile
 * Uses local Prisma/SQLite auth via JWT cookie or Bearer token
 */

import { NextRequest } from 'next/server';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated || !auth.user) {
      return apiError('Not authenticated', 401, 'AUTH_REQUIRED');
    }

    const localUser = await db.user.findUnique({
      where: { id: auth.user.userId },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        role: true,
        department: true,
        id_number: true,
        avatar_url: true,
        is_active: true,
        email_verified: true,
        popi_consent: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!localUser) {
      return apiError('User not found', 404, 'USER_NOT_FOUND');
    }

    return apiResponse(localUser);
  } catch (err) {
    console.error('Profile fetch error:', err);
    return apiError('Internal server error', 500, 'SERVER_ERROR');
  }
}
