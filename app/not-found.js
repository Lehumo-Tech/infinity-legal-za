import Link from 'next/link'

export const metadata = {
  title: '404 - Page Not Found | Infinity Legal',
  description: 'The page you are looking for could not be found. Return to Infinity Legal homepage for AI-powered legal assistance.',
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1628] to-[#1a2744] flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Logo */}
        <div className="mb-8">
          <img src="/logo.svg" alt="Infinity Legal" className="h-12 mx-auto opacity-80" />
        </div>

        {/* 404 Display */}
        <div className="relative mb-8">
          <h1 className="text-[120px] sm:text-[160px] font-display font-bold text-white/10 leading-none select-none">404</h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl mb-3">⚖️</div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-white">Page Not Found</h2>
            </div>
          </div>
        </div>

        <p className="text-white/60 text-base mb-10 max-w-md mx-auto">
          The page you are looking for may have been moved, removed, or is temporarily unavailable.
        </p>

        {/* Navigation Options */}
        <div className="grid sm:grid-cols-3 gap-3 max-w-lg mx-auto mb-10">
          <Link href="/"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#c9a94e]/50 transition-all group">
            <span className="text-2xl">🏠</span>
            <span className="text-sm font-semibold text-white group-hover:text-[#c9a94e] transition-colors">Home</span>
          </Link>
          <Link href="/intake"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#c9a94e]/50 transition-all group">
            <span className="text-2xl">🤖</span>
            <span className="text-sm font-semibold text-white group-hover:text-[#c9a94e] transition-colors">AI Legal Help</span>
          </Link>
          <Link href="/contact"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#c9a94e]/50 transition-all group">
            <span className="text-2xl">📞</span>
            <span className="text-sm font-semibold text-white group-hover:text-[#c9a94e] transition-colors">Contact Us</span>
          </Link>
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <Link href="/login" className="text-white/40 hover:text-[#c9a94e] transition-colors">Sign In</Link>
          <span className="text-white/20">•</span>
          <Link href="/pricing" className="text-white/40 hover:text-[#c9a94e] transition-colors">Pricing</Link>
          <span className="text-white/20">•</span>
          <Link href="/book-consultation" className="text-white/40 hover:text-[#c9a94e] transition-colors">Book Consultation</Link>
          <span className="text-white/20">•</span>
          <Link href="/help" className="text-white/40 hover:text-[#c9a94e] transition-colors">Help Centre</Link>
        </div>

        {/* Legal Notice */}
        <p className="text-white/20 text-[10px] mt-12">
          Infinity Legal (Pty) Ltd • South Africa • POPIA Compliant
        </p>
      </div>
    </div>
  )
}
