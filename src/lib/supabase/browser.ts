/**
 * Supabase Browser Client
 * Used in Client Components
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/supabase/types';

let _isConfigured: boolean | null = null;

export function isSupabaseConfigured(): boolean {
  const configured = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  // Only cache true — never cache false (env vars might become available later)
  if (configured) _isConfigured = true;
  return _isConfigured ?? configured;
}

export function createBrowserSupabaseClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env'
    );
  }
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
