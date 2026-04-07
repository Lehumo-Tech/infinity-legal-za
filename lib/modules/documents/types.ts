// Documents Module — Type Definitions

export type DocWorkflowStatus = 'draft' | 'review' | 'approved' | 'rejected' | 'signed'
export type DocCategory = 'general' | 'contract' | 'pleading' | 'correspondence' | 'affidavit' | 'notice' | 'agreement' | 'compliance'

export interface Document {
  id: string
  file_name: string
  file_type: string
  document_category: DocCategory
  workflow_status: DocWorkflowStatus
  version: number
  case_id: string | null
  case_name: string | null
  content: string
  created_by: string
  created_by_name: string
  created_at: string
  updated_at: string
}

export interface DocumentVersion {
  id: string
  document_id: string
  version: number
  fileName: string
  filePath: string
  changeNotes: string
  uploadedBy: string
  uploadedByName: string
  createdAt: string
}

export interface DocumentLock {
  document_id: string
  lockedBy: string
  lockedByName: string
  lockedAt: string
}

export interface DocumentTemplate {
  id: string
  name: string
  description: string
  category: string
  content: string
  tags: string[]
  usageCount: number
  createdBy: string
  createdByName: string
  createdAt: string
  updatedAt: string
}

// Workflow transition rules
export const WORKFLOW_TRANSITIONS: Record<DocWorkflowStatus, DocWorkflowStatus[]> = {
  draft: ['review'],
  review: ['approved', 'rejected'],
  approved: ['signed'],
  rejected: ['draft'],
  signed: [],
}
