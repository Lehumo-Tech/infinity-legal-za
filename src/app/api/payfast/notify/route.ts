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
 * Prisma PaymentRecord schema: id, subscription_id, case_id, client_id, amount,
 *   currency, status, payfast_payment_id, payfast_token, payfast_merchant_id,
 *   payfast_signature, payment_method, description, metadata (JSON), paid_at, created_at
 */

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { verifyITN, isValidPayFastIP, type PayFastITNData } from '@/lib/payfast';
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

    // Find the payment record by payfast_payment_id (which we stored mPaymentId into)
    const paymentRecord = await db.paymentRecord.findFirst({
      where: { payfast_payment_id: mPaymentId },
    });

    if (!paymentRecord) {
      console.error('PayFast ITN: Payment record not found for payfast_payment_id:', mPaymentId);
      return new NextResponse('NOT_FOUND', { status: 404 });
    }

    // Build merged metadata
    const existingMetadata = (paymentRecord.metadata && typeof paymentRecord.metadata === 'object')
      ? (paymentRecord.metadata as Record<string, unknown>)
      : {};
    const newMetadata = {
      ...existingMetadata,
      pf_payment_id: pfPaymentId || null,
      amount_gross: amountGross || null,
      itn_data: itnData,
    } as Prisma.InputJsonValue;

    // Update the payment record based on payment status
    if (paymentStatus === 'COMPLETE') {
      await db.paymentRecord.update({
        where: { id: paymentRecord.id },
        data: {
          status: 'completed',
          paid_at: new Date(),
          metadata: newMetadata,
        },
      });

      // Activate the subscription if linked
      if (paymentRecord.subscription_id) {
        await db.userSubscription.update({
          where: { id: paymentRecord.subscription_id },
          data: { status: 'active' },
        }).catch(err => console.error('PayFast ITN: Failed to activate subscription:', err));
      }

      // Also update the client's subscription_status to 'active'
      try {
        await db.client.update({
          where: { id: paymentRecord.client_id },
          data: { subscription_status: 'active' },
        });
      } catch (clientErr) {
        console.error('PayFast ITN: Failed to update client subscription status:', clientErr);
      }

      // Create audit log
      await createAuditLog({
        action: 'payment_complete',
        resource_type: 'payment',
        resource_id: paymentRecord.id,
        details: { message: `Payment of R${amountGross} completed via PayFast`, pf_payment_id: pfPaymentId },
      });

      console.log(`PayFast ITN: Payment ${mPaymentId} completed successfully`);
    } else if (paymentStatus === 'FAILED') {
      await db.paymentRecord.update({
        where: { id: paymentRecord.id },
        data: {
          status: 'failed',
          metadata: newMetadata,
        },
      });

      // Mark subscription as expired if linked
      if (paymentRecord.subscription_id) {
        await db.userSubscription.update({
          where: { id: paymentRecord.subscription_id },
          data: { status: 'expired' },
        }).catch(err => console.error('PayFast ITN: Failed to expire subscription:', err));
      }

      await createAuditLog({
        action: 'payment_failed',
        resource_type: 'payment',
        resource_id: paymentRecord.id,
        details: { message: `Payment of R${amountGross} failed via PayFast`, pf_payment_id: pfPaymentId },
      });

      console.log(`PayFast ITN: Payment ${mPaymentId} failed`);
    } else if (paymentStatus === 'PENDING') {
      // Payment pending - just update the metadata
      await db.paymentRecord.update({
        where: { id: paymentRecord.id },
        data: { metadata: newMetadata },
      });

      console.log(`PayFast ITN: Payment ${mPaymentId} pending`);
    }

    // Always return 200 to PayFast to acknowledge receipt
    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('PayFast ITN processing error:', error);
    // Still return 200 to prevent PayFast from retrying unnecessarily
    return new NextResponse('OK', { status: 200 });
  }
}
