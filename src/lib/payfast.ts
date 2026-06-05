/**
 * Infinity Legal ZA - PayFast Payment Integration Library
 * Signature generation, form building, ITN verification
 * @see https://www.payfast.co.za/documentation/pf-integration-guide/
 */

import { createHash } from 'crypto';

// ============================================
// CONSTANTS
// ============================================

const PAYFAST_SANDBOX_URL = 'https://sandbox.payfast.co.za/eng/process';
const PAYFAST_PRODUCTION_URL = 'https://www.payfast.co.za/eng/process';
const PAYFAST_SANDBOX_VALIDATE_URL = 'https://sandbox.payfast.co.za/eng/query/validate';
const PAYFAST_PRODUCTION_VALIDATE_URL = 'https://www.payfast.co.za/eng/query/validate';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://infinitylegal.co.za';

// ============================================
// TYPES
// ============================================

export type PayFastMode = 'sandbox' | 'live';

export type BillingCycle = 'monthly' | 'annual';

export type PayFastFrequency = 'monthly' | 'quarterly' | 'biannually' | 'annually';

export interface PayFastPaymentParams {
  // Merchant details (auto-filled from env)
  merchant_id?: string;
  merchant_key?: string;
  // Customer details
  name_first: string;
  name_last: string;
  email_address: string;
  // Payment details
  m_payment_id: string;
  amount: string; // 2 decimal places e.g. "99.00"
  item_name: string; // max 100 chars
  item_description?: string; // max 255 chars
  // Subscription details (optional)
  subscription_type?: 1; // 1 for recurring
  billing_date?: string; // YYYY-MM-DD
  recurring_amount?: string;
  frequency?: PayFastFrequency;
  cycles?: number; // 0 = indefinite
  // URLs (auto-filled)
  return_url?: string;
  cancel_url?: string;
  notify_url?: string;
}

export interface PayFastFormData extends PayFastPaymentParams {
  signature: string;
}

export interface PayFastITNData {
  m_payment_id: string;
  pf_payment_id: string;
  payment_status: 'COMPLETE' | 'FAILED' | 'PENDING';
  item_name: string;
  item_description?: string;
  amount_gross: string;
  amount_fee: string;
  amount_net: string;
  custom_str1?: string;
  custom_str2?: string;
  custom_str3?: string;
  custom_str4?: string;
  custom_str5?: string;
  custom_int1?: string;
  custom_int2?: string;
  custom_int3?: string;
  custom_int4?: string;
  custom_int5?: string;
  email_address?: string;
  merchant_id?: string;
  signature: string;
  token?: string; // For subscriptions
  billing_date?: string;
  recurring_amount?: string;
  frequency?: string;
  cycles?: string;
  subscription_type?: string;
}

// ============================================
// CONFIGURATION
// ============================================

export function getPayFastMode(): PayFastMode {
  return (process.env.PAYFAST_MODE as PayFastMode) || 'sandbox';
}

export function getPayFastUrl(): string {
  return getPayFastMode() === 'live' ? PAYFAST_PRODUCTION_URL : PAYFAST_SANDBOX_URL;
}

export function getPayFastValidateUrl(): string {
  return getPayFastMode() === 'live' ? PAYFAST_PRODUCTION_VALIDATE_URL : PAYFAST_SANDBOX_VALIDATE_URL;
}

export function getMerchantId(): string {
  const mode = getPayFastMode();
  const merchantId = process.env.PAYFAST_MERCHANT_ID;

  if (!merchantId) {
    if (mode === 'live') {
      throw new Error('PAYFAST_MERCHANT_ID is required in live mode. Set it in your environment variables.');
    }
    // Sandbox default — only used when PAYFAST_MODE=sandbox
    return '10000100';
  }

  return merchantId;
}

export function getMerchantKey(): string {
  const mode = getPayFastMode();
  const merchantKey = process.env.PAYFAST_MERCHANT_KEY;

  if (!merchantKey) {
    if (mode === 'live') {
      throw new Error('PAYFAST_MERCHANT_KEY is required in live mode. Set it in your environment variables.');
    }
    // Sandbox default — only used when PAYFAST_MODE=sandbox
    return '46f0cd694581a';
  }

  return merchantKey;
}

export function getPassphrase(): string {
  return process.env.PAYFAST_PASSPHRASE || '';
}

// ============================================
// SIGNATURE GENERATION
// ============================================

/**
 * Generate PayFast MD5 signature
 * 1. Sort all parameters alphabetically by key
 * 2. Concatenate as key=value&key=value (URL encode values)
 * 3. Append passphrase
 * 4. Generate MD5 hash
 */
