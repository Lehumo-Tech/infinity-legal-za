'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaymentSuccessProps {
  /** Callback to navigate to dashboard */
  onGoToDashboard?: () => void;
  /** Optional redirect URL */
  redirectUrl?: string;
  /** Auto-redirect delay in seconds (default 5) */
  autoRedirectDelay?: number;
}

export function PaymentSuccess({
  onGoToDashboard,
  redirectUrl,
  autoRedirectDelay = 5,
}: PaymentSuccessProps) {
  const [countdown, setCountdown] = useState(autoRedirectDelay);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Auto-redirect countdown
  useEffect(() => {
    if (countdown <= 0) {
      // Use async IIFE to avoid synchronous setState in effect
      void (async () => {
        setIsRedirecting(true);
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else {
          onGoToDashboard?.();
        }
      })();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, onGoToDashboard, redirectUrl]);

  const handleGoToDashboard = () => {
    setIsRedirecting(true);
    if (redirectUrl) {
      window.location.href = redirectUrl;
    } else {
      onGoToDashboard?.();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f8fa] p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-[#0c1e3c] via-[#c9a84c] to-[#0c1e3c]" />

          <div className="p-8 sm:p-10 text-center">
            {/* Animated checkmark */}
            <div className="mx-auto mb-6 relative">
              <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto relative">
                <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-20" />
                <CheckCircle2 className="w-10 h-10 text-emerald-500 relative z-10" />
              </div>
            </div>

            {/* Success message */}
            <h1 className="text-2xl font-bold text-[#0c1e3c] mb-2">
              Payment Successful!
            </h1>
            <p className="text-slate-500 text-sm mb-6">
              Your subscription is now active. You have full access to all the features included in your plan.
            </p>

            {/* Subscription details card */}
            <div className="bg-[#f7f8fa] rounded-xl p-4 mb-6 text-left border border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#0c1e3c] flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-[#c9a84c]" />
                </div>
                <span className="text-sm font-semibold text-[#0c1e3c]">Subscription Active</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-500">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-[#c9a84c]" />
                  Access to all case management tools
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-[#c9a84c]" />
                  AI-powered legal analysis
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-[#c9a84c]" />
                  Secure document management
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-[#c9a84c]" />
                  POPIA-compliant data protection
                </li>
              </ul>
            </div>

            {/* Go to Dashboard button */}
            <Button
              onClick={handleGoToDashboard}
              disabled={isRedirecting}
              className="w-full bg-[#0c1e3c] text-white hover:bg-[#1a3358] rounded-xl py-5 text-sm font-semibold shadow-lg transition-all"
            >
              {isRedirecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Redirecting...
                </>
              ) : (
                <>
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>

            {/* Auto-redirect countdown */}
            <p className="mt-4 text-xs text-slate-400">
              {isRedirecting
                ? 'Redirecting now...'
                : `Auto-redirecting in ${countdown} second${countdown !== 1 ? 's' : ''}...`
              }
            </p>
          </div>
        </div>

        {/* Footer note */}
        <p className="mt-4 text-center text-[10px] text-slate-400">
          A confirmation email has been sent to your registered address.
          <br />
          Powered by <span className="font-medium">PayFast</span> · Secure South African Payments
        </p>
      </div>
    </div>
  );
}
