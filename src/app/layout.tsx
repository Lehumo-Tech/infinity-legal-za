import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://infinitylegal.org';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Infinity Legal | South Africa's Premier Legal Services Platform",
    template: "%s | Infinity Legal ZA",
  },
  description:
    "Infinity Legal is South Africa's leading legal services platform. POPIA-compliant case management, conveyancing, labour law, CCMA representation, civil litigation, and AI-powered legal practice management for law firms across South Africa.",
  keywords: [
    "legal services south africa",
    "law firm management",
    "attorney",
    "conveyancing",
    "labour law",
    "CCMA",
    "civil litigation",
    "POPIA",
    "POPIA compliant",
    "legal practice management",
    "South Africa",
    "law firm software",
    "case management",
    "AI legal",
    "Infinity Legal",
    "document management",
    "lead management",
    "legal consultation",
    "ZAR pricing",
    "family law South Africa",
    "criminal defence",
    "estate planning",
    "corporate commercial",
    "candidate attorney",
    "legal tech",
  ],
  authors: [{ name: "Infinity Legal (Pty) Ltd", url: APP_URL }],
  creator: "Infinity Legal (Pty) Ltd",
  publisher: "Infinity Legal (Pty) Ltd",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: "Infinity Legal | South Africa's Premier Legal Services Platform",
    description:
      "South Africa's leading legal services platform. POPIA-compliant case management, conveyancing, labour law, CCMA representation, civil litigation, and AI-powered practice management.",
    url: APP_URL,
    siteName: "Infinity Legal ZA",
    type: "website",
    locale: "en_ZA",
    images: [
      {
        url: "/infinity_logo.png",
        width: 1200,
        height: 630,
        alt: "Infinity Legal – South Africa's Premier Legal Services Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Infinity Legal | South Africa's Premier Legal Services Platform",
    description:
      "POPIA-compliant case management, conveyancing, labour law, CCMA, civil litigation & AI-powered legal practice management for South Africa.",
    images: ["/infinity_logo.png"],
    creator: "@InfinityLegalZA",
  },
  alternates: {
    canonical: APP_URL,
  },
  verification: {
    google: "google-site-verification-code",
  },
  category: "legal technology",
  icons: {
    icon: [
      { url: "/infinity_logo.png", type: "image/png", sizes: "32x32" },
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    apple: "/infinity_logo.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LegalService',
    '@id': `${APP_URL}/#legal-service`,
    name: 'Infinity Legal',
    alternateName: 'Infinity Legal ZA',
    description:
      "South Africa's premier legal services platform offering POPIA-compliant case management, conveyancing, labour law, CCMA representation, civil litigation, estate planning, and AI-powered legal practice management for law firms across South Africa.",
    url: APP_URL,
    logo: `${APP_URL}/infinity_logo.png`,
    image: `${APP_URL}/infinity_logo.png`,
    telephone: '+27-10-000-0000',
    email: 'info@infinitylegal.org',
    areaServed: [
      {
        '@type': 'Country',
        name: 'South Africa',
      },
      {
        '@type': 'AdministrativeArea',
        name: 'Gauteng',
      },
      {
        '@type': 'AdministrativeArea',
        name: 'Western Cape',
      },
      {
        '@type': 'AdministrativeArea',
        name: 'KwaZulu-Natal',
      },
    ],
    serviceType: [
      'Legal Consultation',
      'Case Management',
      'Document Management',
      'AI Legal Analysis',
      'Lead Management',
      'Conveyancing',
      'Labour Law',
      'CCMA Representation',
      'Civil Litigation',
      'Family Law',
      'Criminal Defence',
      'Estate Planning',
      'Corporate Commercial Law',
    ],
    priceRange: 'R99 - R139/month',
    currenciesAccepted: 'ZAR',
    paymentAccepted: 'Credit Card, EFT',
    address: {
      '@type': 'PostalAddress',
      '@id': `${APP_URL}/#address`,
      streetAddress: 'Sandton City Office Tower, Rivonia Road',
      addressLocality: 'Sandton, Johannesburg',
      addressRegion: 'Gauteng',
      postalCode: '2196',
      addressCountry: 'ZA',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: -26.1076,
      longitude: 28.0567,
    },
    foundingDate: '2024',
    legalName: 'Infinity Legal (Pty) Ltd',
    sameAs: [],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Legal Practice Plans',
      itemListElement: [
        {
          '@type': 'Offer',
          '@id': `${APP_URL}/#plan-civil`,
          itemOffered: {
            '@type': 'Service',
            name: 'Civil Legal Plan',
            description: 'Civil litigation, family law, and personal injury case management',
          },
          price: '99',
          priceCurrency: 'ZAR',
          availability: 'https://schema.org/InStock',
        },
        {
          '@type': 'Offer',
          '@id': `${APP_URL}/#plan-labour`,
          itemOffered: {
            '@type': 'Service',
            name: 'Labour Legal Plan',
            description: 'Labour law, CCMA representation, and employment dispute resolution',
          },
          price: '99',
          priceCurrency: 'ZAR',
          availability: 'https://schema.org/InStock',
        },
        {
          '@type': 'Offer',
          '@id': `${APP_URL}/#plan-extensive`,
          itemOffered: {
            '@type': 'Service',
            name: 'Extensive Plan',
            description: 'Full-service legal practice management across all practice areas',
          },
          price: '139',
          priceCurrency: 'ZAR',
          availability: 'https://schema.org/InStock',
        },
      ],
    },
    knowsAbout: [
      'South African Law',
      'POPIA Compliance',
      'Conveyancing',
      'Labour Law',
      'CCMA Procedures',
      'Civil Litigation',
      'Family Law',
      'Criminal Defence',
      'Estate Planning',
      'Corporate Commercial Law',
    ],
  };

  return (
    <html lang="en-ZA" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0c1e3c" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="geo.region" content="ZA" />
        <meta name="geo.placename" content="Johannesburg" />
        <link rel="canonical" href={APP_URL} />
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
        <SonnerToaster richColors position="top-right" />
      </body>
    </html>
  );
}
