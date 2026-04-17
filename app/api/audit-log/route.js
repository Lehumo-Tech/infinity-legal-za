import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
export const dynamic = 'force-dynamic'

// POST /api/audit-log — Log a POPIA audit event
export async function POST(request) {
  try {
    const body = await request.json()
    const { action, userId, userEmail, resource, resourceId, details } = body

    const db = await getDb()
    const entry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      action: action || 'unknown',
      userId: userId || 'system',
      userEmail: userEmail || '',
      resource: resource || '',
      resourceId: resourceId || '',
      details: details || '',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      timestamp: new Date().toISOString(),
    }

    await db.collection('audit_log').insertOne(entry)
    return NextResponse.json({ success: true, auditId: entry.id }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET /api/audit-log — View POPIA audit trail (admin only)
export async function GET(request) {
  try {
    const db = await getDb()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')
    const limit = parseInt(searchParams.get('limit') || '100')

    const filter = {}
    if (userId) filter.userId = userId
    if (action) filter.action = action

    const logs = await db.collection('audit_log').find(filter).sort({ timestamp: -1 }).limit(limit).toArray()
    const totalCount = await db.collection('audit_log').countDocuments(filter)

    // Action summary
    const actions = await db.collection('audit_log').aggregate([
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).toArray()

    return NextResponse.json({
      success: true,
      total: totalCount,
      showing: logs.length,
      actionSummary: actions.map(a => ({ action: a._id, count: a.count })),
      logs,
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
