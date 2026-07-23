'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FolderKanban, FileText, BookOpen, CheckCircle2, Shield,
  Lock, KeyRound, ArrowRight, Menu, X, Send, Bot, Sparkles,
  Scale, MessageSquare, Zap, Globe, Smartphone,
  AlertTriangle, RefreshCw, LayoutDashboard, Phone, Mail, MapPin,
  TrendingUp, Landmark, Gavel, Users, Bell, Database,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useScrollReveal } from '@/lib/gsap';

// ============================================
// TYPES
// ============================================
interface LandingPageProps {
  onSignIn?: () => void;
  onSignUp?: (prefillEmail?: string, prefilledName?: string) => void;
  onLoginClick?: () => void;
  isAuthenticated?: boolean;
  onBackToDashboard?: () => void;
  userName?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface PricingPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_monthly: number;
  price_annual: number;
  currency: string;
  features: string[];
  max_cases: number;
  max_documents: number;
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
}

interface Article {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  excerpt?: string;
  category?: string;
  published_at?: string;
  reading_time?: number;
}

// ============================================
// CONFIG (UI structure, NOT mock data)
// ============================================
const caseTypes = [
  'Family Law', 'Criminal Defence', 'Civil Litigation', 'Conveyancing',
  'Estate Planning', 'Corporate Commercial', 'Labour Law', 'Debt Collection',
  'Immigration', 'Personal Injury', 'Other',
];

// Real product features (descriptions of actual capabilities, not simulated data)
const trustIndicators = [
  { icon: Shield, label: 'POPIA Compliant' },
  { icon: Lock, label: '256-bit Encryption' },
  { icon: KeyRound, label: '90-Day Password Policy' },
];

const navLinks = [
  { label: 'Free AI Intake', href: '#intake' },
  { label: 'Ask AI', href: '#ask-ai' },
  { label: 'Platform', href: '#platform' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Articles', href: '#articles' },
];

// ============================================
// SPATIAL INTERACTION HOOKS
// ============================================

/** Tracks mouse position for spatial dynamic lighting effect */
function useSpatialLight<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handle = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty('--mx', `${x}%`);
      el.style.setProperty('--my', `${y}%`);
    };
    el.addEventListener('mousemove', handle);
    return () => el.removeEventListener('mousemove', handle);
  }, []);
  return ref;
}

/** Subtle parallax on scroll for spatial depth */
function useParallax<T extends HTMLElement>(depth: number = 0.15) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const offset = rect.top + rect.height / 2 - window.innerHeight / 2;
      el.style.transform = `translateY(${-offset * depth}px)`;
      raf = 0;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [depth]);
  return ref;
}

