/**
 * POST /api/auth/signout - Sign out user
 *
 * Clears the Supabase auth session cookies.
 * Does NOT require authentication — a user with an expired session
 * still needs to be able to sign out and clear stale cookies.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Try to sign out from Supabase — this works even if session is expired
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch {
      // If Supabase sign out fails, still clear cookies
    }

    // Try audit log — best effort, don't block signout if it fails
    try {
      const { getAuthUser } = await import('@/lib/supabase/auth-helpers');
      const { createAuditLog } = await import('@/lib/audit');
      const authUser = await getAuthUser();
      if (authUser) {
        await createAuditLog({
          user_id: authUser.id,
          action: 'USER_SIGNOUT',
          resource_type: 'user',
          resource_id: authUser.id,
          ip_address: request.headers.get('x-forwarded-for') || undefined,
          user_agent: request.headers.get('user-agent') || undefined,
        });
      }
    } catch {
      // Audit log failure should not prevent signout
    }

    const response = NextResponse.json({ success: true });

    // Clear all auth cookies
    response.cookies.delete('sb-access-token');
    response.cookies.delete('sb-refresh-token');

    // Also clear Supabase cookie patterns
    const allCookies = request.cookies.getAll();
    for (const cookie of allCookies) {
      if (cookie.name.startsWith('sb-') || cookie.name.includes('supabase')) {
        response.cookies.delete(cookie.name);
      }
    }

    return response;
  } catch (error) {
    console.error('Signout error:', error);
    // Even if everything fails, still return success and clear cookies
    const response = NextResponse.json({ success: true });
    response.cookies.delete('sb-access-token');
    response.cookies.delete('sb-refresh-token');
    return response;
  }
}
