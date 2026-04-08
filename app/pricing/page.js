'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PLANS, PLAN_DISCLAIMER, CORE_BENEFITS } from '@/lib/demo-data'

export default function PricingPage() {
  const [showRegister, setShowRegister] = useState(false)
  const [registerPlan, setRegisterPlan] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regName, setRegName] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regLegalNeed, setRegLegalNeed] = useState('')
  const [regPopia, setRegPopia] = useState(false)
  const [regSubmitted, setRegSubmitted] = useState(false)
  const [regLoading, setRegLoading] = useState(false)
  const [regMsg, setRegMsg] = useState('')

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!regPopia) return
    setRegLoading(true)
    try {
      const res = await fetch('/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: regEmail, name: regName, phone: regPhone, legal_need: regLegalNeed, plan: registerPlan, source: 'pricing' }) })
      const data = await res.json()
      setRegMsg(data.message)
      setRegSubmitted(true)
    } catch { setRegMsg('Something went wrong.') }
    finally { setRegLoading(false) }
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* CIPC Banner */}
      <div className="bg-amber-50 border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-2 text-xs text-amber-800">
          <span>⚠️</span>
          <span>Infinity Legal (Pty) Ltd — CIPC Registration Pending | <strong>Free Tier Active</strong> — Premium plans launching soon. <button onClick={() => { setRegisterPlan('general'); setShowRegister(true) }} className="underline font-bold">Register Now</button></span>
        </div>
      </div>

      {/* Registration Modal */}
      {showRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowRegister(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowRegister(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl">×</button>
            {regSubmitted ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-3xl">✅</span></div>
                <h3 className="text-xl font-bold text-[#0f2b46] mb-2">You&apos;re All Set!</h3>
                <p className="text-gray-600 text-sm">{regMsg}</p>
                <Link href="/intake" className="inline-block mt-4 px-6 py-2 bg-[#c9a961] text-[#0f2b46] font-bold rounded-lg hover:bg-[#d4af37] transition-colors">Try Free AI Analysis →</Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-[#0f2b46]">Get Started Free</h3>
                  <p className="text-sm text-gray-500 mt-1">Register for: <strong>{registerPlan}</strong></p>
                </div>
                <form onSubmit={handleRegister} className="space-y-3">
                  <input type="text" placeholder="Full Name" value={regName} onChange={e => setRegName(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a961]/50" />
                  <input type="email" placeholder="Email *" required value={regEmail} onChange={e => setRegEmail(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a961]/50" />
                  <input type="tel" placeholder="Phone (optional)" value={regPhone} onChange={e => setRegPhone(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a961]/50" />
                  <select value={regLegalNeed} onChange={e => setRegLegalNeed(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a961]/50 text-gray-700">
                    <option value="">What legal matter do you need help with?</option>
                    <option value="CCMA">CCMA / Unfair Dismissal</option>
                    <option value="Labour Dispute">Labour Dispute</option>
                    <option value="Divorce">Divorce / Family</option>
                    <option value="Eviction">Eviction / Housing</option>
                    <option value="Criminal">Criminal Matter</option>
                    <option value="Custody">Child Custody / Maintenance</option>
                    <option value="Debt Review">Debt Review / Collections</option>
                    <option value="Consumer">Consumer Complaint</option>
                    <option value="Property">Property / Contract</option>
                    <option value="General">General Legal Enquiry</option>
                    <option value="Other">Other</option>
                  </select>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" required checked={regPopia} onChange={e => setRegPopia(e.target.checked)} className="mt-1 rounded border-gray-300" />
                    <span className="text-xs text-gray-500">I consent to processing per POPIA. <Link href="/privacy" className="text-[#c9a961] hover:underline">Privacy Policy</Link></span>
                  </label>
                  <button type="submit" disabled={regLoading || !regPopia} className="w-full py-3 bg-[#c9a961] text-[#0f2b46] font-bold rounded-lg hover:bg-[#d4af37] disabled:opacity-50">{regLoading ? 'Registering...' : 'Register Now →'}</button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      <nav className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo-icon-128.png" alt="Infinity Legal" className="h-9 rounded-lg" />
            <span className="text-lg font-bold text-[#0f2b46]" style={{ fontFamily: "'Playfair Display', serif" }}>Infinity Legal</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/intake" className="text-sm text-[#c9a961] font-bold hover:text-[#0f2b46]">Free Legal Analysis</Link>
            <Link href="/login" className="text-sm px-4 py-2 bg-[#0f2b46] text-white rounded-lg font-semibold hover:bg-[#1a365d]">Login</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-16">
        {/* Hero Banner with Image */}
        <div className="relative bg-[#0f2b46] rounded-3xl overflow-hidden mb-12 shadow-xl">
          <div className="absolute inset-0">
            <img src="https://images.unsplash.com/photo-1573164574572-cb89e39749b4?w=1200&q=80" alt="" className="w-full h-full object-cover opacity-15" />
          </div>
          <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center p-8 md:p-12">
            <div>
              <h1 className="text-4xl font-bold text-white mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>Protection Plans</h1>
              <p className="text-white/70 text-lg">Choose the legal protection that matches your needs. <strong className="text-[#c9a961]">Unlimited legal support</strong> on all plans.</p>
            </div>
            <div className="hidden md:flex justify-end">
              <div className="rounded-2xl overflow-hidden shadow-xl border-2 border-white/20 max-w-[280px]">
                <img src="https://images.pexels.com/photos/5668768/pexels-photo-5668768.jpeg?auto=compress&cs=tinysrgb&w=600" alt="Legal professional" className="w-full h-48 object-cover" />
              </div>
            </div>
          </div>
        </div>

        {/* Core Benefits */}
        <div className="bg-[#0f2b46] rounded-2xl p-6 mb-10 text-white">
          <h3 className="text-sm font-bold text-[#c9a961] uppercase tracking-wider mb-3">Core Benefits — Included on All Plans</h3>
          <div className="grid md:grid-cols-2 gap-2">
            {CORE_BENEFITS.map((b, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-white/80">
                <span className="text-[#c9a961]">✓</span>{b}
              </div>
            ))}
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {PLANS.map((plan) => (
            <div key={plan.id} className={`relative bg-white rounded-2xl border-2 overflow-hidden transition-all hover:shadow-xl ${plan.popular ? 'border-[#c9a961] shadow-lg' : 'border-gray-200'}`}>
              {plan.popular && (
                <div className="bg-[#c9a961] text-[#0f2b46] text-xs font-bold text-center py-1.5 uppercase tracking-wider">Most Popular</div>
              )}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{plan.emoji}</span>
                  <h3 className="text-xl font-bold text-[#0f2b46]" style={{ fontFamily: "'Playfair Display', serif" }}>{plan.name}</h3>
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-bold text-[#0f2b46]">R{plan.price}</span>
                  <span className="text-gray-400 text-sm">/month</span>
                </div>
                <p className="text-xs text-[#c9a961] font-bold mb-5">Unlimited legal support</p>

                <h4 className="text-xs font-bold text-[#0f2b46] uppercase tracking-wider mb-2">Included Matters:</h4>
                <ul className="space-y-2 mb-4">
                  {(plan.features || plan.coverage?.included || []).map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-green-500 mt-0.5 font-bold text-base">✓</span>{f}
                    </li>
                  ))}
                </ul>

                {plan.coverage?.excluded && (
                  <div className="pt-3 border-t border-gray-100 mb-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Exclusions:</h4>
                    <ul className="space-y-1.5">
                      {plan.coverage.excluded.map((e, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                          <span className="text-red-400 mt-0.5">✗</span>{e}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {plan.additionalBenefits && plan.additionalBenefits.length > 0 && (
                  <div className="pt-3 border-t border-gray-100 mb-5">
                    <h4 className="text-xs font-bold text-[#c9a961] uppercase tracking-wider mb-2">Additional Benefits:</h4>
                    {plan.additionalBenefits.map((b, i) => (
                      <p key={i} className="text-xs text-gray-600 flex items-center gap-1 mb-1"><span className="text-[#c9a961]">★</span> {b}</p>
                    ))}
                  </div>
                )}

                <button onClick={() => { setRegisterPlan(plan.name); setShowRegister(true) }} className={`block w-full text-center py-3 rounded-xl font-bold text-sm transition-colors ${plan.popular ? 'bg-[#c9a961] text-[#0f2b46] hover:bg-[#d4af37]' : 'bg-[#0f2b46] text-white hover:bg-[#1a365d]'}`}>
                  Get Started — {plan.name}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Reference Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm mb-8">
          <h3 className="text-xl font-bold text-[#0f2b46] p-6 border-b border-gray-100" style={{ fontFamily: "'Playfair Display', serif" }}>Quick Reference Table</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0f2b46] text-white">
                  <th className="py-3 px-4 text-left">Feature</th>
                  <th className="py-3 px-4">⚖️ Civil R99</th>
                  <th className="py-3 px-4 bg-[#c9a961] text-[#0f2b46]">💼 Labour R99</th>
                  <th className="py-3 px-4">🌟 Extensive R139</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Unlimited Consultations', true, true, true],
                  ['Civil Matters', true, false, true],
                  ['Labour Matters', false, true, true],
                  ['Criminal Matters', false, false, true],
                  ['Document Preparation', true, true, true],
                  ['24-hour Contact Centre', true, true, true],
                  ['Free Will & Testament', true, true, true],
                  ['Family Plan', true, true, true],
                  ['Tax Advice', true, true, true],
                  ['Tax Submission', false, false, true],
                  ['ANC Services', false, false, true],
                  ['Conveyancing Discount', false, false, true],
                  ['Priority Handling', false, false, true],
                ].map(([feature, civil, labour, ext], i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="py-2.5 px-4 font-medium text-[#0f2b46]">{feature}</td>
                    <td className="py-2.5 px-4 text-center">{typeof civil === 'string' ? <span className="font-bold text-[#0f2b46]">{civil}</span> : civil ? <span className="text-green-500 font-bold">✓</span> : <span className="text-red-300">✗</span>}</td>
                    <td className="py-2.5 px-4 text-center bg-[#c9a961]/5">{typeof labour === 'string' ? <span className="font-bold text-[#0f2b46]">{labour}</span> : labour ? <span className="text-green-500 font-bold">✓</span> : <span className="text-red-300">✗</span>}</td>
                    <td className="py-2.5 px-4 text-center">{typeof ext === 'string' ? <span className="font-bold text-[#0f2b46]">{ext}</span> : ext ? <span className="text-green-500 font-bold">✓</span> : <span className="text-red-300">✗</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Important Info */}
        <div className="max-w-5xl mx-auto p-5 bg-gray-50 rounded-xl border border-gray-200 mb-8">
          <h4 className="font-semibold text-[#0f2b46] mb-2">Implementation Notes</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>✓ <strong>Billing:</strong> Monthly debit order / EFT / card</li>
            <li>✓ <strong>Waiting Period:</strong> 30 days for pre-existing matters; immediate for new matters</li>
            <li>✓ <strong>Claims Process:</strong> Contact 24/7 centre → case logged → specialist assigned within 24h</li>
            <li>✓ <strong>Plan:</strong> Main member, spouse/life partner, and children under 21</li>
            <li>✓ <strong>Review Period:</strong> 31 days — cancel for full refund</li>
            <li>✗ <strong>Exclusions:</strong> Matters arising before membership, frivolous claims</li>
          </ul>
        </div>

        <div className="bg-[#0f2b46]/5 border-l-4 border-[#0f2b46] p-4 rounded-r-xl">
          <p className="text-sm text-[#0f2b46]">{PLAN_DISCLAIMER}</p>
        </div>
      </main>

      <footer className="bg-[#0f2b46] text-white py-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-white/50">© {new Date().getFullYear()} Infinity Legal (Pty) Ltd. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
