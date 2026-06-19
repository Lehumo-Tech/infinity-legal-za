/**
 * Profile API - Returns the current user's profile from Supabase
 * Uses Supabase Auth (cookie-based) to identify the user.
 */

import { NextRequest } from 'next/server';
import { getAuthenticatedClient, getAdminClient } from '@/lib/supabase/api-client';
import { apiResponse, apiError } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    // Try authenticated (cookie-based) client first
    const authResult = await getAuthenticatedClient();

    if (!authResult) {
      return apiError('Not authenticated', 401, 'AUTH_REQUIRED');
    }

    const { client, userId } = authResult;

    // Get profile from Supabase
    const { data: profile, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      // Get user info from auth as fallback
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

    return apiResponse(profile);
  } catch (err) {
    console.error('Profile fetch error:', err);
    return apiError('Internal server error', 500, 'SERVER_ERROR');
  }
}
