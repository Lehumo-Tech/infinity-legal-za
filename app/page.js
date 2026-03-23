'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import NotificationBell from '@/components/NotificationBell'

export default function LandingPage() {
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading } = useAuth()

  return (
    <div className="min-h-screen">
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
            <Link href="/pricing" className="text-sm font-medium text-infinity-navy/60 hover:text-infinity-navy transition-colors hidden sm:block">
              Pricing
            </Link>
            <Link href="/attorney/signup" className="text-sm font-medium text-infinity-navy/60 hover:text-infinity-navy transition-colors hidden sm:block">
              For Attorneys
            </Link>
            {isAuthenticated ? (
              <>
                <NotificationBell />
                <Link href="/dashboard" className="text-sm font-medium text-infinity-navy/60 hover:text-infinity-navy transition-colors">
                  Dashboard
                </Link>
              </>
            ) : (
              <Link href="/login" className="text-sm font-medium text-infinity-navy/60 hover:text-infinity-navy transition-colors">
                Sign In
              </Link>
            )}
            <Link href="/apply"
              className="px-5 py-2.5 bg-infinity-navy text-white rounded-xl text-sm font-semibold hover:bg-infinity-navy-light shadow-sm hover:shadow-md transition-all focus-brand">
              Apply Now
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 lg:py-28 px-4 bg-gradient-to-b from-infinity-cream to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-infinity-gold/10 text-infinity-navy text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-infinity-gold rounded-full animate-pulse"></span>
            24/7 AI-Powered Legal Help
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight text-infinity-navy tracking-tight">
            Solve Your Legal Problem
            <span className="block text-infinity-gold mt-2">in Minutes.</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-infinity-navy/60 mb-10 max-w-2xl mx-auto font-sans leading-relaxed">
            Get instant guidance from our AI legal assistant, then connect with verified South African attorneys. 
            Affordable. Confidential. POPIA compliant.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
            <button
              onClick={() => router.push('/apply')}
              className="px-8 py-4 bg-infinity-navy text-white rounded-xl text-lg font-semibold hover:bg-infinity-navy-light shadow-lg hover:shadow-xl transition-all focus-brand"
            >
              Apply for Legal Services →
            </button>
            <button
              onClick={() => router.push('/intake')}
              className="px-8 py-4 bg-infinity-gold text-infinity-navy rounded-xl text-lg font-semibold hover:bg-infinity-gold-light shadow-sm hover:shadow-md transition-all focus-brand"
            >
              Free AI Intake
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-10 border-t border-infinity-navy/10">
            <div>
              <div className="text-3xl font-bold text-infinity-gold font-display">500+</div>
              <div className="text-sm text-infinity-navy/50 font-sans mt-1">Verified Attorneys</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-infinity-gold font-display">&lt;5min</div>
              <div className="text-sm text-infinity-navy/50 font-sans mt-1">Average Response</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-infinity-gold font-display">95%</div>
              <div className="text-sm text-infinity-navy/50 font-sans mt-1">Client Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 lg:py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-infinity-navy mb-3">How It Works</h2>
            <p className="text-infinity-navy/50 font-sans max-w-lg mx-auto">Three simple steps to legal clarity</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: '💬', title: '1. Tell Us Your Problem', desc: 'Answer a few simple questions. Our AI understands legal issues in plain language. No signup required to start.', time: 'Takes 2-3 minutes' },
              { icon: '🤖', title: '2. Get Instant Guidance', desc: 'Our AI analyzes your case and provides immediate next steps, relevant legislation, and estimated costs.', time: 'Instant results' },
              { icon: '⚖️', title: '3. Connect with Attorney', desc: 'Choose from matched, LPC-verified attorneys. Book consultations or get full representation.', time: 'Same-day appointments' },
            ].map((step, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 border border-infinity-navy/10 shadow-sm hover:shadow-lg hover:border-infinity-gold/30 transition-all duration-300 group">
                <div className="w-14 h-14 bg-infinity-gold/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-infinity-gold/20 transition-colors">
                  <span className="text-2xl">{step.icon}</span>
                </div>
                <h3 className="text-xl font-display font-semibold mb-3 text-infinity-navy">{step.title}</h3>
                <p className="text-infinity-navy/60 font-sans leading-relaxed">{step.desc}</p>
                <div className="mt-4 text-sm text-infinity-gold font-semibold font-sans">{step.time}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Practice Areas */}
      <section className="py-20 lg:py-24 px-4 bg-infinity-cream">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-infinity-navy mb-3">We Handle All Legal Matters</h2>
            <p className="text-infinity-navy/50 font-sans max-w-lg mx-auto">From criminal defense to commercial disputes</p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: '🚔', name: 'Criminal Law', desc: 'Arrests, charges, bail' },
              { icon: '👨‍👩‍👧', name: 'Family Law', desc: 'Divorce, custody, maintenance' },
              { icon: '💼', name: 'Labour Law', desc: 'Dismissal, CCMA disputes' },
              { icon: '🏠', name: 'Property Law', desc: 'Evictions, transfers, disputes' },
              { icon: '💰', name: 'Debt Recovery', desc: 'Collections, insolvency' },
              { icon: '📄', name: 'Civil Litigation', desc: 'Contracts, damages claims' },
              { icon: '🏢', name: 'Commercial Law', desc: 'Business disputes, contracts' },
              { icon: '🏛️', name: 'Administrative', desc: 'Government, licensing' },
            ].map((area, i) => (
              <div key={i} onClick={() => router.push('/intake')} className="bg-white rounded-xl p-6 border border-infinity-navy/10 hover:border-infinity-gold/40 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group">
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">{area.icon}</div>
                <h3 className="font-display font-semibold mb-1 text-infinity-navy">{area.name}</h3>
                <p className="text-sm text-infinity-navy/50 font-sans">{area.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 lg:py-24 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-infinity-navy mb-3">Simple, Honest Pricing</h2>
          <p className="text-infinity-navy/50 font-sans mb-10 max-w-lg mx-auto">
            Legal coverage from just R80/month. No hidden fees.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 mb-8">
            {[
              { name: 'Shield', price: 80, coverage: 'R5,000', icon: '🛡️' },
              { name: 'Guardian', price: 100, coverage: 'R10,000', icon: '⚖️', popular: true },
              { name: 'Advocate', price: 110, coverage: 'R12,000', icon: '🏛️' },
            ].map((plan, i) => (
              <div key={i} className={`rounded-2xl p-6 border-2 ${plan.popular ? 'border-infinity-gold bg-infinity-gold/5 shadow-lg' : 'border-infinity-navy/10 bg-white shadow-sm'} transition-all`}>
                <span className="text-3xl">{plan.icon}</span>
                <h3 className="font-display font-bold text-infinity-navy mt-2">{plan.name}</h3>
                <div className="text-3xl font-bold text-infinity-navy mt-1">R{plan.price}<span className="text-sm font-normal text-infinity-navy/40">/mo</span></div>
                <p className="text-sm text-infinity-success font-semibold mt-2">Covers up to {plan.coverage}</p>
              </div>
            ))}
          </div>
          <Link href="/pricing" className="text-infinity-navy font-semibold underline underline-offset-4 hover:text-infinity-gold transition-colors font-sans">
            View full pricing details →
          </Link>
        </div>
      </section>

      {/* Emergency Section */}
      <section className="py-16 lg:py-20 px-4 bg-infinity-error/5 border-y border-infinity-error/20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-infinity-error/10 text-infinity-error text-sm font-semibold mb-4">
            <span className="w-2 h-2 bg-infinity-error rounded-full animate-pulse"></span>
            Emergency Legal Help
          </div>
          <h2 className="text-3xl font-display font-bold text-infinity-navy mb-4">Been Arrested? Facing Eviction? Court Tomorrow?</h2>
          <p className="text-lg text-infinity-navy/60 font-sans mb-8 max-w-xl mx-auto">
            Our AI detects urgent cases and connects you with on-call attorneys immediately.
          </p>
          <button
            onClick={() => router.push('/intake?urgent=true')}
            className="px-8 py-4 bg-infinity-error text-white rounded-xl text-lg font-semibold hover:bg-infinity-error/90 shadow-lg hover:shadow-xl transition-all focus-brand"
          >
            Get Emergency Help Now
          </button>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-24 px-4 bg-brand-gradient text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">Ready to Solve Your Legal Problem?</h2>
          <p className="text-lg text-white/70 font-sans mb-10 max-w-lg mx-auto">
            No credit card required. Start with our free AI intake.
          </p>
          <button
            onClick={() => router.push('/intake')}
            className="px-8 py-4 bg-infinity-gold text-infinity-navy rounded-xl text-lg font-semibold hover:bg-infinity-gold-light shadow-lg hover:shadow-xl transition-all focus-brand"
          >
            Start Now — It's Free →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-infinity-navy/10 py-14 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src="/logo.png" alt="Infinity Legal" className="h-10 w-auto" />
                <span className="font-display font-bold text-lg text-infinity-navy">Infinity Legal</span>
              </div>
              <p className="text-sm text-infinity-navy/50 font-sans leading-relaxed">
                Democratizing legal access in South Africa through AI and verified attorneys.
              </p>
            </div>
            
            <div>
              <h4 className="font-display font-semibold text-infinity-navy mb-4">Legal</h4>
              <ul className="space-y-2.5 text-sm font-sans">
                <li><Link href="/privacy" className="text-infinity-navy/50 hover:text-infinity-navy transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-infinity-navy/50 hover:text-infinity-navy transition-colors">Terms of Service</Link></li>
                <li><Link href="/disclaimer" className="text-infinity-navy/50 hover:text-infinity-navy transition-colors">Legal Disclaimer</Link></li>
                <li><Link href="/cookie-policy" className="text-infinity-navy/50 hover:text-infinity-navy transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-display font-semibold text-infinity-navy mb-4">For Attorneys</h4>
              <ul className="space-y-2.5 text-sm font-sans">
                <li><Link href="/attorney/signup" className="text-infinity-navy/50 hover:text-infinity-navy transition-colors">Join Our Network</Link></li>
                <li><Link href="/attorney/login" className="text-infinity-navy/50 hover:text-infinity-navy transition-colors">Attorney Login</Link></li>
                <li><Link href="/attorney/verification" className="text-infinity-navy/50 hover:text-infinity-navy transition-colors">Verification Process</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-display font-semibold text-infinity-navy mb-4">Support</h4>
              <ul className="space-y-2.5 text-sm font-sans">
                <li><Link href="/help" className="text-infinity-navy/50 hover:text-infinity-navy transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="text-infinity-navy/50 hover:text-infinity-navy transition-colors">Contact Us</Link></li>
                <li><a href="mailto:support@infinitylegal.org" className="text-infinity-navy/50 hover:text-infinity-navy transition-colors">support@infinitylegal.org</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-infinity-navy/10 pt-8 text-center text-sm text-infinity-navy/40 font-sans">
            <p>© 2026 Infinity Legal. All rights reserved. | Registered in South Africa | POPIA Compliant</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
