import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// Helper: get user from auth header
async function getUserFromRequest(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.split(' ')[1]
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return null

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle()

  return { ...user, profile }
}

// SA Prescription Periods (months)
const SA_PRESCRIPTION_PERIODS = {
  'general': { months: 36, label: 'General (3 years)' },
  'debt': { months: 36, label: 'Debt (3 years)' },
  'delict': { months: 36, label: 'Delict / Personal Injury (3 years)' },
  'defamation': { months: 12, label: 'Defamation (1 year)' },
  'labour_ccma': { months: 6, label: 'Labour - CCMA Referral (6 months)' },
  'labour_unfair_dismissal': { months: 12, label: 'Labour - Unfair Dismissal (12 months)' },
  'property': { months: 360, label: 'Property / Land (30 years)' },
  'tax': { months: 36, label: 'Tax Disputes (3 years)' },
  'insurance': { months: 24, label: 'Insurance Claims (2 years)' },
  'divorce': { months: 36, label: 'Divorce Proceedings (3 years)' },
  'maintenance': { months: 36, label: 'Maintenance (3 years)' },
  'criminal_assault': { months: 240, label: 'Criminal - Assault (20 years)' },
  'criminal_murder': { months: 0, label: 'Criminal - Murder (No prescription)' },
  'custom': { months: 0, label: 'Custom Period' },
}

// GET /api/cases/[id]/metadata - Get case metadata (prescription + resources)
export async function GET(request, { params }) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: caseId } = await params

    const db = await getDb()
    const metadata = await db.collection('case_metadata').findOne({ caseId })

    if (!metadata) {
      return NextResponse.json({
        metadata: {
          caseId,
          prescription: null,
          resources: null,
          milestones: [],
          timeEntries: [],
        }
      })
    }

    // Calculate prescription status
    if (metadata.prescription?.expiryDate) {
      const now = new Date()
      const expiry = new Date(metadata.prescription.expiryDate)
      const daysRemaining = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))
      metadata.prescription.daysRemaining = daysRemaining
      metadata.prescription.isExpired = daysRemaining <= 0
      metadata.prescription.isUrgent = daysRemaining > 0 && daysRemaining <= 30
      metadata.prescription.isWarning = daysRemaining > 30 && daysRemaining <= 90
    }

    // Calculate resource usage
    if (metadata.timeEntries?.length > 0) {
      const totalHours = metadata.timeEntries.reduce((sum, e) => sum + (e.hours || 0), 0)
      metadata.resources = {
        ...(metadata.resources || {}),
        hoursUsed: totalHours,
      }
    }

    return NextResponse.json({ metadata })
  } catch (error) {
    console.error('Case metadata GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/cases/[id]/metadata - Create or update case metadata
export async function POST(request, { params }) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: caseId } = await params
    const body = await request.json()
    const { prescription, resources, milestone, timeEntry } = body

    const db = await getDb()
    const now = new Date().toISOString()

    // Build update
    const update = { updatedAt: now, updatedBy: user.id }

    // Update prescription
    if (prescription) {
      const { type, startDate, customMonths, expiryDate, notes } = prescription
      let calculatedExpiry = expiryDate

      // Auto-calculate expiry from type + start date
      if (type && startDate && type !== 'custom') {
        const periodInfo = SA_PRESCRIPTION_PERIODS[type]
        if (periodInfo && periodInfo.months > 0) {
          const start = new Date(startDate)
          start.setMonth(start.getMonth() + periodInfo.months)
          calculatedExpiry = start.toISOString().split('T')[0]
        }
      } else if (type === 'custom' && startDate && customMonths) {
        const start = new Date(startDate)
        start.setMonth(start.getMonth() + parseInt(customMonths))
        calculatedExpiry = start.toISOString().split('T')[0]
      }

      update.prescription = {
        type: type || 'general',
        typeLabel: SA_PRESCRIPTION_PERIODS[type]?.label || type,
        startDate,
        expiryDate: calculatedExpiry,
        customMonths: customMonths || null,
        notes: notes || '',
        setBy: user.profile?.full_name || user.email,
        setAt: now,
      }
    }

    // Update resources
    if (resources) {
      update.resources = {
        estimatedHours: resources.estimatedHours || 0,
        budgetAllocated: resources.budgetAllocated || 0,
        hourlyRate: resources.hourlyRate || 0,
        teamMembers: resources.teamMembers || [],
        notes: resources.notes || '',
      }
    }

    // Add milestone
    if (milestone) {
      const newMilestone = {
        id: `ms_${Date.now()}`,
        title: milestone.title,
        dueDate: milestone.dueDate,
        completed: false,
        createdAt: now,
        createdBy: user.profile?.full_name || user.email,
      }
      await db.collection('case_metadata').updateOne(
        { caseId },
        { $push: { milestones: newMilestone }, $set: { updatedAt: now } },
        { upsert: true }
      )
      return NextResponse.json({ milestone: newMilestone })
    }

    // Add time entry
    if (timeEntry) {
      const newEntry = {
        id: `te_${Date.now()}`,
        date: timeEntry.date || now.split('T')[0],
        hours: parseFloat(timeEntry.hours) || 0,
        description: timeEntry.description || '',
        attorney: user.profile?.full_name || user.email,
        attorneyId: user.id,
        createdAt: now,
      }
      await db.collection('case_metadata').updateOne(
        { caseId },
        { $push: { timeEntries: newEntry }, $set: { updatedAt: now } },
        { upsert: true }
      )
      return NextResponse.json({ timeEntry: newEntry })
    }

    // Upsert metadata
    await db.collection('case_metadata').updateOne(
      { caseId },
      { $set: { caseId, ...update } },
      { upsert: true }
    )

    const updated = await db.collection('case_metadata').findOne({ caseId })

    return NextResponse.json({ metadata: updated })
  } catch (error) {
    console.error('Case metadata POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/cases/[id]/metadata - Update specific fields (milestones toggle, etc.)
export async function PUT(request, { params }) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: caseId } = await params
    const body = await request.json()
    const { milestoneId, completed } = body

    const db = await getDb()

    // Toggle milestone completion
    if (milestoneId !== undefined) {
      await db.collection('case_metadata').updateOne(
        { caseId, 'milestones.id': milestoneId },
        { $set: { 'milestones.$.completed': completed, updatedAt: new Date().toISOString() } }
      )
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'No valid update specified' }, { status: 400 })
  } catch (error) {
    console.error('Case metadata PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Export prescription periods for reference
export { SA_PRESCRIPTION_PERIODS }
