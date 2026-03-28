/**
 * Infinity Legal — Cases Module Types
 * Pure types, no framework imports.
 */

export type CaseStatus =
  | 'intake'
  | 'active'
  | 'under_review'
  | 'pending_court'
  | 'settlement'
  | 'closed'
  | 'archived'

export type CaseType =
  | 'criminal'
  | 'civil'
  | 'family'
  | 'labour'
  | 'commercial'
  | 'property'
  | 'other'

export type Urgency = 'low' | 'medium' | 'high' | 'emergency'

export interface CaseRecord {
  id: string
  case_number: string
  case_type: CaseType
  case_subtype: string
  status: CaseStatus
  urgency: Urgency
  client_id: string
  attorney_id: string | null
  court_date: string | null
  court_location: string | null
  summary_encrypted: string
  notes_encrypted: string | null
  created_at: string
  updated_at: string | null
  // Virtual fields
  title: string
  description: string
}

export interface CaseListFilters {
  status: CaseStatus | 'all'
  search: string
  urgency: Urgency | ''
  caseType: CaseType | ''
}

export interface CaseStats {
  total: number
  intake: number
  active: number
  underReview: number
  pendingCourt: number
  settlement: number
  closed: number
  archived: number
  emergency: number
}

export interface CaseTimelineEntry {
  id: string
  caseId: string
  type: 'status' | 'note' | 'document' | 'task' | 'message'
  action: string
  description: string
  userId: string
  userName: string
  metadata: Record<string, unknown>
  createdAt: string
}

export interface CreateCaseInput {
  case_type: CaseType
  case_subtype: string
  urgency: Urgency
  description: string
  client_id?: string
  attorney_id?: string
  court_date?: string
  court_location?: string
}

export interface UpdateCaseInput {
  id: string
  status?: CaseStatus
  urgency?: Urgency
  case_subtype?: string
  description?: string
  court_date?: string | null
  court_location?: string | null
  attorney_id?: string | null
}

export const STATUS_LABELS: Record<CaseStatus, string> = {
  intake: 'Intake',
  active: 'Active',
  under_review: 'Under Review',
  pending_court: 'Pending Court',
  settlement: 'In Settlement',
  closed: 'Closed',
  archived: 'Archived',
}

export const CASE_TYPE_LABELS: Record<CaseType, string> = {
  criminal: 'Criminal Law',
  civil: 'Civil Litigation',
  family: 'Family Law',
  labour: 'Labour Law',
  commercial: 'Commercial Law',
  property: 'Property Law',
  other: 'Other',
}

export const URGENCY_LABELS: Record<Urgency, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  emergency: 'Emergency',
}
