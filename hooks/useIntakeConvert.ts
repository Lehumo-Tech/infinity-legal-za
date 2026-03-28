'use client'

import { useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import {
  createIntakeService,
  convertIntakeSchema,
  type ConvertIntakeResult,
  type IntakeSubmission,
  type UrgencyLevel,
} from '@/lib/intake'
import type { ConvertIntakeInput } from '@/lib/intake/schemas'

interface ConvertForm {
  caseSubtype: string
  urgency: UrgencyLevel
  description: string
}

interface UseIntakeConvertReturn {
  form: ConvertForm
  setField: <K extends keyof ConvertForm>(key: K, value: ConvertForm[K]) => void
  validationErrors: Record<string, string>
  converting: boolean
  result: ConvertIntakeResult | null
  error: string | null
  convert: (intakeId: string) => Promise<boolean>
  prefillFromIntake: (intake: IntakeSubmission) => void
  reset: () => void
}

const EMPTY_FORM: ConvertForm = { caseSubtype: '', urgency: 'medium', description: '' }

export function useIntakeConvert(): UseIntakeConvertReturn {
  const [token, setToken] = useState<string | null>(null)
  const [form, setForm] = useState<ConvertForm>({ ...EMPTY_FORM })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [converting, setConverting] = useState(false)
  const [result, setResult] = useState<ConvertIntakeResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Get token on mount
  if (!token) {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.access_token) setToken(data.session.access_token)
    })
  }

  const service = useMemo(
    () => (token ? createIntakeService({ token }) : null),
    [token]
  )

  const setField = <K extends keyof ConvertForm>(key: K, value: ConvertForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setValidationErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const prefillFromIntake = (intake: IntakeSubmission) => {
    setForm({
      caseSubtype: intake.analysis?.subcategory || intake.analysis?.category || '',
      urgency: intake.analysis?.urgency || 'medium',
      description: intake.analysis?.summary || '',
    })
    setResult(null)
    setError(null)
    setValidationErrors({})
  }

  const convert = async (intakeId: string): Promise<boolean> => {
    if (!service) {
      setError('Not authenticated')
      return false
    }

    // Validate
    const parsed = convertIntakeSchema.safeParse(form)
    if (!parsed.success) {
      const errs: Record<string, string> = {}
      parsed.error.errors.forEach((e) => {
        const key = e.path[0] as string
        errs[key] = e.message
      })
      setValidationErrors(errs)
      return false
    }

    setConverting(true)
    setError(null)
    try {
      const data = await service.convert(intakeId, parsed.data as ConvertIntakeInput)
      setResult(data)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert')
      return false
    } finally {
      setConverting(false)
    }
  }

  const reset = () => {
    setForm({ ...EMPTY_FORM })
    setValidationErrors({})
    setResult(null)
    setError(null)
  }

  return { form, setField, validationErrors, converting, result, error, convert, prefillFromIntake, reset }
}
