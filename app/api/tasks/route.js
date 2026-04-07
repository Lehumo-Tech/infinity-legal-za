import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/api-auth'
import { getDb } from '@/lib/mongodb'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const db = await getDb()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const query = status && status !== 'all' ? { status } : {}
    const tasks = await db.collection('case_tasks').find(query).sort({ createdAt: -1 }).limit(200).toArray()
    return NextResponse.json({ tasks })
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
    
    const task = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      title: body.title,
      description: body.description || '',
      priority: body.priority || 'normal',
      status: 'pending',
      caseId: body.caseId || null,
      dueDate: body.dueDate || null,
      assigneeId: body.assigneeId || user.id,
      assigneeName: body.assigneeName || user.email || 'Unassigned',
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await db.collection('case_tasks').insertOne(task)
    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const db = await getDb()
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'Task ID required' }, { status: 400 })
    updates.updatedAt = new Date().toISOString()
    await db.collection('case_tasks').updateOne({ id }, { $set: updates })
    const task = await db.collection('case_tasks').findOne({ id })
    return NextResponse.json({ task })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
