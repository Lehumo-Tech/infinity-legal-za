import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getUserFromRequest } from '@/lib/rbac'
export const dynamic = 'force-dynamic'

/**
 * GET /api/cases/[id]/notes
 * Fetch internal attorney notes for a case (client-invisible)
 */
export async function GET(request, { params }) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Only staff can view notes (not clients)
  const role = user.profile?.role || 'client'
  if (role === 'client' || role === 'prospect') {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const { id: caseId } = await params

  try {
    const db = await getDb()
    const notes = await db.collection('case_notes')
      .find({ caseId })
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray()

    return NextResponse.json({
      notes: notes.map(n => ({
        id: n.id, caseId: n.caseId,
        content: n.content, category: n.category || 'general',
        isPinned: n.isPinned || false,
        authorId: n.authorId, authorName: n.authorName || '',
        authorRole: n.authorRole || '',
        createdAt: n.createdAt, updatedAt: n.updatedAt,
      }))
    })
  } catch (err) {
    console.error('Notes GET error:', err)
    return NextResponse.json({ notes: [] })
  }
}

/**
 * POST /api/cases/[id]/notes
 * Add an internal note
 */
export async function POST(request, { params }) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.profile?.role || 'client'
  if (role === 'client' || role === 'prospect') {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const { id: caseId } = await params

  try {
    const body = await request.json()
    const { content, category } = body

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const db = await getDb()
    const now = new Date().toISOString()
    const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`

    const note = {
      id: noteId, caseId,
      content: content.trim(),
      category: category || 'general',
      isPinned: false,
      authorId: user.id,
      authorName: user.profile?.full_name || user.email,
      authorRole: user.profile?.role || '',
      createdAt: now, updatedAt: now,
    }

    await db.collection('case_notes').insertOne(note)

    // Add timeline entry
    await db.collection('case_timeline').insertOne({
      id: `tl_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      caseId, type: 'note', action: 'note_added',
      description: `Note added by ${note.authorName}`,
      userId: user.id, userName: note.authorName,
      metadata: { noteId, category },
      createdAt: now,
    })

    return NextResponse.json({ note }, { status: 201 })
  } catch (err) {
    console.error('Notes POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
