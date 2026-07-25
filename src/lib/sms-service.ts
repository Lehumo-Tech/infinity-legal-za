/**
 * SMS Service — Africa's Talking + Simulation Fallback
 *
 * Sends SMS messages via the Africa's Talking API.
 * Optimized for South African numbers (+27).
 * When AT credentials are not configured, operates in simulation mode.
 *
 * Setup:
 * 1. Create an Africa's Talking account at https://africastalking.com
 * 2. From your dashboard, copy your API key (Settings → API Key)
 * 3. Use your Africa's Talking username (the one you registered with)
 *    - Use "sandbox" as the username for testing in the sandbox environment
 * 4. (Optional) Register an alphanumeric Sender ID, e.g. "INFINITY"
 * 5. Add to .env:
 *    AFRICASTALKING_API_KEY=atsk_xxx
 *    AFRICASTALKING_USERNAME=infinitylegal
 *    AFRICASTALKING_SENDER_ID=INFINITY
 *
 * South African number format: +27XXXXXXXXX (e.g. +27681276038)
 */

import { db } from '@/lib/db';

const AT_API_KEY = process.env.AFRICASTALKING_API_KEY;
const AT_USERNAME = process.env.AFRICASTALKING_USERNAME;
const AT_SENDER_ID = process.env.AFRICASTALKING_SENDER_ID; // optional
const IS_CONFIGURED = !!(AT_API_KEY && AT_USERNAME);

// Africa's Talking endpoints
const AT_SMS_URL = 'https://api.africastalking.com/version1/messaging';
const AT_SANDBOX_SMS_URL = 'https://api.sandbox.africastalking.com/version1/messaging';

const IS_SANDBOX = (AT_USERNAME || '').toLowerCase() === 'sandbox';

export interface SendSmsParams {
  to: string;
  message: string;
  category?: string;
  userId?: string;
  recipientName?: string;
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  provider: 'africas_talking' | 'simulated';
  error?: string;
}

/**
 * Format a South African phone number to E.164 format without leading +
 * Africa's Talking expects the international format WITHOUT the leading +.
 * Accepts: 0681276038, 27681276038, +27681276038
 * Returns: 27681276038
 */
export function formatSaPhone(phone: string): string | null {
  if (!phone) return null;

  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // Remove leading +
  const hasPlus = cleaned.startsWith('+');
  if (hasPlus) cleaned = cleaned.slice(1);

  // SA local format: 0XXXXXXXXX → remove leading 0, add 27
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '27' + cleaned.slice(1);
  }

  // Already has country code: 27XXXXXXXXX
  if (cleaned.startsWith('27') && cleaned.length === 11) {
    return cleaned;
  }

  // Already in E.164 (just digits)
  if (cleaned.length >= 10 && cleaned.length <= 15) {
    return cleaned;
  }

  return null;
}

/**
 * Validate a phone number (basic check)
 */
export function isValidPhone(phone: string): boolean {
  return !!formatSaPhone(phone);
}

/**
 * Send an SMS via Africa's Talking API (or simulate if not configured)
 */
