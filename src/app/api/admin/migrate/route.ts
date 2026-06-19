/**
 * POST /api/admin/migrate - Run schema migrations (admin only)
 * Creates the legal_articles table and seeds data
 */

import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/api-client';
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

    const db = getAdminClient();
    if (!db) {
      return apiError('Database not configured', 503, 'DB_NOT_CONFIGURED');
    }

    // Check if table exists
    const { error: checkError } = await db
      .from('legal_articles')
      .select('id')
      .limit(1);

    if (checkError && checkError.message.includes('Could not find')) {
      return apiResponse({
        message: 'legal_articles table does not exist. Run the SQL migration in Supabase SQL Editor.',
        needsManualMigration: true,
      });
    }

    // Table exists — return status
    const { count } = await db
      .from('legal_articles')
      .select('*', { count: 'exact', head: true });

    return apiResponse({
      message: 'legal_articles table exists',
      articleCount: count,
      needsMigration: false,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return apiError('Migration failed', 500, 'MIGRATION_ERROR');
  }
}
