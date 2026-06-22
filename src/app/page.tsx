import type { Metadata } from 'next';
import HomePageClient from '@/components/HomePageClient';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://infinitylegal.org';

export const metadata: Metadata = {
  title: "Infinity Legal | South Africa's Premier Legal Services Platform",
  description:
    "Infinity Legal is South Africa's leading legal services platform. POPIA-compliant case management, conveyancing, labour law, CCMA representation, civil litigation, and AI-powered legal practice management for law firms across South Africa.",
  keywords: [
    'legal services south africa',
    'law firm management',
    'attorney',
    'conveyancing',
    'labour law',
    'CCMA',
    'civil litigation',
    'POPIA',
    'POPIA compliant',
    'legal practice management',
    'South Africa',
    'law firm software',
    'case management',
    'AI legal',
    'Infinity Legal',
    'document management',
    'lead management',
    'legal consultation',
    'ZAR pricing',
    'family law South Africa',
    'criminal defence',
    'estate planning',
    'corporate commercial',
    'candidate attorney',
    'legal tech',
  ],
  alternates: {
    canonical: APP_URL,
  },
  openGraph: {
    title: "Infinity Legal | South Africa's Premier Legal Services Platform",
    description:
      "South Africa's leading legal services platform. POPIA-compliant case management, conveyancing, labour law, CCMA representation, civil litigation, and AI-powered practice management.",
    url: APP_URL,
    siteName: 'Infinity Legal ZA',
    locale: 'en_ZA',
    type: 'website',
    images: [
      {
        url: '/logo_legal.png',
        width: 1200,
        height: 630,
        alt: "Infinity Legal – South Africa's Premier Legal Services Platform",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Infinity Legal | South Africa's Premier Legal Services Platform",
    description:
      'POPIA-compliant case management, conveyancing, labour law, CCMA, civil litigation & AI-powered legal practice management for South Africa.',
    images: ['/logo_legal.png'],
  },
};

export default function Home() {
  return <HomePageClient />;
}
