'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PLANS } from '@/lib/demo-data'

const COMPARISON = [
  { feature: 'Legal consultations', basic: '2/month', premium: 'Unlimited', business: 'Unlimited' },
  { feature: 'Email support', basic: '✓', premium: '✓', business: '✓' },
  { feature: 'Document review', basic: '✓', premium: '✓', business: '✓' },
  { feature: 'Priority support', basic: '—', premium: '✓', business: '✓' },
  { feature: 'Court representation', basic: '—', premium: '✓', business: '✓' },
  { feature: 'Document drafting', basic: '—', premium: '✓', business: '✓' },
  { feature: 'CCMA representation', basic: '—', premium: '✓', business: '✓' },
  { feature: '24/7 emergency line', basic: '—', premium: '✓', business: '✓' },
  { feature: 'Dedicated attorney', basic: '—', premium: '—', business: '✓' },
  { feature: 'Compliance audit', basic: '—', premium: '—', business: '✓' },
  { feature: 'Contract review', basic: '—', premium: '✓', business: '✓' },
  { feature: 'Monthly legal report', basic: '—', premium: '—', business: '✓' },
]

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-50 backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo-icon-128.png" alt="Infinity Legal" className="h-9 rounded-lg" />
            <span className="text-lg font-bold text-[#0f2b46]" style={{ fontFamily: "'Playfair Display', serif" }}>Infinity Legal</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-[#0f2b46] font-semibold">Login</Link>
            <Link href="/resources" className="text-sm text-[#0f2b46] font-semibold">Resources</Link>
          </div>
        </div>
      </nav>

      <section className="bg-[#0f2b46] py-16 text-center text-white">
        <h1 className="text-4xl md:text-5xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>Choose Your Legal Protection</h1>
        <p className="text-white/60 text-lg mb-6">Simple, transparent pricing. No hidden fees.</p>
        <div className="inline-flex bg-white/10 rounded-full p-1">
          <button onClick={() => setAnnual(false)} className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${!annual ? 'bg-[#c9a961] text-[#0f2b46]' : 'text-white/70'}`}>Monthly</button>
          <button onClick={() => setAnnual(true)} className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${annual ? 'bg-[#c9a961] text-[#0f2b46]' : 'text-white/70'}`}>Annual (Save 20%)</button>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 -mt-8 pb-16">
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map(plan => {
            const price = annual ? Math.round(plan.price * 0.8) : plan.price
            return (
              <div key={plan.id} className={`bg-white rounded-2xl border-2 p-6 shadow-lg transition-all hover:shadow-xl ${plan.popular ? 'border-[#c9a961] relative scale-[1.03]' : 'border-gray-200'}`}>
                {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#c9a961] text-[#0f2b46] text-xs font-bold px-4 py-1 rounded-full">MOST POPULAR</div>}
                <h3 className="text-xl font-bold text-[#0f2b46]">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-2 mb-1">
                  <span className="text-4xl font-bold text-[#0f2b46]">R{price}</span>
                  <span className="text-gray-400">/month</span>
                </div>
                {annual && <p className="text-xs text-green-600 font-semibold">Save R{(plan.price - price) * 12}/year</p>}
                <hr className="my-4 border-gray-100" />
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600"><span className="text-[#c9a961] font-bold mt-0.5">✓</span>{f}</li>
                  ))}
                </ul>
                <Link href="/signup" className={`block text-center py-3 rounded-xl font-bold text-sm transition-colors ${plan.popular ? 'bg-[#c9a961] text-[#0f2b46] hover:bg-[#d4af37]' : 'bg-[#0f2b46] text-white hover:bg-[#1a365d]'}`}>
                  Select Plan
                </Link>
              </div>
            )
          })}
        </div>

        <div className="mt-16">
          <h2 className="text-2xl font-bold text-[#0f2b46] text-center mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>Plan Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0f2b46] text-white">
                  <th className="text-left py-3 px-4 rounded-tl-xl">Feature</th>
                  <th className="py-3 px-4">Basic (R95)</th>
                  <th className="py-3 px-4 bg-[#c9a961] text-[#0f2b46]">Premium (R115)</th>
                  <th className="py-3 px-4 rounded-tr-xl">Business (R130)</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="py-2.5 px-4 font-medium text-gray-700">{row.feature}</td>
                    <td className="py-2.5 px-4 text-center">{row.basic === '✓' ? <span className="text-green-600 font-bold">✓</span> : row.basic === '—' ? <span className="text-gray-300">—</span> : row.basic}</td>
                    <td className="py-2.5 px-4 text-center bg-[#c9a961]/5">{row.premium === '✓' ? <span className="text-green-600 font-bold">✓</span> : row.premium === '—' ? <span className="text-gray-300">—</span> : row.premium}</td>
                    <td className="py-2.5 px-4 text-center">{row.business === '✓' ? <span className="text-green-600 font-bold">✓</span> : row.business === '—' ? <span className="text-gray-300">—</span> : row.business}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <footer className="bg-[#0f2b46] py-8 text-center text-white/40 text-xs">
        <p>© {new Date().getFullYear()} Infinity Legal (Pty) Ltd. All rights reserved.</p>
      </footer>
    </div>
  )
}
