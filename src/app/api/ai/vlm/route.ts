/**
 * POST /api/ai/vlm - Vision Language Model using z-ai-web-dev-sdk
 * Analyzes images and answers questions about them
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/middleware';
import { aiChatRateLimiter } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const rateResult = await checkRateLimit(request, aiChatRateLimiter);
    if (!rateResult.allowed) {
      return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await request.json();
    const { image_url, question = 'Describe this image in detail' } = body;

    if (!image_url || typeof image_url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Image URL is required' },
        { status: 400 }
      );
    }

    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const response = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: question },
            { type: 'image_url', image_url: { url: image_url } },
          ],
        },
      ],
      thinking: { type: 'disabled' },
    });

    const content = response.choices?.[0]?.message?.content || '';

    return NextResponse.json({
      success: true,
      data: content,
    });
  } catch (error) {
    console.error('VLM error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze image' },
      { status: 500 }
    );
  }
}
