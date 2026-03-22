'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (authError) throw authError

      // Get user profile to determine role (use maybeSingle)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle()

      if (profileError) {
        console.error('Profile error:', profileError)
        throw new Error('Could not load profile')
      }

      if (!profile) {
        throw new Error('Profile not found. Please contact support.')
      }

      // Redirect based on role
      if (profile.role === 'attorney') {
        router.push('/attorney/office')
      } else if (profile.role === 'admin') {
        router.push('/admin/dashboard')
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-infinity-cream py-12 px-4">
      <div className="container mx-auto max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <img src="/logo.png" alt="Infinity Legal" className="h-12 mx-auto" />
          </Link>
          <h1 className="text-3xl font-bold text-infinity-navy mb-2">Welcome Back</h1>
          <p className="text-infinity-navy/70">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-lg border border-infinity-gold/20 p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-infinity-navy mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-infinity-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-infinity-navy"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-infinity-navy mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border border-infinity-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-infinity-navy"
                placeholder="Enter your password"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4" />
                <span className="text-infinity-navy/70">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-infinity-navy hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-infinity-navy text-infinity-cream rounded-lg font-semibold hover:bg-infinity-navy/90 disabled:opacity-50"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-infinity-navy/70">
            Don't have an account?{' '}
            <Link href="/signup" className="text-infinity-navy font-medium hover:underline">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
