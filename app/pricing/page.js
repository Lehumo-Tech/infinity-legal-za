'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function PricingPage() {
  const router = useRouter()
  const [consentChecked, setConsentChecked] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      credits: 0,
      storage: '0GB',
      features: [
        'AI legal information',
        'Legal templates',
        'Attorney directory',
        'Community support'
      ],
      cta: 'Get Started',
      popular: false
    },
    {
      id: 'starter',
      name: 'Starter',
      price: 99,
      credits: 1,
      storage: '500MB',
      features: [
        '1 consultation credit/month',
        'Case tracking',
        '500MB storage',
        'Email support',
        'Document uploads'
      ],
      cta: 'Start Starter',
      popular: false
    },
    {
      id: 'family',
      name: 'Family Protect',
      price: 199,
      credits: 3,
      storage: '1GB',
      features: [
        '3 consultation credits/month',
        'Document drafting assistance',
        '1GB storage',
        'Priority support',
        'Family member access'
      ],
      cta: 'Protect Your Family',
      popular: true
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 349,
      credits: 999,
      storage: '2GB',
      features: [
        'Unlimited consultations (fair use)',
        'Emergency access',
        '2GB storage',
        '24/7 priority support',
        'Document review',
        'Court date reminders'
      ],
      cta: 'Go Premium',
      popular: false
    }
  ]

  const handleSubscribe = async (plan) => {
    if (plan.id === 'free') {
      router.push('/signup?plan=free')
      return
    }

    setSelectedPlan(plan)
  }

  const handleCheckout = async () => {
    if (!consentChecked) {
      alert('Please accept the terms and consent to data processing')
      return
    }

    const checkoutData = {
      plan_id: selectedPlan.id,
      amount: selectedPlan.price
    }

    try {
      const response = await fetch('/api/payment/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutData)
      })

      const data = await response.json()
      
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Payment error. Please try again.')
    }
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <Link href="/" className="text-sm text-infinity-navy/70 hover:text-infinity-navy mb-4 inline-flex items-center gap-1">
            Back to Home
          </Link>
          <h1 className="text-5xl font-bold mb-4 text-infinity-navy">Choose Your Plan</h1>
          <p className="text-xl text-infinity-navy/70">
            Affordable legal support for every South African
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-lg p-8 border-2 transition-all ${
                plan.popular
                  ? 'border-infinity-gold bg-infinity-gold/5 shadow-xl scale-105'
                  : 'border-infinity-gold/20 bg-white hover:border-infinity-gold/40'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-infinity-gold text-infinity-navy px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2 text-infinity-navy">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-5xl font-bold text-infinity-navy">R{plan.price}</span>
                  {plan.price > 0 && <span className="text-infinity-navy/70">/month</span>}
                </div>
                <div className="text-sm text-infinity-navy/70">
                  {plan.credits === 999 ? 'Unlimited' : plan.credits} consultation credit{plan.credits !== 1 && plan.credits !== 999 ? 's' : ''}/month
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-infinity-gold text-lg">✓</span>
                    <span className="text-infinity-navy/80">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan)}
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  plan.popular
                    ? 'bg-infinity-navy text-infinity-cream hover:bg-infinity-navy/90 shadow-lg'
                    : 'bg-infinity-gold text-infinity-navy hover:bg-infinity-gold/90'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-12">
          <h3 className="font-semibold text-amber-900 mb-2">Payment Structure</h3>
          <ul className="text-sm text-amber-800 space-y-2">
            <li>
              Platform Subscription Fees (R99-R349/month) are paid to Infinity Legal via PayFast.
            </li>
            <li>
              Legal Consultation Fees (R350-R1500/consultation) are paid directly to attorney's Trust Account.
            </li>
          </ul>
        </div>
      </div>

      {selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-8">
            <h3 className="text-2xl font-bold mb-4 text-infinity-navy">
              Subscribe to {selectedPlan.name}
            </h3>
            
            <div className="bg-infinity-cream rounded-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-infinity-navy/70">Monthly subscription</span>
                <span className="text-2xl font-bold text-infinity-navy">R{selectedPlan.price}</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-1 w-4 h-4"
                />
                <span className="text-sm text-infinity-navy/70">
                  I agree to the Terms and Privacy Policy. I consent to POPIA Section 72 data processing.
                </span>
              </label>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setSelectedPlan(null)}
                className="flex-1 px-6 py-3 border-2 border-infinity-gold/20 text-infinity-navy rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCheckout}
                disabled={!consentChecked}
                className="flex-1 px-6 py-3 bg-infinity-navy text-infinity-cream rounded-lg disabled:opacity-50"
              >
                Pay with PayFast
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
