import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requirePermission, requireRole, createAuditLog, ROLES, isOfficer } from '@/lib/rbac'
import { createNotification, createBulkNotifications } from '@/lib/notifications'

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

  // Send real-time notifications based on workflow transition
  const docName = doc.file_name || 'Untitled Document'
  const userName = user.profile?.full_name || user.email || 'A team member'

  try {
    if (newStatus === 'review') {
      // Notify officers that a document needs review
      const { data: officers } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .in('role', ['legal_officer', 'managing_partner'])
        .limit(50)
      if (officers?.length) {
        await createBulkNotifications(officers.map(o => ({
          userId: o.id,
          type: 'document',
          title: 'Document Awaiting Review',
          message: `"${docName}" has been submitted for review by ${userName}.`,
          link: '/portal/documents',
          metadata: { documentId: docId, action: 'review' },
        })))
      }
    } else if (newStatus === 'approved') {
      // Notify the preparer that their document was approved
      if (doc.prepared_by_paralegal) {
        await createNotification({
          userId: doc.prepared_by_paralegal,
          type: 'document',
          title: 'Document Approved',
          message: `"${docName}" has been approved by ${userName}.`,
          link: '/portal/documents',
          metadata: { documentId: docId, action: 'approved' },
        })
      }
      // Also notify client if case is linked
      if (doc.case_id) {
        const { data: caseData } = await supabaseAdmin.from('cases').select('client_id').eq('id', doc.case_id).single()
        if (caseData?.client_id) {
          await createNotification({
            userId: caseData.client_id,
            type: 'document',
            title: 'Document Approved',
            message: `A document in your case ("${docName}") has been approved.`,
            link: '/dashboard',
            metadata: { documentId: docId, action: 'approved' },
          })
        }
      }
    } else if (newStatus === 'rejected') {
      // Notify the preparer that their document was rejected
      if (doc.prepared_by_paralegal) {
        await createNotification({
          userId: doc.prepared_by_paralegal,
          type: 'document',
          title: 'Document Rejected',
          message: `"${docName}" has been rejected by ${userName}. Please revise and resubmit.`,
          link: '/portal/documents',
          metadata: { documentId: docId, action: 'rejected' },
        })
      }
    } else if (newStatus === 'signed') {
      // Notify all relevant parties that the document is signed
      const notifyUsers = new Set()
      if (doc.prepared_by_paralegal) notifyUsers.add(doc.prepared_by_paralegal)
      if (doc.case_id) {
        const { data: caseData } = await supabaseAdmin.from('cases').select('client_id, attorney_id').eq('id', doc.case_id).single()
        if (caseData?.client_id) notifyUsers.add(caseData.client_id)
        if (caseData?.attorney_id) notifyUsers.add(caseData.attorney_id)
      }
      notifyUsers.delete(user.id) // Don't notify the signer themselves
      if (notifyUsers.size > 0) {
        await createBulkNotifications([...notifyUsers].map(uid => ({
          userId: uid,
          type: 'document',
          title: 'Document Signed',
          message: `"${docName}" has been signed by ${userName}.`,
          link: '/portal/documents',
          metadata: { documentId: docId, action: 'signed' },
        })))
      }
    }
  } catch (notifErr) {
    console.error('Failed to send document workflow notifications:', notifErr)
    // Don't fail the request if notifications fail
  }

  return NextResponse.json({ document: data, transition: `${currentStatus} → ${newStatus}` })
}
