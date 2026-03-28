/**
 * Infinity Legal — Intake Service
 * API service layer. No framework imports.
 */
import type {
  IntakeSubmission,
  IntakeAnalysis,
  IntakeListFilters,
  ConvertIntakeResult,
} from './types'
import type { IntakeSubmitInput, ConvertIntakeInput } from './schemas'

interface ApiOptions {
  baseUrl?: string
  token: string
}

interface IntakeListResponse {
  intakes: IntakeSubmission[]
}

interface AnalyzeResponse extends IntakeAnalysis {
  intakeId: string | null
  caseId: string | null
  savedToAccount: boolean
}

async function apiFetch<T>(
  path: string,
  opts: ApiOptions,
  init?: RequestInit
): Promise<T> {
  const url = `${opts.baseUrl || ''}/api${path}`
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${opts.token}`,
      ...(init?.headers || {}),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `API error ${res.status}`)
  }
  return res.json() as Promise<T>
}

export function createIntakeService(opts: ApiOptions) {
  return {
    /** Submit intake for AI analysis */
    async analyze(input: IntakeSubmitInput): Promise<AnalyzeResponse> {
      return apiFetch<AnalyzeResponse>('/intake/analyze', opts, {
        method: 'POST',
        body: JSON.stringify(input),
      })
    },

    /** List intake submissions with filters */
    async list(filters: IntakeListFilters): Promise<IntakeSubmission[]> {
      const params = new URLSearchParams()
      if (filters.status && filters.status !== 'all') params.set('status', filters.status)
      if (filters.category) params.set('category', filters.category)
      if (filters.search) params.set('search', filters.search)
      const qs = params.toString()
      const data = await apiFetch<IntakeListResponse>(
        `/intakes${qs ? `?${qs}` : ''}`,
        opts
      )
      return data.intakes
    },

    /** Convert an intake to a case */
    async convert(
      intakeId: string,
      payload: ConvertIntakeInput
    ): Promise<ConvertIntakeResult> {
      return apiFetch<ConvertIntakeResult>(
        `/intakes/${intakeId}/convert`,
        opts,
        {
          method: 'POST',
          body: JSON.stringify({
            case_subtype: payload.caseSubtype,
            urgency: payload.urgency,
            description: payload.description,
            attorney_id: payload.attorneyId || null,
          }),
        }
      )
    },
  }
}

export type IntakeService = ReturnType<typeof createIntakeService>
