import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getUserFromRequest } from '@/lib/rbac'
export const dynamic = 'force-dynamic'

const DEFAULT_PREFS = {
  email_case_updates: true, email_task_assignments: true,
  email_document_workflow: true, email_announcements: true,
  email_leave_updates: true, email_billing_alerts: true,
  push_case_updates: true, push_task_deadlines: true,
  push_messages: true, push_calendar_reminders: true,
  digest_frequency: 'daily',
}

/**
 * GET /api/settings/notifications
 * Get user notification preferences
 */
export async function GET(request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const db = await getDb()
    const prefs = await db.collection('notification_preferences').findOne({ userId: user.id })
    return NextResponse.json({ preferences: prefs?.preferences || DEFAULT_PREFS })
  } catch (err) {
    console.error('Notification prefs GET error:', err)
    return NextResponse.json({ preferences: DEFAULT_PREFS })
  }
}

/**
 * PUT /api/settings/notifications
 * Update notification preferences
 */
export async function PUT(request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { preferences } = body

    if (!preferences) return NextResponse.json({ error: 'Preferences object required' }, { status: 400 })

    const db = await getDb()
    await db.collection('notification_preferences').updateOne(
      { userId: user.id },
      { $set: { userId: user.id, preferences, updatedAt: new Date().toISOString() } },
      { upsert: true }
    )

    return NextResponse.json({ success: true, preferences })
  } catch (err) {
    console.error('Notification prefs PUT error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
