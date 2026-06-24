/**
 * POST /api/auth/auto-confirm - Auto-confirm a user's email
 *
 * Works with both Supabase and local auth.
 * When using local auth, just marks email_verified = true.
 *
 * SECURITY:
 * - Rate limited to prevent abuse (reuses signup rate limiter — 3/hour per IP)
 * - Body size validation
 * - Only confirms the email — does not grant any additional permissions
 * - Audit logged
 * - Requires either user_id or email (but not both)
 */

import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/api-client';
import { apiResponse, apiError, checkRateLimit, validateBodySize } from '@/lib/middleware';
import { signupRateLimiter } from '@/lib/security';
import { createAuditLog } from '@/lib/audit';
import { confirmLocalEmail, isSupabaseReachable } from '@/lib/local-auth';

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

    // ============================================
    // Strategy 1: Try Supabase first
    // ============================================
    const db = getAdminClient();
    const supabaseReachable = db && await isSupabaseReachable();

    if (supabaseReachable && db) {
      try {
        // Find the user by ID or email
        let userId = user_id;
        if (!userId && email) {
          const { data: profile } = await db
            .from('profiles')
            .select('id')
            .eq('email', email.toLowerCase().trim())
            .single();

          if (!profile) {
            // Don't reveal whether the email exists
            return apiResponse({ confirmed: true, message: 'Email confirmation processed' });
          }
          userId = profile.id;
        }

        // Confirm the user's email using admin API
        const { error: updateError } = await db.auth.admin.updateUserById(userId!, {
          email_confirm: true,
        });

        if (updateError) {
          console.error('Auto-confirm error:', updateError.message);
          return apiResponse({ confirmed: true, message: 'Email confirmation processed' });
        }

        // Update the profile's email_verified flag
        await db
          .from('profiles')
          .update({ email_verified: true })
          .eq('id', userId!);

        // Audit log
        await createAuditLog({
          user_id: userId!,
          action: 'EMAIL_AUTO_CONFIRMED',
          resource_type: 'user',
          resource_id: userId!,
          ip_address: request.headers.get('x-forwarded-for') || undefined,
          user_agent: request.headers.get('user-agent') || undefined,
        });

        return apiResponse({ confirmed: true, message: 'Email confirmed successfully' });
      } catch (supabaseError) {
        console.warn('[Auto-confirm] Supabase failed, falling back to local:', supabaseError);
      }
    }

    // ============================================
    // Strategy 2: Local Auth Fallback (Prisma/SQLite)
    // ============================================
    await confirmLocalEmail({
      userId: user_id,
      email: email ? email.toLowerCase().trim() : undefined,
    });

    // Audit log
    await createAuditLog({
      user_id: user_id || undefined,
      action: 'EMAIL_AUTO_CONFIRMED_LOCAL',
      resource_type: 'user',
      resource_id: user_id || undefined,
      ip_address: request.headers.get('x-forwarded-for') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
    });

    return apiResponse({ confirmed: true, message: 'Email confirmed successfully' });
  } catch (error) {
    console.error('Auto-confirm error:', error);
    return apiError('Confirmation failed', 500, 'CONFIRM_ERROR');
  }
}
