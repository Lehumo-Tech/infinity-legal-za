/**
 * GET /api/ai/web-search - Web Search using z-ai-web-dev-sdk
 * Searches the web for current information
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, requireAuth } from '@/lib/middleware';
import { searchRateLimiter } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    // Auth required for web search
    const authResult = await requireAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const rateResult = await checkRateLimit(request, searchRateLimiter);
    if (!rateResult.allowed) {
      return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const num = Math.min(parseInt(searchParams.get('num') || '10'), 20);

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Search query parameter "q" is required' },
        { status: 400 }
      );
    }

    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const results = await zai.functions.invoke('web_search', {
      query: query.trim(),
      num,
    });

    return NextResponse.json({
      success: true,
      data: results,
      meta: { query, num },
    });
  } catch (error) {
    console.error('Web search error:', error);
    return NextResponse.json(
      { success: false, error: 'Web search service is temporarily unavailable. Please try again later.' },
      { status: 503 }
    );
  }
}
