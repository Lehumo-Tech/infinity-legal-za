import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requirePermission, requireRole, createAuditLog, ROLES, isOfficer } from '@/lib/rbac'

/**
 * PUT /api/documents/[id]/workflow
 * Transition a document through workflow statuses
 * Draft → Review → Approved → Signed
 */
export async function PUT(request, { params }) {
  // Minimum: must be able to view documents
  const { user, error, status } = await requirePermission(request, 'VIEW_DOCUMENTS')
  if (error) return NextResponse.json({ error }, { status })

  const docId = params.id
  const { newStatus } = await request.json()
  const role = user.profile?.role

  if (!newStatus) {
    return NextResponse.json({ error: 'newStatus is required' }, { status: 400 })
  }

  // Fetch current document
  const { data: doc, error: fetchErr } = await supabaseAdmin
    .from('documents')
    .select('*')
    .eq('id', docId)
    .single()

  if (fetchErr || !doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  const currentStatus = doc.workflow_status || 'draft'
  const updates = { updated_at: new Date().toISOString() }

  // Validate transitions
  const validTransitions = {
    'draft': ['review'],
    'review': ['approved', 'rejected', 'draft'],
    'approved': ['signed', 'review'],
    'rejected': ['draft'],
    'signed': [], // Terminal state
  }

  if (!validTransitions[currentStatus]?.includes(newStatus)) {
    return NextResponse.json({
      error: `Invalid transition: ${currentStatus} → ${newStatus}. Allowed: ${validTransitions[currentStatus]?.join(', ') || 'none'}`,
    }, { status: 400 })
  }

  // Enforce role restrictions
  // Only Paralegals+ can submit for review
  if (newStatus === 'review') {
    updates.workflow_status = 'review'
    updates.prepared_by_paralegal = role === ROLES.PARALEGAL ? user.id : null
  }

  // Only Officers can approve
  if (newStatus === 'approved') {
    if (!isOfficer(role)) {
      return NextResponse.json({
        error: 'Only Legal Officers and Managing Partners can approve documents.',
      }, { status: 403 })
    }
    updates.workflow_status = 'approved'
    updates.approved_by = user.id
    updates.approved_at = new Date().toISOString()
    updates.supervising_officer = user.id
  }

  // Only Officers can sign
  if (newStatus === 'signed') {
    if (!isOfficer(role)) {
      return NextResponse.json({
        error: 'Only Legal Officers and Managing Partners can sign documents.',
      }, { status: 403 })
    }
    updates.workflow_status = 'signed'
    updates.signed_by = user.id
    updates.signed_at = new Date().toISOString()
    updates.locked_by_role = role
  }

  // Reject or send back to draft
  if (newStatus === 'rejected' || newStatus === 'draft') {
    updates.workflow_status = newStatus
    if (newStatus === 'draft') {
      updates.approved_by = null
      updates.approved_at = null
    }
  }

  const { data, error: updateErr } = await supabaseAdmin
    .from('documents')
    .update(updates)
    .eq('id', docId)
    .select()
    .single()

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  // Audit log
  await createAuditLog({
    userId: user.id,
    action: `DOCUMENT_${newStatus.toUpperCase()}`,
    resourceType: 'document',
    resourceId: docId,
    details: { previousStatus: currentStatus, newStatus, documentName: doc.file_name },
  })

  return NextResponse.json({ document: data, transition: `${currentStatus} → ${newStatus}` })
}
