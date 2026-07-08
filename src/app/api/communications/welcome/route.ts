/**
 * POST /api/communications/welcome - Send welcome email + SMS to a new user
 *
 * Called automatically after signup.
 * Body: { userId, email, fullName, phone? }
 */

import { NextRequest } from 'next/server';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';
import { sendEmail } from '@/lib/email-service';
import { sendSms, formatSaPhone } from '@/lib/sms-service';
import { renderEmailTemplate, renderSmsTemplate } from '@/lib/communication-templates';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    // Sending welcome comms is an admin-only action
    if (!['managing_director', 'systems_admin', 'admin'].includes(auth.user.role)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const body = await request.json();
    const { userId, email, fullName, phone } = body;

    if (!userId || !email || !fullName) {
      return apiError('userId, email, and fullName are required', 400, 'MISSING_FIELDS');
    }

    const templateVars = {
      full_name: fullName,
      first_name: fullName.split(' ')[0],
      email,
      phone: phone || '',
    };

    // Send welcome email (always)
    const emailRendered = renderEmailTemplate('welcome', templateVars);
    if (emailRendered) {
      const emailResult = await sendEmail({
        to: email,
        subject: emailRendered.subject,
        html: emailRendered.html,
        text: emailRendered.text,
        category: 'welcome',
        userId,
        recipientName: fullName,
      });

      console.log(`[Welcome] Email ${emailResult.success ? 'sent' : 'failed'} to ${email} via ${emailResult.provider}`);
    }

    // Send welcome SMS (if phone provided)
    if (phone && formatSaPhone(phone)) {
      const smsText = renderSmsTemplate('welcome', templateVars);
      if (smsText) {
        const smsResult = await sendSms({
          to: phone,
          message: smsText,
          category: 'welcome',
          userId,
          recipientName: fullName,
        });

        console.log(`[Welcome] SMS ${smsResult.success ? 'sent' : 'failed'} to ${phone} via ${smsResult.provider}`);
      }
    }

    return apiResponse({
      message: 'Welcome communications dispatched',
      emailSent: true,
      smsSent: !!(phone && formatSaPhone(phone)),
    });
  } catch (error) {
    console.error('[Communications/Welcome] Error:', error);
    // Don't fail signup if welcome message fails
    return apiResponse({
      message: 'Welcome communications attempted (may have partial failures)',
      emailSent: false,
      smsSent: false,
    });
  }
}
