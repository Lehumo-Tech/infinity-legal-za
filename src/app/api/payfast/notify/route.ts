/**
 * Infinity Legal ZA - PayFast ITN (Instant Transaction Notification) Webhook
 * POST /api/payfast/notify
 *
 * This endpoint receives server-to-server POST notifications from PayFast
 * when a payment completes, fails, or is pending.
 *
 * IMPORTANT: This endpoint does NOT require authentication as PayFast
 * calls it server-to-server without a JWT token.
 *
 * payment_records schema: id, subscription_id, case_id, user_id, amount, currency,
 *   status (pending/completed/failed/refunded/partially_refunded),
 *   payfast_payment_id, payfast_token, payment_method, description, metadata (JSONB),
 *   paid_at, created_at
 * No columns: m_payment_id, payment_status, amount_gross, amount_fee, amount_net, pf_payment_id, payfast_data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/api-client';
import { verifyITN, isValidPayFastIP, type PayFastITNData } from '@/lib/payfast';
import { apiError } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const db = getAdminClient();
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    // Parse the form-encoded body from PayFast
    const formData = await request.formData();
    const itnData: Record<string, string> = {};

    for (const [key, value] of formData.entries()) {
      itnData[key] = String(value);
    }

    console.log('PayFast ITN received:', JSON.stringify(itnData, null, 2));

    // SECURITY: Validate that the request comes from PayFast's servers
    const requestIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null;
    if (!isValidPayFastIP(requestIp)) {
      console.error('PayFast ITN: Invalid source IP:', requestIp);
      return new NextResponse('FORBIDDEN', { status: 403 });
    }

    // Extract key fields
    const mPaymentId = itnData.m_payment_id;
    const pfPaymentId = itnData.pf_payment_id;
    const paymentStatus = itnData.payment_status;
    const amountGross = itnData.amount_gross;
    const signature = itnData.signature;

    if (!mPaymentId || !paymentStatus || !signature) {
      console.error('PayFast ITN: Missing required fields');
      return new NextResponse('MISSING_FIELDS', { status: 400 });
    }

    // Verify the ITN with PayFast
    const verification = await verifyITN(itnData as unknown as PayFastITNData);

    if (!verification.valid) {
      console.error('PayFast ITN verification failed:', verification.reason);
      return new NextResponse('INVALID', { status: 400 });
    }

    // Find the payment record — use payfast_payment_id (which we stored mPaymentId into)
    const { data: paymentRecord, error: findError } = await db
      .from('payment_records')
      .select('*')
      .eq('payfast_payment_id', mPaymentId)
      .single();

    if (findError || !paymentRecord) {
      console.error('PayFast ITN: Payment record not found for payfast_payment_id:', mPaymentId);
      return new NextResponse('NOT_FOUND', { status: 404 });
    }

    // Update the payment record based on payment status
    if (paymentStatus === 'COMPLETE') {
      // Payment successful — use schema columns: status, paid_at, metadata
      const { error: updateError } = await db
        .from('payment_records')
        .update({
          status: 'completed',
          paid_at: new Date().toISOString(),
          metadata: {
            ...(typeof paymentRecord.metadata === 'object' && paymentRecord.metadata ? paymentRecord.metadata : {}),
            pf_payment_id: pfPaymentId || null,
            amount_gross: amountGross || null,
            itn_data: itnData,
          },
        })
        .eq('id', paymentRecord.id);

      if (updateError) {
        console.error('PayFast ITN: Failed to update payment record:', updateError);
      }

      // Activate the subscription if linked
      if (paymentRecord.subscription_id) {
        const { error: subUpdateError } = await db
          .from('user_subscriptions')
          .update({
            status: 'active',
          })
          .eq('id', paymentRecord.subscription_id);

        if (subUpdateError) {
          console.error('PayFast ITN: Failed to activate subscription:', subUpdateError);
        }
      }

      // Create audit log
      await createAuditLog({
        user_id: paymentRecord.user_id,
        action: 'payment_complete',
        resource_type: 'payment',
        resource_id: paymentRecord.id,
        details: { message: `Payment of R${amountGross} completed via PayFast`, pf_payment_id: pfPaymentId },
      });

      console.log(`PayFast ITN: Payment ${mPaymentId} completed successfully`);
    } else if (paymentStatus === 'FAILED') {
      // Payment failed
      const { error: updateError } = await db
        .from('payment_records')
        .update({
          status: 'failed',
          metadata: {
            ...(typeof paymentRecord.metadata === 'object' && paymentRecord.metadata ? paymentRecord.metadata : {}),
            pf_payment_id: pfPaymentId || null,
            itn_data: itnData,
          },
        })
        .eq('id', paymentRecord.id);

      if (updateError) {
        console.error('PayFast ITN: Failed to update payment record:', updateError);
      }

      // Mark subscription as expired if linked
      if (paymentRecord.subscription_id) {
        const { error: subUpdateError } = await db
          .from('user_subscriptions')
          .update({
            status: 'expired',
          })
          .eq('id', paymentRecord.subscription_id);

        if (subUpdateError) {
          console.error('PayFast ITN: Failed to expire subscription:', subUpdateError);
        }
      }

      // Create audit log
      await createAuditLog({
        user_id: paymentRecord.user_id,
        action: 'payment_failed',
        resource_type: 'payment',
        resource_id: paymentRecord.id,
        details: { message: `Payment of R${amountGross} failed via PayFast`, pf_payment_id: pfPaymentId },
      });

      console.log(`PayFast ITN: Payment ${mPaymentId} failed`);
    } else if (paymentStatus === 'PENDING') {
      // Payment pending - just update the metadata
      const { error: updateError } = await db
        .from('payment_records')
        .update({
          metadata: {
            ...(typeof paymentRecord.metadata === 'object' && paymentRecord.metadata ? paymentRecord.metadata : {}),
            pf_payment_id: pfPaymentId || null,
            itn_data: itnData,
          },
        })
        .eq('id', paymentRecord.id);

      if (updateError) {
        console.error('PayFast ITN: Failed to update payment record:', updateError);
      }

      console.log(`PayFast ITN: Payment ${mPaymentId} pending`);
    }

    // Always return 200 to PayFast to acknowledge receipt
    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('PayFast ITN processing error:', error);
    // Still return 200 to prevent PayFast from retrying unnecessarily
    // But log the error for investigation
    return new NextResponse('OK', { status: 200 });
  }
}
