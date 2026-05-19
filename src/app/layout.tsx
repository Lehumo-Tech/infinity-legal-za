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
  title: "Infinity Legal ZA | AI-Powered Legal Practice Management",
  description: "South Africa's premier AI-powered legal practice management platform. POPIA compliant, RBAC secured, and optimized for law firms of all sizes. Manage cases, leads, documents, and consultations with intelligent automation.",
  keywords: [
    "legal practice management", "South Africa", "law firm software", "case management",
    "POPIA compliant", "AI legal", "attorney software", "legal tech", "Infinity Legal",
    "document management", "lead management", "legal consultation", "ZAR pricing",
  ],
  authors: [{ name: "Infinity Legal (Pty) Ltd" }],
  creator: "Infinity Legal",
  publisher: "Infinity Legal",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Infinity Legal ZA | AI-Powered Legal Practice Management",
    description: "South Africa's premier AI-powered legal practice management platform. POPIA compliant, RBAC secured.",
    url: "https://infinitylegal.co.za",
    siteName: "Infinity Legal ZA",
    type: "website",
    locale: "en_ZA",
  },
  twitter: {
    card: "summary_large_image",
    title: "Infinity Legal ZA",
    description: "AI-Powered Legal Practice Management for South Africa",
  },
  alternates: { canonical: "https://infinitylegal.co.za" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0f172a" />
        <meta name="x-app-version" content="1.0.0" />
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
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
