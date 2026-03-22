'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

const LEGAL_CATEGORIES = [
  {
    id: 'criminal',
    name: 'Criminal Law',
    icon: '🚔',
    description: 'Arrests, charges, bail applications, criminal defense',
    examples: 'Been arrested, facing charges, need bail, criminal record expungement'
  },
  {
    id: 'family',
    name: 'Family Law',
    icon: '👨‍👩‍👧',
    description: 'Divorce, child custody, maintenance, domestic violence',
    examples: 'Divorce proceedings, child support, protection orders, adoption'
  },
  {
    id: 'labour',
    name: 'Labour Law',
    icon: '💼',
    description: 'Unfair dismissal, CCMA disputes, workplace issues',
    examples: 'Fired without notice, unpaid wages, workplace harassment, retrenchment'
  },
  {
    id: 'personal-injury',
    name: 'Personal Injury',
    icon: '🏥',
    description: 'Motor vehicle accidents, medical negligence, slip & fall',
    examples: 'Car accident injury, hospital negligence, workplace injury claim'
  },
  {
    id: 'property',
    name: 'Property Law',
    icon: '🏠',
    description: 'Evictions, property disputes, transfers',
    examples: 'Facing eviction, boundary disputes, property transfer issues'
  },
  {
    id: 'debt',
    name: 'Debt Recovery',
    icon: '💰',
    description: 'Collections, insolvency, debt review',
    examples: 'Debt collectors harassing, need debt review, business insolvency'
  },
  {
    id: 'civil',
    name: 'Civil Litigation',
    icon: '📄',
    description: 'Contracts, damages claims, disputes',
    examples: 'Breach of contract, damages claim, defamation'
  },
  {
    id: 'commercial',
    name: 'Commercial Law',
    icon: '🏢',
    description: 'Business disputes, contracts, compliance',
    examples: 'Business partner dispute, contract drafting, regulatory compliance'
  },
  {
    id: 'other',
    name: 'Other / Not Sure',
    icon: '❓',
    description: "Don't worry if you're not sure — our AI will categorize it",
    examples: 'Any other legal issue not listed above'
  }
]

const QUESTIONS = [
  {
    id: 'problem',
    question: "What's your legal problem?",
    legalQuestion: 'Describe the nature of your legal matter',
    placeholder: 'Example: My employer fired me without notice after 5 years of service. I was not given any warnings or a hearing...',
    type: 'textarea',
    required: true,
    helpText: 'Be as detailed as possible. Include what happened, who was involved, and any important dates.'
  },
  {
    id: 'timeline',
    question: 'When did this happen?',
    legalQuestion: 'What is the timeline of events?',
    placeholder: 'Example: I was dismissed on 15 January 2026. The incident happened 2 weeks before that...',
    type: 'textarea',
    required: true,
    helpText: 'Include specific dates if you can remember them. Timelines are important for legal deadlines.'
  },
  {
    id: 'outcome',
    question: 'What outcome do you want?',
    legalQuestion: 'What is your desired outcome or relief sought?',
    placeholder: 'Example: I want my job back, or I want compensation for unfair dismissal. I also want my unpaid leave days paid out...',
    type: 'textarea',
    required: true,
    helpText: 'Tell us what you would ideally like to happen. This helps us understand your goals.'
  },
  {
    id: 'parties',
    question: 'Who else is involved?',
    legalQuestion: 'Identify the opposing party or parties',
    placeholder: 'Example: My employer (a retail company), my manager who made the decision...',
    type: 'textarea',
    required: false,
    helpText: 'Optional: List any other people or organizations involved in this matter.'
  },
  {
    id: 'documents',
    question: 'Do you have any documents or evidence?',
    legalQuestion: 'What documentary evidence do you possess?',
    placeholder: 'Example: I have my employment contract, the dismissal letter, and WhatsApp messages from my manager...',
    type: 'textarea',
    required: false,
    helpText: 'Optional: List any paperwork, contracts, messages, photos, or other evidence you have.'
  }
]

function LoadingAnimation() {
  const [dots, setDots] = useState('')
  const [statusIdx, setStatusIdx] = useState(0)
  const statuses = [
    'Reading your submission...',
    'Analyzing legal context...',
    'Identifying applicable South African laws...',
    'Assessing urgency and deadlines...',
    'Preparing your personalized analysis...'
  ]

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)
    const statusInterval = setInterval(() => {
      setStatusIdx(prev => (prev + 1) % statuses.length)
    }, 2500)
    return () => { clearInterval(dotInterval); clearInterval(statusInterval) }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-infinity-gold/20 flex items-center justify-center animate-pulse">
            <span className="text-4xl">🤖</span>
          </div>
          <h2 className="text-2xl font-bold text-infinity-navy mb-2">AI Analysis in Progress</h2>
          <p className="text-muted-foreground">{statuses[statusIdx]}{dots}</p>
        </div>
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div className="bg-infinity-gold h-full rounded-full animate-[loading_3s_ease-in-out_infinite]" style={{ width: '70%' }}></div>
        </div>
        <p className="text-xs text-muted-foreground mt-4">🔒 Your data is encrypted and protected by POPIA</p>
      </div>
    </div>
  )
}

