import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { createClient } from '@supabase/supabase-js'
export const dynamic = 'force-dynamic'

async function getUserFromRequest(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  const token = authHeader.split(' ')[1]
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  return user
}

// POST /api/documents/[id]/lock - Check-out (lock) or Check-in (unlock)
export async function POST(request, { params }) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: docId } = await params
    const body = await request.json()
    const { action } = body // 'checkout' or 'checkin'

    if (!action || !['checkout', 'checkin'].includes(action)) {
      return NextResponse.json({ error: 'action must be checkout or checkin' }, { status: 400 })
    }

    const db = await getDb()
    const existingLock = await db.collection('document_locks').findOne({ documentId: docId })

    if (action === 'checkout') {
      if (existingLock) {
        if (existingLock.lockedBy === user.id) {
          return NextResponse.json({ message: 'Document is already checked out by you', lock: existingLock })
        }
        return NextResponse.json({
          error: `Document is already checked out by ${existingLock.lockedByName} since ${existingLock.lockedAt}`,
        }, { status: 409 })
      }

      const lock = {
        documentId: docId,
        lockedBy: user.id,
        lockedByName: user.email,
        lockedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4-hour lock
      }
      await db.collection('document_locks').insertOne(lock)

      return NextResponse.json({
        message: 'Document checked out successfully. You have 4 hours to edit.',
        lock,
      })
    }

    if (action === 'checkin') {
      if (!existingLock) {
        return NextResponse.json({ message: 'Document is not currently checked out' })
      }
      if (existingLock.lockedBy !== user.id) {
        return NextResponse.json({
          error: `Only ${existingLock.lockedByName} can check in this document`,
        }, { status: 403 })
      }

      await db.collection('document_locks').deleteOne({ documentId: docId })

      return NextResponse.json({ message: 'Document checked in successfully' })
    }
  } catch (error) {
    console.error('Document lock error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/documents/[id]/lock - Check lock status
export async function GET(request, { params }) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: docId } = await params
    const db = await getDb()
    const lock = await db.collection('document_locks').findOne({ documentId: docId })

    // Auto-expire stale locks
    if (lock && new Date(lock.expiresAt) < new Date()) {
      await db.collection('document_locks').deleteOne({ documentId: docId })
      return NextResponse.json({ locked: false, lock: null })
    }

    return NextResponse.json({
      locked: !!lock,
      lock: lock || null,
      isLockedByMe: lock?.lockedBy === user.id,
    })
  } catch (error) {
    console.error('Document lock status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
