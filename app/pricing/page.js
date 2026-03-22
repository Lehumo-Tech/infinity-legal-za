'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function PricingPage() {
  const router = useRouter()
  const [billingCycle, setBillingCycle] = useState('monthly')
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
      credits: '∞',
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
      alert('Please accept the terms and consent to data processing')\n      return
    }

    // PayFast integration - Mock for now
    const checkoutData = {
      plan_id: selectedPlan.id,
      amount: selectedPlan.price,
      return_url: window.location.origin + '/payment/success',
      cancel_url: window.location.origin + '/pricing'
    }

    try {
      const response = await fetch('/api/payment/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutData)
      })

      const data = await response.json()
      
      if (data.paymentUrl) {
        // Redirect to PayFast
        window.location.href = data.paymentUrl
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Payment error. Please try again.')
    }
  }

  return (
    <div className=\"min-h-screen py-12 px-4\">
      {/* Header */}
      <div className=\"container mx-auto max-w-6xl\">
        <div className=\"text-center mb-12\">
          <Link href=\"/\" className=\"text-sm text-infinity-navy/70 hover:text-infinity-navy mb-4 inline-flex items-center gap-1\">
            ← Back to Home
          </Link>
          <h1 className=\"text-5xl font-bold mb-4 text-infinity-navy\">Choose Your Plan</h1>
          <p className=\"text-xl text-infinity-navy/70\">
            Affordable legal support for every South African
          </p>
        </div>

        {/* Pricing Cards */}
        <div className=\"grid md:grid-cols-4 gap-6 mb-16\">
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
                <div className=\"absolute -top-4 left-1/2 transform -translate-x-1/2\">
                  <span className=\"bg-infinity-gold text-infinity-navy px-4 py-1 rounded-full text-sm font-semibold\">
                    Most Popular
                  </span>
                </div>
              )}

              <div className=\"text-center mb-6\">
                <h3 className=\"text-2xl font-bold mb-2 text-infinity-navy\">{plan.name}</h3>
                <div className=\"mb-4\">
                  <span className=\"text-5xl font-bold text-infinity-navy\">R{plan.price}</span>
                  {plan.price > 0 && <span className=\"text-infinity-navy/70\">/month</span>}
                </div>
                <div className=\"text-sm text-infinity-navy/70\">
                  {plan.credits === '∞' ? 'Unlimited' : plan.credits} consultation credit{plan.credits !== 1 && plan.credits !== '∞' ? 's' : ''}/month
                </div>
              </div>

              <ul className=\"space-y-3 mb-8\">
                {plan.features.map((feature, i) => (
                  <li key={i} className=\"flex items-start gap-2 text-sm\">
                    <span className=\"text-infinity-gold text-lg\">✓</span>
                    <span className=\"text-infinity-navy/80\">{feature}</span>
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

        {/* Disclaimer */}
        <div className=\"bg-amber-50 border border-amber-200 rounded-lg p-6 mb-12\">
          <h3 className=\"font-semibold text-amber-900 mb-2\">💡 Payment Structure</h3>
          <ul className=\"text-sm text-amber-800 space-y-2\">
            <li>
              <strong>Platform Subscription Fees</strong> (R99-R349/month) are paid to Infinity Legal via PayFast. 
              These cover platform access, storage, and support.
            </li>
            <li>
              <strong>Legal Consultation Fees</strong> (R350-R1500/consultation) are paid directly to the attorney's 
              LPC-compliant Trust Account via EFT. Platform never touches legal fees.
            </li>
            <li>
              <strong>Credits</strong> in your subscription can be used to book consultations. If you run out of credits, 
              you can still book consultations by paying the attorney directly.
            </li>
          </ul>
        </div>

        {/* Legal Fee Guide */}
        <div className=\"mb-12\">
          <h2 className=\"text-3xl font-bold mb-6 text-center text-infinity-navy\">Attorney Consultation Fees</h2>
          <p className=\"text-center text-infinity-navy/70 mb-8\">
            These fees are paid directly to attorneys (not to Infinity Legal)
          </p>
          
          <div className=\"grid md:grid-cols-4 gap-4\">
            {[
              { type: '30-min Consultation', range: 'R350 - R800' },
              { type: '60-min Consultation', range: 'R650 - R1500' },
              { type: 'Document Review', range: 'R500 - R2000' },
              { type: 'Court Representation', range: 'R3000 - R15000+' }
            ].map((item, i) => (
              <div key={i} className=\"bg-white border border-infinity-gold/20 rounded-lg p-6 text-center\">
                <div className=\"text-sm text-infinity-navy/70 mb-2\">{item.type}</div>
                <div className=\"text-2xl font-bold text-infinity-gold\">{item.range}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className=\"mb-12\">
          <h2 className=\"text-3xl font-bold mb-8 text-center text-infinity-navy\">Frequently Asked Questions</h2>
          
          <div className=\"space-y-4 max-w-3xl mx-auto\">
            {[
              {
                q: 'How do consultation credits work?',
                a: 'Each credit can be used to book one consultation with a verified attorney. Credits expire at the end of your billing cycle. Unused credits do not roll over.'
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Yes! You can cancel your subscription at any time. You will retain access until the end of your current billing period.'
              },
              {
                q: 'What if I need more than my included credits?',
                a: 'You can book additional consultations by paying the attorney directly via EFT to their trust account. Your subscription gives you discounted rates.'
              },
              {
                q: 'Is my information secure?',
                a: 'Absolutely. We are POPIA compliant, use end-to-end encryption, and all attorneys are LPC-verified. Your data is stored securely in South Africa.'
              },
              {
                q: 'Can I upgrade or downgrade my plan?',
                a: 'Yes! You can change your plan at any time. Upgrades take effect immediately. Downgrades take effect at the end of your current billing cycle.'
              }
            ].map((faq, i) => (
              <details key={i} className=\"bg-white border border-infinity-gold/20 rounded-lg p-6\">
                <summary className=\"font-semibold text-infinity-navy cursor-pointer\">
                  {faq.q}
                </summary>
                <p className=\"mt-3 text-infinity-navy/70\">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {selectedPlan && (
        <div className=\"fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50\">
          <div className=\"bg-white rounded-lg max-w-md w-full p-8\">
            <h3 className=\"text-2xl font-bold mb-4 text-infinity-navy\">
              Subscribe to {selectedPlan.name}
            </h3>
            
            <div className=\"bg-infinity-cream rounded-lg p-6 mb-6\">
              <div className=\"flex justify-between items-center mb-2\">
                <span className=\"text-infinity-navy/70\">Monthly subscription</span>
                <span className=\"text-2xl font-bold text-infinity-navy\">R{selectedPlan.price}</span>
              </div>
              <div className=\"text-sm text-infinity-navy/70\">
                Includes {selectedPlan.credits} consultation credit{selectedPlan.credits !== 1 ? 's' : ''}/month
              </div>
            </div>

            <div className=\"mb-6\">
              <label className=\"flex items-start gap-3 cursor-pointer\">
                <input
                  type=\"checkbox\"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className=\"mt-1 w-4 h-4 text-infinity-navy border-infinity-gold/20 rounded focus:ring-2 focus:ring-infinity-navy\"
                />
                <span className=\"text-sm text-infinity-navy/70\">
                  I agree to the <Link href=\"/terms\" className=\"text-infinity-navy underline\">Terms of Service</Link> and 
                  <Link href=\"/privacy\" className=\"text-infinity-navy underline\"> Privacy Policy</Link>. 
                  I consent to my data being processed in accordance with POPIA Section 72.
                </span>
              </label>
            </div>

            <div className=\"flex gap-4\">
              <button
                onClick={() => setSelectedPlan(null)}
                className=\"flex-1 px-6 py-3 border-2 border-infinity-gold/20 text-infinity-navy rounded-lg font-semibold hover:border-infinity-gold/40\"
              >
                Cancel
              </button>
              <button
                onClick={handleCheckout}
                disabled={!consentChecked}
                className=\"flex-1 px-6 py-3 bg-infinity-navy text-infinity-cream rounded-lg font-semibold hover:bg-infinity-navy/90 disabled:opacity-50 disabled:cursor-not-allowed\"
              >
                Pay with PayFast
              </button>
            </div>

            <p className=\"text-xs text-center text-infinity-navy/70 mt-4\">
              Secure payment processed by PayFast
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
