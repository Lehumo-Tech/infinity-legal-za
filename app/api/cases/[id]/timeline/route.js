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
    const entries = await db.collection('case_timeline').find({ caseId: id }).sort({ createdAt: -1 }).limit(100).toArray()
    return NextResponse.json({ entries })
  } catch (error) {
    console.error('Timeline GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
