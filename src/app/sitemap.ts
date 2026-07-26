import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://infinitylegal.org';

export const revalidate = 3600; // Re-generate every hour
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: APP_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
  ];

  // Add all published articles (the only indexed content route)
  let articleUrls: MetadataRoute.Sitemap = [];
  try {
    const articles = await db.legalArticle.findMany({
      where: { is_published: true },
      select: { slug: true, updated_at: true, published_at: true },
      orderBy: { published_at: 'desc' },
    });
    articleUrls = articles.map((a) => ({
      url: `${APP_URL}/#articles`,
      lastModified: a.updated_at || a.published_at || new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }));
  } catch {
    // DB unavailable — return static sitemap only
  }

  return [...staticUrls, ...articleUrls];
}
