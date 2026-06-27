/**
 * GET /api/communications/templates - Get all email/SMS templates
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiResponse, apiError } from '@/lib/middleware';
import { EMAIL_TEMPLATES, SMS_TEMPLATES } from '@/lib/communication-templates';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel') || undefined;

    // Get DB templates
    const where: any = { is_active: true };
    if (channel) where.channel = channel;

    const dbTemplates = await db.emailTemplate.findMany({
      where,
      orderBy: [{ is_system: 'desc' }, { category: 'asc' }, { name: 'asc' }],
    });

    // Also include built-in templates info
    const builtInEmail = Object.keys(EMAIL_TEMPLATES).map(key => ({
      name: key,
      channel: 'email',
      category: (EMAIL_TEMPLATES as any)[key].category,
      isBuiltIn: true,
    }));

    const builtInSms = Object.keys(SMS_TEMPLATES).map(key => ({
      name: key,
      channel: 'sms',
      category: (SMS_TEMPLATES as any)[key].category,
      isBuiltIn: true,
    }));

    return apiResponse({
      templates: dbTemplates,
      builtIn: {
        email: builtInEmail,
        sms: builtInSms,
      },
    });
  } catch (error) {
    console.error('[Communications/Templates] Error:', error);
    return apiError('Failed to fetch templates', 500, 'FETCH_ERROR');
  }
}
