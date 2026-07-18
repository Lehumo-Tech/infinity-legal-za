'use client';

/**
 * AppProviders — combines all client-side context providers:
 * - ClerkProvider (when Clerk is enabled)
 * - PostHogProvider (when PostHog is enabled)
 * - AuthProvider (local JWT auth — always available as fallback)
 *
 * This component is used in src/app/layout.tsx to wrap the entire app.
 */

import React from 'react';
import { AuthProvider } from '@/hooks/useAuth';
import { isClerkEnabled, clerkPublishableKey, clerkSignInUrl, clerkSignUpUrl, clerkAfterSignInUrl, clerkAfterSignUpUrl } from '@/lib/clerk-config';
import { isPostHogEnabled, posthogKey, posthogHost } from '@/lib/posthog-client';

// ============================================
// Clerk Provider (conditional)
// ============================================
function ClerkProviderWrapper({ children }: { children: React.ReactNode }) {
  if (!isClerkEnabled) return <>{children}</>;

  // Lazy-load Clerk SDK only when enabled, so it isn't bundled when disabled.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ClerkProvider } = require('@clerk/nextjs');
  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      appearance={{
        variables: {
          colorPrimary: '#0c1e3c',
          colorText: '#0c1e3c',
          colorBackground: '#ffffff',
          colorInputBackground: '#ffffff',
          colorInputText: '#0c1e3c',
          borderRadius: '0.5rem',
          fontFamily: 'Georgia, serif',
        },
        elements: {
          formButtonPrimary: 'bg-[#c9a84c] text-[#0c1e3c] hover:bg-[#dfc475] font-semibold',
          card: 'shadow-xl border border-slate-100',
          headerTitle: 'text-[#0c1e3c] font-bold',
          headerSubtitle: 'text-slate-500',
        },
      }}
      signInUrl={clerkSignInUrl}
      signUpUrl={clerkSignUpUrl}
      afterSignInUrl={clerkAfterSignInUrl}
      afterSignUpUrl={clerkAfterSignUpUrl}
    >
      {children}
    </ClerkProvider>
  );
}

// ============================================
// PostHog Provider (conditional)
// ============================================
function PostHogProviderWrapper({ children }: { children: React.ReactNode }) {
  if (!isPostHogEnabled) return <>{children}</>;

  // Lazy-load PostHog SDK only when enabled, so it isn't bundled when disabled.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PostHogProvider } = require('posthog-js/react');
  return (
    <PostHogProvider
      apiKey={posthogKey}
      options={{
        api_host: posthogHost,
        loaded: (posthog: any) => {
          if (process.env.NODE_ENV === 'development') posthog.debug();
        },
        capture_pageview: true,
        capture_pageleave: true,
        autocapture: false,
        disable_session_recording: false,
      }}
    >
      {children}
    </PostHogProvider>
  );
}

// ============================================
// Combined App Providers
// ============================================
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProviderWrapper>
      <PostHogProviderWrapper>
        <AuthProvider>
          {children}
        </AuthProvider>
      </PostHogProviderWrapper>
    </ClerkProviderWrapper>
  );
}

// ============================================
// Analytics Helper (safe to call anywhere)
// ============================================
export function track(event: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  try {
    if (isPostHogEnabled && (window as any).posthog) {
      (window as any).posthog.capture(event, properties);
    }
  } catch {
    // Never let analytics break the app
  }
}
