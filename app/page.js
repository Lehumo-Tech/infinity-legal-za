'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { PLANS } from '@/lib/demo-data'

const TESTIMONIALS = [
  { name: 'Thabo M.', role: 'Premium Member', text: 'After being unfairly dismissed, Infinity Legal guided me through the CCMA process. I received 8 months compensation. Worth every cent of R115/month.', rating: 5 },
  { name: 'Nomsa D.', role: 'Basic Member', text: 'My landlord tried to evict me illegally. One call to my Infinity Legal attorney and it was resolved within a week. Incredible service.', rating: 5 },
  { name: 'Peter N.', role: 'Business Member', text: 'As a small business owner, having a dedicated attorney review all my contracts has saved me from multiple bad deals. Essential for any entrepreneur.', rating: 5 },
  { name: 'Zanele K.', role: 'Premium Member', text: 'The 24/7 emergency line saved me when I was arrested on a Friday night. My attorney was at the station within 2 hours.', rating: 5 },
]

const CAROUSEL_SLIDES = [
  { 
    title: 'AI-Powered Legal Analysis', 
    desc: 'Our AI instantly analyses your legal situation, identifies the relevant area of law, and connects you with the right attorney — all in under 5 minutes.',
    gradient: 'from-[#0f2b46] to-[#1a4a7a]',
    mockUI: 'intake',
  },
  { 
    title: 'Member Dashboard', 
    desc: 'Track your legal requests, manage your plan, view attorney communications, and monitor case progress — all in one secure portal.',
    gradient: 'from-[#1a365d] to-[#0f2b46]',
    mockUI: 'member',
  },
  { 
    title: 'Staff Command Centre', 
    desc: 'Attorneys manage cases, track deadlines, review intake submissions, and collaborate efficiently through our enterprise-grade portal.',
    gradient: 'from-[#0d2236] to-[#1a4a7a]',
    mockUI: 'staff',
  },
  { 
    title: 'Lead Intelligence Engine', 
    desc: 'AI-powered web & social media scraping identifies potential clients who need legal help right now. Scoring, filtering, and CRM built-in.',
    gradient: 'from-[#1a365d] to-[#0d2236]',
    mockUI: 'leads',
  },
]

/* Mini UI mockups for carousel */
function MockIntakeUI() {
  return (
    <div className="bg-white rounded-xl shadow-2xl p-4 w-full max-w-[340px] text-left transform scale-[0.85] origin-top-right">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
        <div className="flex gap-1"><div className="w-2.5 h-2.5 rounded-full bg-red-400"/><div className="w-2.5 h-2.5 rounded-full bg-yellow-400"/><div className="w-2.5 h-2.5 rounded-full bg-green-400"/></div>
        <span className="text-[10px] text-gray-400 ml-2">AI Legal Intake</span>
      </div>
      <div className="space-y-2.5">
        <div className="bg-[#0f2b46]/5 rounded-lg p-2.5">
          <div className="text-[10px] font-bold text-[#0f2b46] mb-1">Step 3 of 5 — Legal Category</div>
          <div className="flex flex-wrap gap-1.5">
            {['Labour Law','Family Law','Criminal','Civil','Property'].map(c => (
              <span key={c} className={`text-[9px] px-2 py-1 rounded-full ${c === 'Labour Law' ? 'bg-[#c9a961] text-[#0f2b46] font-bold' : 'bg-gray-100 text-gray-500'}`}>{c}</span>
            ))}
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-2">
          <div className="text-[10px] font-bold text-green-700">AI Analysis Complete</div>
          <div className="text-[9px] text-green-600 mt-0.5">Matched: Unfair Dismissal — CCMA Referral recommended</div>
        </div>
        <div className="bg-[#c9a961]/10 rounded-lg p-2">
          <div className="text-[9px] text-gray-500">Estimated Timeline</div>
          <div className="text-[11px] font-bold text-[#0f2b46]">3-6 months • Attorney: Adv. Johnson</div>
        </div>
      </div>
    </div>
  )
}

