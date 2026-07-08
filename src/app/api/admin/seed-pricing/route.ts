/**
 * POST /api/admin/seed-pricing - Seed correct pricing plans
 *
 * Replaces the wrong database plans with the correct ones matching the frontend.
 * Plans: Civil Legal (R99/mo), Labour Legal (R99/mo), Extensive (R139/mo)
 *
 * Uses Prisma to delete existing plans and create the correct ones.
 */

import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';
import { db as prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const ADMIN_ROLES = ['managing_director', 'systems_admin', 'admin'];

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
    // AUTH: admin-only — this route wipes all pricing plans
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;
    if (!ADMIN_ROLES.includes(auth.user.role)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const results: string[] = [];

    // Delete all existing plans
    await prisma.pricingPlan.deleteMany();
    results.push('Deleted all old plans');

    // Insert the correct plans
    for (const plan of CORRECT_PLANS) {
      await prisma.pricingPlan.create({
        data: {
          name: plan.name,
          slug: plan.slug,
          description: plan.description,
          price_monthly: plan.price_monthly,
          price_annual: plan.price_annual,
          currency: plan.currency,
          features: plan.features as Prisma.InputJsonValue,
          max_cases: plan.max_cases,
          max_documents: plan.max_documents,
          is_popular: plan.is_popular,
          is_active: plan.is_active,
          sort_order: plan.sort_order,
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
      message: 'Pricing plans seeded successfully',
      results,
      activePlans: verifyPlans,
    });
  } catch (error: any) {
    console.error('Seed pricing error:', error);
    return apiError(`Failed to seed pricing plans: ${error?.message || 'Unknown error'}`, 500, 'SEED_ERROR');
  }
}
