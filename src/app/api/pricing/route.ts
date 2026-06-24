/**
 * GET /api/pricing - Active pricing plans from Supabase
 * Falls back to hardcoded plans when database is unreachable
 */

import { getAdminClient } from '@/lib/supabase/api-client';
import { apiResponse, apiError } from '@/lib/middleware';

// Fallback pricing data — used when Supabase is unreachable
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
    features: ['All Civil & Labour features', 'Family law consultations', 'Criminal defence advice', 'Estate planning', '24/7 priority support', 'Dedicated attorney'],
    is_popular: false,
    is_active: true,
    sort_order: 3,
  },
];

export async function GET() {
  try {
    const db = getAdminClient();
    if (!db) {
      // Database not configured — return fallback plans
      return apiResponse(FALLBACK_PLANS);
    }

    const { data: plans, error } = await db
      .from('pricing_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Pricing query error:', error);
      // Database error — return fallback plans
      return apiResponse(FALLBACK_PLANS);
    }

    if (!plans || plans.length === 0) {
      // No plans in database — return fallback
      return apiResponse(FALLBACK_PLANS);
    }

    const parsedPlans = (plans || []).map(plan => ({
      ...plan,
      features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features,
    }));

    return apiResponse(parsedPlans);
  } catch (error) {
    console.error('Pricing error:', error);
    // Any error — return fallback plans so the page always renders
    return apiResponse(FALLBACK_PLANS);
  }
}
