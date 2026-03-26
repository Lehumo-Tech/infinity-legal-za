import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getUserFromRequest } from '@/lib/rbac'
export const dynamic = 'force-dynamic'

/**
 * GET /api/calendar
 * Fetch calendar events for the authenticated user
 * Aggregates: manual events, court dates from cases, task deadlines
 */
export async function GET(request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const db = await getDb()
    
    // Fetch manual calendar events from MongoDB
    const events = await db.collection('calendar_events')
      .find({
        $or: [
          { createdBy: user.id },
          { attendees: user.id },
          { visibility: 'firm_wide' },
        ]
      })
      .sort({ startDate: 1 })
      .limit(200)
      .toArray()

    const formattedEvents = events.map(e => ({
      id: e.id || e._id?.toString(),
      title: e.title,
      description: e.description || '',
      startDate: e.startDate,
      endDate: e.endDate || e.startDate,
      startTime: e.startTime || '',
      endTime: e.endTime || '',
      type: e.type || 'meeting',
      priority: e.priority || 'normal',
      location: e.location || '',
      caseId: e.caseId || null,
      attendees: e.attendees || [],
      visibility: e.visibility || 'personal',
      createdBy: e.createdBy,
      createdByName: e.createdByName || '',
      recurring: e.recurring || null,
      reminder: e.reminder || null,
      color: e.color || getDefaultColor(e.type),
      createdAt: e.createdAt,
    }))

    return NextResponse.json({ events: formattedEvents })
  } catch (err) {
    console.error('Calendar GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/calendar
 * Create a new calendar event
 */
export async function POST(request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { title, description, startDate, endDate, startTime, endTime, type, priority, location, caseId, attendees, visibility, recurring, reminder } = body

    if (!title || !startDate) {
      return NextResponse.json({ error: 'Title and start date are required' }, { status: 400 })
    }

    const db = await getDb()
    const now = new Date().toISOString()
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`

    const event = {
      id: eventId,
      title: title.trim(),
      description: (description || '').trim(),
      startDate,
      endDate: endDate || startDate,
      startTime: startTime || '',
      endTime: endTime || '',
      type: type || 'meeting',
      priority: priority || 'normal',
      location: (location || '').trim(),
      caseId: caseId || null,
      attendees: attendees || [],
      visibility: visibility || 'personal',
      recurring: recurring || null,
      reminder: reminder || null,
      color: getDefaultColor(type),
      createdBy: user.id,
      createdByName: user.profile?.full_name || user.email,
      createdAt: now,
      updatedAt: now,
    }

    await db.collection('calendar_events').insertOne(event)

    return NextResponse.json({ event }, { status: 201 })
  } catch (err) {
    console.error('Calendar POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/calendar
 * Update an existing calendar event
 */
export async function PUT(request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })

    const db = await getDb()
    const event = await db.collection('calendar_events').findOne({ id })

    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    if (event.createdBy !== user.id) return NextResponse.json({ error: 'Not authorized to edit this event' }, { status: 403 })

    const allowedFields = ['title', 'description', 'startDate', 'endDate', 'startTime', 'endTime', 'type', 'priority', 'location', 'caseId', 'attendees', 'visibility', 'recurring', 'reminder']
    const setFields = { updatedAt: new Date().toISOString() }
    allowedFields.forEach(f => { if (updates[f] !== undefined) setFields[f] = updates[f] })
    if (setFields.type) setFields.color = getDefaultColor(setFields.type)

    await db.collection('calendar_events').updateOne({ id }, { $set: setFields })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Calendar PUT error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/calendar
 * Delete a calendar event
 */
export async function DELETE(request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })

    const db = await getDb()
    const event = await db.collection('calendar_events').findOne({ id })
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    if (event.createdBy !== user.id) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

    await db.collection('calendar_events').deleteOne({ id })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Calendar DELETE error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getDefaultColor(type) {
  const colors = {
    court_date: 'bg-purple-500',
    deadline: 'bg-red-500',
    meeting: 'bg-blue-500',
    consultation: 'bg-green-500',
    reminder: 'bg-amber-500',
    personal: 'bg-gray-500',
    hearing: 'bg-indigo-500',
    filing: 'bg-teal-500',
    deposition: 'bg-cyan-500',
  }
  return colors[type] || 'bg-blue-500'
}
