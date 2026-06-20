/**
 * Server-side Auth Helpers
 *
 * Functions to get the current authenticated user from cookies
 * in API routes and server components.
 */

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';

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
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get the current authenticated user from cookies.
 * Returns null if not authenticated.
 * Use this in API routes that require authentication.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createClient();

    // Get the user from the session cookies
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // Get the user's profile — explicit field selection for security
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone, avatar_url, role, id_number, company, popi_consent, email_verified, last_login_at, created_at, updated_at')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return null;
    }

    return {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      phone: profile.phone,
      avatar_url: profile.avatar_url,
      role: profile.role,
      id_number: profile.id_number,
      company: profile.company,
      popi_consent: profile.popi_consent,
      email_verified: profile.email_verified,
      last_login_at: profile.last_login_at,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
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
 * Get the current Supabase user ID from the session.
 * Lightweight - doesn't query the profiles table.
 */
export async function getAuthUserId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}
