import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getUserFromRequest } from '@/lib/rbac'
export const dynamic = 'force-dynamic'

/**
 * GET /api/cases/[id]/timeline
 * Fetch chronological activity feed for a case
 */
export async function GET(request, { params }) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: caseId } = await params

  try {
    const db = await getDb()
    const entries = await db.collection('case_timeline')
      .find({ caseId })
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray()

    return NextResponse.json({
      entries: entries.map(e => ({
        id: e.id, caseId: e.caseId,
        type: e.type || 'activity',
        action: e.action || '',
        description: e.description || '',
        userId: e.userId, userName: e.userName || '',
        metadata: e.metadata || {},
        createdAt: e.createdAt,
      }))
    })
  } catch (err) {
    console.error('Timeline GET error:', err)
    return NextResponse.json({ entries: [] })
  }
}

/**
 * POST /api/cases/[id]/timeline
 * Add a timeline entry
 */
export async function POST(request, { params }) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: caseId } = await params

  try {
    const body = await request.json()
    const { type, action, description, metadata } = body

    const db = await getDb()
    const now = new Date().toISOString()
    const entryId = `tl_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`

    const entry = {
      id: entryId, caseId,
      type: type || 'activity',
      action: action || 'note',
      description: (description || '').trim(),
      userId: user.id,
      userName: user.profile?.full_name || user.email,
      metadata: metadata || {},
      createdAt: now,
    }

    await db.collection('case_timeline').insertOne(entry)
    return NextResponse.json({ entry }, { status: 201 })
  } catch (err) {
    console.error('Timeline POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
