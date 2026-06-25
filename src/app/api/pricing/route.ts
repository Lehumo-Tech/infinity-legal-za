/**
 * GET /api/pricing - Active pricing plans from Prisma/SQLite
 * Falls back to hardcoded plans when database is empty
 */

import { db } from '@/lib/db';
import { apiResponse } from '@/lib/middleware';

// Fallback pricing data — used when database has no plans
// MUST match database schema: Civil R99, Labour R99, Extensive R139
const FALLBACK_PLANS = [
  {
    id: 'fallback-civil',
    name: 'Civil Legal Plan',
    slug: 'civil_legal_plan',
    description: 'For civil disputes and general legal matters.',
    price_monthly: 99,
    price_annual: 999,
    currency: 'ZAR',
    features: ['Unlimited civil consultations', 'Document review & drafting', 'Court representation', 'AI case analysis', 'Email support'],
    max_cases: 10,
    max_documents: 50,
    is_popular: false,
    is_active: true,
    sort_order: 1,
  },
  {
    id: 'fallback-labour',
    name: 'Labour Legal Plan',
    slug: 'labour_legal_plan',
    description: 'For workplace and employment matters.',
    price_monthly: 99,
    price_annual: 999,
    currency: 'ZAR',
    features: ['Unlimited labour consultations', 'CCMA representation', 'Employment contract review', 'Dismissal advice', 'Priority support'],
    max_cases: 10,
    max_documents: 50,
    is_popular: true,
    is_active: true,
    sort_order: 2,
  },
  {
    id: 'fallback-extensive',
    name: 'Extensive Plan',
    slug: 'extensive_plan',
    description: 'Complete legal coverage across all practice areas.',
    price_monthly: 139,
    price_annual: 1399,
    currency: 'ZAR',
    features: ['All Civil & Labour features', 'Family law consultations', 'Criminal defence advice', 'Estate planning', '24/7 priority support', 'Dedicated legal advisor'],
    max_cases: 25,
    max_documents: 100,
    is_popular: false,
    is_active: true,
    sort_order: 3,
  },
];

export async function GET() {
  try {
    const plans = await db.pricingPlan.findMany({
      where: { is_active: true },
      orderBy: { sort_order: 'asc' },
    });

    if (!plans || plans.length === 0) {
      // No plans in database — return fallback
      return apiResponse(FALLBACK_PLANS);
    }

    // Parse features from JSON if needed
    const parsedPlans = plans.map((plan) => ({
      ...plan,
      features: typeof plan.features === 'string' ? JSON.parse(plan.features as string) : plan.features,
    }));

    return apiResponse(parsedPlans);
  } catch (error) {
    console.error('Pricing error:', error);
    // Any error — return fallback plans so the page always renders
    return apiResponse(FALLBACK_PLANS);
  }
}