// ============================================
// MAIN LANDING PAGE
// ============================================
export function LandingPage({ onLoginClick, onSignUp, isAuthenticated, onBackToDashboard, userName }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const revealRef = useScrollReveal();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f6fa] text-[#0c1e3c] overflow-x-hidden">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg">Skip to main content</a>

      {/* ===== SPATIAL NAV (floating glass pill) ===== */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? 'py-2.5' : 'py-4'}`}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className={`spatial-nav rounded-2xl px-4 sm:px-6 py-3 flex items-center justify-between transition-all duration-500 ${scrolled ? 'spatial-depth-2' : 'spatial-depth-1'}`}>
            {/* Brand */}
            <a href="#" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0c1e3c] to-[#1a3358] flex items-center justify-center spatial-depth-1 group-hover:scale-105 transition-transform">
                <Scale className="w-4.5 h-4.5 text-[#c9a84c]" />
              </div>
              <div className="hidden sm:block">
                <span className="text-[15px] font-bold tracking-tight text-[#0c1e3c]">Infinity Legal</span>
                <span className="block text-[9px] tracking-[0.2em] text-[#c9a84c] font-semibold -mt-0.5">SOUTH AFRICA</span>
              </div>
            </a>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map(link => (
                <a key={link.href} href={link.href} className="px-3.5 py-2 rounded-lg text-[13px] font-medium text-[#3a4a66] hover:text-[#0c1e3c] hover:bg-white/60 transition-all">
                  {link.label}
                </a>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <Button onClick={onBackToDashboard} className="bg-[#0c1e3c] hover:bg-[#1a3358] text-white rounded-xl h-9 px-4 text-[13px] font-semibold spatial-depth-1">
                  <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />
                  Dashboard{userName ? `, ${userName}` : ''}
                </Button>
              ) : (
                <>
                  <Button onClick={onLoginClick} variant="ghost" className="hidden sm:inline-flex text-[#0c1e3c] hover:bg-white/60 rounded-xl h-9 px-4 text-[13px] font-semibold">
                    Sign In
                  </Button>
                  <Button onClick={() => onSignUp?.()} className="bg-gradient-to-br from-[#c9a84c] to-[#a88832] text-[#0c1e3c] hover:from-[#dfc475] hover:to-[#c9a84c] rounded-xl h-9 px-4 text-[13px] font-bold spatial-depth-1">
                    Get Started
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </>
              )}
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 rounded-lg hover:bg-white/60" aria-label="Menu">
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-2 spatial-nav rounded-2xl p-3 spatial-depth-2">
              {navLinks.map(link => (
                <a key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 rounded-lg text-[14px] font-medium text-[#3a4a66] hover:bg-white/60">
                  {link.label}
                </a>
              ))}
              {!isAuthenticated && (
                <button onClick={() => { onLoginClick?.(); setMobileMenuOpen(false); }} className="block w-full text-left px-4 py-2.5 rounded-lg text-[14px] font-medium text-[#0c1e3c] hover:bg-white/60">
                  Sign In
                </button>
              )}
            </div>
          )}
        </nav>
      </header>

      <main id="main" ref={revealRef}>
        {/* ===== HERO (spatial scene with parallax + floating glass) ===== */}
        <HeroSection />

        {/* ===== PLATFORM BENTO (spatial bento grid, no mock data) ===== */}
        <PlatformBentoSection />

        {/* ===== AI INTAKE (spatial glass form, live API) ===== */}
        <section id="intake" className="relative py-24 sm:py-32 px-4 sm:px-6 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="spatial-orb spatial-orb-gold spatial-float-slow" style={{ width: 400, height: 400, top: '10%', right: '-5%' }} />
          </div>
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Copy + process steps */}
              <div className="spatial-rise">
                <div className="inline-flex items-center gap-2 spatial-glass px-3 py-1.5 rounded-full mb-5 spatial-depth-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#c9a84c]" />
                  <span className="text-[11px] font-semibold tracking-wide text-[#0c1e3c]">FREE AI INTAKE</span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0c1e3c] leading-[1.1]">
                  Describe your matter.<br />
                  <span className="text-[#a88832]">Get instant AI analysis.</span>
                </h2>
                <p className="mt-5 text-[15px] text-[#3a4a66] leading-relaxed max-w-lg">
                  Our AI legal assistant reviews your situation and provides an initial assessment within seconds. No obligation, no cost. POPIA-compliant and confidential.
                </p>

                {/* Process steps (structural UI, not mock data) */}
                <div className="mt-8 grid grid-cols-2 gap-4">
                  {[
                    { step: '01', title: 'Describe Your Matter', icon: FileText },
                    { step: '02', title: 'AI Analyses Your Case', icon: Bot },
                    { step: '03', title: 'Legal Team Gets Context', icon: Users },
                    { step: '04', title: 'Matched to a Plan', icon: CheckCircle2 },
                  ].map((s, i) => (
                    <div key={s.step} className="spatial-bento spatial-light p-4 spatial-rise" style={{ animationDelay: `${i * 0.1}s` }}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#0c1e3c] flex items-center justify-center spatial-depth-1">
                          <s.icon className="w-4 h-4 text-[#c9a84c]" />
                        </div>
                        <span className="text-[10px] font-bold text-[#c9a84c] tracking-wider">{s.step}</span>
                      </div>
                      <p className="mt-2.5 text-[12px] font-semibold text-[#0c1e3c] leading-snug">{s.title}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Intake form (spatial glass) */}
              <div className="spatial-rise" style={{ animationDelay: '0.2s' }}>
                <div className="spatial-glass spatial-depth-3 p-6 sm:p-8">
                  <IntakeForm onSignUp={onSignUp} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== ASK AI (spatial glass chat, live API) ===== */}
        <section id="ask-ai" className="relative py-24 sm:py-32 px-4 sm:px-6 bg-gradient-to-b from-[#0c1e3c] to-[#081428] overflow-hidden">
          <div className="absolute inset-0 -z-0">
            <div className="spatial-orb spatial-orb-gold spatial-float" style={{ width: 500, height: 500, top: '5%', left: '-10%' }} />
            <div className="spatial-orb spatial-orb-teal spatial-float-delayed" style={{ width: 400, height: 400, bottom: '5%', right: '-5%' }} />
          </div>
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 spatial-glass-dark px-3 py-1.5 rounded-full mb-5">
                <Bot className="w-3.5 h-3.5 text-[#c9a84c]" />
                <span className="text-[11px] font-semibold tracking-wide text-white">ASK INFINITY AI</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.1]">
                Ask about any legal matter.
              </h2>
              <p className="mt-4 text-[15px] text-[#8fa4c4] max-w-xl mx-auto">
                Get instant answers to your legal questions. Free, confidential, and available 24/7.
              </p>
            </div>
            <AIChatWidget />
          </div>
        </section>

        {/* ===== PRICING (bento grid, live API only) ===== */}
        <PricingSection onSignUp={onSignUp} />

        {/* ===== LEGAL ARTICLES (bento grid, live API only) ===== */}
        <ArticlesSection />

        {/* ===== SECURITY (spatial bento, real features) ===== */}
        <SecuritySection />
      </main>

      {/* ===== FOOTER ===== */}
      <FooterSection />
    </div>
  );
}

// ============================================
// HERO SECTION (spatial scene)
// ============================================
function HeroSection() {
  const orbRef1 = useParallax(0.08);
  const orbRef2 = useParallax(0.12);
  const panelRef = useParallax(0.05);

  return (
    <section className="relative pt-32 sm:pt-40 pb-20 sm:pb-28 px-4 sm:px-6 overflow-hidden spatial-scene">
      {/* Ambient spatial orbs (parallax depth layers) */}
      <div ref={orbRef1} className="spatial-parallax absolute -z-10" style={{ top: '15%', left: '-8%' }}>
        <div className="spatial-orb spatial-orb-gold" style={{ width: 520, height: 520 }} />
      </div>
      <div ref={orbRef2} className="spatial-parallax absolute -z-10" style={{ top: '40%', right: '-10%' }}>
        <div className="spatial-orb spatial-orb-navy" style={{ width: 600, height: 600 }} />
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Copy */}
          <div className="spatial-rise">
            <div className="inline-flex items-center gap-2 spatial-glass px-3.5 py-1.5 rounded-full mb-6 spatial-depth-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-semibold tracking-wide text-[#0c1e3c]">SOUTH AFRICA&apos;S PREMIER LEGAL PLATFORM</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-[#0c1e3c] leading-[1.05]">
              Your Rights,<br />
              <span className="bg-gradient-to-r from-[#c9a84c] via-[#dfc475] to-[#a88832] bg-clip-text text-transparent">Reinforced.</span>
            </h1>
            <p className="mt-6 text-[16px] sm:text-[17px] text-[#3a4a66] leading-relaxed max-w-lg">
              AI-powered legal practice management built for South African law firms. POPIA-compliant case management, conveyancing, labour law, CCMA representation, and civil litigation — all in one platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#intake" className="inline-flex items-center bg-gradient-to-br from-[#c9a84c] to-[#a88832] text-[#0c1e3c] hover:from-[#dfc475] hover:to-[#c9a84c] rounded-xl h-12 px-6 text-[14px] font-bold spatial-depth-2 transition-all hover:scale-[1.02]">
                <Sparkles className="w-4 h-4 mr-2" />
                Free AI Intake
              </a>
              <a href="#ask-ai" className="inline-flex items-center spatial-glass text-[#0c1e3c] hover:bg-white rounded-xl h-12 px-6 text-[14px] font-bold spatial-depth-1 transition-all">
                <Bot className="w-4 h-4 mr-2 text-[#c9a84c]" />
                Ask AI
              </a>
            </div>

            {/* Trust indicators (real features) */}
            <div className="mt-10 flex flex-wrap gap-3">
              {trustIndicators.map(t => (
                <div key={t.label} className="inline-flex items-center gap-2 spatial-glass px-3 py-1.5 rounded-full spatial-depth-1">
                  <t.icon className="w-3.5 h-3.5 text-[#c9a84c]" />
                  <span className="text-[11px] font-semibold text-[#0c1e3c]">{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Spatial floating glass panel */}
          <div ref={panelRef} className="spatial-parallax relative spatial-rise" style={{ animationDelay: '0.15s' }}>
            <div className="spatial-glass spatial-depth-4 p-6 sm:p-8 spatial-float">
              {/* Floating mini dashboard preview (structural UI, no fake data) */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#0c1e3c] flex items-center justify-center">
                    <LayoutDashboard className="w-4.5 h-4.5 text-[#c9a84c]" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-[#0c1e3c]">Practice Dashboard</p>
                    <p className="text-[10px] text-[#7a8fb0]">Live overview</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-400/60" />
                  <div className="w-2 h-2 rounded-full bg-amber-400/60" />
                  <div className="w-2 h-2 rounded-full bg-emerald-400/60" />
                </div>
              </div>

              {/* Live status grid (structural, no mock metrics) */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: FolderKanban, label: 'Active Matters', color: 'text-[#0c1e3c]' },
                  { icon: FileText, label: 'Documents', color: 'text-[#a88832]' },
                  { icon: Bell, label: 'Notifications', color: 'text-[#2da89b]' },
                  { icon: TrendingUp, label: 'Analytics', color: 'text-[#0c1e3c]' },
                ].map(item => (
                  <div key={item.label} className="bg-white/50 rounded-xl p-3.5 border border-white/60 spatial-depth-1">
                    <item.icon className={`w-4 h-4 mb-2 ${item.color}`} />
                    <p className="text-[11px] font-semibold text-[#3a4a66]">{item.label}</p>
                  </div>
                ))}
              </div>

              {/* AI assistant pill */}
              <div className="mt-4 flex items-center gap-3 bg-gradient-to-r from-[#0c1e3c] to-[#1a3358] rounded-xl p-3.5 spatial-depth-2">
                <div className="w-8 h-8 rounded-lg bg-[#c9a84c]/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-[#c9a84c]" />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-semibold text-white">Infinity AI Assistant</p>
                  <p className="text-[9px] text-[#8fa4c4]">Ready to analyse your matters</p>
                </div>
                <Sparkles className="w-3.5 h-3.5 text-[#c9a84c]" />
              </div>
            </div>

            {/* Floating accent badge */}
            <div className="absolute -top-4 -right-4 spatial-glass-dark px-3 py-2 rounded-xl spatial-depth-3 spatial-float-delayed">
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-[#c9a84c]" />
                <span className="text-[10px] font-bold text-white tracking-wide">POPIA SECURE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// PLATFORM BENTO SECTION (spatial bento grid, no mock data)
// ============================================
function PlatformBentoSection() {
  return (
    <section id="platform" className="relative py-24 sm:py-32 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 spatial-glass px-3 py-1.5 rounded-full mb-5 spatial-depth-1">
            <LayoutDashboard className="w-3.5 h-3.5 text-[#c9a84c]" />
            <span className="text-[11px] font-semibold tracking-wide text-[#0c1e3c]">PLATFORM</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0c1e3c] leading-[1.1]">
            Everything your firm needs.<br />
            <span className="text-[#a88832]">Nothing it doesn&apos;t.</span>
          </h2>
          <p className="mt-5 text-[15px] text-[#3a4a66] max-w-2xl mx-auto">
            A unified legal practice platform combining AI assistance, case management, secure communications, and document vault — built specifically for South African legal practice.
          </p>
        </div>

        {/* Bento grid (6 columns responsive, varied cell sizes) */}
        <div className="bento-grid">
          {/* Large feature: AI Legal Assistant */}
          <div className="bento-cell bento-lg bento-tall spatial-bento spatial-light spatial-sheen p-7">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0c1e3c] to-[#1a3358] flex items-center justify-center spatial-depth-2">
                <Bot className="w-5 h-5 text-[#c9a84c]" />
              </div>
              <div>
                <span className="bento-chip-gold">AI-POWERED</span>
                <h3 className="text-xl font-bold text-[#0c1e3c] mt-1">AI Legal Assistant</h3>
              </div>
            </div>
            <p className="text-[13px] text-[#3a4a66] leading-relaxed">
              Generate legal memos, summarise documents, analyse case facts, and get instant legal guidance. Powered by our secure AI infrastructure tuned for South African law.
            </p>
            <div className="mt-5 space-y-2">
              {['Memo generation', 'Document summarisation', 'Case analysis', 'Legal research'].map(feature => (
                <div key={feature} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#c9a84c] flex-shrink-0" />
                  <span className="text-[12px] text-[#3a4a66]">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Medium: Case Management */}
          <div className="bento-cell bento-md bento-tall spatial-bento spatial-light p-6">
            <div className="w-10 h-10 rounded-xl bg-[#0c1e3c]/5 flex items-center justify-center mb-4">
              <FolderKanban className="w-5 h-5 text-[#0c1e3c]" />
            </div>
            <h3 className="text-base font-bold text-[#0c1e3c] mb-2">Case Management</h3>
            <p className="text-[12px] text-[#3a4a66] leading-relaxed">
              Track matters from intake to resolution. Full timeline, document links, and team collaboration.
            </p>
          </div>

          {/* Medium: Communications */}
          <div className="bento-cell bento-md spatial-bento spatial-light p-6">
            <div className="w-10 h-10 rounded-xl bg-[#c9a84c]/10 flex items-center justify-center mb-4">
              <MessageSquare className="w-5 h-5 text-[#a88832]" />
            </div>
            <h3 className="text-base font-bold text-[#0c1e3c] mb-2">Communications</h3>
            <p className="text-[12px] text-[#3a4a66] leading-relaxed">
              Secure client messaging, SMS, and email — all logged and POPIA-compliant.
            </p>
          </div>

          {/* Medium: Document Vault */}
          <div className="bento-cell bento-md spatial-bento spatial-light p-6">
            <div className="w-10 h-10 rounded-xl bg-[#2da89b]/10 flex items-center justify-center mb-4">
              <Database className="w-5 h-5 text-[#2da89b]" />
            </div>
            <h3 className="text-base font-bold text-[#0c1e3c] mb-2">Document Vault</h3>
            <p className="text-[12px] text-[#3a4a66] leading-relaxed">
              Encrypted storage with version control, e-signatures, and audit trails.
            </p>
          </div>

          {/* Medium: Analytics */}
          <div className="bento-cell bento-md spatial-bento spatial-light p-6">
            <div className="w-10 h-10 rounded-xl bg-[#0c1e3c]/5 flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5 text-[#0c1e3c]" />
            </div>
            <h3 className="text-base font-bold text-[#0c1e3c] mb-2">Analytics &amp; Insights</h3>
            <p className="text-[12px] text-[#3a4a66] leading-relaxed">
              Real-time dashboards on caseload, revenue, team performance, and outcomes.
            </p>
          </div>

          {/* Full: Built for SA */}
          <div className="bento-cell bento-full spatial-bento spatial-light p-7">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#c9a84c] to-[#a88832] flex items-center justify-center spatial-depth-2 flex-shrink-0">
                <Landmark className="w-6 h-6 text-[#0c1e3c]" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-[#0c1e3c]">Built for South Africa</h3>
                <p className="text-[13px] text-[#3a4a66] mt-1">
                  Designed around SA legal practice — POPIA compliance, CCMA workflows, conveyancing transfers, and ZAR pricing.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {['POPIA', 'CCMA', 'Conveyancing', 'ZAR'].map(badge => (
                  <span key={badge} className="px-2.5 py-1 rounded-md bg-[#0c1e3c]/5 text-[10px] font-bold text-[#0c1e3c] tracking-wide">{badge}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// PRICING SECTION (bento grid, LIVE API only — no fallback mock)
// ============================================
function PricingSection({ onSignUp }: { onSignUp?: (email?: string, name?: string) => void }) {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/pricing');
        const data = await res.json();
        if (cancelled) return;
        if (data.success && Array.isArray(data.data)) {
          setPlans(data.data.filter((p: PricingPlan) => p.is_active).sort((a: PricingPlan, b: PricingPlan) => a.sort_order - b.sort_order));
        } else {
          setError('Unable to load pricing plans.');
        }
      } catch {
        if (!cancelled) setError('Network error. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <section id="pricing" className="relative py-24 sm:py-32 px-4 sm:px-6 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="spatial-orb spatial-orb-gold spatial-float-slow" style={{ width: 450, height: 450, top: '20%', left: '-5%' }} />
      </div>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 spatial-glass px-3 py-1.5 rounded-full mb-5 spatial-depth-1">
            <Zap className="w-3.5 h-3.5 text-[#c9a84c]" />
            <span className="text-[11px] font-semibold tracking-wide text-[#0c1e3c]">PRICING</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0c1e3c] leading-[1.1]">
            Simple, transparent pricing.
          </h2>
          <p className="mt-5 text-[15px] text-[#3a4a66] max-w-xl mx-auto">
            Choose a plan that fits your practice. All prices in ZAR. Cancel anytime.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-1 spatial-glass p-1 rounded-xl mt-7 spatial-depth-1">
            <button onClick={() => setBilling('monthly')} className={`px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${billing === 'monthly' ? 'bg-[#0c1e3c] text-white spatial-depth-1' : 'text-[#3a4a66]'}`}>
              Monthly
            </button>
            <button onClick={() => setBilling('annual')} className={`px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${billing === 'annual' ? 'bg-[#0c1e3c] text-white spatial-depth-1' : 'text-[#3a4a66]'}`}>
              Annual <span className="text-[#c9a84c]">-15%</span>
            </button>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="spatial-glass p-7 spatial-depth-2 animate-pulse">
                <div className="h-5 w-24 bg-slate-200 rounded mb-4" />
                <div className="h-8 w-20 bg-slate-200 rounded mb-5" />
                <div className="space-y-2.5">
                  {[1, 2, 3, 4].map(j => <div key={j} className="h-3 bg-slate-200 rounded" style={{ width: `${80 - j * 8}%` }} />)}
                </div>
                <div className="h-10 bg-slate-200 rounded-xl mt-6" />
              </div>
            ))}
          </div>
        )}

        {/* Error / empty state */}
        {error && !loading && (
          <div className="spatial-glass p-8 rounded-2xl text-center max-w-md mx-auto spatial-depth-2">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
            <p className="text-[14px] text-[#3a4a66]">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline" className="mt-4 rounded-xl h-10">Retry</Button>
          </div>
        )}

        {/* Plans bento grid (live data) */}
        {!loading && !error && plans.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <div key={plan.id} className={`spatial-bento spatial-light p-7 spatial-rise ${plan.is_popular ? 'spatial-depth-glow ring-2 ring-[#c9a84c]/30' : 'spatial-depth-2'}`} style={{ animationDelay: `${i * 0.1}s` }}>
                {plan.is_popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#c9a84c] to-[#a88832] text-[#0c1e3c] text-[10px] font-bold px-3 py-1 rounded-full tracking-wide spatial-depth-1">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-lg font-bold text-[#0c1e3c]">{plan.name}</h3>
                <p className="text-[12px] text-[#3a4a66] mt-1 min-h-[36px]">{plan.description}</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-[11px] font-semibold text-[#7a8fb0]">{plan.currency}</span>
                  <span className="text-4xl font-bold text-[#0c1e3c]">
                    {billing === 'monthly' ? plan.price_monthly : Math.round(plan.price_annual / 12)}
                  </span>
                  <span className="text-[12px] text-[#7a8fb0]">/mo</span>
                </div>
                {billing === 'annual' && (
                  <p className="text-[10px] text-[#c9a84c] font-semibold mt-1">Billed {plan.currency} {plan.price_annual}/year</p>
                )}
                <div className="my-5 spatial-divider" />
                <ul className="space-y-2.5">
                  {plan.features.map((f, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#c9a84c] flex-shrink-0 mt-0.5" />
                      <span className="text-[12px] text-[#3a4a66]">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => onSignUp?.()}
                  className={`w-full mt-6 rounded-xl h-11 text-[13px] font-bold ${plan.is_popular ? 'bg-gradient-to-br from-[#c9a84c] to-[#a88832] text-[#0c1e3c] hover:from-[#dfc475] hover:to-[#c9a84c] spatial-depth-1' : 'bg-[#0c1e3c] text-white hover:bg-[#1a3358]'}`}
                >
                  Get Started
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================
// ARTICLES SECTION (bento grid, LIVE API only — no fallback mock)
// ============================================
function ArticlesSection() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/articles?limit=6');
        const data = await res.json();
        if (cancelled) return;
        if (data.success && data.data?.articles) {
          setArticles(data.data.articles);
        } else if (data.success && Array.isArray(data.data)) {
          setArticles(data.data);
        } else {
          setError('Unable to load articles.');
        }
      } catch {
        if (!cancelled) setError('Network error. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <section id="articles" className="relative py-24 sm:py-32 px-4 sm:px-6 bg-gradient-to-b from-[#f4f6fa] to-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 spatial-glass px-3 py-1.5 rounded-full mb-5 spatial-depth-1">
            <BookOpen className="w-3.5 h-3.5 text-[#c9a84c]" />
            <span className="text-[11px] font-semibold tracking-wide text-[#0c1e3c]">LEGAL ARTICLES</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0c1e3c] leading-[1.1]">
            Know your rights.
          </h2>
          <p className="mt-5 text-[15px] text-[#3a4a66] max-w-xl mx-auto">
            Plain-language guides to South African law, written by our legal team.
          </p>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="spatial-glass p-6 spatial-depth-2 animate-pulse">
                <div className="h-3 w-20 bg-slate-200 rounded mb-4" />
                <div className="h-5 w-full bg-slate-200 rounded mb-2" />
                <div className="h-3 w-full bg-slate-200 rounded mb-1" />
                <div className="h-3 w-3/4 bg-slate-200 rounded mb-5" />
                <div className="h-8 w-28 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Error / empty state */}
        {error && !loading && (
          <div className="spatial-glass p-8 rounded-2xl text-center max-w-md mx-auto spatial-depth-2">
            <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <p className="text-[14px] text-[#3a4a66]">{error}</p>
          </div>
        )}

        {/* Empty state (no articles in DB) */}
        {!loading && !error && articles.length === 0 && (
          <div className="spatial-glass p-10 rounded-2xl text-center max-w-md mx-auto spatial-depth-2">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-4" />
            <p className="text-[15px] font-semibold text-[#0c1e3c]">Articles coming soon</p>
            <p className="text-[13px] text-[#3a4a66] mt-1">Our legal team is preparing guides. Check back shortly.</p>
          </div>
        )}

        {/* Articles bento grid (live data) */}
        {!loading && !error && articles.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article, i) => (
              <a key={article.id} href="#" className="spatial-bento spatial-light p-6 spatial-rise group block" style={{ animationDelay: `${i * 0.08}s` }}>
                {article.category && (
                  <span className="inline-block px-2.5 py-1 rounded-md bg-[#c9a84c]/10 text-[10px] font-bold text-[#a88832] tracking-wide mb-3">
                    {article.category}
                  </span>
                )}
                <h3 className="text-[16px] font-bold text-[#0c1e3c] leading-snug group-hover:text-[#a88832] transition-colors">
                  {article.title}
                </h3>
                {article.subtitle && (
                  <p className="text-[12px] text-[#3a4a66] mt-2 leading-relaxed line-clamp-2">{article.subtitle}</p>
                )}
                <div className="mt-4 flex items-center gap-2 text-[11px] text-[#7a8fb0]">
                  {article.reading_time && <span>{article.reading_time} min read</span>}
                  {article.reading_time && article.published_at && <span>·</span>}
                  {article.published_at && <span>{new Date(article.published_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}</span>}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================
// SECURITY SECTION (spatial bento, real features)
// ============================================
function SecuritySection() {
  return (
    <section className="relative py-24 sm:py-32 px-4 sm:px-6 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="spatial-orb spatial-orb-navy spatial-float" style={{ width: 500, height: 500, top: '10%', right: '-10%' }} />
      </div>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 spatial-glass px-3 py-1.5 rounded-full mb-5 spatial-depth-1">
            <Shield className="w-3.5 h-3.5 text-[#c9a84c]" />
            <span className="text-[11px] font-semibold tracking-wide text-[#0c1e3c]">SECURITY</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0c1e3c] leading-[1.1]">
            Enterprise-grade security.
          </h2>
          <p className="mt-5 text-[15px] text-[#3a4a66] max-w-xl mx-auto">
            Your data is protected by bank-grade encryption and full POPIA compliance.
          </p>
        </div>

        <div className="bento-grid">
          {trustIndicators.map((t, i) => (
            <div key={t.label} className="bento-cell bento-md spatial-bento spatial-light p-7 spatial-rise" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0c1e3c] to-[#1a3358] flex items-center justify-center spatial-depth-2 mb-4">
                <t.icon className="w-6 h-6 text-[#c9a84c]" />
              </div>
              <h3 className="text-base font-bold text-[#0c1e3c] mb-2">{t.label}</h3>
              <p className="text-[12px] text-[#3a4a66] leading-relaxed">
                {t.label === 'POPIA Compliant' && 'Full compliance with the Protection of Personal Information Act.'}
                {t.label === '256-bit Encryption' && 'Bank-grade AES-256 encryption for all data at rest and in transit.'}
                {t.label === '90-Day Password Policy' && 'Mandatory password rotation and multi-factor authentication support.'}
              </p>
            </div>
          ))}

          {/* Full: audit trail */}
          <div className="bento-cell bento-full spatial-glass-dark p-7 spatial-rise" style={{ animationDelay: '0.3s' }}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-[#c9a84c]/20 flex items-center justify-center spatial-depth-2 flex-shrink-0">
                <Gavel className="w-6 h-6 text-[#c9a84c]" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">Full Audit Trail</h3>
                <p className="text-[13px] text-[#8fa4c4] mt-1">
                  Every action is logged — who accessed what, when, and from where. Complete chain of custody for all matters and documents.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Access logs', 'Document history', 'User activity', 'Compliance reports'].map(badge => (
                  <span key={badge} className="px-2.5 py-1 rounded-md bg-white/10 text-[10px] font-bold text-white tracking-wide">{badge}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// FOOTER
// ============================================
function FooterSection() {
  return (
    <footer className="relative bg-gradient-to-b from-[#0c1e3c] to-[#081428] text-white pt-16 pb-8 px-4 sm:px-6 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#c9a84c]/20 flex items-center justify-center">
                <Scale className="w-4.5 h-4.5 text-[#c9a84c]" />
              </div>
              <div>
                <span className="text-[15px] font-bold tracking-tight">Infinity Legal</span>
                <span className="block text-[9px] tracking-[0.2em] text-[#c9a84c] font-semibold -mt-0.5">SOUTH AFRICA</span>
              </div>
            </div>
            <p className="text-[12px] text-[#8fa4c4] leading-relaxed">
              South Africa&apos;s premier AI-powered legal practice platform. POPIA-compliant, secure, and built for local legal practice.
            </p>
          </div>

          {/* Platform links */}
          <div>
            <h4 className="text-[11px] font-bold tracking-wider text-[#c9a84c] mb-4">PLATFORM</h4>
            <ul className="space-y-2.5">
              {navLinks.map(link => (
                <li key={link.href}><a href={link.href} className="text-[12px] text-[#8fa4c4] hover:text-white transition-colors">{link.label}</a></li>
              ))}
            </ul>
          </div>

          {/* Practice areas */}
          <div>
            <h4 className="text-[11px] font-bold tracking-wider text-[#c9a84c] mb-4">PRACTICE AREAS</h4>
            <ul className="space-y-2.5">
              {caseTypes.slice(0, 6).map(t => (
                <li key={t}><span className="text-[12px] text-[#8fa4c4]">{t}</span></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[11px] font-bold tracking-wider text-[#c9a84c] mb-4">CONTACT</h4>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2 text-[12px] text-[#8fa4c4]"><Phone className="w-3.5 h-3.5 text-[#c9a84c]" /> 068 127 6038</li>
              <li className="flex items-center gap-2 text-[12px] text-[#8fa4c4]"><Mail className="w-3.5 h-3.5 text-[#c9a84c]" /> hello@infinitylegal.org</li>
              <li className="flex items-center gap-2 text-[12px] text-[#8fa4c4]"><MapPin className="w-3.5 h-3.5 text-[#c9a84c]" /> Johannesburg, South Africa</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-[#7a8fb0]">© {new Date().getFullYear()} Infinity Legal SA. All rights reserved.</p>
          <div className="flex gap-5">
            <a href="#" className="text-[11px] text-[#7a8fb0] hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="text-[11px] text-[#7a8fb0] hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="text-[11px] text-[#7a8fb0] hover:text-white transition-colors">POPIA Notice</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ============================================
// INTAKE FORM (live /api/ai/intake — preserved API logic)
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
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-[#0c1e3c] text-[15px]">AI Analysis Complete</h3>
            <p className="text-[11px] text-slate-500">Reference: {result.id}</p>
          </div>
        </div>
        <div className="text-sm text-slate-700 whitespace-pre-wrap bg-white/50 p-5 rounded-xl border border-white/60 max-h-80 overflow-y-auto leading-relaxed">
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
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="intake-name" className="text-[12px] font-medium text-slate-700">Full Name *</Label>
          <Input id="intake-name" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" className="mt-1.5 h-10 bg-white/70" />
        </div>
        <div>
          <Label htmlFor="intake-email" className="text-[12px] font-medium text-slate-700">Email *</Label>
          <Input id="intake-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" className="mt-1.5 h-10 bg-white/70" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="intake-phone" className="text-[12px] font-medium text-slate-700">Phone (optional)</Label>
          <Input id="intake-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+27 82 000 0000" className="mt-1.5 h-10 bg-white/70" />
        </div>
        <div>
          <Label htmlFor="intake-case-type" className="text-[12px] font-medium text-slate-700">Case Type *</Label>
          <div className="relative mt-1.5">
            <select id="intake-case-type" value={caseType} onChange={e => setCaseType(e.target.value)} className="w-full h-10 rounded-md border border-input bg-white/70 px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring appearance-none">
              <option value="">Select type...</option>
              {caseTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDownPlaceholder />
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
                : 'bg-white/50 border-slate-200 text-slate-500 hover:bg-white'
            }`}>
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label htmlFor="intake-description" className="text-[12px] font-medium text-slate-700">Describe Your Legal Matter *</Label>
        <textarea id="intake-description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell us about your situation. The more detail you provide, the better our AI can assess your matter..." rows={4} className="mt-1.5 w-full rounded-md border border-input bg-white/70 px-3 py-2.5 text-sm shadow-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
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
  );
}

