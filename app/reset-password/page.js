'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    // Supabase auto-detects the recovery token from the URL hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true)
      }
    })

    // Also check if we already have a session (user clicked the link)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSessionReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleReset = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) {
        throw new Error(updateError.message)
      }

      setSuccess(true)
      setTimeout(() => router.push('/login'), 3000)
    } catch (err) {
      console.error('Password update error:', err)
      setError(err.message || 'Failed to update password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-infinity-cream dark:bg-gray-900 py-12 px-4">
      <div className="container mx-auto max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <img src="/logo.png" alt="Infinity Legal" className="h-12 mx-auto" />
          </Link>
          <h1 className="text-3xl font-display font-bold text-infinity-navy dark:text-white mb-2">New Password</h1>
          <p className="text-infinity-navy/70 dark:text-white/50 text-sm">Choose a new password for your account</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 p-8 shadow-sm">
          {success ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔑</span>
              </div>
              <h2 className="text-xl font-display font-bold text-infinity-navy dark:text-white mb-2">Password Updated!</h2>
              <p className="text-sm text-infinity-navy/60 dark:text-white/60 mb-4">
                Your password has been successfully changed. Redirecting to login...
              </p>
              <Link href="/login" className="text-sm text-infinity-gold font-semibold hover:underline">
                Go to Sign In →
              </Link>
            </div>
          ) : !sessionReady ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-3 border-infinity-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm text-infinity-navy/50 dark:text-white/50">Verifying your reset link...</p>
              <p className="text-xs text-infinity-navy/30 dark:text-white/30 mt-2">If this takes too long, the link may have expired.</p>
              <Link href="/forgot-password" className="block mt-4 text-sm text-infinity-gold font-semibold hover:underline">
                Request a new reset link
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl text-red-700 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-infinity-navy/60 dark:text-white/60 mb-1.5">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-infinity-navy/10 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-infinity-gold bg-white dark:bg-gray-700 text-infinity-navy dark:text-white"
                    placeholder="Minimum 6 characters"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-infinity-navy/60 dark:text-white/60 mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-infinity-navy/10 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-infinity-gold bg-white dark:bg-gray-700 text-infinity-navy dark:text-white"
                    placeholder="Re-enter your new password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-infinity-navy hover:bg-infinity-navy-light text-white rounded-xl font-semibold disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
