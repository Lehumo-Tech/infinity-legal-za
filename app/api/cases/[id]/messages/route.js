import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getUserFromRequest } from '@/lib/rbac'
export const dynamic = 'force-dynamic'

/**
 * GET /api/cases/[id]/messages
 * Fetch secure client communication log for a case
 */
export async function GET(request, { params }) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: caseId } = await params

  try {
    const db = await getDb()
    const messages = await db.collection('case_messages')
      .find({ caseId })
      .sort({ createdAt: 1 })
      .limit(500)
      .toArray()

    return NextResponse.json({
      messages: messages.map(m => ({
        id: m.id, caseId: m.caseId,
        senderId: m.senderId, senderName: m.senderName || '',
        senderRole: m.senderRole || '',
        content: m.content, type: m.type || 'text',
        isInternal: m.isInternal || false,
        readAt: m.readAt, createdAt: m.createdAt,
      }))
    })
  } catch (err) {
    console.error('Case messages GET error:', err)
    return NextResponse.json({ messages: [] })
  }
}

/**
 * POST /api/cases/[id]/messages
 * Send a message in case communication log
 */
export async function POST(request, { params }) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: caseId } = await params

  try {
    const body = await request.json()
    const { content, isInternal } = body

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const db = await getDb()
    const now = new Date().toISOString()
    const msgId = `cmsg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    const role = user.profile?.role || 'client'

    const message = {
      id: msgId, caseId,
      senderId: user.id,
      senderName: user.profile?.full_name || user.email,
      senderRole: role,
      content: content.trim(),
      type: 'text',
      isInternal: isInternal || false,
      readAt: null,
      createdAt: now,
    }

    await db.collection('case_messages').insertOne(message)

    // Timeline entry
    await db.collection('case_timeline').insertOne({
      id: `tl_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      caseId, type: 'message', action: isInternal ? 'internal_message' : 'client_message',
      description: `${isInternal ? 'Internal' : 'Client'} message from ${message.senderName}`,
      userId: user.id, userName: message.senderName,
      metadata: { messageId: msgId, isInternal },
      createdAt: now,
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (err) {
    console.error('Case messages POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
