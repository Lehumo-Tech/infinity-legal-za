export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        
        <div className="prose prose-slate max-w-none space-y-8">
          <p className="text-muted-foreground">
            Last Updated: {new Date().toLocaleDateString()}
          </p>

          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the Infinity Legal platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). 
              If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="mb-4">
              Infinity Legal provides:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>AI-powered legal intake and preliminary analysis</li>
              <li>Matching services between clients and LPC-registered attorneys</li>
              <li>Communication platform for legal consultations</li>
              <li>Payment processing for platform fees</li>
            </ul>
            <p className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <strong>Important:</strong> We are a technology platform, not a law firm. We do not provide legal advice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <h3 className="text-xl font-semibold mb-2">3.1 Registration</h3>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>You must provide accurate and complete information</li>
              <li>You are responsible for maintaining account security</li>
              <li>You must be 18 years or older to create an account</li>
              <li>One person may not maintain multiple accounts</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2">3.2 Account Termination</h3>
            <p>
              We may suspend or terminate accounts for violations of these Terms, fraudulent activity, or at our discretion.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Attorney Services</h2>
            <h3 className="text-xl font-semibold mb-2">4.1 Attorney Independence</h3>
            <p className="mb-4">
              Attorneys on our platform are independent professionals. They:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Are not employees or agents of Infinity Legal</li>
              <li>Set their own fees and terms of engagement</li>
              <li>Are solely responsible for the legal services they provide</li>
              <li>Must comply with LPC rules and ethical obligations</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2">4.2 Attorney Verification</h3>
            <p>
              We verify LPC registration but do not guarantee attorney competence, availability, or suitability. 
              Clients should conduct their own due diligence.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Fees and Payment</h2>
            <h3 className="text-xl font-semibold mb-2">5.1 Platform Fees</h3>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>AI intake analysis: Free for first use, then R50 per case</li>
              <li>Attorney matching: Free</li>
              <li>Document storage: Included (up to 100MB per case)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2">5.2 Legal Fees</h3>
            <p className="mb-4">
              Legal fees are set by attorneys and paid directly to their trust accounts. 
              Infinity Legal does not receive any portion of legal fees.
            </p>

            <h3 className="text-xl font-semibold mb-2">5.3 Refunds</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Platform fees are non-refundable once services are rendered</li>
              <li>Legal fee refunds are governed by attorney-client agreements</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Prohibited Uses</h2>
            <p className="mb-4">You may not:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide false or misleading information</li>
              <li>Impersonate another person or entity</li>
              <li>Use the Service for illegal purposes</li>
              <li>Harass, abuse, or threaten other users or attorneys</li>
              <li>Attempt to gain unauthorized access to the platform</li>
              <li>Scrape or harvest data from the Service</li>
              <li>Interfere with platform operations or security</li>
              <li>Use the Service to solicit attorneys outside the platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Intellectual Property</h2>
            <h3 className="text-xl font-semibold mb-2">7.1 Platform Content</h3>
            <p>
              All content, trademarks, and software on the platform are owned by Infinity Legal or our licensors. 
              You may not copy, modify, or distribute platform content without permission.
            </p>

            <h3 className="text-xl font-semibold mb-2">7.2 User Content</h3>
            <p>
              You retain ownership of content you submit (case details, documents). By submitting content, you grant us 
              a license to use it for providing services, including AI training (with PII redacted).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Privacy and Data Protection</h2>
            <p>
              Your use of the Service is governed by our <a href="/privacy" className="text-primary underline">Privacy Policy</a>, 
              which complies with POPIA. By using the Service, you consent to data processing as described.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Disclaimers and Limitations</h2>
            <p className="mb-4">
              See our <a href="/disclaimer" className="text-primary underline">Legal Disclaimer</a> for full details. Key points:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Service provided "as is" without warranties</li>
              <li>AI content is informational only, not legal advice</li>
              <li>We are not liable for attorney conduct or outcomes</li>
              <li>Liability limited to fees paid for platform services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Indemnification</h2>
            <p>
              You agree to indemnify Infinity Legal from claims arising from:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Your violation of these Terms</li>
              <li>Your use of the Service</li>
              <li>Your violation of any law or third-party rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Dispute Resolution</h2>
            <h3 className="text-xl font-semibold mb-2">11.1 Governing Law</h3>
            <p>
              These Terms are governed by the laws of South Africa.
            </p>

            <h3 className="text-xl font-semibold mb-2">11.2 Jurisdiction</h3>
            <p>
              Disputes will be subject to the exclusive jurisdiction of South African courts.
            </p>

            <h3 className="text-xl font-semibold mb-2">11.3 Arbitration (Optional)</h3>
            <p>
              Parties may agree to resolve disputes through arbitration under AFSA rules.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Modifications to Terms</h2>
            <p>
              We may modify these Terms at any time. We will notify users of material changes via email or platform notice. 
              Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Severability</h2>
            <p>
              If any provision of these Terms is found unenforceable, the remaining provisions will remain in effect.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">14. Contact Information</h2>
            <div className="bg-card border border-border rounded-lg p-6">
              <p className="mb-2"><strong>Infinity Legal</strong></p>
              <p className="mb-2">Email: legal@infinitylegal.org</p>
              <p className="mb-2">Support: support@infinitylegal.org</p>
              <p>Website: infinitylegal.org</p>
            </div>
          </section>

          <div className="mt-12 p-6 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="font-semibold">By clicking "I Accept" or using the Service, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.</p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <a href="/" className="text-primary hover:underline">← Back to Home</a>
        </div>
      </div>
    </div>
  )
}