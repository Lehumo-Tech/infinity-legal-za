/**
 * POST /api/ai/asr - Speech to Text using z-ai-web-dev-sdk
 * Transcribes audio files to text
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { audio_base64 } = body;

    if (!audio_base64 || typeof audio_base64 !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Audio base64 data is required' },
        { status: 400 }
      );
    }

    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const response = await zai.audio.asr.create({
      file_base64: audio_base64,
    });

    return NextResponse.json({
      success: true,
      data: {
        text: response.text,
      },
    });
  } catch (error) {
    console.error('ASR error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}
