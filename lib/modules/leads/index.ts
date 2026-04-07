// Leads Module — Core Logic

import { getDb } from '@/lib/mongodb'
import { Lead, CreateLeadInput, UpdateLeadInput } from './types'
import { validateCreateLead, calculateLeadScore } from './schema'

function genId(): string {
  return `lead_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
}

export async function listLeads(filter?: { status?: string }): Promise<Lead[]> {
  const db = await getDb()
  const query: any = {}
  if (filter?.status && filter.status !== 'all') query.status = filter.status
  return db.collection('leads').find(query).sort({ created_at: -1 }).limit(200).toArray() as Promise<Lead[]>
}

export async function createLead(input: CreateLeadInput, userId: string): Promise<{ lead?: Lead; error?: string }> {
  const validation = validateCreateLead(input)
  if (!validation.valid) return { error: validation.errors.join('; ') }

  const db = await getDb()
  const name = input.fullName || input.name || ''
  const caseType = input.caseType || input.category || ''
  const score = calculateLeadScore({ caseType, urgency: input.urgency, email: input.email, phone: input.phone, description: input.description })

  const lead: Lead = {
    id: genId(),
    full_name: name.trim(),
    email: input.email || '',
    phone: input.phone || '',
    case_type: caseType,
    urgency: input.urgency || 'medium',
    description: input.description || '',
    source: input.source || 'manual',
    status: 'new',
    score,
    assigned_to: null,
    assigned_to_name: null,
    qualified_by: null,
    qualified_at: null,
    converted_case_id: null,
    notes: '',
    created_by: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  await db.collection('leads').insertOne(lead)
  return { lead }
}

export async function updateLead(input: UpdateLeadInput, userId: string, userEmail: string): Promise<{ lead?: Lead; error?: string }> {
  const db = await getDb()
  const leadId = input.leadId || input.id
  if (!leadId) return { error: 'Lead ID required' }

  const existing = await db.collection('leads').findOne({ id: leadId })
  if (!existing) return { error: 'Lead not found' }

  const updates: any = { updated_at: new Date().toISOString() }

  // Handle action-based updates
  if (input.action) {
    switch (input.action) {
      case 'qualify':
        updates.status = 'qualified'
        updates.qualified_by = userId
        updates.qualified_at = new Date().toISOString()
        break
      case 'disqualify':
        updates.status = 'unqualified'
        break
      case 'contact':
        updates.status = 'contacted'
        break
      case 'convert':
        updates.status = 'converted'
        break
      case 'lose':
        updates.status = 'lost'
        break
      case 'ready_for_strategy':
        updates.status = 'qualified'
        if (input.officerId) {
          updates.assigned_to = input.officerId
        }
        break
    }
  }

  // Handle direct status updates
  if (input.status) updates.status = input.status
  if (input.notes) updates.notes = (existing.notes ? existing.notes + '\n' : '') + `[${userEmail}] ${input.notes}`

  await db.collection('leads').updateOne({ id: leadId }, { $set: updates })
  const lead = await db.collection('leads').findOne({ id: leadId }) as Lead
  return { lead }
}

export async function convertLeadToCase(leadId: string, userId: string, userEmail: string): Promise<{ caseId?: string; error?: string }> {
  const db = await getDb()
  const lead = await db.collection('leads').findOne({ id: leadId })
  if (!lead) return { error: 'Lead not found' }

  // Create case from lead
  const year = new Date().getFullYear()
  const count = await db.collection('cases').countDocuments()
  const case_number = `IL-${year}-${String(count + 1).padStart(4, '0')}`
  const caseId = `case_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`

  const newCase = {
    id: caseId,
    case_number,
    title: `${lead.case_type || 'Legal'} matter — ${lead.full_name}`,
    case_type: lead.case_type || 'civil',
    description: lead.description || '',
    status: 'new',
    urgency: lead.urgency || 'medium',
    client_name: lead.full_name,
    sourceLeadId: leadId,
    createdBy: userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  await db.collection('cases').insertOne(newCase)
  await db.collection('leads').updateOne({ id: leadId }, {
    $set: { status: 'converted', converted_case_id: caseId, updated_at: new Date().toISOString() }
  })

  // Timeline entry
  await db.collection('case_timeline').insertOne({
    id: `tl_${Date.now()}`,
    caseId,
    action: 'case_created',
    description: `Legal matter created from lead: ${lead.full_name}`,
    userId,
    userName: userEmail,
    createdAt: new Date().toISOString(),
  })

  return { caseId }
}
