/**
 * Infinity Legal — Cases Utilities
 * Pure functions, no framework imports.
 */
import type {
  CaseRecord,
  CaseStatus,
  CaseType,
  Urgency,
  CaseStats,
  CaseListFilters,
} from './types'

/* ─── Stats ─── */

export function computeCaseStats(cases: CaseRecord[]): CaseStats {
  return {
    total: cases.length,
    intake: cases.filter((c) => c.status === 'intake').length,
    active: cases.filter((c) => c.status === 'active').length,
    underReview: cases.filter((c) => c.status === 'under_review').length,
    pendingCourt: cases.filter((c) => c.status === 'pending_court').length,
    settlement: cases.filter((c) => c.status === 'settlement').length,
    closed: cases.filter((c) => c.status === 'closed').length,
    archived: cases.filter((c) => c.status === 'archived').length,
    emergency: cases.filter((c) => c.urgency === 'emergency' && c.status !== 'closed' && c.status !== 'archived').length,
  }
}

/* ─── Filtering ─── */

export function filterCases(
  cases: CaseRecord[],
  filters: CaseListFilters
): CaseRecord[] {
  let filtered = [...cases]

  if (filters.status !== 'all') {
    filtered = filtered.filter((c) => c.status === filters.status)
  }

  if (filters.urgency) {
    filtered = filtered.filter((c) => c.urgency === filters.urgency)
  }

  if (filters.caseType) {
    filtered = filtered.filter((c) => c.case_type === filters.caseType)
  }

  if (filters.search) {
    const q = filters.search.toLowerCase()
    filtered = filtered.filter(
      (c) =>
        c.case_number.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.case_subtype.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    )
  }

  return filtered
}

/* ─── Sorting ─── */

export function sortCases(cases: CaseRecord[]): CaseRecord[] {
  const urgencyOrder: Record<Urgency, number> = {
    emergency: 0,
    high: 1,
    medium: 2,
    low: 3,
  }
  const statusOrder: Record<CaseStatus, number> = {
    intake: 0,
    active: 1,
    under_review: 2,
    pending_court: 3,
    settlement: 4,
    closed: 5,
    archived: 6,
  }

  return [...cases].sort((a, b) => {
    // Active cases first
    const sa = statusOrder[a.status] ?? 9
    const sb = statusOrder[b.status] ?? 9
    if (sa !== sb) return sa - sb

    // Higher urgency first
    const ua = urgencyOrder[a.urgency] ?? 9
    const ub = urgencyOrder[b.urgency] ?? 9
    if (ua !== ub) return ua - ub

    // Newest first
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

/* ─── Display Helpers ─── */

export function getStatusColor(status: CaseStatus): string {
  const map: Record<CaseStatus, string> = {
    intake: 'bg-sky-100 text-sky-700',
    active: 'bg-emerald-100 text-emerald-700',
    under_review: 'bg-amber-100 text-amber-700',
    pending_court: 'bg-purple-100 text-purple-700',
    settlement: 'bg-orange-100 text-orange-700',
    closed: 'bg-gray-100 text-gray-500',
    archived: 'bg-gray-50 text-gray-400',
  }
  return map[status] || map.intake
}

export function getUrgencyColor(urgency: Urgency): string {
  const map: Record<Urgency, string> = {
    low: 'bg-emerald-100 text-emerald-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-orange-100 text-orange-700',
    emergency: 'bg-red-100 text-red-700',
  }
  return map[urgency] || map.medium
}

export function getUrgencyDot(urgency: Urgency): string {
  const map: Record<Urgency, string> = {
    low: 'text-emerald-500',
    medium: 'text-amber-500',
    high: 'text-orange-500',
    emergency: 'text-red-500',
  }
  return map[urgency] || map.medium
}

/* ─── Matter Number ─── */

export function generateMatterNumber(year: number, seq: number): string {
  return `IL-${year}-${String(seq).padStart(4, '0')}`
}

/* ─── Allowed Status Transitions ─── */

const TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  intake: ['active', 'closed'],
  active: ['under_review', 'pending_court', 'settlement', 'closed'],
  under_review: ['active', 'pending_court', 'closed'],
  pending_court: ['active', 'settlement', 'closed'],
  settlement: ['active', 'closed'],
  closed: ['archived', 'active'],
  archived: [],
}

export function canTransition(
  from: CaseStatus,
  to: CaseStatus
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false
}

export function getAvailableTransitions(current: CaseStatus): CaseStatus[] {
  return TRANSITIONS[current] || []
}

/* ─── Date Formatting ─── */

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
}
