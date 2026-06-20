'use client';

import { useEffect, useRef } from 'react';

/**
 * LandingHydration — thin client component that adds interactivity
 * ON TOP of the server-rendered landing page.
 *
 * Responsibilities:
 * 1. Smooth scroll for nav anchor links
 * 2. Scroll-based navbar styling (transparent → solid)
 * 3. Mobile menu toggle
 * 4. Sign-in / sign-up button → dispatch custom events for AppShell
 */
export default function LandingHydration() {
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // ---- 1. Scroll-based navbar styling ----
    const nav = document.getElementById('landing-nav');
    navRef.current = nav;

    const handleScroll = () => {
      if (!nav) return;
      if (window.scrollY > 20) {
        nav.classList.add('bg-[#0a1628]/95', 'backdrop-blur-xl', 'shadow-2xl', 'shadow-black/10');
        nav.classList.remove('bg-transparent');
      } else {
        nav.classList.remove('bg-[#0a1628]/95', 'backdrop-blur-xl', 'shadow-2xl', 'shadow-black/10');
        nav.classList.add('bg-transparent');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // initial check

    // ---- 2. Smooth scroll for anchor links ----
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (anchor) {
        e.preventDefault();
        const id = anchor.getAttribute('href')!.slice(1);
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Close mobile menu if open
          closeMobileMenu();
        }
      }
    };
    document.addEventListener('click', handleClick);

    // ---- 3. Mobile menu toggle ----
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');

    const toggleMobileMenu = () => {
      if (!mobileMenu || !mobileToggle) return;
      const isOpen = mobileMenu.classList.contains('max-h-[500px]');
      if (isOpen) {
        closeMobileMenu();
      } else {
        mobileMenu.classList.remove('max-h-0', 'opacity-0');
        mobileMenu.classList.add('max-h-[500px]', 'opacity-100');
        mobileToggle.setAttribute('aria-expanded', 'true');
        // Swap icon to X
        mobileToggle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
      }
    };

    function closeMobileMenu() {
      if (!mobileMenu || !mobileToggle) return;
      mobileMenu.classList.remove('max-h-[500px]', 'opacity-100');
      mobileMenu.classList.add('max-h-0', 'opacity-0');
      mobileToggle.setAttribute('aria-expanded', 'false');
      // Swap icon back to hamburger
      mobileToggle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>`;
    }

    mobileToggle?.addEventListener('click', toggleMobileMenu);

    // ---- 4. Sign-in / sign-up button handlers ----
    const handleAuthClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const button = target.closest('[data-action]') as HTMLElement | null;
      if (!button) return;

      const action = button.getAttribute('data-action');
      if (action === 'sign-in') {
        e.preventDefault();
        closeMobileMenu();
        window.dispatchEvent(new CustomEvent('il-show-login'));
      } else if (action === 'sign-up') {
        e.preventDefault();
        closeMobileMenu();
        window.dispatchEvent(new CustomEvent('il-show-signup'));
      }
    };
    document.addEventListener('click', handleAuthClick);

    // ---- Cleanup ----
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleClick);
      mobileToggle?.removeEventListener('click', toggleMobileMenu);
      document.removeEventListener('click', handleAuthClick);
    };
  }, []);

  // This component doesn't render any visible UI — it only adds event listeners
  return null;
}
