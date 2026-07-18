/**
 * PostHog Analytics — CLIENT-SAFE configuration.
 *
 * This module contains ONLY environment-derived constants and a client-side
 * track() helper. It MUST NOT import `posthog-node` (a server-only library
 * that uses node:async_hooks) — doing so pulls node: schemes into the client
 * bundle and crashes the webpack build.
 *
 * Server-side capture (posthog-node) lives in src/lib/posthog.ts and is only
 * imported by API routes / server components.
 */

export const isPostHogEnabled: boolean = !!process.env.NEXT_PUBLIC_POSTHOG_KEY;

export const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY || '';
export const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

/**
 * Track an event from the CLIENT side using the global window.posthog
 * instance installed by the PostHogProvider. Safe to call anywhere —
 * it's a no-op when PostHog is disabled or not yet loaded.
 */
export function clientTrack(event: string, properties?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  if (!isPostHogEnabled) return;
  try {
    const ph = (window as unknown as { posthog?: { capture: (e: string, p?: Record<string, unknown>) => void } }).posthog;
    if (ph) ph.capture(event, properties);
  } catch {
    // Never let analytics break the app
  }
}
