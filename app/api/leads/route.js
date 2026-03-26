import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requirePermission, createAuditLog, ROLES } from '@/lib/rbac'
import { createNotification } from '@/lib/notifications'

/**
 * GET /api/leads — List leads based on role
 */
export async function GET(request) {
  const { user, error, status } = await requirePermission(request, 'VIEW_LEADS')
  if (error) return NextResponse.json({ error }, { status })

  const role = user.profile?.role
  const url = new URL(request.url)
  const statusFilter = url.searchParams.get('status')
  const limit = parseInt(url.searchParams.get('limit') || '50')

  let query = supabaseAdmin
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  // Intake agents only see their own leads
  if (role === ROLES.INTAKE_AGENT) {
    query = query.eq('intake_agent_id', user.id)
  }

  // Paralegals see leads assigned to them
  if (role === ROLES.PARALEGAL) {
    query = query.eq('assigned_paralegal_id', user.id)
  }

  if (statusFilter) {
    query = query.eq('status', statusFilter)
  }

  const { data, error: dbErr } = await query
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  return NextResponse.json({ leads: data || [] })
}

/**
 * POST /api/leads — Create a new lead (Intake Agents or Managing Partners)
 */
export async function POST(request) {
  const { user, error, status } = await requirePermission(request, 'CREATE_LEAD')
  if (error) return NextResponse.json({ error }, { status })

  const body = await request.json()
  const { fullName, email, phone, source, caseType, urgency, description } = body

  if (!fullName) {
    return NextResponse.json({ error: 'Lead name is required' }, { status: 400 })
  }

  const { data, error: dbErr } = await supabaseAdmin
    .from('leads')
    .insert([{
      full_name: fullName,
      email: email || null,
      phone: phone || null,
      source: source || 'web',
      case_type: caseType || null,
      urgency: urgency || 'medium',
      description: description || null,
      intake_agent_id: user.id,
      status: 'new',
    }])
    .select()
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  // Audit log
  await createAuditLog({
    userId: user.id,
    action: 'CREATE_LEAD',
    resourceType: 'lead',
    resourceId: data.id,
    details: { fullName, caseType, source },
  })

  return NextResponse.json({ lead: data }, { status: 201 })
}

/**
 * PUT /api/leads — Update lead (qualify, assign, etc.)
 */
export async function PUT(request) {
  const { user, error, status } = await requirePermission(request, 'VIEW_LEADS')
  if (error) return NextResponse.json({ error }, { status })

  const body = await request.json()
  const { leadId, action: leadAction, ...updateData } = body
  const role = user.profile?.role

  if (!leadId) return NextResponse.json({ error: 'leadId is required' }, { status: 400 })

  // Fetch the lead
  const { data: lead, error: fetchErr } = await supabaseAdmin
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single()

  if (fetchErr || !lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

  const updates = { updated_at: new Date().toISOString() }

  // QUALIFY — Intake Agent marks lead as qualified
  if (leadAction === 'qualify') {
    if (role !== ROLES.INTAKE_AGENT && role !== ROLES.MANAGING_PARTNER) {
      return NextResponse.json({ error: 'Only intake agents can qualify leads' }, { status: 403 })
    }
    updates.status = 'qualified'
    updates.qualified_at = new Date().toISOString()
    updates.qualification_notes = updateData.notes || null
  }

  // ASSIGN TO PARALEGAL — Officer assigns qualified lead
  else if (leadAction === 'assign_paralegal') {
    if (role !== ROLES.LEGAL_OFFICER && role !== ROLES.MANAGING_PARTNER && role !== ROLES.ATTORNEY) {
      return NextResponse.json({ error: 'Only officers can assign leads to paralegals' }, { status: 403 })
    }
    if (!updateData.paralegalId) return NextResponse.json({ error: 'paralegalId required' }, { status: 400 })
    updates.assigned_paralegal_id = updateData.paralegalId
    updates.assigned_to_paralegal_at = new Date().toISOString()
    updates.paralegal_sla_deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24hr SLA

    // Notify paralegal
    await createNotification({
      userId: updateData.paralegalId,
      type: 'lead_assignment',
      title: 'New Lead Assigned',
      message: `A qualified lead (${lead.full_name}) has been assigned to you for preparation.`,
      link: '/portal/paralegal',
    })
  }

  // ASSIGN TO OFFICER — Paralegal marks ready for strategy
  else if (leadAction === 'ready_for_strategy') {
    if (role !== ROLES.PARALEGAL && role !== ROLES.MANAGING_PARTNER) {
      return NextResponse.json({ error: 'Only paralegals can mark leads ready for strategy' }, { status: 403 })
    }
    if (!updateData.officerId) return NextResponse.json({ error: 'officerId required' }, { status: 400 })
    updates.assigned_officer_id = updateData.officerId
    updates.assigned_to_officer_at = new Date().toISOString()
    updates.officer_sla_deadline = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // 48hr SLA

    // Notify officer
    await createNotification({
      userId: updateData.officerId,
      type: 'lead_assignment',
      title: 'Case Ready for Strategy',
      message: `Lead ${lead.full_name} has been prepared and is ready for your review.`,
      link: '/portal/officer',
    })
  }

  // CONVERT — Officer converts lead to case
  else if (leadAction === 'convert') {
    if (role !== ROLES.LEGAL_OFFICER && role !== ROLES.MANAGING_PARTNER && role !== ROLES.ATTORNEY) {
      return NextResponse.json({ error: 'Only officers can convert leads to cases' }, { status: 403 })
    }
    updates.status = 'converted'
  }

  // GENERIC UPDATE
  else {
    if (updateData.status) updates.status = updateData.status
    if (updateData.description) updates.description = updateData.description
    if (updateData.qualificationNotes) updates.qualification_notes = updateData.qualificationNotes
  }

  const { data, error: updateErr } = await supabaseAdmin
    .from('leads')
    .update(updates)
    .eq('id', leadId)
    .select()
    .single()

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  // Audit log
  await createAuditLog({
    userId: user.id,
    action: `LEAD_${(leadAction || 'UPDATE').toUpperCase()}`,
    resourceType: 'lead',
    resourceId: leadId,
    details: { leadAction, updates },
  })

  return NextResponse.json({ lead: data })
}
