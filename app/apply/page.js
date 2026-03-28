'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const STEPS = [
  { id: 1, title: 'Personal Details', icon: '👤' },
  { id: 2, title: 'Service Plan', icon: '📋' },
  { id: 3, title: 'Dependants', icon: '👨‍👩‍👧‍👦' },
  { id: 4, title: 'Legal Matter', icon: '⚖️' },
  { id: 5, title: 'Banking Details', icon: '🏦' },
  { id: 6, title: 'Declaration', icon: '✍️' }
]

const PLANS = [
  { id: 'labour-shield', name: 'Labour Shield', price: 'R95', period: '/month', coverage: 'R72,300 per case', features: ['Employment-related legal matters', '24-hour legal assistance', 'Accidental death benefit (R11,000)', 'Free last will & testament', 'Cover for member, spouse & children', 'Extended family protection option', 'Tax advice'], popular: false },
  { id: 'civil-guard', name: 'Civil Guard', price: 'R115', period: '/month', coverage: 'R78,500 per case', features: ['Civil-related legal matters', '24-hour legal assistance', 'Accidental death benefit (R16,500)', 'Free last will & testament', 'Cover for member, spouse & children', 'Extended family protection option', 'Tax advice & assistance'], popular: true },
  { id: 'complete-cover', name: 'Complete Cover', price: 'R130', period: '/month', coverage: 'R100,000 per case', features: ['Employment, civil & criminal matters', '24-hour legal assistance', 'Accidental death benefit (R22,000)', 'Free last will & testament', 'Cover for member, spouse & children', 'Extended family protection option', 'Tax advice, assistance & submission', 'Uncontested divorce & maintenance', 'Antenuptial contracts', 'Property conveyancing discount (20%)', 'Municipal services benefit', 'Legacy Accumulator benefit'], popular: false }
]

const SA_LANGUAGES = ['English', 'Afrikaans', 'isiZulu', 'isiXhosa', 'Sesotho', 'Setswana', 'Sepedi', 'Xitsonga', 'siSwati', 'Tshivenda', 'isiNdebele']

