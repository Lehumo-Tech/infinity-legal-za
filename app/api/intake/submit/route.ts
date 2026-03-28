import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import {
  validateIntake,
  buildIntakeDocument,
  detectConflicts,
  generateReferenceId,
} from '@/lib/modules/intake'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // 1. Validate with pure Zod logic
    const validation = validateIntake(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      )
    }

    const data = validation.data
    const db = await getDb()

    // 2. Conflict check — query recent intakes for same email+category
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const recentIntakes = await db
      .collection('intake_submissions')
      .find({
        $or: [
          { 'contact.email': { $regex: new RegExp(`^${escapeRegex(data.email)}$`, 'i') } },
          { userEmail: { $regex: new RegExp(`^${escapeRegex(data.email)}$`, 'i') } },
        ],
        createdAt: { $gte: sevenDaysAgo },
      })
      .project({ id: 1, contact: 1, userEmail: 1, caseDetails: 1, analysis: 1, createdAt: 1 })
      .toArray()

    const conflict = detectConflicts(recentIntakes, data.email, data.caseType)
    if (conflict.hasConflict) {
      return NextResponse.json(
        {
          success: false,
          error: conflict.reason || 'A similar intake already exists.',
          existingReference: conflict.matchedId,
        },
        { status: 409 }
      )
    }

    // 3. Build document and save
    const referenceId = generateReferenceId()
    const document = buildIntakeDocument(data, referenceId)

    await db.collection('intake_submissions').insertOne(document)

    // 4. Create a notification for staff (non-blocking)
    try {
      const { createBulkNotifications } = await import('@/lib/notifications')
      // Notify all intake-related staff
      const staffProfiles = await db
        .collection('notifications')
        .distinct('userId')

      if (staffProfiles.length > 0) {
        // Just create one general notification
        const { createNotification } = await import('@/lib/notifications')
        await createNotification({
          userId: 'system',
          type: 'intake_new',
          title: 'New Public Intake',
          message: `${data.firstName} ${data.lastName} submitted a ${document.analysis.category} intake via the public wizard. Urgency: ${data.urgency}`,
          link: '/portal/intakes',
          metadata: {
            intakeId: referenceId,
            category: document.analysis.category,
            urgency: data.urgency,
          },
        })
      }
    } catch (notifErr) {
      // Non-blocking — don't fail the intake submission
      console.error('[Intake Submit] Notification error:', notifErr)
    }

    return NextResponse.json(
      { success: true, caseId: referenceId },
      { status: 201 }
    )
  } catch (err) {
    console.error('[Intake Submit] Error:', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/** Escape special regex characters for safe DB queries */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
