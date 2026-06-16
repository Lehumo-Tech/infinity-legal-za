/**
 * POST /api/ai/image-gen - Image Generation using z-ai-web-dev-sdk
 * Generates images from text descriptions
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, requireAuth } from '@/lib/middleware';
import { aiChatRateLimiter } from '@/lib/security';

const SUPPORTED_SIZES = ['1024x1024', '768x1344', '864x1152', '1344x768', '1152x864', '1440x720', '720x1440'];

export async function POST(request: NextRequest) {
  try {
    // Auth required for image generation
    const authResult = await requireAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const rateResult = await checkRateLimit(request, aiChatRateLimiter);
    if (!rateResult.allowed) {
      return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await request.json();
    const { prompt, size = '1024x1024' } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (!SUPPORTED_SIZES.includes(size)) {
      return NextResponse.json(
        { success: false, error: `Unsupported size. Use one of: ${SUPPORTED_SIZES.join(', ')}` },
        { status: 400 }
      );
    }

    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const response = await zai.images.generations.create({
      prompt: prompt.trim(),
      size,
    });

    const imageBase64 = response.data?.[0]?.base64;
    if (!imageBase64) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate image' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        image_base64: imageBase64,
        size,
        prompt,
      },
    });
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}
