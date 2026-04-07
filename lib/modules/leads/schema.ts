// Leads Module — Validation & Scoring

import { CreateLeadInput, LeadUrgency } from './types'

const VALID_CASE_TYPES = ['criminal', 'family', 'labour', 'civil', 'property', 'commercial', 'other']
const VALID_URGENCIES: LeadUrgency[] = ['low', 'medium', 'high', 'emergency']
const VALID_SOURCES = ['call', 'web', 'referral', 'walk_in', 'social_media', 'website', 'manual']

export function validateCreateLead(input: CreateLeadInput): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const name = input.fullName || input.name
  if (!name || name.trim().length < 2) errors.push('Full name is required (min 2 chars)')
  if (input.urgency && !VALID_URGENCIES.includes(input.urgency)) errors.push(`Invalid urgency: ${input.urgency}`)
  if (input.source && !VALID_SOURCES.includes(input.source)) errors.push(`Invalid source: ${input.source}`)
  return { valid: errors.length === 0, errors }
}

export function calculateLeadScore(input: { caseType?: string; urgency?: string; email?: string; phone?: string; description?: string }): number {
  let score = 50
  if (input.urgency === 'emergency') score += 30
  else if (input.urgency === 'high') score += 20
  else if (input.urgency === 'medium') score += 10
  if (input.email) score += 10
  if (input.phone) score += 10
  if (input.description && input.description.length > 20) score += 5
  if (['labour', 'civil'].includes(input.caseType || '')) score += 5 // Higher value case types
  return Math.min(score, 100)
}
