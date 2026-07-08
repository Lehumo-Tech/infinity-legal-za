/**
 * useAuth - Local JWT Authentication Hook
 *
 * Uses the local Prisma/SQLite auth system via /api/auth/login.
 * Issues an httpOnly `auth-token` cookie (HMAC-SHA256 JWT) that all
 * API routes read via getAuthUser().
 *
 * This is the single source of truth for client-side auth. Supabase
 * is no longer used for authentication (only the DB may be used for
 * other features if configured).
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { UserRole } from '@/components/types';

// ============================================
// TYPES
// ============================================

interface AuthUser {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  id_number: string | null;
  company: string | null;
  popi_consent: boolean | null;
  email_verified: boolean | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: AuthUser | null;
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

// ============================================
// HELPERS
// ============================================

/** Fetch the current user from /api/auth/profile (reads the auth-token cookie). */
async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const res = await fetch('/api/auth/profile', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && json.data) {
      return json.data as AuthUser;
    }
    return null;
  } catch {
    return null;
  }
}

// ============================================
// PROVIDER
// ============================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    accessToken: null,
    loading: true,
    error: null,
  });
  const initializedRef = useRef(false);

  // On mount: check if already authenticated via cookie
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const user = await fetchCurrentUser();
      if (cancelled) return;
      setAuthState({
        user,
        accessToken: user ? 'cookie' : null, // cookie-based; no access token in JS
        loading: false,
        error: null,
      });
      initializedRef.current = true;
    })();

    // Safety: stop loading after 8s even if profile fetch hangs
    const timer = setTimeout(() => {
      if (!initializedRef.current && !cancelled) {
        setAuthState(prev => ({ ...prev, loading: false }));
        initializedRef.current = true;
      }
    }, 8000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  // ============================================
  // SIGN IN — calls /api/auth/login which sets the auth-token cookie
  // ============================================
  const signIn = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        const msg = json.error?.message || json.error || 'Sign in failed';
        setAuthState(prev => ({ ...prev, loading: false, error: msg }));
        return { success: false, error: msg };
      }

      // Cookie is now set by the server. Fetch the full profile.
      const user = await fetchCurrentUser();
      setAuthState({
        user,
        accessToken: 'cookie',
        loading: false,
        error: null,
      });
      return { success: true };
    } catch (err: any) {
      const message = err?.message || 'Sign in failed';
      setAuthState(prev => ({ ...prev, loading: false, error: message }));
      return { success: false, error: message };
    }
  }, []);

  // ============================================
  // SIGN UP — calls /api/auth/signup, then signs in
  // ============================================
  const signUp = useCallback(async (signUpData: SignUpData): Promise<{ success: boolean; error?: string }> => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: signUpData.email.toLowerCase().trim(),
          password: signUpData.password,
          full_name: signUpData.full_name,
          phone: signUpData.phone || undefined,
          consent_given: signUpData.popia_consent,
          popia_consent: signUpData.popia_consent,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        const msg = json.error?.message || json.error || 'Signup failed';
        setAuthState(prev => ({ ...prev, loading: false }));
        return { success: false, error: msg };
      }

      // Account created — auto sign-in to set the auth-token cookie
      const signInResult = await signIn(signUpData.email, signUpData.password);
      if (signInResult.success) {
        return { success: true };
      }

      // Account created but auto sign-in failed — user can sign in manually
      setAuthState(prev => ({ ...prev, loading: false, error: null }));
      return { success: true, error: 'Account created! Please sign in with your credentials.' };
    } catch (err: any) {
      const message = err?.message || 'Signup failed';
      setAuthState(prev => ({ ...prev, loading: false, error: message }));
      return { success: false, error: message };
    }
  }, [signIn]);

  // ============================================
  // SIGN OUT — clears the auth-token cookie via /api/auth/signout
  // ============================================
  const signOut = useCallback(async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST', credentials: 'include' });
    } catch {
      // ignore — clear local state regardless
    }
    setAuthState({
      user: null,
      accessToken: null,
      loading: false,
      error: null,
    });
  }, []);

  // ============================================
  // REFRESH PROFILE
  // ============================================
  const refreshProfile = useCallback(async () => {
    const user = await fetchCurrentUser();
    if (user) {
      setAuthState(prev => ({ ...prev, user }));
    }
  }, []);

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
