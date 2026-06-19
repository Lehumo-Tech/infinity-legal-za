/**
 * POST /api/auth/auto-confirm - Auto-confirm a user's email
 *
 * After a user signs up via the Supabase browser client,
 * Supabase may require email confirmation before login.
 * This endpoint uses the admin API to auto-confirm the user's email
 * so they can sign in immediately without checking their email.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ success: false, error: 'Email required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Find the user by email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      return NextResponse.json({ success: false, error: listError.message }, { status: 500 });
    }

    const user = users.find(u => u.email === email);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Auto-confirm the user's email
    const { error: confirmError } = await supabase.auth.admin.updateUserById(user.id, {
      email_confirm: true,
    });

    if (confirmError) {
      return NextResponse.json({ success: false, error: confirmError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Auto-confirm error:', error);
    return NextResponse.json({ success: false, error: 'Failed to confirm email' }, { status: 500 });
  }
}
