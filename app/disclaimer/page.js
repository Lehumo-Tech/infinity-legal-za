export default function DisclaimerPage() {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-6 mb-8">
          <h1 className="text-3xl font-bold mb-4 text-amber-900">⚖️ Legal Disclaimer</h1>
          <p className="text-amber-800 font-semibold">
            Important: This platform provides legal information only, not legal advice. 
            Only an attorney admitted to the Legal Practice Council can provide legal advice.
          </p>
        </div>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. No Attorney-Client Relationship</h2>
            <p>
              Use of this platform does <strong>not</strong> create an attorney-client relationship between you and Infinity Legal or any attorney 
              on our platform until:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>You have formally engaged an attorney</li>
              <li>A written retainer agreement has been signed</li>
              <li>The attorney has accepted your case</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. AI-Generated Content</h2>
            <p className="mb-4">
              Our AI intake assistant uses artificial intelligence (OpenAI GPT-4) to analyze your legal issues. 
              This analysis is:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Informational only:</strong> Not legal advice or a substitute for professional consultation</li>
              <li><strong>Not guaranteed accurate:</strong> AI may misinterpret facts or apply incorrect legal principles</li>
              <li><strong>Not tailored:</strong> General guidance that may not apply to your specific circumstances</li>
              <li><strong>Not up-to-date:</strong> May not reflect recent legal changes or case law</li>
            </ul>
            <p className="mt-4 bg-destructive/10 border border-destructive/30 rounded p-4">
              ⚠️ <strong>Critical:</strong> Do not rely solely on AI analysis for legal decisions. Always consult a qualified attorney.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Attorney Verification</h2>
            <p className="mb-4">
              While we verify that attorneys on our platform are registered with the Legal Practice Council (LPC), we:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Do not guarantee their competence, quality of service, or suitability for your case</li>
              <li>Are not responsible for attorney conduct, negligence, or malpractice</li>
              <li>Recommend you conduct your own due diligence before engaging any attorney</li>
            </ul>
            <p className="mt-4">
              Verify attorney credentials at: <a href="https://www.lpc.org.za" className="text-primary underline" target="_blank" rel="noopener">www.lpc.org.za</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. No Guarantees or Warranties</h2>
            <p className="mb-4">
              We provide this platform "as is" without warranties of any kind. We do not guarantee:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The accuracy, completeness, or reliability of information provided</li>
              <li>That the platform will be uninterrupted, secure, or error-free</li>
              <li>Any specific outcome or result from using our services</li>
              <li>That matched attorneys will accept your case or provide satisfactory service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Limitation of Liability</h2>
            <p className="mb-4">
              To the maximum extent permitted by South African law:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Infinity Legal is not liable for any direct, indirect, incidental, or consequential damages</li>
              <li>We are not responsible for attorney errors, omissions, or misconduct</li>
              <li>We are not liable for losses resulting from reliance on AI-generated content</li>
              <li>Our total liability shall not exceed the fees you paid for platform services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Third-Party Services</h2>
            <p>
              Our platform integrates third-party services (OpenAI, PayFast, Supabase). We are not responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Third-party service outages, errors, or data breaches</li>
              <li>Changes to third-party terms or pricing</li>
              <li>Third-party privacy practices (see our Privacy Policy)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Legal Practice Council Compliance</h2>
            <p className="mb-4">
              This platform complies with the Legal Practice Act, 2014 (Act No. 28 of 2014). We:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Do not provide legal advice (reserved for LPC-registered attorneys)</li>
              <li>Do not hold client funds (attorneys use LPC-compliant trust accounts)</li>
              <li>Clearly distinguish platform fees from legal fees</li>
              <li>Do not interfere with attorney-client relationships</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Confidentiality Limitations</h2>
            <p>
              While we implement security measures, note that:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Information shared before engaging an attorney is <strong>not</strong> protected by attorney-client privilege</li>
              <li>AI analysis involves processing by third-party services (OpenAI)</li>
              <li>No electronic communication is 100% secure</li>
            </ul>
            <p className="mt-4 bg-primary/10 border border-primary/30 rounded p-4">
              💡 <strong>Tip:</strong> Do not share highly sensitive information until you have formally engaged an attorney.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Jurisdiction</h2>
            <p>
              This platform is governed by the laws of South Africa. All disputes will be subject to the jurisdiction of South African courts. 
              Services are intended for users in South Africa only.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Time-Sensitive Matters</h2>
            <div className="bg-destructive/10 border-2 border-destructive/30 rounded-lg p-4">
              <p className="font-semibold text-destructive mb-2">⏰ URGENT CASES:</p>
              <p>
                If you have a time-sensitive legal matter (court date, arrest, eviction notice), do not rely solely on this platform. 
                Contact an attorney immediately by phone. Our AI cannot assess deadlines or urgency with complete accuracy.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Professional Indemnity</h2>
            <p>
              Attorneys on our platform are required to maintain professional indemnity insurance as mandated by the LPC. 
              Claims for attorney negligence should be directed to:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>The attorney's insurer (details provided by attorney)</li>
              <li>The Legal Practice Council: complaints@lpc.org.za</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Changes to Disclaimer</h2>
            <p>
              We may update this disclaimer at any time. Continued use of the platform after changes constitutes acceptance. 
              Review this page periodically.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Contact for Legal Concerns</h2>
            <div className="bg-card border border-border rounded-lg p-6">
              <p className="mb-2">If you have legal concerns about this platform:</p>
              <p className="mb-2"><strong>Email:</strong> legal@infinitylegal.org</p>
              <p className="mb-2"><strong>Legal Practice Council:</strong> <a href="https://www.lpc.org.za" className="text-primary underline">www.lpc.org.za</a></p>
            </div>
          </section>

          <div className="mt-12 p-6 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="font-semibold mb-2">By using this platform, you acknowledge that you have read, understood, and agree to this disclaimer.</p>
            <p className="text-sm text-muted-foreground">
              Last Updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <a href="/" className="text-primary hover:underline">← Back to Home</a>
        </div>
      </div>
    </div>
  )
}