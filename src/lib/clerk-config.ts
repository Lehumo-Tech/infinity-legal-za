/**
 * Clerk Authentication Configuration
 *
 * Clerk is conditionally enabled: when NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and
 * CLERK_SECRET_KEY are both set in the environment, Clerk handles authentication.
 * When they're absent, the app falls back to the existing local JWT auth
 * (src/hooks/useAuth.tsx + src/lib/local-auth.ts).
 *
 * To activate Clerk:
 * 1. Create an app at https://dashboard.clerk.com
 * 2. Copy the "Publishable Key" (starts with pk_) and "Secret Key" (starts with sk_)
 * 3. Add to .env:
 *      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
 *      CLERK_SECRET_KEY=sk_test_...
 * 4. Set NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in and NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
 * 5. Configure the webhook at https://dashboard.clerk.com → Webhooks → add endpoint
 *    https://yourdomain.com/api/webhooks/clerk with events user.created, user.updated, user.deleted
 * 6. Add CLERK_WEBHOOK_SECRET (whsec_...) from the webhook endpoint
 *
 * Clerk natively handles cross-origin iframe authentication (the preview panel),
 * making it the definitive solution for the sign-in issues that affected the
 * local JWT + cookie approach.
 */

export const isClerkEnabled: boolean = !!(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.CLERK_SECRET_KEY
);

export const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
export const clerkSecretKey = process.env.CLERK_SECRET_KEY || '';
export const clerkWebhookSecret = process.env.CLERK_WEBHOOK_SECRET || '';

/**
 * Clerk sign-in / sign-up URLs (used by ClerkProvider for redirects).
 * Defaults to /sign-in and /sign-up which map to the Clerk-hosted pages.
 */
export const clerkSignInUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || '/sign-in';
export const clerkSignUpUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || '/sign-up';
export const clerkAfterSignInUrl = process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || '/';
export const clerkAfterSignUpUrl = process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || '/';
