/**
 * POST /api/contact - Handle contact form submissions
 * Saves to crm_contact_messages table and logs POPIA consent via Supabase
 */

import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/api-client';
import { sanitizeString, isValidEmail, contactRateLimiter } from '@/lib/security';
import { apiResponse, apiError, checkRateLimit } from '@/lib/middleware';
import { createAuditLog, logConsent } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const db = getAdminClient();
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    const rateResult = await checkRateLimit(request, contactRateLimiter);
    if (!rateResult.allowed) {
      return apiError('Too many requests. Please try again later.', 429, 'RATE_LIMITED');
    }

    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    if (!name || !email || !message) {
      return apiError('Name, email, and message are required', 400, 'MISSING_FIELDS');
    }

    if (!isValidEmail(email)) {
      return apiError('Invalid email format', 400, 'INVALID_EMAIL');
    }

    if (message.length > 5000) {
      return apiError('Message too long (max 5000 characters)', 400, 'MESSAGE_TOO_LONG');
    }

    // Create a CRM contact message — this table has name, email, phone, subject, message columns
    const { data: contactMessage, error: insertError } = await db
      .from('crm_contact_messages')
      .insert({
        name: sanitizeString(name),
        email: email.toLowerCase().trim(),
        phone: phone ? sanitizeString(phone) : null,
        subject: subject ? sanitizeString(subject) : 'Contact Form Inquiry',
        message: sanitizeString(message),
        status: 'unread',
        metadata: {
          source: 'contact_form',
          submitted_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (insertError || !contactMessage) {
      console.error('Contact form insert error:', insertError);
      return apiError('Failed to submit message', 500, 'CONTACT_ERROR');
    }

    // Log POPIA consent for the contact form
    await logConsent({
      consent_type: 'data_processing',
      granted: true,
      ip_address: request.headers.get('x-forwarded-for') || undefined,
    });

    await createAuditLog({
      action: 'CONTACT_FORM_SUBMISSION',
      resource_type: 'contact_message',
      resource_id: contactMessage.id,
      ip_address: request.headers.get('x-forwarded-for') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
    });

    return apiResponse({
      message: 'Your message has been received. Our team will get back to you shortly.',
      id: contactMessage.id,
    }, 201);
  } catch (error) {
    console.error('Contact form error:', error);
    return apiError('Failed to submit message', 500, 'CONTACT_ERROR');
  }
}
