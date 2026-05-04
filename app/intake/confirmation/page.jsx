'use client'

import React, { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const NAVY = '#0f2b46'
const GOLD = '#c9a961'

function ConfirmationContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const caseId = searchParams.get('caseId') || 'IL-0000'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-2.5">
          <img src="/logo-icon-128.png" alt="Infinity Legal" className="h-10 w-auto rounded-lg" />
          <span className="text-lg font-bold tracking-wide" style={{ color: NAVY, fontFamily: 'Playfair Display, serif' }}>
            INFINITY LEGAL
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-lg shadow-lg border-0 text-center">
          <CardContent className="pt-10 pb-10 px-8">
            {/* Success Icon */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
              style={{ backgroundColor: `${GOLD}20` }}
            >
              <svg className="w-10 h-10" style={{ color: GOLD }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold mb-2" style={{ color: NAVY, fontFamily: 'Playfair Display, serif' }}>
              Intake Submitted Successfully
            </h1>

            <p className="text-gray-500 mb-6">
              Your legal intake has been received and is being reviewed by our team.
            </p>

            {/* Case ID */}
            <div
              className="rounded-xl p-5 mb-6 border"
              style={{ backgroundColor: `${NAVY}06`, borderColor: `${NAVY}15` }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: GOLD }}>Your Reference Number</p>
              <p className="text-3xl font-extrabold tracking-wide" style={{ color: NAVY }}>{caseId}</p>
            </div>

            <div className="rounded-lg p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 mb-8">
              <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                We will contact you within 24 hours to discuss your matter.
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">
                Please keep your reference number for future correspondence.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => router.push('/')}
                className="px-8 text-white font-medium"
                style={{ backgroundColor: NAVY }}
              >
                Return to Home
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/intake')}
                className="px-8"
              >
                Submit Another Intake
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-4">
        <p className="text-center text-xs text-gray-400" style={{ fontFamily: 'Playfair Display, serif' }}>
          Legal Excellence Without Limits
        </p>
      </footer>
    </div>
  )
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: '#c9a961', borderTopColor: 'transparent' }} />
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  )
}
