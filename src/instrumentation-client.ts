/**
 * Next.js Client Instrumentation — Sentry client-side initialization.
 *
 * Next.js 16 prefers instrumentation-client.ts over sentry.client.config.ts.
 * Loads the Sentry client config on app boot.
 *
 * Activates only when SENTRY_DSN / NEXT_PUBLIC_SENTRY_DSN is set.
 */
export {};

await import('../sentry.client.config');
