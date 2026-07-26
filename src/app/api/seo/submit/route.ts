/**
 * POST /api/seo/submit — Submit the sitemap to search engines (Google, Bing) and IndexNow.
 * Triggers re-crawl for faster indexing. Admin-only.
 */

import { NextRequest } from 'next/server';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://infinitylegal.org';
const SITEMAP_URL = `${APP_URL}/sitemap.xml`;

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.authenticated) {
      return authResult.error!;
    }
    const user = authResult.user!;
    if (!['admin', 'managing_director', 'systems_admin'].includes(user.role)) {
      return apiError('Only administrators can trigger SEO submission', 403, 'FORBIDDEN');
    }

    const results: Record<string, { status: string; detail?: string }> = {};

    // 1. Google Sitemap Ping
    try {
      const googleRes = await fetch(
        `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`,
        { method: 'GET', signal: AbortSignal.timeout(10000) }
      );
      results.google = {
        status: googleRes.ok ? 'submitted' : `http_${googleRes.status}`,
        detail: googleRes.ok ? 'Sitemap submitted to Google Search Console' : undefined,
      };
    } catch (e: unknown) {
      results.google = { status: 'error', detail: e instanceof Error ? e.message : 'fetch failed' };
    }

    // 2. Bing Sitemap Ping
    try {
      const bingRes = await fetch(
        `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`,
        { method: 'GET', signal: AbortSignal.timeout(10000) }
      );
      results.bing = {
        status: bingRes.ok ? 'submitted' : `http_${bingRes.status}`,
        detail: bingRes.ok ? 'Sitemap submitted to Bing Webmaster Tools' : undefined,
      };
    } catch (e: unknown) {
      results.bing = { status: 'error', detail: e instanceof Error ? e.message : 'fetch failed' };
    }

    // 3. IndexNow (Bing + Yandex + Naver share this protocol)
    try {
      const indexNowRes = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          host: 'infinitylegal.org',
          key: 'infinitylegalorgseo2026',
          keyLocation: `${APP_URL}/infinitylegalorgseo2026.txt`,
          urlList: [APP_URL, `${APP_URL}/#articles`],
        }),
        signal: AbortSignal.timeout(10000),
      });
      results.indexnow = {
        status: indexNowRes.ok || indexNowRes.status === 200 || indexNowRes.status === 202 ? 'submitted' : `http_${indexNowRes.status}`,
        detail: 'Submitted to IndexNow (Bing, Yandex, Naver)',
      };
    } catch (e: unknown) {
      results.indexnow = { status: 'error', detail: e instanceof Error ? e.message : 'fetch failed' };
    }

    const successCount = Object.values(results).filter((r) => r.status === 'submitted').length;

    return apiResponse({
      sitemapUrl: SITEMAP_URL,
      submitted: successCount,
      total: 3,
      results,
      message: successCount === 3
        ? 'Sitemap submitted to all search engines successfully.'
        : `Submitted to ${successCount}/3 search engines. See results for details.`,
    });
  } catch (error) {
    console.error('SEO submission error:', error);
    return apiError('Failed to submit to search engines', 500, 'SEO_SUBMIT_ERROR');
  }
}
