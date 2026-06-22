/**
 * POST /api/translate - Translate text using LibreTranslate
 * Supports South African languages + English
 * Requires JWT auth, rate limited (10 req/min per user)
 */

import { NextRequest } from 'next/server';
import { apiResponse, apiError, requireAuth, checkRateLimit } from '@/lib/middleware';
import { apiRateLimiter } from '@/lib/security';
import { translateText, detectLanguage, checkTranslationRateLimit, SOUTH_AFRICAN_LANGUAGES } from '@/lib/translate';

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const authResult = requireAuth(request);
    if (!authResult.authenticated) {
      return authResult.error!;
    }
    const user = authResult.user;

    // General rate limiting
    const rateResult = await checkRateLimit(request, apiRateLimiter);
    if (!rateResult.allowed) {
      return apiError('Rate limit exceeded', 429, 'RATE_LIMITED');
    }

    // Per-user translation rate limit (10 per minute)
    const translationRate = checkTranslationRateLimit(user.userId);
    if (!translationRate.allowed) {
      return apiError('Translation rate limit exceeded (10 per minute)', 429, 'TRANSLATION_RATE_LIMITED');
    }

    // Parse request body
    const body = await request.json();
    const { text, source, target } = body;

    if (!text || typeof text !== 'string') {
      return apiError('Text is required for translation', 400, 'MISSING_TEXT');
    }

    if (text.length > 5000) {
      return apiError('Text too long. Maximum 5000 characters.', 400, 'TEXT_TOO_LONG');
    }

    const targetLang = target || 'en';
    const sourceLang = source || 'auto';

    // Validate target language
    if (!SOUTH_AFRICAN_LANGUAGES[targetLang]) {
      return apiError(
        `Unsupported target language: ${targetLang}. Supported: ${Object.entries(SOUTH_AFRICAN_LANGUAGES).map(([code, name]) => `${code} (${name})`).join(', ')}`,
        400,
        'UNSUPPORTED_LANGUAGE'
      );
    }

    // If source is 'auto', detect language first
    let detectedLang: string | undefined;
    if (sourceLang === 'auto') {
      const detection = await detectLanguage(text);
      detectedLang = detection.language;
    }

    // Perform translation
    const result = await translateText(text, sourceLang === 'auto' ? 'auto' : sourceLang, targetLang);

    return apiResponse({
      translatedText: result.translatedText,
      detectedLanguage: result.detectedLanguage || (detectedLang ? {
        code: detectedLang,
        name: SOUTH_AFRICAN_LANGUAGES[detectedLang] || detectedLang,
        confidence: 0.5,
      } : undefined),
      source: result.source,
      sourceLanguage: sourceLang === 'auto' ? (detectedLang || 'unknown') : sourceLang,
      targetLanguage: targetLang,
      rateLimitRemaining: translationRate.remaining,
    });
  } catch (error) {
    console.error('Translation API error:', error);
    return apiError('Translation failed', 500, 'TRANSLATION_ERROR');
  }
}

/**
 * GET /api/translate - Get supported languages and detect language
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const detectParam = url.searchParams.get('detect');

    // If detect param is provided, detect the language
    if (detectParam) {
      const detection = await detectLanguage(detectParam);
      return apiResponse({
        detectedLanguage: detection,
        supportedLanguages: SOUTH_AFRICAN_LANGUAGES,
      });
    }

    // Otherwise, return supported languages
    return apiResponse({
      supportedLanguages: SOUTH_AFRICAN_LANGUAGES,
      totalSupported: Object.keys(SOUTH_AFRICAN_LANGUAGES).length,
    });
  } catch (error) {
    console.error('Language detection error:', error);
    return apiError('Language detection failed', 500, 'DETECTION_ERROR');
  }
}