// Small helper to avoid importing ChevronDown (kept inline for minimal diff)
function ChevronDownPlaceholder() {
  return (
    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// ============================================
// AI CHAT WIDGET (live /api/ai/chat — preserved API logic)
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
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, sessionId }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, { id: `ai-${Date.now()}`, role: 'assistant', content: data.data }]);
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
      <div className="spatial-glass-dark spatial-depth-3 overflow-hidden">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/10">
          <div className="w-8 h-8 rounded-full bg-[#c9a84c]/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-[#c9a84c]" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-white">Infinity Legal AI</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-[#8fa4c4]">Online · Confidential</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="h-[400px] overflow-y-auto p-5 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${msg.role === 'user'
                ? 'bg-[#c9a84c] text-[#0c1e3c] rounded-2xl rounded-br-md'
                : 'bg-white/10 text-white rounded-2xl rounded-bl-md border border-white/10'
              } px-4 py-3`}>
                <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/10 border border-white/10 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 px-4 py-3.5 border-t border-white/10">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Ask about your legal matter..."
            className="flex-1 bg-white/10 text-white placeholder:text-[#8fa4c4] rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#c9a84c]/40 border border-white/10"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl bg-[#c9a84c] text-[#0c1e3c] hover:bg-[#dfc475] disabled:opacity-40 flex items-center justify-center transition-all spatial-depth-1"
            aria-label="Send message"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
