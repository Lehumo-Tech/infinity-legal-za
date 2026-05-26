/**
 * GET /api/health - Health check endpoint
 */

import { db } from '@/lib/db';
import { apiResponse, apiError } from '@/lib/middleware';

export async function GET() {
  try {
    // Test database connection by counting users
    await db.user.count();

    return apiResponse({
      status: 'healthy',
      database: 'postgresql',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        nextjs: 'running',
      },
    });
  } catch (error) {
    return apiError('Database connection unhealthy', 503, 'DB_UNHEALTHY');
  }
}
