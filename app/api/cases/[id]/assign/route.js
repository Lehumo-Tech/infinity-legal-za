import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUserFromRequest, hasPermission, createAuditLog } from '@/lib/rbac'
import { createNotification } from '@/lib/notifications'
export const dynamic = 'force-dynamic'

/**
 * PUT /api/cases/[id]/assign
 * Assign or reassign a case to attorneys/support team
 */
export async function PUT(request, { params }) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.profile?.role || 'client'
  if (!hasPermission(role, 'MANAGE_CASES')) {
    return NextResponse.json({ error: 'Only authorized personnel can assign cases' }, { status: 403 })
  }

  const { id: caseId } = await params

  try {
    const body = await request.json()
    const { leadAttorneyId, supportTeam, billingRate } = body

    // Update Supabase case with lead attorney
    const updateData = {}
    if (leadAttorneyId) updateData.attorney_id = leadAttorneyId

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabaseAdmin.from('cases').update(updateData).eq('id', caseId)
      if (error) {
        console.error('Case assign Supabase error:', error)
        return NextResponse.json({ error: 'Failed to update case assignment' }, { status: 500 })
      }
    }

    // Store extended assignment data in MongoDB
    const db = await getDb()
    const now = new Date().toISOString()

    await db.collection('case_metadata').updateOne(
      { caseId },
      {
        $set: {
          caseId,
          'assignment.leadAttorneyId': leadAttorneyId || null,
          'assignment.supportTeam': supportTeam || [],
          'assignment.billingRate': billingRate || null,
          'assignment.assignedBy': user.id,
          'assignment.assignedByName': user.profile?.full_name || user.email,
          'assignment.assignedAt': now,
          updatedAt: now,
        }
      },
      { upsert: true }
    )

    // Add timeline entry
    await db.collection('case_timeline').insertOne({
      id: `tl_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      caseId, type: 'assignment', action: 'case_assigned',
      description: `Case assigned to attorney`,
      userId: user.id, userName: user.profile?.full_name || user.email,
      metadata: { leadAttorneyId, supportTeam },
      createdAt: now,
    })

    // Notify assigned attorney
    if (leadAttorneyId) {
      try {
        await createNotification({
          userId: leadAttorneyId,
          type: 'case_update',
          title: 'New Case Assigned',
          message: `You have been assigned as lead attorney on case ${caseId}.`,
          link: '/portal/cases',
          metadata: { caseId },
        })
      } catch { /* ignore */ }
    }

    await createAuditLog({
      userId: user.id, action: 'CASE_ASSIGNED',
      resourceType: 'case', resourceId: caseId,
      details: { leadAttorneyId, supportTeam },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Case assign error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
