'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { demoAuth } from '@/lib/demo-auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setTimeout(() => {
      const result = demoAuth.login(email, password)
      if (result.success) {
        router.push(result.redirect)
      } else {
        setError(result.error)
      }
      setLoading(false)
    }, 500)
  }

  const quickLogin = (em) => {
    setEmail(em)
    setPassword('demo123')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo-icon-128.png" alt="Infinity Legal" className="h-9 rounded-lg" />
            <span className="text-lg font-bold text-[#0f2b46]" style={{ fontFamily: "'Playfair Display', serif" }}>Infinity Legal</span>
          </Link>
          <Link href="/signup" className="text-sm text-[#c9a961] font-semibold hover:text-[#0f2b46]">Join Now →</Link>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src="/logo-icon-256.png" alt="Infinity Legal" className="h-16 mx-auto rounded-xl mb-4" />
            <h1 className="text-2xl font-bold text-[#0f2b46]" style={{ fontFamily: "'Playfair Display', serif" }}>Welcome Back</h1>
            <p className="text-gray-500 text-sm">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
            {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">{error}</div>}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your.email@example.com" required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#c9a961]/50 focus:border-[#c9a961] transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#c9a961]/50 focus:border-[#c9a961] transition-all" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-[#0f2b46] text-white font-bold rounded-xl hover:bg-[#1a365d] disabled:opacity-50 transition-colors">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <p className="text-center text-sm text-gray-500">Don't have an account? <Link href="/signup" className="text-[#c9a961] font-semibold hover:text-[#0f2b46]">Join Now</Link></p>
          </form>

          <div className="mt-6 bg-[#0f2b46] rounded-2xl p-5 text-white">
            <h3 className="text-sm font-bold text-[#c9a961] mb-3">Demo Credentials</h3>
            <div className="space-y-2">
              {[
                { label: 'Member', email: 'member@demo.com', icon: '👤' },
                { label: 'Attorney', email: 'attorney@infinitylegal.org', icon: '⚖️' },
                { label: 'Admin', email: 'tsatsi@infinitylegal.org', icon: '🔑' },
              ].map(d => (
                <button key={d.email} onClick={() => quickLogin(d.email)} className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group">
                  <span>{d.icon}</span>
                  <div className="flex-1">
                    <span className="text-xs font-bold text-white/80">{d.label}</span>
                    <span className="block text-xs text-white/50">{d.email}</span>
                  </div>
                  <span className="text-xs text-white/30 group-hover:text-[#c9a961] transition-colors">Click to fill</span>
                </button>
              ))}
              <p className="text-xs text-white/40 mt-2">Password for all: <code className="text-[#c9a961]">demo123</code></p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
