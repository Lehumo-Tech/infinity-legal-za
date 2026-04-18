import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/api-auth'
import { getDb } from '@/lib/mongodb'
export const dynamic = 'force-dynamic'

function genId() { return `case_${Date.now()}_${Math.random().toString(36).substr(2, 8)}` }

// GET /api/cases
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const db = await getDb()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const query = {}
    if (status && status !== 'all') query.status = status
    const cases = await db.collection('cases').find(query).sort({ createdAt: -1 }).limit(200).toArray()
    return NextResponse.json({ cases })
  } catch (error) {
    console.error('Cases GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/cases
export async function POST(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const db = await getDb()
    const body = await request.json()
    
    // Generate case number
    const year = new Date().getFullYear()
    const count = await db.collection('cases').countDocuments()
    const seq = String(count + 1).padStart(4, '0')
    const case_number = `IL-${year}-${seq}`
    
    const newCase = {
      id: genId(),
      case_number,
      title: body.title || 'Untitled Legal Matter',
      case_type: body.case_type || 'civil',
      case_subtype: body.case_subtype || body.title || '',
      description: body.description || '',
      status: body.status || 'new',
      urgency: body.urgency || 'medium',
      client_id: body.client_id || user.id,
      client_name: body.client_name || '',
      attorney_id: body.attorney_id || null,
      attorney_name: body.attorney_name || '',
      court_date: body.court_date || null,
      court_location: body.court_location || null,
      // POPIA & Compliance Fields
      province: body.province || null,
      ai_analysis_summary: body.ai_analysis_summary || null,
      ai_confidence_score: body.ai_confidence_score || null,
      flagged_for_human_review: body.flagged_for_human_review || false,
      risk_keywords: body.risk_keywords || [],
      incident_date: body.incident_date || null,
      filing_deadline: body.filing_deadline || null,
      consent_popia: body.consent_popia || true,
      data_processing_purpose: 'legal_representation',
      access_log: [],
      // Metadata
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    await db.collection('cases').insertOne(newCase)
    
    // Add timeline entry
    await db.collection('case_timeline').insertOne({
      id: `tl_${Date.now()}`,
      caseId: newCase.id,
      type: 'status',
      action: 'case_created',
      description: `Legal matter ${case_number} created — ${newCase.title}`,
      userId: user.id,
      userName: user.email || 'System',
      metadata: { case_number, case_type: newCase.case_type },
      createdAt: new Date().toISOString(),
    })
    
    return NextResponse.json({ case: newCase }, { status: 201 })
  } catch (error) {
    console.error('Cases POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/cases
export async function PUT(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const db = await getDb()
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'Case ID required' }, { status: 400 })
    
    updates.updatedAt = new Date().toISOString()
    const oldCase = await db.collection('cases').findOne({ id })
    
    await db.collection('cases').updateOne({ id }, { $set: updates })
    const updatedCase = await db.collection('cases').findOne({ id })
    
    // Timeline entry for status changes
    if (updates.status && oldCase && oldCase.status !== updates.status) {
      await db.collection('case_timeline').insertOne({
        id: `tl_${Date.now()}`,
        caseId: id,
        type: 'status',
        action: 'status_changed',
        description: `Status changed from "${oldCase.status}" to "${updates.status}"`,
        userId: user.id,
        userName: user.email || 'System',
        metadata: { oldStatus: oldCase.status, newStatus: updates.status },
        createdAt: new Date().toISOString(),
      })
    }
    
    return NextResponse.json({ case: updatedCase })
  } catch (error) {
    console.error('Cases PUT error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
