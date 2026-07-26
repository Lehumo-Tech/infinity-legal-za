/**
 * GET /api/articles - Published legal articles (public)
 * POST /api/articles - Create article (admin only)
 *
 * Resilience: tries the database first (3s timeout). On ANY error
 * (DB unreachable, Neon cold-start, missing DATABASE_URL on serverless),
 * falls back to the real published articles so the section always renders
 * and articles are always readable when clicked.
 */

import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';
import { sanitizeString } from '@/lib/security';
import { db } from '@/lib/db';
import { FALLBACK_ARTICLES } from '@/lib/article-fallback';

export const dynamic = 'force-dynamic';

const VALID_CATEGORIES = [
  'civil_litigation', 'labour_law', 'criminal_defence', 'family_law',
  'corporate_commercial', 'property_conveyancing', 'estate_planning',
  'debt_recovery', 'consumer_rights', 'popia_compliance', 'immigration', 'general',
] as const;

// Max time to wait for the database before falling back.
const DB_TIMEOUT_MS = 3000;

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
      // Single article by slug via query param — try DB first, then fallback
      try {
        const article = await Promise.race([
          db.legalArticle.findFirst({
            where: { slug, is_published: true },
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('DB_QUERY_TIMEOUT')), DB_TIMEOUT_MS),
          ),
        ]);
        if (article) {
          return apiResponse(article);
        }
      } catch (dbErr) {
        console.error('Articles DB error (slug lookup, serving fallback):', dbErr);
      }
      // Fallback: find by slug in the static set
      const fallback = FALLBACK_ARTICLES.find((a) => a.slug === slug);
      if (fallback) {
        return apiResponse(fallback);
      }
      return apiError('Article not found', 404, 'ARTICLE_NOT_FOUND');
    }

    // List articles — try DB first
    try {
      const where: Prisma.LegalArticleWhereInput = { is_published: true };
      if (category) where.category = category;
      if (featured === 'true') where.is_featured = true;

      const [articles, total] = await Promise.race([
        Promise.all([
          db.legalArticle.findMany({
            where,
            orderBy: [{ is_featured: 'desc' }, { published_at: 'desc' }],
            take: limit,
            skip: offset,
          }),
          db.legalArticle.count({ where }),
        ]),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('DB_QUERY_TIMEOUT')), DB_TIMEOUT_MS),
        ),
      ]);

      return apiResponse({ articles, total, limit, offset });
    } catch (dbErr) {
      // DB unreachable — serve fallback articles (filtered + paginated)
      console.error('Articles DB error (list, serving fallback):', dbErr);
      let fallback = [...FALLBACK_ARTICLES];
      if (category) fallback = fallback.filter((a) => a.category === category);
      if (featured === 'true') fallback = fallback.filter((a) => a.is_featured);
      // Sort: featured first, then by published_at desc
      fallback.sort((a, b) => {
        if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
        return b.published_at.localeCompare(a.published_at);
      });
      const total = fallback.length;
      const paged = fallback.slice(offset, offset + limit);
      return apiResponse({ articles: paged, total, limit, offset });
    }
  } catch (error) {
    console.error('Articles list error:', error);
    // Last-resort fallback: never return a 500 to the public articles endpoint
    return apiResponse({ articles: FALLBACK_ARTICLES, total: FALLBACK_ARTICLES.length, limit: 20, offset: 0 });
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

    // Validate required fields
    if (!body.title || !body.slug || !body.content) {
      return apiError('Title, slug, and content are required', 400, 'MISSING_FIELDS');
    }

    if (body.category && !VALID_CATEGORIES.includes(body.category)) {
      return apiError('Invalid category', 400, 'INVALID_CATEGORY');
    }

    const article = await db.legalArticle.create({
      data: {
        title: sanitizeString(body.title, 200),
        slug: sanitizeString(body.slug, 200),
        subtitle: body.subtitle ? sanitizeString(body.subtitle, 300) : null,
        content: body.content,
        summary: body.summary ? sanitizeString(body.summary, 500) : null,
        category: body.category || 'general',
        tags: body.tags || [],
        cover_image_url: body.cover_image_url || null,
        reading_time_min: body.reading_time_min || null,
        is_published: body.is_published || false,
        is_featured: body.is_featured || false,
        published_at: body.is_published ? new Date() : null,
        sort_order: body.sort_order || 0,
        author_id: user.id,
      },
    });

    return apiResponse(article, 201);
  } catch (error) {
    console.error('Article create error:', error);
    return apiError('Failed to create article', 500, 'CREATE_ERROR');
  }
}
