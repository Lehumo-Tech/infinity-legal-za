'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import {
  createIntakeService,
  computeIntakeStats,
  sortIntakes,
  type IntakeSubmission,
  type IntakeListFilters,
  type IntakeService,
} from '@/lib/intake'

interface UseIntakeListReturn {
  intakes: IntakeSubmission[]
  loading: boolean
  error: string | null
  stats: ReturnType<typeof computeIntakeStats>
  filters: IntakeListFilters
  setFilter: <K extends keyof IntakeListFilters>(key: K, value: IntakeListFilters[K]) => void
  refresh: () => Promise<void>
}

export function useIntakeList(): UseIntakeListReturn {
  const [token, setToken] = useState<string | null>(null)
  const [intakes, setIntakes] = useState<IntakeSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<IntakeListFilters>({
    status: 'pending',
    category: '',
    search: '',
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.access_token) setToken(data.session.access_token)
    })
  }, [])

  const service: IntakeService | null = useMemo(
    () => (token ? createIntakeService({ token }) : null),
    [token]
  )

  const fetchIntakes = useCallback(async () => {
    if (!service) return
    setLoading(true)
    setError(null)
    try {
      const data = await service.list(filters)
      setIntakes(sortIntakes(data))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load intakes')
    } finally {
      setLoading(false)
    }
  }, [service, filters])

  useEffect(() => {
    if (token) fetchIntakes()
  }, [token, fetchIntakes])

  const setFilter = useCallback(
    <K extends keyof IntakeListFilters>(key: K, value: IntakeListFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const stats = useMemo(() => computeIntakeStats(intakes), [intakes])

  return { intakes, loading, error, stats, filters, setFilter, refresh: fetchIntakes }
}
