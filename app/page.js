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
      <nav className="border-b border-border bg-infinity-cream/95 backdrop-blur supports-[backdrop-filter]:bg-infinity-cream/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Infinity Legal" className="h-10 w-auto" />
            <span className="font-bold text-xl text-infinity-navy">Infinity Legal</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm text-infinity-navy/70 hover:text-infinity-navy">
              Pricing
            </Link>
            <Link href="/attorney/signup" className="text-sm text-infinity-navy/70 hover:text-infinity-navy">
              For Attorneys
            </Link>
            {isAuthenticated ? (
              <>
                <NotificationBell />
                <Link href="/dashboard" className="text-sm text-infinity-navy/70 hover:text-infinity-navy">
                  Dashboard
                </Link>
              </>
            ) : (
              <Link href="/login" className="text-sm text-infinity-navy/70 hover:text-infinity-navy">
                Sign In
              </Link>
            )}
            <Link href="/apply"
              className="px-4 py-2 bg-infinity-navy text-infinity-cream rounded-md text-sm font-medium hover:bg-infinity-navy/90">
              Apply Now
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-infinity-gold/10 text-infinity-navy text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-infinity-gold rounded-full animate-pulse"></span>
            24/7 AI-Powered Legal Help
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight text-infinity-navy">
            Solve Your Legal Problem in Minutes.
            <span className="block text-infinity-gold mt-2">Affordable. Confidential.</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Get instant guidance from our AI legal assistant, then connect with verified South African attorneys. 
            Most cases resolved in under 5 minutes.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={() => router.push('/apply')}
              className="px-8 py-4 bg-infinity-navy text-infinity-cream rounded-lg text-lg font-semibold hover:bg-infinity-navy/90 shadow-lg hover:shadow-xl transition-all"
            >
              Apply for Legal Services →
            </button>
            <button
              onClick={() => router.push('/intake')}
              className="px-8 py-4 bg-infinity-gold text-infinity-navy rounded-lg text-lg font-semibold hover:bg-infinity-gold/90"
            >
              Free AI Intake
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-8 border-t border-infinity-gold/20">
            <div>
              <div className="text-3xl font-bold text-infinity-gold">500+</div>
              <div className="text-sm text-infinity-navy/70">Verified Attorneys</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-infinity-gold">&lt;5min</div>
              <div className="text-sm text-infinity-navy/70">Average Response</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-infinity-gold">95%</div>
              <div className="text-sm text-infinity-navy/70">Client Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-infinity-cream">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-12 text-infinity-navy">How It Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-8 border border-infinity-gold/20 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-infinity-gold/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-infinity-navy">1. Tell Us Your Problem</h3>
              <p className="text-infinity-navy/70">
                Answer 3 simple questions. Our AI understands legal issues in plain language. 
                No signup required to start.
              </p>
              <div className="mt-4 text-sm text-infinity-gold font-medium">Takes 2-3 minutes</div>
            </div>

            <div className="bg-white rounded-lg p-8 border border-infinity-gold/20 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-infinity-gold/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-infinity-navy">2. Get Instant Guidance</h3>
              <p className="text-infinity-navy/70">
                Our AI analyzes your case and provides immediate next steps, similar cases, 
                and estimated costs.
              </p>
              <div className="mt-4 text-sm text-infinity-gold font-medium">Instant results</div>
            </div>

            <div className="bg-white rounded-lg p-8 border border-infinity-gold/20 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-infinity-gold/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">⚖️</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-infinity-navy">3. Connect with Attorney</h3>
              <p className="text-infinity-navy/70">
                Choose from matched, LPC-verified attorneys. Book consultations or get full representation.
              </p>
              <div className="mt-4 text-sm text-infinity-gold font-medium">Same-day appointments</div>
            </div>
          </div>
        </div>
      </section>

      {/* Practice Areas */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-12">We Handle All Legal Matters</h2>
          
          <div className="grid md:grid-cols-4 gap-6">
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
              <div key={i} className="bg-card rounded-lg p-6 border border-border hover:border-primary transition-all cursor-pointer">
                <div className="text-3xl mb-3">{area.icon}</div>
                <h3 className="font-semibold mb-2">{area.name}</h3>
                <p className="text-sm text-muted-foreground">{area.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency Section */}
      <section className="py-20 px-4 bg-destructive/5 border-y border-destructive/20">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-sm font-medium mb-4">
            <span className="w-2 h-2 bg-destructive rounded-full animate-pulse"></span>
            Emergency Legal Help
          </div>
          <h2 className="text-3xl font-bold mb-4">Been Arrested? Facing Eviction? Court Tomorrow?</h2>
          <p className="text-lg text-muted-foreground mb-6">
            Our AI detects urgent cases and connects you with on-call attorneys immediately.
          </p>
          <button
            onClick={() => router.push('/intake?urgent=true')}
            className="px-8 py-4 bg-destructive text-destructive-foreground rounded-lg text-lg font-semibold hover:bg-destructive/90 shadow-lg"
          >
            Get Emergency Help Now
          </button>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Solve Your Legal Problem?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            No credit card required. Start with our free AI intake.
          </p>
          <button
            onClick={() => router.push('/intake')}
            className="px-8 py-4 bg-primary text-primary-foreground rounded-lg text-lg font-semibold hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
          >
            Start Now - It's Free →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-infinity-gold/20 py-12 px-4 bg-infinity-cream">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src="/logo.png" alt="Infinity Legal" className="h-10 w-auto" />
                <span className="font-bold text-lg text-infinity-navy">Infinity Legal</span>
              </div>
              <p className="text-sm text-infinity-navy/70">
                Democratizing legal access in South Africa through AI and verified attorneys.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-muted-foreground hover:text-foreground">Terms of Service</Link></li>
                <li><Link href="/disclaimer" className="text-muted-foreground hover:text-foreground">Legal Disclaimer</Link></li>
                <li><Link href="/cookie-policy" className="text-muted-foreground hover:text-foreground">Cookie Policy</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">For Attorneys</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/attorney/signup" className="text-muted-foreground hover:text-foreground">Join Our Network</Link></li>
                <li><Link href="/attorney/login" className="text-muted-foreground hover:text-foreground">Attorney Login</Link></li>
                <li><Link href="/attorney/verification" className="text-muted-foreground hover:text-foreground">Verification Process</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/help" className="text-muted-foreground hover:text-foreground">Help Center</Link></li>
                <li><Link href="/contact" className="text-muted-foreground hover:text-foreground">Contact Us</Link></li>
                <li><a href="mailto:support@infinitylegal.org" className="text-muted-foreground hover:text-foreground">support@infinitylegal.org</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>© 2024 Infinity Legal. All rights reserved. | Registered in South Africa | POPIA Compliant</p>
          </div>
        </div>
      </footer>
    </div>
  )
}