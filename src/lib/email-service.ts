/**
 * Email Service — Resend + Simulation Fallback
 *
 * Sends transactional emails via Resend API.
 * When RESEND_API_KEY is not configured, operates in simulation mode:
 * - Logs the email to CommunicationLog with status "sent" and provider "simulated"
 * - This allows full UI testing without a Resend account
 *
 * Setup:
 * 1. Create a free account at https://resend.com
 * 2. Add RESEND_API_KEY to your .env file
 * 3. Verify your sending domain (or use onboarding@resend.dev for testing)
 */

import { db } from '@/lib/db';

// Email configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM || 'Infinity Legal SA <onboarding@resend.dev>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://infinitylegal.org';
const IS_CONFIGURED = !!RESEND_API_KEY;

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  category?: string;
  userId?: string;
  recipientName?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  provider: 'resend' | 'simulated';
  error?: string;
}

/**
 * Send an email via Resend API (or simulate if not configured)
 */
export async function sendEmail(params: SendEmailParams): Promise<EmailResult> {
  const { to, subject, html, text, replyTo, category = 'custom', userId, recipientName } = params;
  const recipients = Array.isArray(to) ? to : [to];

  if (IS_CONFIGURED) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: recipients,
          subject,
          html,
          text: text || html.replace(/<[^>]*>/g, ''),
          reply_to: replyTo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[Email] Resend API error:', data);
        // Log the failed attempt
        await logCommunication({
          userId,
          recipientEmail: recipients[0],
          recipientName,
          channel: 'email',
          category,
          subject,
          content: html,
          status: 'failed',
          provider: 'resend',
          errorMessage: data.message || 'Resend API error',
        });
        return { success: false, provider: 'resend', error: data.message || 'Failed to send email' };
      }

      // Log successful send
      await logCommunication({
        userId,
        recipientEmail: recipients[0],
        recipientName,
        channel: 'email',
        category,
        subject,
        content: html,
        status: 'sent',
        provider: 'resend',
        providerId: data.id,
      });

      return { success: true, messageId: data.id, provider: 'resend' };
    } catch (error: any) {
      console.error('[Email] Resend error:', error);
      await logCommunication({
        userId,
        recipientEmail: recipients[0],
        recipientName,
        channel: 'email',
        category,
        subject,
        content: html,
        status: 'failed',
        provider: 'resend',
        errorMessage: error.message || 'Network error',
      });
      return { success: false, provider: 'resend', error: error.message };
    }
  }

  // ---- Simulation Mode ----
  console.log(`[Email/Simulated] To: ${recipients.join(', ')} | Subject: ${subject}`);

  await logCommunication({
    userId,
    recipientEmail: recipients[0],
    recipientName,
    channel: 'email',
    category,
    subject,
    content: html,
    status: 'sent',
    provider: 'simulated',
    providerId: `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  });

  return { success: true, messageId: `sim_${Date.now()}`, provider: 'simulated' };
}

/**
 * Log a communication to the database
 */
async function logCommunication(params: {
  userId?: string;
  recipientEmail?: string;
  recipientName?: string;
  channel: string;
  category: string;
  subject?: string;
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
        recipient_email: params.recipientEmail,
        recipient_name: params.recipientName,
        channel: params.channel,
        category: params.category,
        subject: params.subject,
        content: params.content,
        status: params.status,
        provider: params.provider,
        provider_id: params.providerId,
        error_message: params.errorMessage,
        sent_at: params.status === 'sent' ? new Date() : undefined,
      },
    });
  } catch (error) {
    console.error('[Email] Failed to log communication:', error);
  }
}

/**
 * Check if email service is properly configured
 */
export function isEmailConfigured(): boolean {
  return IS_CONFIGURED;
}

/**
 * Get email service status for the UI
 */
export function getEmailServiceStatus() {
  return {
    configured: IS_CONFIGURED,
    provider: IS_CONFIGURED ? 'Resend' : 'Simulation',
    fromEmail: FROM_EMAIL,
    message: IS_CONFIGURED
      ? 'Email service is active and ready to send.'
      : 'Email service is in simulation mode. Add RESEND_API_KEY to your .env to enable real sending.',
  };
}
