import React, { Suspense } from 'react';
import Image from 'next/image';
import {
  Shield, Lock, KeyRound, ArrowRight, CheckCircle2,
  Sparkles, FileText, Bot, Scale, Smartphone, Globe,
  MessageSquare, Bell, Newspaper, Tv, BookOpen, Briefcase, Zap,
  Phone, Mail, MapPin, Star, Clock, Play, ArrowUpRight,
} from 'lucide-react';

// Client components imported directly — they create client boundaries in the server component
import LandingIntakeForm from '@/components/LandingIntakeForm';
import { AIChatWidget, LegalArticlesSection } from '@/components/LandingPage';

// ============================================
// SKELETON LOADING COMPONENTS
// ============================================
function IntakeFormSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-pulse">
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><div className="h-3 bg-slate-100 rounded w-16 mb-2" /><div className="h-10 bg-slate-100 rounded" /></div>
          <div><div className="h-3 bg-slate-100 rounded w-12 mb-2" /><div className="h-10 bg-slate-100 rounded" /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><div className="h-3 bg-slate-100 rounded w-20 mb-2" /><div className="h-10 bg-slate-100 rounded" /></div>
          <div><div className="h-3 bg-slate-100 rounded w-16 mb-2" /><div className="h-10 bg-slate-100 rounded" /></div>
        </div>
        <div><div className="h-3 bg-slate-100 rounded w-24 mb-2" /><div className="h-20 bg-slate-100 rounded" /></div>
        <div className="h-11 bg-slate-100 rounded-xl" />
      </div>
    </div>
  );
}

function AIChatSkeleton() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-pulse">
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 bg-[#f7f8fa]">
          <div className="w-8 h-8 rounded-full bg-slate-200" />
          <div><div className="h-3 bg-slate-200 rounded w-28 mb-1" /><div className="h-2 bg-slate-100 rounded w-16" /></div>
        </div>
        <div className="h-[400px] p-5"><div className="max-w-[80%] bg-[#f7f8fa] border border-slate-100 rounded-2xl rounded-bl-md px-4 py-3"><div className="h-3 bg-slate-200 rounded w-full mb-2" /><div className="h-3 bg-slate-100 rounded w-3/4" /></div></div>
        <div className="px-4 py-3 border-t border-slate-100"><div className="h-10 bg-slate-100 rounded-xl" /></div>
      </div>
    </div>
  );
}

function LegalArticlesSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {[1, 2, 3].map(i => (
        <div key={i} className="rounded-2xl border border-slate-100 bg-white p-6 animate-pulse">
          <div className="h-3 bg-slate-100 rounded w-20 mb-3" />
          <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
          <div className="h-3 bg-slate-100 rounded w-full mb-1" />
          <div className="h-3 bg-slate-100 rounded w-2/3" />
        </div>
      ))}
    </div>
  );
}

// ============================================
// NAV LINKS
// ============================================
const navLinks = [
  { id: 'ai-intake', label: 'Free AI Intake' },
  { id: 'ask-ai', label: 'Ask AI' },
  { id: 'campaign', label: 'Campaign' },
  { id: 'app', label: 'App' },
  { id: 'articles', label: 'Legal Articles' },
  { id: 'pricing', label: 'Pricing' },
];

const trustIndicators = [
  { icon: Shield, label: 'POPIA Compliant' },
  { icon: Lock, label: '256-bit Encryption' },
  { icon: KeyRound, label: '90-Day Password Policy' },
];

