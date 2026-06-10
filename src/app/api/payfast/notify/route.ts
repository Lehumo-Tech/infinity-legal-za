/**
 * Infinity Legal ZA - PayFast ITN (Instant Transaction Notification) Webhook
 * POST /api/payfast/notify
 *
 * This endpoint receives server-to-server POST notifications from PayFast
 * when a payment completes, fails, or is pending.
 *
 * IMPORTANT: This endpoint does NOT require authentication as PayFast
 * calls it server-to-server without a JWT token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyITN, type PayFastITNData } from '@/lib/payfast';
import { apiError } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
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

    // Extract key fields
    const mPaymentId = itnData.m_payment_id;
    const pfPaymentId = itnData.pf_payment_id;
    const paymentStatus = itnData.payment_status;
    const amountGross = itnData.amount_gross;
    const amountFee = itnData.amount_fee;
    const amountNet = itnData.amount_net;
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

    // Find the payment record
    const { data: paymentRecord, error: findError } = await db
      .from('payment_records')
      .select('*')
      .eq('m_payment_id', mPaymentId)
      .single();

    if (findError || !paymentRecord) {
      console.error('PayFast ITN: Payment record not found for m_payment_id:', mPaymentId);
      return new NextResponse('NOT_FOUND', { status: 404 });
    }

    // Update the payment record based on payment status
    if (paymentStatus === 'COMPLETE') {
      // Payment successful
      const { error: updateError } = await db
        .from('payment_records')
        .update({
          pf_payment_id: pfPaymentId || null,
          payment_status: 'complete',
          amount_gross: amountGross ? parseFloat(amountGross) : paymentRecord.amount_gross,
          amount_fee: amountFee ? parseFloat(amountFee) : null,
          amount_net: amountNet ? parseFloat(amountNet) : null,
          payfast_data: JSON.stringify(itnData),
        })
        .eq('m_payment_id', mPaymentId);

      if (updateError) {
        console.error('PayFast ITN: Failed to update payment record:', updateError);
      }

      // Activate the subscription if linked
      if (paymentRecord.subscription_id) {
        const { error: subUpdateError } = await db
          .from('user_subscriptions')
          .update({
            status: 'active',
            updated_at: new Date().toISOString(),
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
        details: `Payment of R${amountGross} completed via PayFast (pf_payment_id: ${pfPaymentId})`,
      });

      console.log(`PayFast ITN: Payment ${mPaymentId} completed successfully`);
    } else if (paymentStatus === 'FAILED') {
      // Payment failed
      const { error: updateError } = await db
        .from('payment_records')
        .update({
          pf_payment_id: pfPaymentId || null,
          payment_status: 'failed',
          payfast_data: JSON.stringify(itnData),
        })
        .eq('m_payment_id', mPaymentId);

      if (updateError) {
        console.error('PayFast ITN: Failed to update payment record:', updateError);
      }

      // Mark subscription as expired if linked
      if (paymentRecord.subscription_id) {
        const { error: subUpdateError } = await db
          .from('user_subscriptions')
          .update({
            status: 'expired',
            updated_at: new Date().toISOString(),
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
        details: `Payment of R${amountGross} failed via PayFast (pf_payment_id: ${pfPaymentId})`,
      });

      console.log(`PayFast ITN: Payment ${mPaymentId} failed`);
    } else if (paymentStatus === 'PENDING') {
      // Payment pending - just update the record
      const { error: updateError } = await db
        .from('payment_records')
        .update({
          pf_payment_id: pfPaymentId || null,
          payment_status: 'pending',
          payfast_data: JSON.stringify(itnData),
        })
        .eq('m_payment_id', mPaymentId);

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
