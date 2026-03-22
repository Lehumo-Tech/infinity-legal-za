'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    role: 'client'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
            role: formData.role
          }
        }
      })

      if (authError) throw authError

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: authData.user.id,
          email: formData.email,
          full_name: formData.fullName,
          phone: formData.phone,
          role: formData.role
        }])

      if (profileError) throw profileError

      // Redirect based on role
      if (formData.role === 'attorney') {
        router.push('/attorney/complete-profile')
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError(err.message || 'Signup failed')
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
          <h1 className="text-3xl font-bold text-infinity-navy mb-2">Create Account</h1>
          <p className="text-infinity-navy/70">Join Infinity Legal today</p>
        </div>

        <div className="bg-white rounded-lg border border-infinity-gold/20 p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-infinity-navy mb-2">
                Full Name
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-3 border border-infinity-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-infinity-navy"
                placeholder="John Doe"
              />
            </div>

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
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-infinity-navy mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-infinity-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-infinity-navy"
                placeholder="0821234567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-infinity-navy mb-2">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border border-infinity-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-infinity-navy"
                placeholder="Minimum 6 characters"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-infinity-navy mb-2">
                I am a
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-3 border border-infinity-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-infinity-navy"
              >
                <option value="client">Client (seeking legal help)</option>
                <option value="attorney">Attorney (providing legal services)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-infinity-navy text-infinity-cream rounded-lg font-semibold hover:bg-infinity-navy/90 disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-infinity-navy/70">
            Already have an account?{' '}
            <Link href="/login" className="text-infinity-navy font-medium hover:underline">
              Sign In
            </Link>
          </div>
        </div>

        <p className="text-xs text-center text-infinity-navy/50 mt-4">
          By signing up, you agree to our{' '}
          <Link href="/terms" className="underline">Terms</Link> and{' '}
          <Link href="/privacy" className="underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}
