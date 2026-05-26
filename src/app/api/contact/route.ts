/**
 * POST /api/contact - Handle contact form submissions
 * Saves to IntakeSubmission table and logs POPIA consent
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { sanitizeString, isValidEmail, apiRateLimiter } from '@/lib/security';
import { apiResponse, apiError, checkRateLimit } from '@/lib/middleware';
import { createAuditLog, logConsent } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const rateResult = checkRateLimit(request, apiRateLimiter);
    if (!rateResult.allowed) {
      return apiError('Too many requests. Please try again later.', 429, 'RATE_LIMITED');
    }

    const body = await request.json();
    const { name, email, phone, message } = body;

    if (!name || !email || !message) {
      return apiError('Name, email, and message are required', 400, 'MISSING_FIELDS');
    }

    if (!isValidEmail(email)) {
      return apiError('Invalid email format', 400, 'INVALID_EMAIL');
    }

    if (message.length > 5000) {
      return apiError('Message too long (max 5000 characters)', 400, 'MESSAGE_TOO_LONG');
    }

    // Create an intake submission as a contact inquiry
    const referenceId = `IL-CONTACT-${Date.now().toString(36).toUpperCase()}`;

    await db.intakeSubmission.create({
      data: {
        reference_id: referenceId,
        full_name: sanitizeString(name),
        email: email.toLowerCase().trim(),
        phone: phone ? sanitizeString(phone) : null,
        case_type: 'other',
        description: sanitizeString(message),
        consent_given: true,
        popia_consent: true,
        status: 'submitted',
      },
    });

    // Log POPIA consent for the contact form
    await logConsent({
      consent_type: 'data_processing',
      purpose: 'Contact form submission - general inquiry',
      granted: true,
      ip_address: request.headers.get('x-forwarded-for') || undefined,
    });

    await createAuditLog({
      action: 'CONTACT_FORM_SUBMISSION',
      resource_type: 'intake_submission',
      resource_id: referenceId,
      ip_address: request.headers.get('x-forwarded-for') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
    });

    return apiResponse({
      message: 'Your message has been received. Our team will get back to you shortly.',
      reference_id: referenceId,
    }, 201);
  } catch (error) {
    console.error('Contact form error:', error);
    return apiError('Failed to submit message', 500, 'CONTACT_ERROR');
  }
}
