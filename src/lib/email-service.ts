/**
 * Email Service — SMTP (Nodemailer) + Resend API + Simulation Fallback
 *
 * Priority:
 * 1. SMTP (if SMTP_HOST is configured) — Works with any provider: Gmail, Outlook, AWS SES, Mailgun, etc.
 * 2. Resend API (if RESEND_API_KEY is configured) — Fast, modern email API
 * 3. Simulation (fallback) — Logs emails to DB for UI testing without any provider
 *
 * SMTP Setup (Recommended for production):
 * 1. Set SMTP_HOST (e.g., smtp.gmail.com, smtp.office365.com, email-smtp.af-south-1.amazonaws.com)
 * 2. Set SMTP_PORT (587 for TLS, 465 for SSL, 25 for unencrypted)
 * 3. Set SMTP_USER (your email address or API key)
 * 4. Set SMTP_PASS (your password or app-specific password)
 * 5. Set EMAIL_FROM (e.g., "Infinity Legal SA <info@infinitylegal.org>")
 * 6. Optionally set SMTP_SECURE=true for port 465
 *
 * Gmail Example:
 *   SMTP_HOST=smtp.gmail.com
 *   SMTP_PORT=587
 *   SMTP_USER=you@gmail.com
 *   SMTP_PASS=your-app-password
 *   EMAIL_FROM="Infinity Legal SA <you@gmail.com>"
 *
 * Resend Setup:
 *   RESEND_API_KEY=re_xxxxxxxx
 *   EMAIL_FROM="Infinity Legal SA <onboarding@resend.dev>"
 */

import nodemailer from 'nodemailer';
import { db } from '@/lib/db';

// ============================================
// CONFIGURATION
// ============================================

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_SECURE = process.env.SMTP_SECURE === 'true'; // true for port 465
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM || 'Infinity Legal SA <onboarding@resend.dev>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://infinitylegal.org';

const IS_SMTP_CONFIGURED = !!(SMTP_HOST && SMTP_USER && SMTP_PASS);
const IS_RESEND_CONFIGURED = !!RESEND_API_KEY;
const IS_CONFIGURED = IS_SMTP_CONFIGURED || IS_RESEND_CONFIGURED;

// Determine active provider
function getActiveProvider(): 'smtp' | 'resend' | 'simulated' {
  if (IS_SMTP_CONFIGURED) return 'smtp';
  if (IS_RESEND_CONFIGURED) return 'resend';
  return 'simulated';
}

// ============================================
// SMTP TRANSPORT (lazy singleton)
// ============================================

let transporter: nodemailer.Transporter | null = null;

function getSmtpTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    // Connection timeout settings
    connectionTimeout: 10000, // 10s
    greetingTimeout: 10000,
    socketTimeout: 30000, // 30s
  });

  return transporter;
}

// ============================================
// TYPES
// ============================================

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
  provider: 'smtp' | 'resend' | 'simulated';
  error?: string;
}

// ============================================
// SEND EMAIL
// ============================================

export async function sendEmail(params: SendEmailParams): Promise<EmailResult> {
  const { to, subject, html, text, replyTo, category = 'custom', userId, recipientName } = params;
  const recipients = Array.isArray(to) ? to : [to];

  // ---- STRATEGY 1: SMTP (Nodemailer) ----
  if (IS_SMTP_CONFIGURED) {
    try {
      const transport = getSmtpTransporter();

      const result = await transport.sendMail({
        from: FROM_EMAIL,
        to: recipients.join(', '),
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
        replyTo: replyTo || undefined,
      });

      const messageId = result.messageId || `smtp_${Date.now()}`;

      await logCommunication({
        userId,
        recipientEmail: recipients[0],
        recipientName,
        channel: 'email',
        category,
        subject,
        content: html,
        status: 'sent',
        provider: 'smtp',
        providerId: messageId,
      });

      console.log(`[Email/SMTP] Sent to ${recipients.join(', ')} | Subject: ${subject}`);
      return { success: true, messageId, provider: 'smtp' };
    } catch (error: any) {
      console.error('[Email/SMTP] Error:', error.message);
      await logCommunication({
        userId,
        recipientEmail: recipients[0],
        recipientName,
        channel: 'email',
        category,
        subject,
        content: html,
        status: 'failed',
        provider: 'smtp',
        errorMessage: error.message || 'SMTP connection error',
      });

      // If SMTP fails, try Resend as fallback
      if (IS_RESEND_CONFIGURED) {
        console.log('[Email] Falling back to Resend API...');
        return sendViaResend(params);
      }

      return { success: false, provider: 'smtp', error: error.message };
    }
  }

  // ---- STRATEGY 2: Resend API ----
  if (IS_RESEND_CONFIGURED) {
    return sendViaResend(params);
  }

  // ---- STRATEGY 3: Simulation Mode ----
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

// ============================================
// RESEND API HELPER
// ============================================

async function sendViaResend(params: SendEmailParams): Promise<EmailResult> {
  const { to, subject, html, text, replyTo, category = 'custom', userId, recipientName } = params;
  const recipients = Array.isArray(to) ? to : [to];

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
      console.error('[Email/Resend] API error:', data);
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
    console.error('[Email/Resend] Error:', error.message);
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

// ============================================
// SMTP VERIFICATION
// ============================================

/**
 * Verify SMTP connection works
 */
export async function verifySmtpConnection(): Promise<{ success: boolean; error?: string }> {
  if (!IS_SMTP_CONFIGURED) {
    return { success: false, error: 'SMTP not configured' };
  }

  try {
    const transport = getSmtpTransporter();
    await transport.verify();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================
// LOGGING HELPER
// ============================================

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
        content: typeof params.content === 'string' ? params.content : JSON.stringify(params.content),
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

// ============================================
// STATUS HELPERS
// ============================================

export function isEmailConfigured(): boolean {
  return IS_CONFIGURED;
}

export function getEmailServiceStatus() {
  const activeProvider = getActiveProvider();

  const providerDetails: Record<string, { label: string; setup: string }> = {
    smtp: {
      label: `SMTP (${SMTP_HOST}:${SMTP_PORT})`,
      setup: `Connected to ${SMTP_HOST} as ${SMTP_USER}`,
    },
    resend: {
      label: 'Resend API',
      setup: 'API key configured',
    },
    simulated: {
      label: 'Simulation Mode',
      setup: 'No email provider configured — emails are logged but not actually sent',
    },
  };

  const details = providerDetails[activeProvider];

  return {
    configured: IS_CONFIGURED,
    activeProvider,
    providerLabel: details.label,
    fromEmail: FROM_EMAIL,
    smtpConfigured: IS_SMTP_CONFIGURED,
    resendConfigured: IS_RESEND_CONFIGURED,
    smtpHost: IS_SMTP_CONFIGURED ? SMTP_HOST : null,
    smtpPort: IS_SMTP_CONFIGURED ? SMTP_PORT : null,
    smtpUser: IS_SMTP_CONFIGURED ? SMTP_USER : null,
    message: IS_CONFIGURED
      ? `Email service is active via ${details.label}. ${details.setup}.`
      : 'Email service is in simulation mode. Configure SMTP or Resend to send real emails.',
    setupInstructions: {
      smtp: 'Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and EMAIL_FROM in your .env file.',
      resend: 'Set RESEND_API_KEY and EMAIL_FROM in your .env file. Get a key at https://resend.com',
      gmail: 'For Gmail: SMTP_HOST=smtp.gmail.com, SMTP_PORT=587, SMTP_USER=you@gmail.com, SMTP_PASS=your-app-password. Enable 2FA and create an App Password.',
    },
  };
}
