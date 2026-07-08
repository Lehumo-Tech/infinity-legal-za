/**
 * POST /api/auth/signout - Sign out user
 *
 * Clears the local auth cookie (auth-token) and any legacy Supabase cookies.
 * Does NOT require authentication — a user with an expired session
 * still needs to be able to sign out and clear stale cookies.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAuditLog } from '@/lib/audit';
import { validateToken } from '@/lib/local-auth';

export async function POST(request: NextRequest) {
  // Try audit log — best effort, don't block signout if it fails
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get('auth-token')?.value ||
      cookieStore.get('sb-access-token')?.value ||
      null;

    if (token) {
      const payload = validateToken(token);
      if (payload) {
        await createAuditLog({
          user_id: payload.sub,
          action: 'USER_SIGNOUT',
          resource_type: 'user',
          resource_id: payload.sub,
          ip_address: request.headers.get('x-forwarded-for') || undefined,
          user_agent: request.headers.get('user-agent') || undefined,
        });
      }
    }
  } catch {
    // Audit log failure should not prevent signout
  }

  const response = NextResponse.json({ success: true });

  // Clear local auth cookie
  response.cookies.delete('auth-token');

  // Clear legacy Supabase cookies
  response.cookies.delete('sb-access-token');
  response.cookies.delete('sb-refresh-token');

  // Also clear any other Supabase cookie patterns
  const allCookies = request.cookies.getAll();
  for (const cookie of allCookies) {
    if (cookie.name.startsWith('sb-') || cookie.name.includes('supabase')) {
      response.cookies.delete(cookie.name);
    }
  }

  return response;
}
