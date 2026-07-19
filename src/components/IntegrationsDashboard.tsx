'use client';

/**
 * IntegrationsDashboard — Admin-only "Integrations" panel.
 *
 * Fetches GET /api/integrations (admin-only) and renders a responsive
 * grid of 7 cards showing the live configuration status of every
 * third-party integration: Sentry, Resend, Stripe, Clerk, Upstash,
 * Pinecone, PostHog.
 *
 * Each card shows: service name, a status badge (Enabled = green,
 * Not Configured = amber), a one-line description, and the API label.
 *
 * Brand: navy #0c1e3c + gold #c9a84c. No indigo/blue.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  ShieldAlert, Mail, CreditCard, KeyRound, Database,
  Boxes, BarChart3, RefreshCw, AlertCircle, Lock,
} from 'lucide-react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

// ============================================
// TYPES
// ============================================

interface IntegrationStatus {
  // Most services expose `enabled`. Resend's email-service exposes `configured`
  // instead (legacy naming) — the API at /api/integrations returns the raw
  // status object so we need to accept either field name.
  enabled?: boolean;
  configured?: boolean;
  label: string;
  [key: string]: unknown;
}

interface IntegrationsPayload {
  sentry: IntegrationStatus;
  resend: IntegrationStatus;
  stripe: IntegrationStatus;
  clerk: IntegrationStatus;
  upstash: IntegrationStatus;
  pinecone: IntegrationStatus;
  posthog: IntegrationStatus;
}

type FetchState =
  | { kind: 'loading' }
  | { kind: 'ready'; data: IntegrationsPayload }
  | { kind: 'forbidden'; status: number; message: string }
  | { kind: 'error'; message: string };

// ============================================
// STATIC SERVICE METADATA
// ============================================

interface ServiceMeta {
  key: keyof IntegrationsPayload;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SERVICES: ServiceMeta[] = [
  {
    key: 'sentry',
    name: 'Sentry',
    description: 'Error tracking & performance monitoring.',
    icon: ShieldAlert,
  },
  {
    key: 'resend',
    name: 'Resend',
    description: 'Transactional email (Resend API or SMTP fallback).',
    icon: Mail,
  },
  {
    key: 'stripe',
    name: 'Stripe',
    description: 'Subscription payments & recurring billing (ZAR).',
    icon: CreditCard,
  },
  {
    key: 'clerk',
    name: 'Clerk',
    description: 'Hosted authentication (sign-in / sign-up flows).',
    icon: KeyRound,
  },
  {
    key: 'upstash',
    name: 'Upstash',
    description: 'Serverless Redis cache & distributed rate limiter.',
    icon: Database,
  },
  {
    key: 'pinecone',
    name: 'Pinecone',
    description: 'Vector database powering AI legal search & retrieval.',
    icon: Boxes,
  },
  {
    key: 'posthog',
    name: 'PostHog',
    description: 'Product analytics, session replay & feature flags.',
    icon: BarChart3,
  },
];

// ============================================
// COMPONENT
// ============================================

export function IntegrationsDashboard() {
  const { accessToken } = useAuth();
  const [state, setState] = useState<FetchState>({ kind: 'loading' });

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/integrations', {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        credentials: 'include',
      });

      if (res.status === 401) {
        setState({
          kind: 'forbidden',
          status: 401,
          message: 'You must be signed in to view integration status.',
        });
        return;
      }
      if (res.status === 403) {
        setState({
          kind: 'forbidden',
          status: 403,
          message:
            'You do not have permission to view integrations. This panel is restricted to Managing Director and Systems Admin roles.',
        });
        return;
      }
      if (!res.ok) {
        setState({
          kind: 'error',
          message: `Failed to load integrations (HTTP ${res.status}).`,
        });
        return;
      }

      const json = await res.json();
      // The route uses apiResponse(), so the payload is at json.data.
      const payload = (json?.data ?? json) as IntegrationsPayload;
      if (!payload || typeof payload !== 'object') {
        setState({ kind: 'error', message: 'Unexpected response shape from /api/integrations.' });
        return;
      }
      setState({ kind: 'ready', data: payload });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error fetching integrations.';
      setState({ kind: 'error', message });
    }
  }, [accessToken]);

  useEffect(() => {
    // Initial fetch on mount + when the auth token changes.
    // The rule react-hooks/set-state-in-effect flags any setState inside an
    // effect, but this is the canonical "fetch on mount" pattern (same as
    // CommunicationsView/AnalyticsView/etc.) — the setState calls happen
    // asynchronously after `await fetch`, never synchronously in the effect body.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  // ---- Loading skeleton ----
  if (state.kind === 'loading') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-3.5 w-72" />
          </div>
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Card key={i} className="shadow-sm overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-9 h-9 rounded-lg" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <div className="pt-2">
                  <Skeleton className="h-2.5 w-32" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ---- Forbidden / unauthorized ----
  if (state.kind === 'forbidden') {
    return (
      <div className="space-y-6">
        <Header onRefresh={() => {
          setState({ kind: 'loading' });
          void load();
        }} />
        <Card className="border-amber-200 bg-amber-50/60 shadow-sm">
          <CardContent className="p-6 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-[#0c1e3c]">
                Access restricted (HTTP {state.status})
              </h3>
              <p className="text-[13px] text-slate-600">{state.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---- Generic error ----
  if (state.kind === 'error') {
    return (
      <div className="space-y-6">
        <Header onRefresh={() => {
          setState({ kind: 'loading' });
          void load();
        }} />
        <Card className="border-red-200 bg-red-50/60 shadow-sm">
          <CardContent className="p-6 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-100 text-red-700 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-[#0c1e3c]">
                Couldn&apos;t load integrations
              </h3>
              <p className="text-[13px] text-slate-600">{state.message}</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3 h-8 border-[#0c1e3c]/20 text-[#0c1e3c] hover:bg-[#0c1e3c]/5"
                onClick={() => {
                  setState({ kind: 'loading' });
                  void load();
                }}
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Try again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---- Ready ----
  const { data } = state;
  // Resend exposes `configured` instead of `enabled`; all others use `enabled`.
  const isServiceOn = (s: IntegrationStatus): boolean =>
    Boolean(s.enabled ?? s.configured);
  const enabledCount = SERVICES.filter((s) => isServiceOn(data[s.key])).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-[#0c1e3c]">Integrations</h2>
          <p className="text-[13px] text-slate-500">
            Live configuration status of every third-party service wired into the platform.
            {' '}
            <span className="font-medium text-[#0c1e3c]">
              {enabledCount}/{SERVICES.length}
            </span>{' '}
            active.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-8 border-[#0c1e3c]/20 text-[#0c1e3c] hover:bg-[#0c1e3c]/5"
          onClick={() => {
            setState({ kind: 'loading' });
            void load();
          }}
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
        </Button>
      </div>

      {/* Grid of integration cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SERVICES.map((svc) => {
          const status = data[svc.key];
          const enabled = isServiceOn(status);
          const label = status?.label ?? '—';
          const Icon = svc.icon;

          return (
            <Card
              key={svc.key}
              className={`shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md border-t-[3px] ${
                enabled ? 'border-t-emerald-500' : 'border-t-slate-300'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        enabled
                          ? 'bg-[#c9a84c]/10 text-[#a88832]'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <CardTitle className="text-[14px] font-semibold text-[#0c1e3c] truncate">
                      {svc.name}
                    </CardTitle>
                  </div>
                  <StatusBadge enabled={enabled} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <CardDescription className="text-[12px] text-slate-600 leading-snug">
                  {svc.description}
                </CardDescription>
                <div className="pt-1 border-t border-slate-100">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 mt-2">
                    API label
                  </div>
                  <div className="text-[12px] font-medium text-[#0c1e3c] truncate" title={label}>
                    {label}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footnote */}
      <p className="text-[11px] text-slate-400 leading-relaxed">
        Services without an API key stay gracefully disabled — the app runs in a reduced
        &ldquo;not configured&rdquo; mode for that integration. Configure the matching
        environment variables in <code className="text-[#0c1e3c]">.env</code> to enable.
      </p>
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function StatusBadge({ enabled }: { enabled: boolean }) {
  if (enabled) {
    return (
      <Badge
        variant="outline"
        className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 px-2 py-0.5"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Enabled
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="bg-amber-50 text-amber-700 border-amber-200 gap-1.5 px-2 py-0.5"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      Not Configured
    </Badge>
  );
}

function Header({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-[#0c1e3c]">Integrations</h2>
        <p className="text-[13px] text-slate-500">
          Live configuration status of every third-party service wired into the platform.
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="h-8 border-[#0c1e3c]/20 text-[#0c1e3c] hover:bg-[#0c1e3c]/5"
        onClick={() => void onRefresh()}
      >
        <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
      </Button>
    </div>
  );
}

export default IntegrationsDashboard;
