'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { CheckCircle2, AlertTriangle, RefreshCw, FileText, Shield, Lock, KeyRound, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginScreen({ onLogin, loading, error, initialSignup, onBackToHome }: { onLogin: (e: string, p: string) => void; loading: boolean; error: string; initialSignup?: boolean; onBackToHome?: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [heroSlide, setHeroSlide] = useState(0);
  const [isSignup, setIsSignup] = useState(() => !!initialSignup);
  const [signupName, setSignupName] = useState(() => {
    if (typeof window === 'undefined') return '';
    const v = sessionStorage.getItem('il_intake_name');
    if (v) { sessionStorage.removeItem('il_intake_name'); return v; }
    return '';
  });
  const [signupEmail, setSignupEmail] = useState(() => {
    if (typeof window === 'undefined') return '';
    const v = sessionStorage.getItem('il_intake_email');
    if (v) { sessionStorage.removeItem('il_intake_email'); return v; }
    return '';
  });
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [popiaConsent, setPopiaConsent] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState('');
  const [signupError, setSignupError] = useState('');

  const heroSlides = [
    { headline: 'Your rights, reinforced.', sub: 'Navigate consumer disputes with unlimited expert consultations and AI-powered oversight.' },
    { headline: 'Legal Plans from R99/month', sub: 'Affordable monthly plans designed for the reality of South Africans.' },
    { headline: 'Your Legacy, Fully Secured', sub: 'Get a plan today and build a protected future.' },
  ];

  useEffect(() => {
    const interval = setInterval(() => setHeroSlide(s => (s + 1) % heroSlides.length), 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSignup = async () => {
    setSignupLoading(true);
    setSignupError('');
    setSignupSuccess('');
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signupEmail,
          password: signupPassword,
          full_name: signupName,
          phone: signupPhone || undefined,
          role: 'client',
          consent_given: popiaConsent,
          popia_consent: popiaConsent,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSignupSuccess('Account created! You can now sign in.');
        setIsSignup(false);
        setEmail(signupEmail);
        setPassword('');
      } else {
        setSignupError(data.error?.message || 'Signup failed');
      }
    } catch {
      setSignupError('Network error');
    }
    setSignupLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-[#c9a84c] focus:text-[#0c1e3c] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold focus:shadow-lg">Skip to main content</a>
      {/* Left side - Hero with cinematic gradient */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-[#0a1628]">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#0c1e3c] to-[#071020]" />
          {/* Geometric lines */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="login-grid" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#c9a84c" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#login-grid)" />
          </svg>
          {/* Atmospheric glow */}
          <div className="absolute top-1/4 right-0 w-96 h-96 bg-[#c9a84c]/[0.04] rounded-full blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#c9a84c]/[0.03] rounded-full blur-[60px]" />
        </div>

        {/* Carousel content */}
        <div role="region" aria-roledescription="carousel" aria-label="Featured highlights">
        {heroSlides.map((slide, i) => (
          <div
            key={i}
            role="group"
            aria-roledescription="slide"
            aria-label={`${slide.headline}`}
            className={`absolute inset-0 transition-all duration-1000 ${heroSlide === i ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            <div className="absolute bottom-20 left-12 right-12">
              <h2 className="text-3xl xl:text-4xl font-bold text-white mb-3 tracking-tight leading-tight" style={{ fontFamily: 'Georgia, serif' }}>{slide.headline}</h2>
              <p className="text-[#7a8fb0] text-base leading-relaxed max-w-sm">{slide.sub}</p>
            </div>
          </div>
        ))}
        </div>

        {/* Slide indicators */}
        <div className="absolute bottom-10 left-12 flex gap-2 z-10" role="tablist" aria-label="Carousel navigation">
          {heroSlides.map((slide, i) => (
            <button
              key={i}
              onClick={() => setHeroSlide(i)}
              aria-label={`${slide.headline}`}
              aria-current={heroSlide === i}
              className={`h-1 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c] ${heroSlide === i ? 'w-8 bg-[#c9a84c]' : 'w-4 bg-white/20 hover:bg-white/40'}`}
            />
          ))}
        </div>

        {/* Branding */}
        <div className="absolute top-10 left-12">
          <Image src="/infinity_logo.png" alt="Infinity Legal SA" width={100} height={28} className="object-contain opacity-80" />
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-8 sm:p-12 bg-white">
        <div className="w-full max-w-[400px]">
          {onBackToHome && (
            <button onClick={onBackToHome} className="flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-[#a88832] mb-8 transition-colors font-medium">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Home
            </button>
          )}

          {/* Logo for mobile */}
          <div className="lg:hidden mb-8">
            <Image src="/infinity_logo.png" alt="Infinity Legal SA" width={120} height={34} className="object-contain" />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#0c1e3c] tracking-tight">
              {isSignup ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-slate-500 mt-1.5 text-[13px]">
              {isSignup ? 'Start your legal journey with Infinity Legal SA' : 'Sign in to your Infinity Legal portal'}
            </p>
          </div>

          {signupSuccess && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[13px] flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              {signupSuccess}
            </div>
          )}

          {!isSignup ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="login-email" className="text-[12px] font-medium text-slate-700">Email</Label>
                <Input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@firm.co.za" className="mt-1.5 h-10" />
              </div>
              <div>
                <Label htmlFor="login-password" className="text-[12px] font-medium text-slate-700">Password</Label>
                <Input id="login-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" className="mt-1.5 h-10" onKeyDown={e => e.key === 'Enter' && onLogin(email, password)} />
              </div>
              {error && <p className="text-[12px] text-red-500 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" />{error}</p>}
              <Button className="w-full bg-[#0c1e3c] hover:bg-[#1a3358] text-white font-semibold h-10 rounded-xl text-sm" onClick={() => onLogin(email, password)} disabled={loading}>
                {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
              <div className="text-center pt-1">
                <button onClick={() => { setIsSignup(true); setSignupError(''); }} className="text-[13px] text-[#a88832] hover:text-[#8a6e28] font-medium">
                  Don&apos;t have an account? <span className="underline underline-offset-2">Sign Up</span>
                </button>
              </div>
              <div className="text-xs text-slate-500 pt-4 mt-4 border-t border-slate-100">
                <a
                  href="/api/report"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#a88832] hover:text-[#8a6e28] font-medium transition-colors text-[12px]"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Download Client Report (PDF)
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="signup-name" className="text-[12px] font-medium text-slate-700">Full Name</Label>
                <Input id="signup-name" value={signupName} onChange={e => setSignupName(e.target.value)} placeholder="John Doe" className="mt-1.5 h-10" />
              </div>
              <div>
                <Label htmlFor="signup-email" className="text-[12px] font-medium text-slate-700">Email</Label>
                <Input id="signup-email" type="email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} placeholder="you@email.com" className="mt-1.5 h-10" />
              </div>
              <div>
                <Label htmlFor="signup-phone" className="text-[12px] font-medium text-slate-700">Phone (optional)</Label>
                <Input id="signup-phone" value={signupPhone} onChange={e => setSignupPhone(e.target.value)} placeholder="+27 82 000 0000" className="mt-1.5 h-10" />
              </div>
              <div>
                <Label htmlFor="signup-password" className="text-[12px] font-medium text-slate-700">Password</Label>
                <Input id="signup-password" type="password" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} placeholder="Min 8 chars, 1 uppercase, 1 number, 1 symbol" className="mt-1.5 h-10" />
              </div>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={popiaConsent}
                  onChange={e => setPopiaConsent(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300"
                />
                <span className="text-[11px] text-slate-600 leading-relaxed">
                  I consent to the processing of my personal information in accordance with the Protection of Personal Information Act (POPIA) and Infinity Legal&apos;s privacy policy.
                </span>
              </label>
              {signupError && <p className="text-[12px] text-red-500 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" />{signupError}</p>}
              <Button className="w-full bg-[#0c1e3c] hover:bg-[#1a3358] text-white font-semibold h-10 rounded-xl text-sm" onClick={handleSignup} disabled={signupLoading || !popiaConsent || !signupName || !signupEmail || !signupPassword}>
                {signupLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                {signupLoading ? 'Creating account...' : 'Create Account'}
              </Button>
              <div className="text-center pt-1">
                <button onClick={() => { setIsSignup(false); setSignupError(''); }} className="text-[13px] text-[#a88832] hover:text-[#8a6e28] font-medium">
                  Already have an account? <span className="underline underline-offset-2">Sign In</span>
                </button>
              </div>
            </div>
          )}

          <div className="mt-10 flex justify-center gap-6 text-[10px] text-slate-400">
            <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> POPIA</span>
            <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> AES-256</span>
            <span className="flex items-center gap-1"><KeyRound className="w-3 h-3" /> 90-Day Expiry</span>
          </div>
        </div>
      </div>
    </div>
  );
}
