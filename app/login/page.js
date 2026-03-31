'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { demoAuth } from '@/lib/demo-auth'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoMode, setDemoMode] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (demoMode) {
      // Demo auth (localStorage)
      setTimeout(() => {
        const result = demoAuth.login(email, password)
        if (result.success) {
          router.push(result.redirect)
        } else {
          setError(result.error)
        }
        setLoading(false)
      }, 500)
    } else {
      // Real Supabase auth
      try {
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
        if (authError) {
          setError(authError.message)
        } else if (data?.user) {
          router.push('/portal')
        }
      } catch (err) {
        setError('Network error. Please try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  const quickLogin = (em) => {
    setDemoMode(true)
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
          <div className="flex items-center gap-3">
            <Link href="/intake" className="text-sm text-[#c9a961] font-bold hover:text-[#0f2b46]">Free Legal Analysis</Link>
            <Link href="/signup" className="text-sm text-[#0f2b46] font-semibold hover:text-[#c9a961]">Join Now →</Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex">
        {/* Left - Image Panel (hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-[#0f2b46]">
          <img src="https://images.pexels.com/photos/5668768/pexels-photo-5668768.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Professional legal advisor" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f2b46] via-[#0f2b46]/50 to-transparent" />
          <div className="absolute bottom-12 left-8 right-8 text-white z-10">
            <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>Legal Excellence <span className="text-[#c9a961]">Without Limits</span></h2>
            <p className="text-white/70 text-sm mb-4">Access your member portal, track your legal matters, and connect with your dedicated legal advisor — all in one place.</p>
            <div className="flex gap-4 text-xs text-white/50">
              <span>✓ Court Representation</span>
              <span>✓ Family Cover</span>
              <span>✓ 24/7 Support</span>
            </div>
          </div>
        </div>
        {/* Right - Login Form */}
        <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src="/logo-icon-256.png" alt="Infinity Legal" className="h-16 mx-auto rounded-xl mb-4" />
            <h1 className="text-2xl font-bold text-[#0f2b46]" style={{ fontFamily: "'Playfair Display', serif" }}>Welcome Back</h1>
            <p className="text-gray-500 text-sm">Sign in to your account</p>
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <button 
              onClick={() => setDemoMode(false)} 
              className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${!demoMode ? 'bg-[#0f2b46] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              Real Login
            </button>
            <button 
              onClick={() => setDemoMode(true)} 
              className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${demoMode ? 'bg-[#c9a961] text-[#0f2b46]' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              Demo Mode
            </button>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
            {demoMode && (
              <div className="bg-[#c9a961]/10 border border-[#c9a961]/30 rounded-lg px-3 py-2 text-xs text-[#78621e] font-medium text-center">
                Demo Mode — Using mock data for presentation
              </div>
            )}
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
            <p className="text-center text-sm text-gray-500">Don&apos;t have an account? <Link href="/signup" className="text-[#c9a961] font-semibold hover:text-[#0f2b46]">Join Now</Link></p>
          </form>

          {/* Demo Quick Login */}
          {demoMode && (
            <div className="mt-6 bg-[#0f2b46] rounded-2xl p-5 text-white">
              <h3 className="text-sm font-bold text-[#c9a961] mb-3">Demo Quick Login</h3>
              <div className="space-y-2">
                {[
                  { label: 'Member', email: 'member@demo.com', icon: '👤' },
                  { label: 'Legal Advisor', email: 'advisor@infinitylegal.org', icon: '⚖️' },
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
          )}
        </div>
        </div>
      </main>
    </div>
  )
}
