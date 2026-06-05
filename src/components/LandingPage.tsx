'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  FolderKanban, FileText, BookOpen, CheckCircle2, Shield,
  Lock, KeyRound, ArrowRight, Menu, X, Send, Bot, Sparkles,
  Scale, MessageSquare, Zap, Globe, Smartphone, Newspaper, Tv,
  Users, Briefcase, Bell, ArrowUpRight, Play, ChevronDown,
  AlertTriangle, RefreshCw, LayoutDashboard, Phone, Mail, MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PaymentWall } from '@/components/PaymentWall';

interface LandingPageProps {
  onSignIn?: () => void;
  onSignUp?: (prefillEmail?: string, prefilledName?: string) => void;
  onLoginClick?: () => void;
  isAuthenticated?: boolean;
  onBackToDashboard?: () => void;
  userName?: string;
}

const caseTypes = [
  'Family Law', 'Criminal Defence', 'Civil Litigation', 'Conveyancing',
  'Estate Planning', 'Corporate Commercial', 'Labour Law', 'Debt Collection',
  'Immigration', 'Personal Injury', 'Other',
];

const trustIndicators = [
  { icon: Shield, label: 'POPIA Compliant' },
  { icon: Lock, label: '256-bit Encryption' },
  { icon: KeyRound, label: '90-Day Password Policy' },
];

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function LandingPage({ onSignIn, onSignUp, onLoginClick, isAuthenticated, onBackToDashboard, userName }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);


  // Resolve action handlers: prefer onLoginClick, fall back to onSignIn/onSignUp
  const handleSignIn = onLoginClick || onSignIn || (() => {});

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignUpWithEmail = (prefillEmail?: string, prefilledName?: string) => {
    if (onLoginClick) {
      onLoginClick();
    } else if (onSignUp) {
      onSignUp();
    }
    if (prefillEmail) {
      sessionStorage.setItem('il_intake_email', prefillEmail);
      if (prefilledName) sessionStorage.setItem('il_intake_name', prefilledName);
    }
  };

  const handleSmoothScroll = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const navLinks = [
    { id: 'ai-intake', label: 'Free AI Intake' },
    { id: 'ask-ai', label: 'Ask AI' },
    { id: 'campaign', label: 'Campaign' },
    { id: 'app', label: 'App' },
    { id: 'media', label: 'Media' },
    { id: 'pricing', label: 'Pricing' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-[#c9a84c] focus:text-[#0c1e3c] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold focus:shadow-lg">Skip to main content</a>
      {/* ===== NAVIGATION ===== */}
      <nav aria-label="Main navigation" className={`sticky top-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#0a1628]/95 backdrop-blur-xl shadow-2xl shadow-black/10' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-3">
              <Image src="/infinity_logo.png" alt="Infinity Legal SA" width={120} height={36} className="object-contain" priority />
            </div>
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map(link => (
                <button key={link.id} onClick={() => handleSmoothScroll(link.id)} className="text-[#8fa4c4] hover:text-white text-[13px] font-medium transition-colors relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c] focus-visible:ring-offset-2">
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-[#c9a84c] transition-all duration-300 group-hover:w-full" />
                </button>
              ))}
            </div>
            <div className="hidden lg:flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <span className="text-[#c9a84c] text-[13px] font-medium">Welcome, {userName}</span>
                  <Button onClick={onBackToDashboard} className="bg-[#c9a84c] text-[#0c1e3c] hover:bg-[#d4b85c] rounded-lg px-5 text-[13px] font-semibold shadow-lg shadow-[#c9a84c]/20 transition-all hover:shadow-[#c9a84c]/30 gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    Back to Dashboard
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={handleSignIn} className="text-[#8fa4c4] hover:text-white hover:bg-transparent text-[13px] font-medium">Sign In</Button>
                  <Button onClick={() => handleSignUpWithEmail()} className="bg-[#c9a84c] text-[#0c1e3c] hover:bg-[#d4b85c] rounded-lg px-5 text-[13px] font-semibold shadow-lg shadow-[#c9a84c]/20 transition-all hover:shadow-[#c9a84c]/30">Get Started</Button>
                </>
              )}
            </div>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 text-white" aria-label="Toggle menu" aria-expanded={mobileMenuOpen}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <div className={`lg:hidden transition-all duration-300 overflow-hidden ${mobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="px-4 pb-4 space-y-1 border-t border-[#1a3358]/50 bg-[#0a1628]/95 backdrop-blur-xl">
            {navLinks.map(link => (
              <button key={link.id} onClick={() => handleSmoothScroll(link.id)} className="block w-full text-left text-[#8fa4c4] hover:text-white px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c] focus-visible:ring-offset-2">
                {link.label}
              </button>
            ))}
            <div className="flex gap-3 pt-3">
              {isAuthenticated ? (
                <Button onClick={() => { setMobileMenuOpen(false); onBackToDashboard?.(); }} className="flex-1 bg-[#c9a84c] text-[#0c1e3c] hover:bg-[#d4b85c] rounded-lg text-sm font-semibold gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  Back to Dashboard
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => { setMobileMenuOpen(false); handleSignIn(); }} className="flex-1 border-[#c9a84c]/40 text-[#c9a84c] rounded-lg text-sm">Sign In</Button>
                  <Button onClick={() => { setMobileMenuOpen(false); handleSignUpWithEmail(); }} className="flex-1 bg-[#c9a84c] text-[#0c1e3c] hover:bg-[#d4b85c] rounded-lg text-sm font-semibold">Get Started</Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="relative bg-[#0a1628] overflow-hidden">
        {/* Atmospheric background layers */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#0c1e3c] to-[#071020]" />
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#c9a84c]/[0.03] rounded-full blur-[120px] -translate-y-1/3 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#c9a84c]/[0.02] rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />
          {/* Subtle geometric lines */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hero-grid" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#c9a84c" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-grid)" />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-44">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-8 items-center">
            {/* Left: Copy — 3/5 */}
            <div className="lg:col-span-3 max-w-2xl">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-[#c9a84c]/[0.08] border border-[#c9a84c]/20 rounded-full mb-8">
                <div className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] animate-pulse" />
                <span className="text-[#c9a84c] text-[11px] font-semibold uppercase tracking-[0.15em]">AI-Powered Legal Platform</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-[4.25rem] font-bold text-white leading-[1.1] tracking-tight">
                Your Rights,{' '}
                <span className="relative inline-block">
                  <span className="relative z-10 text-[#c9a84c]">Reinforced</span>
                  <span className="absolute bottom-1 left-0 w-full h-2 bg-[#c9a84c]/20 -skew-x-3" />
                </span>
                <span className="text-[#c9a84c]">.</span>
              </h1>
              <p className="mt-7 text-base sm:text-lg text-[#7a8fb0] max-w-xl leading-relaxed">
                South Africa&apos;s first AI-powered legal practice management platform. Free AI intake that captures your matter before you even sign up. Plans from{' '}
                <span className="text-white font-medium">R99/month</span>.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-3">
                {isAuthenticated ? (
                  <Button onClick={onBackToDashboard} size="lg" className="bg-[#c9a84c] text-[#0c1e3c] hover:bg-[#d4b85c] rounded-xl px-7 h-12 text-sm font-semibold shadow-lg shadow-[#c9a84c]/20 gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    Back to Dashboard
                  </Button>
                ) : (
                  <Button onClick={() => handleSignUpWithEmail()} size="lg" className="bg-[#c9a84c] text-[#0c1e3c] hover:bg-[#d4b85c] rounded-xl px-7 h-12 text-sm font-semibold shadow-lg shadow-[#c9a84c]/20 group">
                    Free AI Intake <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                )}
                <Button onClick={() => handleSmoothScroll('ask-ai')} variant="outline" size="lg" className="border-[#2a3f5f] text-[#8fa4c4] hover:bg-[#132d52] hover:text-white rounded-xl px-7 h-12 text-sm font-medium">
                  <Bot className="w-4 h-4 mr-2 text-[#c9a84c]" /> Ask AI
                </Button>
                <Button onClick={() => handleSmoothScroll('pricing')} size="lg" className="bg-[#1a3358] text-[#c9a84c] hover:bg-[#0c1e3c] rounded-xl px-7 h-12 text-sm font-medium border border-[#c9a84c]/20 transition-colors">
                  Explore Practice Areas
                </Button>
              </div>
              <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3">
                {trustIndicators.map((item) => (
                  <span key={item.label} className="flex items-center gap-2 text-[11px] text-[#7a8fb0] font-medium">
                    <item.icon className="w-3.5 h-3.5 text-[#c9a84c]/50" />{item.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Floating portal preview — 2/5 */}
            <div className="lg:col-span-2 hidden lg:block">
              <div className="relative">
                {/* Glow behind card */}
                <div className="absolute -inset-4 bg-[#c9a84c]/[0.06] rounded-3xl blur-2xl" />
                <div className="relative bg-[#0f2240]/80 backdrop-blur-xl border border-[#1a3a65]/60 rounded-2xl p-5 shadow-2xl shadow-black/30">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                    <span className="ml-3 text-[10px] text-[#7a8fb0] font-mono">portal.infinitylegal.org</span>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { icon: FolderKanban, title: 'Case Management', sub: 'Track all your matters in one place', accent: true },
                      { icon: MessageSquare, title: 'Secure Messaging', sub: 'Communicate with your attorney', accent: false },
                      { icon: Bot, title: 'AI-Powered Analysis', sub: 'Instant legal insights on your matter', accent: false },
                      { icon: Bell, title: 'Deadline Tracking', sub: 'Never miss a court date or filing', accent: false },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-[#0a1628]/60 rounded-lg border border-[#1a3358]/40 hover:border-[#c9a84c]/20 transition-colors">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.accent ? 'bg-[#c9a84c]/15' : 'bg-[#132d52]'}`}>
                          <item.icon className={`w-4 h-4 ${item.accent ? 'text-[#c9a84c]' : 'text-[#5a7199]'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-white truncate">{item.title}</p>
                          <p className="text-[10px] text-[#7a8fb0]">{item.sub}</p>
                        </div>
                        {item.accent && <div className="w-2 h-2 rounded-full bg-[#c9a84c] animate-pulse" />}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#1a3358]/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#c9a84c]/20 flex items-center justify-center text-[8px] font-bold text-[#c9a84c]">IL</div>
                      <span className="text-[10px] text-[#7a8fb0]">Your Portal</span>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-[#28c840]">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#28c840]" />Online
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ===== FREE AI INTAKE ===== */}
      <section id="ai-intake" aria-labelledby="ai-intake-heading" className="py-20 sm:py-28 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header — left-aligned, not centered */}
          <div className="max-w-xl mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200/60 rounded-full mb-5">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span className="text-emerald-700 text-[11px] font-semibold uppercase tracking-wider">100% Free — No Sign-Up Required</span>
            </div>
            <h2 id="ai-intake-heading" className="text-3xl sm:text-4xl font-bold text-[#0c1e3c] tracking-tight leading-tight">
              Describe your matter.<br />Get instant AI analysis.
            </h2>
            <p className="mt-4 text-slate-500 text-base leading-relaxed">
              When you sign up, our legal team already has light on what your matter is about — no repeating yourself.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            {/* Form — 3/5 */}
            <div className="lg:col-span-3">
              <IntakeForm onSignUp={handleSignUpWithEmail} />
            </div>

            {/* How it works — 2/5, vertical timeline */}
            <div className="lg:col-span-2">
              <div className="space-y-0">
                {[
                  { step: '01', icon: FileText, title: 'Describe Your Matter', desc: 'Select your case type, set urgency, and tell us the details.' },
                  { step: '02', icon: Bot, title: 'AI Analyses Your Case', desc: 'Our AI reviews your matter and returns a structured assessment with next steps.' },
                  { step: '03', icon: Scale, title: 'Legal Team Gets Context', desc: 'When you sign up, our attorneys already understand your situation.' },
                  { step: '04', icon: CheckCircle2, title: 'Matched to a Plan', desc: 'We recommend the best legal plan for your needs — from R99/month.' },
                ].map((item, i) => (
                  <div key={item.step} className="relative flex gap-5 pb-8 last:pb-0">
                    {/* Timeline line */}
                    {i < 3 && <div className="absolute left-[23px] top-12 bottom-0 w-px bg-[#c9a84c]/20" />}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-[#0c1e3c] flex items-center justify-center relative z-10">
                        <item.icon className="w-5 h-5 text-[#c9a84c]" />
                      </div>
                    </div>
                    <div className="pt-1">
                      <span className="text-[10px] font-bold text-[#c9a84c] tracking-widest uppercase">Step {item.step}</span>
                      <h4 className="font-semibold text-[#0c1e3c] mt-0.5">{item.title}</h4>
                      <p className="text-sm text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-[#f8f6f0] rounded-xl border border-[#e8e2d4]">
                <div className="flex items-start gap-3">
                  <Shield className="w-4 h-4 text-[#a88832] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[13px] font-semibold text-[#0c1e3c]">POPIA Protected</p>
                    <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">Your information is encrypted and only shared with our legal team if you choose to sign up.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ASK AI ===== */}
      <section id="ask-ai" aria-labelledby="ask-ai-heading" className="py-20 sm:py-28 bg-[#f7f8fa] relative overflow-hidden">
        {/* Subtle decorative element */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#c9a84c]/[0.03] rounded-full blur-[80px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0c1e3c]/[0.04] border border-[#0c1e3c]/10 rounded-full mb-5">
              <Bot className="w-3 h-3 text-[#a88832]" />
              <span className="text-[#a88832] text-[11px] font-semibold uppercase tracking-wider">AI Legal Assistant</span>
            </div>
            <h2 id="ask-ai-heading" className="text-3xl sm:text-4xl font-bold text-[#0c1e3c] tracking-tight leading-tight">
              Ask about any legal matter.
            </h2>
            <p className="mt-4 text-slate-500 text-base leading-relaxed">
              From family law to labour disputes. Free, instant, and confidential.
            </p>
          </div>
          <AIChatWidget />
        </div>
      </section>

      {/* ===== CAMPAIGN — App Showcase with Real Screenshots ===== */}
      <section id="campaign" aria-labelledby="campaign-heading" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-14">
            <span className="inline-block text-[#c9a84c] text-[11px] font-semibold uppercase tracking-[0.15em] mb-4">Campaigns & Offers</span>
            <h2 id="campaign-heading" className="text-3xl sm:text-4xl font-bold text-[#0c1e3c] tracking-tight leading-tight">
              Making justice accessible.
            </h2>
          </div>

          {/* Featured campaign — full-width with image */}
          <article className="group relative overflow-hidden rounded-2xl bg-[#0c1e3c] min-h-[380px] flex flex-col lg:flex-row">
            <div className="absolute inset-0 lg:hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c1e3c] via-[#0c1e3c]/70 to-transparent" />
            </div>
            {/* Image side */}
            <div className="relative lg:w-1/2 min-h-[240px] lg:min-h-0 overflow-hidden">
              <Image
                src="/images/campaign/app-1.webp"
                alt="Infinity Legal SA App — Know Your Rights Campaign"
                fill
                className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0c1e3c]/30 hidden lg:block" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c1e3c]/80 to-transparent lg:hidden" />
            </div>
            {/* Content side */}
            <div className="relative lg:w-1/2 p-8 sm:p-10 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full mb-5 w-fit">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-300 text-[10px] font-semibold uppercase tracking-wider">Active Campaign</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 leading-tight">Know Your Rights SA</h3>
              <p className="text-[#8fa4c4] text-sm leading-relaxed max-w-md">
                Free legal awareness campaign powered by AI. Get clarity on your constitutional rights, labour protections, and consumer rights — no sign-up required.
              </p>
              <div className="mt-6">
                <Button onClick={() => handleSignUpWithEmail()} className="bg-[#c9a84c] text-[#0c1e3c] hover:bg-[#d4b85c] rounded-lg font-semibold group/btn">
                  Learn More <ArrowUpRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                </Button>
              </div>
            </div>
          </article>

          {/* Smaller campaign cards with images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
            {[
              { img: '/images/campaign/app-2.webp', title: 'Small Business Legal Shield', desc: 'Affordable protection for SMMEs — contracts, CCMA, and debt collection from R99/month.', tag: 'New', tagColor: 'bg-[#c9a84c]/10 text-[#a88832] border-[#c9a84c]/20' },
              { img: '/images/campaign/app-3.webp', title: 'Access to Justice Initiative', desc: 'Pro bono consultations for qualifying individuals. Everyone deserves fair representation.', tag: 'Ongoing', tagColor: 'bg-slate-100 text-slate-600 border-slate-200' },
            ].map((campaign) => (
              <article key={campaign.title} className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200 hover:border-[#c9a84c]/30 hover:shadow-lg hover:shadow-slate-100/80 transition-all duration-300">
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={campaign.img}
                    alt={campaign.title}
                    fill
                    className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                  <div className="absolute top-3 right-3">
                    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border backdrop-blur-sm ${campaign.tagColor}`}>{campaign.tag}</span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-[15px] font-semibold text-[#0c1e3c] mb-1.5">{campaign.title}</h3>
                  <p className="text-[13px] text-slate-500 leading-relaxed">{campaign.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ===== APP SECTION — Full Screenshot Showcase ===== */}
      <section id="app" aria-labelledby="app-heading" className="py-20 sm:py-28 bg-[#0a1628] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628] via-[#0c1e3c] to-[#0a1628]" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.02]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="app-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="#c9a84c" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#app-dots)" />
          </svg>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-14">
            <span className="text-[#c9a84c] text-[11px] font-semibold uppercase tracking-[0.15em]">Mobile & Desktop App</span>
            <h2 id="app-heading" className="text-3xl sm:text-4xl font-bold text-white tracking-tight mt-4 leading-tight">
              Your legal portal, everywhere you go.
            </h2>
            <p className="text-[#7a8fb0] text-base leading-relaxed mt-4 max-w-lg mx-auto">
              Access your cases, documents, and consultations from any device. Message your attorney, track case progress, and get AI-powered updates in real time.
            </p>
          </div>

          {/* App features row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
            {[
              { icon: Smartphone, title: 'Mobile App', desc: 'iOS & Android' },
              { icon: Globe, title: 'Web Portal', desc: 'Full dashboard' },
              { icon: MessageSquare, title: 'Secure Messaging', desc: 'End-to-end encrypted' },
              { icon: Bell, title: 'Real-Time Alerts', desc: 'Never miss a deadline' },
            ].map((feature) => (
              <div key={feature.title} className="flex items-center gap-3 p-4 bg-[#0f2240]/60 border border-[#1a3a65]/50 rounded-xl hover:border-[#c9a84c]/20 transition-colors group">
                <div className="w-9 h-9 rounded-lg bg-[#c9a84c]/[0.08] border border-[#c9a84c]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#c9a84c]/15 transition-colors">
                  <feature.icon className="w-4 h-4 text-[#c9a84c]" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-[13px]">{feature.title}</h4>
                  <p className="text-[#5a7199] text-[10px]">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Screenshot showcase — hero image + 3 thumbnails */}
          <div className="relative">
            {/* Glow behind */}
            <div className="absolute -inset-4 bg-[#c9a84c]/[0.03] rounded-3xl blur-2xl" />

            {/* Main screenshot */}
            <div className="relative rounded-2xl overflow-hidden border border-[#1a3a65]/60 shadow-2xl shadow-black/30">
              <Image
                src="/images/campaign/app-4.webp"
                alt="Infinity Legal SA App Dashboard"
                width={1200}
                height={680}
                className="w-full object-cover object-top"
                priority
              />
            </div>

            {/* Thumbnail row */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { src: '/images/campaign/app-1.webp', alt: 'Know Your Rights Campaign' },
                { src: '/images/campaign/app-2.webp', alt: 'Small Business Legal Shield' },
                { src: '/images/campaign/app-3.webp', alt: 'Access to Justice Initiative' },
              ].map((thumb, i) => (
                <div key={i} className="relative rounded-xl overflow-hidden border border-[#1a3a65]/40 hover:border-[#c9a84c]/30 transition-colors cursor-pointer group">
                  <Image
                    src={thumb.src}
                    alt={thumb.alt}
                    width={400}
                    height={240}
                    className="w-full object-cover object-top opacity-70 group-hover:opacity-100 transition-opacity duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628]/60 to-transparent" />
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-10 flex justify-center gap-3">
            <Button onClick={() => handleSignUpWithEmail()} className="bg-[#c9a84c] text-[#0c1e3c] hover:bg-[#d4b85c] rounded-xl px-7 h-11 text-sm font-semibold shadow-lg shadow-[#c9a84c]/20">Start Free</Button>
            <Button variant="outline" onClick={() => handleSmoothScroll('ask-ai')} className="border-[#2a3f5f] text-[#8fa4c4] hover:bg-[#132d52] hover:text-white rounded-xl px-7 h-11 text-sm">
              <Play className="w-4 h-4 mr-2" />Try AI Intake
            </Button>
          </div>
        </div>
      </section>

      {/* ===== MEDIA — Featured article + list ===== */}
      <section id="media" aria-labelledby="media-heading" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-14">
            <div>
              <span className="text-[#c9a84c] text-[11px] font-semibold uppercase tracking-[0.15em]">News & Media</span>
              <h2 id="media-heading" className="text-3xl sm:text-4xl font-bold text-[#0c1e3c] tracking-tight mt-3 leading-tight">In the news.</h2>
            </div>
            <Button variant="link" className="hidden sm:flex text-[#a88832] hover:text-[#8a6e28] font-semibold text-sm">
              View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            {/* Featured article */}
            <div className="lg:col-span-2 group relative overflow-hidden rounded-2xl bg-[#f7f8fa] border border-slate-200 hover:border-[#c9a84c]/30 transition-all duration-300 hover:shadow-xl hover:shadow-slate-100/50">
              <div className="p-8 sm:p-10">
                <div className="flex items-center gap-2 mb-5">
                  <Newspaper className="w-4 h-4 text-[#c9a84c]" />
                  <span className="text-[10px] font-semibold text-[#a88832] uppercase tracking-wider">Feature</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#0c1e3c] mb-3 leading-tight group-hover:text-[#a88832] transition-colors">
                  AI-Powered Legal Intake for South Africans
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed max-w-lg">
                  Describe your legal matter and receive instant AI analysis before consulting with an attorney — no sign-up required. Built with South African law in mind.
                </p>
                <Button variant="link" onClick={() => handleSmoothScroll('ask-ai')} className="mt-6 p-0 text-[#a88832] hover:text-[#8a6e28] font-semibold text-sm group/link">
                  Try It Now <ArrowUpRight className="w-3.5 h-3.5 ml-1 group-hover/link:translate-x-0.5 transition-transform" />
                </Button>
              </div>
            </div>

            {/* Article list */}
            <div className="space-y-0 divide-y divide-slate-100">
              {[
                { icon: Tv, category: 'Feature', title: 'POPIA-Compliant Case Management Built for SA Law Firms' },
                { icon: BookOpen, category: 'Resource', title: 'Understanding Your Rights Under the Labour Relations Act' },
                { icon: Briefcase, category: 'Feature', title: 'Affordable Legal Plans Starting from R99/Month' },
                { icon: Zap, category: 'Feature', title: 'Secure Document Management with Attorney Oversight' },
              ].map((article) => (
                <div key={article.title} className="group flex items-start gap-4 py-4 first:pt-0 last:pb-0 hover:bg-[#f7f8fa] -mx-3 px-3 rounded-lg transition-colors cursor-pointer">
                  <div className="w-8 h-8 rounded-lg bg-[#0c1e3c]/[0.04] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <article.icon className="w-3.5 h-3.5 text-[#0c1e3c]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-semibold text-[#a88832] uppercase tracking-wider">{article.category}</span>
                    </div>
                    <h4 className="text-[13px] font-medium text-[#0c1e3c] leading-snug line-clamp-2 group-hover:text-[#a88832] transition-colors">{article.title}</h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" aria-labelledby="pricing-heading" className="py-20 sm:py-28 bg-[#f7f8fa]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-[#c9a84c] text-[11px] font-semibold uppercase tracking-[0.15em]">Pricing</span>
            <h2 id="pricing-heading" className="text-3xl sm:text-4xl font-bold text-[#0c1e3c] tracking-tight mt-3">
              Simple, transparent pricing.
            </h2>
            <p className="mt-4 text-slate-500 text-base">All plans include POPIA compliance and AI-powered case analysis.</p>
          </div>
          <PaymentWall
            isAuthenticated={isAuthenticated}
            onLoginClick={handleSignIn}
          />
        </div>
      </section>

      {/* ===== SECURITY ===== */}
      <section className="py-20 sm:py-24 bg-[#0a1628] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628] via-[#0c1e3c] to-[#0a1628]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-[#c9a84c] text-[11px] font-semibold uppercase tracking-[0.15em]">Security & Compliance</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mt-3">Enterprise-grade security.</h2>
            <p className="mt-4 text-[#7a8fb0] text-base max-w-lg mx-auto">Your data is protected with the highest standards of security and South African compliance.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {trustIndicators.map((item) => (
              <div key={item.label} className="flex items-center gap-4 p-6 bg-[#0f2240]/60 border border-[#1a3a65]/50 rounded-xl hover:border-[#c9a84c]/20 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-[#c9a84c]/[0.08] flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-[#c9a84c]" />
                </div>
                <span className="text-white font-semibold text-sm">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-[#060e1a] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand & Copyright */}
            <div className="flex flex-col gap-3">
              <Image src="/infinity_logo.png" alt="Infinity Legal SA" width={100} height={28} className="object-contain" />
              <p className="text-[#3a506f] text-[11px]">&copy; {new Date().getFullYear()} Infinity Legal (Pty) Ltd. All rights reserved.</p>
              <p className="text-[#2a3f5f] text-[10px]">Designed and developed in South Africa</p>
            </div>
            {/* Contact Details */}
            <div className="flex flex-col gap-3">
              <h4 className="text-[#c9a84c] text-[11px] font-semibold uppercase tracking-wider">Contact Us</h4>
              <div className="flex flex-col gap-2 text-[12px]">
                <a href="tel:+27681276038" className="text-[#7a8fb0] hover:text-[#c9a84c] transition-colors flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                  068 127 6038
                </a>
                <a href="https://wa.me/27681276038" target="_blank" rel="noopener noreferrer" className="text-[#7a8fb0] hover:text-[#c9a84c] transition-colors flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                  WhatsApp: 068 127 6038
                </a>
                <a href="mailto:info@infinitylegal.org" className="text-[#7a8fb0] hover:text-[#c9a84c] transition-colors flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                  info@infinitylegal.org
                </a>
                <span className="text-[#7a8fb0] flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  93 Grayston Drive, Sandton
                </span>
              </div>
            </div>
            {/* Legal Links */}
            <div className="flex flex-col gap-3">
              <h4 className="text-[#c9a84c] text-[11px] font-semibold uppercase tracking-wider">Legal</h4>
              <div className="flex flex-col gap-2 text-[12px]">
                <a href="#" className="text-[#7a8fb0] hover:text-[#c9a84c] transition-colors">Privacy Policy</a>
                <a href="#" className="text-[#7a8fb0] hover:text-[#c9a84c] transition-colors">Terms of Service</a>
                <a href="#" className="text-[#7a8fb0] hover:text-[#c9a84c] transition-colors">POPIA Compliance</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/27681276038"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] hover:bg-[#20bd5a] rounded-full flex items-center justify-center shadow-lg shadow-[#25D366]/30 transition-all hover:scale-110"
        aria-label="Chat on WhatsApp"
      >
        <MessageSquare className="w-6 h-6 text-white" />
      </a>
    </div>
  );
}

// ============================================
// AI INTAKE FORM
// ============================================
export function IntakeForm({ onSignUp }: { onSignUp: (email?: string, name?: string) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [caseType, setCaseType] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  const [popiaConsent, setPopiaConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, caseType, description, urgency, consent_given: consentGiven, popia_consent: popiaConsent }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error?.message || 'Submission failed');
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  if (result) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-[#0c1e3c] text-[15px]">AI Analysis Complete</h3>
            <p className="text-[11px] text-slate-500">Reference: {result.reference_id}</p>
          </div>
        </div>
        <div className="text-sm text-slate-700 whitespace-pre-wrap bg-[#f7f8fa] p-5 rounded-xl border border-slate-100 max-h-80 overflow-y-auto leading-relaxed">
          {result.ai_analysis}
        </div>
        <div className="mt-5 flex gap-3">
          <Button onClick={() => setResult(null)} variant="outline" className="flex-1 rounded-xl h-11 text-sm">New Intake</Button>
          <Button onClick={() => onSignUp(email, name)} className="flex-1 bg-[#c9a84c] text-[#0c1e3c] hover:bg-[#d4b85c] rounded-xl h-11 text-sm font-semibold">Sign Up to Continue</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="intake-name" className="text-[12px] font-medium text-slate-700">Full Name *</Label>
            <Input id="intake-name" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" className="mt-1.5 h-10" />
          </div>
          <div>
            <Label htmlFor="intake-email" className="text-[12px] font-medium text-slate-700">Email *</Label>
            <Input id="intake-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" className="mt-1.5 h-10" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="intake-phone" className="text-[12px] font-medium text-slate-700">Phone (optional)</Label>
            <Input id="intake-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+27 82 000 0000" className="mt-1.5 h-10" />
          </div>
          <div>
            <Label htmlFor="intake-case-type" className="text-[12px] font-medium text-slate-700">Case Type *</Label>
            <div className="relative mt-1.5">
              <select id="intake-case-type" value={caseType} onChange={e => setCaseType(e.target.value)} className="w-full h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring appearance-none">
                <option value="">Select type...</option>
                {caseTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
        <div>
          <Label className="text-[12px] font-medium text-slate-700">Urgency *</Label>
          <div role="radiogroup" aria-label="Urgency level" className="flex gap-2 mt-2">
            {['low', 'medium', 'high', 'critical'].map(level => (
              <button key={level} role="radio" aria-checked={urgency === level} onClick={() => setUrgency(level)} className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${
                urgency === level
                  ? level === 'critical' ? 'bg-red-50 border-red-200 text-red-700'
                    : level === 'high' ? 'bg-orange-50 border-orange-200 text-orange-700'
                    : level === 'medium' ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label htmlFor="intake-description" className="text-[12px] font-medium text-slate-700">Describe Your Legal Matter *</Label>
          <textarea id="intake-description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell us about your situation. The more detail you provide, the better our AI can assess your matter..." rows={4} className="mt-1.5 w-full rounded-md border border-input bg-transparent px-3 py-2.5 text-sm shadow-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
        </div>
        <div className="space-y-2.5">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input type="checkbox" checked={consentGiven} onChange={e => setConsentGiven(e.target.checked)} className="mt-0.5 rounded border-slate-300" />
            <span className="text-[11px] text-slate-600 leading-relaxed">I consent to sharing my information with Infinity Legal SA for the purpose of legal intake assessment.</span>
          </label>
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input type="checkbox" checked={popiaConsent} onChange={e => setPopiaConsent(e.target.checked)} className="mt-0.5 rounded border-slate-300" />
            <span className="text-[11px] text-slate-600 leading-relaxed">I consent to the processing of my personal information in accordance with POPIA.</span>
          </label>
        </div>
        {error && <p className="text-[12px] text-red-500 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" />{error}</p>}
        <Button onClick={handleSubmit} disabled={loading || !name || !email || !caseType || !description || !urgency || !consentGiven || !popiaConsent} className="w-full bg-[#0c1e3c] text-white hover:bg-[#1a3358] rounded-xl h-11 text-sm font-semibold transition-all">
          {loading ? <><RefreshCw className="w-4 h-4 animate-spin mr-2" />Analysing...</> : <><Sparkles className="w-4 h-4 mr-2" />Get Free AI Analysis</>}
        </Button>
      </div>
    </div>
  );
}

// ============================================
// AI CHAT WIDGET
// ============================================
export function AIChatWidget() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'assistant', content: 'Welcome to Infinity Legal SA. I\'m your AI legal assistant — I can help you understand your rights, explain legal processes, and guide you on next steps. What legal matter can I help you with today?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: `user-${Date.now()}`, role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const conversationHistory = messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .slice(-10);

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, sessionId, conversationHistory }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, { id: `ai-${Date.now()}`, role: 'assistant', content: data.data.response }]);
      } else {
        setMessages(prev => [...prev, { id: `ai-${Date.now()}`, role: 'assistant', content: 'I\'m having trouble connecting right now. Please try again in a moment.' }]);
      }
    } catch {
      setMessages(prev => [...prev, { id: `ai-${Date.now()}`, role: 'assistant', content: 'Network error. Please check your connection and try again.' }]);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 bg-[#f7f8fa]">
          <div className="w-8 h-8 rounded-full bg-[#0c1e3c] flex items-center justify-center">
            <Bot className="w-4 h-4 text-[#c9a84c]" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#0c1e3c]">Infinity Legal AI</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-slate-500">Online · Confidential</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="h-[400px] overflow-y-auto p-5 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${msg.role === 'user'
                ? 'bg-[#0c1e3c] text-white rounded-2xl rounded-br-md'
                : 'bg-[#f7f8fa] text-slate-700 rounded-2xl rounded-bl-md border border-slate-100'
              } px-4 py-3`}>
                <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#f7f8fa] border border-slate-100 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-[#c9a84c] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-[#c9a84c] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-[#c9a84c] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask about your legal matter..."
              className="flex-1 h-10 border-slate-200 focus:border-[#c9a84c]/40 focus:ring-[#c9a84c]/20 text-sm"
              disabled={loading}
            />
            <Button onClick={sendMessage} disabled={!input.trim() || loading} className="bg-[#0c1e3c] text-white hover:bg-[#1a3358] rounded-xl h-10 w-10 p-0 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[9px] text-slate-400 mt-2 text-center">AI responses are for informational purposes only and do not constitute legal advice.</p>
        </div>
      </div>
    </div>
  );
}