function MockMemberUI() {
  return (
    <div className="bg-white rounded-xl shadow-2xl p-4 w-full max-w-[340px] text-left transform scale-[0.85] origin-top-right">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
        <div className="flex gap-1"><div className="w-2.5 h-2.5 rounded-full bg-red-400"/><div className="w-2.5 h-2.5 rounded-full bg-yellow-400"/><div className="w-2.5 h-2.5 rounded-full bg-green-400"/></div>
        <span className="text-[10px] text-gray-400 ml-2">Member Portal</span>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-[#0f2b46] flex items-center justify-center text-white text-xs font-bold">TM</div>
        <div><div className="text-xs font-bold text-[#0f2b46]">Thabo Mbeki</div><div className="text-[9px] text-[#c9a961]">Premium Plan — R115/mo</div></div>
      </div>
      <div className="grid grid-cols-2 gap-1.5 mb-2.5">
        {[{l:'Active Requests',v:'2',c:'text-blue-600'},{l:'Resolved',v:'5',c:'text-green-600'},{l:'Consults Left',v:'3',c:'text-[#c9a961]'},{l:'Documents',v:'5',c:'text-purple-600'}].map(s => (
          <div key={s.l} className="bg-gray-50 rounded-lg p-2 text-center">
            <div className={`text-sm font-bold ${s.c}`}>{s.v}</div>
            <div className="text-[8px] text-gray-400">{s.l}</div>
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 bg-red-50 rounded-lg p-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500"/>
          <span className="text-[9px] text-gray-700 flex-1">Unfair dismissal consultation</span>
          <span className="text-[8px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">HIGH</span>
        </div>
        <div className="flex items-center gap-2 bg-yellow-50 rounded-lg p-2">
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"/>
          <span className="text-[9px] text-gray-700 flex-1">Lease deposit dispute</span>
          <span className="text-[8px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-bold">MED</span>
        </div>
      </div>
    </div>
  )
}

function MockStaffUI() {
  return (
    <div className="bg-white rounded-xl shadow-2xl p-4 w-full max-w-[340px] text-left transform scale-[0.85] origin-top-right">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
        <div className="flex gap-1"><div className="w-2.5 h-2.5 rounded-full bg-red-400"/><div className="w-2.5 h-2.5 rounded-full bg-yellow-400"/><div className="w-2.5 h-2.5 rounded-full bg-green-400"/></div>
        <span className="text-[10px] text-gray-400 ml-2">Staff Portal — Adv. Sarah Johnson</span>
      </div>
      <div className="grid grid-cols-3 gap-1.5 mb-2.5">
        {[{l:'My Cases',v:'8'},{l:'Pending',v:'3'},{l:'This Week',v:'12'}].map(s => (
          <div key={s.l} className="bg-[#0f2b46] rounded-lg p-2 text-center">
            <div className="text-sm font-bold text-[#c9a961]">{s.v}</div>
            <div className="text-[8px] text-white/60">{s.l}</div>
          </div>
        ))}
      </div>
      <div className="text-[10px] font-bold text-[#0f2b46] mb-1.5">Assigned Cases</div>
      <div className="space-y-1.5">
        {[{n:'Thabo Mbeki',c:'Employment',s:'In Progress'},{n:'Nomsa Dlamini',c:'Family',s:'New'},{n:'Peter Naidoo',c:'Corporate',s:'Resolved'}].map((r,i) => (
          <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
            <div className="w-6 h-6 rounded-full bg-[#0f2b46]/10 flex items-center justify-center text-[8px] font-bold text-[#0f2b46]">{r.n.split(' ').map(w=>w[0]).join('')}</div>
            <div className="flex-1"><div className="text-[9px] font-semibold text-[#0f2b46]">{r.n}</div><div className="text-[8px] text-gray-400">{r.c}</div></div>
            <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${r.s === 'New' ? 'bg-blue-100 text-blue-600' : r.s === 'Resolved' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-700'}`}>{r.s}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MockLeadsUI() {
  return (
    <div className="bg-white rounded-xl shadow-2xl p-4 w-full max-w-[340px] text-left transform scale-[0.85] origin-top-right">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
        <div className="flex gap-1"><div className="w-2.5 h-2.5 rounded-full bg-red-400"/><div className="w-2.5 h-2.5 rounded-full bg-yellow-400"/><div className="w-2.5 h-2.5 rounded-full bg-green-400"/></div>
        <span className="text-[10px] text-gray-400 ml-2">Lead Intelligence Engine</span>
      </div>
      <div className="flex items-center justify-between mb-2.5">
        <div className="text-[10px] font-bold text-[#0f2b46]">AI-Scraped Leads</div>
        <span className="text-[8px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">8 New Today</span>
      </div>
      <div className="space-y-1.5">
        {[{n:'Sipho M.',s:'LinkedIn',sc:92,cat:'Employment'},{n:'Zanele K.',s:'Twitter/X',sc:78,cat:'Consumer'},{n:'André vdM.',s:'Facebook',sc:85,cat:'Property'}].map((l,i) => (
          <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[8px] font-bold text-blue-600">{l.s[0]}</div>
            <div className="flex-1">
              <div className="text-[9px] font-semibold text-[#0f2b46]">{l.n} <span className="text-gray-400 font-normal">via {l.s}</span></div>
              <div className="text-[8px] text-gray-400">{l.cat}</div>
            </div>
            <div className="text-right">
              <div className={`text-[10px] font-bold ${l.sc >= 85 ? 'text-green-600' : 'text-yellow-600'}`}>{l.sc}%</div>
              <div className="text-[7px] text-gray-400">Score</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 bg-[#0f2b46] rounded-lg p-2 text-center">
        <span className="text-[9px] text-[#c9a961] font-bold">View All 8 Leads →</span>
      </div>
    </div>
  )
}

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)

  const nextSlide = useCallback(() => {
    setCurrentSlide(p => (p + 1) % CAROUSEL_SLIDES.length)
  }, [])

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000)
    return () => clearInterval(timer)
  }, [nextSlide])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTestimonial(p => (p + 1) % TESTIMONIALS.length), 6000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ═══ NAV ═══ */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo-icon-128.png" alt="Infinity Legal" className="h-10 w-auto rounded-lg" />
            <span className="text-xl font-bold text-[#0f2b46] hidden sm:block" style={{ fontFamily: "'Playfair Display', serif" }}>Infinity Legal</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="/pricing" className="hover:text-[#0f2b46] transition-colors">Plans</Link>
            <Link href="/resources" className="hover:text-[#0f2b46] transition-colors">Resources</Link>
            <a href="#how-it-works" className="hover:text-[#0f2b46] transition-colors">How It Works</a>
            <a href="#testimonials" className="hover:text-[#0f2b46] transition-colors">Reviews</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm px-4 py-2 text-[#0f2b46] font-semibold hover:bg-gray-50 rounded-lg transition-colors">Login</Link>
            <Link href="/pricing" className="text-sm px-5 py-2 bg-[#c9a961] text-[#0f2b46] font-bold rounded-lg hover:bg-[#d4af37] transition-colors shadow-sm">View Plans</Link>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="relative bg-[#0f2b46] overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-[#c9a961] blur-[200px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[#c9a961] blur-[150px]" />
        </div>
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-28 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-[#c9a961]/20 text-[#c9a961] text-xs font-bold px-4 py-1.5 rounded-full mb-6 uppercase tracking-wider">
              Trusted by 2,500+ South Africans
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Legal Cover from <span className="text-[#c9a961]">R95/month</span>
            </h1>
            <p className="text-xl md:text-2xl text-[#c9a961] font-medium mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Legal Excellence Without Limits
            </p>
            <p className="text-lg text-white/70 mb-8 max-w-xl mx-auto">
              Affordable legal protection for individuals, families, and businesses. Expert attorneys on call when you need them most.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/pricing" className="px-8 py-3.5 bg-[#c9a961] text-[#0f2b46] font-bold rounded-xl hover:bg-[#d4af37] transition-all shadow-lg shadow-[#c9a961]/20 text-lg">
                View Plans →
              </Link>
              <Link href="/login" className="px-8 py-3.5 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all text-lg">
                Login
              </Link>
            </div>
            <div className="flex justify-center gap-8 mt-10 text-white/50 text-sm">
              <span>✓ No contracts</span>
              <span>✓ Cancel anytime</span>
              <span>✓ POPIA compliant</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ IMAGE CAROUSEL ═══ */}
      <section className="bg-gray-50 py-12 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-[#0f2b46]" style={{ fontFamily: "'Playfair Display', serif" }}>Platform Preview</h2>
            <p className="text-gray-500 text-sm mt-1">See what powers Infinity Legal</p>
          </div>
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
            <div className={`bg-gradient-to-br ${CAROUSEL_SLIDES[currentSlide].gradient} p-8 md:p-12 text-white min-h-[340px] flex items-center transition-all duration-700`}>
              <div className="max-w-md flex-shrink-0">
                <div className="text-xs uppercase tracking-widest text-[#c9a961] font-bold mb-3">
                  {currentSlide + 1} / {CAROUSEL_SLIDES.length}
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {CAROUSEL_SLIDES[currentSlide].title}
                </h3>
                <p className="text-white/70 text-base leading-relaxed">{CAROUSEL_SLIDES[currentSlide].desc}</p>
              </div>
              <div className="hidden md:flex ml-auto items-center justify-center pl-6">
                {CAROUSEL_SLIDES[currentSlide].mockUI === 'intake' && <MockIntakeUI />}
                {CAROUSEL_SLIDES[currentSlide].mockUI === 'member' && <MockMemberUI />}
                {CAROUSEL_SLIDES[currentSlide].mockUI === 'staff' && <MockStaffUI />}
                {CAROUSEL_SLIDES[currentSlide].mockUI === 'leads' && <MockLeadsUI />}
              </div>
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {CAROUSEL_SLIDES.map((_, i) => (
                <button key={i} onClick={() => setCurrentSlide(i)} className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentSlide ? 'bg-[#c9a961] w-8' : 'bg-white/40 hover:bg-white/60'}`} />
              ))}
            </div>
            <button onClick={() => setCurrentSlide(p => (p - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-colors">‹</button>
            <button onClick={nextSlide} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-colors">›</button>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0f2b46] mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>How It Works</h2>
            <p className="text-gray-500 text-lg">Three simple steps to legal protection</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', icon: '🛡️', title: 'Join', desc: 'Choose a plan that fits your needs. Sign up in under 2 minutes. No contracts, no hidden fees.' },
              { step: '2', icon: '📋', title: 'Request', desc: 'Submit your legal matter through our portal or call your attorney directly. AI analysis included.' },
              { step: '3', icon: '✅', title: 'Resolved', desc: 'Your dedicated attorney handles everything — consultations, documents, court representation.' },
            ].map((s, i) => (
              <div key={i} className="text-center group">
                <div className="w-20 h-20 rounded-2xl bg-[#0f2b46] text-white flex items-center justify-center text-3xl mx-auto mb-4 group-hover:bg-[#c9a961] group-hover:text-[#0f2b46] transition-colors shadow-lg">
                  {s.icon}
                </div>
                <div className="text-xs font-bold text-[#c9a961] uppercase tracking-widest mb-2">Step {s.step}</div>
                <h3 className="text-xl font-bold text-[#0f2b46] mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING PREVIEW ═══ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0f2b46] mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>Choose Your Plan</h2>
            <p className="text-gray-500 text-lg">Affordable legal protection for every need</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div key={plan.id} className={`relative bg-white rounded-2xl border-2 p-6 transition-all hover:shadow-xl ${plan.popular ? 'border-[#c9a961] shadow-lg scale-[1.02]' : 'border-gray-200'}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#c9a961] text-[#0f2b46] text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">Most Popular</div>
                )}
                <h3 className="text-lg font-bold text-[#0f2b46] mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-bold text-[#0f2b46]">R{plan.price}</span>
                  <span className="text-gray-400 text-sm">/month</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.slice(0, 4).map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-[#c9a961] mt-0.5 font-bold">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className={`block text-center py-3 rounded-xl font-bold text-sm transition-colors ${plan.popular ? 'bg-[#c9a961] text-[#0f2b46] hover:bg-[#d4af37]' : 'bg-[#0f2b46] text-white hover:bg-[#1a365d]'}`}>
                  Select Plan
                </Link>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/pricing" className="text-[#c9a961] font-semibold hover:text-[#0f2b46] transition-colors">
              See full comparison →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section id="testimonials" className="py-20 bg-[#0f2b46]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>What Our Members Say</h2>
          <p className="text-white/50 mb-10">Real stories from real South Africans</p>
          <div className="relative min-h-[200px]">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 md:p-10 border border-white/10">
              <div className="flex justify-center gap-1 mb-4">
                {Array.from({ length: TESTIMONIALS[currentTestimonial].rating }).map((_, i) => (
                  <span key={i} className="text-[#c9a961] text-xl">★</span>
                ))}
              </div>
              <p className="text-white text-lg md:text-xl leading-relaxed mb-6 italic">
                "{TESTIMONIALS[currentTestimonial].text}"
              </p>
              <div>
                <p className="text-white font-bold">{TESTIMONIALS[currentTestimonial].name}</p>
                <p className="text-[#c9a961] text-sm">{TESTIMONIALS[currentTestimonial].role}</p>
              </div>
            </div>
            <div className="flex justify-center gap-2 mt-6">
              {TESTIMONIALS.map((_, i) => (
                <button key={i} onClick={() => setCurrentTestimonial(i)} className={`w-2 h-2 rounded-full transition-all ${i === currentTestimonial ? 'bg-[#c9a961] w-6' : 'bg-white/30'}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-[#0f2b46] mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>Ready to Get Protected?</h2>
          <p className="text-gray-500 mb-8 text-lg">Join thousands of South Africans who trust Infinity Legal with their legal matters.</p>
          <div className="flex justify-center gap-3">
            <Link href="/pricing" className="px-8 py-3.5 bg-[#0f2b46] text-white font-bold rounded-xl hover:bg-[#1a365d] transition-colors text-lg">View Plans</Link>
            <Link href="/login" className="px-8 py-3.5 border-2 border-[#0f2b46] text-[#0f2b46] font-bold rounded-xl hover:bg-[#0f2b46] hover:text-white transition-colors text-lg">Login</Link>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-[#0f2b46] text-white py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src="/logo-icon-128.png" alt="Infinity Legal" className="h-10 rounded-lg" />
              <span className="font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>Infinity Legal</span>
            </div>
            <p className="text-white/50 text-sm">Legal excellence without limits. Protecting South Africans since 2024.</p>
          </div>
          <div>
            <h4 className="font-bold text-sm mb-3 text-[#c9a961]">Company</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/resources" className="hover:text-white transition-colors">Resources</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-sm mb-3 text-[#c9a961]">Legal</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link href="/resources?tab=articles" className="hover:text-white transition-colors">Legal Articles</Link></li>
              <li><Link href="/resources?tab=templates" className="hover:text-white transition-colors">Contract Templates</Link></li>
              <li><Link href="/resources?tab=claims" className="hover:text-white transition-colors">Claim Forms</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-sm mb-3 text-[#c9a961]">Contact</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li>info@infinitylegal.org</li>
              <li>+27 10 XXX XXXX</li>
              <li>Sandton, Johannesburg</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-8 pt-6 border-t border-white/10 text-center text-xs text-white/30">
          © {new Date().getFullYear()} Infinity Legal (Pty) Ltd. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
