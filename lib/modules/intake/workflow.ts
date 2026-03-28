/**
 * Intake Workflow Logic — Pure Business Logic
 * No React/Next.js/MongoDB imports. Only Zod + pure TS.
 */
import { intakeSchema, type IntakeValues } from './schema'

/* ─── Types ─── */

export interface IntakeResult {
  success: boolean
  referenceId: string | null
  error: string | null
}

export interface IntakeDocument {
  id: string
  source: 'public_wizard'
  contact: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  responses: {
    problem: string
    timeline: string
    outcome: string
    parties: string
    documents: string
  }
  selectedCategory: string | null
  isUrgent: boolean
  analysis: {
    category: string
    subcategory: string
    urgency: string
    confidence: number
    summary: string
    nextSteps: string[]
    relevantLegislation: string[]
    warnings: string[]
    estimatedCostRange: string
    estimatedTimeline: string
  }
  caseDetails: {
    caseType: string
    urgency: string
    description: string
    opposingParty: string
    opposingPartyContact: string
    witnesses: string
    hasDocuments: boolean
    documentList: string
    incidentDate: string
  }
  status: 'pending' | 'reviewed' | 'converted' | 'dismissed'
  convertedCaseId: string | null
  convertedCaseNumber: string | null
  convertedBy: string | null
  convertedAt: string | null
  createdAt: string
}

export interface ConflictResult {
  hasConflict: boolean
  reason: string | null
  matchedId: string | null
}

/* ─── Constants ─── */

const CASE_TYPE_TO_CATEGORY: Record<string, string> = {
  labour: 'Labour Law',
  criminal: 'Criminal Law',
  family: 'Family Law',
  civil: 'Civil Litigation',
  commercial: 'Commercial Law',
  property: 'Property Law',
  personal_injury: 'Personal Injury',
  other: 'Other',
}

/* ─── Pure Functions ─── */

/** Generate a unique reference ID for a new intake */
export function generateReferenceId(): string {
  const year = new Date().getFullYear()
  const seq = String(Date.now()).slice(-5)
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `IL-${year}-${seq}-${rand}`
}

/** Validate intake form data. Returns parsed data or first error message. */
export function validateIntake(
  data: unknown
): { success: true; data: IntakeValues } | { success: false; error: string } {
  const parsed = intakeSchema.safeParse(data)
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message || 'Validation failed'
    return { success: false, error: firstError }
  }
  return { success: true, data: parsed.data }
}

/** Map caseType enum value to a legal category string */
export function mapCaseTypeToCategory(caseType: string): string {
  return CASE_TYPE_TO_CATEGORY[caseType] || 'Other'
}

/**
 * Build a complete intake document ready for database insertion.
 * Pure data transformation — no side effects.
 */
export function buildIntakeDocument(
  data: IntakeValues,
  referenceId: string
): IntakeDocument {
  const category = mapCaseTypeToCategory(data.caseType)
  const isEmergency = data.urgency === 'emergency'
  const isHigh = data.urgency === 'high' || isEmergency

  return {
    id: referenceId,
    source: 'public_wizard',
    contact: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
    },
    responses: {
      problem: data.description,
      timeline: data.incidentDate || 'Not specified',
      outcome: 'To be discussed with attorney',
      parties: [data.opposingParty, data.opposingPartyContact, data.witnesses]
        .filter(Boolean)
        .join('; ') || 'Not specified',
      documents: data.hasDocuments ? (data.documentList || 'Has documents') : 'None',
    },
    selectedCategory: category,
    isUrgent: isHigh,
    analysis: {
      category,
      subcategory: category,
      urgency: data.urgency,
      confidence: 100,
      summary: `${data.firstName} ${data.lastName} submitted a ${category} intake via the public wizard. ${truncate(data.description, 150)}`,
      nextSteps: [
        'Review intake details and contact client',
        'Schedule initial consultation',
        'Verify conflict of interest check',
        isHigh ? 'Escalate — client marked matter as urgent' : 'Follow standard intake timeline',
      ],
      relevantLegislation: [],
      warnings: isEmergency
        ? ['Client flagged this as an EMERGENCY. Immediate action required.']
        : [],
      estimatedCostRange: 'To be assessed',
      estimatedTimeline: 'To be assessed',
    },
    caseDetails: {
      caseType: data.caseType,
      urgency: data.urgency,
      description: data.description,
      opposingParty: data.opposingParty || '',
      opposingPartyContact: data.opposingPartyContact || '',
      witnesses: data.witnesses || '',
      hasDocuments: data.hasDocuments,
      documentList: data.documentList || '',
      incidentDate: data.incidentDate || '',
    },
    status: 'pending',
    convertedCaseId: null,
    convertedCaseNumber: null,
    convertedBy: null,
    convertedAt: null,
    createdAt: new Date().toISOString(),
  }
}

/**
 * Detect conflicts against a list of existing intake records.
 * Matches on email + caseType within a 7-day window to prevent duplicates.
 * Pure function — caller provides existing records.
 */
export function detectConflicts(
  existingIntakes: Array<{
    id: string
    contact?: { email?: string }
    userEmail?: string | null
    caseDetails?: { caseType?: string }
    analysis?: { category?: string }
    createdAt: string
  }>,
  newEmail: string,
  newCaseType: string
): ConflictResult {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const newCategory = mapCaseTypeToCategory(newCaseType)

  for (const existing of existingIntakes) {
    const existingEmail =
      existing.contact?.email || existing.userEmail || ''
    const existingCategory =
      existing.caseDetails?.caseType
        ? mapCaseTypeToCategory(existing.caseDetails.caseType)
        : existing.analysis?.category || ''

    const emailMatch =
      existingEmail.toLowerCase() === newEmail.toLowerCase()
    const categoryMatch =
      existingCategory === newCategory
    const withinWindow =
      new Date(existing.createdAt).getTime() > sevenDaysAgo

    if (emailMatch && categoryMatch && withinWindow) {
      return {
        hasConflict: true,
        reason: `A ${newCategory} intake for ${newEmail} was already submitted on ${new Date(existing.createdAt).toLocaleDateString('en-ZA')}. Reference: ${existing.id}`,
        matchedId: existing.id,
      }
    }
  }

  return { hasConflict: false, reason: null, matchedId: null }
}

/* ─── Helpers ─── */

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen - 3) + '...'
}
