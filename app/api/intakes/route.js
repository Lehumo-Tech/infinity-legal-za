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
    const intakes = await db.collection('intakes').find(query).sort({ createdAt: -1 }).limit(200).toArray()
    return NextResponse.json({ intakes })
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
    if (!id) return NextResponse.json({ error: 'Intake ID required' }, { status: 400 })
    updates.updatedAt = new Date().toISOString()
    await db.collection('intakes').updateOne({ id }, { $set: updates })
    const intake = await db.collection('intakes').findOne({ id })
    return NextResponse.json({ intake })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
