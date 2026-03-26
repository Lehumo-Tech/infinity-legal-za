import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { requirePermission, createAuditLog } from '@/lib/rbac'
export const dynamic = 'force-dynamic'

/**
 * GET /api/cases/[id]/privileged-notes
 * Officer-only: View privileged strategy notes for a case
 * Uses MongoDB instead of Supabase (table doesn't exist in Supabase)
 */
export async function GET(request, { params }) {
  const { user, error, status } = await requirePermission(request, 'VIEW_PRIVILEGED_NOTES')
  if (error) return NextResponse.json({ error }, { status })

  const { id: caseId } = await params

  try {
    const db = await getDb()
    const notes = await db.collection('privileged_notes')
      .find({ caseId })
      .sort({ createdAt: -1 })
      .toArray()

    // Enrich with author info from the stored data
    const enrichedNotes = notes.map(n => ({
      id: n._id?.toString() || n.id,
      content: n.content,
      is_strategy: n.isStrategy || false,
      visibility: n.visibility || 'officer_only',
      created_at: n.createdAt,
      author: {
        full_name: n.authorName || 'Officer',
        role: n.authorRole || 'associate',
      },
    }))

    // Audit the access
    await createAuditLog({
      userId: user.id,
      action: 'VIEW_PRIVILEGED_NOTES',
      resourceType: 'case',
      resourceId: caseId,
      details: { notesCount: enrichedNotes.length },
    })

    return NextResponse.json({ notes: enrichedNotes })
  } catch (err) {
    console.error('Privileged notes error:', err)
    return NextResponse.json({ notes: [] })
  }
}

/**
 * POST /api/cases/[id]/privileged-notes
 * Officer-only: Create a privileged note
 * Stores in MongoDB
 */
export async function POST(request, { params }) {
  const { user, error, status } = await requirePermission(request, 'CREATE_PRIVILEGED_NOTES')
  if (error) return NextResponse.json({ error }, { status })

  const { id: caseId } = await params
  const { content, isStrategy, visibility } = await request.json()

  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: 'Note content is required' }, { status: 400 })
  }

  try {
    const db = await getDb()
    const now = new Date().toISOString()
    const noteId = `pn_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`

    const note = {
      id: noteId,
      caseId,
      authorId: user.id,
      authorName: user.profile?.full_name || user.email,
      authorRole: user.profile?.role || 'associate',
      content: content.trim(),
      isStrategy: isStrategy || false,
      visibility: visibility || 'officer_only',
      createdAt: now,
      updatedAt: now,
    }

    await db.collection('privileged_notes').insertOne(note)

    // Audit the creation
    await createAuditLog({
      userId: user.id,
      action: 'CREATE_PRIVILEGED_NOTE',
      resourceType: 'privileged_note',
      resourceId: noteId,
      details: { caseId, isStrategy },
    })

    return NextResponse.json({
      note: {
        id: noteId,
        content: note.content,
        is_strategy: note.isStrategy,
        visibility: note.visibility,
        created_at: note.createdAt,
        author: {
          full_name: note.authorName,
          role: note.authorRole,
        },
      }
    }, { status: 201 })
  } catch (err) {
    console.error('Privileged note creation error:', err)
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 })
  }
}
