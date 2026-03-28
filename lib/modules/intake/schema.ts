/**
 * Step 1: Intake Validation Schema
 * Pure Zod — no framework imports.
 */
import { z } from 'zod'

const saPhoneRegex = /^(\+27|0)[1-9][0-9]{8}$/

export const intakeSchema = z.object({
  // Step 1: Contact
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be under 50 characters'),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be under 50 characters'),
  email: z
    .string()
    .email('Please enter a valid email address'),
  phone: z
    .string()
    .regex(saPhoneRegex, 'Please enter a valid SA phone number (+27… or 0…)'),

  // Step 2: Case Details
  caseType: z.enum(
    ['labour', 'criminal', 'family', 'civil', 'commercial', 'property', 'personal_injury', 'other'],
    { errorMap: () => ({ message: 'Please select a case type' }) }
  ),
  urgency: z.enum(
    ['low', 'medium', 'high', 'emergency'],
    { errorMap: () => ({ message: 'Please select an urgency level' }) }
  ),
  description: z
    .string()
    .min(20, 'Please describe your matter in at least 20 characters')
    .max(5000, 'Description must be under 5000 characters'),

  // Step 3: Parties
  opposingParty: z.string().max(200).default(''),
  opposingPartyContact: z.string().max(200).default(''),
  witnesses: z.string().max(1000).default(''),

  // Step 4: Documents
  hasDocuments: z.boolean().default(false),
  documentList: z.string().max(2000).default(''),
  incidentDate: z.string().default(''),

  // Step 5: Consent
  consent: z.literal(true, {
    errorMap: () => ({ message: 'You must consent to proceed' }),
  }),
  popiaConsent: z.literal(true, {
    errorMap: () => ({ message: 'POPIA consent is required' }),
  }),
})

export type IntakeValues = z.infer<typeof intakeSchema>

/** Fields validated per step */
export const STEP_FIELDS: Record<number, (keyof IntakeValues)[]> = {
  1: ['firstName', 'lastName', 'email', 'phone'],
  2: ['caseType', 'urgency', 'description'],
  3: ['opposingParty', 'opposingPartyContact', 'witnesses'],
  4: ['hasDocuments', 'documentList', 'incidentDate'],
  5: ['consent', 'popiaConsent'],
}

export const TOTAL_STEPS = 5
