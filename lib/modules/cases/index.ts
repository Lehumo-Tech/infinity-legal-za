// Types
export type {
  CaseStatus,
  CaseType,
  Urgency,
  CaseRecord,
  CaseListFilters,
  CaseStats,
  CaseTimelineEntry,
  CreateCaseInput as CreateCasePayload,
  UpdateCaseInput as UpdateCasePayload,
} from './types'

export {
  STATUS_LABELS,
  CASE_TYPE_LABELS,
  URGENCY_LABELS,
} from './types'

// Schemas
export {
  createCaseSchema,
  updateCaseSchema,
  caseFiltersSchema,
  caseTypeEnum,
  caseStatusEnum,
  urgencyEnum,
} from './schema'
export type {
  CreateCaseInput,
  UpdateCaseInput,
  CaseFiltersInput,
} from './schema'

// Utilities
export {
  computeCaseStats,
  filterCases,
  sortCases,
  getStatusColor,
  getUrgencyColor,
  getUrgencyDot,
  generateMatterNumber,
  canTransition,
  getAvailableTransitions,
  formatDate,
  formatDateTime,
  daysSince,
} from './utils'
