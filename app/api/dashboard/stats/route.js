import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'
export const dynamic = 'force-dynamic'

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

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    let stats = {}

    if (profile?.role === 'attorney') {
      // For attorneys - get counts based on user.id
      // Try as attorney_id or client_id
      const { count: totalCases } = await supabaseAdmin
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .or(`attorney_id.eq.${user.id},client_id.eq.${user.id}`)

      const { count: activeCases } = await supabaseAdmin
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .or(`attorney_id.eq.${user.id},client_id.eq.${user.id}`)
        .in('status', ['active', 'matched', 'intake'])

      const { count: pendingTasks } = await supabaseAdmin
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)
        .in('status', ['pending', 'in_progress'])

      // Court dates this week
      const now = new Date()
      const weekEnd = new Date(now)
      weekEnd.setDate(weekEnd.getDate() + 7)
      
      const { count: courtDates } = await supabaseAdmin
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .or(`attorney_id.eq.${user.id},client_id.eq.${user.id}`)
        .gte('court_date', now.toISOString().split('T')[0])
        .lte('court_date', weekEnd.toISOString().split('T')[0])

      stats = {
        totalCases: totalCases || 0,
        activeCases: activeCases || 0,
        pendingTasks: pendingTasks || 0,
        courtDatesThisWeek: courtDates || 0
      }
    } else {
      // Client stats
      const { count: totalCases } = await supabaseAdmin
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', user.id)

      const { count: activeCases } = await supabaseAdmin
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', user.id)
        .in('status', ['active', 'matched', 'intake'])

      stats = {
        totalCases: totalCases || 0,
        activeCases: activeCases || 0
      }
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
