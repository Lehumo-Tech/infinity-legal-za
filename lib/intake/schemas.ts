/**
 * Infinity Legal — Intake Zod Schemas
 * Validation schemas for all intake forms. No framework imports.
 */
import { z } from 'zod'

export const intakeResponsesSchema = z.object({
  problem: z
    .string()
    .min(20, 'Please describe your problem in at least 20 characters')
    .max(5000, 'Description must be under 5000 characters'),
  timeline: z
    .string()
    .min(5, 'Please provide a timeline')
    .max(2000, 'Timeline must be under 2000 characters'),
  outcome: z
    .string()
    .min(5, 'Please describe your desired outcome')
    .max(2000, 'Outcome must be under 2000 characters'),
  parties: z.string().max(2000, 'Parties must be under 2000 characters').default(''),
  documents: z.string().max(2000, 'Documents must be under 2000 characters').default(''),
})

export const intakeSubmitSchema = z.object({
  responses: intakeResponsesSchema,
  selectedCategory: z
    .enum([
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
    ])
    .nullable()
    .default(null),
  isUrgent: z.boolean().default(false),
})

export const convertIntakeSchema = z.object({
  caseSubtype: z.string().min(1, 'Case title is required').max(200),
  urgency: z.enum(['low', 'medium', 'high', 'emergency']).default('medium'),
  description: z.string().max(5000).default(''),
  attorneyId: z.string().optional(),
})

export const intakeFiltersSchema = z.object({
  status: z.enum(['all', 'pending', 'reviewed', 'converted', 'dismissed']).default('pending'),
  category: z.string().default(''),
  search: z.string().default(''),
})

export type IntakeResponsesInput = z.infer<typeof intakeResponsesSchema>
export type IntakeSubmitInput = z.infer<typeof intakeSubmitSchema>
export type ConvertIntakeInput = z.infer<typeof convertIntakeSchema>
export type IntakeFiltersInput = z.infer<typeof intakeFiltersSchema>
