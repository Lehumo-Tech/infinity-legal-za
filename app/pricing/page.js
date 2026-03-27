'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import NotificationBell from '@/components/NotificationBell'

const LEGAL_POLICIES = [
  {
    id: 'labour-shield',
    name: 'Labour Shield',
    tagline: 'Employment matters coverage',
    coverageAmount: 'R72 300',
    price: 'R95',
    period: '/month',
    color: 'border-sky-500',
    features: [
      'Insurance cover for employment-related legal matters',
      'Access to experienced legal specialists who will attempt to resolve your issues without going to court',
      '24-hour legal assistance via our Legal Help Line',
      'Access to our online member portal, WhatsApp and LiveChat',
      'R11 000 payout in the case of accidental death of the main member',
      'Free last will and testament drawn up for the main member',
      'Insurance cover for the main member, spouse/life partner and children under 21',
      'Pay no premiums for up to 12 months if retrenched or permanently disabled',
      'Extended Family Protection: Add parents and parents-in-law at a small additional premium',
      'Personal Income Tax advice',
    ],
    coverageTypes: ['Employment Law'],
  },
  {
    id: 'civil-guard',
    name: 'Civil Guard',
    tagline: 'Civil matters coverage',
    coverageAmount: 'R78 500',
    price: 'R115',
    period: '/month',
    popular: true,
    color: 'border-infinity-gold',
    features: [
      'Insurance cover for civil-related legal matters',
      'Access to experienced legal specialists who will attempt to resolve your issues without going to court',
      '24-hour legal assistance via our Legal Help Line',
      'Access to our online member portal, WhatsApp and LiveChat',
      'R16 500 payout in the case of accidental death of the main member',
      'Free last will and testament drawn up for the main member',
      'Insurance cover for the main member, spouse/life partner and children under 21',
      'Pay no premiums for up to 12 months if retrenched or permanently disabled',
      'Extended Family Protection: Add parents and parents-in-law at a small additional premium',
      'Personal Income Tax advice and assistance',
    ],
    coverageTypes: ['Civil Law'],
  },
  {
    id: 'complete-cover',
    name: 'Complete Cover',
    tagline: 'Our most comprehensive policy',
    coverageAmount: 'R100 000',
    price: 'R130',
    period: '/month',
    color: 'border-infinity-navy',
    features: [
      'Insurance cover for employment, civil and criminal-related legal matters PLUS additional benefits',
      'Access to experienced legal specialists who will attempt to resolve your issues without going to court',
      '24-hour legal assistance via our Legal Help Line',
      'Access to our online member portal, WhatsApp and LiveChat',
      'R22 000 payout in the case of accidental death of the main member',
      'Free last will and testament drawn up for the main member',
      'Insurance cover for the main member, spouse/life partner and children under 21',
      'Pay no premiums for up to 12 months if retrenched or permanently disabled',
      'Extended Family Protection: Add parents and parents-in-law at a small additional premium',
      'Personal Income Tax advice, assistance PLUS additional tax submission services',
    ],
    additionalBenefits: [
      'Insurance cover for uncontested divorces, child maintenance, rescission of administration and debt review orders',
      'Insurance cover for drafting, lodgement, and execution of antenuptial contracts',
      'Up to 20% discount on property conveyancing fees',
      'A municipal services benefit relating specifically to your place of residence',
      'Legacy Accumulator — A lump sum cash loyalty benefit in the event of the main member\'s death',
    ],
    coverageTypes: ['Employment Law', 'Civil Law', 'Criminal Law'],
  },
]

