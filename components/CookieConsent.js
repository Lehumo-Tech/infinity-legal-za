'use client'

import { useEffect, useState } from 'react'

export default function CookieConsent() {
  const [show, setShow] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const consent = localStorage.getItem('cookieConsent')
    if (!consent) {
      setShow(true)
    }
  }, [])

  if (!mounted || !show) return null

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted')
    setShow(false)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 shadow-lg z-50">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          <p>
            We use cookies to improve your experience. By using this site, you agree to our{' '}
            <a href="/cookie-policy" className="text-primary underline">Cookie Policy</a> and{' '}
            <a href="/privacy" className="text-primary underline">Privacy Policy</a>.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAccept}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
