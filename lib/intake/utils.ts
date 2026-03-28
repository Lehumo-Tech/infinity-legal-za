/**
 * Infinity Legal — Intake Utilities
 * Pure functions, no framework imports.
 */
import type {
  IntakeSubmission,
  UrgencyLevel,
  IntakeStatus,
  IntakeAnalysis,
} from './types'

/** Compute summary stats from an intake list */
export function computeIntakeStats(intakes: IntakeSubmission[]) {
  return {
    total: intakes.length,
    pending: intakes.filter((i) => i.status === 'pending').length,
    converted: intakes.filter((i) => i.status === 'converted').length,
    dismissed: intakes.filter((i) => i.status === 'dismissed').length,
    emergency: intakes.filter(
      (i) => i.analysis?.urgency === 'emergency' && i.status === 'pending'
    ).length,
  }
}

/** Sort intakes: emergency first, then by date descending */
export function sortIntakes(intakes: IntakeSubmission[]): IntakeSubmission[] {
  const urgencyOrder: Record<UrgencyLevel, number> = {
    emergency: 0,
    high: 1,
    medium: 2,
    low: 3,
  }
  return [...intakes].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1
    if (a.status !== 'pending' && b.status === 'pending') return 1
    const ua = urgencyOrder[a.analysis?.urgency || 'medium']
    const ub = urgencyOrder[b.analysis?.urgency || 'medium']
    if (ua !== ub) return ua - ub
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}

export function getUrgencyColor(urgency: UrgencyLevel): string {
  const map: Record<UrgencyLevel, string> = {
    low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    emergency: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }
  return map[urgency] || map.medium
}

export function getStatusColor(status: IntakeStatus): string {
  const map: Record<IntakeStatus, string> = {
    pending: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
    reviewed: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    converted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    dismissed: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
  }
  return map[status] || map.pending
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function buildCaseNoteFromAnalysis(analysis: IntakeAnalysis): string {
  const sections = [
    `## AI Intake Analysis`,
    `**Category:** ${analysis.category}`,
    `**Subcategory:** ${analysis.subcategory}`,
    `**Urgency:** ${analysis.urgency}`,
    `**Confidence:** ${analysis.confidence}%`,
    ``,
    `**Summary:**`,
    analysis.summary,
    ``,
    `**Next Steps:**`,
    ...analysis.nextSteps.map((s, i) => `${i + 1}. ${s}`),
    ``,
    `**Relevant Legislation:**`,
    ...analysis.relevantLegislation.map((l) => `- ${l}`),
    ``,
    `**Estimated Cost:** ${analysis.estimatedCostRange}`,
    `**Estimated Timeline:** ${analysis.estimatedTimeline}`,
  ]
  if (analysis.warnings.length > 0) {
    sections.push(``, `**Warnings:**`, ...analysis.warnings.map((w) => `- ${w}`))
  }
  return sections.join('\n')
}
