import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center px-6 max-w-lg">
        {/* Icon */}
        <div className="mx-auto mb-8 w-24 h-24 rounded-full bg-[#1a3358]/5 flex items-center justify-center">
          <FileQuestion className="w-12 h-12 text-[#1a3358]" />
        </div>

        {/* 404 Number */}
        <h1 className="text-7xl font-bold text-[#1a3358] mb-2" style={{ fontFamily: 'Georgia, serif' }}>
          404
        </h1>

        {/* Heading */}
        <h2 className="text-2xl font-semibold text-[#1a3358] mb-4">
          Page Not Found
        </h2>

        {/* Description */}
        <p className="text-slate-500 mb-8 leading-relaxed">
          The page you are looking for does not exist or has been moved.
          Please check the URL or navigate back to our homepage.
        </p>

        {/* Divider with gold accent */}
        <div className="w-16 h-1 bg-[#c9a84c] mx-auto mb-8 rounded-full" />

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button className="bg-[#1a3358] hover:bg-[#0c1e3c] text-white font-semibold px-8 h-11 rounded-xl">
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <p className="mt-12 text-xs text-slate-400">
          Infinity Legal SA &mdash; South Africa&apos;s Premier Legal Services Platform
        </p>
      </div>
    </div>
  );
}
