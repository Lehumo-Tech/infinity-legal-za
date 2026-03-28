'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

function ForgotPasswordForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const urlError = searchParams.get('error')
    if (urlError === 'expired') {
      setError('Your reset link has expired. Please request a new one.')
    } else if (urlError === 'unknown') {
      setError('Something went wrong verifying your link. Please try again.')
    }
  }, [searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery&next=/reset-password`,
      })

      if (resetError) {
        throw new Error(resetError.message)
      }

      setSent(true)
    } catch (err) {
      console.error('Password reset error:', err)
      setError(err.message || 'Failed to send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 p-8 shadow-sm">
      {sent ? (
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-xl font-display font-bold text-infinity-navy dark:text-white mb-2">Check Your Email</h2>
          <p className="text-sm text-infinity-navy/60 dark:text-white/60 mb-4">
            We&apos;ve sent a password reset link to <strong className="text-infinity-navy dark:text-white">{email}</strong>.
            Please check your inbox and spam folder.
          </p>
          <p className="text-xs text-infinity-navy/40 dark:text-white/40 mb-6">
            The link will expire in 1 hour. If you don&apos;t receive the email, click below to try again.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => { setSent(false); setEmail('') }}
              className="w-full py-3 bg-infinity-navy/5 dark:bg-white/5 text-infinity-navy dark:text-white rounded-xl text-sm font-semibold hover:bg-infinity-navy/10 dark:hover:bg-white/10 transition-colors"
            >
              Try a different email
            </button>
            <Link href="/login" className="block text-center text-sm text-infinity-gold font-semibold hover:underline">
              ← Back to Sign In
            </Link>
          </div>
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-infinity-navy/60 dark:text-white/60 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-infinity-navy/10 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-infinity-gold bg-white dark:bg-gray-700 text-infinity-navy dark:text-white"
                placeholder="your@email.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-infinity-navy hover:bg-infinity-navy-light text-white rounded-xl font-semibold disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Sending...
                </span>
              ) : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-infinity-navy/60 dark:text-white/60 hover:text-infinity-navy dark:hover:text-white font-medium">
              ← Back to Sign In
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-infinity-cream dark:bg-gray-900 py-12 px-4">
      <div className="container mx-auto max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <img src="/logo-icon-256.png" alt="Infinity Legal" className="h-16 mx-auto rounded-xl" />
          </Link>
          <h1 className="text-3xl font-display font-bold text-infinity-navy dark:text-white mb-2">Reset Password</h1>
          <p className="text-infinity-navy/70 dark:text-white/50 text-sm">Enter your email and we&apos;ll send you a reset link</p>
        </div>

        <Suspense fallback={
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 p-8 shadow-sm text-center py-8">
            <div className="w-8 h-8 border-[3px] border-infinity-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-infinity-navy/50 dark:text-white/50">Loading...</p>
          </div>
        }>
          <ForgotPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
