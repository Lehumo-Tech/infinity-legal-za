import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/api-auth'
import { getDb } from '@/lib/mongodb'
export const dynamic = 'force-dynamic'

export async function PUT(request, { params }) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const db = await getDb()
    const body = await request.json()
    
    await db.collection('cases').updateOne(
      { id },
      { $set: { attorney_id: body.leadAttorneyId, updatedAt: new Date().toISOString() } }
    )
    
    // Save assignment metadata
    await db.collection('case_metadata').updateOne(
      { caseId: id },
      {
        $set: {
          assignment: {
            leadAttorneyId: body.leadAttorneyId,
            billingRate: body.billingRate || null,
            assignedBy: user.id,
            assignedByName: user.email || 'System',
            assignedAt: new Date().toISOString(),
          },
          updatedAt: new Date().toISOString(),
        },
        $setOnInsert: { caseId: id, createdAt: new Date().toISOString() },
      },
      { upsert: true }
    )
    
    // Timeline entry
    await db.collection('case_timeline').insertOne({
      id: `tl_${Date.now()}`,
      caseId: id,
      action: 'case_assigned',
      description: `Legal advisor assigned`,
      userId: user.id,
      userName: user.email || 'System',
      createdAt: new Date().toISOString(),
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
