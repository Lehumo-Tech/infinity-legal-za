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
    const notes = await db.collection('case_notes').find({ caseId: id }).sort({ createdAt: -1 }).toArray()
    return NextResponse.json({ notes })
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
    
    const note = {
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      caseId: id,
      content: body.content,
      category: body.category || 'general',
      authorId: user.id,
      authorName: user.email || 'Unknown',
      createdAt: new Date().toISOString(),
    }
    await db.collection('case_notes').insertOne(note)
    
    // Timeline entry
    await db.collection('case_timeline').insertOne({
      id: `tl_${Date.now()}`,
      caseId: id,
      type: 'activity',
      action: 'note_added',
      description: `Note added (${note.category})`,
      userId: user.id,
      userName: user.email || 'System',
      createdAt: new Date().toISOString(),
    })
    
    return NextResponse.json({ note }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
