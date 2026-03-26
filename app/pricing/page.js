'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import NotificationBell from '@/components/NotificationBell'

const PLAN_META = {
  'labour shield': {
    displayName: 'Labour Shield',
    tagline: 'Labour law protection',
    icon: '💼',
    description: 'Labour Law',
    coverageLimit: 'R72,300',
    color: 'from-slate-50 to-white',
    borderColor: 'border-infinity-navy/10',
    btnClass: 'bg-infinity-navy text-white hover:bg-infinity-navy-light',
  },
  'civil guard': {
    displayName: 'Civil Guard',
    tagline: 'Civil matters coverage',
    icon: '📄',
    description: 'Civil Matters',
    coverageLimit: 'R78,500',
    color: 'from-infinity-gold/5 to-white',
    borderColor: 'border-infinity-gold',
    btnClass: 'bg-infinity-gold text-infinity-navy hover:bg-infinity-gold-light',
    popular: true,
  },
  'complete cover': {
    displayName: 'Complete Cover',
    tagline: 'Full spectrum legal protection',
    icon: '🛡️',
    description: 'Civil, Labour, Foreign Nationals, Estate & more',
    coverageLimit: 'R100,000',
    color: 'from-infinity-navy/5 to-white',
    borderColor: 'border-infinity-navy/20',
    btnClass: 'bg-infinity-navy text-white hover:bg-infinity-navy-light',
  },
  // Legacy plan names (fallback)
  shield: {
    displayName: 'Labour Shield',
    tagline: 'Labour law protection',
    icon: '💼',
    description: 'Labour Law',
    coverageLimit: 'R72,300',
    color: 'from-slate-50 to-white',
    borderColor: 'border-infinity-navy/10',
    btnClass: 'bg-infinity-navy text-white hover:bg-infinity-navy-light',
  },
  guardian: {
    displayName: 'Civil Guard',
    tagline: 'Civil matters coverage',
    icon: '📄',
    description: 'Civil Matters',
    coverageLimit: 'R78,500',
    color: 'from-infinity-gold/5 to-white',
    borderColor: 'border-infinity-gold',
    btnClass: 'bg-infinity-gold text-infinity-navy hover:bg-infinity-gold-light',
    popular: true,
  },
  advocate: {
    displayName: 'Complete Cover',
    tagline: 'Full spectrum legal protection',
    icon: '🛡️',
    description: 'Civil, Labour, Foreign Nationals, Estate & more',
    coverageLimit: 'R100,000',
    color: 'from-infinity-navy/5 to-white',
    borderColor: 'border-infinity-navy/20',
    btnClass: 'bg-infinity-navy text-white hover:bg-infinity-navy-light',
  },
}

