/**
 * Sentry Client-Side Error Tracking Configuration
 *
 * Activates automatically when SENTRY_DSN is set in the environment.
 * To enable:
 * 1. Create a project at https://sentry.io → Next.js
 * 2. Copy the DSN
 * 3. Add to .env: SENTRY_DSN=https://xxx@sentry.io/xxx
 *
 * For source maps (optional): add SENTRY_AUTH_TOKEN and SENTRY_ORG and SENTRY_PROJECT
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Adjust sampling in production; 1.0 in dev for full visibility
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

    // Capture 100% of errors (sessions) in dev, 20% in production
    replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0.5,

    // Only capture replays on errors (not every session) to reduce cost
    replaysOnErrorSampleRate: 1.0,

    // Ignore noisy errors that aren't actionable
    ignoreErrors: [
      // Browser extensions
      "top.GLOBALS",
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      // Network errors that the user can retry
      "Network request failed",
      "Failed to fetch",
      // Cross-origin errors from the preview iframe (not our code)
      "cross-origin",
    ],

    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // Additional Replay configuration
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],

    // Don't trace requests to these origins (avoids noise from external APIs)
    tracePropagationTargets: [
      "localhost",
      /^\//,
      /^https:\/\/infinitylegal\.org/,
    ],

    environment: process.env.NODE_ENV || "development",

    // Release tracking (optional — set SENTRY_RELEASE to enable)
    ...(process.env.SENTRY_RELEASE ? { release: process.env.SENTRY_RELEASE } : {}),
  });
}
