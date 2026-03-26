import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requirePermission, createAuditLog } from '@/lib/rbac'

/**
 * GET /api/cases/[id]/privileged-notes
 * Officer-only: View privileged strategy notes for a case
 */
export async function GET(request, { params }) {
  const { user, error, status } = await requirePermission(request, 'VIEW_PRIVILEGED_NOTES')
  if (error) return NextResponse.json({ error }, { status })

  const { id: caseId } = await params

  try {
    const { data, error: dbErr } = await supabaseAdmin
      .from('privileged_notes')
      .select('*, author:profiles!author_id(full_name, role)')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })

    if (dbErr) {
      console.error('Privileged notes fetch error:', dbErr)
      // Table might not exist - return empty
      return NextResponse.json({ notes: [] })
    }

    // Audit the access
    await createAuditLog({
      userId: user.id,
      action: 'VIEW_PRIVILEGED_NOTES',
      resourceType: 'case',
      resourceId: caseId,
      details: { notesCount: data?.length || 0 },
    })

    return NextResponse.json({ notes: data || [] })
  } catch (err) {
    console.error('Privileged notes error:', err)
    return NextResponse.json({ notes: [] })
  }
}

/**
 * POST /api/cases/[id]/privileged-notes
 * Officer-only: Create a privileged note
 */
export async function POST(request, { params }) {
  const { user, error, status } = await requirePermission(request, 'CREATE_PRIVILEGED_NOTES')
  if (error) return NextResponse.json({ error }, { status })

  const { id: caseId } = await params
  const { content, isStrategy, visibility } = await request.json()

  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: 'Note content is required' }, { status: 400 })
  }

  const { data, error: dbErr } = await supabaseAdmin
    .from('privileged_notes')
    .insert([{
      case_id: caseId,
      author_id: user.id,
      content: content.trim(),
      is_strategy: isStrategy || false,
      visibility: visibility || 'officer_only',
    }])
    .select()
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  // Audit the creation
  await createAuditLog({
    userId: user.id,
    action: 'CREATE_PRIVILEGED_NOTE',
    resourceType: 'privileged_note',
    resourceId: data.id,
    details: { caseId, isStrategy },
  })

  return NextResponse.json({ note: data }, { status: 201 })
}
