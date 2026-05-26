import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, apiError } from '@/lib/middleware';

const SYSTEM_PROMPT = `You are "Ask Infinity" — the AI legal assistant for Infinity Legal SA, a South African legal services firm. You specialise in South African law and provide general legal guidance.

KEY RULES:
- You are a South African legal information assistant, NOT a replacement for an attorney.
- Always clarify that your responses are general legal information and NOT legal advice.
- You are knowledgeable about South African law: the Constitution, LRA (Labour Relations Act), BCEA (Basic Conditions of Employment Act), NCA (National Credit Act), POPIA (Protection of Personal Information Act), CPA (Consumer Protection Act), the Criminal Procedure Act, the Divorce Act, the Children's Act, and other SA legislation.
- You can help users understand their rights, legal processes, and what steps they might take.
- When appropriate, recommend the user book a consultation with an Infinity Legal attorney for case-specific advice.
- Always be professional, empathetic, and clear. Use plain language.
- If a matter seems urgent (e.g. domestic violence, criminal charges, imminent eviction), advise the user to seek immediate legal help and provide relevant emergency resources.
- You understand SA legal terminology: CCMA, High Court, Magistrates Court, Labour Court, Constitutional Court, etc.
- Always respond in the same language the user writes in. If they write in isiZulu, Afrikaans, etc., respond in that language.
- Keep responses concise but thorough. Use bullet points when listing steps or options.
- Never invent laws, case law, or legal provisions. If unsure, say so and recommend consulting an attorney.

PRACTICE AREAS you can discuss:
1. Civil Litigation — consumer disputes, debt review, contractual claims
2. Labour Law — unfair dismissal, CCMA processes, workplace disputes, retrenchment
3. Criminal Defence — bail, rights upon arrest, trial processes
4. Family Law — divorce, custody, maintenance, domestic violence protection
5. Commercial Law — company formation, contracts, regulatory compliance
6. Estate Planning — wills, trusts, deceased estates, legacy protection

PRICING (for referral purposes):
- Civil Litigation Plan: R99/month
- Labour Law Plan: R99/month
- Extensive Cover Plan: R139/month (all practice areas)

If the user asks about pricing or wants to sign up, recommend they use the platform to create an account or book a consultation.`;

// In-memory conversation store with TTL eviction
const conversations = new Map<string, { messages: { role: string; content: string }[]; lastAccess: number }>();
const MAX_CONVERSATIONS = 500;
const CONVERSATION_TTL = 30 * 60 * 1000; // 30 minutes

// Simple rate limiter for AI chat (per-IP)
const aiChatLimiter = new Map<string, { count: number; resetAt: number }>();
const AI_CHAT_RATE_LIMIT = 15; // 15 messages per minute per IP
const AI_CHAT_RATE_WINDOW = 60 * 1000; // 1 minute

function checkAiRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = aiChatLimiter.get(ip);
  if (!entry || now > entry.resetAt) {
    aiChatLimiter.set(ip, { count: 1, resetAt: now + AI_CHAT_RATE_WINDOW });
    return true;
  }
  if (entry.count >= AI_CHAT_RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// Evict expired conversations periodically
function evictExpired() {
  const now = Date.now();
  for (const [key, val] of conversations) {
    if (now - val.lastAccess > CONVERSATION_TTL) {
      conversations.delete(key);
    }
  }
  // Also clean rate limiter
  for (const [key, val] of aiChatLimiter) {
    if (now > val.resetAt) aiChatLimiter.delete(key);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!checkAiRateLimit(ip)) {
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

    // Evict old conversations
    evictExpired();

    // Enforce max conversation count
    if (conversations.size >= MAX_CONVERSATIONS && !conversations.has(sid)) {
      // Remove oldest entry
      let oldestKey = '';
      let oldestTime = Infinity;
      for (const [key, val] of conversations) {
        if (val.lastAccess < oldestTime) {
          oldestTime = val.lastAccess;
          oldestKey = key;
        }
      }
      if (oldestKey) conversations.delete(oldestKey);
    }

    // Get or create conversation history
    const entry = conversations.get(sid);
    let history = entry?.messages || [
      { role: 'assistant', content: SYSTEM_PROMPT },
    ];

    // Add user message
    history.push({ role: 'user', content: message.trim() });

    // Trim history to last 20 messages (plus system prompt) to avoid token limits
    if (history.length > 22) {
      history = [history[0], ...history.slice(-21)];
    }

    // Use z-ai-web-dev-sdk for LLM completion
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: history as Array<{ role: string; content: string }>,
      thinking: { type: 'disabled' },
    });

    const aiResponse = completion.choices?.[0]?.message?.content || 'I apologise, I was unable to process your request. Please try again.';

    // Add AI response to history
    history.push({ role: 'assistant', content: aiResponse });

    // Save updated history with timestamp
    conversations.set(sid, { messages: history, lastAccess: Date.now() });

    return NextResponse.json({
      success: true,
      data: aiResponse,
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sid = searchParams.get('sessionId');
    if (sid) {
      conversations.delete(sid);
    }
    return NextResponse.json({ success: true, data: 'Conversation cleared' });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to clear conversation' }, { status: 500 });
  }
}
