'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { CheckCircle2, AlertTriangle, RefreshCw, FileText, Shield, Lock, KeyRound, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => void;
  loading: boolean;
  error: string;
  initialSignup?: boolean;
  onBackToHome?: () => void;
  onSwitchToSignup?: () => void;
  onSwitchToLogin?: () => void;
}

export function LoginScreen({ onLogin, loading, error, initialSignup, onBackToHome, onSwitchToSignup, onSwitchToLogin }: LoginScreenProps) {
  const { signIn, signUp, loading: authLoading } = useAuth();
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
  const [signInLoading, setSignInLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState('');
  const [signupError, setSignupError] = useState('');
  const [loginError, setLoginError] = useState(error);

  const heroSlides = [
    { headline: 'Your rights, reinforced.', sub: 'Navigate consumer disputes with unlimited expert consultations and AI-powered oversight.' },
    { headline: 'Legal Plans from R99/month', sub: 'Affordable monthly plans designed for the reality of South Africans.' },
    { headline: 'Your Legacy, Fully Secured', sub: 'Get a plan today and build a protected future.' },
  ];

  useEffect(() => {
    const interval = setInterval(() => setHeroSlide(s => (s + 1) % heroSlides.length), 5000);
    return () => clearInterval(interval);
  }, []);

  // Sync external error prop
  useEffect(() => {
    setLoginError(error);
  }, [error]);

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setLoginError('Please enter your email and password');
      return;
    }
    setLoginError('');
    setSignInLoading(true);
    const result = await signIn(email, password);
    setSignInLoading(false);
    if (!result.success) {
      setLoginError(result.error || 'Sign in failed. Please check your credentials.');
    }
    // If success, the AuthProvider will update the auth state
    // and HomePageClient will react to it automatically
  };

  const handleSignup = async () => {
    setSignupLoading(true);
    setSignupError('');
    setSignupSuccess('');
    try {
      const result = await signUp({
        email: signupEmail,
        password: signupPassword,
        full_name: signupName,
        phone: signupPhone || undefined,
        popia_consent: popiaConsent,
      });

      if (result.success) {
        // If auto sign-in worked, the AuthProvider will update the auth state
        // and HomePageClient will redirect to the dashboard automatically.
        // Only show the "please sign in" message if auto sign-in didn't work.
        if (!result.error || result.error === 'Account created! Please sign in with your credentials.') {
          setSignupSuccess(result.error || 'Account created! Signing you in...');
          // Auto sign-in is handled by the useAuth hook — no need to switch to login form
          // The auth state change will be picked up by AuthProvider → HomePageClient
        } else {
          setSignupSuccess('Account created! Please sign in with your credentials.');
          setIsSignup(false);
          setEmail(signupEmail);
          setPassword('');
        }
      } else {
        setSignupError(result.error || 'Signup failed');
      }
    } catch {
      setSignupError('Network error. Please try again.');
    }
    setSignupLoading(false);
  };

  const isLoading = signInLoading;

  return (
    <div className="min-h-screen flex">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-[#c9a84c] focus:text-[#0c1e3c] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold focus:shadow-lg">Skip to main content</a>

      {/* Left side - Hero with premium navy gradient */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden gradient-navy">
        <div className="absolute inset-0">
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

        {/* Branding */}
        <div className="absolute top-10 left-12 z-10">
          <Image src="/logo_legal_dark.png" alt="Infinity Legal SA" width={96} height={54} className="object-contain" />
          <p className="text-[10px] text-white/30 mt-1.5 tracking-[0.15em] uppercase" style={{ fontFamily: 'Georgia, serif' }}>Est. 2024 &middot; Sandton, SA</p>
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
            <div className="absolute bottom-24 left-12 right-12">
              <h2 className="text-4xl xl:text-5xl font-bold text-white mb-4 tracking-tight leading-tight" style={{ fontFamily: 'Georgia, serif' }}>{slide.headline}</h2>
              <div className="divider-gold w-16 mb-4" />
              <p className="text-[#7a8fb0] text-base leading-relaxed max-w-sm">{slide.sub}</p>
            </div>
          </div>
        ))}
        </div>

        {/* Slide indicators - thin gold progress bar */}
        <div className="absolute bottom-10 left-12 right-12 z-10" role="tablist" aria-label="Carousel navigation">
          <div className="flex gap-2 items-center">
            {heroSlides.map((slide, i) => (
              <button
                key={i}
                onClick={() => setHeroSlide(i)}
                aria-label={`${slide.headline}`}
                aria-current={heroSlide === i}
                className="h-[2px] rounded-full transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c] flex-1"
                style={{
                  background: heroSlide === i
                    ? 'linear-gradient(90deg, #c9a84c, #dfc475)'
                    : 'rgba(255,255,255,0.12)',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-4 sm:p-8 md:p-12 bg-gradient-to-b from-white to-slate-50/50">
        <div className="w-full max-w-[400px] animate-fade-in-up">
          {onBackToHome && (
            <button onClick={onBackToHome} className="flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-[#a88832] mb-8 transition-all duration-200 font-medium">
              <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
              Back to Home
            </button>
          )}

          {/* Logo for mobile */}
          <div className="lg:hidden mb-8">
            <Image src="/logo_legal.png" alt="Infinity Legal SA" width={104} height={58} className="object-contain rounded-lg" />
          </div>

          <div className="mb-8">
            <div className="border-l-4 border-l-[#c9a84c] pl-4">
              <h1 className="text-2xl font-bold text-[#0c1e3c] tracking-tight">
                {isSignup ? 'Create your account' : 'Welcome back'}
              </h1>
              <p className="text-slate-500 mt-1.5 text-[13px]">
                {isSignup ? 'Start your legal journey with Infinity Legal SA' : 'Sign in to your Infinity Legal portal'}
              </p>
            </div>
          </div>

          {signupSuccess && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[13px] flex items-center gap-2.5 animate-scale-in spatial-depth-1">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              {signupSuccess}
            </div>
          )}

          <div className="relative">
            {/* Sign In Form */}
            <div className={`transition-all duration-300 ${isSignup ? 'opacity-0 absolute inset-0 pointer-events-none translate-y-2' : 'opacity-100 translate-y-0'}`}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="login-email" className="text-[12px] font-medium text-slate-700">Email</Label>
                  <Input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@firm.co.za" className="mt-1.5 h-10 input-premium transition-all duration-200" />
                </div>
                <div>
                  <Label htmlFor="login-password" className="text-[12px] font-medium text-slate-700">Password</Label>
                  <Input id="login-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" className="mt-1.5 h-10 input-premium transition-all duration-200" onKeyDown={e => e.key === 'Enter' && handleSignIn()} />
                </div>
                {loginError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px] flex items-start gap-2.5 animate-scale-in spatial-depth-1">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}
                <Button className="w-full btn-gold h-10 rounded-xl text-sm" onClick={handleSignIn} disabled={isLoading}>
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>

                {/* Divider with "or" */}
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-slate-100" />
                  <span className="flex-shrink mx-3 text-[11px] text-slate-400 uppercase tracking-widest">or</span>
                  <div className="flex-grow border-t border-slate-100" />
                </div>

                <div className="text-center">
                  <button onClick={() => { setIsSignup(true); setSignupError(''); setLoginError(''); onSwitchToSignup?.(); }} className="text-[13px] text-[#a88832] hover:text-[#8a6e28] font-medium transition-all duration-200">
                    Don&apos;t have an account? <span className="underline underline-offset-2">Sign Up</span>
                  </button>
                </div>
                <div className="text-xs text-slate-500 pt-2 mt-2 border-t border-slate-100">
                  <a
                    href="/api/report"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[#a88832] hover:text-[#8a6e28] font-medium transition-all duration-200 text-[12px]"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Download Client Report (PDF)
                  </a>
                </div>
              </div>
            </div>

            {/* Sign Up Form */}
            <div className={`transition-all duration-300 ${isSignup ? 'opacity-100 translate-y-0' : 'opacity-0 absolute inset-0 pointer-events-none translate-y-2'}`}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="signup-name" className="text-[12px] font-medium text-slate-700">Full Name</Label>
                  <Input id="signup-name" value={signupName} onChange={e => setSignupName(e.target.value)} placeholder="John Doe" className="mt-1.5 h-10 input-premium transition-all duration-200" />
                </div>
                <div>
                  <Label htmlFor="signup-email" className="text-[12px] font-medium text-slate-700">Email</Label>
                  <Input id="signup-email" type="email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} placeholder="you@email.com" className="mt-1.5 h-10 input-premium transition-all duration-200" />
                </div>
                <div>
                  <Label htmlFor="signup-phone" className="text-[12px] font-medium text-slate-700">Phone (optional)</Label>
                  <Input id="signup-phone" value={signupPhone} onChange={e => setSignupPhone(e.target.value)} placeholder="+27 82 000 0000" className="mt-1.5 h-10 input-premium transition-all duration-200" />
                </div>
                <div>
                  <Label htmlFor="signup-password" className="text-[12px] font-medium text-slate-700">Password</Label>
                  <Input id="signup-password" type="password" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} placeholder="Min 8 chars, 1 uppercase, 1 number, 1 symbol" className="mt-1.5 h-10 input-premium transition-all duration-200" />
                </div>

                {/* POPIA consent with card treatment */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 spatial-depth-1">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={popiaConsent}
                      onChange={e => setPopiaConsent(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 accent-[#c9a84c] transition-all duration-200"
                    />
                    <span className="text-[11px] text-slate-600 leading-relaxed">
                      I consent to the processing of my personal information in accordance with the Protection of Personal Information Act (POPIA) and Infinity Legal&apos;s privacy policy.
                    </span>
                  </label>
                </div>

                {signupError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px] flex items-start gap-2.5 animate-scale-in spatial-depth-1">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{signupError}</span>
                  </div>
                )}
                <Button className="w-full btn-gold h-10 rounded-xl text-sm" onClick={handleSignup} disabled={signupLoading || !popiaConsent || !signupName || !signupEmail || !signupPassword}>
                  {signupLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                  {signupLoading ? 'Creating account...' : 'Create Account'}
                </Button>

                {/* Divider with "or" */}
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-slate-100" />
                  <span className="flex-shrink mx-3 text-[11px] text-slate-400 uppercase tracking-widest">or</span>
                  <div className="flex-grow border-t border-slate-100" />
                </div>

                <div className="text-center">
                  <button onClick={() => { setIsSignup(false); setSignupError(''); setLoginError(''); onSwitchToLogin?.(); }} className="text-[13px] text-[#a88832] hover:text-[#8a6e28] font-medium transition-all duration-200">
                    Already have an account? <span className="underline underline-offset-2">Sign In</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Trust indicators - refined horizontal layout with separators */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] text-slate-400">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 backdrop-blur-sm border border-slate-200/60 spatial-depth-1 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"><Shield className="w-3 h-3" /> POPIA Compliant</span>
            <span className="w-px h-3 bg-slate-200 hidden sm:block" />
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 backdrop-blur-sm border border-slate-200/60 spatial-depth-1 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"><Lock className="w-3 h-3" /> AES-256 Encrypted</span>
            <span className="w-px h-3 bg-slate-200 hidden sm:block" />
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 backdrop-blur-sm border border-slate-200/60 spatial-depth-1 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"><KeyRound className="w-3 h-3" /> 90-Day Expiry</span>
          </div>
        </div>
      </div>
    </div>
  );
}
