/**
 * Infinity Legal ZA - Unified LLM Provider Library
 * 
 * Integrates multiple FREE LLM APIs with automatic failover,
 * rate limiting awareness, response caching, and token tracking.
 * 
 * Providers:
 * 1. Google AI Studio (Gemini) — Primary
 * 2. Groq — Ultra-fast inference (secondary)
 * 3. OpenRouter — Gateway to many models (tertiary/fallback)
 * 4. Cohere — Legal text specialist (supplementary)
 * 5. Cloudflare Workers AI — Edge inference (supplementary)
 * 
 * Fallback: z-ai-web-dev-sdk (if all free providers fail)
 */

// ============================================
// TYPES
// ============================================

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMChatOptions {
  /** Temperature (0-1, default 0.7) */
  temperature?: number;
  /** Max tokens to generate (default 2048) */
  maxTokens?: number;
  /** Preferred provider (override default priority) */
  preferredProvider?: ProviderName;
  /** Whether to cache the response (default true) */
  cache?: boolean;
  /** Cache TTL in ms (default 30 min) */
  cacheTtl?: number;
  /** System prompt override */
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

export type ProviderName = 'google' | 'groq' | 'openrouter' | 'cohere' | 'cloudflare' | 'zai';

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
  // Evict old entries when cache grows too large
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
  google: { requestsToday: 0, lastRequestAt: null, totalTokensToday: 0, errors: 0, avgResponseMs: 0, _responseTimes: [], lastError: null },
  groq: { requestsToday: 0, lastRequestAt: null, totalTokensToday: 0, errors: 0, avgResponseMs: 0, _responseTimes: [], lastError: null },
  openrouter: { requestsToday: 0, lastRequestAt: null, totalTokensToday: 0, errors: 0, avgResponseMs: 0, _responseTimes: [], lastError: null },
  cohere: { requestsToday: 0, lastRequestAt: null, totalTokensToday: 0, errors: 0, avgResponseMs: 0, _responseTimes: [], lastError: null },
  cloudflare: { requestsToday: 0, lastRequestAt: null, totalTokensToday: 0, errors: 0, avgResponseMs: 0, _responseTimes: [], lastError: null },
  zai: { requestsToday: 0, lastRequestAt: null, totalTokensToday: 0, errors: 0, avgResponseMs: 0, _responseTimes: [], lastError: null },
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
  // Track rolling average response time (last 20 requests)
  usage._responseTimes.push(responseTimeMs);
  if (usage._responseTimes.length > 20) usage._responseTimes.shift();
  usage.avgResponseMs = Math.round(usage._responseTimes.reduce((a, b) => a + b, 0) / usage._responseTimes.length);
}

// ============================================
// ENVIRONMENT VARIABLES
// ============================================

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY || '';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const COHERE_API_KEY = process.env.COHERE_API_KEY || '';
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';

// ============================================
// DEFAULT PROVIDER PRIORITY
// ============================================

const DEFAULT_PRIORITY: ProviderName[] = ['google', 'groq', 'openrouter', 'cohere', 'cloudflare'];

// ============================================
// LLM PROVIDER INTERFACE
// ============================================

interface LLMProvider {
  name: ProviderName;
  displayName: string;
  models: string[];
  isConfigured(): boolean;
  chat(messages: LLMMessage[], options: LLMChatOptions): Promise<LLMChatResult>;
}

// ============================================
// GOOGLE AI STUDIO (GEMINI) PROVIDER
// ============================================

const GOOGLE_MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'];

