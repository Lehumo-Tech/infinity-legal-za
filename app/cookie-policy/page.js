export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Cookie Policy</h1>
        
        <div className="prose prose-slate max-w-none space-y-8">
          <p className="text-muted-foreground">
            Last Updated: {new Date().toLocaleDateString()}
          </p>

          <section>
            <h2 className="text-2xl font-semibold mb-4">1. What Are Cookies?</h2>
            <p>
              Cookies are small text files stored on your device when you visit a website. They help the website remember 
              your preferences and improve your experience.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Cookies We Use</h2>
            
            <h3 className="text-xl font-semibold mb-3">2.1 Essential Cookies (Required)</h3>
            <p className="mb-4">
              These cookies are necessary for the platform to function. You cannot opt out without affecting functionality.
            </p>
            <table className="w-full border border-border">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 text-left border-b">Cookie Name</th>
                  <th className="p-3 text-left border-b">Purpose</th>
                  <th className="p-3 text-left border-b">Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-3">session_token</td>
                  <td className="p-3">Maintains your logged-in session</td>
                  <td className="p-3">15 minutes (session)</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">csrf_token</td>
                  <td className="p-3">Prevents cross-site request forgery attacks</td>
                  <td className="p-3">Session</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">cookieConsent</td>
                  <td className="p-3">Remembers your cookie preferences</td>
                  <td className="p-3">1 year</td>
                </tr>
              </tbody>
            </table>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.2 Functional Cookies (Optional)</h3>
            <p className="mb-4">
              These cookies enhance functionality and personalization.
            </p>
            <table className="w-full border border-border">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 text-left border-b">Cookie Name</th>
                  <th className="p-3 text-left border-b">Purpose</th>
                  <th className="p-3 text-left border-b">Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-3">language_pref</td>
                  <td className="p-3">Remembers your language choice</td>
                  <td className="p-3">1 year</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">plain_language</td>
                  <td className="p-3">Remembers plain language vs legal terms toggle</td>
                  <td className="p-3">30 days</td>
                </tr>
              </tbody>
            </table>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.3 Analytics Cookies (Optional)</h3>
            <p className="mb-4">
              These cookies help us understand how visitors use the platform.
            </p>
            <table className="w-full border border-border">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 text-left border-b">Service</th>
                  <th className="p-3 text-left border-b">Purpose</th>
                  <th className="p-3 text-left border-b">Privacy Info</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-3">Sentry</td>
                  <td className="p-3">Error tracking and performance monitoring</td>
                  <td className="p-3"><a href="https://sentry.io/privacy/" className="text-primary underline">Sentry Privacy</a></td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Third-Party Cookies</h2>
            <p className="mb-4">
              Some cookies are set by third-party services we use:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Supabase:</strong> Authentication and database services</li>
              <li><strong>PayFast:</strong> Payment processing (only on payment pages)</li>
              <li><strong>Sentry:</strong> Error tracking</li>
            </ul>
            <p className="mt-4">
              These services have their own privacy policies and cookie policies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. How to Control Cookies</h2>
            
            <h3 className="text-xl font-semibold mb-3">4.1 Browser Settings</h3>
            <p className="mb-4">
              You can control cookies through your browser settings:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
              <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
              <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
              <li><strong>Edge:</strong> Settings → Cookies and site permissions</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">4.2 Cookie Consent Banner</h3>
            <p>
              When you first visit our site, you'll see a cookie consent banner. You can accept or adjust settings there. 
              To change your preferences later, clear your cookies and revisit the site.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">4.3 Do Not Track</h3>
            <p>
              We respect Do Not Track (DNT) browser signals. When DNT is enabled, we will not set analytics cookies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Impact of Disabling Cookies</h2>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="font-semibold mb-2">⚠️ Important:</p>
              <p>
                If you disable essential cookies, some features will not work properly:
              </p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>You will not be able to log in or maintain a session</li>
                <li>Security features may be compromised</li>
                <li>Your preferences will not be saved</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Local Storage and Session Storage</h2>
            <p className="mb-4">
              In addition to cookies, we use browser local storage and session storage for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Temporary storage of form data (to prevent loss on refresh)</li>
              <li>Caching of non-sensitive data for performance</li>
              <li>User interface preferences</li>
            </ul>
            <p className="mt-4">
              This data is stored only on your device and is not transmitted to our servers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. POPIA Compliance</h2>
            <p>
              Our use of cookies complies with the Protection of Personal Information Act (POPIA). We:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Obtain consent before setting non-essential cookies</li>
              <li>Provide clear information about cookie purposes</li>
              <li>Allow you to withdraw consent at any time</li>
              <li>Minimize data collection to what is necessary</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Updates to This Policy</h2>
            <p>
              We may update this Cookie Policy periodically. Changes will be posted on this page with an updated date. 
              Please review this policy regularly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Contact Us</h2>
            <div className="bg-card border border-border rounded-lg p-6">
              <p className="mb-2">Questions about our cookie practices?</p>
              <p className="mb-2"><strong>Email:</strong> privacy@infinitylegal.org</p>
              <p><strong>Information Officer:</strong> See <a href="/privacy" className="text-primary underline">Privacy Policy</a></p>
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