import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requirePermission } from '@/lib/rbac'

/**
 * GET /api/audit — View audit logs (Managing Partners & IT Admins only)
 */
export async function GET(request) {
  const { user, error, status } = await requirePermission(request, 'VIEW_AUDIT_LOGS')
  if (error) return NextResponse.json({ error }, { status })

  const url = new URL(request.url)
  const resourceType = url.searchParams.get('resource_type')
  const action = url.searchParams.get('action')
  const userId = url.searchParams.get('user_id')
  const limit = parseInt(url.searchParams.get('limit') || '100')
  const offset = parseInt(url.searchParams.get('offset') || '0')

  let query = supabaseAdmin
    .from('audit_logs')
    .select('*, user:profiles!user_id(full_name, role, email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (resourceType) query = query.eq('resource_type', resourceType)
  if (action) query = query.eq('action', action)
  if (userId) query = query.eq('user_id', userId)

  const { data, error: dbErr, count } = await query
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  return NextResponse.json({ logs: data || [], total: count || 0, limit, offset })
}
