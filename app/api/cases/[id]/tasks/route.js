import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getUserFromRequest } from '@/lib/rbac'
export const dynamic = 'force-dynamic'

/**
 * GET /api/cases/[id]/tasks
 * Fetch tasks for a specific case
 */
export async function GET(request, { params }) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: caseId } = await params

  try {
    const db = await getDb()
    const tasks = await db.collection('case_tasks')
      .find({ caseId })
      .sort({ dueDate: 1, createdAt: -1 })
      .limit(100)
      .toArray()

    return NextResponse.json({
      tasks: tasks.map(t => ({
        id: t.id, caseId: t.caseId,
        title: t.title, description: t.description || '',
        status: t.status || 'pending',
        priority: t.priority || 'normal',
        dueDate: t.dueDate || null,
        assigneeId: t.assigneeId || null,
        assigneeName: t.assigneeName || '',
        completedAt: t.completedAt || null,
        createdBy: t.createdBy, createdByName: t.createdByName || '',
        createdAt: t.createdAt,
      }))
    })
  } catch (err) {
    console.error('Case tasks GET error:', err)
    return NextResponse.json({ tasks: [] })
  }
}

/**
 * POST /api/cases/[id]/tasks
 * Create a task for a case
 */
export async function POST(request, { params }) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: caseId } = await params

  try {
    const body = await request.json()
    const { title, description, priority, dueDate, assigneeId, assigneeName } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const db = await getDb()
    const now = new Date().toISOString()
    const taskId = `ctask_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`

    const task = {
      id: taskId, caseId,
      title: title.trim(), description: (description || '').trim(),
      status: 'pending', priority: priority || 'normal',
      dueDate: dueDate || null,
      assigneeId: assigneeId || null,
      assigneeName: assigneeName || '',
      completedAt: null,
      createdBy: user.id,
      createdByName: user.profile?.full_name || user.email,
      createdAt: now, updatedAt: now,
    }

    await db.collection('case_tasks').insertOne(task)

    // Timeline entry
    await db.collection('case_timeline').insertOne({
      id: `tl_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      caseId, type: 'task', action: 'task_created',
      description: `Task "${title}" created by ${task.createdByName}`,
      userId: user.id, userName: task.createdByName,
      metadata: { taskId, assigneeName },
      createdAt: now,
    })

    return NextResponse.json({ task }, { status: 201 })
  } catch (err) {
    console.error('Case tasks POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/cases/[id]/tasks
 * Update a task status
 */
export async function PUT(request, { params }) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: caseId } = await params

  try {
    const body = await request.json()
    const { taskId, status, ...updates } = body

    if (!taskId) return NextResponse.json({ error: 'Task ID required' }, { status: 400 })

    const db = await getDb()
    const now = new Date().toISOString()
    const setFields = { updatedAt: now }

    if (status) {
      setFields.status = status
      if (status === 'completed') setFields.completedAt = now
    }
    const allowedFields = ['title', 'description', 'priority', 'dueDate', 'assigneeId', 'assigneeName']
    allowedFields.forEach(f => { if (updates[f] !== undefined) setFields[f] = updates[f] })

    await db.collection('case_tasks').updateOne({ id: taskId, caseId }, { $set: setFields })

    if (status === 'completed') {
      await db.collection('case_timeline').insertOne({
        id: `tl_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        caseId, type: 'task', action: 'task_completed',
        description: `Task completed by ${user.profile?.full_name || user.email}`,
        userId: user.id, userName: user.profile?.full_name || user.email,
        metadata: { taskId },
        createdAt: now,
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Case tasks PUT error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
