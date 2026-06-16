/**
 * AI Memo API - POST /api/ai/memo
 * AI-powered legal memo generation for Infinity Legal SA
 * 
 * Requires authentication. Generates a professional legal memorandum
 * based on provided facts and legal issues.
 */

import { NextRequest } from 'next/server';
import { generateLegalMemo } from '@/lib/llm-service';
import { apiResponse, apiError, requireAuth, checkRateLimit } from '@/lib/middleware';
import { aiChatRateLimiter } from '@/lib/security';

// ============================================
// POST HANDLER - Generate a legal memo
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Auth required for memo generation
    const authResult = await requireAuth(request);
    if (!authResult.authenticated) {
      return authResult.error!;
    }

    // Rate limiting
    const rateResult = await checkRateLimit(request, aiChatRateLimiter);
    if (!rateResult.allowed) {
      return apiError('Rate limit exceeded. Please wait before generating another memo.', 429, 'RATE_LIMITED');
    }

    const body = await request.json();
    const { facts, issues, jurisdiction } = body;

    if (!facts || typeof facts !== 'string' || facts.trim().length < 20) {
      return apiError('Facts are required (at least 20 characters)', 400, 'INVALID_FACTS');
    }

    if (!issues || typeof issues !== 'string' || issues.trim().length < 10) {
      return apiError('Legal issues are required (at least 10 characters)', 400, 'INVALID_ISSUES');
    }

    if (facts.length > 20000) {
      return apiError('Facts too long (max 20,000 characters)', 400, 'FACTS_TOO_LONG');
    }

    if (issues.length > 5000) {
      return apiError('Issues description too long (max 5,000 characters)', 400, 'ISSUES_TOO_LONG');
    }

    // Generate memo via LLM service
    const result = await generateLegalMemo({
      facts: facts.trim(),
      issues: issues.trim(),
      jurisdiction: jurisdiction || undefined,
    });

    return apiResponse({
      memo: result.content,
      provider: result.provider,
      model: result.model,
      tokensUsed: result.tokensUsed,
      cached: result.cached,
      responseTimeMs: result.responseTimeMs,
    });
  } catch (error) {
    console.error('Memo generation error:', error);
    return apiError('Failed to generate legal memo. Please try again later.', 500, 'MEMO_ERROR');
  }
}