const googleProvider: LLMProvider = {
  name: 'google',
  displayName: 'Google AI Studio (Gemini)',
  models: GOOGLE_MODELS,

  isConfigured(): boolean {
    return GOOGLE_AI_API_KEY.length > 0;
  },

  async chat(messages: LLMMessage[], options: LLMChatOptions): Promise<LLMChatResult> {
    const startTime = Date.now();
    const model = options.maxTokens && options.maxTokens <= 512 ? 'gemini-2.5-flash-lite' : 'gemini-2.5-flash';

    // Convert to Gemini format
    const systemInstruction = messages.find(m => m.role === 'system')?.content || options.systemPrompt;
    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 2048,
      },
    };
    if (systemInstruction) {
      body.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GOOGLE_AI_API_KEY}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Google AI ${response.status}: ${errText.slice(0, 200)}`);
      }

      const data = await response.json() as any;
      const content = data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || '';
      const tokensUsed = data?.usageMetadata?.totalTokenCount || Math.ceil(content.length / 4);

      const result: LLMChatResult = {
        content,
        provider: 'google',
        model,
        tokensUsed,
        cached: false,
        responseTimeMs: Date.now() - startTime,
      };
      updateProviderUsage('google', result.responseTimeMs, tokensUsed);
      return result;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      updateProviderUsage('google', Date.now() - startTime, 0, errMsg);
      throw error;
    }
  },
};

// ============================================
// GROQ PROVIDER (OpenAI-compatible)
// ============================================

const GROQ_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];

const groqProvider: LLMProvider = {
  name: 'groq',
  displayName: 'Groq (Llama)',
  models: GROQ_MODELS,

  isConfigured(): boolean {
    return GROQ_API_KEY.length > 0;
  },

  async chat(messages: LLMMessage[], options: LLMChatOptions): Promise<LLMChatResult> {
    const startTime = Date.now();
    const model = options.maxTokens && options.maxTokens <= 512 ? 'llama-3.1-8b-instant' : 'llama-3.3-70b-versatile';

    const body = {
      model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Groq ${response.status}: ${errText.slice(0, 200)}`);
      }

      const data = await response.json() as any;
      const content = data?.choices?.[0]?.message?.content || '';
      const tokensUsed = data?.usage?.total_tokens || Math.ceil(content.length / 4);

      const result: LLMChatResult = {
        content,
        provider: 'groq',
        model,
        tokensUsed,
        cached: false,
        responseTimeMs: Date.now() - startTime,
      };
      updateProviderUsage('groq', result.responseTimeMs, tokensUsed);
      return result;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      updateProviderUsage('groq', Date.now() - startTime, 0, errMsg);
      throw error;
    }
  },
};

// ============================================
// OPENROUTER PROVIDER (OpenAI-compatible)
// ============================================

const OPENROUTER_MODELS = ['deepseek/deepseek-v4-flash:free', 'meta-llama/llama-3.3-70b-instruct:free'];

const openrouterProvider: LLMProvider = {
  name: 'openrouter',
  displayName: 'OpenRouter (DeepSeek/Llama)',
  models: OPENROUTER_MODELS,

  isConfigured(): boolean {
    return OPENROUTER_API_KEY.length > 0;
  },

  async chat(messages: LLMMessage[], options: LLMChatOptions): Promise<LLMChatResult> {
    const startTime = Date.now();
    const model = 'deepseek/deepseek-v4-flash:free';

    const body = {
      model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://infinitylegal.co.za',
          'X-Title': 'Infinity Legal ZA',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text().catch(() => 'Unknown error');
        throw new Error(`OpenRouter ${response.status}: ${errText.slice(0, 200)}`);
      }

      const data = await response.json() as any;
      const content = data?.choices?.[0]?.message?.content || '';
      const tokensUsed = data?.usage?.total_tokens || Math.ceil(content.length / 4);

      const result: LLMChatResult = {
        content,
        provider: 'openrouter',
        model,
        tokensUsed,
        cached: false,
        responseTimeMs: Date.now() - startTime,
      };
      updateProviderUsage('openrouter', result.responseTimeMs, tokensUsed);
      return result;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      updateProviderUsage('openrouter', Date.now() - startTime, 0, errMsg);
      throw error;
    }
  },
};

// ============================================
// COHERE PROVIDER
// ============================================

const COHERE_MODELS = ['command-a-03-2025'];

const cohereProvider: LLMProvider = {
  name: 'cohere',
  displayName: 'Cohere (Command)',
  models: COHERE_MODELS,

  isConfigured(): boolean {
    return COHERE_API_KEY.length > 0;
  },

  async chat(messages: LLMMessage[], options: LLMChatOptions): Promise<LLMChatResult> {
    const startTime = Date.now();
    const model = 'command-a-03-2025';

    // Cohere v2 chat API format
    const systemMsg = messages.find(m => m.role === 'system')?.content || options.systemPrompt;
    const chatMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));

    const body: Record<string, unknown> = {
      model,
      messages: chatMessages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
    };
    if (systemMsg) body.system = systemMsg;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      const response = await fetch('https://api.cohere.com/v2/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${COHERE_API_KEY}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Cohere ${response.status}: ${errText.slice(0, 200)}`);
      }

      const data = await response.json() as any;
      const content = data?.message?.content?.[0]?.text ||
        data?.message?.content || '';
      const tokensUsed = data?.usage?.tokens?.total || Math.ceil(content.length / 4);

      const result: LLMChatResult = {
        content,
        provider: 'cohere',
        model,
        tokensUsed,
        cached: false,
        responseTimeMs: Date.now() - startTime,
      };
      updateProviderUsage('cohere', result.responseTimeMs, tokensUsed);
      return result;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      updateProviderUsage('cohere', Date.now() - startTime, 0, errMsg);
      throw error;
    }
  },
};

