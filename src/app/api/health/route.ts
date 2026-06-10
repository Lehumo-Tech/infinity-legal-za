/**
 * GET /api/health - Health check endpoint via Supabase
 */

import { db } from '@/lib/db';
import { apiResponse, apiError } from '@/lib/middleware';

export async function GET() {
  try {
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    // Test database connection by querying profiles count
    const { error } = await db
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Health check DB error:', error);
      return apiError('Database connection unhealthy', 503, 'DB_UNHEALTHY');
    }

    return apiResponse({
      status: 'healthy',
      database: 'supabase',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        nextjs: 'running',
      },
    });
  } catch (error: unknown) {
    return apiError('Database connection unhealthy', 503, 'DB_UNHEALTHY');
  }
}
