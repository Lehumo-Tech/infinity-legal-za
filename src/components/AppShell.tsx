'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/useAuth';
import { LoginScreen } from '@/components/LoginScreen';

// Dashboard is code-split — only loads when user is authenticated
const DashboardShell = dynamic(() => import('@/components/DashboardShell'), {
  loading: () => (
    <div className="fixed inset-0 z-[60] bg-slate-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c9a84c]" />
    </div>
  ),
  ssr: false,
});

/**
 * AppShell — client-side app shell that handles:
 * 1. Auth state checking
 * 2. Login/signup modal overlay
 * 3. Dashboard rendering when authenticated
 * 4. "Back to Dashboard" floating button when viewing landing page while authenticated
 *
 * IMPORTANT: LoginScreen must be shown IMMEDIATELY when user clicks Sign In / Get Started,
 * even while auth is still loading. The previous early-return on authLoading blocked
 * the login modal from appearing, making buttons appear non-functional.
 */
export default function AppShell() {
  const { user: authUser, accessToken, loading: authLoading, signOut } = useAuth();
  const isAuthenticated = !!authUser && !!accessToken;

  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Listen for custom events from LandingPage intake/signup buttons
  useEffect(() => {
    const handleShowLogin = () => {
      setShowSignup(false);
      setShowLogin(true);
      setLoginError('');
    };
    const handleShowSignup = ((e: CustomEvent) => {
      setShowLogin(false);
      setShowSignup(true);
      setLoginError('');
      // Store prefill data if provided
      if (e.detail?.email) sessionStorage.setItem('il_intake_email', e.detail.email);
      if (e.detail?.name) sessionStorage.setItem('il_intake_name', e.detail.name);
    }) as EventListener;

    window.addEventListener('il-show-login', handleShowLogin);
    window.addEventListener('il-show-signup', handleShowSignup);

    return () => {
      window.removeEventListener('il-show-login', handleShowLogin);
      window.removeEventListener('il-show-signup', handleShowSignup);
    };
  }, []);

  // When auth state changes, handle visibility via derived state approach
  const effectiveShowLogin = isAuthenticated ? false : showLogin;
  const effectiveShowSignup = isAuthenticated ? false : showSignup;
  const effectiveShowDashboard = isAuthenticated ? true : showDashboard;

  // ===== PRIORITY: Show LoginScreen immediately if user clicked Sign In / Get Started =====
  // This must be checked BEFORE the authLoading guard.
  // The login screen should appear instantly when clicked, not wait for auth to finish loading.
  if (!isAuthenticated && (effectiveShowLogin || effectiveShowSignup)) {
    return (
      <div className="fixed inset-0 z-[60]">
        <LoginScreen
          onLogin={() => {}}
          loading={false}
          error={loginError}
          initialSignup={effectiveShowSignup}
          onBackToHome={() => { setShowLogin(false); setShowSignup(false); }}
        />
      </div>
    );
  }

  // ===== AUTHENTICATED =====
  if (isAuthenticated) {
    // If user wants to view the landing page instead of dashboard
    if (!effectiveShowDashboard) {
      return (
        <>
          {/* Floating "Back to Dashboard" button */}
          <button
            onClick={() => setShowDashboard(true)}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[55] bg-[#c9a84c] text-[#0c1e3c] hover:bg-[#d4b85c] rounded-full px-6 py-2.5 text-sm font-semibold shadow-lg shadow-[#c9a84c]/20 transition-all hover:shadow-[#c9a84c]/30 inline-flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
            Back to Dashboard
          </button>
        </>
      );
    }

    // Show dashboard as a full-screen overlay
    return (
      <div className="fixed inset-0 z-[60]">
        <DashboardShell
          onShowLanding={() => setShowDashboard(false)}
        />
      </div>
    );
  }

  // ===== NOT AUTHENTICATED, no modal triggered =====
  // Show a minimal auth loading indicator while session is being checked
  if (authLoading) {
    return (
      <div className="fixed bottom-4 right-4 z-[55]">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#c9a84c]" />
      </div>
    );
  }

  // Not authenticated, no modal — landing page is visible (server-rendered)
  return null;
}
