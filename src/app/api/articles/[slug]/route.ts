/**
 * GET /api/articles/[slug] - Single published article (public)
 * PATCH /api/articles/[slug] - Update article (admin only)
 * DELETE /api/articles/[slug] - Delete article (admin only)
 */

import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const article = await db.legalArticle.findFirst({
      where: { slug, is_published: true },
    });

    if (!article) {
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

    const { slug } = await params;
    const body = await request.json();

    // Find article by slug
    const existing = await db.legalArticle.findUnique({ where: { slug } });
    if (!existing) {
      return apiError('Article not found', 404, 'ARTICLE_NOT_FOUND');
    }

    // Build update object from allowed fields
    const updateData: Prisma.LegalArticleUpdateInput = {};
    const allowedFields = ['title', 'subtitle', 'content', 'summary', 'category', 'cover_image_url', 'reading_time_min', 'is_featured', 'is_published', 'sort_order'];
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        (updateData as Record<string, unknown>)[field] = body[field];
      }
    }
    if (body.tags !== undefined) {
      updateData.tags = body.tags ? (body.tags as Prisma.InputJsonValue) : Prisma.JsonNull;
    }

    // Set published_at when publishing for the first time
    if (body.is_published === true && !existing.published_at) {
      updateData.published_at = new Date();
    }

    if (Object.keys(updateData).length === 0) {
      return apiError('No valid fields to update', 400, 'NO_FIELDS');
    }

    const article = await db.legalArticle.update({
      where: { slug },
      data: updateData,
    });

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

    const { slug } = await params;

    try {
      await db.legalArticle.delete({ where: { slug } });
    } catch (delErr: any) {
      if (delErr?.code === 'P2025') {
        return apiError('Article not found', 404, 'ARTICLE_NOT_FOUND');
      }
      throw delErr;
    }

    return apiResponse({ success: true });
  } catch (error) {
    console.error('Article delete error:', error);
    return apiError('Failed to delete article', 500, 'DELETE_ERROR');
  }
}
