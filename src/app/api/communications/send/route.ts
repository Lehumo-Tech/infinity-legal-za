/**
 * POST /api/communications/send - Send an email or SMS
 *
 * Body:
 *   channel: 'email' | 'sms'
 *   template?: string (template name to use)
 *   to: string (email or phone)
 *   subject?: string (email only)
 *   body?: string (custom content, if no template)
 *   variables?: Record<string, string> (for template interpolation)
 *   category?: string
 *   userId?: string
 *   recipientName?: string
 */

import { NextRequest } from 'next/server';
import { apiResponse, apiError, checkRateLimit, validateBodySize, validateCSRF } from '@/lib/middleware';
import { sendEmail, isEmailConfigured } from '@/lib/email-service';
import { sendSms, isSmsConfigured, formatSaPhone } from '@/lib/sms-service';
import { renderEmailTemplate, renderSmsTemplate } from '@/lib/communication-templates';
import { communicationsRateLimiter } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const csrf = validateCSRF(request);
    if (!csrf.valid) return csrf.error!;

    const body = await request.json();
    const { channel, template, to, subject, body: content, variables = {}, category, userId, recipientName } = body;

    if (!channel || !to) {
      return apiError('Channel and recipient (to) are required', 400, 'MISSING_FIELDS');
    }

    if (channel !== 'email' && channel !== 'sms') {
      return apiError('Channel must be "email" or "sms"', 400, 'INVALID_CHANNEL');
    }

    if (channel === 'email') {
      // ---- SEND EMAIL ----
      let emailSubject = subject || 'Message from Infinity Legal SA';
      let emailHtml = content || '';
      let emailText = content || '';

      if (template) {
        const rendered = renderEmailTemplate(template, variables);
        if (rendered) {
          emailSubject = rendered.subject;
          emailHtml = rendered.html;
          emailText = rendered.text;
        } else {
          return apiError(`Template "${template}" not found`, 400, 'TEMPLATE_NOT_FOUND');
        }
      } else if (!content) {
        return apiError('Either template or body content is required', 400, 'MISSING_CONTENT');
      }

      const result = await sendEmail({
        to,
        subject: emailSubject,
        html: emailHtml,
        text: emailText,
        category: category || (template || 'custom'),
        userId,
        recipientName,
      });

      if (!result.success) {
        return apiError(`Failed to send email: ${result.error}`, 500, 'EMAIL_SEND_FAILED');
      }

      return apiResponse({
        message: isEmailConfigured() ? 'Email sent successfully' : 'Email simulated (configure RESEND_API_KEY for real sending)',
        channel: 'email',
        messageId: result.messageId,
        provider: result.provider,
      });
    } else {
      // ---- SEND SMS ----
      let smsMessage = content || '';

      if (template) {
        const rendered = renderSmsTemplate(template, variables);
        if (rendered) {
          smsMessage = rendered;
        } else {
          return apiError(`SMS template "${template}" not found`, 400, 'TEMPLATE_NOT_FOUND');
        }
      } else if (!content) {
        return apiError('Either template or body content is required', 400, 'MISSING_CONTENT');
      }

      // Validate phone number
      const formatted = formatSaPhone(to);
      if (!formatted) {
        return apiError('Invalid phone number format. Use SA format: 0681234567 or +27681234567', 400, 'INVALID_PHONE');
      }

      const result = await sendSms({
        to,
        message: smsMessage,
        category: category || (template || 'custom'),
        userId,
        recipientName,
      });

      if (!result.success) {
        return apiError(`Failed to send SMS: ${result.error}`, 500, 'SMS_SEND_FAILED');
      }

      return apiResponse({
        message: isSmsConfigured() ? 'SMS sent successfully' : 'SMS simulated (configure Twilio for real sending)',
        channel: 'sms',
        messageId: result.messageId,
        provider: result.provider,
      });
    }
  } catch (error) {
    console.error('[Communications/Send] Error:', error);
    return apiError('Failed to send communication', 500, 'SEND_ERROR');
  }
}
