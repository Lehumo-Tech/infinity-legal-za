import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { requirePermission, createAuditLog, ROLES } from '@/lib/rbac'
import { createNotification } from '@/lib/notifications'
export const dynamic = 'force-dynamic'

/**
 * GET /api/leads — List leads based on role
 */
export async function GET(request) {
  try {
    const { user, error, status } = await requirePermission(request, 'VIEW_LEADS')
    if (error) return NextResponse.json({ error }, { status })

    const role = user.profile?.role
    const url = new URL(request.url)
    const statusFilter = url.searchParams.get('status')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const search = url.searchParams.get('search')

    const db = await getDb()
    const filter = {}

    // Intake agents only see their own leads
    if (role === ROLES.INTAKE_AGENT) {
      filter.intake_agent_id = user.id
    }

    // Paralegals see leads assigned to them
    if (role === ROLES.PARALEGAL) {
      filter.assigned_paralegal_id = user.id
    }

    if (statusFilter && statusFilter !== 'all') {
      filter.status = statusFilter
    }

    if (search) {
      filter['$or'] = [
        { full_name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
    }

    const leads = await db.collection('leads')
      .find(filter)
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray()

    // Get counts by status for summary
    const pipeline = [
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]
    const statusCounts = await db.collection('leads').aggregate(pipeline).toArray()
    const summary = {
      total: leads.length,
      new: 0, contacted: 0, qualified: 0, converted: 0, lost: 0,
    }
    statusCounts.forEach(s => { if (summary[s._id] !== undefined) summary[s._id] = s.count })
    summary.total = statusCounts.reduce((acc, s) => acc + s.count, 0)

    return NextResponse.json({ leads, summary })
  } catch (err) {
    console.error('Leads GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/leads — Create a new lead
 */
export async function POST(request) {
  try {
    const { user, error, status } = await requirePermission(request, 'CREATE_LEAD')
    if (error) return NextResponse.json({ error }, { status })

    const body = await request.json()
    const { fullName, email, phone, source, caseType, urgency, description } = body

    if (!fullName) {
      return NextResponse.json({ error: 'Lead name is required' }, { status: 400 })
    }

    const db = await getDb()
    const leadId = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    
    const lead = {
      id: leadId,
      full_name: fullName,
      email: email || null,
      phone: phone || null,
      source: source || 'web',
      case_type: caseType || null,
      urgency: urgency || 'medium',
      description: description || null,
      intake_agent_id: user.id,
      intake_agent_name: user.profile?.full_name || user.email,
      status: 'new',
      assigned_paralegal_id: null,
      assigned_officer_id: null,
      qualified_at: null,
      qualification_notes: null,
      paralegal_sla_deadline: null,
      officer_sla_deadline: null,
      converted_case_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    await db.collection('leads').insertOne(lead)

    // Audit log
    try {
      await createAuditLog({
        userId: user.id,
        action: 'CREATE_LEAD',
        resourceType: 'lead',
        resourceId: leadId,
        details: { fullName, caseType, source },
      })
    } catch (e) { console.error('Audit log error:', e) }

    return NextResponse.json({ lead }, { status: 201 })
  } catch (err) {
    console.error('Leads POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/leads — Update lead (qualify, assign, convert, etc.)
 */
export async function PUT(request) {
  try {
    const { user, error, status } = await requirePermission(request, 'VIEW_LEADS')
    if (error) return NextResponse.json({ error }, { status })

    const body = await request.json()
    const { leadId, action: leadAction, ...updateData } = body
    const role = user.profile?.role

    if (!leadId) return NextResponse.json({ error: 'leadId is required' }, { status: 400 })

    const db = await getDb()
    const lead = await db.collection('leads').findOne({ id: leadId })
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

    const updates = { updated_at: new Date().toISOString() }

    // QUALIFY
    if (leadAction === 'qualify') {
      updates.status = 'qualified'
      updates.qualified_at = new Date().toISOString()
      updates.qualification_notes = updateData.notes || null
    }

    // CONTACT
    else if (leadAction === 'contact') {
      updates.status = 'contacted'
      updates.contacted_at = new Date().toISOString()
      updates.contact_notes = updateData.notes || null
    }

    // ASSIGN TO PARALEGAL
    else if (leadAction === 'assign_paralegal') {
      if (!updateData.paralegalId) return NextResponse.json({ error: 'paralegalId required' }, { status: 400 })
      updates.assigned_paralegal_id = updateData.paralegalId
      updates.assigned_to_paralegal_at = new Date().toISOString()
      updates.paralegal_sla_deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

      try {
        await createNotification({
          userId: updateData.paralegalId,
          type: 'lead_assignment',
          title: 'New Lead Assigned',
          message: `A qualified lead (${lead.full_name}) has been assigned to you for preparation.`,
          link: '/portal/leads',
        })
      } catch (e) { console.error('Notification error:', e) }
    }

    // READY FOR STRATEGY
    else if (leadAction === 'ready_for_strategy') {
      if (!updateData.officerId) return NextResponse.json({ error: 'officerId required' }, { status: 400 })
      updates.assigned_officer_id = updateData.officerId
      updates.assigned_to_officer_at = new Date().toISOString()
      updates.officer_sla_deadline = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

      try {
        await createNotification({
          userId: updateData.officerId,
          type: 'lead_assignment',
          title: 'Case Ready for Strategy',
          message: `Lead ${lead.full_name} has been prepared and is ready for your review.`,
          link: '/portal/leads',
        })
      } catch (e) { console.error('Notification error:', e) }
    }

    // CONVERT TO CASE
    else if (leadAction === 'convert') {
      updates.status = 'converted'
      updates.converted_at = new Date().toISOString()
      if (updateData.caseId) updates.converted_case_id = updateData.caseId
    }

    // MARK AS LOST
    else if (leadAction === 'lost') {
      updates.status = 'lost'
      updates.lost_reason = updateData.reason || null
      updates.lost_at = new Date().toISOString()
    }

    // GENERIC UPDATE
    else {
      if (updateData.status) updates.status = updateData.status
      if (updateData.description) updates.description = updateData.description
      if (updateData.qualificationNotes) updates.qualification_notes = updateData.qualificationNotes
    }

    await db.collection('leads').updateOne({ id: leadId }, { $set: updates })
    const updatedLead = await db.collection('leads').findOne({ id: leadId })

    // Audit log
    try {
      await createAuditLog({
        userId: user.id,
        action: `LEAD_${(leadAction || 'UPDATE').toUpperCase()}`,
        resourceType: 'lead',
        resourceId: leadId,
        details: { leadAction, updates },
      })
    } catch (e) { console.error('Audit log error:', e) }

    return NextResponse.json({ lead: updatedLead })
  } catch (err) {
    console.error('Leads PUT error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
