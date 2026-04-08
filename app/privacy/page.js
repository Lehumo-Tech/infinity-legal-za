'use client'

import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-[#0f2b46] border-b border-[#c9a961]/20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#c9a961] rounded-lg flex items-center justify-center">
              <span className="text-[#0f2b46] text-lg font-bold">∞</span>
            </div>
            <span className="text-white font-bold text-lg">Infinity Legal</span>
          </Link>
          <Link href="/" className="text-white/60 hover:text-white text-sm transition-colors">← Back to Home</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-[#0f2b46] mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
            Privacy Policy
          </h1>
          <p className="text-gray-500">Protection of Personal Information Act (POPIA) Compliance</p>
          <p className="text-sm text-gray-400 mt-1">Last Updated: April 2026 | Effective: April 2026</p>
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <p className="text-sm text-amber-800 font-medium">
              ⚠️ Infinity Legal (Pty) Ltd — CIPC Registration Pending. This policy will be updated upon final registration.
            </p>
          </div>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold text-[#0f2b46] border-b border-gray-200 pb-2 mb-3">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              Infinity Legal (Pty) Ltd (&quot;Infinity Legal&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting your personal information in accordance with the Protection of Personal Information Act, 4 of 2013 (&quot;POPIA&quot;) and the Electronic Communications and Transactions Act, 25 of 2002 (&quot;ECTA&quot;).
            </p>
            <p className="text-gray-700 leading-relaxed mt-2">
              This Privacy Policy describes how we collect, use, store, and share your personal information when you use our legal services platform, AI-powered tools, and related services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0f2b46] border-b border-gray-200 pb-2 mb-3">2. Responsible Party</h2>
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 space-y-1">
              <p><strong>Name:</strong> Infinity Legal (Pty) Ltd (CIPC Registration Pending)</p>
              <p><strong>Information Officer:</strong> Tidimalo Tsatsi</p>
              <p><strong>Email:</strong> <a href="mailto:legal@infinitylegal.org" className="text-[#c9a961] hover:underline">legal@infinitylegal.org</a></p>
              <p><strong>Alternative Contact:</strong> <a href="mailto:jaytmokwena@gmail.com" className="text-[#c9a961] hover:underline">jaytmokwena@gmail.com</a></p>
              <p><strong>Phone:</strong> +27 68 201 1186</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0f2b46] border-b border-gray-200 pb-2 mb-3">3. Information We Collect</h2>
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-[#0f2b46] mb-1">3.1 Information You Provide</h3>
                <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                  <li>Full name, email address, phone number, ID number</li>
                  <li>Physical and postal address</li>
                  <li>Legal matter details (descriptions, documents, case information)</li>
                  <li>Subscription and plan preferences</li>
                  <li>Communications with our team or AI assistant</li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-[#0f2b46] mb-1">3.2 Information Collected Automatically</h3>
                <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                  <li>IP address, browser type, device information</li>
                  <li>Usage data (pages visited, features used, time spent)</li>
                  <li>Cookies and session identifiers</li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-[#0f2b46] mb-1">3.3 Special Personal Information</h3>
                <p className="text-sm text-gray-600">
                  In the course of providing legal services, we may process special personal information including criminal records, health information, or trade union membership where relevant to your legal matter. This is processed only with your explicit consent or where required by law.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0f2b46] border-b border-gray-200 pb-2 mb-3">4. Purpose of Processing</h2>
            <ul className="list-disc pl-5 text-gray-700 space-y-1">
              <li>To provide legal advisory services and manage your legal matters</li>
              <li>To operate our AI-powered legal analysis and intake system</li>
              <li>To communicate with you regarding your account and services</li>
              <li>To comply with legal and regulatory obligations</li>
              <li>To improve our platform and services</li>
              <li>To prevent fraud and ensure platform security</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0f2b46] border-b border-gray-200 pb-2 mb-3">5. Legal Basis (POPIA Section 11)</h2>
            <ul className="list-disc pl-5 text-gray-700 space-y-1">
              <li><strong>Consent:</strong> Your express consent (s11(1)(a))</li>
              <li><strong>Contract:</strong> Necessary for performing our services (s11(1)(b))</li>
              <li><strong>Legal Obligation:</strong> Required by law (s11(1)(c))</li>
              <li><strong>Legitimate Interest:</strong> Our legitimate business interests (s11(1)(f))</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0f2b46] border-b border-gray-200 pb-2 mb-3">6. Your Rights Under POPIA</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                { right: 'Right of Access (s23)', desc: 'Request confirmation of what personal information we hold about you' },
                { right: 'Right to Correction (s24)', desc: 'Request correction or deletion of inaccurate personal information' },
                { right: 'Right to Deletion (s24)', desc: 'Request deletion where retention is no longer necessary' },
                { right: 'Right to Object (s11(3))', desc: 'Object to processing for direct marketing' },
                { right: 'Right to Data Portability', desc: 'Request your information in a structured, machine-readable format' },
                { right: 'Right to Withdraw Consent', desc: 'Withdraw consent at any time where processing is consent-based' },
              ].map((item, i) => (
                <div key={i} className="bg-[#0f2b46]/5 rounded-lg p-3">
                  <h4 className="font-semibold text-[#0f2b46] text-sm">{item.right}</h4>
                  <p className="text-xs text-gray-600 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-gray-700 mt-3 text-sm">
              To exercise any of these rights, contact <a href="mailto:legal@infinitylegal.org" className="text-[#c9a961] hover:underline">legal@infinitylegal.org</a>. We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0f2b46] border-b border-gray-200 pb-2 mb-3">7. Data Security</h2>
            <ul className="list-disc pl-5 text-gray-700 space-y-1">
              <li>Encryption of data in transit (TLS/SSL) and at rest</li>
              <li>Secure authentication with multi-factor options</li>
              <li>Role-based access controls for staff</li>
              <li>Regular security assessments and monitoring</li>
              <li>Secure hosting infrastructure with industry-standard protections</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0f2b46] border-b border-gray-200 pb-2 mb-3">8. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your personal information only for as long as necessary. Legal matter records are retained for a minimum of 5 years after conclusion, in accordance with the Legal Practice Act and prescription periods.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0f2b46] border-b border-gray-200 pb-2 mb-3">9. Third-Party Sharing</h2>
            <ul className="list-disc pl-5 text-gray-700 space-y-1">
              <li>Legal advisors and specialists assigned to your matter</li>
              <li>Courts, tribunals, or regulatory bodies where required</li>
              <li>Service providers assisting platform operations (bound by data processing agreements)</li>
              <li>Law enforcement where required by law</li>
            </ul>
            <p className="text-gray-700 mt-2 font-semibold text-sm">We do not sell your personal information to third parties.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0f2b46] border-b border-gray-200 pb-2 mb-3">10. AI-Powered Processing</h2>
            <ul className="list-disc pl-5 text-gray-700 space-y-1">
              <li>Your queries are processed by AI models to provide legal information</li>
              <li>AI responses are for informational purposes only — not legal advice</li>
              <li>AI processing is subject to the same data protection measures</li>
              <li>You may request human review of any AI-generated analysis</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0f2b46] border-b border-gray-200 pb-2 mb-3">11. Complaints</h2>
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 space-y-1">
              <p><strong>Information Regulator (South Africa)</strong></p>
              <p>JD House, 27 Stiemens Street, Braamfontein, Johannesburg, 2001</p>
              <p>Email: <a href="mailto:enquiries@inforegulator.org.za" className="text-[#c9a961]">enquiries@inforegulator.org.za</a></p>
              <p>Tel: 012 406 4818</p>
            </div>
          </section>

          <section className="bg-[#0f2b46] text-white rounded-xl p-6">
            <h2 className="text-xl font-bold mb-3">Contact Us</h2>
            <p className="text-white/70 mb-4">For any privacy-related queries or to exercise your rights:</p>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[#c9a961] font-semibold mb-1">Email</p>
                <a href="mailto:legal@infinitylegal.org" className="text-white hover:text-[#c9a961]">legal@infinitylegal.org</a>
                <br />
                <a href="mailto:jaytmokwena@gmail.com" className="text-white hover:text-[#c9a961]">jaytmokwena@gmail.com</a>
              </div>
              <div>
                <p className="text-[#c9a961] font-semibold mb-1">Phone / WhatsApp</p>
                <a href="https://wa.me/27682011186" className="text-white hover:text-[#c9a961]">+27 68 201 1186</a>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="bg-gray-50 border-t border-gray-200 py-6 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Infinity Legal (Pty) Ltd — CIPC Registration Pending. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
