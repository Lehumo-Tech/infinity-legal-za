// Security utilities for the Infinity Legal Platform
// Provides input sanitization, encryption helpers, and rate limiting

// ==========================================
// INPUT SANITIZATION (XSS Prevention)
// ==========================================

const DANGEROUS_PATTERNS = [
  /<script[^>]*>[\s\S]*?<\/script>/gi,
  /<iframe[^>]*>[\s\S]*?<\/iframe>/gi,
  /on\w+\s*=\s*["'][^"']*["']/gi,
  /javascript\s*:/gi,
  /data\s*:\s*text\/html/gi,
  /vbscript\s*:/gi,
]

export function sanitizeString(input) {
  if (typeof input !== 'string') return input
  let sanitized = input
  // Remove dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '')
  }
  // Encode HTML entities
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
  return sanitized.trim()
}

export function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(sanitizeObject)
  const sanitized = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value)
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value)
    } else {
      sanitized[key] = value
    }
  }
  return sanitized
}

// ==========================================
// RATE LIMITING
// ==========================================

// Use globalThis to persist the rate limit store across hot reloads
if (!globalThis._rateLimitStore) {
  globalThis._rateLimitStore = new Map()
}
const rateLimitStore = globalThis._rateLimitStore

if (!globalThis._rateLimitLastCleanup) {
  globalThis._rateLimitLastCleanup = Date.now()
}

const CLEANUP_INTERVAL = 60 * 1000 // Clean up every 60s

function cleanupRateLimits() {
  const now = Date.now()
  if (now - globalThis._rateLimitLastCleanup < CLEANUP_INTERVAL) return
  globalThis._rateLimitLastCleanup = now
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.windowStart > data.windowMs) {
      rateLimitStore.delete(key)
    }
  }
}

/**
 * Check if a request should be rate limited
 * @param {string} identifier - Unique key (e.g., IP + route)
 * @param {number} maxRequests - Max requests per window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {{ allowed: boolean, remaining: number, resetIn: number }}
 */
export function checkRateLimit(identifier, maxRequests = 30, windowMs = 60000) {
  cleanupRateLimits()
  const now = Date.now()
  let data = rateLimitStore.get(identifier)

  if (!data || now - data.windowStart > windowMs) {
    data = { count: 0, windowStart: now, windowMs }
    rateLimitStore.set(identifier, data)
  }

  data.count++
  const remaining = Math.max(0, maxRequests - data.count)
  const resetIn = Math.max(0, windowMs - (now - data.windowStart))

  return {
    allowed: data.count <= maxRequests,
    remaining,
    resetIn
  }
}

// ==========================================
// ENCRYPTION HELPERS (AES-256-GCM)
// ==========================================

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const TAG_LENGTH = 16

/**
 * Encrypt text using AES-256-GCM
 * @param {string} text - Plain text to encrypt
 * @param {string} key - 32-byte hex key (or will derive from passphrase)
 * @returns {string} Encrypted string (iv:tag:ciphertext in base64)
 */
export function encrypt(text, key) {
  if (!text) return text
  const derivedKey = crypto.createHash('sha256').update(key).digest()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv)
  let encrypted = cipher.update(text, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  const tag = cipher.getAuthTag()
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted}`
}

/**
 * Decrypt text encrypted with AES-256-GCM
 * @param {string} encryptedText - Encrypted string from encrypt()
 * @param {string} key - Same key used for encryption
 * @returns {string} Decrypted plain text
 */
export function decrypt(encryptedText, key) {
  if (!encryptedText || !encryptedText.includes(':')) return encryptedText
  try {
    const parts = encryptedText.split(':')
    if (parts.length !== 3) return encryptedText
    const iv = Buffer.from(parts[0], 'base64')
    const tag = Buffer.from(parts[1], 'base64')
    const encrypted = parts[2]
    const derivedKey = crypto.createHash('sha256').update(key).digest()
    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv)
    decipher.setAuthTag(tag)
    let decrypted = decipher.update(encrypted, 'base64', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch {
    return encryptedText // Return as-is if decryption fails
  }
}

// ==========================================
// SESSION VALIDATION
// ==========================================

const SESSION_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes

export function isSessionExpired(lastActivity) {
  if (!lastActivity) return true
  return Date.now() - new Date(lastActivity).getTime() > SESSION_TIMEOUT_MS
}

// ==========================================
// POPIA COMPLIANCE HELPERS
// ==========================================

export function redactPII(text) {
  if (!text) return text
  let redacted = text
  // SA ID numbers (13 digits)
  redacted = redacted.replace(/\b\d{13}\b/g, '[ID REDACTED]')
  // Phone numbers (SA format)
  redacted = redacted.replace(/\b0[1-9]\d{8}\b/g, '[PHONE REDACTED]')
  redacted = redacted.replace(/\+27\d{9}/g, '[PHONE REDACTED]')
  // Email addresses
  redacted = redacted.replace(/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/g, '[EMAIL REDACTED]')
  return redacted
}
