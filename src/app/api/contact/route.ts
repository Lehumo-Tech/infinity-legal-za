/**
 * POST /api/contact - Handle contact form submissions
 *
 * Stores the message as a CommunicationLog record (channel=email, category=custom)
 * since there's no dedicated crm_contact_messages table in the Prisma schema.
 * Logs POPIA consent.
 */

import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { sanitizeString, isValidEmail, contactRateLimiter } from '@/lib/security';
import { apiResponse, apiError, checkRateLimit } from '@/lib/middleware';
import { createAuditLog, logConsent } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const rateResult = await checkRateLimit(request, contactRateLimiter);
    if (!rateResult.allowed) {
      return apiError('Too many requests. Please try again later.', 429, 'RATE_LIMITED');
    }

    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    if (!name || !email || !message) {
      return apiError('Name, email, and message are required', 400, 'MISSING_FIELDS');
    }

    if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
      return apiError('Invalid input format', 400, 'INVALID_FORMAT');
    }

    if (!isValidEmail(email)) {
      return apiError('Invalid email format', 400, 'INVALID_EMAIL');
    }

    if (message.length > 5000) {
      return apiError('Message too long (max 5000 characters)', 400, 'MESSAGE_TOO_LONG');
    }

    const ipAddress = request.headers.get('x-forwarded-for') || null;
    const userAgent = request.headers.get('user-agent') || null;

    // Store the contact message as a CommunicationLog record
    const contactMessage = await db.communicationLog.create({
      data: {
        recipient_email: email.toLowerCase().trim(),
        recipient_name: sanitizeString(name),
        recipient_phone: phone ? sanitizeString(phone) : null,
        channel: 'email',
        category: 'custom',
        subject: subject ? sanitizeString(subject) : 'Contact Form Inquiry',
        content: sanitizeString(message),
        status: 'pending',
        provider: 'contact_form',
        metadata: {
          source: 'contact_form',
          submitted_at: new Date().toISOString(),
          ip_address: ipAddress,
        } as Prisma.InputJsonValue,
      },
    });

    // Log POPIA consent for the contact form
    await logConsent({
      consent_type: 'data_processing',
      granted: true,
      ip_address: ipAddress || undefined,
    });

    await createAuditLog({
      action: 'CONTACT_FORM_SUBMISSION',
      resource_type: 'contact_message',
      resource_id: contactMessage.id,
      ip_address: ipAddress || undefined,
      user_agent: userAgent || undefined,
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
