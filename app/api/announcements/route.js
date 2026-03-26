import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getUserFromRequest, hasPermission } from '@/lib/rbac'
export const dynamic = 'force-dynamic'

/**
 * GET /api/announcements
 * Fetch firm-wide announcements
 */
export async function GET(request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const db = await getDb()
    const announcements = await db.collection('announcements')
      .find({ isActive: true })
      .sort({ pinned: -1, createdAt: -1 })
      .limit(50)
      .toArray()

    return NextResponse.json({
      announcements: announcements.map(a => ({
        id: a.id, title: a.title, content: a.content,
        category: a.category || 'general',
        priority: a.priority || 'normal',
        pinned: a.pinned || false,
        authorId: a.authorId, authorName: a.authorName || '',
        expiresAt: a.expiresAt, createdAt: a.createdAt,
      }))
    })
  } catch (err) {
    console.error('Announcements GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/announcements
 * Create an announcement (Directors/Partners only)
 */
export async function POST(request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.profile?.role || 'client'
  if (!hasPermission(role, 'MANAGE_ANNOUNCEMENTS')) {
    return NextResponse.json({ error: 'Only directors and partners can post announcements' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { title, content, category, priority, pinned, expiresAt } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content required' }, { status: 400 })
    }

    const db = await getDb()
    const now = new Date().toISOString()
    const annId = `ann_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`

    const announcement = {
      id: annId, title: title.trim(), content: content.trim(),
      category: category || 'general',
      priority: priority || 'normal',
      pinned: pinned || false,
      isActive: true,
      authorId: user.id,
      authorName: user.profile?.full_name || user.email,
      expiresAt: expiresAt || null,
      createdAt: now, updatedAt: now,
    }

    await db.collection('announcements').insertOne(announcement)
    return NextResponse.json({ announcement }, { status: 201 })
  } catch (err) {
    console.error('Announcements POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/announcements
 * Delete an announcement
 */
export async function DELETE(request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.profile?.role || 'client'
  if (!hasPermission(role, 'MANAGE_ANNOUNCEMENTS')) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Announcement ID required' }, { status: 400 })

    const db = await getDb()
    await db.collection('announcements').updateOne({ id }, { $set: { isActive: false } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Announcements DELETE error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
