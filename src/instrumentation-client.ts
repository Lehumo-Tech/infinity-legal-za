/**
 * Next.js Client Instrumentation — Sentry client-side initialization.
 *
 * Next.js 16 prefers instrumentation-client.ts over sentry.client.config.ts.
 * Loads the Sentry client config on app boot.
 *
 * Activates only when SENTRY_DSN / NEXT_PUBLIC_SENTRY_DSN is set.
 *
 * NOTE: A static import is used (not `await import(...)`) because top-level
 * await in this file causes Next.js 16 webpack to emit code the preview iframe
 * target cannot evaluate, breaking the client bundle (blank preview).
 */
import '../sentry.client.config';

export const onRouterTransitionStart = () => {};
