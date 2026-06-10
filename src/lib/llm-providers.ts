/**
 * Infinity Legal ZA - Unified LLM Provider Library
 * 
 * Uses z-ai-web-dev-sdk as the PRIMARY LLM provider.
 * Falls back to free providers (Google AI, Groq, OpenRouter, Cohere, Cloudflare)
 * if z-ai is unavailable.
 */

// ============================================
// TYPES
// ============================================

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMChatOptions {
  temperature?: number;
  maxTokens?: number;
  preferredProvider?: ProviderName;
  cache?: boolean;
  cacheTtl?: number;
  systemPrompt?: string;
}

export interface LLMChatResult {
  content: string;
  provider: ProviderName;
  model: string;
  tokensUsed: number;
  cached: boolean;
  responseTimeMs: number;
}

export interface LLMEmbedResult {
  embedding: number[];
  provider: ProviderName;
  model: string;
  tokensUsed: number;
}

export type ProviderName = 'zai' | 'google' | 'groq' | 'openrouter' | 'cohere' | 'cloudflare';

export interface ProviderStatus {
  name: ProviderName;
  displayName: string;
  available: boolean;
  configured: boolean;
  models: string[];
  requestsToday: number;
  lastError: string | null;
  avgResponseMs: number;
}

interface ProviderUsage {
  requestsToday: number;
  lastRequestAt: number | null;
  totalTokensToday: number;
  errors: number;
  avgResponseMs: number;
  _responseTimes: number[];
  lastError: string | null;
}

// ============================================
// RESPONSE CACHE
// ============================================

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const responseCache = new Map<string, CacheEntry<LLMChatResult>>();

function getCachedResult(key: string): LLMChatResult | null {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    responseCache.delete(key);
    return null;
  }
  return { ...entry.data, cached: true };
}

function setCachedResult(key: string, data: LLMChatResult, ttlMs: number): void {
  responseCache.set(key, { data, expiresAt: Date.now() + ttlMs });
  if (responseCache.size > 500) {
    const now = Date.now();
    for (const [k, v] of responseCache) {
      if (now > v.expiresAt) responseCache.delete(k);
    }
  }
}

function generateCacheKey(messages: LLMMessage[], options: LLMChatOptions): string {
  const msgHash = messages.map(m => `${m.role}:${m.content}`).join('|');
  return `llm:${options.preferredProvider || 'auto'}:${msgHash.length}:${msgHash.slice(0, 200)}:${options.temperature || 0.7}:${options.maxTokens || 2048}`;
}

// ============================================
// PROVIDER USAGE TRACKING
// ============================================

const providerUsage: Record<ProviderName, ProviderUsage> = {
  zai: { requestsToday: 0, lastRequestAt: null, totalTokensToday: 0, errors: 0, avgResponseMs: 0, _responseTimes: [], lastError: null },
  google: { requestsToday: 0, lastRequestAt: null, totalTokensToday: 0, errors: 0, avgResponseMs: 0, _responseTimes: [], lastError: null },
  groq: { requestsToday: 0, lastRequestAt: null, totalTokensToday: 0, errors: 0, avgResponseMs: 0, _responseTimes: [], lastError: null },
  openrouter: { requestsToday: 0, lastRequestAt: null, totalTokensToday: 0, errors: 0, avgResponseMs: 0, _responseTimes: [], lastError: null },
  cohere: { requestsToday: 0, lastRequestAt: null, totalTokensToday: 0, errors: 0, avgResponseMs: 0, _responseTimes: [], lastError: null },
  cloudflare: { requestsToday: 0, lastRequestAt: null, totalTokensToday: 0, errors: 0, avgResponseMs: 0, _responseTimes: [], lastError: null },
};

function updateProviderUsage(provider: ProviderName, responseTimeMs: number, tokensUsed: number, error?: string): void {
  const usage = providerUsage[provider];
  usage.requestsToday++;
  usage.lastRequestAt = Date.now();
  usage.totalTokensToday += tokensUsed;
  if (error) {
    usage.errors++;
    usage.lastError = error;
  }
  usage._responseTimes.push(responseTimeMs);
  if (usage._responseTimes.length > 20) usage._responseTimes.shift();
  usage.avgResponseMs = Math.round(usage._responseTimes.reduce((a, b) => a + b, 0) / usage._responseTimes.length);
}