const FUNERAL_PLANS = [
  {
    id: 'funeral-a', name: 'Funeral Plan A', payout: 'R10 000', price: 'R55', period: '/month',
    features: ['Cash payout within 48 hours of receiving all documents', 'Backed by tough lawyers for legal aspects', 'Cover for main member, spouse and children', 'Simple claims process'],
  },
  {
    id: 'funeral-b', name: 'Funeral Plan B', payout: 'R15 000', price: 'R82', period: '/month',
    features: ['Cash payout within 48 hours of receiving all documents', 'Backed by tough lawyers for legal aspects', 'Cover for main member, spouse and children', 'Simple claims process', 'Extended family cover option'],
  },
  {
    id: 'funeral-c', name: 'Funeral Plan C', payout: 'R20 000', price: 'R110', period: '/month',
    features: ['Cash payout within 48 hours of receiving all documents', 'Backed by tough lawyers for legal aspects', 'Cover for main member, spouse and children', 'Simple claims process', 'Extended family cover option', 'Repatriation assistance'],
  },
]

export default function PricingPage() {
  const { isAuthenticated, canAccessPortal } = useAuth()
  const [activeTab, setActiveTab] = useState('legal')
  const [expandedPolicy, setExpandedPolicy] = useState(null)

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Top Bar */}
      <div className="bg-infinity-navy text-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4 text-infinity-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            <span className="hidden sm:inline font-medium">24-Hour Legal Help Line</span>
            <a href="tel:0860000000" className="font-bold text-infinity-gold hover:text-white transition-colors">0860 000 000</a>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link href={canAccessPortal ? '/portal' : '/dashboard'} className="text-xs font-semibold bg-infinity-gold text-infinity-navy px-3 py-1.5 rounded hover:bg-yellow-400 transition-colors">
                {canAccessPortal ? 'Staff Portal' : 'My Account'}
              </Link>
            ) : (
              <Link href="/login" className="text-xs font-semibold bg-white/10 px-3 py-1.5 rounded hover:bg-white/20 transition-colors">Member Login</Link>
            )}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 h-16">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Infinity Legal" className="h-9 w-auto" />
            <span className="text-xl font-display font-bold text-infinity-navy dark:text-white hidden sm:block">Infinity Legal</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/#policies" className="text-sm font-semibold text-gray-600 hover:text-infinity-navy transition-colors">Legal Policies</Link>
            <Link href="/#funeral" className="text-sm font-semibold text-gray-600 hover:text-infinity-navy transition-colors">Funeral Plans</Link>
            <Link href="/intake" className="text-sm font-semibold text-gray-600 hover:text-infinity-navy transition-colors">AI Legal Help</Link>
            <Link href="/#contact" className="text-sm font-semibold text-gray-600 hover:text-infinity-navy transition-colors">Contact Us</Link>
          </div>
          <Link href="/apply" className="text-sm font-bold bg-infinity-gold text-infinity-navy px-5 py-2.5 rounded-lg hover:bg-yellow-400 transition-colors shadow-sm">
            Join Now
          </Link>
        </div>
      </nav>

      {/* Header */}
      <section className="bg-gradient-to-br from-infinity-navy to-[#0a1628] py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-4">
            Choose Your Legal Protection
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Affordable legal policies designed for South African families. Get covered from just R95/month.
          </p>
        </div>
      </section>

      {/* Tab Buttons */}
      <section className="py-12 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center mb-10">
            <div className="inline-flex bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-1">
              <button onClick={() => setActiveTab('legal')}
                className={`px-8 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'legal' ? 'bg-infinity-navy text-white shadow-md' : 'text-gray-500 hover:text-infinity-navy'}`}>
                Personal Legal Policies
              </button>
              <button onClick={() => setActiveTab('funeral')}
                className={`px-8 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'funeral' ? 'bg-infinity-navy text-white shadow-md' : 'text-gray-500 hover:text-infinity-navy'}`}>
                Funeral Plans
              </button>
            </div>
          </div>

          {/* LEGAL POLICIES */}
          {activeTab === 'legal' && (
            <>
              <p className="text-center text-gray-500 mb-10 max-w-3xl mx-auto">
                Our affordable legal solutions give you unlimited access to expert advice through our 24-hour legal contact centre, paralegal assistance, access to tough lawyers, and legal representation in court.
              </p>
              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {LEGAL_POLICIES.map(policy => (
                  <div key={policy.id} className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-t-4 ${policy.color} overflow-hidden relative ${policy.popular ? 'ring-2 ring-infinity-gold' : ''}`}>
                    {policy.popular && (
                      <div className="absolute top-0 right-0 bg-infinity-gold text-infinity-navy text-[10px] font-bold px-3 py-1 rounded-bl-lg">MOST POPULAR</div>
                    )}
                    <div className="p-6 pb-4">
                      <h3 className="text-lg font-display font-bold text-infinity-navy dark:text-white mb-1">{policy.name}</h3>
                      <p className="text-xs text-gray-400 mb-4">{policy.tagline}</p>
                      <div className="text-xs text-gray-400 mb-1">Up to</div>
                      <div className="text-3xl font-display font-bold text-infinity-navy dark:text-white mb-1">{policy.coverageAmount}</div>
                      <div className="text-xs text-gray-400 mb-4">per case</div>
                      <div className="flex items-baseline gap-1 mb-6">
                        <span className="text-2xl font-bold text-infinity-navy dark:text-white">{policy.price}</span>
                        <span className="text-sm text-gray-400">{policy.period}</span>
                      </div>
                      <div className="flex gap-2 mb-4">
                        <button onClick={() => setExpandedPolicy(expandedPolicy === policy.id ? null : policy.id)}
                          className="flex-1 py-2.5 border-2 border-infinity-navy dark:border-white text-infinity-navy dark:text-white rounded-lg text-xs font-bold hover:bg-infinity-navy hover:text-white dark:hover:bg-white dark:hover:text-infinity-navy transition-all">
                          {expandedPolicy === policy.id ? 'Close' : 'Read more'}
                        </button>
                        <Link href="/apply" className="flex-1 py-2.5 bg-infinity-gold text-infinity-navy rounded-lg text-xs font-bold text-center hover:bg-yellow-400 transition-colors shadow-sm">
                          Join Now
                        </Link>
                      </div>
                    </div>
                    {expandedPolicy === policy.id && (
                      <div className="px-6 pb-6 border-t border-gray-100 dark:border-gray-700 pt-4">
                        <p className="text-xs text-gray-600 dark:text-gray-300 mb-3 font-medium">{policy.features[0]}</p>
                        <div className="space-y-2">
                          {policy.features.slice(1).map((feature, i) => (
                            <div key={i} className="flex gap-2 items-start">
                              <div className="w-1 h-1 bg-infinity-gold rounded-full mt-1.5 shrink-0" />
                              <span className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">{feature}</span>
                            </div>
                          ))}
                        </div>
                        {policy.additionalBenefits && (
                          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                            <div className="text-[10px] font-bold text-infinity-gold uppercase mb-2">Additional Benefits</div>
                            {policy.additionalBenefits.map((b, i) => (
                              <div key={i} className="flex gap-2 items-start mb-1.5">
                                <svg className="w-3 h-3 text-infinity-gold shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                <span className="text-[11px] text-gray-500 dark:text-gray-400">{b}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="text-[9px] text-gray-300 dark:text-gray-600 mt-4 italic">
                          Membership terms, conditions and limitations apply. Please refer to the membership agreement.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* FUNERAL PLANS */}
          {activeTab === 'funeral' && (
            <>
              <p className="text-center text-gray-500 mb-10 max-w-3xl mx-auto">
                Our funeral plans provide you and your family with the financial means to bury your loved ones with dignity, and the backing of our tough lawyers to help you with the legal aspects.
              </p>
              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {FUNERAL_PLANS.map(plan => (
                  <div key={plan.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="bg-infinity-navy p-5 text-center">
                      <h3 className="text-lg font-display font-bold text-white mb-1">{plan.name}</h3>
                      <p className="text-xs text-white/60">Funeral benefit cash payout of</p>
                    </div>
                    <div className="p-6 text-center">
                      <div className="text-4xl font-display font-bold text-infinity-navy dark:text-white mb-2">{plan.payout}</div>
                      <div className="flex items-baseline justify-center gap-1 mb-6">
                        <span className="text-xl font-bold text-gray-700 dark:text-gray-200">{plan.price}</span>
                        <span className="text-sm text-gray-400">{plan.period}</span>
                      </div>
                      <ul className="text-left space-y-2 mb-6">
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex gap-2 items-start text-xs text-gray-500 dark:text-gray-400">
                            <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            {f}
                          </li>
                        ))}
                      </ul>
                      <Link href="/apply" className="block w-full py-3 bg-infinity-gold text-infinity-navy rounded-lg text-sm font-bold hover:bg-yellow-400 transition-colors shadow-sm">
                        Find Out More
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Comparison Table */}
          <div className="mt-16 max-w-5xl mx-auto">
            <h3 className="text-2xl font-display font-bold text-infinity-navy dark:text-white text-center mb-8">Compare Policies</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-infinity-navy dark:border-infinity-gold">
                    <th className="text-left py-3 px-4 text-gray-500 font-semibold">Feature</th>
                    <th className="text-center py-3 px-4 font-bold text-infinity-navy dark:text-white">Labour Shield</th>
                    <th className="text-center py-3 px-4 font-bold text-infinity-gold">Civil Guard</th>
                    <th className="text-center py-3 px-4 font-bold text-infinity-navy dark:text-white">Complete Cover</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'Monthly Premium', ls: 'R95', cg: 'R115', cc: 'R130' },
                    { feature: 'Coverage per Case', ls: 'R72,300', cg: 'R78,500', cc: 'R100,000' },
                    { feature: 'Employment Law', ls: true, cg: false, cc: true },
                    { feature: 'Civil Law', ls: false, cg: true, cc: true },
                    { feature: 'Criminal Law', ls: false, cg: false, cc: true },
                    { feature: '24-Hour Help Line', ls: true, cg: true, cc: true },
                    { feature: 'Free Will & Testament', ls: true, cg: true, cc: true },
                    { feature: 'Accidental Death Benefit', ls: 'R11,000', cg: 'R16,500', cc: 'R22,000' },
                    { feature: 'Tax Submission Services', ls: false, cg: false, cc: true },
                    { feature: 'Divorce & Maintenance', ls: false, cg: false, cc: true },
                    { feature: 'Conveyancing Discount', ls: false, cg: false, cc: '20%' },
                    { feature: 'Legacy Accumulator', ls: false, cg: false, cc: true },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">{row.feature}</td>
                      {[row.ls, row.cg, row.cc].map((val, j) => (
                        <td key={j} className="py-3 px-4 text-center">
                          {val === true ? (
                            <svg className="w-5 h-5 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          ) : val === false ? (
                            <svg className="w-5 h-5 text-gray-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          ) : (
                            <span className="font-semibold text-infinity-navy dark:text-white">{val}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-infinity-gold">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-infinity-navy mb-3">Ready to protect your rights?</h2>
          <p className="text-infinity-navy/70 mb-6">Join thousands of South Africans who trust Infinity Legal for their legal protection.</p>
          <div className="flex gap-4 justify-center">
            <Link href="/apply" className="bg-infinity-navy text-white px-8 py-3.5 rounded-lg font-bold text-sm hover:bg-[#1a3055] transition-colors shadow-lg">
              Join Now →
            </Link>
            <a href="tel:0860000000" className="bg-white text-infinity-navy px-8 py-3.5 rounded-lg font-bold text-sm hover:bg-gray-100 transition-colors shadow-lg">
              Call 0860 000 000
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-infinity-navy text-white py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Infinity Legal" className="h-6 w-auto brightness-200" />
            <span className="text-sm font-display font-bold">Infinity Legal</span>
          </div>
          <div className="flex gap-4 text-xs text-white/40">
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/compliance" className="hover:text-white transition-colors">POPIA</Link>
          </div>
          <p className="text-xs text-white/30">© {new Date().getFullYear()} Infinity Legal (Pty) Ltd</p>
        </div>
      </footer>
    </div>
  )
}