export default function ApplyPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  // Form state
  const [form, setForm] = useState({
    // Step 1: Personal Details
    title: 'Mr',
    fullName: '',
    idNumber: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    postalAddress: '',
    postalCode: '',
    language: 'English',
    communicationPreference: 'email',
    // Step 2: Plan
    selectedPlan: 'civil-guard',
    // Step 3: Dependants
    spouse: { fullName: '', idNumber: '', dateOfBirth: '' },
    children: [
      { fullName: '', idNumber: '', dateOfBirth: '' },
      { fullName: '', idNumber: '', dateOfBirth: '' },
      { fullName: '', idNumber: '', dateOfBirth: '' },
      { fullName: '', idNumber: '', dateOfBirth: '' }
    ],
    // Step 4: Legal Matter
    legalMatterType: 'other',
    legalMatterDescription: '',
    legalMatterUrgency: 'medium',
    opposingParty: '',
    // Step 5: Banking
    accountHolder: '',
    bank: '',
    accountNumber: '',
    branchCode: '',
    accountType: 'cheque',
    debitDate: '1',
    // Step 6: Declaration
    popiaConsent: false,
    termsAccepted: false,
    digitalSignature: ''
  })

  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const updateSpouse = (field, value) => {
    setForm(prev => ({ ...prev, spouse: { ...prev.spouse, [field]: value } }))
  }

  const updateChild = (index, field, value) => {
    setForm(prev => {
      const children = [...prev.children]
      children[index] = { ...children[index], [field]: value }
      return { ...prev, children }
    })
  }

  const validateStep = () => {
    switch (step) {
      case 1:
        if (!form.fullName) return 'Full name is required'
        if (!form.email) return 'Email is required'
        if (!form.idNumber) return 'ID / Passport number is required'
        if (!form.phone) return 'Phone number is required'
        if (!form.password) return 'Password is required'
        if (form.password.length < 6) return 'Password must be at least 6 characters'
        if (form.password !== form.confirmPassword) return 'Passwords do not match'
        return null
      case 2:
        if (!form.selectedPlan) return 'Please select a plan'
        return null
      case 3:
        return null // Optional
      case 4:
        return null // Optional
      case 5:
        return null // Optional for free plan
      case 6:
        if (!form.popiaConsent) return 'POPIA consent is required'
        if (!form.termsAccepted) return 'You must accept the Terms & Conditions'
        if (!form.digitalSignature) return 'Digital signature is required'
        return null
      default:
        return null
    }
  }

  const nextStep = () => {
    const validationError = validateStep()
    if (validationError) {
      setError(validationError)
      return
    }
    setError('')
    setStep(Math.min(step + 1, 6))
    window.scrollTo(0, 0)
  }

  const prevStep = () => {
    setError('')
    setStep(Math.max(step - 1, 1))
    window.scrollTo(0, 0)
  }

  const handleSubmit = async () => {
    const validationError = validateStep()
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to submit application')
        return
      }

      setResult(data)
      setSubmitted(true)
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-10 max-w-lg w-full text-center shadow-sm">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h1>
          <p className="text-gray-500 mb-6">
            Thank you, {form.fullName}. Your application has been received and is being reviewed.
            {result?.case && <span className="block mt-2 text-sm">Case Reference: <strong>{result.case.caseNumber}</strong></span>}
          </p>
          <p className="text-sm text-gray-400 mb-8">
            You can now log in to your dashboard to track your application status.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/login"
              className="px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
              Log In to Dashboard
            </Link>
            <Link href="/"
              className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo-icon-128.png" alt="Infinity Legal" className="h-10 w-auto rounded-lg" />
            <span className="font-semibold text-gray-900 text-sm">Infinity Legal</span>
          </Link>
          <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700">
            Already have an account? <span className="font-medium text-gray-900">Log in</span>
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Application for Legal Services</h1>
          <p className="text-gray-500">Complete the form below to apply for Infinity Legal services</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    step === s.id ? 'bg-gray-900 text-white ring-4 ring-gray-900/10' :
                    step > s.id ? 'bg-emerald-500 text-white' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {step > s.id ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : s.id}
                  </div>
                  <span className={`text-[10px] mt-1.5 font-medium hidden md:block ${
                    step === s.id ? 'text-gray-900' : 'text-gray-400'
                  }`}>{s.title}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 md:w-16 h-0.5 mx-1 ${step > s.id ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="max-w-2xl mx-auto mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 8v4m0 4h.01" />
            </svg>
            {error}
          </div>
        )}

        {/* Form Card */}
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm">
          {/* Step Header */}
          <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-100">
            <span className="text-2xl">{STEPS[step - 1].icon}</span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {step}. {STEPS[step - 1].title}
              </h2>
              <p className="text-xs text-gray-400">
                {step === 1 && 'Complete in print - all fields marked * are required'}
                {step === 2 && 'Select your preferred service plan'}
                {step === 3 && 'Family Protect and Premium plans cover spouses and children under 21'}
                {step === 4 && 'Tell us about your legal matter (optional)'}
                {step === 5 && 'For debit order payment processing (no post office accounts)'}
                {step === 6 && 'Please read carefully before signing'}
              </p>
            </div>
          </div>

          {/* Step 1: Personal Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Title</label>
                  <select value={form.title} onChange={(e) => updateForm('title', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10">
                    {['Mr', 'Mrs', 'Ms', 'Dr', 'Adv', 'Prof'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Full Names & Surname *</label>
                  <input type="text" required value={form.fullName} onChange={(e) => updateForm('fullName', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                    placeholder="e.g., John Peter Doe" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">ID / Passport Number *</label>
                  <input type="text" required value={form.idNumber} onChange={(e) => updateForm('idNumber', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                    placeholder="e.g., 9001015800087" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Email *</label>
                  <input type="email" required value={form.email} onChange={(e) => updateForm('email', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                    placeholder="your.email@example.com" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Cellphone *</label>
                  <input type="tel" required value={form.phone} onChange={(e) => updateForm('phone', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                    placeholder="082 123 4567" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Language</label>
                  <select value={form.language} onChange={(e) => updateForm('language', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10">
                    {SA_LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Postal Address</label>
                <input type="text" value={form.postalAddress} onChange={(e) => updateForm('postalAddress', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                  placeholder="Street address or PO Box" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Postal Code</label>
                  <input type="text" value={form.postalCode} onChange={(e) => updateForm('postalCode', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                    placeholder="e.g., 0001" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Communication Preference</label>
                  <div className="flex gap-3 mt-1">
                    {[
                      { value: 'email', label: 'Email' },
                      { value: 'sms', label: 'SMS' },
                      { value: 'whatsapp', label: 'WhatsApp' },
                      { value: 'post', label: 'Post' }
                    ].map(p => (
                      <label key={p.value} className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name="commPref" value={p.value}
                          checked={form.communicationPreference === p.value}
                          onChange={(e) => updateForm('communicationPreference', e.target.value)}
                          className="w-3.5 h-3.5 text-gray-900 border-gray-300 focus:ring-gray-900" />
                        <span className="text-xs text-gray-600">{p.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Create Password *</label>
                  <input type="password" required value={form.password} onChange={(e) => updateForm('password', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                    placeholder="Minimum 6 characters" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Confirm Password *</label>
                  <input type="password" required value={form.confirmPassword} onChange={(e) => updateForm('confirmPassword', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                    placeholder="Re-enter password" />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Service Plan */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500 mb-2">
                <span className="font-medium">Please Note:</span> *Amounts include VAT. *Refer to Terms and Conditions. *Guaranteed for 12 months.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                {PLANS.map(plan => (
                  <div key={plan.id}
                    onClick={() => updateForm('selectedPlan', plan.id)}
                    className={`relative border-2 rounded-xl p-5 cursor-pointer transition-all ${
                      form.selectedPlan === plan.id
                        ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    {plan.popular && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                        <span className="bg-gray-900 text-white text-[10px] font-semibold px-3 py-0.5 rounded-full">
                          Most Popular
                        </span>
                      </div>
                    )}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                        <div className="flex items-baseline gap-0.5 mt-1">
                          <span className="text-2xl font-bold text-gray-900">{plan.price}</span>
                          <span className="text-xs text-gray-400">{plan.period}</span>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        form.selectedPlan === plan.id ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
                      }`}>
                        {form.selectedPlan === plan.id && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <ul className="space-y-1.5">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-500">
                          <svg className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Dependants */}
          {step === 3 && (
            <div className="space-y-5">
              {(form.selectedPlan !== 'family' && form.selectedPlan !== 'premium') && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                  Dependant coverage is only available on <strong>Family Protect</strong> and <strong>Premium</strong> plans. You can skip this step.
                </div>
              )}

              {/* Spouse */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Spouse / Partner</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Full Names & Surname</label>
                    <input type="text" value={form.spouse.fullName} onChange={(e) => updateSpouse('fullName', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">ID / Date of Birth</label>
                    <input type="text" value={form.spouse.idNumber} onChange={(e) => updateSpouse('idNumber', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
                  </div>
                </div>
              </div>

              {/* Children */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Children (under 21 years)</h3>
                <div className="space-y-3">
                  {form.children.map((child, idx) => (
                    <div key={idx} className="grid grid-cols-3 gap-3 items-end">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          {['1st', '2nd', '3rd', '4th'][idx]} Child - Full Names & Surname
                        </label>
                        <input type="text" value={child.fullName} onChange={(e) => updateChild(idx, 'fullName', e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">ID / Date of Birth</label>
                        <input type="text" value={child.idNumber} onChange={(e) => updateChild(idx, 'idNumber', e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Legal Matter */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Type of Legal Matter</label>
                  <select value={form.legalMatterType} onChange={(e) => updateForm('legalMatterType', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10">
                    <option value="criminal">Criminal</option>
                    <option value="civil">Civil</option>
                    <option value="family">Family / Divorce</option>
                    <option value="other">Other / Not Sure</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Urgency</label>
                  <select value={form.legalMatterUrgency} onChange={(e) => updateForm('legalMatterUrgency', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10">
                    <option value="low">Low - No deadline</option>
                    <option value="medium">Medium - Within a few weeks</option>
                    <option value="high">High - Within a week</option>
                    <option value="emergency">Emergency - Immediate</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Brief Description of Your Legal Matter</label>
                <textarea value={form.legalMatterDescription} onChange={(e) => updateForm('legalMatterDescription', e.target.value)}
                  rows={4} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                  placeholder="Please describe your legal situation briefly. This information will be treated confidentially." />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Opposing Party (if applicable)</label>
                <input type="text" value={form.opposingParty} onChange={(e) => updateForm('opposingParty', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                  placeholder="Name of opposing party, company, or government entity" />
              </div>
            </div>
          )}

          {/* Step 5: Banking Details */}
          {step === 5 && (
            <div className="space-y-4">
              {form.selectedPlan === 'free' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                  Banking details are optional for the <strong>Free</strong> plan. You can skip this step.
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Account Holder Name</label>
                  <input type="text" value={form.accountHolder} onChange={(e) => updateForm('accountHolder', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Bank</label>
                  <select value={form.bank} onChange={(e) => updateForm('bank', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10">
                    <option value="">Select bank</option>
                    {['ABSA', 'Capitec', 'FNB', 'Nedbank', 'Standard Bank', 'TymeBank', 'African Bank', 'Investec', 'Other'].map(b =>
                      <option key={b} value={b}>{b}</option>
                    )}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Account Number</label>
                  <input type="text" value={form.accountNumber} onChange={(e) => updateForm('accountNumber', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Branch Code</label>
                  <input type="text" value={form.branchCode} onChange={(e) => updateForm('branchCode', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Account Type</label>
                  <div className="flex gap-4 mt-1">
                    {[{ value: 'cheque', label: 'Cheque' }, { value: 'savings', label: 'Savings' }].map(t => (
                      <label key={t.value} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="accType" value={t.value}
                          checked={form.accountType === t.value}
                          onChange={(e) => updateForm('accountType', e.target.value)}
                          className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-900" />
                        <span className="text-sm text-gray-700">{t.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Debit Date</label>
                  <div className="flex gap-3 mt-1">
                    {['1', '15', '20', '25'].map(d => (
                      <label key={d} className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name="debitDate" value={d}
                          checked={form.debitDate === d}
                          onChange={(e) => updateForm('debitDate', e.target.value)}
                          className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-900" />
                        <span className="text-sm text-gray-700">{d}st</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-gray-400 mt-2">
                Note: If the debit date falls on a weekend or public holiday, it will be processed on the next business day.
                Bank statement reference: &apos;Infinity Legal&apos;
              </p>
            </div>
          )}

          {/* Step 6: Declaration */}
          {step === 6 && (
            <div className="space-y-5">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-sm text-gray-700 leading-relaxed max-h-[300px] overflow-y-auto">
                <p className="mb-3">I hereby apply for Legal Services on the Terms and Conditions of <strong>Infinity Legal</strong>. I understand the following:</p>
                <ul className="space-y-2 text-xs list-disc pl-4">
                  <li>My service plan will commence upon payment of the first premium/fee.</li>
                  <li>The payment of premiums on the due dates is my responsibility.</li>
                  <li>If the debit date falls on a weekend or public holiday, it will be raised on the previous or next business day.</li>
                  <li>I hereby authorise Infinity Legal and its agent(s) to debit my bank account with amounts due until cancellation of the service.</li>
                  <li>I authorise my bank to treat these payment instructions as if issued by me personally.</li>
                  <li>I undertake to notify Infinity Legal of any changes to my particulars.</li>
                  <li>I choose the address provided as my address for service of legal documents.</li>
                  <li>I declare that I am an authorised signatory of the bank account provided above.</li>
                  <li>Legal costs of any legal proceeding arising from an event which occurred before my date of cover will not be covered under the plan benefits.</li>
                  <li>My personal information will be processed in accordance with the Protection of Personal Information Act (POPIA).</li>
                </ul>
              </div>

              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <input type="checkbox" checked={form.popiaConsent}
                    onChange={(e) => updateForm('popiaConsent', e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-gray-900 border-gray-300 rounded focus:ring-gray-900" />
                  <div>
                    <span className="text-sm font-medium text-gray-900">POPIA Consent *</span>
                    <p className="text-xs text-gray-500 mt-0.5">I consent to Infinity Legal collecting, processing, and storing my personal information as described in the Privacy Policy, in compliance with the Protection of Personal Information Act (POPIA).</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <input type="checkbox" checked={form.termsAccepted}
                    onChange={(e) => updateForm('termsAccepted', e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-gray-900 border-gray-300 rounded focus:ring-gray-900" />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Terms & Conditions *</span>
                    <p className="text-xs text-gray-500 mt-0.5">I confirm that I have read and understood the declaration above, its contents and implications, and I agree to the Terms and Conditions of Infinity Legal.</p>
                  </div>
                </label>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Digital Signature * (Type your full name)</label>
                <input type="text" value={form.digitalSignature} onChange={(e) => updateForm('digitalSignature', e.target.value)}
                  className="w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-lg font-serif italic focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
                  placeholder="Type your full legal name as signature" />
                <p className="text-[11px] text-gray-400 mt-1.5">
                  By typing your name above, you agree that this constitutes your electronic signature, which is legally binding.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-5 border-t border-gray-100">
            {step > 1 ? (
              <button onClick={prevStep}
                className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
            ) : <div />}

            {step < 6 ? (
              <button onClick={nextStep}
                className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
                Next
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50">
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Application
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Footer Note */}
        <div className="max-w-2xl mx-auto mt-6 text-center">
          <p className="text-[11px] text-gray-400">
            Infinity Legal (Pty) Ltd · All personal information is processed in compliance with POPIA · 
            <Link href="/compliance" className="underline hover:text-gray-600">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