export function generateSignature(
  data: Record<string, string | number | undefined>,
  passphrase?: string
): string {
  // Step 1: Sort keys alphabetically, filter out undefined/empty values
  const sortedKeys = Object.keys(data).sort();

  // Step 2: Build the parameter string
  const parts: string[] = [];
  for (const key of sortedKeys) {
    const value = data[key];
    if (value === undefined || value === null || value === '') continue;
    parts.push(`${key}=${encodeURIComponent(String(value))}`);
  }

  let paramString = parts.join('&');

  // Step 3: Append passphrase if provided
  const pass = passphrase || getPassphrase();
  if (pass) {
    paramString += `&passphrase=${encodeURIComponent(pass)}`;
  }

  // Step 4: Generate MD5 hash
  return createHash('md5').update(paramString).digest('hex');
}

// ============================================
// FORM BUILDER
// ============================================

/**
 * Build complete PayFast payment form data with signature
 */
export function buildPaymentForm(params: PayFastPaymentParams): PayFastFormData {
  const formData: Record<string, string | number | undefined> = {
    merchant_id: params.merchant_id || getMerchantId(),
    merchant_key: params.merchant_key || getMerchantKey(),
    return_url: params.return_url || `${APP_URL}/api/payfast/success`,
    cancel_url: params.cancel_url || `${APP_URL}/api/payfast/cancel`,
    notify_url: params.notify_url || `${APP_URL}/api/payfast/notify`,
    name_first: params.name_first,
    name_last: params.name_last,
    email_address: params.email_address,
    m_payment_id: params.m_payment_id,
    amount: params.amount,
    item_name: params.item_name,
    item_description: params.item_description,
  };

  // Add subscription fields if present
  if (params.subscription_type) {
    formData.subscription_type = params.subscription_type;
    formData.billing_date = params.billing_date;
    formData.recurring_amount = params.recurring_amount;
    formData.frequency = params.frequency;
    formData.cycles = params.cycles;
  }

  // Generate signature
  const signature = generateSignature(formData);

  return {
    ...params,
    merchant_id: formData.merchant_id as string,
    merchant_key: formData.merchant_key as string,
    return_url: formData.return_url as string,
    cancel_url: formData.cancel_url as string,
    notify_url: formData.notify_url as string,
    signature,
  };
}

// ============================================
// ITN VERIFICATION
// ============================================

/**
 * Verify ITN (Instant Transaction Notification) from PayFast
 * 1. Post received data back to PayFast for validation
 * 2. Verify the signature matches
 * 3. Verify payment details match expected values
 */
export async function verifyITN(itnData: PayFastITNData): Promise<{
  valid: boolean;
  reason?: string;
}> {
  try {
    // Step 1: Verify signature
    const { signature, ...dataWithoutSig } = itnData;
    const expectedSignature = generateSignature(
      dataWithoutSig as Record<string, string | number | undefined>
    );

    if (signature !== expectedSignature) {
      return { valid: false, reason: 'Signature mismatch' };
    }

    // Step 2: Post data back to PayFast for server-side validation
    const validateUrl = getPayFastValidateUrl();

    // Build validation POST body
    const validationParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(itnData)) {
      if (value !== undefined && value !== null) {
        validationParams[key] = String(value);
      }
    }

    const formBody = Object.entries(validationParams)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');

    const response = await fetch(validateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody,
    });

    const responseText = await response.text();

    if (responseText.trim() === 'VALID') {
      return { valid: true };
    } else if (responseText.trim() === 'INVALID') {
      return { valid: false, reason: 'PayFast server validation returned INVALID' };
    } else {
      return { valid: false, reason: `Unexpected validation response: ${responseText}` };
    }
  } catch (error) {
    console.error('PayFast ITN verification error:', error);
    return { valid: false, reason: `Verification request failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format amount to 2 decimal places (ZAR format)
 */
export function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

/**
 * Map billing cycle to PayFast frequency
 */
export function billingCycleToFrequency(cycle: BillingCycle): PayFastFrequency {
  return cycle === 'annual' ? 'annually' : 'monthly';
}

/**
 * Generate unique payment ID
 */
export function generatePaymentId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `IL-${timestamp}-${random}`.toUpperCase();
}

/**
 * Get billing date for today in YYYY-MM-DD format
 */
export function getBillingDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Calculate subscription period end date
 */
export function calculatePeriodEnd(startDate: Date, cycle: BillingCycle): Date {
  const end = new Date(startDate);
  if (cycle === 'annual') {
    end.setFullYear(end.getFullYear() + 1);
  } else {
    end.setMonth(end.getMonth() + 1);
  }
  return end;
}
