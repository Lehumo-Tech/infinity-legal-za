import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/api-auth'
import { getDb } from '@/lib/mongodb'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const db = await getDb()
    const { searchParams } = new URL(request.url)
    const caseId = searchParams.get('caseId')
    const query = caseId ? { caseId } : {}
    const documents = await db.collection('documents').find(query).sort({ createdAt: -1 }).limit(100).toArray()
    return NextResponse.json({ documents })
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
    
    const doc = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      title: body.title,
      type: body.type || 'general',
      caseId: body.caseId || null,
      caseName: body.caseName || '',
      content: body.content || '',
      status: body.status || 'draft',
      version: 1,
      createdBy: user.id,
      createdByName: user.email || 'Unknown',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await db.collection('documents').insertOne(doc)
    return NextResponse.json({ document: doc }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const db = await getDb()
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'Document ID required' }, { status: 400 })
    updates.updatedAt = new Date().toISOString()
    await db.collection('documents').updateOne({ id }, { $set: updates })
    const doc = await db.collection('documents').findOne({ id })
    return NextResponse.json({ document: doc })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
