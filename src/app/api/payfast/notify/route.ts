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
import { createAuditLog } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
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
    const paymentRecord = await db.paymentRecord.findUnique({
      where: { m_payment_id: mPaymentId },
    });

    if (!paymentRecord) {
      console.error('PayFast ITN: Payment record not found for m_payment_id:', mPaymentId);
      return new NextResponse('NOT_FOUND', { status: 404 });
    }

    // Update the payment record based on payment status
    if (paymentStatus === 'COMPLETE') {
      // Payment successful
      await db.paymentRecord.update({
        where: { m_payment_id: mPaymentId },
        data: {
          pf_payment_id: pfPaymentId || null,
          payment_status: 'complete',
          amount_gross: amountGross ? parseFloat(amountGross) : paymentRecord.amount_gross,
          amount_fee: amountFee ? parseFloat(amountFee) : null,
          amount_net: amountNet ? parseFloat(amountNet) : null,
          payfast_data: JSON.stringify(itnData),
        },
      });

      // Activate the subscription if linked
      if (paymentRecord.subscription_id) {
        await db.userSubscription.update({
          where: { id: paymentRecord.subscription_id },
          data: {
            status: 'active',
            updated_at: new Date(),
          },
        });
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
      await db.paymentRecord.update({
        where: { m_payment_id: mPaymentId },
        data: {
          pf_payment_id: pfPaymentId || null,
          payment_status: 'failed',
          payfast_data: JSON.stringify(itnData),
        },
      });

      // Mark subscription as expired if linked
      if (paymentRecord.subscription_id) {
        await db.userSubscription.update({
          where: { id: paymentRecord.subscription_id },
          data: {
            status: 'expired',
            updated_at: new Date(),
          },
        });
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
      await db.paymentRecord.update({
        where: { m_payment_id: mPaymentId },
        data: {
          pf_payment_id: pfPaymentId || null,
          payment_status: 'pending',
          payfast_data: JSON.stringify(itnData),
        },
      });

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
