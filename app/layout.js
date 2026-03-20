import './globals.css'
import { Inter } from 'next/font/google'
import CookieConsent from '../components/CookieConsent'
import LegalDisclaimer from '../components/LegalDisclaimer'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Infinity Legal - Solve Your Legal Problem in Minutes',
  description: 'Affordable, confidential legal help powered by AI. Connect with verified South African attorneys.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          {children}
        </div>
        <CookieConsent />
        <LegalDisclaimer />
      </body>
    </html>
  )
}