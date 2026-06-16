/**
 * GET /api/articles/[slug] - Single published article (public)
 * PATCH /api/articles/[slug] - Update article (admin only)
 * DELETE /api/articles/[slug] - Delete article (admin only)
 */

import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/api-client';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const db = getAdminClient();
    if (!db) {
      return apiError('Database not configured', 503, 'DB_NOT_CONFIGURED');
    }

    const { slug } = await params;

    const { data: article, error } = await db
      .from('legal_articles')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (error || !article) {
      return apiError('Article not found', 404, 'ARTICLE_NOT_FOUND');
    }

    return apiResponse(article);
  } catch (error) {
    console.error('Article fetch error:', error);
    return apiError('Failed to load article', 500, 'ARTICLE_ERROR');
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.authenticated) {
      return authResult.error!;
    }

    const user = authResult.user!;
    if (!['admin', 'managing_director', 'systems_admin'].includes(user.role)) {
      return apiError('Only administrators can update articles', 403, 'FORBIDDEN');
    }

    const db = getAdminClient();
    if (!db) {
      return apiError('Database not configured', 503, 'DB_NOT_CONFIGURED');
    }

    const { slug } = await params;
    const body = await request.json();

    // Build update object from allowed fields
    const updateFields: Record<string, unknown> = {};
    const allowedFields = ['title', 'subtitle', 'content', 'summary', 'category', 'tags', 'cover_image_url', 'reading_time_min', 'is_featured', 'is_published', 'sort_order'];
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateFields[field] = body[field];
      }
    }

    // Set published_at when publishing for the first time
    if (body.is_published === true) {
      updateFields.published_at = new Date().toISOString();
    }

    if (Object.keys(updateFields).length === 0) {
      return apiError('No valid fields to update', 400, 'NO_FIELDS');
    }

    const { data: article, error } = await db
      .from('legal_articles')
      .update(updateFields)
      .eq('slug', slug)
      .select()
      .single();

    if (error) {
      console.error('Article update error:', error);
      return apiError('Failed to update article', 500, 'UPDATE_ERROR');
    }

    if (!article) {
      return apiError('Article not found', 404, 'ARTICLE_NOT_FOUND');
    }

    return apiResponse(article);
  } catch (error) {
    console.error('Article update error:', error);
    return apiError('Failed to update article', 500, 'UPDATE_ERROR');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.authenticated) {
      return authResult.error!;
    }

    const user = authResult.user!;
    if (!['admin', 'managing_director', 'systems_admin'].includes(user.role)) {
      return apiError('Only administrators can delete articles', 403, 'FORBIDDEN');
    }

    const db = getAdminClient();
    if (!db) {
      return apiError('Database not configured', 503, 'DB_NOT_CONFIGURED');
    }

    const { slug } = await params;

    const { error } = await db
      .from('legal_articles')
      .delete()
      .eq('slug', slug);

    if (error) {
      console.error('Article delete error:', error);
      return apiError('Failed to delete article', 500, 'DELETE_ERROR');
    }

    return apiResponse({ success: true });
  } catch (error) {
    console.error('Article delete error:', error);
    return apiError('Failed to delete article', 500, 'DELETE_ERROR');
  }
}
