/**
 * POST /api/admin/seed-pricing - Seed correct pricing plans
 *
 * Replaces the wrong database plans with the correct ones matching the frontend.
 * Plans: Civil Legal (R99/mo), Labour Legal (R99/mo), Extensive (R139/mo)
 *
 * Works with both Prisma (local SQLite) and Supabase.
 */

import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/api-client';
import { apiResponse, apiError } from '@/lib/middleware';
import { db as prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Correct pricing plans matching the frontend (PricingView.tsx PLAN_STYLES)
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
    max_cases: 10,
    max_documents: 50,
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
    max_cases: 10,
    max_documents: 50,
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
      'Dedicated legal advisor',
    ],
    max_cases: 50,
    max_documents: 999,
    is_popular: false,
    is_active: true,
    sort_order: 3,
  },
];

export async function POST(request: NextRequest) {
  try {
    const results: string[] = [];

    // Strategy 1: Try Prisma (local SQLite)
    try {
      // Delete all existing plans
      await prisma.pricingPlan.deleteMany();
      results.push('Deleted all old plans (Prisma)');

      // Insert the correct plans
      for (const plan of CORRECT_PLANS) {
        await prisma.pricingPlan.create({
          data: {
            ...plan,
            features: JSON.stringify(plan.features),
          },
        });
        results.push(`Inserted ${plan.name} (${plan.slug}) — R${plan.price_monthly}/mo`);
      }

      // Verify
      const verifyPlans = await prisma.pricingPlan.findMany({
        where: { is_active: true },
        orderBy: { sort_order: 'asc' },
      });

      return apiResponse({
        message: 'Pricing plans seeded successfully (Prisma)',
        results,
        activePlans: verifyPlans,
      });
    } catch (prismaError: any) {
      results.push(`Prisma failed: ${prismaError.message}`);
    }

    // Strategy 2: Try Supabase
    const db = getAdminClient();
    if (!db) {
      return apiError('Database not configured', 503, 'DB_NOT_CONFIGURED');
    }

    const { error: deleteError } = await db
      .from('pricing_plans')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) {
      results.push(`Warning: Could not delete old plans: ${deleteError.message}`);
    } else {
      results.push('Deleted all old plans (Supabase)');
    }

    for (const plan of CORRECT_PLANS) {
      const { error: insertError } = await db
        .from('pricing_plans')
        .insert(plan);

      if (insertError) {
        results.push(`Error inserting ${plan.name}: ${insertError.message}`);
      } else {
        results.push(`Inserted ${plan.name} (${plan.slug}) — R${plan.price_monthly}/mo`);
      }
    }

    const { data: verifyPlans, error: verifyError } = await db
      .from('pricing_plans')
      .select('name, slug, price_monthly, is_active')
      .eq('is_active', true)
      .order('sort_order');

    if (verifyError) {
      results.push(`Verification error: ${verifyError.message}`);
    }

    return apiResponse({
      message: 'Pricing plans seeded successfully (Supabase)',
      results,
      activePlans: verifyPlans || [],
    });
  } catch (error) {
    console.error('Seed pricing error:', error);
    return apiError('Failed to seed pricing plans', 500, 'SEED_ERROR');
  }
}
