'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [popia, setPopia] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!popia) return
    setLoading(true)
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          phone: form.phone,
          name: form.name,
          plan: 'general',
          source: 'signup',
        }),
      })
      const data = await res.json()
      setMessage(data.message || 'You have been added to the waitlist!')
      setSubmitted(true)
    } catch {
      setMessage('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* CIPC Banner */}
      <div className="bg-amber-50 border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-2 text-xs text-amber-800">
          <span>⚠️</span>
          <span>CIPC Registration Pending | <strong>Free Tier Active</strong> — Premium plans launching soon</span>
        </div>
      </div>

      <nav className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo-icon-128.png" alt="Infinity Legal" className="h-9 rounded-lg" />
            <span className="text-lg font-bold text-[#0f2b46]" style={{ fontFamily: "'Playfair Display', serif" }}>Infinity Legal</span>
          </Link>
          <Link href="/login" className="text-sm text-[#0f2b46] font-semibold">Already a member? Login</Link>
        </div>
      </nav>

      <main className="max-w-lg mx-auto px-4 py-12">
        {submitted ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h2 className="text-2xl font-bold text-[#0f2b46] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>You&apos;re on the list!</h2>
            <p className="text-gray-600 text-sm mb-4">{message}</p>
            <p className="text-xs text-gray-400 mb-6">We&apos;ll notify you as soon as premium plans launch after CIPC approval.</p>
            <div className="flex gap-3 justify-center">
              <Link href="/intake" className="px-6 py-2.5 bg-[#c9a961] text-[#0f2b46] font-bold rounded-lg hover:bg-[#d4af37] transition-colors text-sm">
                Try Free AI Analysis →
              </Link>
              <Link href="/" className="px-6 py-2.5 border-2 border-gray-200 text-gray-600 font-bold rounded-lg hover:bg-gray-50 transition-colors text-sm">
                Back to Home
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full mb-3">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Free Tier • No Payment Required
              </div>
              <h1 className="text-3xl font-bold text-[#0f2b46]" style={{ fontFamily: "'Playfair Display', serif" }}>Join Infinity Legal</h1>
              <p className="text-gray-500 text-sm mt-2">Get early access to our legal platform. Join the waitlist and try our free AI legal analysis today.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                  <input
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    placeholder="e.g. Thabo Mbeki"
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#c9a961]/50 focus:border-[#c9a961] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                    placeholder="your.email@example.com"
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#c9a961]/50 focus:border-[#c9a961] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number (optional)</label>
                  <input
                    value={form.phone}
                    onChange={e => setForm({...form, phone: e.target.value})}
                    placeholder="+27 82 123 4567"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#c9a961]/50 focus:border-[#c9a961] transition-all"
                  />
                </div>

                {/* POPIA Consent */}
                <div className="pt-2 border-t border-gray-100">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={popia}
                      onChange={e => setPopia(e.target.checked)}
                      className="mt-1 rounded border-gray-300 text-[#c9a961] focus:ring-[#c9a961]"
                    />
                    <span className="text-xs text-gray-500">
                      I consent to the processing of my personal information in accordance with the Protection of Personal Information Act (POPIA).
                      I have read and agree to the{' '}
                      <Link href="/privacy" className="text-[#c9a961] font-semibold hover:underline">Privacy Policy</Link>
                      {' '}and{' '}
                      <Link href="/terms" className="text-[#c9a961] font-semibold hover:underline">Terms of Service</Link>.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading || !popia}
                  className="w-full py-3 bg-[#c9a961] text-[#0f2b46] font-bold rounded-xl hover:bg-[#d4af37] disabled:opacity-50 transition-colors text-sm"
                >
                  {loading ? 'Joining...' : 'Join Waitlist — Free Access →'}
                </button>
              </form>

              <p className="text-center text-xs text-gray-400 mt-4">
                Already a member? <Link href="/login" className="text-[#c9a961] font-semibold hover:text-[#0f2b46]">Login here</Link>
              </p>
            </div>

            {/* What You Get */}
            <div className="mt-6 bg-[#0f2b46] rounded-2xl p-5 text-white">
              <h3 className="text-sm font-bold text-[#c9a961] mb-3">What you get with Free Tier:</h3>
              <div className="space-y-2">
                {[
                  'AI-powered legal analysis of your situation',
                  'Legal category identification & relevant legislation',
                  'Recommended next steps and timeline estimates',
                  'Early access notification when premium plans launch',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-white/80">
                    <span className="text-[#c9a961]">✓</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
