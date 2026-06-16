/**
 * Profile API - Returns the current user's profile from Supabase
 * Uses Supabase Auth (cookie-based) to identify the user.
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromSession } from '@/lib/auth';

export async function GET() {
  try {
    const payload = await getUserFromSession();

    if (!payload) {
      return NextResponse.json(
        { success: false, error: { message: 'Not authenticated', code: 'AUTH_REQUIRED' } },
        { status: 401 }
      );
    }

    // Get profile from Supabase
    if (!db) {
      return NextResponse.json({
        success: true,
        data: {
          id: payload.userId,
          email: payload.email,
          full_name: payload.fullName,
          role: payload.role,
          department: payload.department || null,
          is_active: true,
        },
      });
    }

    const { data: profile, error } = await db
      .from('profiles')
      .select('*')
      .eq('id', payload.userId)
      .single();

    if (error || !profile) {
      // Return session data as fallback
      return NextResponse.json({
        success: true,
        data: {
          id: payload.userId,
          email: payload.email,
          full_name: payload.fullName,
          role: payload.role,
          department: payload.department || null,
          is_active: true,
        },
      });
    }

    return NextResponse.json({ success: true, data: profile });
  } catch (err) {
    console.error('Profile fetch error:', err);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error', code: 'SERVER_ERROR' } },
      { status: 500 }
    );
  }
}
