/**
 * Clerk Webhook — syncs Clerk users to the local Prisma User table
 *
 * When a user signs up via Clerk, this webhook creates a corresponding User
 * record in the local database so that the app's case management, leads,
 * documents, and other features can reference the user.
 *
 * Setup:
 * 1. Go to https://dashboard.clerk.com → Webhooks → Add Endpoint
 * 2. Endpoint URL: https://yourdomain.com/api/webhooks/clerk
 * 3. Subscribe to: user.created, user.updated, user.deleted
 * 4. Copy the Signing Secret (whsec_...) and add to .env as CLERK_WEBHOOK_SECRET
 */

import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { db } from '@/lib/db';
import { isClerkEnabled, clerkWebhookSecret } from '@/lib/clerk-config';

export async function POST(request: NextRequest) {
  // Only process if Clerk is enabled
  if (!isClerkEnabled || !clerkWebhookSecret) {
    return NextResponse.json({ error: 'Clerk webhooks not configured' }, { status: 404 });
  }

  // Verify the webhook signature (svix)
  const svixId = request.headers.get('svix-id');
  const svixTimestamp = request.headers.get('svix-timestamp');
  const svixSignature = request.headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  const payload = await request.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(clerkWebhookSecret);
  let evt: any;

  try {
    evt = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  const eventType = evt.type;
  const data = evt.data;

  try {
    switch (eventType) {
      case 'user.created': {
        // Create a local User record for the new Clerk user
        const email = data.email_addresses?.[0]?.email_address || '';
        const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim() || email;

        // Check if user already exists (might have been created by local auth first)
        const existing = await db.user.findUnique({
          where: { email },
        });

        if (existing) {
          // Link the Clerk ID to the existing user
          await db.user.update({
            where: { email },
            data: { clerk_id: data.id },
          });
        } else {
          // Create new user with default 'client' role
          await db.user.create({
            data: {
              email,
              full_name: fullName,
              role: 'client',
              clerk_id: data.id,
              is_active: true,
              email_verified: data.email_addresses?.[0]?.verification?.status === 'verified',
              popi_consent: true,
              // Placeholder password — Clerk handles actual auth, this field is required by schema
              password: '__clerk_managed__',
            },
          });
        }
        break;
      }

      case 'user.updated': {
        const email = data.email_addresses?.[0]?.email_address || '';
        const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim() || email;

        await db.user.updateMany({
          where: { clerk_id: data.id },
          data: {
            email,
            full_name: fullName,
            email_verified: data.email_addresses?.[0]?.verification?.status === 'verified',
            is_active: !data.banned,
          },
        });
        break;
      }

      case 'user.deleted': {
        await db.user.updateMany({
          where: { clerk_id: data.id },
          data: { is_active: false },
        });
        break;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Clerk webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