// ============================================
// SERVER COMPONENT — Full Static Landing Page
// ============================================
export default function LandingServer() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col bg-white" id="landing-page-root">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-[#c9a84c] focus:text-[#0c1e3c] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold focus:shadow-lg">Skip to main content</a>

      {/* ===== NAVIGATION ===== */}
      <nav aria-label="Main navigation" className="sticky top-0 z-50 transition-all duration-500 bg-transparent" id="landing-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-3">
              <Image src="/logo_legal.png" alt="Infinity Legal SA" width={100} height={56} className="object-contain" priority />
            </div>
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map(link => (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  className="text-[#8fa4c4] hover:text-white text-[13px] font-medium transition-colors relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c] focus-visible:ring-offset-2"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-[#c9a84c] transition-all duration-300 group-hover:w-full" />
                </a>
              ))}
            </div>
            <div className="hidden lg:flex items-center gap-3" id="nav-auth-buttons">
              <button
                type="button"
                data-action="sign-in"
                className="text-[#8fa4c4] hover:text-white hover:bg-transparent text-[13px] font-medium transition-colors px-3 py-1.5"
              >
                Sign In
              </button>
              <button
                type="button"
                data-action="sign-up"
                className="bg-[#c9a84c] text-[#0c1e3c] hover:bg-[#d4b85c] rounded-lg px-5 text-[13px] font-semibold shadow-lg shadow-[#c9a84c]/20 transition-all hover:shadow-[#c9a84c]/30"
              >
                Get Started
              </button>
            </div>
            <button
              type="button"
              id="mobile-menu-toggle"
              className="lg:hidden p-2 text-white"
              aria-label="Toggle menu"
              aria-expanded="false"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </button>
          </div>
        </div>
        {/* Mobile menu — hidden by default, toggled by LandingHydration */}
        <div id="mobile-menu" className="lg:hidden transition-all duration-300 overflow-hidden max-h-0 opacity-0">
          <div className="px-4 pb-4 space-y-1 border-t border-[#1a3358]/50 bg-[#0a1628]/95 backdrop-blur-xl">
            {navLinks.map(link => (
              <a key={link.id} href={`#${link.id}`} className="block w-full text-left text-[#8fa4c4] hover:text-white px-3 py-2.5 text-sm transition-colors">
                {link.label}
              </a>
            ))}
            <div className="flex gap-3 pt-3">
              <button
                type="button"
                data-action="sign-in"
                className="flex-1 border border-[#c9a84c]/40 text-[#c9a84c] rounded-lg text-sm py-2"
              >
                Sign In
              </button>
              <button
                type="button"
                data-action="sign-up"
                className="flex-1 bg-[#c9a84c] text-[#0c1e3c] hover:bg-[#d4b85c] rounded-lg text-sm font-semibold py-2"
              >
                Get Started
              </button>
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
                <button
                  type="button"
                  data-action="sign-up"
                  className="bg-[#c9a84c] text-[#0c1e3c] hover:bg-[#d4b85c] rounded-xl px-7 h-12 text-sm font-semibold shadow-lg shadow-[#c9a84c]/20 inline-flex items-center justify-center gap-2 group"
                >
                  Free AI Intake <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <a
                  href="#ask-ai"
                  className="border-[#2a3f5f] text-[#8fa4c4] hover:bg-[#132d52] hover:text-white rounded-xl px-7 h-12 text-sm font-medium inline-flex items-center justify-center gap-2 border transition-colors"
                >
                  <Bot className="w-4 h-4 text-[#c9a84c]" /> Ask AI
                </a>
                <a
                  href="#pricing"
                  className="bg-[#1a3358] text-[#c9a84c] hover:bg-[#0c1e3c] rounded-xl px-7 h-12 text-sm font-medium border border-[#c9a84c]/20 transition-colors inline-flex items-center justify-center"
                >
                  Explore Practice Areas
                </a>
              </div>
              <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3">
                {trustIndicators.map((item) => (
                  <span key={item.label} className="flex items-center gap-2 text-[11px] text-[#7a8fb0] font-medium">
                    <item.icon className="w-3.5 h-3.5 text-[#c9a84c]/50" />{item.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Official branded creative — 2/5 */}
            <div className="lg:col-span-2 hidden lg:block">
              <div className="relative">
                <div className="absolute -inset-4 bg-[#c9a84c]/[0.08] rounded-3xl blur-2xl" />
                <div className="relative rounded-2xl overflow-hidden border border-[#1a3a65]/60 shadow-2xl shadow-black/30">
                  <Image
                    src="/images/official/creative-app-hero.png"
                    alt="Infinity Legal SA — Your Rights, Reinforced. AI-powered legal protection on your phone."
                    width={600}
                    height={720}
                    className="w-full object-cover object-center"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628]/30 via-transparent to-transparent" />
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
              <Suspense fallback={<IntakeFormSkeleton />}>
                <LandingIntakeForm />
              </Suspense>
              {/* Mobile creative */}
              <div className="mt-6 lg:hidden relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                <Image
                  src="/images/official/creative-ai-pocket.png"
                  alt="Infinity Legal SA — Legal in Your Pocket. AI-powered intake handles the heavy lifting."
                  width={800}
                  height={500}
                  className="w-full object-cover object-center"
                />
              </div>
            </div>

            {/* How it works + branded creative — 2/5 */}
            <div className="lg:col-span-2">
              <div className="space-y-0">
                {[
                  { step: '01', icon: FileText, title: 'Describe Your Matter', desc: 'Select your case type, set urgency, and tell us the details.' },
                  { step: '02', icon: Bot, title: 'AI Analyses Your Case', desc: 'Our AI reviews your matter and returns a structured assessment with next steps.' },
                  { step: '03', icon: Scale, title: 'Legal Team Gets Context', desc: 'When you sign up, our attorneys already understand your situation.' },
                  { step: '04', icon: CheckCircle2, title: 'Matched to a Plan', desc: 'We recommend the best legal plan for your needs — from R99/month.' },
                ].map((item, i) => (
                  <div key={item.step} className="relative flex gap-5 pb-8 last:pb-0">
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

              {/* Desktop creative */}
              <div className="mt-6 relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm hidden lg:block">
                <Image
                  src="/images/official/creative-ai-pocket.png"
                  alt="Infinity Legal SA — Legal in Your Pocket. AI-powered intake handles the heavy lifting."
                  width={600}
                  height={380}
                  className="w-full object-cover object-center"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ASK AI ===== */}
      <section id="ask-ai" aria-labelledby="ask-ai-heading" className="py-20 sm:py-28 bg-[#f7f8fa] relative overflow-hidden">
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
          <Suspense fallback={<AIChatSkeleton />}>
            <AIChatWidget />
          </Suspense>
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

          {/* Featured campaign */}
          <article className="group relative overflow-hidden rounded-2xl bg-[#0c1e3c] min-h-[380px] flex flex-col lg:flex-row">
            <div className="absolute inset-0 lg:hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c1e3c] via-[#0c1e3c]/70 to-transparent" />
            </div>
            <div className="relative lg:w-1/2 min-h-[240px] lg:min-h-0 overflow-hidden">
              <Image
                src="/images/official/creative-contracts.png"
                alt="Infinity Legal SA — Read before you sign. AI reviews your contracts instantly."
                fill
                className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0c1e3c]/30 hidden lg:block" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c1e3c]/80 to-transparent lg:hidden" />
            </div>
            <div className="relative lg:w-1/2 p-8 sm:p-10 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full mb-5 w-fit">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-300 text-[10px] font-semibold uppercase tracking-wider">Active Campaign</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 leading-tight">Read Before You Sign</h3>
              <p className="text-[#8fa4c4] text-sm leading-relaxed max-w-md">
                Don&apos;t get trapped by the fine print. Our AI reviews your contracts instantly — highlighting risks, unfair clauses, and missing protections before you commit.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  data-action="sign-up"
                  className="bg-[#c9a84c] text-[#0c1e3c] hover:bg-[#d4b85c] rounded-lg font-semibold inline-flex items-center gap-1 px-5 py-2.5 group/btn"
                >
                  Try Free Analysis <ArrowUpRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </article>

          {/* Smaller campaign cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
            {[
              { img: '/images/official/creative-tenant-rights.png', title: 'Know Your Tenant Rights', desc: 'AI-powered lease analysis that highlights unfair clauses, missing protections, and your rights as a tenant in South Africa.', tag: 'New', tagColor: 'bg-[#c9a84c]/10 text-[#a88832] border-[#c9a84c]/20' },
              { img: '/images/official/creative-subscription.png', title: 'Legal Peace of Mind from R99', desc: 'Affordable legal subscription plans for everyone. Get attorney access, document review, and AI-powered legal guidance.', tag: 'Popular', tagColor: 'bg-slate-100 text-slate-600 border-slate-200' },
            ].map((campaign) => (
              <article key={campaign.title} className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200 hover:border-[#c9a84c]/30 hover:shadow-lg hover:shadow-slate-100/80 transition-all duration-300">
                <div className="relative h-56 overflow-hidden">
                  <Image
                    src={campaign.img}
                    alt={campaign.title}
                    fill
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
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

      {/* ===== APP SECTION ===== */}
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

          {/* Screenshot showcase */}
          <div className="relative">
            <div className="absolute -inset-4 bg-[#c9a84c]/[0.03] rounded-3xl blur-2xl" />
            <div className="relative rounded-2xl overflow-hidden border border-[#1a3a65]/60 shadow-2xl shadow-black/30">
              <Image
                src="/images/official/creative-app-hero.png"
                alt="Infinity Legal SA — Your Rights, Reinforced. Navigate consumer disputes with AI-powered legal protection."
                width={1200}
                height={680}
                className="w-full object-cover object-center"
                priority
              />
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { src: '/images/official/creative-contracts.png', alt: 'Read Before You Sign — AI Contract Review' },
                { src: '/images/official/creative-tenant-rights.png', alt: 'Know Your Tenant Rights — Lease Analysis' },
                { src: '/images/official/creative-subscription.png', alt: 'Legal Peace of Mind from R99/Month' },
              ].map((thumb, i) => (
                <div key={i} className="relative rounded-xl overflow-hidden border border-[#1a3a65]/40 hover:border-[#c9a84c]/30 transition-colors cursor-pointer group">
                  <Image
                    src={thumb.src}
                    alt={thumb.alt}
                    width={400}
                    height={240}
                    className="w-full object-cover object-center opacity-70 group-hover:opacity-100 transition-opacity duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628]/60 to-transparent" />
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-10 flex justify-center gap-3">
            <button
              type="button"
              data-action="sign-up"
              className="bg-[#c9a84c] text-[#0c1e3c] hover:bg-[#d4b85c] rounded-xl px-7 h-11 text-sm font-semibold shadow-lg shadow-[#c9a84c]/20 inline-flex items-center"
            >
              Start Free
            </button>
            <a
              href="#ask-ai"
              className="border-[#2a3f5f] text-[#8fa4c4] hover:bg-[#132d52] hover:text-white rounded-xl px-7 h-11 text-sm inline-flex items-center gap-2 border transition-colors"
            >
              <Play className="w-4 h-4" />Try AI Intake
            </a>
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
            <span className="hidden sm:flex text-[#a88832] hover:text-[#8a6e28] font-semibold text-sm items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </span>
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            {/* Featured article */}
            <div className="lg:col-span-2 group relative overflow-hidden rounded-2xl bg-[#f7f8fa] border border-slate-200 hover:border-[#c9a84c]/30 transition-all duration-300 hover:shadow-xl hover:shadow-slate-100/50">
              <div className="relative h-56 overflow-hidden">
                <Image
                  src="/images/official/creative-ai-pocket.png"
                  alt="Infinity Legal SA — Legal in Your Pocket. AI-powered intake for South Africans."
                  fill
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#f7f8fa] via-[#f7f8fa]/30 to-transparent" />
              </div>
              <div className="p-8 sm:p-10 pt-4">
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
                <a href="#ask-ai" className="mt-6 inline-flex items-center gap-1 text-[#a88832] hover:text-[#8a6e28] font-semibold text-sm group/link">
                  Try It Now <ArrowUpRight className="w-3.5 h-3.5 ml-1 group-hover/link:translate-x-0.5 transition-transform" />
                </a>
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

      {/* ===== LEGAL ARTICLES ===== */}
      <section id="articles" aria-labelledby="articles-heading" className="py-20 sm:py-28 bg-white">
        <Suspense fallback={<LegalArticlesSkeleton />}>
          <LegalArticlesSection />
        </Suspense>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" aria-labelledby="pricing-heading" className="py-20 sm:py-28 bg-[#f7f8fa]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-[#c9a84c] text-[11px] font-semibold uppercase tracking-[0.15em]">Pricing</span>
            <h2 id="pricing-heading" className="text-3xl sm:text-4xl font-bold text-[#0c1e3c] tracking-tight mt-3">
              Simple, transparent pricing.
            </h2>
            <p className="mt-4 text-slate-500 text-base">All plans include POPIA compliance and AI-powered case analysis.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 max-w-4xl mx-auto">
            {[
              {
                name: 'Civil Legal Plan',
                price: 'R99',
                period: '/month',
                popular: false,
                description: 'For civil disputes and general legal matters.',
                features: ['Unlimited civil consultations', 'Document review & drafting', 'Court representation', 'AI case analysis', 'Email support'],
              },
              {
                name: 'Labour Legal Plan',
                price: 'R99',
                period: '/month',
                popular: false,
                description: 'For workplace and employment matters.',
                features: ['Unlimited labour consultations', 'CCMA representation', 'Employment contract review', 'Dismissal advice', 'Priority support'],
              },
              {
                name: 'Extensive Plan',
                price: 'R139',
                period: '/month',
                popular: true,
                description: 'Complete legal coverage across all practice areas.',
                features: ['All Civil & Labour features', 'Family law consultations', 'Criminal defence advice', 'Estate planning', '24/7 priority support', 'Dedicated attorney'],
              },
            ].map((plan) => (
              <div key={plan.name} className={`relative flex flex-col rounded-2xl transition-all duration-300 ${plan.popular ? 'bg-[#0c1e3c] text-white shadow-2xl shadow-[#0c1e3c]/20 scale-[1.03] ring-1 ring-[#c9a84c]/30' : 'bg-white border border-slate-200 hover:shadow-lg hover:shadow-slate-100/50'}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 px-4 py-1 bg-[#c9a84c] text-[#0c1e3c] text-[10px] font-bold uppercase tracking-wider rounded-full shadow-md">
                      <Star className="w-3 h-3" />Most Popular
                    </span>
                  </div>
                )}
                <div className="p-6 lg:p-8">
                  <div className="mb-6">
                    <h3 className={`text-base font-semibold ${plan.popular ? 'text-[#c9a84c]' : 'text-[#0c1e3c]'}`}>{plan.name}</h3>
                    <p className={`text-[12px] mt-1 ${plan.popular ? 'text-[#8fa4c4]' : 'text-slate-500'}`}>{plan.description}</p>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className={`text-4xl font-bold tracking-tight ${plan.popular ? 'text-white' : 'text-[#0c1e3c]'}`}>{plan.price}</span>
                      <span className={`text-sm ${plan.popular ? 'text-[#5a7199]' : 'text-slate-400'}`}>{plan.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#c9a84c]" />
                        <span className={`text-[13px] ${plan.popular ? 'text-[#c4d3e8]' : 'text-slate-600'}`}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    data-action="sign-up"
                    className={`w-full rounded-xl py-4 text-sm font-semibold transition-all ${plan.popular ? 'bg-[#c9a84c] text-[#0c1e3c] hover:bg-[#d4b85c] shadow-lg shadow-[#c9a84c]/20' : 'bg-[#0c1e3c] text-white hover:bg-[#1a3358]'}`}
                  >
                    Choose Plan
                  </button>
                </div>
              </div>
            ))}
          </div>
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
              <Image src="/logo_legal.png" alt="Infinity Legal SA" width={80} height={45} className="object-contain" />
              <p className="text-[#3a506f] text-[11px]">&copy; {currentYear} Infinity Legal (Pty) Ltd. All rights reserved.</p>
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
