/**
 * Infinity Legal ZA - Security Library (Supabase)
 * Rate limiting (in-memory with Supabase fallback), input sanitization, encryption, PII redaction
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { db, isSupabaseConfigured } from '@/lib/db';

// ============================================
// RATE LIMITER (In-memory with Supabase fallback)
// ============================================

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

class RateLimiter {
  private cache: Map<string, RateLimitEntry> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 60, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async check(key: string): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const now = Date.now();
    const cacheEntry = this.cache.get(key);

    // Fast-path: if cache entry exists and is within window, use it
    if (cacheEntry && now - cacheEntry.windowStart <= this.windowMs) {
      if (cacheEntry.count >= this.maxRequests) {
        return { allowed: false, remaining: 0, resetAt: cacheEntry.windowStart + this.windowMs };
      }
      cacheEntry.count++;
      // Periodically sync to DB
      if (cacheEntry.count % 10 === 0) {
        this.syncToDb(key, cacheEntry).catch(() => {});
      }
      return { allowed: true, remaining: this.maxRequests - cacheEntry.count, resetAt: cacheEntry.windowStart + this.windowMs };
    }

    // Cache miss or expired — check DB
    try {
      if (!isSupabaseConfigured() || !db) throw new Error('Supabase not configured');
      const [ip, endpoint] = key.split(':');
      const { data: dbEntry } = await db
        .from('rate_limit_logs')
        .select('*')
        .eq('ip', ip)
        .eq('endpoint', endpoint)
        .single();

      if (dbEntry) {
        const windowStart = new Date(dbEntry.window_start).getTime();
        if (now - windowStart > this.windowMs) {
          // Window expired — reset
          await db
            .from('rate_limit_logs')
            .upsert({
              ip,
              endpoint,
              request_count: 1,
              window_start: new Date(now).toISOString(),
            }, { onConflict: 'ip,endpoint' });
          const entry: RateLimitEntry = { count: 1, windowStart: now };
          this.cache.set(key, entry);
          return { allowed: true, remaining: this.maxRequests - 1, resetAt: now + this.windowMs };
        }

        if (dbEntry.request_count >= this.maxRequests) {
          const entry: RateLimitEntry = { count: dbEntry.request_count, windowStart: windowStart };
          this.cache.set(key, entry);
          return { allowed: false, remaining: 0, resetAt: windowStart + this.windowMs };
        }

        // Increment DB count
        const newCount = dbEntry.request_count + 1;
        await db
          .from('rate_limit_logs')
          .update({ request_count: newCount })
          .eq('id', dbEntry.id);
        const entry: RateLimitEntry = { count: newCount, windowStart: windowStart };
        this.cache.set(key, entry);
        return { allowed: true, remaining: this.maxRequests - newCount, resetAt: windowStart + this.windowMs };
      }

      // No DB entry — create one
      await db.from('rate_limit_logs').insert({ ip, endpoint, request_count: 1 });
      const entry: RateLimitEntry = { count: 1, windowStart: now };
      this.cache.set(key, entry);
      return { allowed: true, remaining: this.maxRequests - 1, resetAt: now + this.windowMs };
    } catch (dbError) {
      // DB failure — fall back to in-memory only
      console.warn('[RateLimit] DB check failed, using in-memory fallback:', dbError);
      const entry: RateLimitEntry = { count: 1, windowStart: now };
      this.cache.set(key, entry);
      return { allowed: true, remaining: this.maxRequests - 1, resetAt: now + this.windowMs };
    }
  }

  private async syncToDb(key: string, entry: RateLimitEntry): Promise<void> {
    try {
      const [ip, endpoint] = key.split(':');
      await db
        .from('rate_limit_logs')
        .upsert({
          ip,
          endpoint,
          request_count: entry.count,
          window_start: new Date(entry.windowStart).toISOString(),
        }, { onConflict: 'ip,endpoint' });
    } catch {
      // Silently fail
    }
  }

  reset(key: string): void {
    this.cache.delete(key);
    const [ip, endpoint] = key.split(':');
    db.from('rate_limit_logs').delete().eq('ip', ip).eq('endpoint', endpoint).catch(() => {});
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.windowStart > this.windowMs) {
        this.cache.delete(key);
      }
    }
  }
}

// Pre-configured rate limiters
export const apiRateLimiter = new RateLimiter(60, 60000);
export const authRateLimiter = new RateLimiter(5, 300000);
export const signupRateLimiter = new RateLimiter(3, 3600000);
export const uploadRateLimiter = new RateLimiter(10, 60000);
export const searchRateLimiter = new RateLimiter(20, 60000);
export const contactRateLimiter = new RateLimiter(5, 300000);
export const aiChatRateLimiter = new RateLimiter(20, 60000);
export const intakeRateLimiter = new RateLimiter(5, 3600000); // 5 intake submissions per hour

export { RateLimiter };

// ============================================
// INPUT SANITIZATION
// ============================================

const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^>]*>/gi,
  /on\w+\s*=\s*["'][^"']*["']/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /data:text\/html/gi,
];

export function sanitizeString(input: string): string {
  let sanitized = input;
  // Strip dangerous script/iframe/object/embed tags (not HTML-encode — that corrupts stored data)
  for (const pattern of XSS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }
  // Remove dangerous HTML tags but preserve legitimate content
  // Do NOT HTML-encode here — that's a display-time concern (React auto-escapes)
  // Storing HTML entities in the database corrupts names like O'Brien → O&#x27;Brien
  sanitized = sanitized
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:text\/html/gi, '');
  return sanitized;
}

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'string' ? sanitizeString(item) :
        typeof item === 'object' && item !== null ? sanitizeObject(item as Record<string, unknown>) : item
      );
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized as T;
}

// ============================================
// ENCRYPTION (AES-256-GCM)
// ============================================

// SECURITY: Encryption key — must be set via ENCRYPTION_KEY environment variable
// Lazy initialization to avoid throwing during build/static generation
let _encryptionKey: string | null = null;

function getEncryptionKey(): string {
  if (_encryptionKey) return _encryptionKey;
  const key = process.env.ENCRYPTION_KEY;
  if (!key && process.env.NODE_ENV === 'production') {
    throw new Error('ENCRYPTION_KEY environment variable is required in production');
  }
  // Dev-only fallback (NOT for production use)
  _encryptionKey = key || 'dev-only-encryption-key-32ch!!';
  return _encryptionKey;
}
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  const key = Buffer.from(getEncryptionKey().padEnd(32, '0').substring(0, 32));
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedData: string): string {
  const key = Buffer.from(getEncryptionKey().padEnd(32, '0').substring(0, 32));
  const [ivHex, tagHex, encrypted] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// ============================================
// PII REDACTION
// ============================================

const SA_ID_PATTERN = /\b\d{13}\b/g;
const PHONE_PATTERN = /\b(\+27|0)\d{9}\b/g;
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const CREDIT_CARD_PATTERN = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;

export function redactPII(text: string): string {
  return text
    .replace(SA_ID_PATTERN, '[REDACTED_ID]')
    .replace(PHONE_PATTERN, '[REDACTED_PHONE]')
    .replace(CREDIT_CARD_PATTERN, '[REDACTED_CARD]')
    .replace(EMAIL_PATTERN, (match) => {
      const [user, domain] = match.split('@');
      return `${user[0]}***@${domain}`;
    });
}

// ============================================
// HIGH-RISK KEYWORD DETECTION
// ============================================

const HIGH_RISK_KEYWORDS = [
  'murder', 'rape', 'terrorism', 'terrorist', 'bomb', 'hijack',
  'kidnap', 'armed robbery', 'assassination', 'treason', 'genocide',
  'human trafficking', 'child abuse', 'domestic violence death',
];

export function checkHighRisk(text: string): { isHighRisk: boolean; keywords: string[] } {
  const lowerText = text.toLowerCase();
  const found = HIGH_RISK_KEYWORDS.filter(kw => lowerText.includes(kw));
  return { isHighRisk: found.length > 0, keywords: found };
}

// ============================================
// VALIDATION HELPERS
// ============================================

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/;
  return emailRegex.test(email);
}

export function isValidSAPhone(phone: string): boolean {
  const phoneRegex = /^(\+27|0)\d{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

export function isValidSAIdNumber(id: string): boolean {
  const idRegex = /^\d{13}$/;
  if (!idRegex.test(id)) return false;
  let sum = 0;
  for (let i = 0; i < 13; i++) {
    let digit = parseInt(id[i]);
    if (i % 2 !== 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .substring(0, 255);
}
