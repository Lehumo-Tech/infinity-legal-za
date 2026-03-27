import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getDb } from '@/lib/mongodb'
import { requirePermission, createAuditLog } from '@/lib/rbac'
export const dynamic = 'force-dynamic'

/**
 * GET /api/cases/archive - List archived cases
 */
export async function GET(request) {
  try {
    const { user, error, status } = await requirePermission(request, 'VIEW_CASES')
    if (error) return NextResponse.json({ error }, { status })

    const { data, error: dbErr } = await supabaseAdmin
      .from('cases')
      .select('*')
      .eq('status', 'archived')
      .order('created_at', { ascending: false })
      .limit(100)

    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

    return NextResponse.json({ cases: data || [], readOnly: true })
  } catch (err) {
    console.error('Archive GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/cases/archive - Archive a closed case or auto-archive old cases
 */
export async function POST(request) {
  try {
    const { user, error, status } = await requirePermission(request, 'MANAGE_CASES')
    if (error) return NextResponse.json({ error }, { status })

    const body = await request.json()
    const { caseId, action } = body

    // Auto-archive: archive all closed cases older than 30 days
    if (action === 'auto_archive') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

      const { data: eligibleCases, error: fetchErr } = await supabaseAdmin
        .from('cases')
        .select('id, case_number')
        .eq('status', 'closed')
        .lt('created_at', thirtyDaysAgo)

      if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })

      if (!eligibleCases?.length) {
        return NextResponse.json({ message: 'No cases eligible for archiving', archived: 0 })
      }

      const ids = eligibleCases.map(c => c.id)
      const { error: updateErr } = await supabaseAdmin
        .from('cases')
        .update({ status: 'archived' })
        .in('id', ids)

      if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

      // Add timeline entries
      const db = await getDb()
      const timelineEntries = eligibleCases.map(c => ({
        id: `tl_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        caseId: c.id,
        type: 'status',
        action: 'case_archived',
        description: `Case ${c.case_number} auto-archived (closed >30 days)`,
        userId: user.id,
        userName: 'System',
        metadata: { reason: 'auto_archive_30_days' },
        createdAt: new Date().toISOString(),
      }))
      try { await db.collection('case_timeline').insertMany(timelineEntries) } catch (e) {}

      await createAuditLog({
        userId: user.id,
        action: 'AUTO_ARCHIVE_CASES',
        resourceType: 'case',
        resourceId: 'batch',
        details: { count: ids.length, caseNumbers: eligibleCases.map(c => c.case_number) },
      })

      return NextResponse.json({
        message: `${ids.length} cases archived successfully`,
        archived: ids.length,
        cases: eligibleCases.map(c => c.case_number),
      })
    }

    // Single case archive
    if (!caseId) return NextResponse.json({ error: 'caseId is required' }, { status: 400 })

    const { data: caseData, error: fetchErr } = await supabaseAdmin
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .single()

    if (fetchErr || !caseData) return NextResponse.json({ error: 'Case not found' }, { status: 404 })

    if (caseData.status !== 'closed') {
      return NextResponse.json({ error: 'Only closed cases can be archived' }, { status: 400 })
    }

    const { data, error: updateErr } = await supabaseAdmin
      .from('cases')
      .update({ status: 'archived' })
      .eq('id', caseId)
      .select()
      .single()

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

    // Timeline entry
    const db = await getDb()
    await db.collection('case_timeline').insertOne({
      id: `tl_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      caseId,
      type: 'status',
      action: 'case_archived',
      description: `Case ${data.case_number} archived by ${user.profile?.full_name || user.email}`,
      userId: user.id,
      userName: user.profile?.full_name || user.email,
      metadata: { previousStatus: 'closed' },
      createdAt: new Date().toISOString(),
    })

    await createAuditLog({
      userId: user.id,
      action: 'ARCHIVE_CASE',
      resourceType: 'case',
      resourceId: caseId,
      details: { caseNumber: data.case_number },
    })

    return NextResponse.json({
      case: data,
      message: `Case ${data.case_number} archived successfully. It is now read-only.`,
    })
  } catch (err) {
    console.error('Archive POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
