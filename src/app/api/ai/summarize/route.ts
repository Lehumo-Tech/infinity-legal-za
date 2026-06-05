/**
 * AI Summarize API - POST /api/ai/summarize
 * AI-powered legal document summarization for Infinity Legal SA
 * 
 * Requires authentication. Accepts legal document content and returns
 * a structured summary with key legal issues, parties, and risks.
 */

import { NextRequest } from 'next/server';
import { summarizeDocument } from '@/lib/llm-service';
import { apiResponse, apiError, requireAuth, checkRateLimit } from '@/lib/middleware';
import { aiChatRateLimiter } from '@/lib/security';

// ============================================
// POST HANDLER - Summarize a legal document
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Auth required for document summarization
    const authResult = requireAuth(request);
    if (!authResult.authenticated) {
      return authResult.error!;
    }

    // Rate limiting
    const rateResult = await checkRateLimit(request, aiChatRateLimiter);
    if (!rateResult.allowed) {
      return apiError('Rate limit exceeded. Please wait before summarizing another document.', 429, 'RATE_LIMITED');
    }

    const body = await request.json();
    const { content, documentType } = body;

    if (!content || typeof content !== 'string' || content.trim().length < 50) {
      return apiError('Document content is required (at least 50 characters)', 400, 'INVALID_CONTENT');
    }

    if (content.length > 50000) {
      return apiError('Document too long (max 50,000 characters). Please provide a shorter excerpt.', 400, 'CONTENT_TOO_LONG');
    }

    // Summarize via LLM service
    const result = await summarizeDocument({
      content: content.trim(),
      documentType: documentType || undefined,
    });

    return apiResponse({
      summary: result.content,
      provider: result.provider,
      model: result.model,
      tokensUsed: result.tokensUsed,
      cached: result.cached,
      responseTimeMs: result.responseTimeMs,
    });
  } catch (error) {
    console.error('Document summarization error:', error);
    return apiError('Failed to summarize document. Please try again later.', 500, 'SUMMARIZE_ERROR');
  }
}
