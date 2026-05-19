/**
 * GET /api/health - Health check endpoint
 */

import { healthCheck } from '@/lib/pb-client';
import { apiResponse, apiError } from '@/lib/middleware';

export async function GET() {
  try {
    const pbHealthy = await healthCheck();
    
    if (!pbHealthy) {
      return apiError('Database connection unhealthy', 503, 'DB_UNHEALTHY');
    }

    return apiResponse({
      status: 'healthy',
      database: 'pocketbase',
      timestamp: new Date().toISOString(),
      services: {
        pocketbase: 'connected',
        nextjs: 'running',
      },
    });
  } catch (error) {
    return apiError('Health check failed', 503, 'HEALTH_CHECK_FAILED');
  }
}
