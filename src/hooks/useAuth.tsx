/**
 * useAuth - Local JWT Authentication Hook
 *
 * Uses the local Prisma/SQLite auth system via /api/auth/login.
 * Issues an httpOnly `auth-token` cookie (HMAC-SHA256 JWT) that all
 * API routes read via getAuthUser().
 *
 * CROSS-ORIGIN IFRAME SUPPORT:
 * Cookies with SameSite=Lax are blocked in cross-origin iframes (e.g. the
 * preview-chat-*.space-z.ai preview). So on successful login we ALSO store
 * the JWT in localStorage and install a global fetch interceptor that
 * attaches `Authorization: Bearer <token>` to all /api/* requests. The
 * server's requireAuth() accepts the Bearer header as a fallback to the
 * cookie, so auth works in both normal and iframe contexts. See
 * src/lib/auth-fetch.ts for the transport details.
 *
 * This is the single source of truth for client-side auth. Supabase
 * is no longer used for authentication (only the DB may be used for
 * other features if configured).
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { UserRole } from '@/components/types';
import {
  installAuthFetch,
  getStoredToken,
  setStoredToken,
  withAuthHeader,
} from '@/lib/auth-fetch';

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

/**
 * Fetch the current user from /api/auth/profile.
 *
 * Works in BOTH normal (cookie) and cross-origin iframe (Bearer header) contexts.
 * The global fetch interceptor (installed at module load in auth-fetch.ts) attaches
 * `Authorization: Bearer <token>` automatically when a token is in memory. If the
 * interceptor somehow isn't live, callers can pass `explicitToken` to force the
 * header via withAuthHeader() — this is used by signIn() for the critical
 * post-login profile fetch so it never depends on interceptor timing.
 */
async function fetchCurrentUser(explicitToken?: string): Promise<AuthUser | null> {
  try {
    const baseInit: RequestInit = {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    };
    // If an explicit token is provided, set the Authorization header directly so
    // this call succeeds even if the global interceptor hasn't installed yet.
    const init = explicitToken
      ? (() => {
          const headers = new Headers();
          headers.set('Authorization', `Bearer ${explicitToken}`);
          return { ...baseInit, headers, credentials: 'include' as const };
        })()
      : withAuthHeader(baseInit);
    const res = await fetch('/api/auth/profile', init);
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

  // On mount: install the cross-origin fetch interceptor (attaches Bearer token
  // from localStorage to /api/* requests when available), then check auth state.
  // The interceptor must be installed BEFORE the initial profile fetch so that a
  // returning user with a token in localStorage (but no cookie, e.g. inside the
  // preview iframe) is recognized as authenticated.
  useEffect(() => {
    installAuthFetch();
    let cancelled = false;
    (async () => {
      const user = await fetchCurrentUser();
      if (cancelled) return;
      setAuthState({
        user,
        accessToken: user ? (getStoredToken() || 'cookie') : null,
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

      // Store the JWT in localStorage so the global fetch interceptor can
      // attach it as a Bearer header on subsequent /api/* calls. This is
      // essential for cross-origin iframes where SameSite=Lax cookies are
      // blocked — without it, /api/auth/profile (and every other authed
      // endpoint) would 401 immediately after login.
      const token: string | undefined = json.data?.token;
      if (token) {
        setStoredToken(token);
      }

      // The login response includes a partial user object. Use it immediately
      // so the UI flips to the authenticated state without a second round-trip,
      // then refresh the full profile in the background.
      const partial = json.data?.user;
      const initialUser: AuthUser | null = partial
        ? {
            id: partial.id,
            email: partial.email,
            full_name: partial.full_name ?? null,
            phone: null,
            avatar_url: null,
            role: partial.role as UserRole,
            id_number: null,
            company: null,
            popi_consent: null,
            email_verified: partial.email_verified ?? null,
            last_login_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        : null;

      if (initialUser) {
        setAuthState({
          user: initialUser,
          accessToken: token || 'cookie',
          loading: false,
          error: null,
        });
      }

      // Fetch the full profile (phone, avatar, etc.) in the background.
      // Pass the explicit token so this works EVEN IF the global interceptor
      // hasn't installed yet, AND even if localStorage is blocked (the token is
      // in the in-memory store from setStoredToken above). This is the critical
      // call that makes login "stick" — if it 401s, the user appears logged out.
      const fullUser = await fetchCurrentUser(token);
      setAuthState({
        user: fullUser || initialUser,
        accessToken: token || 'cookie',
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
    // Clear the localStorage token first so the interceptor stops attaching it.
    setStoredToken(null);
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
