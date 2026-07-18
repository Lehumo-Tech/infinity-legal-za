/**
 * PostHog Analytics — SERVER-SIDE configuration.
 *
 * Contains the posthog-node client for use in API routes and server
 * components only. MUST NOT be imported by client components —
 * posthog-node depends on node:async_hooks which webpack cannot bundle
 * for the browser. Client-safe constants live in ./posthog-client.
 *
 * To activate PostHog:
 * 1. Create a project at https://app.posthog.com
 * 2. Copy the "Project API Key" (phc_...)
 * 3. Add to .env:
 *      NEXT_PUBLIC_POSTHOG_KEY=phc_...
 *      NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com  (or self-hosted URL)
 *
 * Key events tracked:
 * - user_signed_in, user_signed_up, user_signed_out
 * - plan_selected, payment_initiated, payment_completed
 * - ai_intake_submitted, ai_chat_message_sent, ai_analysis_completed
 * - case_created, document_uploaded, consultation_scheduled
 */

// Re-export client-safe constants so server code can import everything from one place
export { isPostHogEnabled, posthogKey, posthogHost, clientTrack } from './posthog-client';

import { isPostHogEnabled, posthogKey, posthogHost } from './posthog-client';

/**
 * Server-side PostHog client (for API routes and server components).
 * Lazily initialized — only creates a client when PostHog is enabled.
 */
let serverClient: import('posthog-node').PostHog | null = null;

export async function getServerPostHog() {
  if (!isPostHogEnabled) return null;
  if (!serverClient) {
    const { PostHog } = await import('posthog-node');
    serverClient = new PostHog(posthogKey, { host: posthogHost });
  }
  return serverClient;
}

/**
 * Track an event from the server side (API routes).
 * Safe to call even when PostHog is disabled — it's a no-op.
 */
export async function serverTrack(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
) {
  const client = await getServerPostHog();
  if (!client) return;
  try {
    client.capture({ distinctId, event, properties });
    await client.shutdown();
  } catch {
    // Never let analytics break the app
  }
}
