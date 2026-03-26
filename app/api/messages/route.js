import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getUserFromRequest } from '@/lib/rbac'
export const dynamic = 'force-dynamic'

/**
 * GET /api/messages
 * Fetch conversations and messages for authenticated user
 */
export async function GET(request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const db = await getDb()
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')

    if (conversationId) {
      // Get messages for a conversation
      const messages = await db.collection('messages')
        .find({ conversationId })
        .sort({ createdAt: 1 })
        .limit(200)
        .toArray()

      // Mark as read
      await db.collection('messages').updateMany(
        { conversationId, senderId: { $ne: user.id }, readAt: null },
        { $set: { readAt: new Date().toISOString() } }
      )

      return NextResponse.json({
        messages: messages.map(m => ({
          id: m.id, conversationId: m.conversationId,
          senderId: m.senderId, senderName: m.senderName || '',
          content: m.content, type: m.type || 'text',
          readAt: m.readAt, createdAt: m.createdAt,
        }))
      })
    }

    // List conversations
    const conversations = await db.collection('conversations')
      .find({ participants: user.id })
      .sort({ lastMessageAt: -1 })
      .limit(50)
      .toArray()

    // Get unread counts
    const convIds = conversations.map(c => c.id)
    const unreadCounts = {}
    if (convIds.length > 0) {
      const unreadAgg = await db.collection('messages').aggregate([
        { $match: { conversationId: { $in: convIds }, senderId: { $ne: user.id }, readAt: null } },
        { $group: { _id: '$conversationId', count: { $sum: 1 } } }
      ]).toArray()
      unreadAgg.forEach(u => { unreadCounts[u._id] = u.count })
    }

    return NextResponse.json({
      conversations: conversations.map(c => ({
        id: c.id, type: c.type || 'direct',
        name: c.name || '',
        participants: c.participants || [],
        participantNames: c.participantNames || {},
        lastMessage: c.lastMessage || '',
        lastMessageBy: c.lastMessageBy || '',
        lastMessageAt: c.lastMessageAt,
        unreadCount: unreadCounts[c.id] || 0,
        createdAt: c.createdAt,
      }))
    })
  } catch (err) {
    console.error('Messages GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/messages
 * Send a message or create a conversation
 */
export async function POST(request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { action } = body

    const db = await getDb()
    const now = new Date().toISOString()

    if (action === 'create_conversation') {
      const { participants, name, type } = body
      if (!participants || participants.length === 0) {
        return NextResponse.json({ error: 'Participants required' }, { status: 400 })
      }

      const allParticipants = [...new Set([user.id, ...participants])]
      const convId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`

      const conversation = {
        id: convId, type: type || 'direct',
        name: name || '',
        participants: allParticipants,
        participantNames: { [user.id]: user.profile?.full_name || user.email, ...body.participantNames },
        lastMessage: '', lastMessageBy: '', lastMessageAt: now,
        createdBy: user.id, createdAt: now,
      }

      await db.collection('conversations').insertOne(conversation)
      return NextResponse.json({ conversation }, { status: 201 })
    }

    // Send message
    const { conversationId, content } = body
    if (!conversationId || !content?.trim()) {
      return NextResponse.json({ error: 'Conversation ID and content required' }, { status: 400 })
    }

    // Verify user is participant
    const conv = await db.collection('conversations').findOne({ id: conversationId })
    if (!conv || !conv.participants.includes(user.id)) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 })
    }

    const msgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    const message = {
      id: msgId, conversationId,
      senderId: user.id,
      senderName: user.profile?.full_name || user.email,
      content: content.trim(), type: 'text',
      readAt: null, createdAt: now,
    }

    await db.collection('messages').insertOne(message)

    // Update conversation
    await db.collection('conversations').updateOne(
      { id: conversationId },
      { $set: { lastMessage: content.trim().substring(0, 100), lastMessageBy: user.profile?.full_name || user.email, lastMessageAt: now } }
    )

    return NextResponse.json({ message }, { status: 201 })
  } catch (err) {
    console.error('Messages POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
