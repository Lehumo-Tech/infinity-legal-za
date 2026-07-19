/**
 * Next.js Instrumentation — Sentry server/edge initialization hook.
 *
 * Next.js 16 requires instrumentation files (not sentry.*.config.ts) for
 * server-side SDK init. This loads the Sentry server config inside register().
 *
 * Activates only when SENTRY_DSN is set.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}
