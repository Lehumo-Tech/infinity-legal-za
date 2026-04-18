'use client'

import Link from 'next/link'

export default function PrivacyPage() {
  const lastUpdated = 'April 2026'

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      <nav className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo-icon-128.png" alt="Infinity Legal" className="h-9 rounded-lg" />
            <span className="text-lg font-bold text-[#0f2b46]" style={{ fontFamily: "'Playfair Display', serif" }}>Infinity Legal</span>
          </Link>
          <Link href="/" className="text-sm text-[#0f2b46] font-semibold hover:text-[#c9a961]">← Back to Home</Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-[#0f2b46]/5 text-[#0f2b46] text-xs font-bold px-3 py-1.5 rounded-full mb-4">
            🔒 POPIA Compliant
          </div>
          <h1 className="text-4xl font-bold text-[#0f2b46] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Privacy Policy</h1>
          <p className="text-gray-500">Last Updated: {lastUpdated} | Effective Date: {lastUpdated}</p>
        </div>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-8">

          {/* Section 1 */}
          <section>
            <h2 className="text-xl font-bold text-[#0f2b46] border-b border-gray-200 pb-2" style={{ fontFamily: "'Playfair Display', serif" }}>1. Who We Are</h2>
            <p>Infinity Legal (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is a South African legal technology platform providing accessible legal information and advisor matching services.</p>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-1 text-sm">
              <p><strong>Physical Address:</strong> Sandton, Johannesburg, South Africa</p>
              <p><strong>Contact:</strong> <a href="mailto:info@infinitylegal.co.za" className="text-[#c9a961] hover:underline">info@infinitylegal.co.za</a> | +27 68 201 1186</p>
              <p><strong>Data Protection Officer:</strong> <a href="mailto:legal@infinitylegal.org" className="text-[#c9a961] hover:underline">legal@infinitylegal.org</a></p>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-xl font-bold text-[#0f2b46] border-b border-gray-200 pb-2" style={{ fontFamily: "'Playfair Display', serif" }}>2. Information We Collect</h2>
            
            <h3 className="text-base font-bold text-[#0f2b46] mt-4">2.1 Information You Provide</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account Data:</strong> Phone number (+27 format), email address, full name</li>
              <li><strong>Legal Matter Data:</strong> Description of your legal issue, jurisdiction, documents uploaded</li>
              <li><strong>Consent Records:</strong> Your explicit consent for data processing (POPIA Section 11)</li>
            </ul>

            <h3 className="text-base font-bold text-[#0f2b46] mt-4">2.2 Information Collected Automatically</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent (via anonymised analytics)</li>
              <li><strong>Device Data:</strong> IP address (truncated for anonymity), browser type, OS</li>
              <li><strong>Location Data:</strong> Province-level location only (for jurisdiction matching)</li>
            </ul>

            <h3 className="text-base font-bold text-[#0f2b46] mt-4">2.3 Information from Third Parties</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Legal Advisors:</strong> Only if you consent to matter escalation</li>
              <li><strong>Payment Processors:</strong> Transaction IDs only (we never store card details)</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-xl font-bold text-[#0f2b46] border-b border-gray-200 pb-2" style={{ fontFamily: "'Playfair Display', serif" }}>3. How We Use Your Information</h2>
            <p>We process your personal information ONLY for these lawful purposes (POPIA Section 11):</p>
            
            <div className="overflow-x-auto my-4">
              <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-[#0f2b46] text-white">
                    <th className="py-2.5 px-4 text-left font-semibold">Purpose</th>
                    <th className="py-2.5 px-4 text-left font-semibold">Legal Basis</th>
                    <th className="py-2.5 px-4 text-left font-semibold">Data Used</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Provide legal information services', 'Performance of contract', 'Phone, query content, documents'],
                    ['Match you with LPC-registered legal advisors', 'Consent + legitimate interest', 'Matter category, province, urgency'],
                    ['Send service updates & security alerts', 'Legitimate interest', 'Phone, email'],
                    ['Comply with legal obligations (FICA, LPC)', 'Legal obligation', 'ID number (if provided), matter details'],
                    ['Improve AI accuracy (anonymised)', 'Consent (opt-in)', 'Anonymised queries, feedback'],
                  ].map(([purpose, basis, data], i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="py-2 px-4 border-b border-gray-100">{purpose}</td>
                      <td className="py-2 px-4 border-b border-gray-100">{basis}</td>
                      <td className="py-2 px-4 border-b border-gray-100">{data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4">
              <h4 className="font-bold text-red-800 text-sm mb-2">We NEVER:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>❌ Sell your personal information</li>
                <li>❌ Use your legal matters for advertising</li>
                <li>❌ Process sensitive data (health, religion, etc.) without explicit consent</li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-xl font-bold text-[#0f2b46] border-b border-gray-200 pb-2" style={{ fontFamily: "'Playfair Display', serif" }}>4. Data Sharing & Disclosure</h2>
            <p>We share your information ONLY in these limited circumstances:</p>

            <h3 className="text-base font-bold text-[#0f2b46] mt-4">4.1 With Your Consent</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>When you request escalation to a Legal Practice Council (LPC) registered legal advisor</li>
              <li>When you explicitly opt-in to receive marketing communications</li>
            </ul>

            <h3 className="text-base font-bold text-[#0f2b46] mt-4">4.2 Service Providers (POPIA Section 21 Operators)</h3>
            <p>We engage trusted processors under strict data processing agreements:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Cloud Hosting:</strong> Data stored and processed in secure infrastructure</li>
              <li><strong>Communications:</strong> For service notifications only</li>
              <li><strong>Analytics:</strong> Privacy-first, anonymised analytics</li>
            </ul>

            <h3 className="text-base font-bold text-[#0f2b46] mt-4">4.3 Legal Requirements</h3>
            <p>We may disclose information if required by:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Court order or subpoena from a South African court</li>
              <li>Request from the Information Regulator (POPIA enforcement)</li>
              <li>Legal Practice Council investigation (with your notification where permitted)</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-xl font-bold text-[#0f2b46] border-b border-gray-200 pb-2" style={{ fontFamily: "'Playfair Display', serif" }}>5. Data Security</h2>
            
            <h3 className="text-base font-bold text-[#0f2b46] mt-4">5.1 Technical Measures</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Encryption:</strong> AES-256-GCM for data at rest; TLS 1.3 for data in transit</li>
              <li><strong>Access Control:</strong> Role-based access + mandatory 2FA for staff</li>
              <li><strong>Audit Logs:</strong> All data access logged with POPIA-compliant retention (24 months)</li>
            </ul>

            <h3 className="text-base font-bold text-[#0f2b46] mt-4">5.2 Organisational Measures</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Staff trained on POPIA compliance quarterly</li>
              <li>Data Protection Officer (DPO) appointed</li>
              <li>Regular security audits</li>
            </ul>
          </section>

          {/* Section 6 - Rights Table */}
          <section>
            <h2 className="text-xl font-bold text-[#0f2b46] border-b border-gray-200 pb-2" style={{ fontFamily: "'Playfair Display', serif" }}>6. Your POPIA Rights</h2>
            <p>As a data subject in South Africa, you have the following rights:</p>

            <div className="overflow-x-auto my-4">
              <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-[#0f2b46] text-white">
                    <th className="py-2.5 px-4 text-left font-semibold">Right</th>
                    <th className="py-2.5 px-4 text-left font-semibold">How to Exercise</th>
                    <th className="py-2.5 px-4 text-left font-semibold">Response Time</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Access your data', 'Email legal@infinitylegal.org with ID verification', '30 days'],
                    ['Correct inaccurate data', 'Update via profile or email request', '14 days'],
                    ['Delete your data ("right to be forgotten")', 'Use in-app "Export My Data" or email request', '30 days'],
                    ['Object to processing', 'Email DPO with specific objection', '30 days'],
                    ['Data portability', 'Request machine-readable export via Settings → Privacy', '30 days'],
                    ['Withdraw consent', 'Toggle in settings or email request', 'Immediate'],
                  ].map(([right, how, time], i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="py-2 px-4 border-b border-gray-100 font-medium text-[#0f2b46]">{right}</td>
                      <td className="py-2 px-4 border-b border-gray-100">{how}</td>
                      <td className="py-2 px-4 border-b border-gray-100 font-semibold">{time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-800"><strong>Note:</strong> Deletion requests may be delayed if required for ongoing legal representation (with your consent), compliance with FICA record-keeping (5 years), or legitimate defence of legal claims.</p>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-xl font-bold text-[#0f2b46] border-b border-gray-200 pb-2" style={{ fontFamily: "'Playfair Display', serif" }}>7. International Data Transfers</h2>
            <p>All personal data is stored and processed in secure infrastructure. We do not transfer personal information outside South Africa unless:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Required for legal proceedings with your explicit consent, AND</li>
              <li>The recipient country has adequate data protection laws (as determined by the Information Regulator)</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-xl font-bold text-[#0f2b46] border-b border-gray-200 pb-2" style={{ fontFamily: "'Playfair Display', serif" }}>8. Children&apos;s Privacy</h2>
            <p>Our services are not directed to individuals under 18. We do not knowingly collect data from minors. If we learn we have collected such data, we will delete it immediately.</p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-xl font-bold text-[#0f2b46] border-b border-gray-200 pb-2" style={{ fontFamily: "'Playfair Display', serif" }}>9. AI-Generated Legal Information</h2>
            <p>Our platform uses artificial intelligence to provide preliminary legal information. Important notes about AI usage:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>AI responses are <strong>informational only</strong> — not legal advice or representation</li>
              <li>Every AI interaction includes a mandatory disclaimer</li>
              <li>High-risk matters (criminal, constitutional, high court) are automatically flagged for human legal advisor review</li>
              <li>AI queries and responses are logged for quality assurance and compliance (anonymised after 24 months)</li>
              <li>You can opt out of AI-assisted services at any time</li>
            </ul>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-3">
              <p className="text-sm text-blue-800"><strong>LPC Alignment:</strong> We maintain a clear separation — AI provides <em>information</em>, registered legal advisors provide <em>representation</em>. All complex matters are escalated to LPC-registered practitioners.</p>
            </div>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-xl font-bold text-[#0f2b46] border-b border-gray-200 pb-2" style={{ fontFamily: "'Playfair Display', serif" }}>10. Policy Updates</h2>
            <p>We may update this policy to reflect changes in POPIA regulations, new service features, or security improvements.</p>
            <p><strong>Material changes</strong> will be communicated via:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>✅ In-app notification 30 days before effective date</li>
              <li>✅ Email to registered users</li>
              <li>✅ Updated &quot;Last Updated&quot; date at top of policy</li>
            </ul>
            <p>Continued use after changes constitutes acceptance.</p>
          </section>

          {/* Section 11 - Contact */}
          <section>
            <h2 className="text-xl font-bold text-[#0f2b46] border-b border-gray-200 pb-2" style={{ fontFamily: "'Playfair Display', serif" }}>11. Contact Us</h2>
            <div className="bg-[#0f2b46] text-white rounded-xl p-6 space-y-3">
              <h3 className="text-[#c9a961] font-bold text-base">For privacy inquiries or to exercise your rights:</h3>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-white/60 text-xs mb-0.5">Email</p>
                  <a href="mailto:info@infinitylegal.co.za" className="text-[#c9a961] hover:underline">info@infinitylegal.co.za</a>
                </div>
                <div>
                  <p className="text-white/60 text-xs mb-0.5">Phone</p>
                  <a href="tel:+27682011186" className="text-[#c9a961] hover:underline">+27 68 201 1186</a>
                  <span className="text-white/40 text-xs ml-1">(Mon-Fri, 9AM-5PM SAST)</span>
                </div>
                <div>
                  <p className="text-white/60 text-xs mb-0.5">Data Protection Officer</p>
                  <a href="mailto:legal@infinitylegal.org" className="text-[#c9a961] hover:underline">legal@infinitylegal.org</a>
                </div>
                <div>
                  <p className="text-white/60 text-xs mb-0.5">WhatsApp</p>
                  <a href="https://wa.me/27682011186" className="text-[#c9a961] hover:underline" target="_blank" rel="noopener noreferrer">+27 68 201 1186</a>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-5 mt-4 border border-gray-200">
              <h4 className="font-bold text-[#0f2b46] mb-2">Information Regulator (South Africa)</h4>
              <p className="text-sm text-gray-600 mb-2">If you believe we&apos;ve violated POPIA, you may lodge a complaint with:</p>
              <div className="space-y-1 text-sm">
                <p>🌐 <a href="https://www.inforegulator.org.za" className="text-[#c9a961] hover:underline" target="_blank" rel="noopener noreferrer">www.inforegulator.org.za</a></p>
                <p>📧 <a href="mailto:complaints.IR@inforegulator.org.za" className="text-[#c9a961] hover:underline">complaints.IR@inforegulator.org.za</a></p>
              </div>
            </div>
          </section>

          {/* Compliance Footer */}
          <section className="border-t border-gray-200 pt-6">
            <p className="text-xs text-gray-500 italic">
              This policy is aligned with: ✅ Protection of Personal Information Act 4 of 2013 (POPIA) | ✅ Legal Practice Council Guidelines | ✅ Consumer Protection Act 68 of 2008 (CPA) | ✅ Electronic Communications and Transactions Act 25 of 2002 (ECTA)
            </p>
            <p className="text-xs text-gray-400 mt-2">© {new Date().getFullYear()} Infinity Legal (Pty) Ltd. All rights reserved.</p>
          </section>
        </div>
      </main>
    </div>
  )
}
