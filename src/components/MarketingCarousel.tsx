'use client';

/**
 * MarketingCarousel — high-converting, GSAP-animated image carousel.
 *
 * Features:
 *  - Auto-advancing slides (6s) with pause on hover / focus / touch
 *  - GSAP-powered smooth crossfade + Ken Burns zoom + text reveal
 *  - Progress bar that animates per slide (resets on manual nav)
 *  - Prev/next arrows + dot navigation (keyboard accessible)
 *  - Marketing copy overlay with high-converting CTA per slide
 *  - Mobile-first responsive layout, reduced-motion respected
 *  - Accessible: aria-roledescription, aria-live, keyboard arrows
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowRight, ChevronLeft, ChevronRight, Shield, Sparkles, Zap } from 'lucide-react';
import { gsap } from '@/lib/gsap';

interface Slide {
  image: string;
  imageAlt: string;
  eyebrow: string;
  title: string;
  highlight: string;
  description: string;
  cta: { label: string; href: string };
  icon: React.ComponentType<{ className?: string }>;
  accent: 'gold' | 'navy';
}

const SLIDES: Slide[] = [
  {
    image: '/images/carousel/slide-1-attorney.png',
    imageAlt: 'Infinity Legal legal advisor reviewing case documents in a modern Johannesburg office',
    eyebrow: 'EXPERT LEGAL REPRESENTATION',
    title: 'South Africa\u2019s trusted',
    highlight: 'legal advisors',
    description:
      'From CCMA referrals to civil litigation and conveyancing — our legal advisors fight for your rights with precision and care.',
    cta: { label: 'Get a Free AI Intake', href: '#intake' },
    icon: Shield,
    accent: 'gold',
  },
  {
    image: '/images/carousel/slide-2-technology.png',
    imageAlt: 'Infinity Legal AI-powered case management dashboard',
    eyebrow: 'AI-POWERED PLATFORM',
    title: 'Your case, analysed',
    highlight: 'in seconds',
    description:
      'Our AI assistant reviews your matter, drafts documents, and gives your legal team the context they need — 24/7, POPIA-compliant.',
    cta: { label: 'Ask Infinity AI', href: '#ask-ai' },
    icon: Sparkles,
    accent: 'navy',
  },
  {
    image: '/images/carousel/slide-3-clients.png',
    imageAlt: 'Happy South African clients shaking hands with an Infinity Legal legal advisor',
    eyebrow: 'RESULTS THAT MATTER',
    title: 'Real outcomes for',
    highlight: 'real people',
    description:
      'Transparent pricing from R99/month. No hidden fees. Cancel anytime. Justice shouldn\u2019t be a luxury — we make it accessible.',
    cta: { label: 'View Pricing', href: '#pricing' },
    icon: Zap,
    accent: 'gold',
  },
];

const AUTO_ADVANCE_MS = 6000;

export function MarketingCarousel() {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1 for the active slide
  const containerRef = useRef<HTMLDivElement>(null);
  const slidesRef = useRef<HTMLDivElement>(null);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = SLIDES.length;
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const goTo = useCallback(
    (next: number) => {
      setIndex((prev) => {
        const target = ((next % total) + total) % total;
        if (target === prev) return prev;
        return target;
      });
      setProgress(0);
    },
    [total],
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  // Animate the incoming slide's text + image on index change (GSAP)
  useEffect(() => {
    if (prefersReducedMotion) return;
    const textEl = textRefs.current[index];
    const imgEl = imageRefs.current[index];
    if (!textEl && !imgEl) return;

    const tl = gsap.timeline();
    // Image: subtle Ken Burns zoom-in
    if (imgEl) {
      gsap.set(imgEl, { scale: 1.08, opacity: 0 });
      tl.to(imgEl, { scale: 1, opacity: 1, duration: 1.2, ease: 'power2.out' }, 0);
    }
    // Text: staggered rise + fade
    if (textEl) {
      const children = Array.from(textEl.children) as HTMLElement[];
      gsap.set(children, { y: 24, opacity: 0 });
      tl.to(
        children,
        { y: 0, opacity: 1, duration: 0.7, stagger: 0.09, ease: 'power3.out' },
        0.15,
      );
    }
    return () => {
      tl.kill();
    };
  }, [index, prefersReducedMotion]);

  // Auto-advance + progress bar
  useEffect(() => {
    if (isPaused || prefersReducedMotion) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      return;
    }
    const tickMs = 50;
    const increment = tickMs / AUTO_ADVANCE_MS;
    progressTimerRef.current = setInterval(() => {
      setProgress((p) => {
        const np = p + increment;
        if (np >= 1) {
          setIndex((i) => (i + 1) % total);
          return 0;
        }
        return np;
      });
    }, tickMs);
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [isPaused, index, total, prefersReducedMotion]);

  // Keyboard navigation
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      }
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, [prev, next]);

  const activeAccent =
    SLIDES[index].accent === 'gold' ? '#c9a84c' : '#dfc475';

  return (
    <section
      ref={containerRef}
      className="relative w-full"
      aria-roledescription="carousel"
      aria-label="Infinity Legal services highlights"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      tabIndex={0}
    >
      {/* Slides viewport */}
      <div
        ref={slidesRef}
        className="relative w-full overflow-hidden rounded-3xl spatial-depth-3"
        style={{ aspectRatio: '1344 / 768' }}
      >
        {SLIDES.map((slide, i) => {
          const isActive = i === index;
          const Icon = slide.icon;
          return (
            <div
              key={i}
              className="absolute inset-0"
              aria-hidden={!isActive}
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${total}: ${slide.title} ${slide.highlight}`}
              style={{
                opacity: isActive ? 1 : 0,
                transition: prefersReducedMotion
                  ? 'opacity 0.4s ease'
                  : 'opacity 0.9s cubic-bezier(0.4, 0, 0.2, 1)',
                pointerEvents: isActive ? 'auto' : 'none',
                zIndex: isActive ? 2 : 1,
              }}
            >
              {/* Image with Ken Burns zoom */}
              <div
                ref={(el) => { imageRefs.current[i] = el; }}
                className="absolute inset-0"
              >
                <Image
                  src={slide.image}
                  alt={slide.imageAlt}
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  className="object-cover"
                />
              </div>

              {/* Gradient overlay for legibility */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(90deg, rgba(8,20,40,0.92) 0%, rgba(12,30,60,0.78) 38%, rgba(12,30,60,0.35) 70%, rgba(12,30,60,0.12) 100%)',
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(0deg, rgba(8,20,40,0.55) 0%, rgba(8,20,40,0) 40%)',
                }}
              />

              {/* Marketing copy overlay */}
              <div className="absolute inset-0 flex items-center">
                <div
                  ref={(el) => { textRefs.current[i] = el; }}
                  className="px-6 sm:px-12 lg:px-16 max-w-2xl"
                >
                  {/* Eyebrow pill */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-5">
                    <Icon className="w-3.5 h-3.5" style={{ color: activeAccent }} />
                    <span
                      className="text-[10px] sm:text-[11px] font-bold tracking-[0.15em]"
                      style={{ color: activeAccent }}
                    >
                      {slide.eyebrow}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-[3.4rem] font-bold tracking-tight text-white leading-[1.08]">
                    {slide.title}{' '}
                    <span
                      className="bg-gradient-to-r from-[#dfc475] via-[#c9a84c] to-[#a88832] bg-clip-text text-transparent"
                    >
                      {slide.highlight}
                    </span>
                  </h2>

                  {/* Description */}
                  <p className="mt-4 sm:mt-5 text-[13px] sm:text-[14px] lg:text-[15px] text-[#c7d4e8] leading-relaxed max-w-lg">
                    {slide.description}
                  </p>

                  {/* CTA */}
                  <a
                    href={slide.cta.href}
                    className="mt-6 sm:mt-8 inline-flex items-center bg-gradient-to-br from-[#c9a84c] to-[#a88832] text-[#0c1e3c] hover:from-[#dfc475] hover:to-[#c9a84c] rounded-xl h-11 sm:h-12 px-5 sm:px-6 text-[13px] sm:text-[14px] font-bold spatial-depth-2 transition-all hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c1e3c]"
                  >
                    {slide.cta.label}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}

        {/* Prev / Next arrows */}
        <button
          type="button"
          onClick={prev}
          aria-label="Previous slide"
          className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/25 transition-all flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c]"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="Next slide"
          className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/25 transition-all flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c]"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Progress bar (top edge) */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-10">
          <div
            className="h-full"
            style={{
              width: `${progress * 100}%`,
              background: 'linear-gradient(90deg, #c9a84c, #dfc475)',
              transition: isPaused ? 'none' : 'width 50ms linear',
            }}
          />
        </div>
      </div>

      {/* Dot navigation + slide counter */}
      <div className="mt-5 flex items-center justify-center gap-4">
        <span className="text-[11px] font-semibold text-[#7a8fb0] tabular-nums tracking-wide">
          {String(index + 1).padStart(2, '0')} <span className="text-[#c7d4e8]/40">/ {String(total).padStart(2, '0')}</span>
        </span>
        <div className="flex items-center gap-2" role="tablist" aria-label="Choose slide">
          {SLIDES.map((slide, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === index}
              aria-label={`Go to slide ${i + 1}: ${slide.title}`}
              onClick={() => goTo(i)}
              className="group relative p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c] rounded-full"
            >
              <span
                className="block rounded-full transition-all duration-300"
                style={{
                  width: i === index ? 28 : 8,
                  height: 8,
                  background: i === index ? activeAccent : 'rgba(12, 30, 60, 0.25)',
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
