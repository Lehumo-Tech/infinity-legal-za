/**
 * Sentry Server-Side Error Tracking Configuration
 *
 * Activates automatically when SENTRY_DSN is set.
 * See sentry.client.config.ts for setup instructions.
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Lower sampling for server-side (higher volume)
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Capture 100% of server errors
    sampleRate: 1.0,

    environment: process.env.NODE_ENV || "development",

    // Don't trace external HTTP calls (Supabase, PayFast, etc.)
    tracePropagationTargets: [
      "localhost",
      /^\//,
      /^https:\/\/infinitylegal\.org/,
    ],

    integrations: [
      // Capture unhandled rejections and exceptions
      Sentry.extraErrorDataIntegration(),
    ],

    ...(process.env.SENTRY_RELEASE ? { release: process.env.SENTRY_RELEASE } : {}),
  });
}