// ============================================
// Z-AI-WEB-DEV-SDK (PRIMARY PROVIDER)
// ============================================

let zaiInstance: any = null;
let zaiInitPromise: Promise<any> | null = null;

async function getZAI(): Promise<any> {
  if (zaiInstance) return zaiInstance;
  if (zaiInitPromise) return zaiInitPromise;

  zaiInitPromise = import('z-ai-web-dev-sdk').then((mod) => {
    const ZAI = mod.default;
    return ZAI.create().then((instance: any) => {
      zaiInstance = instance;
      return instance;
    });
  }).catch((error) => {
    zaiInitPromise = null;
    throw error;
  });

  return zaiInitPromise;
}

async function zaiChat(messages: LLMMessage[], options: LLMChatOptions): Promise<LLMChatResult> {
  const startTime = Date.now();

  try {
    const zai = await getZAI();
    
    // Convert messages: z-ai uses 'assistant' role for system prompts
    const zaiMessages = messages.map(m => ({
      role: m.role === 'system' ? 'assistant' : m.role,
      content: m.content,
    }));

    const completion = await zai.chat.completions.create({
      messages: zaiMessages,
      thinking: { type: 'disabled' },
    });

    const content = completion?.choices?.[0]?.message?.content || '';
    const tokensUsed = Math.ceil(content.length / 4);

    const result: LLMChatResult = {
      content,
      provider: 'zai',
      model: 'z-ai-default',
      tokensUsed,
      cached: false,
      responseTimeMs: Date.now() - startTime,
    };
    updateProviderUsage('zai', result.responseTimeMs, tokensUsed);
    return result;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    updateProviderUsage('zai', Date.now() - startTime, 0, errMsg);
    throw error;
  }
}

// ============================================
// ENVIRONMENT VARIABLES (FREE PROVIDERS)
// ============================================

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY || '';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const COHERE_API_KEY = process.env.COHERE_API_KEY || '';
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';

// ============================================
// FALLBACK PROVIDERS
// ============================================

async function googleChat(messages: LLMMessage[], options: LLMChatOptions): Promise<LLMChatResult> {
  if (!GOOGLE_AI_API_KEY) throw new Error('Google AI not configured');
  const startTime = Date.now();
  const model = 'gemini-2.5-flash';
  const systemInstruction = messages.find(m => m.role === 'system')?.content || options.systemPrompt;
  const contents = messages.filter(m => m.role !== 'system').map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  const body: Record<string, unknown> = {
    contents,
    generationConfig: { temperature: options.temperature ?? 0.7, maxOutputTokens: options.maxTokens ?? 2048 },
  };
  if (systemInstruction) body.systemInstruction = { parts: [{ text: systemInstruction }] };
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GOOGLE_AI_API_KEY}`;
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`Google AI ${response.status}`);
  const data = await response.json() as any;
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const tokensUsed = data?.usageMetadata?.totalTokenCount || Math.ceil(content.length / 4);
  const result = { content, provider: 'google' as ProviderName, model, tokensUsed, cached: false, responseTimeMs: Date.now() - startTime };
  updateProviderUsage('google', result.responseTimeMs, tokensUsed);
  return result;
}

async function groqChat(messages: LLMMessage[], options: LLMChatOptions): Promise<LLMChatResult> {
  if (!GROQ_API_KEY) throw new Error('Groq not configured');
  const startTime = Date.now();
  const body = { model: 'llama-3.3-70b-versatile', messages: messages.map(m => ({ role: m.role, content: m.content })), temperature: options.temperature ?? 0.7, max_tokens: options.maxTokens ?? 2048 };
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`Groq ${response.status}`);
  const data = await response.json() as any;
  const content = data?.choices?.[0]?.message?.content || '';
  const tokensUsed = data?.usage?.total_tokens || Math.ceil(content.length / 4);
  const result = { content, provider: 'groq' as ProviderName, model: 'llama-3.3-70b-versatile', tokensUsed, cached: false, responseTimeMs: Date.now() - startTime };
  updateProviderUsage('groq', result.responseTimeMs, tokensUsed);
  return result;
}

async function openrouterChat(messages: LLMMessage[], options: LLMChatOptions): Promise<LLMChatResult> {
  if (!OPENROUTER_API_KEY) throw new Error('OpenRouter not configured');
  const startTime = Date.now();
  const model = 'deepseek/deepseek-v4-flash:free';
  const body = { model, messages: messages.map(m => ({ role: m.role, content: m.content })), temperature: options.temperature ?? 0.7, max_tokens: options.maxTokens ?? 2048 };
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENROUTER_API_KEY}`, 'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://infinitylegal.org', 'X-Title': 'Infinity Legal ZA' }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`OpenRouter ${response.status}`);
  const data = await response.json() as any;
  const content = data?.choices?.[0]?.message?.content || '';
  const tokensUsed = data?.usage?.total_tokens || Math.ceil(content.length / 4);
  const result = { content, provider: 'openrouter' as ProviderName, model, tokensUsed, cached: false, responseTimeMs: Date.now() - startTime };
  updateProviderUsage('openrouter', result.responseTimeMs, tokensUsed);
  return result;
}

