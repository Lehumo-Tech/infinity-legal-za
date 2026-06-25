/**
 * SMS Service — Twilio + Simulation Fallback
 *
 * Sends SMS messages via Twilio API.
 * When TWILIO credentials are not configured, operates in simulation mode.
 *
 * Setup:
 * 1. Create a Twilio account at https://www.twilio.com
 * 2. Get your Account SID, Auth Token, and a phone number
 * 3. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER to .env
 *
 * For South African numbers, use format: +27XXXXXXXXX
 */

import { db } from '@/lib/db';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const IS_CONFIGURED = !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER);

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
  provider: 'twilio' | 'simulated';
  error?: string;
}

/**
 * Format a South African phone number to E.164 format
 * Accepts: 0681276038, 27681276038, +27681276038
 * Returns: +27681276038
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
    return '+' + cleaned;
  }

  // Already in E.164
  if (cleaned.length >= 10 && cleaned.length <= 15) {
    return '+' + cleaned;
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
 * Send an SMS via Twilio API (or simulate if not configured)
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
      provider: 'twilio',
      errorMessage: 'Invalid phone number format',
    });
    return { success: false, provider: 'twilio', error: 'Invalid phone number format' };
  }

  if (IS_CONFIGURED) {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

      const body = new URLSearchParams({
        To: formattedPhone,
        From: TWILIO_PHONE_NUMBER!,
        Body: message,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[SMS] Twilio API error:', data);
        await logSmsCommunication({
          userId,
          recipientPhone: formattedPhone,
          recipientName,
          category,
          content: message,
          status: 'failed',
          provider: 'twilio',
          errorMessage: data.message || 'Twilio API error',
        });
        return { success: false, provider: 'twilio', error: data.message || 'Failed to send SMS' };
      }

      await logSmsCommunication({
        userId,
        recipientPhone: formattedPhone,
        recipientName,
        category,
        content: message,
        status: 'sent',
        provider: 'twilio',
        providerId: data.sid,
      });

      return { success: true, messageId: data.sid, provider: 'twilio' };
    } catch (error: any) {
      console.error('[SMS] Twilio error:', error);
      await logSmsCommunication({
        userId,
        recipientPhone: formattedPhone,
        recipientName,
        category,
        content: message,
        status: 'failed',
        provider: 'twilio',
        errorMessage: error.message || 'Network error',
      });
      return { success: false, provider: 'twilio', error: error.message };
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
    provider: IS_CONFIGURED ? 'Twilio' : 'Simulation',
    phoneNumber: IS_CONFIGURED ? TWILIO_PHONE_NUMBER : 'Not configured',
    message: IS_CONFIGURED
      ? 'SMS service is active and ready to send.'
      : 'SMS service is in simulation mode. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to your .env to enable real sending.',
  };
}
