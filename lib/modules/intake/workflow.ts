/**
 * Step 2: Intake Workflow Logic
 * Pure business logic — no React/Next.js imports.
 */
import { intakeSchema, type IntakeValues } from './schema'

export interface IntakeResult {
  success: boolean
  caseId: string | null
  error: string | null
}

/** Check for duplicate / conflicting submissions */
function conflictCheck(_data: IntakeValues): boolean {
  // TODO: Replace with actual DB lookup
  return false
}

/** Persist intake to database */
function saveIntake(data: IntakeValues): string {
  const caseId = `IL-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`
  // TODO: Replace with actual MongoDB insert
  console.log('[Intake] Saved:', { caseId, name: `${data.firstName} ${data.lastName}`, type: data.caseType })
  return caseId
}

export async function submitIntake(data: IntakeValues): Promise<IntakeResult> {
  // 1. Validate
  const parsed = intakeSchema.safeParse(data)
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message || 'Validation failed'
    return { success: false, caseId: null, error: firstError }
  }

  // 2. Conflict check
  const hasConflict = conflictCheck(parsed.data)
  if (hasConflict) {
    return { success: false, caseId: null, error: 'A similar case is already open for this client.' }
  }

  // 3. Save
  try {
    const caseId = saveIntake(parsed.data)
    return { success: true, caseId, error: null }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to save intake'
    return { success: false, caseId: null, error: msg }
  }
}
