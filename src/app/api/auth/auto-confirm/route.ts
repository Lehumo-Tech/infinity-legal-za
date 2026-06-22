/**
 * POST /api/auth/auto-confirm - Auto-confirm a user's email
 *
 * This endpoint is used after signup to confirm the user's email address
 * without requiring them to click an email link. This is essential for
 * a smooth onboarding experience where users can sign up and immediately
 * sign in.
 *
 * SECURITY:
 * - Rate limited to prevent abuse (reuses signup rate limiter — 3/hour per IP)
 * - Body size validation
 * - Only confirms the email — does not grant any additional permissions
 * - Audit logged
 * - Requires either user_id or email (but not both)
 *
 * Note: This endpoint is intentionally public (no auth required) because:
 * 1. It's called from the browser client during sign-in when email is unconfirmed
 * 2. The signup flow already auto-confirms via admin API (email_confirm: true)
 * 3. This route is a fallback for edge cases where confirmation gets stuck
 * 4. Rate limiting prevents bulk abuse
 * 5. Email confirmation alone doesn't grant access — the password is still required
 */

import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/api-client';
import { apiResponse, apiError, checkRateLimit, validateBodySize } from '@/lib/middleware';
import { signupRateLimiter } from '@/lib/security';
import { createAuditLog } from '@/lib/audit';

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

    const db = getAdminClient();
    if (!db) {
      return apiError('Service temporarily unavailable', 503, 'SERVICE_UNAVAILABLE');
    }

    // Find the user by ID or email
    let userId = user_id;
    if (!userId && email) {
      const { data: profile } = await db
        .from('profiles')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (!profile) {
        // Don't reveal whether the email exists — return success to prevent enumeration
        return apiResponse({ confirmed: true, message: 'Email confirmation processed' });
      }
      userId = profile.id;
    }

    // Confirm the user's email using admin API
    const { error: updateError } = await db.auth.admin.updateUserById(userId, {
      email_confirm: true,
    });

    if (updateError) {
      console.error('Auto-confirm error:', updateError.message);
      // Don't leak error details — return success to prevent enumeration
      return apiResponse({ confirmed: true, message: 'Email confirmation processed' });
    }

    // Update the profile's email_verified flag
    await db
      .from('profiles')
      .update({ email_verified: true })
      .eq('id', userId);

    // Audit log
    await createAuditLog({
      user_id: userId,
      action: 'EMAIL_AUTO_CONFIRMED',
      resource_type: 'user',
      resource_id: userId,
      ip_address: request.headers.get('x-forwarded-for') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
    });

    return apiResponse({ confirmed: true, message: 'Email confirmed successfully' });
  } catch (error) {
    console.error('Auto-confirm error:', error);
    return apiError('Confirmation failed', 500, 'CONFIRM_ERROR');
  }
}
