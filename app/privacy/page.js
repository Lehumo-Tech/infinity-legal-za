export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose prose-slate max-w-none">
          <p className="text-muted-foreground mb-6">
            Last Updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. POPIA Compliance</h2>
            <p className="mb-4">
              Infinity Legal ("we", "our", "us") complies with the Protection of Personal Information Act (POPIA), 2013 (Act No. 4 of 2013). 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Personal Information:</strong> Name, email, phone number, ID number (when required)</li>
              <li><strong>Legal Information:</strong> Case details, documents, communications with attorneys</li>
              <li><strong>Usage Data:</strong> IP address, browser type, pages visited, time spent</li>
              <li><strong>Payment Information:</strong> Processed securely through PayFast (we do not store card details)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide legal intake and matching services</li>
              <li>To facilitate communication between clients and attorneys</li>
              <li>To process payments for platform fees</li>
              <li>To improve our AI models and platform functionality</li>
              <li>To comply with legal obligations</li>
              <li>To prevent fraud and ensure platform security</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Legal Basis for Processing (POPIA Section 11)</h2>
            <p className="mb-2">We process your personal information based on:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Consent:</strong> You provide explicit consent for AI processing and data sharing</li>
              <li><strong>Contract Performance:</strong> Processing is necessary to provide our services</li>
              <li><strong>Legal Obligations:</strong> We must comply with SA legal and regulatory requirements</li>
              <li><strong>Legitimate Interests:</strong> Fraud prevention, security, platform improvement</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Cross-Border Data Transfers (POPIA Section 72)</h2>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="font-semibold mb-2">⚠️ Important Notice:</p>
              <p>
                Our AI services use OpenAI (USA) for legal intake analysis. By using our platform, you consent to the 
                transfer of your redacted case information to the United States. We ensure:
              </p>
            </div>
            <ul className="list-disc pl-6 space-y-2">
              <li>All personally identifiable information is redacted before transfer</li>
              <li>OpenAI is GDPR-compliant (adequate protection level)</li>
              <li>Data Processing Agreements are in place</li>
              <li>You can withdraw consent at any time</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Your Rights Under POPIA</h2>
            <p className="mb-2">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal information</li>
              <li><strong>Correction:</strong> Update inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your data (subject to legal retention requirements)</li>
              <li><strong>Objection:</strong> Object to processing for direct marketing</li>
              <li><strong>Data Portability:</strong> Receive your data in a machine-readable format</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent at any time (may affect service availability)</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, contact: <a href="mailto:privacy@infinitylegal.org" className="text-primary underline">privacy@infinitylegal.org</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Data Security</h2>
            <p className="mb-4">
              We implement industry-standard security measures:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>End-to-end encryption for sensitive communications</li>
              <li>Row-level security in database (users only see their own data)</li>
              <li>Regular security audits and penetration testing</li>
              <li>Access controls and authentication requirements</li>
              <li>Incident response and breach notification procedures</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Data Retention</h2>
            <p className="mb-4">
              We retain your data for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Active Cases:</strong> Duration of case + 5 years</li>
              <li><strong>Closed Cases:</strong> 5 years from closure (then archived)</li>
              <li><strong>Financial Records:</strong> 7 years (SARS requirement)</li>
              <li><strong>Marketing Consent:</strong> Until withdrawn</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Cookies and Tracking</h2>
            <p className="mb-4">
              We use cookies for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Essential:</strong> Authentication, security, session management</li>
              <li><strong>Analytics:</strong> Usage statistics, performance monitoring</li>
              <li><strong>Preferences:</strong> Language, display settings</li>
            </ul>
            <p className="mt-4">
              You can control cookies through your browser settings. See our <a href="/cookie-policy" className="text-primary underline">Cookie Policy</a> for details.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Third-Party Services</h2>
            <p className="mb-4">We share data with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Supabase (USA/EU):</strong> Database hosting</li>
              <li><strong>OpenAI (USA):</strong> AI legal analysis (redacted data only)</li>
              <li><strong>PayFast (South Africa):</strong> Payment processing</li>
              <li><strong>Sentry (USA):</strong> Error tracking</li>
            </ul>
            <p className="mt-4">
              All third parties are contractually bound to protect your data and comply with POPIA requirements.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Children's Privacy</h2>
            <p>
              Our platform is not intended for individuals under 18. We do not knowingly collect information from minors. 
              If you believe we have collected data from a minor, contact us immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. We will notify you of significant changes via email or platform notice. 
              Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Information Officer Contact</h2>
            <div className="bg-card border border-border rounded-lg p-6">
              <p className="mb-2"><strong>Information Officer:</strong> [Name]</p>
              <p className="mb-2"><strong>Email:</strong> privacy@infinitylegal.org</p>
              <p className="mb-2"><strong>Phone:</strong> [Phone Number]</p>
              <p className="mb-2"><strong>Address:</strong> [Physical Address]</p>
              <p className="mt-4 text-sm text-muted-foreground">
                If you are unsatisfied with our response, you may lodge a complaint with the Information Regulator: 
                <a href="https://inforegulator.org.za" className="text-primary underline">inforegulator.org.za</a>
              </p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <a href="/" className="text-primary hover:underline">← Back to Home</a>
        </div>
      </div>
    </div>
  )
}