'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { PLANS, PLAN_DISCLAIMER, CORE_BENEFITS } from '@/lib/demo-data'

// ═══ GET STARTED MODAL COMPONENT ═══
function GetStartedModal({ isOpen, onClose, selectedPlan }) {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [legalNeed, setLegalNeed] = useState('')
  const [popia, setPopia] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!popia) return
    setLoading(true)
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone, name, legal_need: legalNeed, plan: selectedPlan || 'general', source: 'homepage' }),
      })
      const data = await res.json()
      setMessage(data.message)
      setSubmitted(true)
    } catch {
      setMessage('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl">×</button>
        {submitted ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h3 className="text-xl font-bold text-[#0f2b46] mb-2">You&apos;re All Set!</h3>
            <p className="text-gray-600 text-sm">{message}</p>
            <Link href="/intake" className="inline-block mt-4 px-6 py-2 bg-[#c9a961] text-[#0f2b46] font-bold rounded-lg hover:bg-[#d4af37] transition-colors">Try Free AI Analysis →</Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-[#c9a961]/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">⚖️</span>
              </div>
              <h3 className="text-xl font-bold text-[#0f2b46]">Get Started Free</h3>
              <p className="text-sm text-gray-500 mt-1">Register to access our legal services and get matched with a specialist.</p>
              {selectedPlan && <span className="inline-block mt-1 text-xs bg-[#c9a961]/10 text-[#c9a961] px-2 py-0.5 rounded-full font-semibold">Plan: {selectedPlan}</span>}
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a961]/50" />
              <input type="email" placeholder="Email Address *" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a961]/50" />
              <input type="tel" placeholder="Phone (optional)" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a961]/50" />
              <select value={legalNeed} onChange={e => setLegalNeed(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a961]/50 text-gray-700">
                <option value="">What legal matter do you need help with?</option>
                <option value="CCMA">CCMA / Unfair Dismissal</option>
                <option value="Labour Dispute">Labour Dispute</option>
                <option value="Divorce">Divorce / Family</option>
                <option value="Eviction">Eviction / Housing</option>
                <option value="Criminal">Criminal Matter</option>
                <option value="Custody">Child Custody / Maintenance</option>
                <option value="Debt Review">Debt Review / Collections</option>
                <option value="Consumer">Consumer Complaint</option>
                <option value="Property">Property / Contract</option>
                <option value="General">General Legal Enquiry</option>
                <option value="Other">Other</option>
              </select>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" required checked={popia} onChange={e => setPopia(e.target.checked)} className="mt-1 rounded border-gray-300 text-[#c9a961] focus:ring-[#c9a961]" />
                <span className="text-xs text-gray-500">I consent to the processing of my personal information per POPIA. <Link href="/privacy" className="text-[#c9a961] hover:underline">Privacy Policy</Link></span>
              </label>
              <button type="submit" disabled={loading || !popia} className="w-full py-3 bg-[#c9a961] text-[#0f2b46] font-bold rounded-lg hover:bg-[#d4af37] transition-colors disabled:opacity-50">
                {loading ? 'Registering...' : 'Register Now →'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

const TESTIMONIALS = [
  { name: 'Thabo M.', role: 'Labour Legal Plan Member', text: 'After being unfairly dismissed, Infinity Legal guided me through the CCMA process. I received 8 months compensation. Worth every cent of R99/month.', rating: 5, avatar: 'TM' },
  { name: 'Nomsa D.', role: 'Civil Legal Plan Member', text: 'My landlord tried to evict me illegally. One call to my Infinity Legal specialist and it was resolved within a week. Incredible service.', rating: 5, avatar: 'ND' },
  { name: 'Peter N.', role: 'Extensive Plan Member', text: 'As a small business owner, having a dedicated legal specialist review all my contracts and handle a criminal matter saved me thousands. Essential.', rating: 5, avatar: 'PN' },
  { name: 'Zanele K.', role: 'Labour Legal Plan Member', text: 'The 24-hour contact centre saved me when I faced a disciplinary hearing with no notice. My specialist prepped me perfectly.', rating: 5, avatar: 'ZK' },
]

const PEOPLE_IMAGES = {
  hero: 'https://images.unsplash.com/photo-1739289671650-a5f3e0069d29?w=1200&q=80',
  family: 'https://images.pexels.com/photos/3875437/pexels-photo-3875437.jpeg?auto=compress&cs=tinysrgb&w=800',
  workplace: 'https://images.unsplash.com/photo-1758691737543-09a1b2b715fa?w=1200&q=80',
  teamwork: 'https://images.unsplash.com/photo-1758691737543-09a1b2b715fa?w=1200&q=80',
  consultation: 'https://images.unsplash.com/photo-1739285452644-3a2c009112fe?w=1200&q=80',
  professional: 'https://images.unsplash.com/photo-1622476512221-5fe08e42f898?w=800&q=80',
  advisor: 'https://images.unsplash.com/photo-1775163024488-e88e4a71179f?w=800&q=80',
  colleagues: 'https://images.unsplash.com/photo-1758691737543-09a1b2b715fa?w=800&q=80',
}

const CAROUSEL_SLIDES = [
  { 
    title: 'AI-Powered Legal Analysis', 
    desc: 'Our AI instantly analyses your legal situation, identifies whether it falls under Civil or Employment law, and connects you with the right legal advisor.',
    gradient: 'from-[#0f2b46] to-[#1a4a7a]',
    mockUI: 'intake',
  },
  { 
    title: 'Member Dashboard', 
    desc: 'Track your legal matters, manage your plan, view advisor communications, and monitor progress — all in one secure portal.',
    gradient: 'from-[#1a365d] to-[#0f2b46]',
    mockUI: 'member',
  },
  { 
    title: 'Legal Advisor Centre', 
    desc: 'Legal advisors manage matters, track deadlines, review intake submissions, and collaborate efficiently through our enterprise-grade portal.',
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
            {['Employment','Civil','Consumer','Property','Business'].map(c => (
              <span key={c} className={`text-[9px] px-2 py-1 rounded-full ${c === 'Employment' ? 'bg-[#c9a961] text-[#0f2b46] font-bold' : 'bg-gray-100 text-gray-500'}`}>{c}</span>
            ))}
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-2">
          <div className="text-[10px] font-bold text-green-700">AI Analysis Complete</div>
          <div className="text-[9px] text-green-600 mt-0.5">Matched: Unfair Dismissal — CCMA Referral recommended</div>
        </div>
        <div className="bg-[#c9a961]/10 rounded-lg p-2">
          <div className="text-[9px] text-gray-500">Plan Match</div>
          <div className="text-[11px] font-bold text-[#0f2b46]">Employment Legal Plan • Advisor: Sarah J.</div>
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
        <div><div className="text-xs font-bold text-[#0f2b46]">Thabo Mbeki</div><div className="text-[9px] text-[#c9a961]">Employment Legal Plan — R99/mo</div></div>
      </div>
      <div className="grid grid-cols-2 gap-1.5 mb-2.5">
        {[{l:'Active Matters',v:'2',c:'text-blue-600'},{l:'Resolved',v:'5',c:'text-green-600'},{l:'Consultations',v:'∞',c:'text-[#c9a961]'},{l:'Documents',v:'5',c:'text-purple-600'}].map(s => (
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
          <span className="text-[9px] text-gray-700 flex-1">CCMA referral preparation</span>
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
        <span className="text-[10px] text-gray-400 ml-2">Legal Advisor Centre — Sarah Johnson</span>
      </div>
      <div className="grid grid-cols-3 gap-1.5 mb-2.5">
        {[{l:'My Matters',v:'8'},{l:'Pending',v:'3'},{l:'This Week',v:'12'}].map(s => (
          <div key={s.l} className="bg-[#0f2b46] rounded-lg p-2 text-center">
            <div className="text-sm font-bold text-[#c9a961]">{s.v}</div>
            <div className="text-[8px] text-white/60">{s.l}</div>
          </div>
        ))}
      </div>
      <div className="text-[10px] font-bold text-[#0f2b46] mb-1.5">Assigned Matters</div>
      <div className="space-y-1.5">
        {[{n:'Thabo Mbeki',c:'Employment',s:'In Progress'},{n:'Nomsa Dlamini',c:'Civil',s:'New'},{n:'Peter Naidoo',c:'Business',s:'Resolved'}].map((r,i) => (
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
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [showRegister, setShowRegister] = useState(false)
  const [registerPlan, setRegisterPlan] = useState('')

  const openRegister = (plan = '') => {
    setRegisterPlan(plan)
    setShowRegister(true)
  }

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

      {/* Registration Modal */}
      <GetStartedModal isOpen={showRegister} onClose={() => setShowRegister(false)} selectedPlan={registerPlan} />

      {/* WhatsApp Floating Button */}
      <a href="https://wa.me/27682011186?text=Hi%20Infinity%20Legal%2C%20I%20need%20legal%20assistance" target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 transition-all hover:scale-110" title="Chat on WhatsApp">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>

      {/* ═══ NAV ═══ */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo-icon-128.png" alt="Infinity Legal" className="h-10 w-auto rounded-lg" />
            <span className="text-xl font-bold text-[#0f2b46] hidden sm:block" style={{ fontFamily: "'Playfair Display', serif" }}>Infinity Legal</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="/ask" className="text-[#c9a961] font-bold hover:text-[#0f2b46] transition-colors">Ask Infinity</Link>
            <Link href="/intake" className="hover:text-[#0f2b46] transition-colors">Free Legal Analysis</Link>
            <Link href="/pricing" className="hover:text-[#0f2b46] transition-colors">Plans</Link>
            <Link href="/resources" className="hover:text-[#0f2b46] transition-colors">Resources</Link>
            <a href="#how-it-works" className="hover:text-[#0f2b46] transition-colors">How It Works</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm px-4 py-2 text-[#0f2b46] font-semibold hover:bg-gray-50 rounded-lg transition-colors">Login</Link>
            <Link href="/intake" className="text-sm px-5 py-2 bg-[#c9a961] text-[#0f2b46] font-bold rounded-lg hover:bg-[#d4af37] transition-colors shadow-sm">Get Legal Help</Link>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="relative bg-[#0f2b46] overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-[#c9a961] blur-[200px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[#c9a961] blur-[150px]" />
        </div>
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            {/* Left - Copy */}
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-[#c9a961]/20 text-[#c9a961] text-xs font-bold px-4 py-1.5 rounded-full mb-6 uppercase tracking-wider">
                Unlimited Legal Support • From R99/month
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                Legal Plans from <span className="text-[#c9a961]">R99/month</span>
              </h1>
              <p className="text-xl md:text-2xl text-[#c9a961] font-medium mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                Legal Excellence Without Limits
              </p>
              <p className="text-lg text-white/70 mb-8 max-w-xl">
                Legal protection for individuals, families, and SME's. Choose Civil, Labour, or Extensive plans — unlimited consultations and document preparation included.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <Link href="/intake" className="px-8 py-3.5 bg-[#c9a961] text-[#0f2b46] font-bold rounded-xl hover:bg-[#d4af37] transition-all shadow-lg shadow-[#c9a961]/20 text-lg">
                  Get Free Legal Analysis →
                </Link>
                <button onClick={() => openRegister()} className="px-8 py-3.5 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all text-lg">
                  Get Started Free ⚖️
                </button>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-6 mt-8 text-white/50 text-sm">
                <span>✓ Unlimited consultations</span>
                <span>✓ Family included</span>
                <span>✓ 24/7 Contact Centre</span>
              </div>
            </div>
            {/* Right - Image Collage */}
            <div className="hidden md:block relative">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-3">
                  <div className="rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10">
                    <img src={PEOPLE_IMAGES.hero} alt="Professional legal consultation" className="w-full h-48 object-cover" loading="eager" />
                  </div>
                  <div className="rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10">
                    <img src={PEOPLE_IMAGES.family} alt="Happy family protected by legal cover" className="w-full h-36 object-cover" />
                  </div>
                </div>
                <div className="space-y-3 pt-6">
                  <div className="rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10">
                    <img src={PEOPLE_IMAGES.professional} alt="Professional legal advisor" className="w-full h-36 object-cover" />
                  </div>
                  <div className="rounded-2xl overflow-hidden shadow-2xl border-2 border-[#c9a961]/30">
                    <img src={PEOPLE_IMAGES.colleagues} alt="Legal team collaboration" className="w-full h-48 object-cover" />
                  </div>
                </div>
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-xl px-4 py-3 flex items-center gap-3 border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 text-lg">✓</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0f2b46]">10,000+ Members</p>
                  <p className="text-xs text-gray-400">Trusted across South Africa</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ AI INTAKE CTA ═══ */}
      <section className="py-12 bg-gradient-to-r from-[#c9a961]/10 to-[#0f2b46]/5 border-y border-[#c9a961]/20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full mb-3">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                AI-Powered • Free • 5 Minutes
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#0f2b46] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                Not sure where to start?
              </h2>
              <p className="text-gray-600 mb-4">
                Our AI analyses your legal situation, identifies the right area of law, and connects you with a qualified legal advisor — completely free, even without a membership.
              </p>
              <Link href="/intake" className="inline-flex items-center gap-2 px-6 py-3 bg-[#0f2b46] text-white font-bold rounded-xl hover:bg-[#1a365d] transition-colors shadow-md">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                Start Free AI Legal Analysis
              </Link>
            </div>
            <div className="flex-shrink-0">
              <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100 max-w-[280px]">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0f2b46] flex items-center justify-center text-white text-lg">1</div>
                    <div><div className="text-sm font-bold text-[#0f2b46]">Describe Your Situation</div><div className="text-xs text-gray-400">5-step guided form</div></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#c9a961] flex items-center justify-center text-[#0f2b46] text-lg font-bold">2</div>
                    <div><div className="text-sm font-bold text-[#0f2b46]">AI Analyses Your Matter</div><div className="text-xs text-gray-400">Instant legal categorisation</div></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center text-white text-lg">3</div>
                    <div><div className="text-sm font-bold text-[#0f2b46]">Get Matched to an Advisor</div><div className="text-xs text-gray-400">Qualified legal advisor assigned</div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TRUST — PEOPLE SECTION ═══ */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            {/* Left - Image Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl overflow-hidden shadow-lg">
                <img src={PEOPLE_IMAGES.workplace} alt="Legal team discussion" className="w-full h-52 object-cover hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="rounded-2xl overflow-hidden shadow-lg mt-6">
                <img src={PEOPLE_IMAGES.consultation} alt="Professional legal consultation" className="w-full h-52 object-cover hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="rounded-2xl overflow-hidden shadow-lg -mt-3">
                <img src={PEOPLE_IMAGES.teamwork} alt="Team collaborating on legal matters" className="w-full h-44 object-cover hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="rounded-2xl overflow-hidden shadow-lg mt-3">
                <img src={PEOPLE_IMAGES.advisor} alt="Legal advisor reviewing documents" className="w-full h-44 object-cover hover:scale-105 transition-transform duration-500" />
              </div>
            </div>
            {/* Right - Copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-[#0f2b46]/5 text-[#0f2b46] text-xs font-bold px-3 py-1.5 rounded-full mb-4 uppercase tracking-wider">
                Why Infinity Legal
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#0f2b46] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                Real People. Real Protection. <span className="text-[#c9a961]">Real Results.</span>
              </h2>
              <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                Infinity Legal was built for ordinary South Africans who deserve extraordinary legal protection. Our network of experienced legal advisors provides expert guidance, document preparation, and AI-powered advisory services.
              </p>
              <div className="space-y-4">
                {[
                  { icon: '⚖️', title: 'Unlimited Legal Consultations', desc: 'Speak to qualified legal advisors as often as you need — no caps, no limits.' },
                  { icon: '👨‍👩‍👧‍👦', title: 'Family Plan Built In', desc: 'Your spouse and children under 21 are included at no extra cost.' },
                  { icon: '📞', title: '24/7 Legal Contact Centre', desc: 'Speak to a legal advisor any time — emergencies don\'t keep office hours.' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#0f2b46]/5 flex items-center justify-center text-xl flex-shrink-0">{item.icon}</div>
                    <div>
                      <h3 className="font-bold text-[#0f2b46] mb-0.5">{item.title}</h3>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
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
              { step: '1', icon: '🛡️', title: 'Choose Your Plan', desc: 'Select Civil, Labour, or Extensive protection — unlimited legal support from R99/month.' },
              { step: '2', icon: '📋', title: 'Submit Your Matter', desc: 'Describe your legal matter through our AI-powered intake. We analyse and match you to a specialist.' },
              { step: '3', icon: '✅', title: 'Get Expert Guidance', desc: 'Your legal specialist handles everything — advice, documents, negotiations, and resolution.' },
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

      {/* ═══ PLAN OPTIONS PREVIEW ═══ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0f2b46] mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>Protection Plans</h2>
            <p className="text-gray-500 text-lg">Unlimited legal support on all plans</p>
          </div>

          {/* Core Benefits Banner */}
          <div className="bg-[#0f2b46] rounded-2xl p-6 mb-8 text-white">
            <h3 className="text-sm font-bold text-[#c9a961] uppercase tracking-wider mb-3">Core Benefits — All Plans</h3>
            <div className="grid md:grid-cols-2 gap-2">
              {CORE_BENEFITS.map((b, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-white/80">
                  <span className="text-[#c9a961]">✓</span>{b}
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div key={plan.id} className={`relative bg-white rounded-2xl border-2 p-6 transition-all hover:shadow-xl ${plan.popular ? 'border-[#c9a961] shadow-lg scale-[1.02]' : 'border-gray-200'}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#c9a961] text-[#0f2b46] text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">Most Popular</div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{plan.emoji}</span>
                  <h3 className="text-lg font-bold text-[#0f2b46]">{plan.name}</h3>
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-bold text-[#0f2b46]">R{plan.price}</span>
                  <span className="text-gray-400 text-sm">/month</span>
                </div>
                <p className="text-xs text-[#c9a961] font-bold mb-4">Unlimited legal support</p>
                <ul className="space-y-2 mb-4">
                  {(plan.features || plan.coverage?.included || []).slice(0, 5).map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-green-500 mt-0.5 font-bold">✓</span>{f}
                    </li>
                  ))}
                </ul>
                {plan.additionalBenefits && (
                  <div className="mb-4 pt-3 border-t border-gray-100">
                    <p className="text-[10px] text-[#c9a961] font-bold uppercase mb-1">Additional Benefits:</p>
                    {plan.additionalBenefits.slice(0, 2).map((b, i) => (
                      <p key={i} className="text-xs text-gray-500 flex items-center gap-1"><span className="text-[#c9a961]">★</span> {b}</p>
                    ))}
                  </div>
                )}
                <button onClick={() => openRegister(plan.name)} className={`block w-full text-center py-3 rounded-xl font-bold text-sm transition-colors ${plan.popular ? 'bg-[#c9a961] text-[#0f2b46] hover:bg-[#d4af37]' : 'bg-[#0f2b46] text-white hover:bg-[#1a365d]'}`}>
                  Get Started — {plan.name}
                </button>
              </div>
            ))}
          </div>
          {/* Plan info */}
          <div className="max-w-5xl mx-auto mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-[#0f2b46] mb-2">Important Information</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>✓ All plans include unlimited consultations and access to legal specialists</li>
              <li>✓ Plan extends to main member, spouse/life partner, and children under 21</li>
              <li>✓ 30-day waiting period for pre-existing matters; immediate for new matters</li>
              <li>✓ 31-day review period — cancel within 31 days for full refund</li>
              <li>✓ Premium waiver for up to 12 months in case of retrenchment or disability</li>
            </ul>
          </div>
          <div className="text-center mt-6">
            <Link href="/pricing" className="text-[#c9a961] font-semibold hover:text-[#0f2b46] transition-colors">
              See full comparison →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section id="testimonials" className="py-20 bg-[#0f2b46] relative overflow-hidden">
        {/* Background image overlay */}
        <div className="absolute inset-0">
          <img src={PEOPLE_IMAGES.colleagues} alt="" className="w-full h-full object-cover opacity-[0.07]" />
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>What Our Members Say</h2>
          <p className="text-white/50 mb-10">Real stories from real South Africans</p>
          <div className="relative min-h-[200px]">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 md:p-10 border border-white/10">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full bg-[#c9a961]/20 border-2 border-[#c9a961] flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-[#c9a961]">{TESTIMONIALS[currentTestimonial].avatar}</span>
              </div>
              <div className="flex justify-center gap-1 mb-4">
                {Array.from({ length: TESTIMONIALS[currentTestimonial].rating }).map((_, i) => (
                  <span key={i} className="text-[#c9a961] text-xl">★</span>
                ))}
              </div>
              <p className="text-white text-lg md:text-xl leading-relaxed mb-6 italic">
                &quot;{TESTIMONIALS[currentTestimonial].text}&quot;
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
        <div className="max-w-5xl mx-auto px-4">
          <div className="relative bg-gradient-to-r from-[#0f2b46] to-[#1a4a7a] rounded-3xl overflow-hidden shadow-2xl">
            {/* Background image */}
            <div className="absolute inset-0">
              <img src={PEOPLE_IMAGES.teamwork} alt="" className="w-full h-full object-cover opacity-10" />
            </div>
            <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center p-8 md:p-12">
              <div>
                <h2 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>Ready to Get Protected?</h2>
                <p className="text-white/70 mb-6 text-lg">Join thousands of South Africans who trust Infinity Legal with their legal matters.</p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/intake" className="px-8 py-3.5 bg-[#c9a961] text-[#0f2b46] font-bold rounded-xl hover:bg-[#d4af37] transition-colors text-lg shadow-md">Get Free Legal Analysis</Link>
                  <button onClick={() => openRegister()} className="px-8 py-3.5 border-2 border-white/30 text-white font-bold rounded-xl hover:bg-white/10 transition-colors text-lg">Get Started Free ⚖️</button>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20">
                  <img src={PEOPLE_IMAGES.family} alt="Family protected by Infinity Legal" className="w-full h-64 object-cover" />
                </div>
              </div>
            </div>
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
              <li><Link href="/pricing" className="hover:text-white transition-colors">Plan Options</Link></li>
              <li><Link href="/resources" className="hover:text-white transition-colors">Resources</Link></li>
              <li><Link href="/intake" className="hover:text-white transition-colors">AI Legal Intake</Link></li>
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
          © {new Date().getFullYear()} Infinity Legal (Pty) Ltd. All rights reserved. Unlimited legal support on all plans — subject to terms and conditions. <Link href="/privacy" className="text-[#c9a961] hover:underline">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  )
}
