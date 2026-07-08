/**
 * Server-side Auth Helpers
 *
 * Functions to get the current authenticated user from cookies
 * in API routes and server components.
 *
 * Now uses Prisma/SQLite local auth via JWT cookies instead of Supabase.
 * The local auth cookie name is 'auth-token' (set by the frontend after login).
 * Falls back to Bearer token via validateLocalToken.
 */

import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { validateToken, type JWTPayload } from '@/lib/local-auth';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  id_number: string | null;
  company: string | null;
  popi_consent: boolean | null;
  email_verified: boolean | null;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Get the current authenticated user from cookies (or Bearer token).
 * Returns null if not authenticated.
 * Use this in API routes that require authentication.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    // Try cookie-based JWT first
    const cookieStore = await cookies();
    const tokenFromCookie =
      cookieStore.get('auth-token')?.value ||
      cookieStore.get('sb-access-token')?.value ||
      null;

    let payload: JWTPayload | null = null;
    if (tokenFromCookie) {
      payload = validateToken(tokenFromCookie);
    }

    if (!payload) {
      return null;
    }

    // Verify user still exists in DB and load fresh profile
    const user = await db.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.is_active) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      avatar_url: user.avatar_url,
      role: user.role,
      id_number: user.id_number,
      company: user.company,
      popi_consent: user.popi_consent,
      email_verified: user.email_verified,
      last_login_at: user.last_login_at,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  } catch {
    return null;
  }
}

/**
 * Get the current authenticated user, or return an error response.
 * Use this at the top of API route handlers that require authentication.
 */
export async function requireAuth(): Promise<{ user: AuthUser; error: null } | { user: null; error: { message: string; status: number } }> {
  const user = await getAuthUser();

  if (!user) {
    return {
      user: null,
      error: {
        message: 'Authentication required',
        status: 401,
      },
    };
  }

  return { user, error: null };
}

/**
 * Check if a user has a specific role.
 */
export function hasRole(user: AuthUser, ...roles: string[]): boolean {
  return roles.includes(user.role);
}

/**
 * Check if a user is an admin (managing_director, senior_partner, systems_admin, admin).
 */
export function isAdminUser(user: AuthUser): boolean {
  return hasRole(user, 'managing_director', 'senior_partner', 'systems_admin', 'admin');
}

/**
 * Check if a user is staff (not a client or guest).
 */
export function isStaffUser(user: AuthUser): boolean {
  return !hasRole(user, 'client', 'guest');
}

/**
 * Get the current user ID from the session cookie.
 * Lightweight - doesn't query the users table.
 */
export async function getAuthUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get('auth-token')?.value ||
      cookieStore.get('sb-access-token')?.value ||
      null;
    if (!token) return null;
    const payload = validateToken(token);
    return payload?.sub ?? null;
  } catch {
    return null;
  }
}
