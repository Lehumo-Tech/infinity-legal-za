/**
 * Infinity Legal — Intake Module Types
 * Pure types, no framework imports.
 */

export interface IntakeResponses {
  problem: string
  timeline: string
  outcome: string
  parties: string
  documents: string
}

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'emergency'

export type IntakeStatus = 'pending' | 'reviewed' | 'converted' | 'dismissed'

export type LegalCategory =
  | 'Criminal Law'
  | 'Family Law'
  | 'Labour Law'
  | 'Personal Injury'
  | 'Property Law'
  | 'Debt Recovery'
  | 'Civil Litigation'
  | 'Commercial Law'
  | 'Administrative Law'
  | 'Other'

export interface IntakeAnalysis {
  category: LegalCategory
  subcategory: string
  urgency: UrgencyLevel
  confidence: number
  summary: string
  nextSteps: string[]
  relevantLegislation: string[]
  warnings: string[]
  estimatedCostRange: string
  estimatedTimeline: string
}

export interface IntakeSubmission {
  id: string
  userId: string | null
  userEmail: string | null
  responses: IntakeResponses
  selectedCategory: LegalCategory | null
  isUrgent: boolean
  analysis: IntakeAnalysis
  status: IntakeStatus
  convertedCaseId: string | null
  convertedCaseNumber: string | null
  convertedBy: string | null
  convertedAt: string | null
  createdAt: string
}

export interface IntakeListFilters {
  status: IntakeStatus | 'all'
  category: LegalCategory | ''
  search: string
}

export interface ConvertIntakePayload {
  caseSubtype: string
  urgency: UrgencyLevel
  description: string
  attorneyId?: string
}

export interface ConvertIntakeResult {
  success: boolean
  caseNumber: string
  caseId: string
  message: string
}

export interface IntakeFormStep {
  id: number
  title: string
  description: string
  field: keyof IntakeResponses
  placeholder: string
  required: boolean
}

export const INTAKE_STEPS: IntakeFormStep[] = [
  {
    id: 1,
    title: 'Describe Your Legal Problem',
    description: 'Tell us what happened in as much detail as possible.',
    field: 'problem',
    placeholder: 'My employer fired me without any warning or due process...',
    required: true,
  },
  {
    id: 2,
    title: 'When Did This Happen?',
    description: 'Provide the timeline of events.',
    field: 'timeline',
    placeholder: 'This happened last week on Monday 15 March...',
    required: true,
  },
  {
    id: 3,
    title: 'What Outcome Do You Want?',
    description: 'Describe what you hope to achieve.',
    field: 'outcome',
    placeholder: 'I want compensation for unfair dismissal and...',
    required: true,
  },
  {
    id: 4,
    title: 'Who Is Involved?',
    description: 'List all parties involved in this matter.',
    field: 'parties',
    placeholder: 'My employer ABC Mining (Pty) Ltd, my manager John...',
    required: false,
  },
  {
    id: 5,
    title: 'Do You Have Documents?',
    description: 'List any documents or evidence you have.',
    field: 'documents',
    placeholder: 'Employment contract, dismissal letter, payslips...',
    required: false,
  },
]

export const LEGAL_CATEGORIES: LegalCategory[] = [
  'Criminal Law',
  'Family Law',
  'Labour Law',
  'Personal Injury',
  'Property Law',
  'Debt Recovery',
  'Civil Litigation',
  'Commercial Law',
  'Administrative Law',
  'Other',
]
