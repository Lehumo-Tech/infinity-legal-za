import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/api-auth'
import { getDb } from '@/lib/mongodb'
export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const db = await getDb()
    const { caseId } = await request.json()
    if (!caseId) return NextResponse.json({ error: 'Case ID required' }, { status: 400 })
    
    await db.collection('cases').updateOne(
      { id: caseId },
      { $set: { status: 'archived', archivedAt: new Date().toISOString(), archivedBy: user.id, updatedAt: new Date().toISOString() } }
    )
    
    await db.collection('case_timeline').insertOne({
      id: `tl_${Date.now()}`,
      caseId,
      action: 'status_changed',
      description: 'Case archived — read only',
      userId: user.id,
      userName: user.email || 'System',
      createdAt: new Date().toISOString(),
    })
    
    return NextResponse.json({ message: 'Case archived successfully' })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
