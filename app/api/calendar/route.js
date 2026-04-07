import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/api-auth'
import { getDb } from '@/lib/mongodb'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const db = await getDb()
    
    // Get cases with court dates
    const casesWithDates = await db.collection('cases').find({ court_date: { $ne: null } }).toArray()
    
    // Get tasks with due dates
    const tasksWithDates = await db.collection('case_tasks').find({ dueDate: { $ne: null } }).toArray()
    
    // Convert to calendar events
    const events = [
      ...casesWithDates.map(c => ({
        id: c.id,
        title: `${c.case_number} - ${c.title || c.case_type}`,
        date: c.court_date,
        type: 'court_date',
        color: '#7c3aed',
        caseId: c.id,
      })),
      ...tasksWithDates.map(t => ({
        id: t.id,
        title: t.title,
        date: t.dueDate,
        type: 'task',
        color: t.priority === 'urgent' ? '#dc2626' : t.priority === 'high' ? '#ea580c' : '#2563eb',
        caseId: t.caseId,
      })),
    ]
    
    return NextResponse.json({ events })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const db = await getDb()
    const body = await request.json()
    
    const event = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      title: body.title,
      date: body.date,
      time: body.time || null,
      type: body.type || 'general',
      description: body.description || '',
      caseId: body.caseId || null,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
    }
    await db.collection('calendar_events').insertOne(event)
    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
