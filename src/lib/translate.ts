/**
 * Infinity Legal ZA - Multilingual Legal Document Translation Utility
 * Uses LibreTranslate API for translation and language detection
 * Supports English + South African languages (Afrikaans, Zulu, Sotho, Tswana, Tsonga)
 * Graceful error handling if LibreTranslate is down
 */

import { callExternalApi, setCache, getCache, type LibreTranslateDetectResponse, type LibreTranslateTranslateResponse } from '@/lib/external-apis';

// ============================================
// CONSTANTS
// ============================================

const TRANSLATION_CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours cache for translations
const DETECTION_CACHE_TTL = 60 * 60 * 1000; // 1 hour cache for language detection

// LibreTranslate public instances (fallback chain)
const LIBRETRANSLATE_INSTANCES = [
  'https://libretranslate.de',
  'https://translate.argosopentech.com',
  'https://translate.terraprint.co',
];

// ============================================
// SOUTH AFRICAN LANGUAGES
// ============================================

export const SOUTH_AFRICAN_LANGUAGES: Record<string, string> = {
  en: 'English',
  af: 'Afrikaans',
  zu: 'isiZulu',
  st: 'Sesotho',
  tn: 'Setswana',
  ts: 'Xitsonga',
  xh: 'isiXhosa',
  nso: 'Sepedi',
  ve: 'Tshivenda',
  nr: 'isiNdebele',
  ss: 'siSwati',
};

/** Supported language codes for translation */
export const SUPPORTED_LANGUAGE_CODES = Object.keys(SOUTH_AFRICAN_LANGUAGES);

// ============================================
// TYPES
// ============================================

export interface TranslationResult {
  translatedText: string;
  detectedLanguage?: {
    code: string;
    name: string;
    confidence: number;
  };
  source: 'api' | 'fallback';
}

export interface DetectionResult {
  language: string;
  languageName: string;
  confidence: number;
  source: 'api' | 'fallback';
}

// ============================================
// RATE LIMITING (in-memory, per-user)
// ============================================

const translationLimits = new Map<string, { count: number; windowStart: number }>();
const MAX_TRANSLATIONS_PER_MINUTE = 10;
const RATE_WINDOW_MS = 60 * 1000; // 1 minute

export function checkTranslationRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = translationLimits.get(userId);

  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    translationLimits.set(userId, { count: 1, windowStart: now });
    return { allowed: true, remaining: MAX_TRANSLATIONS_PER_MINUTE - 1 };
  }

  if (entry.count >= MAX_TRANSLATIONS_PER_MINUTE) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: MAX_TRANSLATIONS_PER_MINUTE - entry.count };
}

// ============================================
// HELPER: Try multiple LibreTranslate instances
// ============================================

async function callLibreTranslate<T>(endpoint: string, body?: unknown): Promise<T | null> {
  for (const instance of LIBRETRANSLATE_INSTANCES) {
    const url = `${instance}${endpoint}`;
    const result = await callExternalApi<T>(
      url,
      {
        timeout: 8000,
        maxRetries: 1,
        method: body ? 'POST' : 'GET',
        body,
      }
    );

    if (result.success && result.data) {
      return result.data;
    }
  }
  return null;
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Auto-detect the language of a text using LibreTranslate.
 */
export async function detectLanguage(text: string): Promise<DetectionResult> {
  const cacheKey = `detect:${text.substring(0, 100)}`;

  // Check cache
  const cached = getCache<DetectionResult>(cacheKey);
  if (cached) return cached;

  // Call LibreTranslate /detect endpoint
  const detections = await callLibreTranslate<LibreTranslateDetectResponse[]>(
    '/detect',
    { q: text }
  );

  if (detections && detections.length > 0) {
    const best = detections.reduce((a, b) => a.confidence > b.confidence ? a : b);
    const result: DetectionResult = {
      language: best.language,
      languageName: SOUTH_AFRICAN_LANGUAGES[best.language] || best.language,
      confidence: best.confidence,
      source: 'api',
    };
    setCache(cacheKey, result, DETECTION_CACHE_TTL);
    return result;
  }

  // Fallback: detect based on common patterns
  const fallbackLang = detectLanguageFallback(text);
  return {
    language: fallbackLang,
    languageName: SOUTH_AFRICAN_LANGUAGES[fallbackLang] || fallbackLang,
    confidence: 0.5,
    source: 'fallback',
  };
}

/**
 * Translate text between languages using LibreTranslate.
 * @param text - Text to translate
 * @param source - Source language code (use 'auto' for auto-detection)
 * @param target - Target language code
 */
export async function translateText(
  text: string,
  source: string = 'auto',
  target: string = 'en'
): Promise<TranslationResult> {
  // Validate target language
  if (!SUPPORTED_LANGUAGE_CODES.includes(target)) {
    return {
      translatedText: text, // Return original if target not supported
      source: 'fallback',
    };
  }

  const cacheKey = `translate:${source}:${target}:${text.substring(0, 200)}`;

  // Check cache
  const cached = getCache<TranslationResult>(cacheKey);
  if (cached) return cached;

  // Call LibreTranslate /translate endpoint
  const result = await callLibreTranslate<LibreTranslateTranslateResponse>(
    '/translate',
    {
      q: text,
      source: source === 'auto' ? 'auto' : source,
      target,
      format: 'text',
    }
  );

  if (result && result.translatedText) {
    const translation: TranslationResult = {
      translatedText: result.translatedText,
      detectedLanguage: result.detectedLanguage ? {
        code: result.detectedLanguage.language,
        name: SOUTH_AFRICAN_LANGUAGES[result.detectedLanguage.language] || result.detectedLanguage.language,
        confidence: result.detectedLanguage.confidence,
      } : undefined,
      source: 'api',
    };
    setCache(cacheKey, translation, TRANSLATION_CACHE_TTL);
    return translation;
  }

  // Fallback: return original text if translation fails
  console.warn(`[Translate] LibreTranslate failed for ${source}->${target}, returning original text`);
  return {
    translatedText: text,
    source: 'fallback',
  };
}

// ============================================
// FALLBACK: Simple pattern-based language detection
// ============================================

function detectLanguageFallback(text: string): string {
  const lower = text.toLowerCase();

  // Afrikaans: common words
  const afrikaansWords = ['die', 'en', 'van', 'is', 'nie', 'dat', 'vir', 'met', 'op', 'dit', 'het', 'was', 'aan', 'om'];
  const afrikaansCount = afrikaansWords.filter(w => lower.includes(` ${w} `) || lower.startsWith(`${w} `)).length;

  // Zulu: common words/patterns
  const zuluWords = ['ngi', 'uku', 'aba', 'isi', 'umu', 'ngu', 'kwa', 'noma', 'kodwa', 'futhi'];
  const zuluCount = zuluWords.filter(w => lower.includes(w)).length;

  // Sotho: common patterns
  const sothoWords = ['ba', 'ho', 'ka', 'le', 'li', 'sa', 'se', 'tsa', 'ngo', 'naha'];
  const sothoCount = sothoWords.filter(w => lower.includes(w)).length;

  const scores: Record<string, number> = {
    af: afrikaansCount,
    zu: zuluCount,
    st: sothoCount,
    en: 0,
  };

  // Default to English if no clear winner
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return 'en';

  return Object.entries(scores).find(([, score]) => score === maxScore)?.[0] || 'en';
}
