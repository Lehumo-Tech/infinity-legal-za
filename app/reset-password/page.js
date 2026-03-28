'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [verifying, setVerifying] = useState(true)

  useEffect(() => {
    let mounted = true

    const initializeSession = async () => {
      try {
        // Method 1: Check for PKCE code in query params (from /auth/callback redirect or direct)
        const code = searchParams.get('code')
        if (code) {
          const { data, error: codeError } = await supabase.auth.exchangeCodeForSession(code)
          if (!codeError && data?.session && mounted) {
            setSessionReady(true)
            setVerifying(false)
            return
          }
        }

        // Method 2: Check for hash fragment tokens (from auth callback redirect)
        if (typeof window !== 'undefined' && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')
          const type = hashParams.get('type')

          if (accessToken && type === 'recovery') {
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            })
            if (!sessionError && data?.session && mounted) {
              setSessionReady(true)
              setVerifying(false)
              // Clean up the hash from URL
              window.history.replaceState(null, '', window.location.pathname)
              return
            }
          }
        }

        // Method 3: Listen for PASSWORD_RECOVERY auth state change
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'PASSWORD_RECOVERY' && mounted) {
            setSessionReady(true)
            setVerifying(false)
          }
          if (event === 'SIGNED_IN' && session && mounted) {
            // Also accept a signed-in state (from recovery flow)
            setSessionReady(true)
            setVerifying(false)
          }
        })

        // Method 4: Check if we already have a valid session
        const { data: sessionData } = await supabase.auth.getSession()
        if (sessionData?.session && mounted) {
          setSessionReady(true)
          setVerifying(false)
          return
        }

        // Give auth state change a moment to fire
        setTimeout(() => {
          if (mounted) setVerifying(false)
        }, 5000)

        return () => subscription.unsubscribe()
      } catch (err) {
        console.error('Session initialization error:', err)
        if (mounted) {
          setError('Failed to verify your reset link. Please request a new one.')
          setVerifying(false)
        }
      }
    }

    initializeSession()
    return () => { mounted = false }
  }, [searchParams])

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

      // Sign out after password change so user logs in fresh
      await supabase.auth.signOut()
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
      ) : verifying ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-[3px] border-infinity-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-infinity-navy/50 dark:text-white/50">Verifying your reset link...</p>
          <p className="text-xs text-infinity-navy/30 dark:text-white/30 mt-2">This should only take a moment.</p>
        </div>
      ) : !sessionReady ? (
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⏰</span>
          </div>
          <h2 className="text-lg font-display font-bold text-infinity-navy dark:text-white mb-2">Link Expired or Invalid</h2>
          <p className="text-sm text-infinity-navy/60 dark:text-white/60 mb-4">
            This password reset link has expired or is invalid. Please request a new one.
          </p>
          {error && (
            <p className="text-xs text-red-500 mb-4">{error}</p>
          )}
          <Link 
            href="/forgot-password" 
            className="inline-block px-6 py-3 bg-infinity-navy text-white rounded-xl font-semibold hover:bg-infinity-navy-light transition-colors"
          >
            Request New Reset Link
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
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Updating...
                </span>
              ) : 'Update Password'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-infinity-cream dark:bg-gray-900 py-12 px-4">
      <div className="container mx-auto max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <img src="/logo-icon-256.png" alt="Infinity Legal" className="h-16 mx-auto rounded-xl" />
          </Link>
          <h1 className="text-3xl font-display font-bold text-infinity-navy dark:text-white mb-2">New Password</h1>
          <p className="text-infinity-navy/70 dark:text-white/50 text-sm">Choose a new password for your account</p>
        </div>

        <Suspense fallback={
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 p-8 shadow-sm text-center py-8">
            <div className="w-8 h-8 border-[3px] border-infinity-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-infinity-navy/50 dark:text-white/50">Loading...</p>
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
