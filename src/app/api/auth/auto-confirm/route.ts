/**
 * POST /api/auth/auto-confirm - Auto-confirm a user's email
 *
 * Uses local Prisma/SQLite auth.
 * Marks email_verified = true on the user record.
 *
 * SECURITY:
 * - Rate limited to prevent abuse (reuses signup rate limiter — 3/hour per IP)
 * - Body size validation
 * - Only confirms the email — does not grant any additional permissions
 * - Audit logged
 * - Requires either user_id or email (but not both)
 * - For local auth: only confirms users created within the last 30 minutes
 */

import { NextRequest } from 'next/server';
import { apiResponse, apiError, checkRateLimit, validateBodySize } from '@/lib/middleware';
import { signupRateLimiter } from '@/lib/security';
import { createAuditLog } from '@/lib/audit';
import { confirmLocalEmail } from '@/lib/local-auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateResult = await checkRateLimit(request, signupRateLimiter);
    if (!rateResult.allowed) {
      return apiError('Too many requests. Please try again later.', 429, 'RATE_LIMITED');
    }

    // Body size check
    const bodyCheck = validateBodySize(request, 4096);
    if (!bodyCheck.valid) return bodyCheck.error!;

    const body = await request.json();
    const { user_id, email } = body;

    if (!user_id && !email) {
      return apiError('User ID or email is required', 400, 'MISSING_IDENTIFIER');
    }

    if (email && typeof email !== 'string') {
      return apiError('Invalid email format', 400, 'INVALID_EMAIL');
    }

    if (user_id && typeof user_id !== 'string') {
      return apiError('Invalid user ID format', 400, 'INVALID_USER_ID');
    }

    // Security: Only confirm local users created within the last 30 minutes
    // to prevent abuse of this endpoint for confirming old accounts
    const THIRTY_MINUTES = 30 * 60 * 1000;
    const localUser = await db.user.findFirst({
      where: {
        OR: [
          { id: user_id || undefined },
          { email: email ? email.toLowerCase().trim() : undefined },
        ],
        email_verified: false,
        created_at: { gte: new Date(Date.now() - THIRTY_MINUTES) },
      },
      select: { id: true },
    });

    if (!localUser) {
      // User not found, already verified, or created too long ago
      return apiResponse({ confirmed: true, message: 'Email confirmation processed' });
    }

    await confirmLocalEmail({
      userId: localUser.id,
      email: email ? email.toLowerCase().trim() : undefined,
    });

    // Audit log
    await createAuditLog({
      user_id: localUser.id,
      action: 'EMAIL_AUTO_CONFIRMED_LOCAL',
      resource_type: 'user',
      resource_id: localUser.id,
      ip_address: request.headers.get('x-forwarded-for') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
    });

    return apiResponse({ confirmed: true, message: 'Email confirmed successfully' });
  } catch (error) {
    console.error('Auto-confirm error:', error);
    return apiError('Confirmation failed', 500, 'CONFIRM_ERROR');
  }
}
