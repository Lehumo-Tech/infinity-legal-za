import Link from 'next/link'

export default function CompliancePage() {
  return (
    <div className="min-h-screen bg-infinity-cream dark:bg-gray-900 py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <img src="/logo-icon-256.png" alt="Infinity Legal" className="h-16 mx-auto rounded-xl" />
          </Link>
          <h1 className="text-3xl font-display font-bold text-infinity-navy dark:text-white mb-2">Compliance</h1>
          <p className="text-infinity-navy/70 dark:text-white/50">Our commitment to legal and regulatory compliance</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 p-8 shadow-sm space-y-6">
          <div>
            <h3 className="font-display font-bold text-infinity-navy dark:text-white mb-2">POPIA Compliance</h3>
            <p className="text-sm text-infinity-navy/70 dark:text-white/70 leading-relaxed">Infinity Legal fully complies with the Protection of Personal Information Act 4 of 2013 (POPIA). We collect only necessary personal information, process it lawfully, and protect it with appropriate security measures. You have the right to access, correct, or delete your personal information at any time.</p>
          </div>
          <div>
            <h3 className="font-display font-bold text-infinity-navy dark:text-white mb-2">Legal Practice Act</h3>
            <p className="text-sm text-infinity-navy/70 dark:text-white/70 leading-relaxed">All attorneys on our platform are verified through the Legal Practice Council (LPC) under the Legal Practice Act 28 of 2014. We ensure every legal practitioner maintains current enrollment and good standing.</p>
          </div>
          <div>
            <h3 className="font-display font-bold text-infinity-navy dark:text-white mb-2">Financial Services</h3>
            <p className="text-sm text-infinity-navy/70 dark:text-white/70 leading-relaxed">Subscription payments are processed through secure, PCI-DSS compliant payment providers. Client trust account funds are managed in accordance with the Legal Practice Council's trust account rules.</p>
          </div>
          <div>
            <h3 className="font-display font-bold text-infinity-navy dark:text-white mb-2">AI Transparency</h3>
            <p className="text-sm text-infinity-navy/70 dark:text-white/70 leading-relaxed">Our AI tools provide guidance and research assistance only. All AI-generated content is clearly marked and must be reviewed by a qualified attorney before being relied upon. AI outputs do not constitute legal advice.</p>
          </div>

          <div className="pt-4 border-t border-infinity-navy/10 dark:border-gray-700">
            <p className="text-xs text-infinity-navy/40 dark:text-white/40">For compliance enquiries, email <a href="mailto:compliance@infinitylegal.org" className="text-infinity-gold hover:underline">compliance@infinitylegal.org</a></p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-infinity-navy/50 dark:text-white/50 hover:text-infinity-navy dark:hover:text-white">← Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
