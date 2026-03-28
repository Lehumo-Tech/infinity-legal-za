import Link from 'next/link'

export default function VerificationPage() {
  return (
    <div className="min-h-screen bg-infinity-cream dark:bg-gray-900 py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <img src="/logo-icon-256.png" alt="Infinity Legal" className="h-16 mx-auto rounded-xl" />
          </Link>
          <h1 className="text-3xl font-display font-bold text-infinity-navy dark:text-white mb-2">Attorney Verification</h1>
          <p className="text-infinity-navy/70 dark:text-white/50">How we ensure quality legal representation</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 p-8 shadow-sm">
          <div className="space-y-6">
            {[
              { step: '1', title: 'Application', desc: 'Submit your details, LPC number, and practice areas via our Attorney Signup form.', icon: '📝' },
              { step: '2', title: 'LPC Verification', desc: 'We verify your Legal Practice Council enrollment status and standing with the relevant provincial law society.', icon: '⚖️' },
              { step: '3', title: 'Background Check', desc: 'A standard background check confirms your good standing and any disciplinary history.', icon: '🔍' },
              { step: '4', title: 'Onboarding', desc: 'Once verified, you receive access to Infinity OS, our AI-powered legal operations platform, and begin receiving client referrals.', icon: '🚀' },
            ].map((s) => (
              <div key={s.step} className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-infinity-navy text-white flex items-center justify-center font-bold text-sm shrink-0">{s.step}</div>
                <div>
                  <h3 className="font-semibold text-infinity-navy dark:text-white">{s.icon} {s.title}</h3>
                  <p className="text-sm text-infinity-navy/60 dark:text-white/60 mt-1">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-infinity-navy/10 dark:border-gray-700 text-center">
            <Link href="/attorney/signup" className="px-6 py-3 bg-infinity-navy text-white rounded-xl font-semibold hover:bg-infinity-navy-light transition-colors">
              Apply to Join →
            </Link>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-infinity-navy/50 dark:text-white/50 hover:text-infinity-navy dark:hover:text-white">← Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
