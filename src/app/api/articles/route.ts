/**
 * GET /api/articles - Published legal articles (public)
 * POST /api/articles - Create article (admin only)
 */

import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';
import { sanitizeString } from '@/lib/security';
import { db } from '@/lib/db';

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
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const slug = url.searchParams.get('slug');
    const featured = url.searchParams.get('featured');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    if (slug) {
      const article = await db.legalArticle.findFirst({
        where: { slug, is_published: true },
      });
      if (!article) {
        return apiError('Article not found', 404, 'ARTICLE_NOT_FOUND');
      }
      return apiResponse(article);
    }

    const where: Prisma.LegalArticleWhereInput = { is_published: true };
    if (category) where.category = category;
    if (featured === 'true') where.is_featured = true;

    const [articles, total] = await Promise.all([
      db.legalArticle.findMany({
        where,
        orderBy: [{ is_featured: 'desc' }, { published_at: 'desc' }],
        take: limit,
        skip: offset,
      }),
      db.legalArticle.count({ where }),
    ]);

    return apiResponse({ articles, total, limit, offset });
  } catch (error) {
    console.error('Articles list error:', error);
    return apiResponse({ articles: [], total: 0, limit: 20, offset: 0 });
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

    const body = await request.json();
    const { title, subtitle, content, summary, category, tags, slug, cover_image_url, reading_time_min, is_featured } = body;

    if (!title || !content || !slug) {
      return apiError('Title, content, and slug are required', 400, 'VALIDATION_ERROR');
    }

    if (category && !VALID_CATEGORIES.includes(category)) {
      return apiError(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`, 400, 'INVALID_CATEGORY');
    }

    try {
      const article = await db.legalArticle.create({
        data: {
          title: sanitizeString(title),
          subtitle: subtitle ? sanitizeString(subtitle) : null,
          content,
          summary: summary ? sanitizeString(summary) : null,
          category: category || 'general',
          tags: tags ? (tags as Prisma.InputJsonValue) : Prisma.JsonNull,
          slug,
          cover_image_url: cover_image_url || null,
          reading_time_min: reading_time_min || 5,
          is_featured: is_featured || false,
          is_published: false,
          author_id: user.userId,
        },
      });

      return apiResponse(article, 201);
    } catch (createErr: any) {
      if (createErr?.code === 'P2002') {
        return apiError('An article with this slug already exists', 409, 'SLUG_EXISTS');
      }
      console.error('Article create error:', createErr);
      return apiError('Failed to create article', 500, 'CREATE_ERROR');
    }
  } catch (error) {
    console.error('Article create error:', error);
    return apiError('Failed to create article', 500, 'CREATE_ERROR');
  }
}
