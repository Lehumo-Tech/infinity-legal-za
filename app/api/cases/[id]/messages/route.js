import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/api-auth'
import { getDb } from '@/lib/mongodb'
export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const db = await getDb()
    const messages = await db.collection('case_messages').find({ caseId: id }).sort({ createdAt: 1 }).toArray()
    return NextResponse.json({ messages })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const db = await getDb()
    const body = await request.json()
    
    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      caseId: id,
      content: body.content,
      isInternal: body.isInternal || false,
      senderId: user.id,
      senderName: user.email || 'Unknown',
      createdAt: new Date().toISOString(),
    }
    await db.collection('case_messages').insertOne(message)
    
    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
