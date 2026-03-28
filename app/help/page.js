import Link from 'next/link'

export default function HelpPage() {
  const faqs = [
    { q: 'How does the AI Intake Wizard work?', a: 'Our AI analyzes your legal situation, identifies the relevant area of law, and provides initial guidance. It then matches you with an appropriate attorney from our network.' },
    { q: 'What does my subscription include?', a: 'All plans include AI legal analysis, attorney consultations, document preparation, and representation coverage up to your plan limit. See our Pricing page for details.' },
    { q: 'How do I book a consultation?', a: 'After completing the AI intake, click "Book a Consultation" to schedule a session with a matched attorney at your preferred time.' },
    { q: 'Is my information confidential?', a: 'Absolutely. All communications are protected by attorney-client privilege and we comply with POPIA (Protection of Personal Information Act). Your data is never shared without your consent.' },
    { q: 'Can I cancel my subscription?', a: 'Yes, you can cancel anytime from your dashboard. Your coverage continues until the end of your billing period.' },
    { q: 'What areas of law do you cover?', a: 'We cover Labour Law, Family Law, Civil Law, Criminal Law, and Property Law across South Africa.' },
    { q: 'How do I reset my password?', a: 'Click "Forgot Password" on the login page. You\'ll receive an email with a secure reset link.' },
  ]

  return (
    <div className="min-h-screen bg-infinity-cream dark:bg-gray-900 py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <img src="/logo-icon-256.png" alt="Infinity Legal" className="h-16 mx-auto rounded-xl" />
          </Link>
          <h1 className="text-3xl font-display font-bold text-infinity-navy dark:text-white mb-2">Help Center</h1>
          <p className="text-infinity-navy/70 dark:text-white/50">Find answers to common questions</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <details key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 group">
              <summary className="px-6 py-4 cursor-pointer font-semibold text-infinity-navy dark:text-white text-sm flex items-center justify-between">
                {faq.q}
                <span className="text-infinity-gold transition-transform group-open:rotate-45">+</span>
              </summary>
              <div className="px-6 pb-4 text-sm text-infinity-navy/60 dark:text-white/60 leading-relaxed">
                {faq.a}
              </div>
            </details>
          ))}
        </div>

        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 p-6 text-center">
          <p className="text-sm text-infinity-navy/60 dark:text-white/60 mb-3">Can't find what you're looking for?</p>
          <div className="flex justify-center gap-4">
            <Link href="/contact" className="px-5 py-2.5 bg-infinity-navy text-white rounded-xl text-sm font-semibold hover:bg-infinity-navy-light transition-colors">Contact Us</Link>
            <a href="mailto:support@infinitylegal.org" className="px-5 py-2.5 border border-infinity-navy/10 dark:border-gray-600 text-infinity-navy dark:text-white rounded-xl text-sm font-semibold hover:bg-infinity-cream/50 dark:hover:bg-gray-700 transition-colors">Email Support</a>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-infinity-navy/50 dark:text-white/50 hover:text-infinity-navy dark:hover:text-white">← Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
