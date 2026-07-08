/**
 * Infinity Legal SA - GSAP Animation Utilities
 *
 * Client-side animation helpers built on GSAP. All functions are safe to
 * call from client components ('use client'). They no-op gracefully if
 * the DOM target doesn't exist or if the user prefers reduced motion.
 */

'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef, type RefObject } from 'react';

// Register the ScrollTrigger plugin once.
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Respect users who prefer reduced motion.
const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export { gsap, ScrollTrigger };

interface ScrollRevealOptions {
  y?: number;
  opacity?: number;
  duration?: number;
  stagger?: number;
  start?: string;
  once?: boolean;
}

interface CounterOptions {
  duration?: number;
  suffix?: string;
  start?: string;
}

// ============================================
// HOOK: useGsapContext
// ============================================

export function useGsapContext(
  fn: () => void,
  deps: unknown[] = []
): RefObject<HTMLDivElement | null> {
  const scope = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scope.current || prefersReducedMotion()) return;
    const ctx = gsap.context(fn, scope);
    return () => ctx.revert();
  }, deps);

  return scope;
}

// ============================================
// HOOK: useScrollReveal
// ============================================

export function useScrollReveal(
  selector: string,
  options: ScrollRevealOptions = {}
): RefObject<HTMLDivElement | null> {
  const { y = 32, opacity = 0, duration = 0.7, stagger = 0.12, start = 'top 85%', once = true } = options;
  const scope = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scope.current || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from(selector, {
        y,
        opacity,
        duration,
        stagger,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: scope.current,
          start,
          once,
        },
      });
    }, scope);
    return () => ctx.revert();
  }, [selector, y, opacity, duration, stagger, start, once]);

  return scope;
}

// ============================================
// HOOK: useHeroEntrance
// ============================================

export function useHeroEntrance(): RefObject<HTMLDivElement | null> {
  const scope = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scope.current || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from('[data-hero="kicker"]', { y: 20, opacity: 0, duration: 0.5 })
        .from('[data-hero="title"]', { y: 40, opacity: 0, duration: 0.8 }, '-=0.2')
        .from('[data-hero="subtitle"]', { y: 24, opacity: 0, duration: 0.6 }, '-=0.4')
        .from('[data-hero="cta"]', { y: 20, opacity: 0, duration: 0.5 }, '-=0.3')
        .from('[data-hero="stat"]', { y: 24, opacity: 0, duration: 0.5, stagger: 0.1 }, '-=0.2');
    }, scope);
    return () => ctx.revert();
  }, []);

  return scope;
}

// ============================================
// HOOK: useMagneticButton
// ============================================

export function useMagneticButton(strength: number = 0.3): RefObject<HTMLElement | null> {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(el, {
        x: x * strength,
        y: y * strength,
        duration: 0.4,
        ease: 'power2.out',
      });
    };

    const onLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
    };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [strength]);

  return ref;
}

// ============================================
// HOOK: useCounterAnimation
// ============================================

export function useCounterAnimation(
  end: number,
  options: CounterOptions = {}
): { ref: RefObject<HTMLSpanElement | null>; value: string } {
  const { duration = 1.8, suffix = '', start = 'top 80%' } = options;
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) {
      if (el) el.textContent = `${end.toLocaleString()}${suffix}`;
      return;
    }

    const obj = { val: 0 };
    const st = ScrollTrigger.create({
      trigger: el,
      start,
      once: true,
      onEnter: () => {
        gsap.to(obj, {
          val: end,
          duration,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent = `${Math.round(obj.val).toLocaleString()}${suffix}`;
          },
        });
      },
    });

    return () => st.kill();
  }, [end, duration, suffix, start]);

  return { ref, value: `${end.toLocaleString()}${suffix}` };
}
