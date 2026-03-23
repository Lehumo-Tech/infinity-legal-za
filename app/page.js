'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
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

      {/* Hero Section — Split Layout with Family Consultation Image */}
      <section className="relative overflow-hidden bg-gradient-to-br from-infinity-cream via-white to-infinity-gold/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center py-16 lg:py-24">
            {/* Left: Text Content */}
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-infinity-gold/10 text-infinity-navy text-sm font-medium mb-6">
                <span className="w-2 h-2 bg-infinity-gold rounded-full animate-pulse"></span>
                24/7 AI-Powered Legal Help
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-display font-bold mb-6 leading-[1.15] text-infinity-navy tracking-tight">
                Legal Help That
                <span className="block text-infinity-gold mt-1">Feels Like Home.</span>
              </h1>
              
              <p className="text-lg text-infinity-navy/60 mb-8 max-w-lg font-sans leading-relaxed">
                Get instant guidance from our AI legal assistant, then connect with verified South African attorneys — all from the comfort of your living room.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <button
                  onClick={() => router.push('/apply')}
                  className="px-7 py-3.5 bg-infinity-navy text-white rounded-xl text-base font-semibold hover:bg-infinity-navy-light shadow-lg hover:shadow-xl transition-all focus-brand"
                >
                  Apply for Legal Services →
                </button>
                <button
                  onClick={() => router.push('/intake')}
                  className="px-7 py-3.5 bg-infinity-gold text-infinity-navy rounded-xl text-base font-semibold hover:bg-infinity-gold-light shadow-sm hover:shadow-md transition-all focus-brand"
                >
                  Free AI Intake
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap gap-6 pt-6 border-t border-infinity-navy/10">
                <div>
                  <div className="text-2xl font-bold text-infinity-gold font-display">500+</div>
                  <div className="text-xs text-infinity-navy/50 font-sans mt-0.5">Verified Attorneys</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-infinity-gold font-display">&lt;5min</div>
                  <div className="text-xs text-infinity-navy/50 font-sans mt-0.5">Average Response</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-infinity-gold font-display">95%</div>
                  <div className="text-xs text-infinity-navy/50 font-sans mt-0.5">Client Satisfaction</div>
                </div>
              </div>
            </div>

            {/* Right: Hero Image */}
            <div className="order-1 lg:order-2 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="/hero-consultation.png"
                  alt="Professional legal consultation with a family in a warm, comfortable setting"
                  className="w-full h-auto object-cover aspect-[4/3]"
                />
                {/* Subtle overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-infinity-navy/10 via-transparent to-transparent"></div>
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-3 border border-infinity-navy/10 hidden lg:flex items-center gap-3">
                <div className="w-10 h-10 bg-infinity-success/10 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-infinity-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-infinity-navy">POPIA Compliant</div>
                  <div className="text-xs text-infinity-navy/50">Your data is safe</div>
                </div>
              </div>
              {/* Floating badge - top right */}
              <div className="absolute -top-3 -right-3 bg-infinity-gold text-infinity-navy rounded-xl shadow-lg px-4 py-2 hidden lg:block">
                <div className="text-sm font-bold font-display">Affordable</div>
                <div className="text-xs font-sans">From R80/mo</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works — With Virtual Consultation Image */}
      <section id="how-it-works" className="py-20 lg:py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-infinity-navy mb-3">How It Works</h2>
            <p className="text-infinity-navy/50 font-sans max-w-lg mx-auto">Three simple steps to legal clarity — from anywhere</p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Image */}
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <img
                  src="/virtual-consultation.png"
                  alt="Woman having a virtual legal consultation from her home office"
                  className="w-full h-auto object-cover aspect-[4/3]"
                />
              </div>
              {/* Decorative element */}
              <div className="absolute -z-10 -bottom-6 -right-6 w-full h-full rounded-2xl bg-infinity-gold/10"></div>
            </div>

            {/* Right: Steps */}
            <div className="space-y-8">
              {[
                { step: '01', icon: '💬', title: 'Tell Us Your Problem', desc: 'Answer a few simple questions. Our AI understands legal issues in plain language — no signup required to start.', time: 'Takes 2-3 minutes' },
                { step: '02', icon: '🤖', title: 'Get Instant Guidance', desc: 'Our AI analyzes your case and provides immediate next steps, relevant legislation, and estimated costs.', time: 'Instant results' },
                { step: '03', icon: '⚖️', title: 'Connect with an Attorney', desc: 'Choose from matched, LPC-verified attorneys. Book consultations or get full representation — all online.', time: 'Same-day appointments' },
              ].map((step, i) => (
                <div key={i} className="flex gap-5 group">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 bg-infinity-gold/10 rounded-xl flex items-center justify-center group-hover:bg-infinity-gold/20 transition-colors">
                      <span className="text-xs font-bold text-infinity-gold font-display">{step.step}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-semibold mb-1.5 text-infinity-navy">{step.title}</h3>
                    <p className="text-infinity-navy/60 font-sans leading-relaxed text-[15px]">{step.desc}</p>
                    <div className="mt-2 text-sm text-infinity-gold font-semibold font-sans">{step.time}</div>
                  </div>
                </div>
              ))}

              <button
                onClick={() => router.push('/intake')}
                className="mt-4 px-7 py-3.5 bg-infinity-navy text-white rounded-xl text-base font-semibold hover:bg-infinity-navy-light shadow-lg hover:shadow-xl transition-all focus-brand"
              >
                Start Your Free Intake →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Families Trust Us — Testimonial Section with Happy Family Image */}
      <section className="py-20 lg:py-24 px-4 bg-gradient-to-b from-infinity-cream to-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-infinity-success/10 text-infinity-success text-sm font-medium mb-6">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                Trusted by South African Families
              </div>

              <h2 className="text-3xl sm:text-4xl font-display font-bold text-infinity-navy mb-4 leading-tight">
                Real People. <br />
                <span className="text-infinity-gold">Real Legal Solutions.</span>
              </h2>

              <p className="text-lg text-infinity-navy/60 font-sans leading-relaxed mb-8 max-w-lg">
                We believe everyone deserves access to quality legal support. Our platform connects families, individuals, and businesses with the right legal expertise — affordably and confidentially.
              </p>

              {/* Testimonial Cards */}
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-5 border border-infinity-navy/10 shadow-sm">
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 text-infinity-gold" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-infinity-navy/70 font-sans text-[15px] leading-relaxed italic">
                    &ldquo;Infinity Legal made what felt impossible, possible. We got the help we needed for our family matter within hours — not weeks.&rdquo;
                  </p>
                  <div className="mt-3 text-sm font-semibold text-infinity-navy">— Thandi M., Johannesburg</div>
                </div>

                <div className="bg-white rounded-xl p-5 border border-infinity-navy/10 shadow-sm">
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 text-infinity-gold" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-infinity-navy/70 font-sans text-[15px] leading-relaxed italic">
                    &ldquo;The AI intake was brilliant — it understood my labour dispute perfectly. My matched attorney was excellent.&rdquo;
                  </p>
                  <div className="mt-3 text-sm font-semibold text-infinity-navy">— Sipho K., Cape Town</div>
                </div>
              </div>
            </div>

            {/* Right: Happy Family Image */}
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <img
                  src="/happy-family.png"
                  alt="Happy multi-generational South African family smiling together at home"
                  className="w-full h-auto object-cover aspect-[4/3]"
                />
              </div>
              {/* Decorative corner */}
              <div className="absolute -z-10 -top-6 -left-6 w-full h-full rounded-2xl border-2 border-infinity-gold/20"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Practice Areas */}
      <section className="py-20 lg:py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-infinity-navy mb-3">We Handle All Legal Matters</h2>
            <p className="text-infinity-navy/50 font-sans max-w-lg mx-auto">From criminal defense to commercial disputes — our network covers it all</p>
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
      <section className="py-20 lg:py-24 px-4 bg-infinity-cream">
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
              <div key={i} className={`rounded-2xl p-6 border-2 ${plan.popular ? 'border-infinity-gold bg-infinity-gold/5 shadow-lg' : 'border-infinity-navy/10 bg-white shadow-sm'} transition-all hover:shadow-lg`}>
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

      {/* CTA Section — With Family Attorney Image */}
      <section className="py-20 lg:py-24 px-4 bg-infinity-navy relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/family-attorney.png"
            alt="Family consulting with their attorney at home"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-infinity-navy/85"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4 text-white">
            Your Family Deserves <span className="text-infinity-gold">the Best</span> Legal Support
          </h2>
          <p className="text-lg text-white/70 font-sans mb-10 max-w-lg mx-auto">
            Join thousands of South African families who have found peace of mind through Infinity Legal. No credit card required to start.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/intake')}
              className="px-8 py-4 bg-infinity-gold text-infinity-navy rounded-xl text-lg font-semibold hover:bg-infinity-gold-light shadow-lg hover:shadow-xl transition-all focus-brand"
            >
              Start Now — It's Free →
            </button>
            <button
              onClick={() => router.push('/book-consultation')}
              className="px-8 py-4 bg-white/10 text-white border border-white/20 rounded-xl text-lg font-semibold hover:bg-white/20 shadow-lg hover:shadow-xl transition-all focus-brand backdrop-blur-sm"
            >
              Book a Consultation
            </button>
          </div>
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