export default function PricingPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [consentChecked, setConsentChecked] = useState(false)

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch('/api/plans')
        const data = await res.json()
        setPlans(data.plans || [])
      } catch (err) {
        console.error('Failed to fetch plans:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPlans()
  }, [])

  const handleSubscribe = (plan) => {
    if (isAuthenticated) {
      setSelectedPlan(plan)
    } else {
      router.push(`/signup?plan=${plan.name}`)
    }
  }

  const handleCheckout = async () => {
    if (!consentChecked) {
      alert('Please accept the terms and consent to data processing')
      return
    }
    // PayFast integration placeholder — on hold
    alert(`Subscription to ${PLAN_META[selectedPlan.name]?.displayName || selectedPlan.name} plan confirmed! Payment integration coming soon.`)
    setSelectedPlan(null)
    setConsentChecked(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-infinity-cream to-white">
      {/* Navigation */}
      <nav className="border-b border-infinity-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex h-16 items-center px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Infinity Legal" className="h-9 w-auto" />
            <span className="text-xl font-display font-semibold text-infinity-navy">
              Infinity Legal
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-4">
            {isAuthenticated && <NotificationBell />}
            <Link href="/" className="text-sm font-medium text-infinity-navy/60 hover:text-infinity-navy transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-infinity-gold/10 text-infinity-navy text-sm font-medium mb-6">
          <span className="w-2 h-2 bg-infinity-gold rounded-full"></span>
          Startup-Friendly Pricing
        </div>
        <h1 className="text-4xl sm:text-5xl font-display font-bold text-infinity-navy mb-4 tracking-tight">
          Legal Protection <span className="text-infinity-gold">Made Simple</span>
        </h1>
        <p className="text-lg text-infinity-navy/60 max-w-2xl mx-auto font-sans leading-relaxed">
          Affordable legal coverage for every South African. Choose a plan that fits your needs — 
          no complex packages, just honest protection.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-infinity-gold/20 flex items-center justify-center animate-pulse">
              <span className="text-2xl">⚖️</span>
            </div>
            <p className="text-infinity-navy/60">Loading plans...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {plans.map((plan) => {
              const meta = PLAN_META[plan.name] || {}
              const isPopular = meta.popular
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border-2 bg-gradient-to-b ${meta.color || 'from-white to-white'} ${
                    isPopular ? `${meta.borderColor} shadow-xl scale-[1.02]` : `${meta.borderColor || 'border-gray-200'} shadow-sm hover:shadow-lg`
                  } transition-all duration-300 overflow-hidden`}
                >
                  {/* Popular Badge */}
                  {isPopular && (
                    <div className="absolute top-0 left-0 right-0">
                      <div className="bg-infinity-gold text-infinity-navy text-center py-1.5 text-xs font-bold uppercase tracking-wider">
                        Most Popular
                      </div>
                    </div>
                  )}

                  <div className={`p-8 ${isPopular ? 'pt-12' : ''}`}>
                    {/* Plan Header */}
                    <div className="text-center mb-6">
                      <span className="text-4xl mb-3 block">{meta.icon}</span>
                      <h3 className="text-2xl font-display font-bold text-infinity-navy mb-1">
                        {meta.displayName || plan.name}
                      </h3>
                      <p className="text-sm text-infinity-navy/50 font-sans">
                        {meta.tagline}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="text-center mb-6 pb-6 border-b border-infinity-navy/10">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-sm text-infinity-navy/50 font-medium">R</span>
                        <span className="text-5xl font-bold text-infinity-navy tracking-tight">{plan.price_zar}</span>
                        <span className="text-sm text-infinity-navy/50 font-medium">/month</span>
                      </div>
                      <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-infinity-success/10 text-infinity-success text-sm font-semibold">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Covers up to {meta.coverageLimit || 'See details'}
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 mb-8">
                      {(plan.features || []).map((feature, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm font-sans">
                          <span className="mt-0.5 w-5 h-5 rounded-full bg-infinity-gold/20 text-infinity-gold flex items-center justify-center flex-shrink-0 text-xs font-bold">✓</span>
                          <span className="text-infinity-navy/70">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <button
                      onClick={() => handleSubscribe(plan)}
                      className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 focus-brand ${
                        meta.btnClass || 'bg-infinity-navy text-white hover:bg-infinity-navy-light'
                      } ${isPopular ? 'shadow-lg hover:shadow-xl' : 'shadow-sm hover:shadow-md'}`}
                    >
                      Get {meta.displayName || plan.name}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Payment Info */}
        <div className="mt-12 grid sm:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-infinity-navy/10 p-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💳</span>
              <div>
                <h4 className="font-display font-semibold text-infinity-navy mb-1">How Payment Works</h4>
                <p className="text-sm text-infinity-navy/60 font-sans leading-relaxed">
                  Monthly subscription fees are processed securely via PayFast (coming soon). 
                  Attorney consultation fees are paid separately to the attorney's trust account.
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-infinity-navy/10 p-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <h4 className="font-display font-semibold text-infinity-navy mb-1">POPIA Compliant</h4>
                <p className="text-sm text-infinity-navy/60 font-sans leading-relaxed">
                  Your personal data is protected in accordance with the Protection of Personal Information Act. 
                  We never share your information without consent.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-display font-bold text-infinity-navy text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              { q: 'What does "coverage up to" mean?', a: 'Each plan covers legal costs up to the specified amount per matter. If your case requires more, your attorney will discuss additional fees with you upfront.' },
              { q: 'Can I upgrade my plan later?', a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.' },
              { q: 'Is there a contract?', a: 'No long-term contracts. All plans are month-to-month. Cancel anytime with no penalties.' },
              { q: 'What happens if I need a consultation?', a: 'Use our AI intake tool to describe your situation, then book a consultation with a verified attorney directly through the platform.' },
            ].map((faq, i) => (
              <details key={i} className="bg-white rounded-xl border border-infinity-navy/10 overflow-hidden group">
                <summary className="px-6 py-4 font-medium text-infinity-navy cursor-pointer flex items-center justify-between font-sans hover:bg-infinity-cream/50 transition-colors">
                  {faq.q}
                  <svg className="w-5 h-5 text-infinity-navy/40 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-6 pb-4 text-sm text-infinity-navy/60 font-sans leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>

      {/* Subscription Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && setSelectedPlan(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <div className="text-center mb-6">
              <span className="text-4xl mb-2 block">{PLAN_META[selectedPlan.name]?.icon}</span>
              <h3 className="text-2xl font-display font-bold text-infinity-navy">
                Subscribe to {PLAN_META[selectedPlan.name]?.displayName}
              </h3>
              <p className="text-sm text-infinity-navy/50 mt-1 font-sans">{PLAN_META[selectedPlan.name]?.tagline}</p>
            </div>

            <div className="bg-infinity-cream rounded-xl p-5 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-infinity-navy/60 font-sans">Monthly subscription</span>
                <span className="text-3xl font-bold text-infinity-navy">R{selectedPlan.price_zar}</span>
              </div>
              <div className="text-xs text-infinity-navy/40 font-sans">
                Covers up to {PLAN_META[selectedPlan.name]?.coverageLimit || 'See details'}
              </div>
            </div>

            <div className="mb-6">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-infinity-navy/30 text-infinity-navy focus:ring-infinity-gold"
                />
                <span className="text-sm text-infinity-navy/60 font-sans leading-relaxed group-hover:text-infinity-navy/80 transition-colors">
                  I agree to the <Link href="#" className="text-infinity-navy underline">Terms of Service</Link> and{' '}
                  <Link href="#" className="text-infinity-navy underline">Privacy Policy</Link>. I consent to data 
                  processing in accordance with POPIA Section 72.
                </span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setSelectedPlan(null); setConsentChecked(false) }}
                className="flex-1 px-6 py-3 border-2 border-infinity-navy/10 text-infinity-navy rounded-xl font-medium hover:border-infinity-navy/30 transition-colors font-sans"
              >
                Cancel
              </button>
              <button
                onClick={handleCheckout}
                disabled={!consentChecked}
                className="flex-1 px-6 py-3 bg-infinity-navy text-white rounded-xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-infinity-navy-light transition-colors focus-brand font-sans"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
