/**
 * useAuth - Authentication Hook with Supabase + Local Auth Fallback
 *
 * Provides reactive auth state management using Supabase browser client
 * with automatic fallback to local auth (Prisma/SQLite + JWT) when
 * Supabase is unreachable.
 *
 * Auth flow:
 * 1. Try Supabase browser client auth (cookie-based)
 * 2. If Supabase is unreachable, fall back to local auth API routes
 * 3. Local auth uses JWT tokens stored in localStorage
 * 4. JWT tokens are sent via Authorization header for API calls
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
  authProvider: 'supabase' | 'local' | null;
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

// Local storage key for JWT token
const LOCAL_AUTH_TOKEN_KEY = 'infinity_legal_local_auth_token';
const LOCAL_AUTH_USER_KEY = 'infinity_legal_local_auth_user';

// Timeout wrapper to prevent hanging promises
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms)
    ),
  ]);
}

/**
 * Check if Supabase is reachable by attempting a lightweight health check.
 */
async function checkSupabaseConnectivity(): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || !isSupabaseConfigured()) return false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    await fetch(`${supabaseUrl}/auth/v1/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get stored local auth data from localStorage.
 */
function getLocalAuthData(): { token: string; user: any } | null {
  if (typeof window === 'undefined') return null;
  try {
    const token = localStorage.getItem(LOCAL_AUTH_TOKEN_KEY);
    const userJson = localStorage.getItem(LOCAL_AUTH_USER_KEY);
    if (token && userJson) {
      return { token, user: JSON.parse(userJson) };
    }
  } catch {
    // Ignore localStorage errors
  }
  return null;
}

/**
 * Store local auth data in localStorage.
 */
function setLocalAuthData(token: string, user: any) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_AUTH_TOKEN_KEY, token);
    localStorage.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify(user));
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Clear local auth data from localStorage.
 */
function clearLocalAuthData() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(LOCAL_AUTH_TOKEN_KEY);
    localStorage.removeItem(LOCAL_AUTH_USER_KEY);
  } catch {
    // Ignore localStorage errors
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    supabaseUser: null,
    accessToken: null,
    loading: true,
    error: null,
    authProvider: null,
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

  // Build a profile from local auth user data
  const buildLocalProfile = useCallback((userData: any): (Profile & { email_verified: boolean }) => ({
    id: userData.id,
    email: userData.email || '',
    full_name: userData.full_name || null,
    phone: userData.phone || null,
    avatar_url: null,
    role: userData.role || 'client',
    id_number: null,
    company: null,
    address: null,
    preferences: null,
    popi_consent: userData.popi_consent ?? false,
    email_verified: userData.email_verified ?? false,
    last_login_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }), []);

  // Initialize auth state — runs once
  useEffect(() => {
    const initAuth = async () => {
      // First, check if there's a local auth token in localStorage
      const localData = getLocalAuthData();
      if (localData?.token && localData?.user) {
        // Verify the token is still valid by calling a protected API
        try {
          const verifyRes = await fetch('/api/auth/verify', {
            method: 'GET',
            headers: { Authorization: `Bearer ${localData.token}` },
          });

          if (verifyRes.ok) {
            const profile = buildLocalProfile(localData.user);
            setAuthState({
              supabaseUser: null,
              user: profile,
              accessToken: localData.token,
              loading: false,
              error: null,
              authProvider: 'local',
            });
            return;
          } else {
            // Token is invalid, clear it
            clearLocalAuthData();
          }
        } catch {
          // Verification failed, try Supabase
          clearLocalAuthData();
        }
      }

      // If Supabase isn't configured, skip Supabase auth initialization
      if (!isSupabaseConfigured()) {
        queueMicrotask(() => {
          setAuthState({
            supabaseUser: null,
            user: null,
            accessToken: null,
            loading: false,
            error: null,
            authProvider: null,
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
                authProvider: 'supabase',
              });
            } else {
              setAuthState({
                supabaseUser: null,
                user: null,
                accessToken: null,
                loading: false,
                error: null,
                authProvider: null,
              });
            }
          } else if (event === 'SIGNED_OUT') {
            setAuthState({
              supabaseUser: null,
              user: null,
              accessToken: null,
              loading: false,
              error: null,
              authProvider: null,
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
    };

    initAuth();
  }, [getSupabase, fetchProfile, buildMinimalProfile, buildLocalProfile]);

  // Sign in with email and password — tries Supabase first, falls back to local auth
  const signIn = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      // Try Supabase first (only if configured)
      if (isSupabaseConfigured()) {
        const isReachable = await checkSupabaseConnectivity();

        if (isReachable) {
          const supabase = getSupabase();
          const { data, error } = await withTimeout(
            supabase.auth.signInWithPassword({
              email: email.toLowerCase().trim(),
              password,
            }),
            8000
          );

          if (!error && data.user) {
            // Supabase sign-in successful — state will be updated by onAuthStateChange
            return { success: true };
          }

          // If error is a credentials error (not network), don't fall back to local
          if (error && !error.message?.includes('Failed to fetch') && !error.message?.includes('NetworkError') && !error.message?.includes('Network request failed')) {
            // Check for "email not confirmed"
            if (error.message?.toLowerCase().includes('email not confirmed') || error.message?.toLowerCase().includes('email not verified')) {
              try {
                const confirmRes = await withTimeout(
                  fetch('/api/auth/auto-confirm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email.toLowerCase().trim() }),
                  }),
                  5000
                );

                if (confirmRes.ok) {
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
                      authProvider: 'supabase',
                    });
                    return { success: true };
                  }
                }
              } catch {
                // Auto-confirm failed, fall through to local auth
              }
            }

            // Supabase returned a proper auth error (wrong password, user not found, etc.)
            // Still try local auth as a fallback — the user might have signed up locally
          }
        }
      }

      // ============================================
      // Local Auth Fallback
      // ============================================
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.toLowerCase().trim(),
            password,
          }),
        });

        const result = await response.json();

        if (result.success && result.data) {
          const { token, user, authProvider } = result.data;

          if (authProvider === 'local') {
            // Store JWT token in localStorage for local auth
            setLocalAuthData(token, user);
            const profile = buildLocalProfile(user);
            setAuthState({
              supabaseUser: null,
              user: profile,
              accessToken: token,
              loading: false,
              error: null,
              authProvider: 'local',
            });
            return { success: true };
          }

          // Supabase auth via API route (shouldn't normally happen, but handle it)
          if (authProvider === 'supabase') {
            // The Supabase browser client should handle the session
            // But if it didn't, set the state from the API response
            const profile = buildLocalProfile(user);
            setAuthState(prev => ({
              ...prev,
              user: profile,
              accessToken: token,
              loading: false,
              error: null,
              authProvider: 'supabase',
            }));
            return { success: true };
          }
        }

        // Login failed
        const errorMessage = result.error?.message || result.error || 'Invalid email or password';
        setAuthState(prev => ({ ...prev, loading: false }));
        return { success: false, error: errorMessage };
      } catch (apiError: any) {
        const message = apiError?.message || 'Login failed. Please try again.';
        setAuthState(prev => ({ ...prev, loading: false, error: message }));
        return { success: false, error: message };
      }
    } catch (err: any) {
      const message = err?.message?.includes('timed out')
        ? 'Sign in timed out. The authentication service may be temporarily unavailable.'
        : (err?.message || 'Sign in failed');
      setAuthState(prev => ({ ...prev, loading: false, error: message }));
      return { success: false, error: message };
    }
  }, [getSupabase, fetchProfile, buildMinimalProfile, buildLocalProfile]);

  // Sign up via server-side route with local auth fallback
  const signUp = useCallback(async (signUpData: SignUpData): Promise<{ success: boolean; error?: string }> => {
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

      if (!response.ok || !result.success) {
        const errorMessage = result.error?.message || result.error || 'Signup failed';
        setAuthState(prev => ({ ...prev, loading: false }));
        return { success: false, error: errorMessage };
      }

      const { token, user, authProvider } = result.data;

      if (authProvider === 'local' && token) {
        // Local auth signup — store JWT and set state
        setLocalAuthData(token, user);
        const profile = buildLocalProfile(user);
        setAuthState({
          supabaseUser: null,
          user: profile,
          accessToken: token,
          loading: false,
          error: null,
          authProvider: 'local',
        });
        return { success: true };
      }

      if (authProvider === 'supabase') {
        // Try to auto sign-in via Supabase browser client
        try {
          if (isSupabaseConfigured()) {
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
                authProvider: 'supabase',
              });
              return { success: true };
            }
          }
        } catch {
          // Supabase auto sign-in failed
        }

        // Fallback: if we have a token from the API, use it
        if (token) {
          const profile = buildLocalProfile(user);
          setAuthState({
            supabaseUser: null,
            user: profile,
            accessToken: token,
            loading: false,
            error: null,
            authProvider: 'supabase',
          });
          return { success: true };
        }
      }

      // Account created but couldn't auto sign-in
      setAuthState(prev => ({ ...prev, loading: false, error: null }));
      return { success: true, error: 'Account created! Please sign in with your credentials.' };
    } catch (err: any) {
      const message = err?.message || 'Signup failed';
      setAuthState(prev => ({ ...prev, loading: false, error: message }));
      return { success: false, error: message };
    }
  }, [getSupabase, fetchProfile, buildMinimalProfile, buildLocalProfile]);

  // Sign out
  const signOut = useCallback(async () => {
    // Clear local auth data
    clearLocalAuthData();

    // Try Supabase sign-out
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase();
        await supabase.auth.signOut();
        // Also call the server-side signout to clear cookies
        await fetch('/api/auth/signout', { method: 'POST' });
      } catch (err) {
        console.error('Signout error:', err);
      }
    }

    // Always clear local state
    setAuthState({
      supabaseUser: null,
      user: null,
      accessToken: null,
      loading: false,
      error: null,
      authProvider: null,
    });
  }, [getSupabase]);

  // Refresh profile data
  const refreshProfile = useCallback(async (userId?: string) => {
    // If using local auth, we don't have a profiles table to refresh from
    // Just return the current state
    if (authState.authProvider === 'local') {
      return;
    }

    if (!isSupabaseConfigured()) return;

    const supabase = getSupabase();
    let uid = userId;
    if (!uid) {
      const { data: { user } } = await supabase.auth.getUser();
      uid = user?.id;
    }
    if (!uid) return;
    const profile = await fetchProfile(uid);
    if (profile) {
      setAuthState(prev => ({ ...prev, user: profile }));
    }
  }, [getSupabase, fetchProfile, authState.authProvider]);

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
