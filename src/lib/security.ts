/**
 * Infinity Legal ZA - Security Library
 * Rate limiting, input sanitization, encryption, PII redaction
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// ============================================
// RATE LIMITER
// ============================================

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private maxRequests: number;
  private windowMs: number;
  
  constructor(maxRequests: number = 60, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  check(key: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now - entry.windowStart > this.windowMs) {
      this.limits.set(key, { count: 1, windowStart: now });
      return { allowed: true, remaining: this.maxRequests - 1, resetAt: now + this.windowMs };
    }

    if (entry.count >= this.maxRequests) {
      return { allowed: false, remaining: 0, resetAt: entry.windowStart + this.windowMs };
    }

    entry.count++;
    return { allowed: true, remaining: this.maxRequests - entry.count, resetAt: entry.windowStart + this.windowMs };
  }

  reset(key: string): void {
    this.limits.delete(key);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now - entry.windowStart > this.windowMs) {
        this.limits.delete(key);
      }
    }
  }
}

// Pre-configured rate limiters
export const apiRateLimiter = new RateLimiter(60, 60000);      // 60 req/min
export const authRateLimiter = new RateLimiter(5, 300000);      // 5 req/5min for auth
export const signupRateLimiter = new RateLimiter(3, 3600000);   // 3 req/hour for signup
export const uploadRateLimiter = new RateLimiter(10, 60000);    // 10 req/min for uploads
export const searchRateLimiter = new RateLimiter(20, 60000);    // 20 req/min for search

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
  for (const pattern of XSS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }
  // HTML entity encode special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
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

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'infinity-legal-za-encryption-key-32b';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

export function encrypt(text: string): string {
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32));
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedData: string): string {
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32));
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
  return {
    isHighRisk: found.length > 0,
    keywords: found,
  };
}

// ============================================
// SESSION MANAGEMENT
// ============================================

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function isSessionExpired(lastActivity: Date): boolean {
  return Date.now() - lastActivity.getTime() > SESSION_TIMEOUT_MS;
}

export function getSessionTimeout(): number {
  return SESSION_TIMEOUT_MS;
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
  
  // Basic Luhn check
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
