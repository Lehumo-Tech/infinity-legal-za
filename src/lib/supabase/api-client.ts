/**
 * Infinity Legal ZA - Secure API Database Client
 *
 * Provides two types of Supabase clients for API routes:
 *
 * 1. `getAuthenticatedClient()` — Cookie-based, RLS-enforced.
 *    Use this for ALL data operations. The database RLS policies
 *    will enforce access control at the row level.
 *
 * 2. `getAdminClient()` — Service role, bypasses RLS.
 *    ONLY use for auth operations (login, signup, password reset)
 *    and server-to-server webhooks (PayFast ITN).
 *
 * SECURITY PRINCIPLE: Defense in depth.
 * Even though API routes check permissions programmatically,
 * RLS provides a second layer of protection at the database level.
 */

import { createClient as createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/supabase/types';
import type { SupabaseClient } from '@supabase/supabase-js';

type TypedClient = SupabaseClient<Database>;

// ============================================
// AUTHENTICATED CLIENT (RLS-enforced)
// ============================================

/**
 * Get a Supabase client scoped to the current authenticated user.
 * This client respects all RLS policies.
 *
 * MUST be called within an API route where the user is already
 * authenticated (verified by the root middleware or requireAuth).
 *
 * Returns null if the user is not authenticated.
 */
export async function getAuthenticatedClient(): Promise<{ client: TypedClient; userId: string } | null> {
  try {
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://placeholder.supabase.co') {
      return null;
    }

    const client = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component context — middleware handles session refresh
          }
        },
      },
    });

    // Verify the user is authenticated
    const { data: { user }, error } = await client.auth.getUser();
    if (error || !user) {
      return null;
    }

    return { client, userId: user.id };
  } catch {
    return null;
  }
}

// ============================================
// ADMIN CLIENT (Bypasses RLS)
// ============================================

let adminClientSingleton: TypedClient | null = null;

/**
 * Get a Supabase admin client that bypasses RLS.
 *
 * ⚠️  SECURITY WARNING: Only use this for:
 * - Auth operations (login, signup, password reset)
 * - Server-to-server webhooks (PayFast ITN)
 * - Operations where no user context exists
 *
 * NEVER use this for regular data operations that should
 * be subject to RLS policies.
 */
export function getAdminClient(): TypedClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey || supabaseUrl === 'https://placeholder.supabase.co') {
    return null;
  }

  if (process.env.NODE_ENV !== 'production' && adminClientSingleton) {
    return adminClientSingleton;
  }

  const client = createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (process.env.NODE_ENV !== 'production') {
    adminClientSingleton = client;
  }

  return client;
}

// ============================================
// CONVENIENCE: Get client based on context
// ============================================

/**
 * Get the appropriate Supabase client for an API route.
 *
 * If the user is authenticated (cookie-based), returns the RLS-enforced client.
 * Falls back to the admin client only if no user session exists.
 *
 * Use this when you want RLS-enforced access but need a fallback
 * for operations that don't require user context.
 */
export async function getApiClient(): Promise<{
  client: TypedClient;
  userId: string | null;
  isAuthenticated: boolean;
}> {
  // Try authenticated client first
  const authResult = await getAuthenticatedClient();
  if (authResult) {
    return {
      client: authResult.client,
      userId: authResult.userId,
      isAuthenticated: true,
    };
  }

  // Fall back to admin client
  const adminClient = getAdminClient();
  if (adminClient) {
    return {
      client: adminClient,
      userId: null,
      isAuthenticated: false,
    };
  }

  // No client available — should not happen in production
  throw new Error('No Supabase client available. Check environment configuration.');
}
