import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
export const dynamic = 'force-dynamic'

// Category → Specialty mapping
const SPECIALTY_MAP = {
  'labour': ['Labour Law', 'Employment'],
  'criminal': ['Criminal Law', 'Criminal Defence'],
  'family': ['Family Law', 'Divorce', 'Custody'],
  'civil': ['Civil Law', 'Consumer', 'Contract'],
  'property': ['Property Law', 'Conveyancing'],
  'consumer': ['Consumer Law', 'Consumer Protection'],
  'debt': ['Debt Review', 'Credit Law'],
}

// Auto-assign advisor based on category and workload
async function autoAssignAdvisor(db, category) {
  const specialty = SPECIALTY_MAP[category?.toLowerCase()] || SPECIALTY_MAP['civil']
  
  // Get all advisors
  const advisors = await db.collection('profiles').find({
    role: { $in: ['legal_advisor', 'senior_advisor', 'admin'] }
  }).toArray()

  if (advisors.length === 0) return null

  // Count active cases per advisor
  const workloads = []
  for (const advisor of advisors) {
    const activeCount = await db.collection('cases').countDocuments({
      assignedTo: advisor.id || advisor.user_id,
      status: { $in: ['open', 'in_progress', 'pending'] }
    })
    workloads.push({
      advisorId: advisor.id || advisor.user_id,
      advisorName: advisor.full_name || advisor.email,
      advisorEmail: advisor.email,
      activeCount,
      specialty: advisor.specialty || 'General',
    })
  }

  // Sort by fewest active cases (workload balancing)
  workloads.sort((a, b) => a.activeCount - b.activeCount)
  
  return workloads[0] || null
}

// POST /api/matter-assignment — Auto-assign a case to an advisor
export async function POST(request) {
  try {
    const body = await request.json()
    const { caseId, category, userId, description } = body

    if (!caseId) {
      return NextResponse.json({ error: 'caseId is required' }, { status: 400 })
    }

    const db = await getDb()

    // Auto-assign
    const advisor = await autoAssignAdvisor(db, category)

    if (advisor) {
      // Update the case with the assigned advisor
      await db.collection('cases').updateOne(
        { id: caseId },
        {
          $set: {
            assignedTo: advisor.advisorId,
            assignedAdvisorName: advisor.advisorName,
            assignedAdvisorEmail: advisor.advisorEmail,
            assignmentMethod: 'auto',
            assignedAt: new Date().toISOString(),
          }
        }
      )

      // Log the assignment
      await db.collection('audit_log').insertOne({
        id: `audit_${Date.now()}`,
        action: 'matter_assigned',
        caseId,
        advisorId: advisor.advisorId,
        advisorName: advisor.advisorName,
        category,
        method: 'auto_workload_balance',
        timestamp: new Date().toISOString(),
      })

      return NextResponse.json({
        success: true,
        assignment: {
          caseId,
          advisor: advisor.advisorName,
          advisorEmail: advisor.advisorEmail,
          activeWorkload: advisor.activeCount,
          method: 'auto_workload_balance',
        },
      })
    }

    return NextResponse.json({
      success: false,
      message: 'No advisors available for assignment. The matter has been queued.',
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET /api/matter-assignment — Get advisor workload overview
export async function GET() {
  try {
    const db = await getDb()

    const advisors = await db.collection('profiles').find({
      role: { $in: ['legal_advisor', 'senior_advisor', 'admin'] }
    }).toArray()

    const workloads = []
    for (const advisor of advisors) {
      const activeCount = await db.collection('cases').countDocuments({
        assignedTo: advisor.id || advisor.user_id,
        status: { $in: ['open', 'in_progress', 'pending'] }
      })
      const resolvedCount = await db.collection('cases').countDocuments({
        assignedTo: advisor.id || advisor.user_id,
        status: 'resolved'
      })
      workloads.push({
        advisorId: advisor.id || advisor.user_id,
        advisorName: advisor.full_name || advisor.email,
        email: advisor.email,
        role: advisor.role,
        specialty: advisor.specialty || 'General',
        activeCases: activeCount,
        resolvedCases: resolvedCount,
        totalCases: activeCount + resolvedCount,
      })
    }

    workloads.sort((a, b) => a.activeCases - b.activeCases)

    return NextResponse.json({
      success: true,
      totalAdvisors: workloads.length,
      workloads,
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
