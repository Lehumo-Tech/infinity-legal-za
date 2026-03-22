'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AttorneySignupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    lpcNumber: '',
    firmName: '',
    specializations: [],
    yearsExperience: '',
    bio: '',
    hourlyRate: '',
    trustAccountBank: '',
    trustAccountNumber: '',
    trustAccountHolder: '',
    acceptedTerms: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const specializationOptions = [
    'Criminal Law',
    'Family Law',
    'Labour Law',
    'Civil Litigation',
    'Commercial Law',
    'Property Law',
    'Debt Recovery',
    'Administrative Law'
  ]

  const handleSpecializationToggle = (spec) => {
    if (formData.specializations.includes(spec)) {
      setFormData({
        ...formData,
        specializations: formData.specializations.filter(s => s !== spec)
      })
    } else {
      setFormData({
        ...formData,
        specializations: [...formData.specializations, spec]
      })
    }
  }

  const handleNext = () => {
    if (step === 1) {
      if (!formData.fullName || !formData.email || !formData.lpcNumber) {
        setError('Please fill in all required fields')
        return
      }
      if (!/^\d{7}$/.test(formData.lpcNumber)) {
        setError('LPC number must be 7 digits')
        return
      }
    }
    if (step === 2) {
      if (formData.specializations.length === 0) {
        setError('Please select at least one specialization')
        return
      }
    }
    if (step === 3) {
      if (!formData.trustAccountBank || !formData.trustAccountNumber) {
        setError('Trust account details are required')
        return
      }
    }
    setError('')
    setStep(step + 1)
  }

  const handleSubmit = async () => {
    if (!formData.acceptedTerms) {
      setError('You must accept the terms and conditions')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/attorney/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/attorney/pending-verification')
      } else {
        setError(data.error || 'Signup failed. Please try again.')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-2">Join Our Attorney Network</h1>
          <p className="text-muted-foreground">Connect with clients who need your expertise</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Step {step} of 4</span>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div 
                key={s} 
                className={`flex-1 h-2 rounded-full transition-all ${
                  s <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive">
            {error}
          </div>
        )}

        {/* Step 1: Personal & Credentials */}
        {step === 1 && (
          <div className="bg-card rounded-lg border border-border p-8 shadow-lg">
            <h2 className="text-2xl font-semibold mb-6">Personal Information & Credentials</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Full Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., Advocate John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Email Address <span className="text-destructive">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="your.email@firm.co.za"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0821234567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  LPC Registration Number <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.lpcNumber}
                  onChange={(e) => setFormData({ ...formData, lpcNumber: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="1234567 (7 digits)"
                  maxLength={7}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  We will verify your registration with the Legal Practice Council
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Firm Name
                </label>
                <input
                  type="text"
                  value={formData.firmName}
                  onChange={(e) => setFormData({ ...formData, firmName: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Law Firm Name (or leave blank if sole practitioner)"
                />
              </div>
            </div>

            <button
              onClick={handleNext}
              className="w-full mt-6 px-6 py-3 bg-infinity-navy text-infinity-cream rounded-lg font-semibold hover:bg-infinity-navy/90"
            >
              Next: Practice Areas →
            </button>
          </div>
        )}

        {/* Step 2: Specializations */}
        {step === 2 && (
          <div className="bg-card rounded-lg border border-border p-8 shadow-lg">
            <h2 className="text-2xl font-semibold mb-6">Practice Areas & Experience</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3">
                  Specializations <span className="text-destructive">*</span> (Select all that apply)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {specializationOptions.map((spec) => (
                    <button
                      key={spec}
                      onClick={() => handleSpecializationToggle(spec)}
                      className={`px-4 py-3 border rounded-lg text-left transition-all ${
                        formData.specializations.includes(spec)
                          ? 'bg-infinity-navy text-infinity-cream border-infinity-navy'
                          : 'bg-white border-infinity-gold/20 hover:border-infinity-gold'
                      }`}
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Years of Experience
                </label>
                <input
                  type="number"
                  value={formData.yearsExperience}
                  onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., 10"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Hourly Rate (ZAR)
                </label>
                <input
                  type="number"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., 1500"
                  min="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This is displayed to potential clients
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Professional Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Brief description of your practice, notable cases, approach..."
                  rows={4}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/90"
              >
                ← Back
              </button>
              <button
                onClick={handleNext}
                className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90"
              >
                Next: Trust Account →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Trust Account */}
        {step === 3 && (
          <div className="bg-card rounded-lg border border-border p-8 shadow-lg">
            <h2 className="text-2xl font-semibold mb-2">Trust Account Details</h2>
            <p className="text-muted-foreground mb-6">
              Legal fees are paid directly to your LPC-compliant trust account.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Bank Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.trustAccountBank}
                  onChange={(e) => setFormData({ ...formData, trustAccountBank: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., Standard Bank"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Account Number <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.trustAccountNumber}
                  onChange={(e) => setFormData({ ...formData, trustAccountNumber: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Trust account number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Account Holder Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.trustAccountHolder}
                  onChange={(e) => setFormData({ ...formData, trustAccountHolder: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Name on trust account"
                />
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-4">
                <p className="text-sm">
                  🔒 <strong>Security Note:</strong> Your trust account details are encrypted and only shared with clients 
                  who engage your services. We never process payments through these accounts directly.
                </p>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/90"
              >
                ← Back
              </button>
              <button
                onClick={handleNext}
                className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90"
              >
                Next: Review & Submit →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review & Submit */}
        {step === 4 && (
          <div className="bg-card rounded-lg border border-border p-8 shadow-lg">
            <h2 className="text-2xl font-semibold mb-6">Review & Submit</h2>
            
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Personal Information</h3>
                  <div className="text-sm space-y-1 text-muted-foreground">
                    <p>{formData.fullName}</p>
                    <p>{formData.email}</p>
                    <p>{formData.phone}</p>
                    <p>LPC: {formData.lpcNumber}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Practice Details</h3>
                  <div className="text-sm space-y-1 text-muted-foreground">
                    <p>{formData.firmName || 'Sole Practitioner'}</p>
                    <p>{formData.yearsExperience} years experience</p>
                    <p>R{formData.hourlyRate}/hour</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Specializations</h3>
                <div className="flex flex-wrap gap-2">
                  {formData.specializations.map((spec) => (
                    <span key={spec} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.acceptedTerms}
                    onChange={(e) => setFormData({ ...formData, acceptedTerms: e.target.checked })}
                    className="mt-1 w-4 h-4 text-primary border-border rounded focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-sm">
                    I confirm that I am a registered attorney with the Legal Practice Council, maintain professional indemnity insurance, 
                    and agree to the <Link href="/terms" className="text-primary underline">Terms of Service</Link> and <Link href="/attorney/code-of-conduct" className="text-primary underline">Attorney Code of Conduct</Link>.
                  </span>
                </label>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm">
                  ⏳ <strong>What happens next:</strong>
                </p>
                <ol className="text-sm list-decimal pl-5 mt-2 space-y-1">
                  <li>We verify your LPC registration (typically 24-48 hours)</li>
                  <li>You'll receive an email when your profile is approved</li>
                  <li>Complete your profile and start accepting clients</li>
                </ol>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setStep(3)}
                className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/90"
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Application ✓'}
              </button>
            </div>
          </div>
        )}

        {/* Trust Indicators */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>🔒 Your information is encrypted and protected by POPIA</p>
          <p className="mt-2">Questions? Contact <a href="mailto:attorneys@infinitylegal.org" className="text-primary underline">attorneys@infinitylegal.org</a></p>
        </div>
      </div>
    </div>
  )
}