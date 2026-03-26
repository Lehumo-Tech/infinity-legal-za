import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getUserFromRequest, hasPermission } from '@/lib/rbac'
export const dynamic = 'force-dynamic'

/**
 * GET /api/hr/leave
 * Fetch leave requests - HR/Directors see all, others see own
 */
export async function GET(request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const db = await getDb()
    const role = user.profile?.role || 'client'
    const canViewAll = hasPermission(role, 'VIEW_HR') || hasPermission(role, 'MANAGE_LEAVE')

    const filter = canViewAll ? {} : { requestedBy: user.id }

    const leaves = await db.collection('leave_requests')
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray()

    // Calculate leave balances for current user
    const currentYear = new Date().getFullYear()
    const userLeaves = await db.collection('leave_requests')
      .find({
        requestedBy: user.id,
        status: { $in: ['approved', 'pending'] },
        startDate: { $regex: `^${currentYear}` },
      })
      .toArray()

    const balances = {
      annual: { total: 21, used: 0, pending: 0 },
      sick: { total: 30, used: 0, pending: 0 },
      family: { total: 3, used: 0, pending: 0 },
      study: { total: 5, used: 0, pending: 0 },
      unpaid: { total: 999, used: 0, pending: 0 },
    }

    userLeaves.forEach(l => {
      const days = calculateDays(l.startDate, l.endDate)
      const type = l.leaveType || 'annual'
      if (balances[type]) {
        if (l.status === 'approved') balances[type].used += days
        if (l.status === 'pending') balances[type].pending += days
      }
    })

    const formattedLeaves = leaves.map(l => ({
      id: l.id || l._id?.toString(),
      requestedBy: l.requestedBy,
      requestedByName: l.requestedByName || '',
      department: l.department || '',
      leaveType: l.leaveType || 'annual',
      startDate: l.startDate,
      endDate: l.endDate,
      days: calculateDays(l.startDate, l.endDate),
      reason: l.reason || '',
      status: l.status || 'pending',
      approvedBy: l.approvedBy || null,
      approvedByName: l.approvedByName || '',
      approvedAt: l.approvedAt || null,
      rejectionReason: l.rejectionReason || '',
      createdAt: l.createdAt,
    }))

    return NextResponse.json({ leaves: formattedLeaves, balances })
  } catch (err) {
    console.error('Leave GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/hr/leave
 * Submit a leave request
 */
export async function POST(request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { leaveType, startDate, endDate, reason } = body

    if (!leaveType || !startDate || !endDate) {
      return NextResponse.json({ error: 'Leave type, start date, and end date are required' }, { status: 400 })
    }

    const validTypes = ['annual', 'sick', 'family', 'study', 'unpaid', 'maternity', 'paternity']
    if (!validTypes.includes(leaveType)) {
      return NextResponse.json({ error: 'Invalid leave type' }, { status: 400 })
    }

    if (new Date(endDate) < new Date(startDate)) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })
    }

    const db = await getDb()
    const now = new Date().toISOString()
    const leaveId = `lv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`

    const leave = {
      id: leaveId,
      requestedBy: user.id,
      requestedByName: user.profile?.full_name || user.email,
      department: user.profile?.department || '',
      leaveType,
      startDate,
      endDate,
      days: calculateDays(startDate, endDate),
      reason: (reason || '').trim(),
      status: 'pending',
      approvedBy: null,
      approvedByName: null,
      approvedAt: null,
      rejectionReason: '',
      createdAt: now,
      updatedAt: now,
    }

    await db.collection('leave_requests').insertOne(leave)

    return NextResponse.json({ leave }, { status: 201 })
  } catch (err) {
    console.error('Leave POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/hr/leave
 * Approve/reject a leave request
 */
export async function PUT(request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.profile?.role || 'client'
  if (!hasPermission(role, 'MANAGE_LEAVE')) {
    return NextResponse.json({ error: 'Only HR/Directors can approve leave' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { id, action, rejectionReason } = body

    if (!id || !action) return NextResponse.json({ error: 'Leave ID and action required' }, { status: 400 })

    const db = await getDb()
    const leave = await db.collection('leave_requests').findOne({ id })
    if (!leave) return NextResponse.json({ error: 'Leave request not found' }, { status: 404 })
    if (leave.status !== 'pending') return NextResponse.json({ error: 'Can only process pending requests' }, { status: 400 })

    const now = new Date().toISOString()
    const setFields = { updatedAt: now }

    if (action === 'approve') {
      setFields.status = 'approved'
      setFields.approvedBy = user.id
      setFields.approvedByName = user.profile?.full_name || user.email
      setFields.approvedAt = now
    } else if (action === 'reject') {
      setFields.status = 'rejected'
      setFields.approvedBy = user.id
      setFields.approvedByName = user.profile?.full_name || user.email
      setFields.approvedAt = now
      setFields.rejectionReason = rejectionReason || ''
    } else {
      return NextResponse.json({ error: 'Invalid action. Use approve or reject' }, { status: 400 })
    }

    await db.collection('leave_requests').updateOne({ id }, { $set: setFields })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Leave PUT error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function calculateDays(startDate, endDate) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  let count = 0
  const current = new Date(start)
  while (current <= end) {
    const day = current.getDay()
    if (day !== 0 && day !== 6) count++ // Exclude weekends
    current.setDate(current.getDate() + 1)
  }
  return Math.max(count, 1)
}
