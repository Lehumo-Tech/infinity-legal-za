/**
 * Sentry status helper — client-safe (no Sentry SDK import, just env check).
 *
 * The actual Sentry SDK init happens in sentry.*.config.ts, loaded via
 * instrumentation.ts / instrumentation-client.ts. This file only exposes
 * whether Sentry is enabled, for the integrations dashboard panel.
 */
export const isSentryEnabled: boolean = !!(
  process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
);