export async function sendSms(params: SendSmsParams): Promise<SmsResult> {
  const { to, message, category = 'custom', userId, recipientName } = params;

  const formattedPhone = formatSaPhone(to);
  if (!formattedPhone) {
    await logSmsCommunication({
      userId,
      recipientPhone: to,
      recipientName,
      category,
      content: message,
      status: 'failed',
      provider: 'africas_talking',
      errorMessage: 'Invalid phone number format',
    });
    return { success: false, provider: 'africas_talking', error: 'Invalid phone number format' };
  }

  if (IS_CONFIGURED) {
    try {
      const endpoint = IS_SANDBOX ? AT_SANDBOX_SMS_URL : AT_SMS_URL;

      const body = new URLSearchParams({
        username: AT_USERNAME!,
        to: formattedPhone,
        message,
      });

      // Sender ID is optional — only include if configured
      if (AT_SENDER_ID) {
        body.append('from', AT_SENDER_ID);
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          apiKey: AT_API_KEY!,
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: body.toString(),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[SMS] Africa\'s Talking API error:', data);
        await logSmsCommunication({
          userId,
          recipientPhone: formattedPhone,
          recipientName,
          category,
          content: message,
          status: 'failed',
          provider: 'africas_talking',
          errorMessage: data.error || data.message || `HTTP ${response.status}`,
        });
        return { success: false, provider: 'africas_talking', error: data.error || data.message || 'Failed to send SMS' };
      }

      // Africa's Talking returns SMSMessageData.recipients[] with status per recipient
      const recipients = data?.SMSMessageData?.recipients || [];
      const firstRecipient = recipients[0];
      const messageId = firstRecipient?.messageId || data?.SMSMessageData?.MessageId || `at_${Date.now()}`;
      const recipientStatus = (firstRecipient?.status || '').toLowerCase();

      // "Sent" means queued for delivery — actual delivery confirmation comes via webhook
      if (recipientStatus.includes('fail') || recipientStatus.includes('invalid') || recipientStatus.includes('reject')) {
        await logSmsCommunication({
          userId,
          recipientPhone: formattedPhone,
          recipientName,
          category,
          content: message,
          status: 'failed',
          provider: 'africas_talking',
          providerId: messageId,
          errorMessage: firstRecipient?.status || 'Recipient rejected',
        });
        return { success: false, provider: 'africas_talking', error: firstRecipient?.status || 'Recipient rejected' };
      }

      await logSmsCommunication({
        userId,
        recipientPhone: formattedPhone,
        recipientName,
        category,
        content: message,
        status: 'sent',
        provider: 'africas_talking',
        providerId: messageId,
      });

      return { success: true, messageId, provider: 'africas_talking' };
    } catch (error: any) {
      console.error('[SMS] Africa\'s Talking error:', error);
      await logSmsCommunication({
        userId,
        recipientPhone: formattedPhone,
        recipientName,
        category,
        content: message,
        status: 'failed',
        provider: 'africas_talking',
        errorMessage: error.message || 'Network error',
      });
      return { success: false, provider: 'africas_talking', error: error.message };
    }
  }

  // ---- Simulation Mode ----
  console.log(`[SMS/Simulated] To: ${formattedPhone} | Message: ${message.slice(0, 50)}...`);

  await logSmsCommunication({
    userId,
    recipientPhone: formattedPhone,
    recipientName,
    category,
    content: message,
    status: 'sent',
    provider: 'simulated',
    providerId: `sim_sms_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  });

  return { success: true, messageId: `sim_sms_${Date.now()}`, provider: 'simulated' };
}

/**
 * Log SMS communication to the database
 */
async function logSmsCommunication(params: {
  userId?: string;
  recipientPhone?: string;
  recipientName?: string;
  category: string;
  content: string;
  status: string;
  provider: string;
  providerId?: string;
  errorMessage?: string;
}) {
  try {
    await db.communicationLog.create({
      data: {
        user_id: params.userId,
        recipient_phone: params.recipientPhone,
        recipient_name: params.recipientName,
        channel: 'sms',
        category: params.category,
        content: params.content,
        status: params.status,
        provider: params.provider,
        provider_id: params.providerId,
        error_message: params.errorMessage,
        sent_at: params.status === 'sent' ? new Date() : undefined,
      },
    });
  } catch (error) {
    console.error('[SMS] Failed to log communication:', error);
  }
}

/**
 * Check if SMS service is properly configured
 */
export function isSmsConfigured(): boolean {
  return IS_CONFIGURED;
}

/**
 * Get SMS service status for the UI
 */
export function getSmsServiceStatus() {
  return {
    configured: IS_CONFIGURED,
    provider: IS_CONFIGURED ? "Africa's Talking" : 'Simulation',
    username: IS_CONFIGURED ? AT_USERNAME : 'Not configured',
    senderId: AT_SENDER_ID || 'Default (Africa\'s Talking shared)',
    environment: IS_SANDBOX ? 'Sandbox' : (IS_CONFIGURED ? 'Production' : '-'),
    message: IS_CONFIGURED
      ? `SMS service is active via Africa's Talking (${IS_SANDBOX ? 'sandbox' : 'production'}).`
      : "SMS service is in simulation mode. Add AFRICASTALKING_API_KEY and AFRICASTALKING_USERNAME to your .env to enable real sending.",
  };
}
