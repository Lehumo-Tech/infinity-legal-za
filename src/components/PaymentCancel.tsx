'use client';

import React from 'react';
import { XCircle, ArrowLeft, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaymentCancelProps {
  /** Callback to retry payment / go back to payment wall */
  onRetry?: () => void;
  /** Callback to go back to home/landing */
  onGoHome?: () => void;
}

export function PaymentCancel({ onRetry, onGoHome }: PaymentCancelProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f8fa] p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-[#0c1e3c] via-red-400 to-[#0c1e3c]" />

          <div className="p-8 sm:p-10 text-center">
            {/* Cancelled icon */}
            <div className="mx-auto mb-6">
              <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
            </div>

            {/* Cancel message */}
            <h1 className="text-2xl font-bold text-[#0c1e3c] mb-2">
              Payment Cancelled
            </h1>
            <p className="text-slate-500 text-sm mb-6">
              Your subscription was not activated. No charges have been made to your account.
            </p>

            {/* Info card */}
            <div className="bg-[#f7f8fa] rounded-xl p-4 mb-6 text-left border border-slate-100">
              <h3 className="text-sm font-semibold text-[#0c1e3c] mb-2">What happened?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                The payment process was cancelled before completion. This can happen if you closed the PayFast
                payment window or chose not to proceed. Your account has not been charged.
              </p>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <Button
                onClick={onRetry}
                className="w-full bg-[#0c1e3c] text-white hover:bg-[#1a3358] rounded-xl py-5 text-sm font-semibold shadow-lg transition-all"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>

              <Button
                onClick={onGoHome}
                variant="outline"
                className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-[#0c1e3c] rounded-xl py-4 text-sm font-medium transition-all"
              >
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>

            {/* Support note */}
            <p className="mt-6 text-xs text-slate-400 leading-relaxed">
              If you experienced any issues or have questions about your subscription,
              please contact our support team at{' '}
              <a
                href="mailto:info@infinitylegal.org"
                className="text-[#a88832] hover:text-[#8a6e28] underline underline-offset-2 transition-colors"
              >
                info@infinitylegal.org
              </a>
              {' '}or call{' '}
              <a
                href="tel:+27681276038"
                className="text-[#a88832] hover:text-[#8a6e28] underline underline-offset-2 transition-colors"
              >
                068 127 6038
              </a>
            </p>
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-4 flex items-center justify-center gap-1">
          <ArrowLeft className="w-3 h-3 text-slate-400" />
          <p className="text-[10px] text-slate-400">
            Secure payments powered by <span className="font-medium">PayFast</span>
          </p>
        </div>
      </div>
    </div>
  );
}
