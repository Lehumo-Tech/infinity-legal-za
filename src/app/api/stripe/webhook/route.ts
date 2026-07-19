/**
 * POST /api/stripe/webhook — Stripe webhook endpoint
 *
 * Receives Stripe events (checkout.session.completed, subscription events,
 * invoice.payment_succeeded) and updates the local DB.
 *
 * IMPORTANT: this route reads the raw request body (not JSON) to verify the
 * Stripe signature. It must NOT be wrapped in bodyParser middleware.
 *
 * Configure at: https://dashboard.stripe.com/webhooks
 * URL: https://yourdomain.com/api/stripe/webhook
 * Events: checkout.session.completed, customer.subscription.updated,
 *         customer.subscription.deleted, invoice.payment_succeeded
 */
import { NextRequest, NextResponse } from 'next/server';
import { getStripe, stripeWebhookSecret, isStripeEnabled } from '@/lib/stripe';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!isStripeEnabled || !stripeWebhookSecret) {
    return NextResponse.json(
      { success: false, error: 'Stripe webhook not configured' },
      { status: 503 }
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ success: false, error: 'Stripe not initialized' }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ success: false, error: 'Missing signature' }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
  } catch (err: any) {
    console.error('[Stripe webhook] signature verification failed:', err.message);
    return NextResponse.json(
      { success: false, error: `Invalid signature: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const userId = session.metadata?.userId;
        const clientId = session.metadata?.clientId || '';
        const planSlug = session.metadata?.planSlug;
        const billingCycle = session.metadata?.billingCycle || 'monthly';

        if (userId && planSlug) {
          // Resolve or create a Client record for this user (Stripe subscriptions attach to clients)
          let client = clientId ? await db.client.findUnique({ where: { id: clientId } }) : null;
          if (!client) {
            client = await db.client.findFirst({ where: { user_id: userId } });
          }
          if (!client) {
            // Auto-create a client record linked to the user
            client = await db.client.create({
              data: {
                user_id: userId,
                subscription_status: 'active',
              },
            });
          }

          const plan = await db.pricingPlan.findUnique({ where: { slug: planSlug } });
          if (plan) {
            await db.userSubscription.upsert({
              where: { client_id: client.id },
              create: {
                client_id: client.id,
                plan_id: plan.id,
                status: 'active',
                billing_cycle: billingCycle,
                current_period_start: new Date(),
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                stripe_customer_id: session.customer as string,
                stripe_subscription_id: session.subscription as string,
              },
              update: {
                plan_id: plan.id,
                status: 'active',
                billing_cycle: billingCycle,
                current_period_start: new Date(),
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                stripe_customer_id: session.customer as string,
                stripe_subscription_id: session.subscription as string,
              },
            });

            // Record the payment
            await db.paymentRecord.create({
              data: {
                client_id: client.id,
                amount: (session.amount_total || 0) / 100,
                currency: session.currency || 'zar',
                status: 'completed',
                provider: 'stripe',
                provider_payment_id: session.id,
                description: `${plan.name} — ${billingCycle}`,
                paid_at: new Date(),
              },
            });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as any;
        // Find subscription by Stripe subscription ID
        await db.userSubscription.updateMany({
          where: { stripe_subscription_id: sub.id },
          data: { status: 'cancelled' },
        });
        break;
      }

      case 'invoice.payment_succeeded': {
        // Renewal — extend the period
        const invoice = event.data.object as any;
        if (invoice.customer) {
          await db.userSubscription.updateMany({
            where: { stripe_customer_id: invoice.customer },
            data: {
              status: 'active',
              current_period_end: new Date((invoice.lines?.data?.[0]?.period?.end || Date.now() / 1000) * 1000),
            },
          });
        }
        break;
      }

      default:
        // Unhandled event — acknowledge receipt
        break;
    }

    return NextResponse.json({ success: true, received: event.type });
  } catch (error: any) {
    console.error('[Stripe webhook] processing error:', error);
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
