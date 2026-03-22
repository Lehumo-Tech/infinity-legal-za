import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

async function getUserFromRequest(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  const token = authHeader.split(' ')[1]
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  return user
}

// GET /api/notifications - Get user's notifications
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')

    const db = await getDb()
    const filter = { userId: user.id }
    if (unreadOnly) filter.isRead = false

    const notifications = await db.collection('notifications')
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()

    // Get unread count
    const unreadCount = await db.collection('notifications')
      .countDocuments({ userId: user.id, isRead: false })

    // Convert ObjectIds to strings
    const formatted = notifications.map(n => ({
      id: n.id || n._id.toString(),
      type: n.type,
      title: n.title,
      message: n.message,
      link: n.link,
      isRead: n.isRead,
      metadata: n.metadata,
      createdAt: n.createdAt
    }))

    return NextResponse.json({ notifications: formatted, unreadCount })
  } catch (error) {
    console.error('Notifications GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/notifications - Mark notifications as read
export async function PUT(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notificationId, markAllRead } = body

    const db = await getDb()

    if (markAllRead) {
      await db.collection('notifications').updateMany(
        { userId: user.id, isRead: false },
        { $set: { isRead: true } }
      )
      return NextResponse.json({ message: 'All notifications marked as read' })
    }

    if (notificationId) {
      await db.collection('notifications').updateOne(
        { id: notificationId, userId: user.id },
        { $set: { isRead: true } }
      )
      return NextResponse.json({ message: 'Notification marked as read' })
    }

    return NextResponse.json({ error: 'Provide notificationId or markAllRead' }, { status: 400 })
  } catch (error) {
    console.error('Notifications PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
