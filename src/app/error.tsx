'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center px-6 max-w-lg">
        {/* Icon */}
        <div className="mx-auto mb-8 w-24 h-24 rounded-full bg-red-50 flex items-center justify-center">
          <AlertTriangle className="w-12 h-12 text-red-500" />
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-[#1a3358] mb-3" style={{ fontFamily: 'Georgia, serif' }}>
          Something Went Wrong
        </h1>

        {/* Description */}
        <p className="text-slate-500 mb-8 leading-relaxed">
          An unexpected error occurred. Our team has been notified and is working to resolve the issue.
          You can try again or return to the homepage.
        </p>

        {/* Divider with gold accent */}
        <div className="w-16 h-1 bg-[#c9a84c] mx-auto mb-8 rounded-full" />

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => reset()}
            className="bg-[#1a3358] hover:bg-[#0c1e3c] text-white font-semibold px-8 h-11 rounded-xl"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>

          <Link href="/">
            <Button variant="outline" className="border-[#1a3358] text-[#1a3358] hover:bg-[#1a3358]/5 font-semibold px-8 h-11 rounded-xl">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Error digest for support reference */}
        {error?.digest && (
          <p className="mt-8 text-xs text-slate-400">
            Error Reference: {error.digest}
          </p>
        )}

        {/* Footer */}
        <p className="mt-12 text-xs text-slate-400">
          Infinity Legal SA &mdash; South Africa&apos;s Premier Legal Services Platform
        </p>
      </div>
    </div>
  );
}
