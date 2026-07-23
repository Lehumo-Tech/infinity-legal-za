/**
 * GET /api/pricing - Active pricing plans from Prisma/SQLite
 *
 * Returns an empty array when the database has no active plans — the
 * frontend renders its own empty state. No hardcoded fallback data.
 */

import { db } from '@/lib/db';
import { apiResponse, apiError } from '@/lib/middleware';

export async function GET() {
  try {
    const plans = await db.pricingPlan.findMany({
      where: { is_active: true },
      orderBy: { sort_order: 'asc' },
    });

    // Parse features from JSON if needed
    const parsedPlans = plans.map((plan) => ({
      ...plan,
      features: typeof plan.features === 'string' ? JSON.parse(plan.features as string) : plan.features,
    }));

    return apiResponse(parsedPlans);
  } catch (error) {
    console.error('Pricing error:', error);
    return apiError('Failed to load pricing plans', 500, 'PRICING_ERROR');
  }
}
