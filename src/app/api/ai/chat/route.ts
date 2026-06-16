/**
 * AI Chat API - POST /api/ai/chat
 * Uses the new LLM service with provider fallback
 * 
 * Supports multi-turn conversations with session tracking.
 * All LLM calls go through the unified provider layer with
 * automatic failover between free providers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { legalChat, clearLegalChat } from '@/lib/llm-service';
import { checkRateLimit, requireAuth } from '@/lib/middleware';
import { aiChatRateLimiter } from '@/lib/security';

// ============================================
// POST HANDLER - Send message to AI chat
// ============================================

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Auth required for AI chat — no unauthenticated access on a legal platform
    const authResult = await requireAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please sign in to use the AI assistant.' },
        { status: 401 }
      );
    }

    // Rate limiting — use DB-backed rate limiter
    const rateResult = await checkRateLimit(request, aiChatRateLimiter);
    if (!rateResult.allowed) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please wait a moment before sending another message.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { message, sessionId } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { success: false, error: 'Message too long (max 2000 characters)' },
        { status: 400 }
      );
    }

    const sid = sessionId || 'default';

    // Use the new LLM service with provider fallback
    const result = await legalChat(message.trim(), {
      sessionId: sid,
      temperature: 0.7,
      maxTokens: 2048,
    });

    return NextResponse.json({
      success: true,
      data: result.content,
      meta: {
        provider: result.provider,
        model: result.model,
        tokensUsed: result.tokensUsed,
        cached: result.cached,
        responseTimeMs: result.responseTimeMs,
      },
    });
  } catch (error: unknown) {
    console.error('AI Chat error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'I encountered an error processing your request. Please try again shortly.',
      },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE HANDLER - Clear conversation
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    // Auth required
    const authResult = await requireAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sid = searchParams.get('sessionId');
    if (sid) {
      clearLegalChat(sid);
    }
    return NextResponse.json({ success: true, data: 'Conversation cleared' });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to clear conversation' }, { status: 500 });
  }
}