// ============================================
// MAIN CHAT FUNCTION WITH FAILOVER
// ============================================

// Priority: z-ai first, then free providers as fallbacks
const FALLBACK_PRIORITY: ProviderName[] = ['google', 'groq', 'openrouter'];

export async function llmChat(
  messages: LLMMessage[],
  options: LLMChatOptions = {}
): Promise<LLMChatResult> {
  const { cache = true, cacheTtl = 30 * 60 * 1000, preferredProvider } = options;

  // Check cache first
  if (cache) {
    const cacheKey = generateCacheKey(messages, options);
    const cached = getCachedResult(cacheKey);
    if (cached) return cached;
  }

  // If a specific provider is requested, try it first
  if (preferredProvider && preferredProvider !== 'zai') {
    try {
      const providerFn: Record<string, (m: LLMMessage[], o: LLMChatOptions) => Promise<LLMChatResult>> = {
        google: googleChat,
        groq: groqChat,
        openrouter: openrouterChat,
      };
      const fn = providerFn[preferredProvider];
      if (fn) {
        const result = await fn(messages, options);
        if (result.content?.trim()) {
          if (cache) setCachedResult(generateCacheKey(messages, options), result, cacheTtl);
          return result;
        }
      }
    } catch (error) {
      console.warn(`[LLM] Preferred provider ${preferredProvider} failed, falling back`);
    }
  }

  // Try z-ai-web-dev-sdk (PRIMARY)
  try {
    const result = await zaiChat(messages, options);
    if (result.content?.trim()) {
      if (cache) setCachedResult(generateCacheKey(messages, options), result, cacheTtl);
      return result;
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`[LLM] Z-AI primary failed: ${errMsg}, trying fallbacks...`);
  }

  // Try free providers as fallbacks
  let lastError: string | null = null;
  for (const providerName of FALLBACK_PRIORITY) {
    try {
      const providerFn: Record<string, (m: LLMMessage[], o: LLMChatOptions) => Promise<LLMChatResult>> = {
        google: googleChat,
        groq: groqChat,
        openrouter: openrouterChat,
      };
      const fn = providerFn[providerName];
      if (!fn) continue;

      const result = await fn(messages, options);
      if (result.content?.trim()) {
        if (cache) setCachedResult(generateCacheKey(messages, options), result, cacheTtl);
        return result;
      }
      lastError = `Empty response from ${providerName}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`[LLM] Fallback ${providerName} failed: ${lastError}`);
      continue;
    }
  }

  // All providers failed
  console.error(`[LLM] All providers failed. Last error: ${lastError}`);
  return {
    content: 'I apologise, I am unable to process your request at this time. All AI providers are temporarily unavailable. Please try again in a few minutes.',
    provider: 'zai',
    model: 'none',
    tokensUsed: 0,
    cached: false,
    responseTimeMs: 0,
  };
}

// ============================================
// EMBED FUNCTION (Google AI only)
// ============================================

export async function llmEmbed(text: string): Promise<LLMEmbedResult> {
  if (!GOOGLE_AI_API_KEY) throw new Error('Google AI API key required for embeddings');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GOOGLE_AI_API_KEY}`;
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'models/text-embedding-004', content: { parts: [{ text }] } }) });
  if (!response.ok) throw new Error(`Google Embed ${response.status}`);
  const data = await response.json() as any;
  return { embedding: data?.embedding?.values || [], provider: 'google', model: 'text-embedding-004', tokensUsed: Math.ceil(text.length / 4) };
}

