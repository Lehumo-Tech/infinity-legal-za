import type { NextConfig } from "next";

// ============================================
// Security Headers (with CSP updated for Clerk, PostHog, Sentry)
// ============================================
const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Script sources: app + PayFast + Clerk + PostHog + Sentry + Vercel
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://vercel-insights.com https://www.payfast.co.za https://sandbox.payfast.co.za https://*.clerk.accounts.dev https://*.clerk.com https://*.posthog.com https://*.sentry.io https://*.ingest.sentry.io",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Image sources: app + data + any https + Clerk avatars + PostHog + Sentry
      "img-src 'self' data: https: blob:",
      "font-src 'self' https://fonts.gstatic.com",
      // Connect sources: app + PayFast + Supabase + Clerk + PostHog + Sentry + Vercel
      "connect-src 'self' https://vercel.live https://vercel-insights.com https://*.vercel.app https://www.payfast.co.za https://sandbox.payfast.co.za https://*.supabase.co https://*.clerk.accounts.dev https://*.clerk.com https://*.posthog.com https://app.posthog.com https://*.sentry.io https://*.ingest.sentry.io",
      // Frame sources: allow Clerk's auth iframe
      "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com",
      "frame-ancestors 'self' https://*.space-z.ai http://*.space-z.ai",
      "base-uri 'self'",
      "form-action 'self' https://www.payfast.co.za https://sandbox.payfast.co.za",
      "object-src 'none'",
    ].join("; "),
  },
  {
    key: "X-Permitted-Cross-Domain-Policies",
    value: "none",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin-allow-popups",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "cross-origin",
  },
  {
    key: "X-Session-Timeout",
    value: "1800",
  },
];

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  poweredByHeader: false,
  allowedDevOrigins: [
    '*.space-z.ai',
    'space-z.ai',
    '127.0.0.1',
    'localhost',
  ],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/admin",
        destination: "/",
        permanent: false,
      },
    ];
  },
};

// ============================================
// Sentry Integration
// ============================================
// Wrap the config with withSentryConfig. This is safe to call even without
// SENTRY_DSN — the SDK only initializes when the DSN is present (see
// sentry.*.config.ts). Source map uploads require SENTRY_AUTH_TOKEN.
import { withSentryConfig } from "@sentry/nextjs";

export default withSentryConfig(nextConfig, {
  // Only relevant when SENTRY_AUTH_TOKEN is set (production source map uploads)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Suppress sentry-cli logs during build
  silent: true,
  // Don't fail the build if source map upload fails
  errorHandler: () => {},
  // Disable automatic instrumentation of routes (we handle it manually)
  // This avoids the "auto-instrumentation" warning in dev
  disableServerWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
  disableClientWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
});
