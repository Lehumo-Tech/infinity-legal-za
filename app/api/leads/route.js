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
    const status = searchParams.get('status')
    const query = status && status !== 'all' ? { status } : {}
    const leads = await db.collection('leads').find(query).sort({ createdAt: -1 }).limit(200).toArray()
    return NextResponse.json({ leads })
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
    
    const lead = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: body.name,
      email: body.email || '',
      phone: body.phone || '',
      source: body.source || 'manual',
      status: body.status || 'new',
      category: body.category || 'general',
      notes: body.notes || '',
      score: body.score || 0,
      assignedTo: body.assignedTo || null,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await db.collection('leads').insertOne(lead)
    return NextResponse.json({ lead }, { status: 201 })
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
    if (!id) return NextResponse.json({ error: 'Lead ID required' }, { status: 400 })
    updates.updatedAt = new Date().toISOString()
    await db.collection('leads').updateOne({ id }, { $set: updates })
    const lead = await db.collection('leads').findOne({ id })
    return NextResponse.json({ lead })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
