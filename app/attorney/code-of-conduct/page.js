import Link from 'next/link'

export default function CodeOfConductPage() {
  return (
    <div className="min-h-screen bg-infinity-cream dark:bg-gray-900 py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <img src="/logo-icon-256.png" alt="Infinity Legal" className="h-16 mx-auto rounded-xl" />
          </Link>
          <h1 className="text-3xl font-display font-bold text-infinity-navy dark:text-white mb-2">Attorney Code of Conduct</h1>
          <p className="text-infinity-navy/70 dark:text-white/50">Standards for all Infinity Legal practitioners</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 p-8 shadow-sm">
          <div className="prose prose-sm max-w-none text-infinity-navy/80 dark:text-white/80 space-y-6">
            <div>
              <h3 className="font-display font-bold text-infinity-navy dark:text-white">1. Professional Standards</h3>
              <p className="text-sm leading-relaxed">All attorneys on the Infinity Legal platform must maintain their enrollment with the Legal Practice Council (LPC) and comply with the Legal Practice Act 28 of 2014, the LPC Code of Conduct, and all applicable rules of their provincial law society.</p>
            </div>
            <div>
              <h3 className="font-display font-bold text-infinity-navy dark:text-white">2. Client Confidentiality</h3>
              <p className="text-sm leading-relaxed">Attorney-client privilege is sacred. All client information must be treated with the strictest confidentiality in compliance with POPIA (Protection of Personal Information Act 4 of 2013). No client data may be shared, disclosed, or used outside the scope of the legal mandate.</p>
            </div>
            <div>
              <h3 className="font-display font-bold text-infinity-navy dark:text-white">3. Competence & Diligence</h3>
              <p className="text-sm leading-relaxed">Attorneys must only accept matters within their area of competence. Matters must be handled with due diligence, keeping clients informed of progress and meeting all statutory deadlines including prescription periods and court filing dates.</p>
            </div>
            <div>
              <h3 className="font-display font-bold text-infinity-navy dark:text-white">4. Conflict of Interest</h3>
              <p className="text-sm leading-relaxed">Attorneys must immediately disclose any actual or potential conflict of interest. Where a conflict arises, the attorney must recuse themselves and the matter will be reassigned.</p>
            </div>
            <div>
              <h3 className="font-display font-bold text-infinity-navy dark:text-white">5. Communication</h3>
              <p className="text-sm leading-relaxed">Attorneys must respond to client communications within 48 business hours. Regular case status updates must be provided via the Infinity OS platform.</p>
            </div>
            <div>
              <h3 className="font-display font-bold text-infinity-navy dark:text-white">6. Fee Transparency</h3>
              <p className="text-sm leading-relaxed">All fees are governed by the client's subscription plan. Attorneys may not charge additional fees without prior written approval from the Managing Partner and clear disclosure to the client.</p>
            </div>
            <div>
              <h3 className="font-display font-bold text-infinity-navy dark:text-white">7. Disciplinary Process</h3>
              <p className="text-sm leading-relaxed">Breaches of this code may result in warnings, suspension, or removal from the Infinity Legal network, and may be reported to the LPC where required by law.</p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-infinity-navy/10 dark:border-gray-700 text-center">
            <p className="text-xs text-infinity-navy/40 dark:text-white/40">Last updated: February 2026</p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/attorney/signup" className="text-sm text-infinity-navy/50 dark:text-white/50 hover:text-infinity-navy dark:hover:text-white">← Back to Attorney Signup</Link>
        </div>
      </div>
    </div>
  )
}
