/**
 * Infinity Legal ZA - Database Client (Supabase)
 * 
 * Provides Supabase client instances for server-side Route Handlers.
 * Uses service role key to bypass RLS where needed.
 * Gracefully handles missing configuration.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Singleton pattern for dev mode
const globalForSupabase = globalThis as unknown as {
  supabaseAdmin: ReturnType<typeof createSupabaseClient<Database>> | undefined;
  supabasePublic: ReturnType<typeof createSupabaseClient<Database>> | undefined;
};

const isConfigured = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co' && supabaseServiceKey;

/**
 * Admin Supabase client — bypasses RLS for server-side operations.
 * Use this in API routes that need full database access.
 */
export const db = isConfigured
  ? (globalForSupabase.supabaseAdmin ??
    createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    }))
  : null;

if (process.env.NODE_ENV !== 'production' && db) {
  globalForSupabase.supabaseAdmin = db;
}

/**
 * Public Supabase client — respects RLS policies.
 */
export const dbPublic = isConfigured && supabaseAnonKey
  ? (globalForSupabase.supabasePublic ??
    createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    }))
  : null;

if (process.env.NODE_ENV !== 'production' && dbPublic) {
  globalForSupabase.supabasePublic = dbPublic;
}

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  return isConfigured;
}

/**
 * Get the database client or return an error response.
 * Use this at the top of API route handlers.
 */
export function requireDb() {
  if (!db) {
    return { db: null, error: 'Database not configured. Please set Supabase environment variables.' };
  }
  return { db, error: null };
}

export type SupabaseClient = NonNullable<typeof db>;
