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

// GET /api/cases - List cases
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const role = searchParams.get('role') || 'client'

    let query = supabaseAdmin.from('cases').select('id, case_number, case_type, case_subtype, status, urgency, client_id, attorney_id, support_paralegal_id, court_date, court_location, summary_encrypted, notes_encrypted, created_at, updated_at')

    if (role === 'attorney') {
      // For attorneys, get cases where they are the attorney
      // First try to find attorney record
      const { data: attorney } = await supabaseAdmin
        .from('attorneys')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (attorney) {
        query = query.eq('attorney_id', attorney.id)
      } else {
        // Attorney might not have a record yet, show cases assigned to their user id
        query = query.or(`attorney_id.eq.${user.id},client_id.eq.${user.id}`)
      }
    } else {
      query = query.eq('client_id', user.id)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    query = query.order('created_at', { ascending: false }).limit(100)

    const { data, error } = await query

    if (error) {
      console.error('Cases fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Map data to include title/description even if columns don't exist yet
    const cases = (data || []).map(c => ({
      ...c,
      title: c.title || c.case_subtype || c.case_type || 'Untitled Case',
      description: c.description || c.summary_encrypted || ''
    }))

    return NextResponse.json({ cases })
  } catch (error) {
    console.error('Cases API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/cases - Create a new case
export async function POST(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, case_type, description, urgency, court_date, court_location, case_subtype } = body

    // Generate case number
    const caseNumber = 'INF-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-4)

    // Build the insert object with only columns that exist in the schema
    const insertData = {
      case_number: caseNumber,
      client_id: user.id,
      case_type: case_type || 'other',
      case_subtype: case_subtype || title || '',
      status: 'intake',
      urgency: urgency || 'medium',
      court_date: court_date || null,
      court_location: court_location || null,
      summary_encrypted: description || ''
    }

    // Try with title/description columns first (if migration was applied)
    let data, error
    try {
      const result = await supabaseAdmin
        .from('cases')
        .insert([{
          ...insertData,
          title: title || 'Untitled Case',
          description: description || ''
        }])
        .select()
        .single()
      
      data = result.data
      error = result.error
    } catch (e) {
      // Fallback without title/description
      error = { message: 'retry' }
    }

    // If title/description columns don't exist, insert without them
    if (error && (error.message?.includes('title') || error.message?.includes('description') || error.message === 'retry')) {
      const result2 = await supabaseAdmin
        .from('cases')
        .insert([insertData])
        .select()
        .single()
      
      data = result2.data
      error = result2.error
    }

    if (error) {
      console.error('Case create error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Normalize response
    const normalizedCase = {
      ...data,
      title: data.title || data.case_subtype || data.case_type || 'Untitled Case',
      description: data.description || data.summary_encrypted || ''
    }

    // Send notification to the client that their case was created
    try {
      await createNotification({
        userId: user.id,
        type: 'case_update',
        title: 'Case Created',
        message: `Your case "${normalizedCase.title}" (${caseNumber}) has been created and is being processed.`,
        link: '/dashboard',
        metadata: { caseId: data.id, caseNumber },
      })
    } catch (notifErr) {
      console.error('Failed to send case creation notification:', notifErr)
    }

    return NextResponse.json({ case: normalizedCase }, { status: 201 })
  } catch (error) {
    console.error('Cases API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/cases - Update a case
export async function PUT(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, title, description, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Case ID is required' }, { status: 400 })
    }

    // Map title/description to actual columns
    if (title) updates.case_subtype = title
    if (description) updates.summary_encrypted = description

    const { data, error } = await supabaseAdmin
      .from('cases')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Case update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const normalizedCase = {
      ...data,
      title: data.title || data.case_subtype || data.case_type || 'Untitled Case',
      description: data.description || data.summary_encrypted || ''
    }

    // Send notifications on status change
    if (updates.status) {
      const statusLabels = {
        'intake': 'Intake',
        'active': 'Active',
        'under_review': 'Under Review',
        'closed': 'Closed',
        'resolved': 'Resolved',
        'pending': 'Pending',
      }
      const statusLabel = statusLabels[updates.status] || updates.status
      
      try {
        // Notify case client
        if (data.client_id && data.client_id !== user.id) {
          await createNotification({
            userId: data.client_id,
            type: 'case_update',
            title: 'Case Status Updated',
            message: `Your case "${normalizedCase.title}" has been updated to "${statusLabel}".`,
            link: '/dashboard',
            metadata: { caseId: id, newStatus: updates.status },
          })
        }
        // Notify lead attorney if different from updater
        if (data.attorney_id && data.attorney_id !== user.id) {
          await createNotification({
            userId: data.attorney_id,
            type: 'case_update',
            title: 'Case Status Updated',
            message: `Case "${normalizedCase.title}" (${data.case_number}) status changed to "${statusLabel}".`,
            link: '/portal/cases',
            metadata: { caseId: id, newStatus: updates.status },
          })
        }
      } catch (notifErr) {
        console.error('Failed to send case update notification:', notifErr)
      }
    }

    return NextResponse.json({ case: normalizedCase })
  } catch (error) {
    console.error('Cases API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
