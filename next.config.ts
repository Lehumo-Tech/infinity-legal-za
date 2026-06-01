import type { NextConfig } from "next";

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
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://vercel-insights.com https://www.payfast.co.za https://sandbox.payfast.co.za",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://vercel.live https://vercel-insights.com https://*.vercel.app https://www.payfast.co.za https://sandbox.payfast.co.za",
      "frame-ancestors 'self' https: http:",
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
    value: "same-origin",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-origin",
  },
  {
    key: "X-Session-Timeout",
    value: "1800",
  },
];

// Fix: System-level DATABASE_URL may point to SQLite, override with PostgreSQL URL
if (process.env.DATABASE_URL?.startsWith('file:') && process.env.POSTGRES_URL) {
  process.env.DATABASE_URL = process.env.POSTGRES_URL;
}

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  poweredByHeader: false,
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

export default nextConfig;
