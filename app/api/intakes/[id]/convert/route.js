import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'
import { createNotification } from '@/lib/notifications'
export const dynamic = 'force-dynamic'

async function getUserFromRequest(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  const token = authHeader.split(' ')[1]
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  return user
}

const categoryToCaseType = {
  'Criminal Law': 'criminal',
  'Family Law': 'family',
  'Labour Law': 'civil',
  'Personal Injury': 'civil',
  'Property Law': 'civil',
  'Debt Recovery': 'civil',
  'Civil Litigation': 'civil',
  'Commercial Law': 'civil',
  'Administrative Law': 'civil',
  'Other': 'other'
}

// POST /api/intakes/[id]/convert - Convert intake to case
export async function POST(request, { params }) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const intakeId = params.id
    const body = await request.json().catch(() => ({}))
    
    const db = await getDb()
    const intake = await db.collection('intake_submissions').findOne({ id: intakeId })
    
    if (!intake) {
      return NextResponse.json({ error: 'Intake submission not found' }, { status: 404 })
    }

    if (intake.status === 'converted') {
      return NextResponse.json({ error: 'This intake has already been converted to a case', caseId: intake.convertedCaseId }, { status: 409 })
    }

    const analysis = intake.analysis || {}

    // Generate case number
    let caseNumber
    try {
      const year = new Date().getFullYear()
      const { count } = await supabaseAdmin.from('cases').select('id', { count: 'exact', head: true })
      const seq = String((count || 0) + 1).padStart(4, '0')
      caseNumber = `IL-${year}-${seq}`
    } catch {
      caseNumber = 'IL-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-4)
    }

    const caseType = categoryToCaseType[analysis.category] || body.case_type || 'other'
    const urgency = body.urgency || analysis.urgency || 'medium'

    // Create the case in Supabase
    const insertData = {
      case_number: caseNumber,
      client_id: intake.userId || body.client_id || user.id,
      case_type: caseType,
      case_subtype: body.case_subtype || analysis.subcategory || analysis.category || '',
      status: 'intake',
      urgency: urgency,
      court_date: body.court_date || null,
      court_location: body.court_location || null,
      summary_encrypted: body.description || analysis.summary || '',
      attorney_id: body.attorney_id || null,
    }

    const { data: caseData, error: caseError } = await supabaseAdmin
      .from('cases')
      .insert([insertData])
      .select()
      .single()

    if (caseError) {
      console.error('Case create from intake error:', caseError)
      return NextResponse.json({ error: caseError.message }, { status: 500 })
    }

    // Update the intake submission status
    await db.collection('intake_submissions').updateOne(
      { id: intakeId },
      {
        $set: {
          status: 'converted',
          convertedCaseId: caseData.id,
          convertedCaseNumber: caseNumber,
          convertedBy: user.id,
          convertedAt: new Date().toISOString(),
        }
      }
    )

    // Add timeline entry
    try {
      await db.collection('case_timeline').insertOne({
        id: `tl_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        caseId: caseData.id,
        type: 'status',
        action: 'case_created',
        description: `Case ${caseNumber} created from AI intake submission`,
        userId: user.id,
        userName: 'System',
        metadata: {
          caseNumber,
          caseType,
          source: 'ai_intake',
          intakeId,
          aiCategory: analysis.category,
          aiConfidence: analysis.confidence,
        },
        createdAt: new Date().toISOString(),
      })
    } catch (tlErr) {
      console.error('Failed to add timeline entry:', tlErr)
    }

    // Save AI analysis as a case note
    try {
      const noteContent = `## AI Intake Analysis\n\n**Category:** ${analysis.category}\n**Subcategory:** ${analysis.subcategory}\n**Urgency:** ${analysis.urgency}\n**Confidence:** ${analysis.confidence}%\n\n**Summary:**\n${analysis.summary}\n\n**Next Steps:**\n${(analysis.nextSteps || []).map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n**Relevant Legislation:**\n${(analysis.relevantLegislation || []).map(l => `- ${l}`).join('\n')}\n\n**Estimated Cost:** ${analysis.estimatedCostRange || 'N/A'}\n**Estimated Timeline:** ${analysis.estimatedTimeline || 'N/A'}\n\n**Warnings:**\n${(analysis.warnings || []).map(w => `- ${w}`).join('\n')}`

      await db.collection('case_notes').insertOne({
        id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        caseId: caseData.id,
        content: noteContent,
        category: 'research',
        authorId: user.id,
        authorName: 'AI Intake System',
        isPrivileged: false,
        createdAt: new Date().toISOString(),
      })

      // Add timeline entry for the note
      await db.collection('case_timeline').insertOne({
        id: `tl_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        caseId: caseData.id,
        type: 'note',
        action: 'note_added',
        description: 'AI intake analysis saved as case note',
        userId: user.id,
        userName: 'System',
        metadata: { source: 'ai_intake' },
        createdAt: new Date().toISOString(),
      })
    } catch (noteErr) {
      console.error('Failed to save intake note:', noteErr)
    }

    // Notify client if present
    if (intake.userId) {
      try {
        await createNotification({
          userId: intake.userId,
          type: 'case_update',
          title: 'Your Intake Has Been Reviewed',
          message: `An attorney has reviewed your AI intake submission and created case ${caseNumber}. Your legal matter is now being handled.`,
          link: '/dashboard',
          metadata: { caseId: caseData.id, caseNumber },
        })
      } catch (notifErr) {
        console.error('Failed to send notification:', notifErr)
      }
    }

    const normalizedCase = {
      ...caseData,
      title: caseData.case_subtype || caseData.case_type || 'Untitled Case',
      description: caseData.summary_encrypted || '',
    }

    return NextResponse.json({
      success: true,
      case: normalizedCase,
      caseNumber,
      message: `Intake successfully converted to case ${caseNumber}`,
    }, { status: 201 })

  } catch (error) {
    console.error('Intake convert error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
