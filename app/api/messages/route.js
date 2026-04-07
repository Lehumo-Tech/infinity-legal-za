import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/api-auth'
import { getDb } from '@/lib/mongodb'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const db = await getDb()
    const messages = await db.collection('messages').find({
      $or: [{ senderId: user.id }, { recipientId: user.id }]
    }).sort({ createdAt: -1 }).limit(100).toArray()
    return NextResponse.json({ messages })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const db = await getDb()
    const body = await request.json()
    
    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      subject: body.subject || '',
      content: body.content,
      senderId: user.id,
      senderName: user.email || 'Unknown',
      recipientId: body.recipientId || null,
      recipientName: body.recipientName || '',
      isRead: false,
      createdAt: new Date().toISOString(),
    }
    await db.collection('messages').insertOne(message)
    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
