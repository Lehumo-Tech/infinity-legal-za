/**
 * Infinity Legal ZA - Central External API Client
 * Unified client for all external API calls with retry, timeout, and error handling
 */

// ============================================
// TYPES
// ============================================

export interface ExternalApiOptions {
  /** Request timeout in milliseconds (default: 5000) */
  timeout?: number;
  /** Maximum number of retries (default: 2) */
  maxRetries?: number;
  /** Base delay for exponential backoff in ms (default: 1000) */
  baseDelay?: number;
  /** Custom headers */
  headers?: Record<string, string>;
  /** Request body for POST requests */
  body?: unknown;
  /** HTTP method */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
}

export interface ExternalApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: string | null;
  status: number | null;
  retries: number;
  responseTimeMs: number;
}

// ============================================
// IN-MEMORY CACHE
// ============================================

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const apiCache = new Map<string, CacheEntry<unknown>>();

export function setCache<T>(key: string, data: T, ttlMs: number): void {
  apiCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function getCache<T>(key: string): T | null {
  const entry = apiCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    apiCache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function clearCache(prefix?: string): void {
  if (!prefix) {
    apiCache.clear();
    return;
  }
  for (const key of apiCache.keys()) {
    if (key.startsWith(prefix)) {
      apiCache.delete(key);
    }
  }
}

// ============================================
// CENTRAL API CLIENT
// ============================================

/**
 * Make an external API call with retry logic, timeout handling, and error logging.
 * All external API calls MUST go through this function.
 */
export async function callExternalApi<T = unknown>(
  url: string,
  options: ExternalApiOptions = {}
): Promise<ExternalApiResponse<T>> {
  const {
    timeout = 5000,
    maxRetries = 2,
    baseDelay = 1000,
    headers = {},
    body,
    method = 'GET',
  } = options;

  const startTime = Date.now();
  let lastError: string | null = null;
  let lastStatus: number | null = null;
  let attempt = 0;

  while (attempt <= maxRetries) {
    attempt++;
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const fetchOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'InfinityLegalZA/1.0',
          ...headers,
        },
        signal: controller.signal,
      };

      if (body && method !== 'GET') {
        fetchOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);
      lastStatus = response.status;

      if (response.ok) {
        const data = await response.json() as T;
        return {
          success: true,
          data,
          error: null,
          status: response.status,
          retries: attempt - 1,
          responseTimeMs: Date.now() - startTime,
        };
      }

      // Non-retryable client errors (4xx except 429, 408)
      if (response.status >= 400 && response.status < 500 && response.status !== 429 && response.status !== 408) {
        const errorText = await response.text().catch(() => 'Unknown error');
        lastError = `HTTP ${response.status}: ${errorText}`;
        break; // Don't retry client errors
      }

      lastError = `HTTP ${response.status}: ${response.statusText}`;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        lastError = `Request timed out after ${timeout}ms`;
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        lastError = `Network error: ${error.message}`;
      } else {
        lastError = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    // Wait before retry with exponential backoff
    if (attempt <= maxRetries) {
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Log failed external API call
  console.warn(`[ExternalAPI] Failed after ${attempt} attempts: ${method} ${url} - ${lastError}`);

  return {
    success: false,
    data: null,
    error: lastError,
    status: lastStatus,
    retries: attempt - 1,
    responseTimeMs: Date.now() - startTime,
  };
}

// ============================================
// TYPE-SAFE RESPONSE INTERFACES
// ============================================

/** Nager.Date - South African Public Holiday */
export interface NagerHoliday {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  counties: string[] | null;
  launchYear: number | null;
  types: string[];
}

/** Disify - Email disposable check */
export interface DisifyResponse {
  email: string;
  disposable: boolean;
  dns: boolean;
  format: boolean;
}

/** EVA - Email validation */
export interface EvaResponse {
  status: string;
  data: {
    email_address: string;
    domain: string;
    valid_syntax: boolean;
    disposable: boolean;
    webmail: boolean;
    deliverable: boolean;
    catch_all: boolean;
    gibberish: boolean;
    spam: boolean;
  };
}

/** LibreTranslate - Language detection */
export interface LibreTranslateDetectResponse {
  confidence: number;
  language: string;
}

/** LibreTranslate - Translation */
export interface LibreTranslateTranslateResponse {
  translatedText: string;
  detectedLanguage?: {
    confidence: number;
    language: string;
  };
}

/** Country.is - IP geolocation */
export interface CountryIsResponse {
  ip: string;
  country: string;
  country_iso: string;
}

/** GeoJS - IP geolocation */
export interface GeoJsResponse {
  ip: string;
  country_code: string;
  country_name: string;
  city: string;
  region: string;
  timezone: string;
  latitude: number;
  longitude: number;
  organization: string;
  asn: number;
}
