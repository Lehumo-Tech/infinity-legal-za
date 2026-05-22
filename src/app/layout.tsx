import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Infinity Legal ZA | AI-Powered Legal Practice Management",
    template: "%s | Infinity Legal ZA",
  },
  description: "South Africa's premier AI-powered legal practice management platform. POPIA compliant, RBAC secured, and optimized for law firms of all sizes. Manage cases, leads, documents, and consultations with intelligent automation.",
  keywords: [
    "legal practice management", "South Africa", "law firm software", "case management",
    "POPIA compliant", "AI legal", "attorney software", "legal tech", "Infinity Legal",
    "document management", "lead management", "legal consultation", "ZAR pricing",
    "family law South Africa", "criminal defence", "civil litigation", "conveyancing",
    "estate planning", "corporate commercial", "labour law",
  ],
  authors: [{ name: "Infinity Legal (Pty) Ltd" }],
  creator: "Infinity Legal",
  publisher: "Infinity Legal (Pty) Ltd",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: {
    title: "Infinity Legal ZA | AI-Powered Legal Practice Management",
    description: "South Africa's premier AI-powered legal practice management platform. POPIA compliant, RBAC secured.",
    url: "https://infinitylegal.co.za",
    siteName: "Infinity Legal ZA",
    type: "website",
    locale: "en_ZA",
    images: [
      {
        url: "/logo-icon-512.png",
        width: 512,
        height: 512,
        alt: "Infinity Legal ZA Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Infinity Legal ZA",
    description: "AI-Powered Legal Practice Management for South Africa",
    images: ["/logo-icon-512.png"],
  },
  alternates: { canonical: "https://infinitylegal.co.za" },
  verification: {
    google: "google-site-verification-code",
  },
  category: "legal technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LegalService',
    name: 'Infinity Legal ZA',
    description: 'AI-powered legal practice management platform for South Africa. POPIA compliant, RBAC secured.',
    url: 'https://infinitylegal.co.za',
    logo: 'https://infinitylegal.co.za/logo-icon-512.png',
    image: 'https://infinitylegal.co.za/logo-icon-512.png',
    telephone: '+27-10-000-0000',
    email: 'info@infinitylegal.co.za',
    areaServed: {
      '@type': 'Country',
      name: 'South Africa',
    },
    serviceType: ['Legal Consultation', 'Case Management', 'Document Management', 'AI Legal Analysis', 'Lead Management'],
    priceRange: 'R99 - R139/month',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'ZA',
      addressLocality: 'Johannesburg',
    },
    sameAs: [],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Legal Practice Plans',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: 'Civil Legal Plan' },
          price: '99',
          priceCurrency: 'ZAR',
        },
        {
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: 'Labour Legal Plan' },
          price: '99',
          priceCurrency: 'ZAR',
        },
        {
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: 'Extensive Plan' },
          price: '139',
          priceCurrency: 'ZAR',
        },
      ],
    },
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0f172a" />
        <meta name="x-app-version" content="2.0.0" />
        <meta name="x-database" content="sqlite" />
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/logo-icon-512.png" />
        <link rel="canonical" href="https://infinitylegal.co.za" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
