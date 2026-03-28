export { intakeSchema, STEP_FIELDS, TOTAL_STEPS } from './schema'
export type { IntakeValues } from './schema'
export {
  validateIntake,
  buildIntakeDocument,
  detectConflicts,
  generateReferenceId,
  mapCaseTypeToCategory,
} from './workflow'
export type { IntakeResult, IntakeDocument, ConflictResult } from './workflow'
