/**
 * useAuth - Supabase Authentication Hook
 *
 * Provides reactive auth state management using Supabase browser client.
 * Cookie-based SSR auth with middleware session refresh.
 *
 * Auto sign-in: After signup, users are auto-confirmed and can sign in
 * immediately. If a sign-in fails with "Email not confirmed", the system
 * will auto-confirm the email and retry the sign-in automatically.
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { createBrowserSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/browser';
import type { User } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthState {
  user: (Profile & { email_verified: boolean }) | null;
  supabaseUser: User | null;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (data: SignUpData) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

interface SignUpData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  popia_consent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Timeout wrapper to prevent hanging promises
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    supabaseUser: null,
    accessToken: null,
    loading: true,
    error: null,
  });
  const supabaseRef = useRef<ReturnType<typeof createBrowserSupabaseClient> | null>(null);
  const initializedRef = useRef(false);

  // Lazy init the browser client
  const getSupabase = useCallback(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createBrowserSupabaseClient();
    }
    return supabaseRef.current;
  }, []);

  // Fetch the user's profile from the profiles table (with timeout)
  const fetchProfile = useCallback(async (userId: string): Promise<(Profile & { email_verified: boolean }) | null> => {
    const supabase = getSupabase();
    try {
      const { data: profile, error } = await withTimeout(
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single(),
        5000 // 5 second timeout
      );

      if (error || !profile) {
        return null;
      }

      // Also get email_verified from auth
      const { data: { user: authUser } } = await withTimeout(
        supabase.auth.getUser(),
        3000 // 3 second timeout
      );

      return {
        ...profile,
        email_verified: authUser?.email_confirmed_at ? true : false,
      };
    } catch (err) {
      return null;
    }
  }, [getSupabase]);

  // Build a minimal profile from auth user data when the profiles table row doesn't exist yet
  const buildMinimalProfile = useCallback((authUser: User): (Profile & { email_verified: boolean }) => ({
    id: authUser.id,
    email: authUser.email || '',
    full_name: authUser.user_metadata?.full_name || null,
    phone: authUser.user_metadata?.phone || null,
    avatar_url: null,
    role: (authUser.user_metadata?.role || 'client') as string,
    id_number: null,
    company: null,
    address: null,
    preferences: null,
    popi_consent: false,
    email_verified: !!authUser.email_confirmed_at,
    last_login_at: null,
    created_at: authUser.created_at,
    updated_at: authUser.updated_at || authUser.created_at,
  }), []);

  // Initialize auth state — runs once
  useEffect(() => {
    // If Supabase isn't configured, skip auth initialization
    if (!isSupabaseConfigured()) {
      queueMicrotask(() => {
        setAuthState({
          supabaseUser: null,
          user: null,
          accessToken: null,
          loading: false,
          error: null,
        });
      });
      return;
    }

    const supabase = getSupabase();

    // Listen for auth state changes — handles everything including INITIAL_SESSION
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        initializedRef.current = true;

        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          if (session?.user) {
            const profile = await fetchProfile(session.user.id);
            setAuthState({
              supabaseUser: session.user,
              user: profile ?? buildMinimalProfile(session.user),
              accessToken: session.access_token,
              loading: false,
              error: null,
            });
          } else {
            setAuthState({
              supabaseUser: null,
              user: null,
              accessToken: null,
              loading: false,
              error: null,
            });
          }
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            supabaseUser: null,
            user: null,
            accessToken: null,
            loading: false,
            error: null,
          });
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setAuthState(prev => ({
            ...prev,
            supabaseUser: session.user,
            accessToken: session.access_token,
          }));
        }
      }
    );

    // Fallback: if onAuthStateChange never fires (e.g. Supabase is unreachable), stop loading after 3s
    const fallbackTimer = setTimeout(() => {
      if (!initializedRef.current) {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, [getSupabase, fetchProfile, buildMinimalProfile]);

  // Sign in with email and password — uses Supabase browser client directly
  // Auto-confirms email if needed, then retries sign-in
  const signIn = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Service unavailable. Please try again later.' };
    }
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const supabase = getSupabase();

      // First, do a quick connectivity check to the Supabase auth endpoint
      try {
        const controller = new AbortController();
        const connectivityTimeout = setTimeout(() => controller.abort(), 4000);
        await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`, {
          method: 'GET',
          signal: controller.signal,
        });
        clearTimeout(connectivityTimeout);
      } catch (connErr) {
        // Supabase is unreachable — fail immediately with a clear message
        console.warn('Supabase connectivity check failed:', connErr);
        setAuthState(prev => ({ ...prev, loading: false }));
        return { success: false, error: 'Unable to connect to the authentication service. Please check your internet connection and try again.' };
      }

      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({
          email: email.toLowerCase().trim(),
          password,
        }),
        8000 // 8 second timeout for sign-in
      );

      if (error) {
        // Check if this is a network error (Supabase unreachable)
        if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError') || error.message?.includes('Network request failed')) {
          setAuthState(prev => ({ ...prev, loading: false }));
          return { success: false, error: 'Unable to connect to authentication service. Please check your internet connection and try again.' };
        }

        // If email is not confirmed, auto-confirm and retry
        if (error.message?.toLowerCase().includes('email not confirmed') || error.message?.toLowerCase().includes('email not verified')) {
          try {
            const confirmRes = await withTimeout(
              fetch('/api/auth/auto-confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.toLowerCase().trim() }),
              }),
              5000 // 5 second timeout for auto-confirm
            );

            if (confirmRes.ok) {
              // Retry sign-in after auto-confirm
              const { data: retryData, error: retryError } = await withTimeout(
                supabase.auth.signInWithPassword({
                  email: email.toLowerCase().trim(),
                  password,
                }),
                8000
              );

              if (!retryError && retryData.user) {
                const profile = await fetchProfile(retryData.user.id);

                setAuthState({
                  supabaseUser: retryData.user,
                  user: profile ?? buildMinimalProfile(retryData.user),
                  accessToken: retryData.session?.access_token ?? null,
                  loading: false,
                  error: null,
                });
                return { success: true };
              }
            }
          } catch {
            // Auto-confirm failed, fall through to original error
          }
        }

        setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
        return { success: false, error: error.message };
      }

      if (data.user) {
        const profile = await fetchProfile(data.user.id);

        setAuthState({
          supabaseUser: data.user,
          user: profile ?? buildMinimalProfile(data.user),
          accessToken: data.session?.access_token ?? null,
          loading: false,
          error: null,
        });
        return { success: true };
      }

      setAuthState(prev => ({ ...prev, loading: false, error: 'Sign in failed' }));
      return { success: false, error: 'Sign in failed — no user returned' };
    } catch (err: any) {
      const message = err?.message?.includes('timed out')
        ? 'Sign in timed out. The authentication service may be temporarily unavailable.'
        : (err?.message || 'Sign in failed');
      setAuthState(prev => ({ ...prev, loading: false, error: message }));
      return { success: false, error: message };
    }
  }, [getSupabase, fetchProfile, buildMinimalProfile]);

  // Sign up via server-side route — auto sign-in after successful signup
  const signUp = useCallback(async (signUpData: SignUpData): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Service unavailable. Please try again.' };
    }
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signUpData.email.toLowerCase().trim(),
          password: signUpData.password,
          full_name: signUpData.full_name,
          phone: signUpData.phone || undefined,
          consent_given: signUpData.popia_consent,
          popia_consent: signUpData.popia_consent,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        const errorMessage = result.error?.message || result.error || result.message || 'Signup failed';
        setAuthState(prev => ({ ...prev, loading: false }));
        return { success: false, error: errorMessage };
      }

      // Account created successfully — auto sign-in
      try {
        const supabase = getSupabase();
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: signUpData.email.toLowerCase().trim(),
          password: signUpData.password,
        });

        if (!signInError && signInData.user) {
          const profile = await fetchProfile(signInData.user.id);
          setAuthState({
            supabaseUser: signInData.user,
            user: profile ?? buildMinimalProfile(signInData.user),
            accessToken: signInData.session?.access_token ?? null,
            loading: false,
            error: null,
          });
          return { success: true };
        }
      } catch {
        // Auto sign-in failed — user will need to sign in manually
      }

      // Fallback: account created but couldn't auto sign-in — clear error state
      setAuthState(prev => ({ ...prev, loading: false, error: null }));
      return { success: true, error: 'Account created! Please sign in with your credentials.' };
    } catch (err: any) {
      const message = err?.message || 'Signup failed';
      setAuthState(prev => ({ ...prev, loading: false, error: message }));
      return { success: false, error: message };
    }
  }, [getSupabase, fetchProfile, buildMinimalProfile]);

  // Sign out
  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      return;
    }
    try {
      const supabase = getSupabase();
      await supabase.auth.signOut();
      // Also call the server-side signout to clear cookies
      await fetch('/api/auth/signout', { method: 'POST' });
    } catch (err) {
      console.error('Signout error:', err);
    }
    // Always clear local state regardless of API call success
    setAuthState({
      supabaseUser: null,
      user: null,
      accessToken: null,
      loading: false,
      error: null,
    });
  }, [getSupabase]);

  // Refresh profile data
  const refreshProfile = useCallback(async (userId?: string) => {
    const supabase = getSupabase();
    let uid = userId;
    if (!uid) {
      const { data: { user } } = await supabase.auth.getUser();
      uid = user?.id;
    }
    if (!uid) return;
    if (!isSupabaseConfigured()) return;
    const profile = await fetchProfile(uid);
    if (profile) {
      setAuthState(prev => ({ ...prev, user: profile }));
    }
  }, [getSupabase, fetchProfile]);

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