// ============================================
// PROVIDER STATUS & USAGE
// ============================================

export function getProviderStatuses(): ProviderStatus[] {
  return [
    { name: 'zai', displayName: 'Z-AI (Primary)', available: true, configured: true, models: ['z-ai-default'], requestsToday: providerUsage.zai.requestsToday, lastError: providerUsage.zai.lastError, avgResponseMs: providerUsage.zai.avgResponseMs },
    { name: 'google', displayName: 'Google AI Studio (Gemini)', available: !!GOOGLE_AI_API_KEY, configured: !!GOOGLE_AI_API_KEY, models: ['gemini-2.5-flash'], requestsToday: providerUsage.google.requestsToday, lastError: providerUsage.google.lastError, avgResponseMs: providerUsage.google.avgResponseMs },
    { name: 'groq', displayName: 'Groq (Llama)', available: !!GROQ_API_KEY, configured: !!GROQ_API_KEY, models: ['llama-3.3-70b-versatile'], requestsToday: providerUsage.groq.requestsToday, lastError: providerUsage.groq.lastError, avgResponseMs: providerUsage.groq.avgResponseMs },
    { name: 'openrouter', displayName: 'OpenRouter (DeepSeek)', available: !!OPENROUTER_API_KEY, configured: !!OPENROUTER_API_KEY, models: ['deepseek-v4-flash:free'], requestsToday: providerUsage.openrouter.requestsToday, lastError: providerUsage.openrouter.lastError, avgResponseMs: providerUsage.openrouter.avgResponseMs },
  ];
}

export function getTotalTokenUsage(): { today: number; byProvider: Record<ProviderName, number> } {
  const byProvider = {} as Record<ProviderName, number>;
  let today = 0;
  for (const [name, usage] of Object.entries(providerUsage)) {
    byProvider[name as ProviderName] = usage.totalTokensToday;
    today += usage.totalTokensToday;
  }
  return { today, byProvider };
}

export function resetDailyUsage(): void {
  for (const usage of Object.values(providerUsage)) {
    usage.requestsToday = 0;
    usage.totalTokensToday = 0;
    usage.errors = 0;
    usage.lastError = null;
  }
}

// ============================================
// CONVERSATION HISTORY MANAGER
// ============================================

interface ConversationEntry {
  messages: LLMMessage[];
  lastAccess: number;
}

const conversations = new Map<string, ConversationEntry>();
const MAX_CONVERSATIONS = 500;
const CONVERSATION_TTL = 30 * 60 * 1000;

function evictExpiredConversations(): void {
  const now = Date.now();
  for (const [key, val] of conversations) {
    if (now - val.lastAccess > CONVERSATION_TTL) conversations.delete(key);
  }
}

export function getConversation(sessionId: string, systemPrompt?: string): LLMMessage[] {
  evictExpiredConversations();
  const entry = conversations.get(sessionId);
  if (entry) { entry.lastAccess = Date.now(); return entry.messages; }
  return systemPrompt ? [{ role: 'system', content: systemPrompt }] : [];
}

export function updateConversation(sessionId: string, messages: LLMMessage[]): void {
  if (conversations.size >= MAX_CONVERSATIONS && !conversations.has(sessionId)) {
    let oldestKey = '';
    let oldestTime = Infinity;
    for (const [key, val] of conversations) { if (val.lastAccess < oldestTime) { oldestTime = val.lastAccess; oldestKey = key; } }
    if (oldestKey) conversations.delete(oldestKey);
  }
  const trimmed = messages.length > 22 ? [messages[0], ...messages.slice(-21)] : messages;
  conversations.set(sessionId, { messages: trimmed, lastAccess: Date.now() });
}

export function clearConversation(sessionId: string): void { conversations.delete(sessionId); }

export function trimMessages(messages: LLMMessage[], maxMessages: number = 22): LLMMessage[] {
  if (messages.length <= maxMessages) return messages;
  return [messages[0], ...messages.slice(-(maxMessages - 1))];
}
