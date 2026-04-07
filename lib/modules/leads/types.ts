// Leads Module — Type Definitions

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted' | 'lost'
export type LeadUrgency = 'low' | 'medium' | 'high' | 'emergency'
export type LeadSource = 'call' | 'web' | 'referral' | 'walk_in' | 'social_media' | 'website' | 'manual'

export interface Lead {
  id: string
  full_name: string
  email: string
  phone: string
  case_type: string
  urgency: LeadUrgency
  description: string
  source: LeadSource
  status: LeadStatus
  score: number
  assigned_to: string | null
  assigned_to_name: string | null
  qualified_by: string | null
  qualified_at: string | null
  converted_case_id: string | null
  notes: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface CreateLeadInput {
  fullName: string
  email?: string
  phone?: string
  caseType?: string
  urgency?: LeadUrgency
  description?: string
  source?: LeadSource
  // Also accept flat field names
  name?: string
  category?: string
}

export interface UpdateLeadInput {
  leadId?: string
  id?: string
  action?: 'qualify' | 'disqualify' | 'contact' | 'convert' | 'lose' | 'ready_for_strategy'
  status?: LeadStatus
  notes?: string
  officerId?: string
}
