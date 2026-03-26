'use client'

import Link from 'next/link'

export default function Error({ error, reset }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1628] to-[#1a2744] flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="mb-6">
          <img src="/logo.svg" alt="Infinity Legal" className="h-10 mx-auto opacity-70" />
        </div>
        
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-2xl font-display font-bold text-white mb-3">Something Went Wrong</h1>
        <p className="text-white/50 text-sm mb-8">
          We apologize for the inconvenience. An unexpected error has occurred.
          Our team has been notified.
        </p>

        <div className="flex gap-3 justify-center mb-8">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 bg-[#c9a94e] text-[#0a1628] rounded-lg text-sm font-bold hover:bg-[#d4b75e] transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm font-semibold hover:bg-white/20 transition-colors"
          >
            Return Home
          </Link>
        </div>

        <p className="text-white/20 text-xs">
          If this problem persists, please contact us at{' '}
          <a href="mailto:support@infinitylegal.org" className="text-[#c9a94e]/60 hover:text-[#c9a94e]">
            support@infinitylegal.org
          </a>
        </p>
      </div>
    </div>
  )
}
