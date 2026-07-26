import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { AppProviders } from "@/components/providers/AppProviders";

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
    "legal advisor",
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
    "candidate legal advisor",
    "legal tech",
    "Sandton lawyer",
    "Johannesburg attorney",
    "property transfer",
    "deceased estates",
    "divorce lawyer",
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
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Infinity Legal — South Africa's Premier Legal Services Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Infinity Legal | South Africa's Premier Legal Services Platform",
    description:
      "POPIA-compliant case management, conveyancing, labour law, CCMA, civil litigation & AI-powered legal practice management for South Africa.",
    images: ["/twitter-image"],
    creator: "@InfinityLegalZA",
    site: "@InfinityLegalZA",
  },
  alternates: {
    canonical: APP_URL,
    languages: {
      'en-ZA': APP_URL,
      'en': APP_URL,
      'x-default': APP_URL,
    },
  },
  category: "legal technology",
  icons: {
    icon: [
      { url: "/logo_legal.png", type: "image/png", sizes: "512x512" },
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    shortcut: "/logo_legal.png",
    apple: "/logo_legal.png",
  },
  manifest: "/site.webmanifest",
  other: {
    'geo.region': 'ZA-GP',
    'geo.placename': 'Sandton, Johannesburg',
    'geo.position': '-26.0991;28.0521',
    'ICBM': '-26.0991, 28.0521',
    'content-language': 'en-ZA',
    'rating': 'general',
    'distribution': 'global',
    'revisit-after': '7 days',
  },
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
    logo: `${APP_URL}/logo_legal.png`,
    image: `${APP_URL}/logo_legal.png`,
    telephone: '+27 68 127 6038',
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
      streetAddress: '93 Grayston Drive',
      addressLocality: 'Sandton',
      addressRegion: 'Gauteng',
      postalCode: '2196',
      addressCountry: 'ZA',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: -26.0991,
      longitude: 28.0521,
    },
    foundingDate: '2024',
    legalName: 'Infinity Legal (Pty) Ltd',
    sameAs: [
      'https://wa.me/27681276038',
    ],
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

  const organizationLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${APP_URL}/#organization`,
    name: 'Infinity Legal (Pty) Ltd',
    alternateName: 'Infinity Legal ZA',
    url: APP_URL,
    logo: `${APP_URL}/logo_legal.png`,
    image: `${APP_URL}/opengraph-image`,
    foundingDate: '2024',
    email: 'info@infinitylegal.org',
    telephone: '+27 68 127 6038',
    sameAs: ['https://wa.me/27681276038'],
    address: {
      '@type': 'PostalAddress',
      streetAddress: '93 Grayston Drive',
      addressLocality: 'Sandton',
      addressRegion: 'Gauteng',
      postalCode: '2196',
      addressCountry: 'ZA',
    },
  };

  const websiteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${APP_URL}/#website`,
    name: 'Infinity Legal ZA',
    alternateName: 'Infinity Legal',
    url: APP_URL,
    inLanguage: 'en-ZA',
    publisher: { '@id': `${APP_URL}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${APP_URL}/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${APP_URL}/#faq`,
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Is Infinity Legal POPIA compliant?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Infinity Legal is built POPIA-compliant from the ground up — with explicit consent capture, 256-bit encryption at rest, 90-day password expiry, full audit logging, and the right to access / erase personal information. We process all data in accordance with the Protection of Personal Information Act (Act 4 of 2013).',
        },
      },
      {
        '@type': 'Question',
        name: 'What legal practice areas does Infinity Legal cover?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Infinity Legal supports all major South African practice areas: Civil Litigation, Family Law, Labour Law & CCMA Representation, Conveyancing (property transfers), Criminal Defence, Estate Planning (deceased estates & wills), and Corporate Commercial Law.',
        },
      },
      {
        '@type': 'Question',
        name: 'How much does Infinity Legal cost?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Our pricing starts at R99/month for the Civil Legal Plan and R139/month for the Extensive Plan (all practice areas). All plans are billed in South African Rand (ZAR) and include case management, document storage, AI-powered legal analysis, and POPIA-compliant client intake.',
        },
      },
      {
        '@type': 'Question',
        name: 'Where is Infinity Legal based?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Infinity Legal is based at 93 Grayston Drive, Sandton, Gauteng, South Africa (2196). We serve law firms and clients across all nine provinces, with primary coverage in Gauteng, Western Cape, and KwaZulu-Natal.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does Infinity Legal offer AI-powered legal tools?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Our platform includes an AI-powered client intake assistant, AI legal analysis on case documents, and the Infinity AI Assistant for matter research — all designed to help South African legal practitioners work faster without replacing professional legal judgment.',
        },
      },
    ],
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${APP_URL}/#breadcrumb`,
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: APP_URL,
      },
    ],
  };

  return (
    <html lang="en-ZA" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0c1e3c" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="geo.region" content="ZA-GP" />
        <meta name="geo.placename" content="Sandton, Johannesburg" />
        <meta name="geo.position" content="-26.0991;28.0521" />
        <meta name="ICBM" content="-26.0991, 28.0521" />
        <meta name="content-language" content="en-ZA" />
        <meta name="revisit-after" content="7 days" />
        <link rel="canonical" href={APP_URL} />
        <link rel="alternate" hrefLang="en-za" href={APP_URL} />
        <link rel="alternate" hrefLang="en" href={APP_URL} />
        <link rel="alternate" hrefLang="x-default" href={APP_URL} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AppProviders>
          {children}
        </AppProviders>
        <Toaster />
        <SonnerToaster richColors position="top-right" />
      </body>
    </html>
  );
}
