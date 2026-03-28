'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import NotificationBell from '@/components/NotificationBell'

// =============================================
// INFINITY LEGAL — SCORPION-STYLE LANDING PAGE
// =============================================

const LEGAL_POLICIES = [
  {
    id: 'labour-shield',
    name: 'Labour Shield',
    tagline: 'Employment matters coverage',
    coverageAmount: 'R72 300',
    price: 'R95',
    period: '/month',
    color: 'border-sky-500',
    headerBg: 'bg-sky-600',
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
    headerBg: 'bg-infinity-gold',
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
    headerBg: 'bg-infinity-navy',
    additionalBenefits: [
      'Insurance cover for uncontested divorces and child maintenance',
      'Insurance cover for drafting and execution of antenuptial contracts',
      'Up to 20% discount on property conveyancing fees',
      'Municipal services benefit relating to your place of residence',
      'Legacy Accumulator — lump sum cash loyalty benefit on death of main member',
    ],
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
    coverageTypes: ['Employment Law', 'Civil Law', 'Criminal Law'],
  },
]

// Legal Protection Only

export default function LandingPage() {
  const router = useRouter()
  const { user, isAuthenticated, canAccessPortal } = useAuth()
  const [expandedPolicy, setExpandedPolicy] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [contactForm, setContactForm] = useState({ name: '', phone: '', email: '', isMember: 'no', enquiryType: '', message: '' })
  const [contactSubmitting, setContactSubmitting] = useState(false)
  const [contactSuccess, setContactSuccess] = useState(false)
  const contactRef = useRef(null)

  const scrollToContact = () => {
    contactRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleContactSubmit = async (e) => {
    e.preventDefault()
    setContactSubmitting(true)
    try {
      // Store contact submission
      await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...contactForm, type: 'contact_query', createdAt: new Date().toISOString() }),
      }).catch(() => {})
      setContactSuccess(true)
      setContactForm({ name: '', phone: '', email: '', isMember: 'no', enquiryType: '', message: '' })
      setTimeout(() => setContactSuccess(false), 5000)
    } catch {}
    finally { setContactSubmitting(false) }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">

      {/* ============================================ */}
      {/* TOP BAR — Helpline + Member Login */}
      {/* ============================================ */}
      <div className="bg-infinity-navy text-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4 text-infinity-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            <span className="font-medium text-infinity-gold">Infinity Legal Protection</span>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <NotificationBell />
                <Link href={canAccessPortal ? '/portal' : '/dashboard'} className="text-xs font-semibold bg-infinity-gold text-infinity-navy px-3 py-1.5 rounded hover:bg-yellow-400 transition-colors">
                  {canAccessPortal ? 'Staff Portal' : 'My Account'}
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="text-xs font-semibold bg-white/10 px-3 py-1.5 rounded hover:bg-white/20 transition-colors">
                  Member Login
                </Link>
                <Link href="/login" className="text-xs font-semibold bg-infinity-gold text-infinity-navy px-3 py-1.5 rounded hover:bg-yellow-400 transition-colors hidden sm:block">
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* MAIN NAVIGATION */}
      {/* ============================================ */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo-icon-128.png" alt="Infinity Legal" className="h-10 w-auto rounded-lg" />
            <span className="text-xl font-display font-bold text-infinity-navy dark:text-white hidden sm:block">
              Infinity Legal
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <a href="#policies" className="text-sm font-semibold text-gray-600 hover:text-infinity-navy dark:text-gray-300 dark:hover:text-white transition-colors">Legal Policies</a>
            <Link href="/intake" className="text-sm font-semibold text-gray-600 hover:text-infinity-navy dark:text-gray-300 dark:hover:text-white transition-colors">AI Legal Help</Link>
            <Link href="/resources" className="text-sm font-semibold text-gray-600 hover:text-infinity-navy dark:text-gray-300 dark:hover:text-white transition-colors">Legal Resources</Link>
            <a href="#contact" className="text-sm font-semibold text-gray-600 hover:text-infinity-navy dark:text-gray-300 dark:hover:text-white transition-colors">Contact Us</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/apply" className="hidden md:block text-sm font-bold bg-infinity-gold text-infinity-navy px-5 py-2.5 rounded-lg hover:bg-yellow-400 transition-colors shadow-sm">
              Join Now
            </Link>
            {/* Mobile menu button */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-gray-600 dark:text-gray-300">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-4 py-3 space-y-2">
            <a href="#policies" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Legal Policies</a>
            <Link href="/intake" className="block py-2 text-sm font-semibold text-gray-700 dark:text-gray-300">AI Legal Help</Link>
            <Link href="/resources" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Legal Resources</Link>
            <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Contact Us</a>
            <Link href="/apply" className="block py-2 text-sm font-bold text-infinity-gold">Join Now →</Link>
          </div>
        )}
      </nav>

      {/* ============================================ */}
      {/* HERO SECTION */}
      {/* ============================================ */}
      <section className="relative bg-gradient-to-br from-infinity-navy via-[#0d1f3c] to-[#0a1628] overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-infinity-gold rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24 lg:py-28 relative z-10">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-infinity-gold/10 border border-infinity-gold/30 rounded-full px-4 py-1.5 mb-6">
                <div className="w-2 h-2 bg-infinity-gold rounded-full animate-pulse" />
                <span className="text-infinity-gold text-sm font-semibold">24/7 AI-Powered Legal Help</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-white leading-tight mb-6">
                Legal Protection<br />
                <span className="text-infinity-gold">That Fights For You.</span>
              </h1>
              <p className="text-lg text-white/70 mb-8 max-w-lg leading-relaxed">
                Get affordable legal assistance from our team of tough lawyers. Protect yourself, your family, and your rights — starting from just <strong className="text-white">R95/month</strong>.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/apply" className="inline-flex items-center gap-2 bg-infinity-gold text-infinity-navy px-7 py-3.5 rounded-lg text-sm font-bold hover:bg-yellow-400 transition-all shadow-lg shadow-infinity-gold/25">
                  Join Infinity Legal →
                </Link>
                <Link href="/intake" className="inline-flex items-center gap-2 bg-white/10 text-white px-7 py-3.5 rounded-lg text-sm font-semibold hover:bg-white/20 transition-all border border-white/20">
                  Free AI Intake
                </Link>
              </div>
              {/* Stats */}
              <div className="flex gap-8 mt-10 pt-8 border-t border-white/10">
                <div>
                  <div className="text-2xl font-display font-bold text-infinity-gold">500+</div>
                  <div className="text-xs text-white/50">Verified Attorneys</div>
                </div>
                <div>
                  <div className="text-2xl font-display font-bold text-infinity-gold">&lt;5min</div>
                  <div className="text-xs text-white/50">Average Response</div>
                </div>
                <div>
                  <div className="text-2xl font-display font-bold text-infinity-gold">95%</div>
                  <div className="text-xs text-white/50">Client Satisfaction</div>
                </div>
                <div className="hidden sm:block">
                  <div className="text-2xl font-display font-bold text-infinity-gold">24/7</div>
                  <div className="text-xs text-white/50">Help Line</div>
                </div>
              </div>
            </div>
            <div className="hidden lg:block relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img src="/hero-consultation.png" alt="Legal consultation" className="w-full h-auto rounded-2xl" />
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900">POPIA Compliant</div>
                      <div className="text-[10px] text-gray-500">Your data is safe</div>
                    </div>
                  </div>
                </div>
                <div className="absolute top-4 right-4 bg-infinity-gold text-infinity-navy rounded-xl px-4 py-2 shadow-lg">
                  <div className="text-[10px] font-bold uppercase">Affordable</div>
                  <div className="text-sm font-bold">From R95/mo</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* PRODUCT TABS: Legal Policies / Funeral Plans */}
      {/* ============================================ */}
      <section id="policies" className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-infinity-navy dark:text-white mb-3">
              Infinity Legal offers legal assistance in South Africa
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Get the help you need to fight back legally with our team of tough lawyers.
            </p>
          </div>

          {/* Tab Buttons */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-1">
              <div className="px-8 py-3 rounded-lg text-sm font-bold bg-infinity-navy text-white shadow-md">
                Personal Legal Policies
              </div>
            </div>
          </div>

          <p className="text-center text-gray-500 dark:text-gray-400 mb-10 max-w-3xl mx-auto">
            Infinity Legal offers a range of personal legal policies to suit your individual needs. Our affordable legal solutions give you unlimited access to expert advice through our 24-hour legal contact centre, paralegal assistance, access to tough lawyers, and legal representation in court.
          </p>

          {/* LEGAL POLICIES CARDS */}
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

                  {/* Expanded Details */}
                  {expandedPolicy === policy.id && (
                    <div className="px-6 pb-6 border-t border-gray-100 dark:border-gray-700 pt-4 animate-in slide-in-from-top-2">
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
        </div>
      </section>

      {/* ============================================ */}
      {/* WHY JOIN INFINITY LEGAL */}
      {/* ============================================ */}
      <section className="py-16 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-gradient-to-r from-infinity-navy to-[#1a3055] rounded-2xl p-8 sm:p-12 flex flex-col md:flex-row items-center gap-8">
            <div className="shrink-0 text-6xl">❓</div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-3">
                Why join Infinity Legal?
              </h2>
              <p className="text-white/70 mb-0 text-lg">
                Stop letting others walk all over you. Take a stand. Protect your rights with affordable legal coverage backed by tough South African lawyers.
              </p>
            </div>
            <Link href="/apply" className="shrink-0 bg-infinity-gold text-infinity-navy px-8 py-3.5 rounded-lg font-bold text-sm hover:bg-yellow-400 transition-colors shadow-lg">
              Click here to see how →
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* REFERRAL REWARDS */}
      {/* ============================================ */}
      <section className="py-12 bg-infinity-gold">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-infinity-navy mb-1">
              Get Rewarded For Referrals
            </h2>
            <p className="text-infinity-navy/70">Refer a friend and earn rewards when they join Infinity Legal.</p>
          </div>
          <Link href="/apply" className="shrink-0 bg-infinity-navy text-white px-8 py-3.5 rounded-lg font-bold text-sm hover:bg-[#1a3055] transition-colors shadow-lg">
            Find Out How →
          </Link>
        </div>
      </section>

      {/* ============================================ */}
      {/* AI LEGAL SIDEKICK */}
      {/* ============================================ */}
      <section className="py-16 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-8 sm:p-12 border border-blue-100 dark:border-blue-800/30 flex flex-col md:flex-row items-center gap-8">
            <div className="shrink-0">
              <div className="w-20 h-20 bg-gradient-to-br from-infinity-navy to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-3xl">🤖</span>
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-infinity-navy dark:text-white mb-2">
                Infinity AI is your 24/7 Legal Sidekick
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-base">
                Need help with your policy, legal questions or documents? Our AI assistant is fast, friendly, and always ready to assist. Get instant legal guidance anytime.
              </p>
            </div>
            <Link href="/intake" className="shrink-0 bg-infinity-navy text-white px-8 py-3.5 rounded-lg font-bold text-sm hover:bg-[#1a3055] transition-colors shadow-lg">
              Try AI Intake Free →
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* LEGAL RESOURCES */}
      {/* ============================================ */}
      <section id="resources" className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-display font-bold text-infinity-navy dark:text-white mb-3">Legal Resources</h2>
            <p className="text-gray-500 dark:text-gray-400">Free tools and information to help you understand your legal rights</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: '📚', title: 'Legal Articles', desc: 'Stay informed about your rights', link: '/resources?tab=articles' },
              { icon: '📋', title: 'Contract Templates', desc: 'Free legal contract templates', link: '/resources?tab=templates' },
              { icon: '❓', title: 'FAQs', desc: 'Common legal questions answered', link: '/resources?tab=faqs' },
              { icon: '📄', title: 'Claim Forms', desc: 'Download and submit claims', link: '/resources?tab=claims' },
            ].map((item, i) => (
              <Link key={i} href={item.link} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-infinity-gold/50 transition-all group text-center">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="text-sm font-bold text-infinity-navy dark:text-white group-hover:text-infinity-gold transition-colors mb-1">{item.title}</h3>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* CONTACT US */}
      {/* ============================================ */}
      <section id="contact" ref={contactRef} className="py-16 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-display font-bold text-infinity-navy dark:text-white mb-3">Contact Us</h2>
          </div>

          {/* Contact Methods */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <Link href="/intake" className="bg-infinity-navy rounded-xl p-6 text-center hover:bg-[#1a3055] transition-colors group">
              <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-infinity-gold/20 transition-colors">
                <svg className="w-6 h-6 text-infinity-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
              </div>
              <div className="text-sm font-bold text-white mb-1">AI Legal Help</div>
              <div className="text-xs text-white/60">Get instant assistance</div>
              <div className="text-sm font-bold text-infinity-gold mt-1">Start Now →</div>
            </Link>

            <a href="https://wa.me/27000000000" target="_blank" rel="noopener noreferrer" className="bg-green-600 rounded-xl p-6 text-center hover:bg-green-700 transition-colors group">
              <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-white/20 transition-colors">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </div>
              <div className="text-sm font-bold text-white mb-1">WhatsApp Us</div>
              <div className="text-xs text-white/60">Quick & easy</div>
              <div className="text-sm font-bold text-white mt-1">Chat Now →</div>
            </a>

            <a href="mailto:info@infinitylegal.org" className="bg-blue-600 rounded-xl p-6 text-center hover:bg-blue-700 transition-colors group">
              <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-white/20 transition-colors">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <div className="text-sm font-bold text-white mb-1">Email Us</div>
              <div className="text-xs text-white/60">We reply within 24 hours</div>
              <div className="text-sm font-bold text-white mt-1">info@infinitylegal.org</div>
            </a>

            <Link href="/resources?tab=faqs" className="bg-purple-600 rounded-xl p-6 text-center hover:bg-purple-700 transition-colors group">
              <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-white/20 transition-colors">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div className="text-sm font-bold text-white mb-1">Help Centre</div>
              <div className="text-xs text-white/60">FAQs & Resources</div>
              <div className="text-sm font-bold text-white mt-1">Browse →</div>
            </Link>
          </div>

          {/* Online Query Form */}
          <div className="max-w-2xl mx-auto bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-display font-bold text-infinity-navy dark:text-white mb-2 text-center">Online Query</h3>
            <p className="text-sm text-gray-400 text-center mb-6">
              Complete the form below and we will call you back.
            </p>

            {contactSuccess && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-400 text-center font-semibold">
                ✅ Thank you! We will contact you shortly.
              </div>
            )}

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Full Name *</label>
                  <input type="text" required value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-infinity-gold/50 focus:border-infinity-gold transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Phone Number *</label>
                  <input type="tel" required value={contactForm.phone} onChange={e => setContactForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-infinity-gold/50 focus:border-infinity-gold transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Email</label>
                <input type="email" value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-infinity-gold/50 focus:border-infinity-gold transition-all" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Are you a member?</label>
                  <select value={contactForm.isMember} onChange={e => setContactForm(p => ({ ...p, isMember: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-infinity-gold/50 focus:border-infinity-gold transition-all">
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Enquiry Type</label>
                  <select value={contactForm.enquiryType} onChange={e => setContactForm(p => ({ ...p, enquiryType: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-infinity-gold/50 focus:border-infinity-gold transition-all">
                    <option value="">Select...</option>
                    <option value="legal_advice">Legal Advice</option>
                    <option value="membership">Membership Query</option>
                    <option value="claims">Claims</option>
                    <option value="tax">Income Tax Query</option>
                    <option value="will">Last Will & Testament</option>
                    <option value="complaint">Complaint</option>
                    <option value="compliment">Compliment</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Message</label>
                <textarea rows={4} value={contactForm.message} onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-infinity-gold/50 focus:border-infinity-gold transition-all" />
              </div>
              <button type="submit" disabled={contactSubmitting}
                className="w-full py-3 bg-infinity-navy text-white rounded-lg text-sm font-bold hover:bg-[#1a3055] transition-colors disabled:opacity-50">
                {contactSubmitting ? 'Sending...' : 'Submit Query'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FOOTER */}
      {/* ============================================ */}
      <footer className="bg-infinity-navy text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo-icon-128.png" alt="Infinity Legal" className="h-10 w-auto rounded-lg" />
                <span className="text-lg font-display font-bold">Infinity Legal</span>
              </div>
              <p className="text-sm text-white/50 leading-relaxed">
                Affordable, confidential legal protection for South African families. Backed by tough lawyers.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-bold text-infinity-gold mb-3">Quick Links</h4>
              <div className="space-y-2">
                <Link href="/pricing" className="block text-sm text-white/50 hover:text-white transition-colors">Pricing</Link>
                <Link href="/intake" className="block text-sm text-white/50 hover:text-white transition-colors">AI Legal Help</Link>
                <Link href="/book-consultation" className="block text-sm text-white/50 hover:text-white transition-colors">Book Consultation</Link>
                <Link href="/apply" className="block text-sm text-white/50 hover:text-white transition-colors">Join Now</Link>
                <Link href="/help" className="block text-sm text-white/50 hover:text-white transition-colors">Help Centre</Link>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-bold text-infinity-gold mb-3">Legal</h4>
              <div className="space-y-2">
                <Link href="/terms" className="block text-sm text-white/50 hover:text-white transition-colors">Terms of Service</Link>
                <Link href="/privacy" className="block text-sm text-white/50 hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="/cookie-policy" className="block text-sm text-white/50 hover:text-white transition-colors">Cookie Policy</Link>
                <Link href="/disclaimer" className="block text-sm text-white/50 hover:text-white transition-colors">Disclaimer</Link>
                <Link href="/compliance" className="block text-sm text-white/50 hover:text-white transition-colors">POPIA Compliance</Link>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-bold text-infinity-gold mb-3">Contact</h4>
              <div className="space-y-2">
                <a href="mailto:info@infinitylegal.org" className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  info@infinitylegal.org
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/30">
              © {new Date().getFullYear()} Infinity Legal (Pty) Ltd. All rights reserved. South Africa.
            </p>
            <p className="text-xs text-white/30">
              POPIA Compliant • FSCA Registered
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
