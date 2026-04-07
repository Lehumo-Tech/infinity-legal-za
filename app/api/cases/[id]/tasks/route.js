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
    const tasks = await db.collection('case_tasks').find({ caseId: id }).sort({ createdAt: -1 }).toArray()
    return NextResponse.json({ tasks })
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
    
    const task = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      caseId: id,
      title: body.title,
      description: body.description || '',
      priority: body.priority || 'normal',
      status: 'pending',
      dueDate: body.dueDate || null,
      assigneeId: body.assigneeId || user.id,
      assigneeName: body.assigneeName || user.email || 'Unassigned',
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await db.collection('case_tasks').insertOne(task)
    
    await db.collection('case_timeline').insertOne({
      id: `tl_${Date.now()}`,
      caseId: id,
      action: 'task_created',
      description: `Task created: ${task.title}`,
      userId: user.id,
      userName: user.email || 'System',
      createdAt: new Date().toISOString(),
    })
    
    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const db = await getDb()
    const body = await request.json()
    const { taskId, ...updates } = body
    if (!taskId) return NextResponse.json({ error: 'Task ID required' }, { status: 400 })
    
    updates.updatedAt = new Date().toISOString()
    await db.collection('case_tasks').updateOne({ id: taskId, caseId: id }, { $set: updates })
    
    if (updates.status === 'completed') {
      await db.collection('case_timeline').insertOne({
        id: `tl_${Date.now()}`,
        caseId: id,
        action: 'task_completed',
        description: `Task completed`,
        userId: user.id,
        userName: user.email || 'System',
        createdAt: new Date().toISOString(),
      })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
