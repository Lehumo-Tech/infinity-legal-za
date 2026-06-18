/**
 * useAuth - Supabase Authentication Hook
 *
 * Provides reactive auth state management using Supabase browser client.
 * Replaces the old localStorage-based token approach with proper
 * cookie-based SSR auth.
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    supabaseUser: null,
    accessToken: null,
    loading: true,
    error: null,
  });
  const supabaseRef = useRef<ReturnType<typeof createBrowserSupabaseClient> | null>(null);
  const mountedRef = useRef(false);

  // Lazy init the browser client
  const getSupabase = useCallback(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createBrowserSupabaseClient();
    }
    return supabaseRef.current;
  }, []);

  // Fetch the user's profile from the profiles table
  const fetchProfile = useCallback(async (userId: string): Promise<(Profile & { email_verified: boolean }) | null> => {
    const supabase = getSupabase();
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        console.error('Profile fetch error:', error);
        return null;
      }

      // Also get email_verified from auth
      const { data: { user: authUser } } = await supabase.auth.getUser();

      return {
        ...profile,
        email_verified: authUser?.email_confirmed_at ? true : false,
      };
    } catch (err) {
      console.error('Profile fetch exception:', err);
      return null;
    }
  }, [getSupabase]);

  // Initialize auth state
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    // If Supabase isn't configured, skip auth initialization
    if (!isSupabaseConfigured()) {
      setAuthState({
        supabaseUser: null,
        user: null,
        accessToken: null,
        loading: false,
        error: null,
      });
      return;
    }

    const supabase = getSupabase();

    // Get initial session
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setAuthState({
            supabaseUser: session.user,
            user: profile,
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
      } catch (err) {
        console.error('Auth init error:', err);
        setAuthState({
          supabaseUser: null,
          user: null,
          loading: false,
          error: 'Failed to initialize auth',
        });
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await fetchProfile(session.user.id);
          setAuthState({
            supabaseUser: session.user,
            user: profile,
            accessToken: session.access_token,
            loading: false,
            error: null,
          });
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            supabaseUser: null,
            user: null,
            accessToken: null,
            loading: false,
            error: null,
          });
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          const profile = await fetchProfile(session.user.id);
          setAuthState(prev => ({
            ...prev,
            supabaseUser: session.user,
            user: profile ?? prev.user,
            accessToken: session.access_token,
          }));
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [getSupabase, fetchProfile]);

  // Sign in with email and password
  const signIn = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase is not configured' };
    }
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
        return { success: false, error: error.message };
      }

      if (data.user) {
        const profile = await fetchProfile(data.user.id);
        if (!profile) {
          setAuthState(prev => ({ ...prev, loading: false, error: 'Profile not found' }));
          return { success: false, error: 'Profile not found. Please contact support.' };
        }

        setAuthState({
          supabaseUser: data.user,
          user: profile,
          accessToken: data.session?.access_token ?? null,
          loading: false,
          error: null,
        });
        return { success: true };
      }

      setAuthState(prev => ({ ...prev, loading: false, error: 'No user returned' }));
      return { success: false, error: 'Login failed - no user returned' };
    } catch (err: any) {
      const message = err?.message || 'Login failed';
      setAuthState(prev => ({ ...prev, loading: false, error: message }));
      return { success: false, error: message };
    }
  }, [getSupabase, fetchProfile]);

  // Sign up with email and password
  const signUp = useCallback(async (signUpData: SignUpData): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase is not configured' };
    }
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signUp({
        email: signUpData.email.toLowerCase().trim(),
        password: signUpData.password,
        options: {
          data: {
            full_name: signUpData.full_name,
            phone: signUpData.phone || undefined,
            popia_consent: signUpData.popia_consent,
          },
        },
      });

      if (error) {
        setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
        return { success: false, error: error.message };
      }

      // If email confirmation is required, the user won't have a session yet
      if (data.user && !data.session) {
        setAuthState(prev => ({ ...prev, loading: false }));
        return { success: true, error: undefined };
      }

      // If auto-confirmed and we have a session
      if (data.user && data.session) {
        const profile = await fetchProfile(data.user.id);
        setAuthState({
          supabaseUser: data.user,
          user: profile,
          accessToken: data.session.access_token,
          loading: false,
          error: null,
        });
        return { success: true };
      }

      setAuthState(prev => ({ ...prev, loading: false }));
      return { success: true };
    } catch (err: any) {
      const message = err?.message || 'Signup failed';
      setAuthState(prev => ({ ...prev, loading: false, error: message }));
      return { success: false, error: message };
    }
  }, [getSupabase, fetchProfile]);

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
    // Use the supabase client directly to get the current user if no userId provided
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
