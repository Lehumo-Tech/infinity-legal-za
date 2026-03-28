'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PLANS } from '@/lib/demo-data'

export default function SignupPage() {
  const [step, setStep] = useState(1)
  const [selectedPlan, setSelectedPlan] = useState('premium')
  const [form, setForm] = useState({ name: '', email: '', phone: '', idNumber: '' })
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '' })
  const router = useRouter()

  const handleComplete = (e) => {
    e.preventDefault()
    alert('✅ Welcome to Infinity Legal!\n\nYour account has been created successfully.\nCheck your email for login details.\n\nPlan: ' + PLANS.find(p => p.id === selectedPlan)?.name + '\nEmail: ' + form.email)
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo-icon-128.png" alt="Infinity Legal" className="h-9 rounded-lg" />
            <span className="text-lg font-bold text-[#0f2b46]" style={{ fontFamily: "'Playfair Display', serif" }}>Infinity Legal</span>
          </Link>
          <Link href="/login" className="text-sm text-[#0f2b46] font-semibold">Already a member? Login</Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-10">
        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {['Select Plan', 'Your Details', 'Payment'].map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-[#0f2b46] text-white' : 'bg-gray-200 text-gray-500'}`}>{step > i + 1 ? '✓' : i + 1}</div>
              <span className={`text-sm font-medium hidden sm:block ${step === i + 1 ? 'text-[#0f2b46]' : 'text-gray-400'}`}>{label}</span>
              {i < 2 && <div className="w-8 md:w-20 h-0.5 bg-gray-200 mx-2"><div className={`h-full bg-[#0f2b46] transition-all ${step > i + 1 ? 'w-full' : 'w-0'}`} /></div>}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {/* Step 1: Select Plan */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-[#0f2b46] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Select Your Plan</h2>
              <div className="space-y-3">
                {PLANS.map(plan => (
                  <button key={plan.id} onClick={() => setSelectedPlan(plan.id)} className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedPlan === plan.id ? 'border-[#c9a961] bg-[#c9a961]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[#0f2b46]">{plan.name}</span>
                        {plan.popular && <span className="ml-2 text-xs bg-[#c9a961] text-[#0f2b46] px-2 py-0.5 rounded-full font-bold">POPULAR</span>}
                      </div>
                      <span className="text-lg font-bold text-[#0f2b46]">R{plan.price}<span className="text-sm text-gray-400 font-normal">/mo</span></span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{plan.features.slice(0, 3).join(' • ')}</p>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(2)} className="w-full mt-6 py-3 bg-[#0f2b46] text-white font-bold rounded-xl hover:bg-[#1a365d] transition-colors">Continue →</button>
            </div>
          )}

          {/* Step 2: Personal Details */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-[#0f2b46] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Your Details</h2>
              <div className="space-y-4">
                <div><label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Thabo Mbeki" required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#c9a961]/50" /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="your.email@example.com" required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#c9a961]/50" /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+27 82 123 4567" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#c9a961]/50" /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-1">SA ID Number</label><input value={form.idNumber} onChange={e => setForm({...form, idNumber: e.target.value})} placeholder="0001015009088" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#c9a961]/50" /></div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50">← Back</button>
                <button onClick={() => setStep(3)} className="flex-1 py-3 bg-[#0f2b46] text-white font-bold rounded-xl hover:bg-[#1a365d]">Continue →</button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <form onSubmit={handleComplete}>
              <h2 className="text-xl font-bold text-[#0f2b46] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Payment Details</h2>
              <div className="bg-gray-50 rounded-xl p-4 mb-4 flex items-center justify-between">
                <span className="text-sm text-gray-600">Plan: <strong>{PLANS.find(p => p.id === selectedPlan)?.name}</strong></span>
                <span className="font-bold text-[#0f2b46]">R{PLANS.find(p => p.id === selectedPlan)?.price}/mo</span>
              </div>
              <div className="space-y-4">
                <div><label className="block text-sm font-semibold text-gray-700 mb-1">Card Number</label><input value={card.number} onChange={e => setCard({...card, number: e.target.value})} placeholder="4242 4242 4242 4242" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#c9a961]/50" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-semibold text-gray-700 mb-1">Expiry</label><input value={card.expiry} onChange={e => setCard({...card, expiry: e.target.value})} placeholder="12/28" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#c9a961]/50" /></div>
                  <div><label className="block text-sm font-semibold text-gray-700 mb-1">CVV</label><input value={card.cvv} onChange={e => setCard({...card, cvv: e.target.value})} placeholder="123" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#c9a961]/50" /></div>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">🔒 Your payment is secured with 256-bit encryption. This is a demo — no real charge.</p>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setStep(2)} className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50">← Back</button>
                <button type="submit" className="flex-1 py-3 bg-[#c9a961] text-[#0f2b46] font-bold rounded-xl hover:bg-[#d4af37]">Complete Signup ✓</button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
