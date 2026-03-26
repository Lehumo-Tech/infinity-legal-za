'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Privacy-compliant analytics tracker.
 * Tracks page views without cookies, IP addresses, or fingerprinting.
 * POPIA / GDPR compliant by design.
 */
export default function AnalyticsTracker() {
  const pathname = usePathname()

  useEffect(() => {
    // Don't track portal/dashboard pages (internal use)
    if (pathname?.startsWith('/portal') || pathname?.startsWith('/dashboard') || pathname?.startsWith('/attorney/office')) {
      return
    }

    // Track page view
    const trackPageView = async () => {
      try {
        await fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'page_view',
            page: pathname,
            referrer: typeof document !== 'undefined' ? document.referrer : null,
          }),
        })
      } catch {
        // Silent fail
      }
    }

    // Small delay to not block initial render
    const timer = setTimeout(trackPageView, 500)
    return () => clearTimeout(timer)
  }, [pathname])

  return null // No visual output
}
