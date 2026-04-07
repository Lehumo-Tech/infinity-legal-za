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
    const metadata = await db.collection('case_metadata').findOne({ caseId: id })
    
    // Calculate prescription if it exists
    if (metadata?.prescription?.startDate && metadata?.prescription?.type) {
      const SA_PRESCRIPTION = {
        general: 36, debt: 36, delict: 36, defamation: 12,
        labour_ccma: 6, labour_unfair_dismissal: 12,
        property: 360, tax: 36, insurance: 24,
      }
      const months = SA_PRESCRIPTION[metadata.prescription.type] || 36
      const start = new Date(metadata.prescription.startDate)
      const expiry = new Date(start)
      expiry.setMonth(expiry.getMonth() + months)
      const now = new Date()
      const daysRemaining = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))
      metadata.prescription.expiryDate = expiry.toISOString()
      metadata.prescription.daysRemaining = daysRemaining
      metadata.prescription.isExpired = daysRemaining < 0
      metadata.prescription.isUrgent = daysRemaining >= 0 && daysRemaining <= 30
      metadata.prescription.isWarning = daysRemaining > 30 && daysRemaining <= 90
    }
    
    return NextResponse.json({ metadata: metadata || {} })
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
    
    await db.collection('case_metadata').updateOne(
      { caseId: id },
      { $set: { ...body, caseId: id, updatedAt: new Date().toISOString() }, $setOnInsert: { createdAt: new Date().toISOString() } },
      { upsert: true }
    )
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
