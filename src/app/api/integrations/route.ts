/**
 * GET /api/integrations — status of all third-party integrations.
 *
 * Returns which services are configured/enabled. Used by the dashboard
 * "Integrations" panel so admins can see at a glance what's active.
 *
 * Auth: required (managing_director / systems_admin only).
 */
import { NextRequest } from 'next/server';
import { apiResponse, apiError, requireAuth, requireRoles } from '@/lib/middleware';
import type { RoleKey } from '@/lib/auth';
import { isStripeEnabled, getStripeStatus } from '@/lib/stripe';
import { isUpstashEnabled, getUpstashStatus } from '@/lib/upstash';
import { isPostHogEnabled } from '@/lib/posthog-client';
import { isClerkEnabled } from '@/lib/clerk-config';
import { isEmailConfigured, getEmailServiceStatus } from '@/lib/email-service';
import { isPineconeEnabled } from '@/lib/pinecone';
import { isSentryEnabled } from '@/lib/sentry-status';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.authenticated) return auth.error!;

  // Only admins can view integration status (contains config details)
  const roleCheck = requireRoles(auth.user.role, ['managing_director', 'systems_admin'] as RoleKey[]);
  if (roleCheck) return roleCheck;

  return apiResponse({
    sentry: {
      enabled: isSentryEnabled,
      dsnConfigured: !!process.env.SENTRY_DSN,
      label: 'Error Tracking',
    },
    resend: {
      ...getEmailServiceStatus(),
      label: 'Email (Resend/SMTP)',
    },
    stripe: {
      ...getStripeStatus(),
      label: 'Payments',
    },
    clerk: {
      enabled: isClerkEnabled,
      publishableKeyConfigured: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      secretKeyConfigured: !!process.env.CLERK_SECRET_KEY,
      label: 'Authentication',
    },
    upstash: {
      ...getUpstashStatus(),
      label: 'Redis Cache',
    },
    pinecone: {
      enabled: isPineconeEnabled,
      label: 'Vector Database',
    },
    posthog: {
      enabled: isPostHogEnabled,
      label: 'Analytics',
    },
  });
}
