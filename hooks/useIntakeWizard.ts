'use client'

import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import {
  intakeSchema,
  STEP_FIELDS,
  TOTAL_STEPS,
  type IntakeValues,
} from '@/lib/modules/intake'

export function useIntakeWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<IntakeValues>({
    resolver: zodResolver(intakeSchema),
    mode: 'onTouched',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      caseType: undefined,
      urgency: undefined,
      description: '',
      opposingParty: '',
      opposingPartyContact: '',
      witnesses: '',
      hasDocuments: false,
      documentList: '',
      incidentDate: '',
      consent: undefined as unknown as true,
      popiaConsent: undefined as unknown as true,
    },
  })

  const nextStep = useCallback(async () => {
    const fields = STEP_FIELDS[currentStep]
    if (!fields) return

    const valid = await form.trigger(fields)
    if (valid && currentStep < TOTAL_STEPS) {
      setCurrentStep((s) => s + 1)
    }
  }, [currentStep, form])

  const prevStep = useCallback(() => {
    if (currentStep > 1) setCurrentStep((s) => s - 1)
  }, [currentStep])

  const submit = useCallback(async () => {
    const allValid = await form.trigger()
    if (!allValid) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const values = form.getValues()
      const res = await fetch('/api/intake/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await res.json()

      if (data.success && data.caseId) {
        router.push(`/intake/confirmation?caseId=${encodeURIComponent(data.caseId)}`)
      } else {
        setSubmitError(data.error || 'Submission failed. Please try again.')
      }
    } catch {
      setSubmitError('Network error. Please check your connection.')
    } finally {
      setIsSubmitting(false)
    }
  }, [form, router])

  return {
    form,
    currentStep,
    totalSteps: TOTAL_STEPS,
    nextStep,
    prevStep,
    submit,
    isSubmitting,
    submitError,
  }
}
