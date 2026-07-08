/**
 * AI Chat API - POST /api/ai/chat
 *
 * PUBLIC endpoint — no authentication required.
 * Uses the LLM service with provider fallback.
 *
 * Supports multi-turn conversations with session tracking.
 * Rate limiting is enforced for all users, with stricter
 * limits for anonymous (unauthenticated) visitors.
 *
 * Anonymous users: 10 messages per minute
 * Authenticated users: 20 messages per minute
 */

import { NextRequest, NextResponse } from 'next/server';
import { legalChat, clearLegalChat } from '@/lib/llm-service';
import { checkRateLimit, requireAuth } from '@/lib/middleware';
import { aiChatRateLimiter, RateLimiter } from '@/lib/security';
import { db } from '@/lib/db';

// Stricter rate limiter for anonymous users
const anonymousChatRateLimiter = new RateLimiter(10, 60000); // 10 messages per minute for anonymous

// ============================================
// POST HANDLER - Send message to AI chat
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Auth is optional — allow anonymous access
    const authResult = await requireAuth(request);
    const isAuthenticated = authResult.authenticated;

    // Rate limiting — stricter for anonymous users
    const limiter = isAuthenticated ? aiChatRateLimiter : anonymousChatRateLimiter;
    const rateResult = await checkRateLimit(request, limiter);
    if (!rateResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: isAuthenticated
            ? 'Rate limit exceeded. Please wait a moment before sending another message.'
            : 'Rate limit exceeded for anonymous users. Please sign up for higher limits, or wait a moment before trying again.',
        },
        {
          status: 429,
          headers: (rateResult.headers || {}) as Record<string, string>,
        }
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

    // Generate or use existing session ID
    const sid = sessionId || (isAuthenticated ? `user-${authResult.user?.userId}` : `anon-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

    // Use the LLM service with provider fallback
    const result = await legalChat(message.trim(), {
      sessionId: sid,
      temperature: 0.7,
      maxTokens: 2048,
    });

    // Log chat usage for analytics (non-blocking)
    try {
      const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      await db.auditLog.create({
        data: {
          user_id: isAuthenticated ? authResult.user?.userId : null,
          action: 'AI_CHAT_MESSAGE',
          resource_type: 'ai_chat',
          resource_id: sid,
          details: {
            message_length: message.length,
            provider: result.provider,
            tokens_used: result.tokensUsed,
            cached: result.cached,
            authenticated: isAuthenticated,
          },
          ip_address: ip,
          user_agent: request.headers.get('user-agent') || undefined,
        },
      });
    } catch {
      // Silently fail - don't block the chat response
    }

    return NextResponse.json({
      success: true,
      data: result.content,
      meta: {
        sessionId: sid,
        provider: result.provider,
        model: result.model,
        tokensUsed: result.tokensUsed,
        cached: result.cached,
        responseTimeMs: result.responseTimeMs,
        isAuthenticated,
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
