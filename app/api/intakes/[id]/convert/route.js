import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/api-auth'
import { getDb } from '@/lib/mongodb'
export const dynamic = 'force-dynamic'

export async function POST(request, { params }) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const db = await getDb()
    
    const intake = await db.collection('intakes').findOne({ id })
    if (!intake) return NextResponse.json({ error: 'Intake not found' }, { status: 404 })
    
    // Create case from intake
    const year = new Date().getFullYear()
    const count = await db.collection('cases').countDocuments()
    const case_number = `IL-${year}-${String(count + 1).padStart(4, '0')}`
    
    const newCase = {
      id: `case_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
      case_number,
      title: intake.subject || intake.legalIssue || 'Converted from intake',
      case_type: intake.category || 'civil',
      case_subtype: intake.subcategory || '',
      description: intake.description || intake.details || '',
      status: 'new',
      urgency: intake.urgency || 'medium',
      client_id: intake.userId || null,
      client_name: intake.name || intake.fullName || '',
      attorney_id: null,
      sourceIntakeId: id,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    await db.collection('cases').insertOne(newCase)
    
    // Update intake status
    await db.collection('intakes').updateOne(
      { id },
      { $set: { status: 'converted', convertedCaseId: newCase.id, convertedAt: new Date().toISOString() } }
    )
    
    // Timeline
    await db.collection('case_timeline').insertOne({
      id: `tl_${Date.now()}`,
      caseId: newCase.id,
      action: 'case_created',
      description: `Legal matter created from AI intake`,
      userId: user.id,
      userName: user.email || 'System',
      createdAt: new Date().toISOString(),
    })
    
    return NextResponse.json({ case: newCase }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
