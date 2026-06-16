/**
 * POST /api/auth/signout - Sign out user
 *
 * Clears the Supabase auth session cookies.
 * Requires authentication to prevent abuse.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, apiError } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    // Verify the user is authenticated before signing out
    const auth = await requireAuth(request);

    const supabase = await createClient();
    await supabase.auth.signOut();

    // Audit log — only if user was authenticated
    if (auth.authenticated && auth.user) {
      await createAuditLog({
        user_id: auth.user.userId,
        action: 'USER_SIGNOUT',
        resource_type: 'user',
        resource_id: auth.user.userId,
        ip_address: request.headers.get('x-forwarded-for') || undefined,
        user_agent: request.headers.get('user-agent') || undefined,
      });
    }

    const response = NextResponse.json({ success: true });

    // Clear any remaining auth cookies
    response.cookies.delete('sb-access-token');
    response.cookies.delete('sb-refresh-token');

    return response;
  } catch (error) {
    console.error('Signout error:', error);
    return NextResponse.json({ success: false, error: 'Signout failed' }, { status: 500 });
  }
}
