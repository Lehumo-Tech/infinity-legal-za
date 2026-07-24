/**
 * GET /api/health - Health check endpoint
 * Verifies the SQLite/Prisma database connection is healthy.
 */

import { apiResponse, apiError } from '@/lib/middleware';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Test database connection by counting users
    await db.user.count();

    return apiResponse({
      status: 'healthy',
      database: process.env.DATABASE_URL?.startsWith('postgres') ? 'postgresql' : 'sqlite',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        nextjs: 'running',
      },
    });
  } catch (error: unknown) {
    console.error('Health check DB error:', error);
    return apiError('Database connection unhealthy', 503, 'DB_UNHEALTHY');
  }
}
