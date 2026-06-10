/**
 * GET /api/pricing - Active pricing plans from Supabase
 */

import { db } from '@/lib/db';
import { apiResponse, apiError } from '@/lib/middleware';

export async function GET() {
  try {
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    const { data: plans, error } = await db
      .from('pricing_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Pricing query error:', error);
      return apiError('Failed to load pricing plans', 500, 'PRICING_ERROR');
    }

    const parsedPlans = (plans || []).map(plan => ({
      ...plan,
      features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features,
    }));

    return apiResponse(parsedPlans);
  } catch (error) {
    console.error('Pricing error:', error);
    return apiError('Failed to load pricing plans', 500, 'PRICING_ERROR');
  }
}
