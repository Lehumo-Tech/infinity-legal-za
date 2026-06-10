/**
 * POST /api/ai/tts - Text to Speech using z-ai-web-dev-sdk
 * Converts text to natural-sounding speech audio
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, voice = 'tongtong', speed = 1.0 } = await request.json();

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Text is required' }, { status: 400 });
    }

    if (text.length > 1024) {
      return NextResponse.json({ success: false, error: 'Text must be 1024 characters or less' }, { status: 400 });
    }

    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const response = await zai.audio.tts.create({
      input: text.trim(),
      voice,
      speed: Math.min(Math.max(speed, 0.5), 2.0),
      response_format: 'wav',
      stream: false,
    });

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate speech' },
      { status: 500 }
    );
  }
}
