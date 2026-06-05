/**
 * Infinity Legal ZA - Email Validation Utility
 * Uses Disify (disposable email detection) + EVA (deliverability validation)
 * Graceful fallback if APIs are down - never blocks signup on API failure
 */

import { callExternalApi, setCache, getCache, type DisifyResponse, type EvaResponse } from '@/lib/external-apis';

// ============================================
// CONSTANTS
// ============================================

const EMAIL_CACHE_TTL = 60 * 60 * 1000; // 1 hour cache for email checks
const DISIFY_API_BASE = 'https://disify.com/api/email';
const EVA_API_BASE = 'https://api.eva.pingutil.com/email';

// ============================================
// TYPES
// ============================================

export interface EmailValidationResult {
  valid: boolean;
  reason?: string;
  /** Whether the check actually completed or fell back to default */
  checked: boolean;
  /** Source of the result ('api' | 'fallback') */
  source: 'api' | 'fallback';
}

export interface FullEmailValidation {
  disposable: EmailValidationResult;
  deliverable: EmailValidationResult;
  overallValid: boolean;
  reasons: string[];
}

// ============================================
// DISPOSABLE EMAIL LIST (FALLBACK)
// ============================================

/** Common disposable email domains to block as fallback */
const KNOWN_DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'guerrillamailblock.com',
  'sharklasers.com', 'grr.la', 'guerrillamail.biz', 'guerrillamail.de',
  'guerrillamail.info', 'guerrillamail.net', 'guerrillamail.org',
  'spam4.me', 'trashmail.com', 'trashmail.ws', 'tmpmail.net',
  'tmpmail.org', 'dispostable.com', 'mailcatch.com', 'maildrop.cc',
  'mailnesia.com', 'tempmail.com', 'temp-mail.org', 'throwaway.email',
  'yopmail.com', 'yopmail.fr', 'yopmail.net', 'jetable.org',
  'mailforspam.com', 'safetymail.info', 'instantemailaddress.com',
  'emaillime.com', 'emailondeck.com', 'tempail.com', 'tempr.email',
  'discard.email', 'fakeinbox.com', 'mailinater.com', '10minutemail.com',
  'tempmailaddress.com', 'throwam.com', 'getnator.com', 'mailscrap.com',
]);

function isKnownDisposableDomain(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return KNOWN_DISPOSABLE_DOMAINS.has(domain);
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Check if an email is from a disposable/temporary email provider (Disify).
 * Returns { valid, reason } where valid=false means the email IS disposable.
 */
export async function isDisposableEmail(email: string): Promise<EmailValidationResult> {
  const cacheKey = `email:disposable:${email.toLowerCase()}`;

  // Check cache
  const cached = getCache<EmailValidationResult>(cacheKey);
  if (cached) return { ...cached, source: 'api' };

  // Quick local check first
  if (isKnownDisposableDomain(email)) {
    const result: EmailValidationResult = {
      valid: false,
      reason: 'Disposable email addresses are not allowed',
      checked: true,
      source: 'fallback',
    };
    setCache(cacheKey, result, EMAIL_CACHE_TTL);
    return result;
  }

  // Call Disify API
  const result = await callExternalApi<DisifyResponse>(
    `${DISIFY_API_BASE}/${encodeURIComponent(email)}`,
    { timeout: 5000, maxRetries: 1 }
  );

  if (result.success && result.data) {
    const isDisposable = result.data.disposable === true;
    const validationResult: EmailValidationResult = {
      valid: !isDisposable,
      reason: isDisposable ? 'Disposable email addresses are not allowed' : undefined,
      checked: true,
      source: 'api',
    };
    setCache(cacheKey, validationResult, EMAIL_CACHE_TTL);
    return validationResult;
  }

  // Graceful fallback - don't block signup if API is down
  console.warn(`[EmailValidation] Disify API failed for ${email}: ${result.error}`);
  return {
    valid: true, // Allow if we can't check
    reason: 'Could not verify email - API unavailable',
    checked: false,
    source: 'fallback',
  };
}

/**
 * Check if an email is deliverable (EVA).
 * Returns { valid, reason } where valid=false means the email is likely undeliverable.
 */
export async function validateEmailDeliverability(email: string): Promise<EmailValidationResult> {
  const cacheKey = `email:deliverable:${email.toLowerCase()}`;

  // Check cache
  const cached = getCache<EmailValidationResult>(cacheKey);
  if (cached) return { ...cached, source: 'api' };

  // Call EVA API
  const result = await callExternalApi<EvaResponse>(
    `${EVA_API_BASE}?email=${encodeURIComponent(email)}`,
    { timeout: 5000, maxRetries: 1 }
  );

  if (result.success && result.data?.data) {
    const evaData = result.data.data;
    const reasons: string[] = [];

    if (!evaData.valid_syntax) reasons.push('Invalid email syntax');
    if (evaData.disposable) reasons.push('Disposable email detected');
    if (!evaData.deliverable) reasons.push('Email appears to be undeliverable');
    if (evaData.spam) reasons.push('Email flagged as spam');

    const validationResult: EmailValidationResult = {
      valid: reasons.length === 0,
      reason: reasons.length > 0 ? reasons.join('; ') : undefined,
      checked: true,
      source: 'api',
    };
    setCache(cacheKey, validationResult, EMAIL_CACHE_TTL);
    return validationResult;
  }

  // Graceful fallback - don't block signup if API is down
  console.warn(`[EmailValidation] EVA API failed for ${email}: ${result.error}`);
  return {
    valid: true, // Allow if we can't check
    reason: 'Could not verify email deliverability - API unavailable',
    checked: false,
    source: 'fallback',
  };
}

/**
 * Full email validation combining both disposable check and deliverability.
 * Used during signup to reject disposable/invalid emails.
 * If APIs fail, validation passes (graceful degradation).
 */
export async function validateEmailFully(email: string): Promise<FullEmailValidation> {
  // Run both checks in parallel
  const [disposableResult, deliverableResult] = await Promise.all([
    isDisposableEmail(email),
    validateEmailDeliverability(email),
  ]);

  const reasons: string[] = [];
  if (!disposableResult.valid && disposableResult.reason) reasons.push(disposableResult.reason);
  if (!deliverableResult.valid && deliverableResult.reason) reasons.push(deliverableResult.reason);

  return {
    disposable: disposableResult,
    deliverable: deliverableResult,
    overallValid: disposableResult.valid && deliverableResult.valid,
    reasons,
  };
}
