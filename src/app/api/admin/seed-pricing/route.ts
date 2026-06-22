/**
 * POST /api/admin/seed-pricing - Seed correct pricing plans
 *
 * Replaces the wrong database plans with the correct ones matching the frontend.
 * Plans: Civil Legal (R99/mo), Labour Legal (R99/mo), Extensive (R139/mo)
 */

import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/api-client';
import { apiResponse, apiError } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

// Correct pricing plans matching the frontend
const CORRECT_PLANS = [
  {
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
    is_popular: false,
    is_active: true,
    sort_order: 1,
  },
  {
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
    is_popular: true,
    is_active: true,
    sort_order: 2,
  },
  {
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
      'Dedicated attorney',
    ],
    is_popular: false,
    is_active: true,
    sort_order: 3,
  },
];

export async function POST(request: NextRequest) {
  try {
    const db = getAdminClient();
    if (!db) {
      return apiError('Database not configured', 503, 'DB_NOT_CONFIGURED');
    }

    const results: string[] = [];

    // Step 1: Delete all existing plans to avoid slug conflicts
    const { error: deleteError } = await db
      .from('pricing_plans')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all

    if (deleteError) {
      console.error('Delete error:', deleteError);
      results.push(`Warning: Could not delete old plans: ${deleteError.message}`);
    } else {
      results.push('Deleted all old plans');
    }

    // Step 2: Insert the correct plans
    for (const plan of CORRECT_PLANS) {
      const { error: insertError } = await db
        .from('pricing_plans')
        .insert(plan);

      if (insertError) {
        console.error(`Insert error for ${plan.slug}:`, insertError);
        results.push(`Error inserting ${plan.name}: ${insertError.message}`);
      } else {
        results.push(`Inserted ${plan.name} (${plan.slug}) — R${plan.price_monthly}/mo`);
      }
    }

    // Step 3: Verify
    const { data: verifyPlans, error: verifyError } = await db
      .from('pricing_plans')
      .select('name, slug, price_monthly, is_active')
      .eq('is_active', true)
      .order('sort_order');

    if (verifyError) {
      results.push(`Verification error: ${verifyError.message}`);
    }

    return apiResponse({
      message: 'Pricing plans seeded successfully',
      results,
      activePlans: verifyPlans || [],
    });
  } catch (error) {
    console.error('Seed pricing error:', error);
    return apiError('Failed to seed pricing plans', 500, 'SEED_ERROR');
  }
}
