import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'
import { createNotification } from '@/lib/notifications'

async function getUserFromRequest(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  const token = authHeader.split(' ')[1]
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  return user
}

// GET /api/tasks - List tasks for user
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const caseId = searchParams.get('case_id')

    // Only join case_number from cases (not title which may not exist)
    let query = supabaseAdmin
      .from('tasks')
      .select('*, cases(case_number, case_type, case_subtype)')
      .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (caseId) {
      query = query.eq('case_id', caseId)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('Tasks fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Normalize the data to add case_title from available fields
    const tasks = (data || []).map(t => ({
      ...t,
      cases: t.cases ? {
        ...t.cases,
        title: t.cases.title || t.cases.case_subtype || t.cases.case_type || 'Case'
      } : null
    }))

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Tasks API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/tasks - Create a task
export async function POST(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, case_id, priority, due_date, assigned_to } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .insert([{
        title,
        description: description || '',
        case_id: case_id || null,
        priority: priority || 'medium',
        status: 'pending',
        due_date: due_date || null,
        assigned_to: assigned_to || user.id,
        created_by: user.id
      }])
      .select('*, cases(case_number, case_type, case_subtype)')
      .single()

    if (error) {
      console.error('Task create error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Notify assigned user about new task
    const assignee = assigned_to || user.id
    if (assignee && assignee !== user.id) {
      await createNotification({
        userId: assignee,
        type: 'task_reminder',
        title: 'New Task Assigned',
        message: `You have been assigned a new task: "${title}"${due_date ? ` due by ${new Date(due_date).toLocaleDateString('en-ZA')}` : ''}.`,
        link: '/attorney/office/tasks',
        metadata: { taskId: data.id }
      })
    }

    return NextResponse.json({ task: data }, { status: 201 })
  } catch (error) {
    console.error('Tasks API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/tasks - Update a task
export async function PUT(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }

    if (updates.status === 'completed') {
      updates.completed_at = new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select('*, cases(case_number, case_type, case_subtype)')
      .single()

    if (error) {
      console.error('Task update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ task: data })
  } catch (error) {
    console.error('Tasks API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/tasks - Delete a task
export async function DELETE(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Task delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Tasks API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
