/**
 * GET /api/pricing - Active pricing plans from database
 */

import { db } from '@/lib/db';
import { apiResponse, apiError } from '@/lib/middleware';

export async function GET() {
  try {
    const plans = await db.pricingPlan.findMany({
      where: { is_active: true },
      orderBy: { sort_order: 'asc' },
    });

    const parsedPlans = plans.map(plan => ({
      ...plan,
      features: JSON.parse(plan.features || '[]'),
    }));

    return apiResponse(parsedPlans);
  } catch (error) {
    console.error('Pricing error:', error);
    return apiError('Failed to load pricing plans', 500, 'PRICING_ERROR');
  }
}
