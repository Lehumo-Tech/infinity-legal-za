'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function IntakePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isUrgent = searchParams.get('urgent') === 'true'
  
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [responses, setResponses] = useState({})
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [plainLanguage, setPlainLanguage] = useState(true)

  const questions = [
    {
      id: 'problem',
      question: plainLanguage 
        ? "What's your legal problem? (In your own words)" 
        : "Describe the nature of your legal matter",
      placeholder: "Example: My employer fired me without notice...",
      type: 'textarea'
    },
    {
      id: 'timeline',
      question: plainLanguage
        ? "When did this happen?"
        : "What is the timeline of events?",
      placeholder: "Example: Last week Monday...",
      type: 'text'
    },
    {
      id: 'outcome',
      question: plainLanguage
        ? "What do you want to happen?"
        : "What is your desired outcome?",
      placeholder: "Example: I want my job back or compensation...",
      type: 'textarea'
    }
  ]

  const handleNext = async () => {
    const currentQuestion = questions[step - 1]
    if (!responses[currentQuestion.id]?.trim()) {
      alert('Please answer the question before continuing')
      return
    }

    if (step < questions.length) {
      setStep(step + 1)
    } else {
      // Submit to AI
      setLoading(true)
      try {
        const response = await fetch('/api/intake/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ responses, isUrgent })
        })
        const data = await response.json()
        setAiAnalysis(data)
      } catch (error) {
        console.error('Error:', error)
        alert('Something went wrong. Please try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const currentQuestion = questions[step - 1]

  if (aiAnalysis) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="bg-card rounded-lg border border-border p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold">Analysis Complete</h2>
                <p className="text-sm text-muted-foreground">Here's what we found</p>
              </div>
            </div>

            {aiAnalysis.urgency === 'emergency' && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-destructive font-semibold mb-2">
                  <span>⚠️</span> URGENT CASE DETECTED
                </div>
                <p className="text-sm">Your case requires immediate attention. We've prioritized your request.</p>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Case Category</h3>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  {aiAnalysis.category}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Summary</h3>
                <p className="text-muted-foreground">{aiAnalysis.summary}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Next Steps</h3>
                <ul className="space-y-2">
                  {aiAnalysis.nextSteps?.map((step, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary font-bold">{i + 1}.</span>
                      <span className="text-muted-foreground">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Estimated Cost</h3>
                <p className="text-2xl font-bold text-primary">{aiAnalysis.estimatedCost}</p>
                <p className="text-sm text-muted-foreground">Based on similar cases in South Africa</p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🤖</span>
                  <span className="font-semibold">AI Confidence</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-primary h-full transition-all" 
                      style={{ width: `${aiAnalysis.confidence}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{aiAnalysis.confidence}%</span>
                </div>
                {aiAnalysis.confidence < 80 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    ⚠️ This analysis is preliminary. We recommend consulting with an attorney.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <button
                onClick={() => router.push('/attorneys/browse?caseId=' + aiAnalysis.caseId)}
                className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90"
              >
                Find Attorney Now →
              </button>
              <button
                onClick={() => router.push('/signup?caseId=' + aiAnalysis.caseId)}
                className="flex-1 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/90"
              >
                Save & Continue Later
              </button>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Case ID: {aiAnalysis.caseId} • Create account to track progress
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <button 
            onClick={() => router.push('/')}
            className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1"
          >
            ← Back to Home
          </button>
          <h1 className="text-3xl font-bold mb-2">
            {isUrgent ? '🚨 Emergency Legal Intake' : 'Legal Problem Intake'}
          </h1>
          <p className="text-muted-foreground">Answer 3 simple questions. Most people finish in 3 minutes.</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium">Step {step} of {questions.length}</span>
            <button
              onClick={() => setPlainLanguage(!plainLanguage)}
              className="text-primary hover:underline text-xs"
            >
              {plainLanguage ? '🔤 Use Legal Terms' : '💬 Use Plain Language'}
            </button>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-300" 
              style={{ width: `${(step / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-card rounded-lg border border-border p-8 shadow-lg">
          <label className="block mb-4">
            <span className="text-lg font-semibold mb-3 block">
              {currentQuestion.question}
            </span>
            {currentQuestion.type === 'textarea' ? (
              <textarea
                value={responses[currentQuestion.id] || ''}
                onChange={(e) => setResponses({ ...responses, [currentQuestion.id]: e.target.value })}
                placeholder={currentQuestion.placeholder}
                rows={6}
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            ) : (
              <input
                type="text"
                value={responses[currentQuestion.id] || ''}
                onChange={(e) => setResponses({ ...responses, [currentQuestion.id]: e.target.value })}
                placeholder={currentQuestion.placeholder}
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            )}
          </label>

          <div className="flex gap-4 mt-6">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/90"
              >
                ← Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Analyzing...' : step === questions.length ? 'Get AI Analysis →' : 'Next →'}
            </button>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>🔒 Your information is confidential and protected by POPIA</p>
          <p className="mt-2">No credit card required • Cancel anytime</p>
        </div>
      </div>
    </div>
  )
}