function ResultsView({ analysis, router, isAuthenticated }) {
  const urgencyColors = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    emergency: 'bg-red-100 text-red-800 border-red-200'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-infinity-cream to-white">
      {/* Header */}
      <div className="border-b border-infinity-gold/20 bg-white/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Infinity Legal" className="h-8 w-auto" />
            <span className="font-bold text-lg text-infinity-navy">Infinity Legal</span>
          </Link>
          <Link href="/intake" className="text-sm text-infinity-navy/70 hover:text-infinity-navy">
            ← New Analysis
          </Link>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <span className="text-3xl">✅</span>
          </div>
          <h1 className="text-3xl font-bold text-infinity-navy mb-2">Your Legal Analysis is Ready</h1>
          <p className="text-muted-foreground">Based on the information you provided, here is our AI assessment</p>
        </div>

        {/* Emergency Alert */}
        {analysis.urgency === 'emergency' && (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 mb-6 animate-pulse">
            <div className="flex items-center gap-3 text-red-700 font-bold text-lg mb-2">
              <span className="text-2xl">🚨</span> EMERGENCY CASE DETECTED
            </div>
            <p className="text-red-600">Your case requires immediate legal attention. We strongly recommend contacting an attorney right away.</p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Analysis - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Category & Urgency Card */}
            <div className="bg-white rounded-xl border border-infinity-gold/20 p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${urgencyColors[analysis.urgency] || urgencyColors.medium}`}>
                  {analysis.urgency?.toUpperCase()} URGENCY
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-infinity-gold/10 text-infinity-navy border border-infinity-gold/20">
                  {analysis.category}
                </span>
                {analysis.subcategory && (
                  <span className="px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700 border border-blue-200">
                    {analysis.subcategory}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-lg text-infinity-navy mb-2">Case Summary</h3>
              <p className="text-muted-foreground leading-relaxed">{analysis.summary}</p>
            </div>

            {/* Next Steps */}
            <div className="bg-white rounded-xl border border-infinity-gold/20 p-6 shadow-sm">
              <h3 className="font-semibold text-lg text-infinity-navy mb-4 flex items-center gap-2">
                <span>📋</span> Recommended Next Steps
              </h3>
              <div className="space-y-3">
                {(analysis.nextSteps || []).map((step, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-infinity-cream/50 rounded-lg">
                    <div className="w-7 h-7 rounded-full bg-infinity-navy text-infinity-cream flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    <p className="text-sm text-infinity-navy/80 pt-0.5">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Relevant Legislation */}
            {analysis.relevantLegislation && analysis.relevantLegislation.length > 0 && (
              <div className="bg-white rounded-xl border border-infinity-gold/20 p-6 shadow-sm">
                <h3 className="font-semibold text-lg text-infinity-navy mb-4 flex items-center gap-2">
                  <span>📚</span> Relevant South African Legislation
                </h3>
                <ul className="space-y-2">
                  {analysis.relevantLegislation.map((law, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="w-1.5 h-1.5 bg-infinity-gold rounded-full flex-shrink-0"></span>
                      {law}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings */}
            {analysis.warnings && analysis.warnings.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                  <span>⚠️</span> Important Warnings
                </h3>
                <ul className="space-y-2">
                  {analysis.warnings.map((warning, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
                      <span className="mt-1">•</span>
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Cost & Timeline */}
            <div className="bg-white rounded-xl border border-infinity-gold/20 p-6 shadow-sm">
              <h3 className="font-semibold text-infinity-navy mb-4">Cost & Timeline</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Estimated Cost</p>
                  <p className="text-2xl font-bold text-infinity-gold">{analysis.estimatedCostRange || 'Contact attorney'}</p>
                </div>
                <div className="border-t border-border pt-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Expected Timeline</p>
                  <p className="text-lg font-semibold text-infinity-navy">{analysis.estimatedTimeline || 'Varies'}</p>
                </div>
              </div>
            </div>

            {/* AI Confidence */}
            <div className="bg-white rounded-xl border border-infinity-gold/20 p-6 shadow-sm">
              <h3 className="font-semibold text-infinity-navy mb-3 flex items-center gap-2">
                <span>🤖</span> AI Confidence
              </h3>
              <div className="relative pt-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl font-bold text-infinity-navy">{analysis.confidence || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${analysis.confidence || 0}%`,
                      backgroundColor: (analysis.confidence || 0) >= 80 ? '#22c55e' : (analysis.confidence || 0) >= 60 ? '#eab308' : '#ef4444'
                    }}
                  ></div>
                </div>
                {(analysis.confidence || 0) < 80 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    This analysis is preliminary. A qualified attorney can provide a more accurate assessment.
                  </p>
                )}
              </div>
            </div>

            {/* POPIA Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-xs text-blue-700 flex items-start gap-2">
                <span className="text-base">🔒</span>
                <span>{analysis.ppiCompliance || 'Your information is handled in compliance with the Protection of Personal Information Act (POPIA). PII has been redacted from this analysis.'}</span>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => router.push('/book-consultation' + (analysis.caseId ? '?caseId=' + analysis.caseId : ''))}
                className="w-full px-6 py-4 bg-infinity-navy text-infinity-cream rounded-xl font-semibold hover:bg-infinity-navy/90 transition-all shadow-md hover:shadow-lg text-center"
              >
                Book a Consultation →
              </button>
              {!isAuthenticated && (
                <button
                  onClick={() => router.push('/signup' + (analysis.caseId ? '?caseId=' + analysis.caseId : ''))}
                  className="w-full px-6 py-4 bg-infinity-gold text-infinity-navy rounded-xl font-semibold hover:bg-infinity-gold/90 transition-all text-center"
                >
                  Create Account to Save
                </button>
              )}
              {analysis.savedToAccount && (
                <div className="text-center">
                  <p className="text-sm text-green-600 font-medium">✓ Case saved to your account</p>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="text-sm text-infinity-navy hover:underline mt-1"
                  >
                    View in Dashboard →
                  </button>
                </div>
              )}
              {analysis.caseId && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Reference: {analysis.caseId}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-xl">
          <p className="text-xs text-muted-foreground text-center">
            <strong>Disclaimer:</strong> This AI analysis is for informational purposes only and does not constitute legal advice. 
            It should not be relied upon as a substitute for professional legal counsel. 
            Always consult a qualified South African attorney for legal matters.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function IntakePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated } = useAuth()
  const isUrgent = searchParams.get('urgent') === 'true'

  const [phase, setPhase] = useState('category') // 'category', 'questions', 'loading', 'results', 'error'
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [step, setStep] = useState(0)
  const [responses, setResponses] = useState({})
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [plainLanguage, setPlainLanguage] = useState(true)
  const [error, setError] = useState(null)

  // If urgent, skip category selection
  useEffect(() => {
    if (isUrgent) {
      setPhase('questions')
    }
  }, [isUrgent])

  const handleCategorySelect = (category) => {
    setSelectedCategory(category)
    setPhase('questions')
  }

  const handleSkipCategory = () => {
    setSelectedCategory(null)
    setPhase('questions')
  }

  const currentQuestion = QUESTIONS[step]
  const totalRequired = QUESTIONS.filter(q => q.required).length

  const handleNext = () => {
    if (currentQuestion.required && !responses[currentQuestion.id]?.trim()) {
      return // Don't proceed if required field is empty
    }
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1)
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1)
    } else {
      setPhase('category')
      setSelectedCategory(null)
    }
  }

  const handleSubmit = async () => {
    setPhase('loading')
    setError(null)

    try {
      const headers = { 'Content-Type': 'application/json' }
      
      // Include auth token if user is logged in
      if (isAuthenticated && user) {
        const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession()
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`
        }
      }

      const response = await fetch('/api/intake/analyze', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          responses,
          isUrgent,
          selectedCategory: selectedCategory?.name || null
        })
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || 'Analysis failed')
      }

      const data = await response.json()
      setAiAnalysis(data)
      setPhase('results')
    } catch (err) {
      console.error('Intake error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
      setPhase('error')
    }
  }

  // Loading state
  if (phase === 'loading') {
    return <LoadingAnimation />
  }

  // Results state
  if (phase === 'results' && aiAnalysis) {
    return <ResultsView analysis={aiAnalysis} router={router} isAuthenticated={isAuthenticated} />
  }

  // Error state
  if (phase === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-3xl">❌</span>
          </div>
          <h2 className="text-2xl font-bold text-infinity-navy mb-2">Analysis Failed</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setPhase('questions'); setStep(0) }}
              className="px-6 py-3 bg-infinity-navy text-infinity-cream rounded-lg font-medium hover:bg-infinity-navy/90"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Category Selection Phase
  if (phase === 'category') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-infinity-cream to-white">
        {/* Header */}
        <div className="border-b border-infinity-gold/20 bg-white/80 backdrop-blur">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="Infinity Legal" className="h-8 w-auto" />
              <span className="font-bold text-lg text-infinity-navy">Infinity Legal</span>
            </Link>
            <Link href="/" className="text-sm text-infinity-navy/70 hover:text-infinity-navy">
              ← Back to Home
            </Link>
          </div>
        </div>

        <div className="container mx-auto max-w-4xl px-4 py-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-infinity-gold/10 text-infinity-navy text-sm font-medium mb-4">
              <span className="w-2 h-2 bg-infinity-gold rounded-full animate-pulse"></span>
              AI-Powered Legal Intake
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-infinity-navy mb-3">
              What type of legal issue do you have?
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Select a category below to help us understand your situation better, or skip to describe your issue directly.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {LEGAL_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat)}
                className="text-left p-5 bg-white rounded-xl border-2 border-transparent hover:border-infinity-gold/50 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="text-3xl mb-3">{cat.icon}</div>
                <h3 className="font-semibold text-infinity-navy mb-1 group-hover:text-infinity-gold transition-colors">{cat.name}</h3>
                <p className="text-sm text-muted-foreground">{cat.description}</p>
              </button>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={handleSkipCategory}
              className="text-sm text-infinity-navy/60 hover:text-infinity-navy underline"
            >
              Skip — I'll describe my issue directly
            </button>
          </div>

          <div className="mt-12 text-center text-sm text-muted-foreground">
            <p>🔒 Your information is confidential and protected by POPIA</p>
            <p className="mt-1">No account required • Free AI analysis • 3-5 minute process</p>
          </div>
        </div>
      </div>
    )
  }

  // Questions Phase
  return (
    <div className="min-h-screen bg-gradient-to-b from-infinity-cream to-white">
      {/* Header */}
      <div className="border-b border-infinity-gold/20 bg-white/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Infinity Legal" className="h-8 w-auto" />
            <span className="font-bold text-lg text-infinity-navy">Infinity Legal</span>
          </Link>
          {selectedCategory && (
            <span className="text-sm px-3 py-1 rounded-full bg-infinity-gold/10 text-infinity-navy font-medium">
              {selectedCategory.icon} {selectedCategory.name}
            </span>
          )}
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 py-10">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-infinity-navy mb-2">
            {isUrgent ? '🚨 Emergency Legal Intake' : 'Tell Us About Your Legal Issue'}
          </h1>
          <p className="text-muted-foreground text-sm">
            Answer a few questions. Most people finish in 3-5 minutes.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium text-infinity-navy">
              Question {step + 1} of {QUESTIONS.length}
              {!currentQuestion.required && <span className="text-muted-foreground ml-1">(Optional)</span>}
            </span>
            <button
              onClick={() => setPlainLanguage(!plainLanguage)}
              className="text-xs text-infinity-navy/60 hover:text-infinity-navy"
            >
              {plainLanguage ? '📖 Use Legal Terms' : '💬 Use Plain Language'}
            </button>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-infinity-gold h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-xl border border-infinity-gold/20 p-6 md:p-8 shadow-sm">
          <label className="block">
            <span className="text-lg font-semibold text-infinity-navy mb-1 block">
              {plainLanguage ? currentQuestion.question : currentQuestion.legalQuestion}
            </span>
            <span className="text-xs text-muted-foreground mb-4 block">{currentQuestion.helpText}</span>
            <textarea
              value={responses[currentQuestion.id] || ''}
              onChange={(e) => setResponses({ ...responses, [currentQuestion.id]: e.target.value })}
              placeholder={currentQuestion.placeholder}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-infinity-gold/50 focus:border-infinity-gold resize-none text-sm leading-relaxed"
              autoFocus
            />
          </label>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleBack}
              className="px-5 py-3 bg-gray-100 text-infinity-navy rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              ← Back
            </button>
            {!currentQuestion.required && !responses[currentQuestion.id]?.trim() && step < QUESTIONS.length - 1 && (
              <button
                onClick={() => setStep(step + 1)}
                className="px-5 py-3 bg-gray-100 text-muted-foreground rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Skip
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={currentQuestion.required && !responses[currentQuestion.id]?.trim()}
              className="flex-1 px-6 py-3 bg-infinity-navy text-infinity-cream rounded-lg font-semibold hover:bg-infinity-navy/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {step === QUESTIONS.length - 1 ? '🤖 Get AI Analysis' : 'Next →'}
            </button>
          </div>
        </div>

        {/* Quick tip based on category */}
        {selectedCategory && step === 0 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-blue-700">
              <strong>💡 Tip for {selectedCategory.name}:</strong> {selectedCategory.examples}
            </p>
          </div>
        )}

        {/* Trust */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>🔒 Confidential & POPIA compliant • No account required</p>
        </div>
      </div>
    </div>
  )
}
