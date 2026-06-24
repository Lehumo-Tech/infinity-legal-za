/**
 * Profile API - Returns the current user's profile
 * Supports both Supabase Auth (cookie-based) and Local Auth (JWT Bearer token)
 */

import { NextRequest } from 'next/server';
import { getAuthenticatedClient } from '@/lib/supabase/api-client';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Strategy 1: Try Supabase authenticated (cookie-based) client
    const authResult = await getAuthenticatedClient();

    if (authResult) {
      const { client, userId } = authResult;

      // Get profile from Supabase
      const { data: profile, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && profile) {
        return apiResponse(profile);
      }

      // Fallback: Get user info from auth
      const { data: { user } } = await client.auth.getUser();
      return apiResponse({
        id: userId,
        email: user?.email || '',
        full_name: user?.user_metadata?.full_name || '',
        role: user?.user_metadata?.role || 'client',
        department: null,
        is_active: true,
      });
    }

    // Strategy 2: Local Auth (Bearer token)
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
