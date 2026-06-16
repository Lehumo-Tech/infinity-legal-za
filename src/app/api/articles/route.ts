/**
 * GET /api/articles - Published legal articles (public)
 * POST /api/articles - Create article (admin only)
 */

import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/api-client';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';
import { sanitizeString } from '@/lib/security';

const VALID_CATEGORIES = [
  'civil_litigation', 'labour_law', 'criminal_defence', 'family_law',
  'corporate_commercial', 'property_conveyancing', 'estate_planning',
  'debt_recovery', 'consumer_rights', 'popia_compliance', 'immigration', 'general',
] as const;

// ============================================
// GET - Public: list published articles
// ============================================

export async function GET(request: NextRequest) {
  try {
    const db = getAdminClient();
    if (!db) {
      return apiError('Database not configured', 503, 'DB_NOT_CONFIGURED');
    }

    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const slug = url.searchParams.get('slug');
    const featured = url.searchParams.get('featured');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // If slug is provided, return single article
    if (slug) {
      const { data: article, error } = await db
        .from('legal_articles')
        .select('id, slug, title, subtitle, content, summary, category, tags, cover_image_url, author_id, reading_time_min, is_featured, published_at, created_at, updated_at')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error || !article) {
        return apiError('Article not found', 404, 'ARTICLE_NOT_FOUND');
      }

      return apiResponse(article);
    }

    // Build list query
    let query = db
      .from('legal_articles')
      .select('id, slug, title, subtitle, summary, category, tags, cover_image_url, reading_time_min, is_featured, published_at, created_at', { count: 'exact' })
      .eq('is_published', true);

    if (category && VALID_CATEGORIES.includes(category as any)) {
      query = query.eq('category', category);
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    const { data: articles, count, error } = await query
      .order('is_featured', { ascending: false })
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Articles query error:', error);
      return apiError('Failed to load articles', 500, 'ARTICLES_ERROR');
    }

    return apiResponse({
      articles: articles || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Articles error:', error);
    return apiError('Failed to load articles', 500, 'ARTICLES_ERROR');
  }
}

// ============================================
// POST - Admin: create article
// ============================================

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.authenticated) {
      return authResult.error!;
    }

    const user = authResult.user!;
    if (!['admin', 'managing_director', 'systems_admin'].includes(user.role)) {
      return apiError('Only administrators can create articles', 403, 'FORBIDDEN');
    }

    const db = getAdminClient();
    if (!db) {
      return apiError('Database not configured', 503, 'DB_NOT_CONFIGURED');
    }

    const body = await request.json();
    const { title, subtitle, content, summary, category, tags, slug, cover_image_url, reading_time_min, is_featured } = body;

    if (!title || !content || !slug) {
      return apiError('Title, content, and slug are required', 400, 'VALIDATION_ERROR');
    }

    if (category && !VALID_CATEGORIES.includes(category)) {
      return apiError(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`, 400, 'INVALID_CATEGORY');
    }

    const { data: article, error } = await db
      .from('legal_articles')
      .insert({
        title: sanitizeString(title),
        subtitle: subtitle ? sanitizeString(subtitle) : null,
        content,
        summary: summary ? sanitizeString(summary) : null,
        category: category || 'general',
        tags: tags || [],
        slug,
        cover_image_url: cover_image_url || null,
        reading_time_min: reading_time_min || 5,
        is_featured: is_featured || false,
        is_published: false,
        author_id: user.userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Article create error:', error);
      if (error.code === '23505') {
        return apiError('An article with this slug already exists', 409, 'SLUG_EXISTS');
      }
      return apiError('Failed to create article', 500, 'CREATE_ERROR');
    }

    return apiResponse(article, 201);
  } catch (error) {
    console.error('Article create error:', error);
    return apiError('Failed to create article', 500, 'CREATE_ERROR');
  }
}
