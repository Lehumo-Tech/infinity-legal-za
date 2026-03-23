import './globals.css'
import { Inter, Playfair_Display } from 'next/font/google'
import LegalDisclaimer from '../components/LegalDisclaimer'
import dynamic from 'next/dynamic'
import { AuthProvider } from '@/contexts/AuthContext'

const CookieConsent = dynamic(() => import('../components/CookieConsent'), {
  ssr: false
})

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata = {
  title: 'Infinity Legal - Solve Your Legal Problem in Minutes',
  description: 'Affordable, confidential legal help powered by AI. Connect with verified South African attorneys.',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    title: 'Infinity Legal - AI-Powered Legal Help for South Africa',
    description: 'Get instant guidance from our AI legal assistant, then connect with verified South African attorneys. Affordable. Confidential. POPIA compliant.',
    siteName: 'Infinity Legal',
    images: [
      {
        url: '/hero-consultation.png',
        width: 1200,
        height: 630,
        alt: 'Professional legal consultation with Infinity Legal',
      },
    ],
    locale: 'en_ZA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Infinity Legal - AI-Powered Legal Help',
    description: 'Get instant guidance from our AI legal assistant, then connect with verified South African attorneys.',
    images: ['/hero-consultation.png'],
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://infinitylegal.org'),
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} font-sans`}>
        <AuthProvider>
          {/* Skip-to-content link for keyboard accessibility */}
          <a href="#main-content" className="skip-to-content">
            Skip to main content
          </a>
          <div className="min-h-screen bg-background watermark">
            <main id="main-content" tabIndex={-1}>
              {children}
            </main>
          </div>
          <CookieConsent />
          <LegalDisclaimer />
        </AuthProvider>
      </body>
    </html>
  )
}
