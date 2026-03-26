import Link from 'next/link'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-infinity-cream dark:bg-gray-900 py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <img src="/logo.png" alt="Infinity Legal" className="h-12 mx-auto" />
          </Link>
          <h1 className="text-3xl font-display font-bold text-infinity-navy dark:text-white mb-2">Contact Us</h1>
          <p className="text-infinity-navy/70 dark:text-white/50">We're here to help. Reach out anytime.</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 p-8 shadow-sm space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="p-5 bg-infinity-cream/50 dark:bg-gray-700/50 rounded-xl">
              <div className="text-2xl mb-2">📧</div>
              <h3 className="font-semibold text-infinity-navy dark:text-white mb-1">Email</h3>
              <a href="mailto:info@infinitylegal.org" className="text-sm text-infinity-gold hover:underline">info@infinitylegal.org</a>
            </div>
            <div className="p-5 bg-infinity-cream/50 dark:bg-gray-700/50 rounded-xl">
              <div className="text-2xl mb-2">📞</div>
              <h3 className="font-semibold text-infinity-navy dark:text-white mb-1">Phone</h3>
              <a href="tel:+27681640095" className="text-sm text-infinity-gold hover:underline">+27 68 164 0095</a>
            </div>
            <div className="p-5 bg-infinity-cream/50 dark:bg-gray-700/50 rounded-xl">
              <div className="text-2xl mb-2">📍</div>
              <h3 className="font-semibold text-infinity-navy dark:text-white mb-1">Location</h3>
              <p className="text-sm text-infinity-navy/60 dark:text-white/60">South Africa (National Coverage)</p>
            </div>
            <div className="p-5 bg-infinity-cream/50 dark:bg-gray-700/50 rounded-xl">
              <div className="text-2xl mb-2">🕐</div>
              <h3 className="font-semibold text-infinity-navy dark:text-white mb-1">Business Hours</h3>
              <p className="text-sm text-infinity-navy/60 dark:text-white/60">Mon-Fri: 08:00 - 17:00 SAST</p>
            </div>
          </div>

          <div className="pt-4 border-t border-infinity-navy/10 dark:border-gray-700 text-center">
            <p className="text-sm text-infinity-navy/50 dark:text-white/50">For urgent legal matters, please use our <Link href="/intake" className="text-infinity-gold font-semibold hover:underline">AI Intake Wizard</Link> for immediate guidance.</p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-infinity-navy/50 dark:text-white/50 hover:text-infinity-navy dark:hover:text-white">← Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
