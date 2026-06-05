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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Database connection unhealthy';
    const dbUrl = process.env.DATABASE_URL?.replace(/\/\/[^@]+@/, '//***@')?.substring(0, 80) || 'not set';
    const directUrl = process.env.DATABASE_URL_UNPOOLED?.replace(/\/\/[^@]+@/, '//***@')?.substring(0, 80) || 'not set';
    const postgresUrl = process.env.POSTGRES_URL?.replace(/\/\/[^@]+@/, '//***@')?.substring(0, 80) || 'not set';
    return apiError(`DB error: ${message} | DATABASE_URL=${dbUrl} | UNPOOLED=${directUrl} | POSTGRES_URL=${postgresUrl}`, 503, 'DB_UNHEALTHY');
  }
}
