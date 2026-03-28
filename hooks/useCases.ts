'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  type CaseRecord,
  type CaseListFilters,
  computeCaseStats,
  filterCases,
  sortCases,
} from '@/lib/modules/cases'

export function useCases(token: string | null) {
  const [cases, setCases] = useState<CaseRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<CaseListFilters>({
    status: 'all',
    search: '',
    urgency: '',
    caseType: '',
  })

  const fetchCases = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/cases?role=attorney', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch cases')
      const data = await res.json()
      setCases(data.cases || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchCases()
  }, [fetchCases])

  const stats = useMemo(() => computeCaseStats(cases), [cases])
  const filtered = useMemo(() => sortCases(filterCases(cases, filters)), [cases, filters])

  return {
    cases: filtered,
    allCases: cases,
    stats,
    loading,
    error,
    filters,
    setFilters,
    refresh: fetchCases,
  }
}
