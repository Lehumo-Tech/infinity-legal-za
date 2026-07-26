/**
 * GET /api/pricing - Active pricing plans from Prisma/Neon Postgres
 *
 * Resilience strategy:
 *  1. Try the database (with a 3-second timeout so a dead/hanging
 *     connection doesn't block the page).
 *  2. On ANY error (DB unreachable, timeout, Neon cold-start failure,
 *     missing DATABASE_URL on serverless, etc.), fall back to the
 *     real pricing plans (same data as the seed script) so visitors
 *     ALWAYS see pricing — the section never shows an error state.
 *
 * The fallback prices are the authoritative live prices (Civil R99/mo,
 * Labour R99/mo, Extensive R139/mo). They only change when an admin
 * edits them via the dashboard, at which point the DB query will
 * succeed and serve the updated values.
 */

import { db } from '@/lib/db';
import { apiResponse } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

// Max time to wait for the database before falling back.
const DB_TIMEOUT_MS = 3000;

/**
 * Fallback pricing plans — the real, authoritative prices.
 * Mirrors the seed-pricing script so the values shown to visitors
 * are always correct even when the database is unreachable.
 */
const FALLBACK_PLANS = [
  {
    id: 'fallback-civil',
    name: 'Civil Legal Plan',
    slug: 'civil_legal_plan',
    description: 'For civil disputes and general legal matters.',
    price_monthly: 99,
    price_annual: 999,
    currency: 'ZAR',
    features: [
      'Unlimited civil consultations',
      'Document review & drafting',
      'Court representation',
      'AI case analysis',
      'Email support',
    ],
    max_cases: 10,
    max_documents: 50,
    is_popular: false,
    is_active: true,
    sort_order: 1,
    created_at: '2026-07-19T05:33:57.511Z',
    updated_at: '2026-07-19T05:33:57.511Z',
  },
  {
    id: 'fallback-labour',
    name: 'Labour Legal Plan',
    slug: 'labour_legal_plan',
    description: 'For workplace and employment matters.',
    price_monthly: 99,
    price_annual: 999,
    currency: 'ZAR',
    features: [
      'Unlimited labour consultations',
      'CCMA representation',
      'Employment contract review',
      'Dismissal advice',
      'Priority support',
    ],
    max_cases: 10,
    max_documents: 50,
    is_popular: true,
    is_active: true,
    sort_order: 2,
    created_at: '2026-07-19T05:33:57.514Z',
    updated_at: '2026-07-19T05:33:57.514Z',
  },
  {
    id: 'fallback-extensive',
    name: 'Extensive Plan',
    slug: 'extensive_plan',
    description: 'Complete legal coverage across all practice areas.',
    price_monthly: 139,
    price_annual: 1399,
    currency: 'ZAR',
    features: [
      'All Civil & Labour features',
      'Family law consultations',
      'Criminal defence advice',
      'Estate planning',
      '24/7 priority support',
      'Dedicated legal advisor',
    ],
    max_cases: 50,
    max_documents: 999,
    is_popular: false,
    is_active: true,
    sort_order: 3,
    created_at: '2026-07-19T05:33:57.511Z',
    updated_at: '2026-07-19T05:33:57.511Z',
  },
] as const;

export async function GET() {
  try {
    // Race the DB query against a timeout. If the database is
    // unreachable (serverless cold start, Neon idle reaping, missing
    // DATABASE_URL, etc.) the timeout fires and we fall back to the
    // real pricing plans so the section always renders.
    const plans = await Promise.race([
      db.pricingPlan.findMany({
        where: { is_active: true },
        orderBy: { sort_order: 'asc' },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('DB_QUERY_TIMEOUT')),
          DB_TIMEOUT_MS,
        ),
      ),
    ]);

    // Parse features from JSON if needed (Prisma Json fields can arrive as
    // objects or strings depending on the driver).
    const parsedPlans = plans.map((plan) => ({
      ...plan,
      features:
        typeof plan.features === 'string'
          ? JSON.parse(plan.features as string)
          : plan.features,
    }));

    return apiResponse(parsedPlans);
  } catch (error) {
    // Database unreachable — log for observability and serve the real
    // pricing plans as fallback. Visitors always see correct pricing.
    console.error('Pricing DB error (serving fallback):', error);
    return apiResponse(FALLBACK_PLANS);
  }
}
