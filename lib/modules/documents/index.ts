// Documents Module — Core Logic

import { getDb } from '@/lib/mongodb'
import { Document, DocumentVersion, DocumentLock, DocumentTemplate, WORKFLOW_TRANSITIONS, DocWorkflowStatus } from './types'

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
}

export async function listDocuments(filter?: { status?: string; caseId?: string }): Promise<Document[]> {
  const db = await getDb()
  const query: any = {}
  if (filter?.caseId) query.case_id = filter.caseId
  const docs = await db.collection('documents').find(query).sort({ created_at: -1 }).limit(200).toArray()
  return docs as Document[]
}

export async function createDocument(input: any, userId: string, userEmail: string): Promise<Document> {
  const db = await getDb()
  const doc: Document = {
    id: genId('doc'),
    file_name: input.title || input.file_name || 'Untitled Document',
    file_type: input.type || input.file_type || 'document',
    document_category: input.category || input.document_category || 'general',
    workflow_status: 'draft',
    version: 1,
    case_id: input.caseId || input.case_id || null,
    case_name: input.caseName || input.case_name || null,
    content: input.content || '',
    created_by: userId,
    created_by_name: userEmail,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  await db.collection('documents').insertOne(doc)
  return doc
}

export async function transitionWorkflow(docId: string, newStatus: DocWorkflowStatus, userId: string, userEmail: string): Promise<{ success: boolean; transition?: string; error?: string }> {
  const db = await getDb()
  const doc = await db.collection('documents').findOne({ id: docId })
  if (!doc) return { success: false, error: 'Document not found' }

  const currentStatus = (doc.workflow_status || 'draft') as DocWorkflowStatus
  const allowed = WORKFLOW_TRANSITIONS[currentStatus] || []
  if (!allowed.includes(newStatus)) {
    return { success: false, error: `Cannot transition from "${currentStatus}" to "${newStatus}". Allowed: ${allowed.join(', ') || 'none'}` }
  }

  await db.collection('documents').updateOne({ id: docId }, {
    $set: {
      workflow_status: newStatus,
      [`${newStatus}_by`]: userId,
      [`${newStatus}_by_name`]: userEmail,
      [`${newStatus}_at`]: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  })

  return { success: true, transition: `${currentStatus} → ${newStatus}` }
}

// Version management
export async function getVersions(docId: string): Promise<{ versions: DocumentVersion[]; lockInfo: DocumentLock | null }> {
  const db = await getDb()
  const versions = await db.collection('document_versions').find({ document_id: docId }).sort({ version: -1 }).toArray() as DocumentVersion[]
  const lockInfo = await db.collection('document_locks').findOne({ document_id: docId }) as DocumentLock | null
  return { versions, lockInfo }
}

export async function createVersion(docId: string, input: any, userId: string, userEmail: string): Promise<{ version?: DocumentVersion; error?: string }> {
  const db = await getDb()
  const existing = await db.collection('document_versions').find({ document_id: docId }).sort({ version: -1 }).limit(1).toArray()
  const nextVersion = existing.length > 0 ? (existing[0].version || 1) + 1 : 1

  const version: DocumentVersion = {
    id: genId('ver'),
    document_id: docId,
    version: nextVersion,
    fileName: input.fileName || `v${nextVersion}`,
    filePath: input.filePath || '',
    changeNotes: input.changeNotes || '',
    uploadedBy: userId,
    uploadedByName: userEmail,
    createdAt: new Date().toISOString(),
  }
  await db.collection('document_versions').insertOne(version)

  // Update main doc version number
  await db.collection('documents').updateOne({ id: docId }, { $set: { version: nextVersion, updated_at: new Date().toISOString() } })

  return { version }
}

export async function toggleLock(docId: string, action: 'checkout' | 'checkin', userId: string, userEmail: string): Promise<{ success: boolean; message: string; error?: string }> {
  const db = await getDb()
  if (action === 'checkout') {
    const existing = await db.collection('document_locks').findOne({ document_id: docId })
    if (existing) return { success: false, message: '', error: `Document already checked out by ${existing.lockedByName}` }
    await db.collection('document_locks').insertOne({
      document_id: docId,
      lockedBy: userId,
      lockedByName: userEmail,
      lockedAt: new Date().toISOString(),
    })
    return { success: true, message: 'Document checked out for editing' }
  } else {
    await db.collection('document_locks').deleteOne({ document_id: docId })
    return { success: true, message: 'Document checked in' }
  }
}

// Templates
export async function listTemplates(): Promise<DocumentTemplate[]> {
  const db = await getDb()
  return db.collection('document_templates').find().sort({ createdAt: -1 }).toArray() as Promise<DocumentTemplate[]>
}

export async function createTemplate(input: any, userId: string, userEmail: string): Promise<DocumentTemplate> {
  const db = await getDb()
  const template: DocumentTemplate = {
    id: genId('tpl'),
    name: input.name,
    description: input.description || '',
    category: input.category || 'general',
    content: input.content,
    tags: input.tags || [],
    usageCount: 0,
    createdBy: userId,
    createdByName: userEmail,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  await db.collection('document_templates').insertOne(template)
  return template
}