// ============================================
// CLOUDFLARE WORKERS AI PROVIDER
// ============================================

const CLOUDFLARE_MODELS = ['@cf/meta/llama-3.1-8b-instruct-fp8-fast'];

const cloudflareProvider: LLMProvider = {
  name: 'cloudflare',
  displayName: 'Cloudflare Workers AI',
  models: CLOUDFLARE_MODELS,

  isConfigured(): boolean {
    return CLOUDFLARE_ACCOUNT_ID.length > 0 && CLOUDFLARE_API_TOKEN.length > 0;
  },

  async chat(messages: LLMMessage[], options: LLMChatOptions): Promise<LLMChatResult> {
    const startTime = Date.now();
    const model = '@cf/meta/llama-3.1-8b-instruct-fp8-fast';

    const body = {
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
    };

    const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Cloudflare ${response.status}: ${errText.slice(0, 200)}`);
      }

      const data = await response.json() as any;
      const content = data?.result?.response || '';
      const tokensUsed = data?.result?.usage?.total_tokens || Math.ceil(content.length / 4);

      const result: LLMChatResult = {
        content,
        provider: 'cloudflare',
        model,
        tokensUsed,
        cached: false,
        responseTimeMs: Date.now() - startTime,
      };
      updateProviderUsage('cloudflare', result.responseTimeMs, tokensUsed);
      return result;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      updateProviderUsage('cloudflare', Date.now() - startTime, 0, errMsg);
      throw error;
    }
  },
};

// ============================================
// Z-AI-WEB-DEV-SDK (FINAL FALLBACK)
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
    const completion = await zai.chat.completions.create({
      messages: messages.map(m => ({ role: m.role, content: m.content })),
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
// PROVIDER REGISTRY
// ============================================

const providers: Record<ProviderName, LLMProvider> = {
  google: googleProvider,
  groq: groqProvider,
  openrouter: openrouterProvider,
  cohere: cohereProvider,
  cloudflare: cloudflareProvider,
  zai: googleProvider, // placeholder, zai uses separate function
};

// ============================================
// MAIN CHAT FUNCTION WITH FAILOVER
// ============================================

/**
 * Send a chat request to LLM providers with automatic failover.
 * Tries providers in priority order until one succeeds.
 * Falls back to z-ai-web-dev-sdk if all free providers fail.
 */
export async function llmChat(
  messages: LLMMessage[],
  options: LLMChatOptions = {}
): Promise<LLMChatResult> {
  const {
    cache = true,
    cacheTtl = 30 * 60 * 1000, // 30 minutes
    preferredProvider,
  } = options;

  // Check cache first
  if (cache) {
    const cacheKey = generateCacheKey(messages, options);
    const cached = getCachedResult(cacheKey);
    if (cached) return cached;
  }

  // Determine provider order
  const priority: ProviderName[] = preferredProvider
    ? [preferredProvider, ...DEFAULT_PRIORITY.filter(p => p !== preferredProvider)]
    : [...DEFAULT_PRIORITY];

  // Filter to only configured providers
  const configuredProviders = priority.filter(p => providers[p]?.isConfigured());

  // If no free providers configured, go straight to Z-AI
  if (configuredProviders.length === 0) {
    const result = await zaiChat(messages, options);
    if (cache) {
      setCachedResult(generateCacheKey(messages, options), result, cacheTtl);
    }
    return result;
  }

  // Try each configured provider
  let lastError: string | null = null;
  for (const providerName of configuredProviders) {
    try {
      const provider = providers[providerName];
      const result = await provider.chat(messages, options);

      // Only return if we got actual content
      if (result.content && result.content.trim().length > 0) {
        if (cache) {
          setCachedResult(generateCacheKey(messages, options), result, cacheTtl);
        }
        return result;
      }
      lastError = `Empty response from ${providerName}`;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      lastError = errMsg;
      console.warn(`[LLM] Provider ${providerName} failed: ${errMsg}`);
      continue; // Try next provider
    }
  }

  // All free providers failed — try Z-AI fallback
  console.warn(`[LLM] All free providers failed, falling back to z-ai-web-dev-sdk. Last error: ${lastError}`);
  try {
    const result = await zaiChat(messages, options);
    if (cache) {
      setCachedResult(generateCacheKey(messages, options), result, cacheTtl);
    }
    return result;
  } catch (zaiError) {
    const errMsg = zaiError instanceof Error ? zaiError.message : 'Unknown error';
    console.error(`[LLM] Z-AI fallback also failed: ${errMsg}`);
    return {
      content: 'I apologise, I am unable to process your request at this time. All AI providers are temporarily unavailable. Please try again in a few minutes.',
      provider: 'zai',
      model: 'none',
      tokensUsed: 0,
      cached: false,
      responseTimeMs: 0,
    };
  }
}

// ============================================
// EMBED FUNCTION (Google AI only for now)
// ============================================

export async function llmEmbed(text: string): Promise<LLMEmbedResult> {
  if (!GOOGLE_AI_API_KEY) {
    throw new Error('Google AI API key required for embeddings');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GOOGLE_AI_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'models/text-embedding-004', content: { parts: [{ text }] } }),
  });

  if (!response.ok) {
    throw new Error(`Google Embed ${response.status}`);
  }

  const data = await response.json() as any;
  return {
    embedding: data?.embedding?.values || [],
    provider: 'google',
    model: 'text-embedding-004',
    tokensUsed: Math.ceil(text.length / 4),
  };
}

// ============================================
// PROVIDER STATUS & USAGE
// ============================================

export function getProviderStatuses(): ProviderStatus[] {
  return [
    googleProvider,
    groqProvider,
    openrouterProvider,
    cohereProvider,
    cloudflareProvider,
  ].map((p) => {
    const usage = providerUsage[p.name];
    return {
      name: p.name,
      displayName: p.displayName,
      available: p.isConfigured(),
      configured: p.isConfigured(),
      models: p.models,
      requestsToday: usage.requestsToday,
      lastError: usage.lastError,
      avgResponseMs: usage.avgResponseMs,
    };
  });
}

export function getTotalTokenUsage(): { today: number; byProvider: Record<ProviderName, number> } {
  const byProvider: Record<ProviderName, number> = {} as any;
  let today = 0;
  for (const [name, usage] of Object.entries(providerUsage)) {
    byProvider[name as ProviderName] = usage.totalTokensToday;
    today += usage.totalTokensToday;
  }
  return { today, byProvider };
}

// Reset daily usage (call from a cron or at midnight)
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
const CONVERSATION_TTL = 30 * 60 * 1000; // 30 minutes

function evictExpiredConversations(): void {
  const now = Date.now();
  for (const [key, val] of conversations) {
    if (now - val.lastAccess > CONVERSATION_TTL) {
      conversations.delete(key);
    }
  }
}

export function getConversation(sessionId: string, systemPrompt?: string): LLMMessage[] {
  evictExpiredConversations();
  const entry = conversations.get(sessionId);
  if (entry) {
    entry.lastAccess = Date.now();
    return entry.messages;
  }
  const messages: LLMMessage[] = systemPrompt
    ? [{ role: 'system', content: systemPrompt }]
    : [];
  return messages;
}

export function updateConversation(sessionId: string, messages: LLMMessage[]): void {
  // Enforce max conversation count
  if (conversations.size >= MAX_CONVERSATIONS && !conversations.has(sessionId)) {
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

  // Trim to last 20 messages (plus system prompt) to avoid token limits
  const trimmed = messages.length > 22
    ? [messages[0], ...messages.slice(-21)]
    : messages;

  conversations.set(sessionId, { messages: trimmed, lastAccess: Date.now() });
}

export function clearConversation(sessionId: string): void {
  conversations.delete(sessionId);
}

export function trimMessages(messages: LLMMessage[], maxMessages: number = 22): LLMMessage[] {
  if (messages.length <= maxMessages) return messages;
  // Keep system prompt + last N messages
  return [messages[0], ...messages.slice(-(maxMessages - 1))];
}
