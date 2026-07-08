/**
 * POST /api/admin/migrate - Run schema migrations (admin only)
 *
 * With Prisma + SQLite, the schema is managed via prisma/schema.prisma and
 * `prisma db push`. This endpoint now reports the current state of the
 * legal_articles table (article count).
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.authenticated) {
      return authResult.error!;
    }

    const user = authResult.user!;
    if (!['admin', 'managing_director', 'systems_admin'].includes(user.role)) {
      return apiError('Only administrators can run migrations', 403, 'FORBIDDEN');
    }

    // Count existing articles
    const count = await db.legalArticle.count();

    return apiResponse({
      message: 'Database schema is managed by Prisma. Legal articles table is ready.',
      articleCount: count,
      needsMigration: false,
      needsManualMigration: false,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return apiError('Migration check failed', 500, 'MIGRATION_ERROR');
  }
}
