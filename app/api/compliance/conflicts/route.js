import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getUserFromRequest, hasPermission, createAuditLog } from '@/lib/rbac'
import { supabase } from '@/lib/supabase'
export const dynamic = 'force-dynamic'

/**
 * GET /api/compliance/conflicts
 * List conflict check records
 */
export async function GET(request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.profile?.role || 'client'
  if (!hasPermission(role, 'VIEW_COMPLIANCE')) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  try {
    const db = await getDb()
    const checks = await db.collection('conflict_checks')
      .find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray()

    return NextResponse.json({
      checks: checks.map(c => ({
        id: c.id, clientName: c.clientName, adverseParty: c.adverseParty,
        caseType: c.caseType || '', caseId: c.caseId || null,
        status: c.status || 'pending',
        result: c.result || null,
        conflictsFound: c.conflictsFound || [],
        checkedBy: c.checkedBy, checkedByName: c.checkedByName || '',
        resolvedBy: c.resolvedBy || null, resolvedByName: c.resolvedByName || '',
        notes: c.notes || '', createdAt: c.createdAt,
      }))
    })
  } catch (err) {
    console.error('Conflicts GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/compliance/conflicts
 * Run a conflict check against existing cases and clients
 */
export async function POST(request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.profile?.role || 'client'
  if (!hasPermission(role, 'VIEW_COMPLIANCE')) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { clientName, adverseParty, caseType, caseId } = body

    if (!clientName || !adverseParty) {
      return NextResponse.json({ error: 'Client name and adverse party required' }, { status: 400 })
    }

    // Search for potential conflicts in existing cases
    const conflictsFound = []

    // Check Supabase cases
    try {
      const clientSearch = clientName.toLowerCase()
      const adverseSearch = adverseParty.toLowerCase()

      const { data: cases } = await supabase.from('cases')
        .select('id, case_number, case_type, status, client_name, adverse_party, attorney_id')
        .limit(500)

      if (cases) {
        cases.forEach(c => {
          const cClientName = (c.client_name || '').toLowerCase()
          const cAdverse = (c.adverse_party || '').toLowerCase()

          // Client is adverse party in another case
          if (cAdverse.includes(clientSearch) || clientSearch.includes(cAdverse)) {
            conflictsFound.push({
              type: 'direct_conflict',
              severity: 'high',
              caseId: c.id,
              caseNumber: c.case_number,
              description: `Client "${clientName}" appears as adverse party in case ${c.case_number || c.id}`,
            })
          }

          // Adverse party is client in another case
          if (cClientName.includes(adverseSearch) || adverseSearch.includes(cClientName)) {
            conflictsFound.push({
              type: 'adverse_conflict',
              severity: 'high',
              caseId: c.id,
              caseNumber: c.case_number,
              description: `Adverse party "${adverseParty}" is a client in case ${c.case_number || c.id}`,
            })
          }

          // Same client + same adverse party (duplicate)
          if (cClientName.includes(clientSearch) && cAdverse.includes(adverseSearch)) {
            conflictsFound.push({
              type: 'potential_duplicate',
              severity: 'medium',
              caseId: c.id,
              caseNumber: c.case_number,
              description: `Similar matter exists: ${c.case_number || c.id} (${c.case_type})`,
            })
          }
        })
      }
    } catch (dbErr) {
      console.error('Conflict DB search error:', dbErr)
    }

    const db = await getDb()
    const now = new Date().toISOString()
    const checkId = `cc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`

    const check = {
      id: checkId, clientName: clientName.trim(), adverseParty: adverseParty.trim(),
      caseType: caseType || '', caseId: caseId || null,
      status: conflictsFound.length > 0 ? 'conflicts_found' : 'clear',
      result: conflictsFound.length > 0 ? 'conflicts_detected' : 'no_conflicts',
      conflictsFound,
      checkedBy: user.id,
      checkedByName: user.profile?.full_name || user.email,
      resolvedBy: null, resolvedByName: null, notes: '',
      createdAt: now,
    }

    await db.collection('conflict_checks').insertOne(check)

    await createAuditLog({
      userId: user.id, action: 'CONFLICT_CHECK',
      resourceType: 'conflict_check', resourceId: checkId,
      details: { clientName, adverseParty, conflictsCount: conflictsFound.length },
    })

    return NextResponse.json({ check }, { status: 201 })
  } catch (err) {
    console.error('Conflicts POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
