import { NextResponse } from 'next/server'
import { summarizeText } from '@/lib/huggingface-service'
export const dynamic = 'force-dynamic'

/**
 * POST /api/summarize
 * Summarize legal text using Hugging Face Inference API
 */
export async function POST(request) {
  try {
    const { text, maxLength, minLength } = await request.json()

    if (!text || text.length < 50) {
      return NextResponse.json(
        { error: 'Text too short for summarization (min 50 chars)' },
        { status: 400 }
      )
    }

    const result = await summarizeText(text, maxLength, minLength)

    return NextResponse.json({
      success: true,
      summary: result.summary,
      originalLength: result.originalLength,
      summaryLength: result.summaryLength,
      model: result.model,
      source: result.source,
    })
  } catch (error) {
    console.error('Summarize API error:', error)
    return NextResponse.json(
      { error: 'Summarization failed: ' + error.message },
      { status: 500 }
    )
  }
}
