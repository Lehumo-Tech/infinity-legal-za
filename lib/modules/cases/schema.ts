/**
 * Infinity Legal — Cases Zod Schemas
 * Validation schemas for case operations. No framework imports.
 */
import { z } from 'zod'

export const caseTypeEnum = z.enum(
  ['criminal', 'civil', 'family', 'labour', 'commercial', 'property', 'other'],
  { errorMap: () => ({ message: 'Please select a valid case type' }) }
)

export const caseStatusEnum = z.enum(
  ['intake', 'active', 'under_review', 'pending_court', 'settlement', 'closed', 'archived'],
  { errorMap: () => ({ message: 'Invalid case status' }) }
)

export const urgencyEnum = z.enum(
  ['low', 'medium', 'high', 'emergency'],
  { errorMap: () => ({ message: 'Please select an urgency level' }) }
)

export const createCaseSchema = z.object({
  case_type: caseTypeEnum,
  case_subtype: z
    .string()
    .min(2, 'Case title must be at least 2 characters')
    .max(200, 'Case title must be under 200 characters'),
  urgency: urgencyEnum.default('medium'),
  description: z
    .string()
    .max(5000, 'Description must be under 5000 characters')
    .default(''),
  client_id: z.string().uuid().optional(),
  attorney_id: z.string().uuid().optional(),
  court_date: z.string().optional(),
  court_location: z.string().max(500).optional(),
})

export const updateCaseSchema = z.object({
  id: z.string().uuid('Invalid case ID'),
  status: caseStatusEnum.optional(),
  urgency: urgencyEnum.optional(),
  case_subtype: z.string().min(2).max(200).optional(),
  description: z.string().max(5000).optional(),
  court_date: z.string().nullable().optional(),
  court_location: z.string().max(500).nullable().optional(),
  attorney_id: z.string().uuid().nullable().optional(),
})

export const caseFiltersSchema = z.object({
  status: z.enum(['all', 'intake', 'active', 'under_review', 'pending_court', 'settlement', 'closed', 'archived']).default('all'),
  search: z.string().default(''),
  urgency: z.enum(['', 'low', 'medium', 'high', 'emergency']).default(''),
  caseType: z.enum(['', 'criminal', 'civil', 'family', 'labour', 'commercial', 'property', 'other']).default(''),
})

export type CreateCaseInput = z.infer<typeof createCaseSchema>
export type UpdateCaseInput = z.infer<typeof updateCaseSchema>
export type CaseFiltersInput = z.infer<typeof caseFiltersSchema>
