/**
 * Infinity Legal — Intake Module Barrel Export
 */
export * from './types'
export * from './schemas'
export { createIntakeService } from './service'
export type { IntakeService } from './service'
export {
  computeIntakeStats,
  sortIntakes,
  getUrgencyColor,
  getStatusColor,
  formatDate,
  buildCaseNoteFromAnalysis,
} from './utils'
