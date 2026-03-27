import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { createClient } from '@supabase/supabase-js'
export const dynamic = 'force-dynamic'

async function getUserFromRequest(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  const token = authHeader.split(' ')[1]
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  return user
}

// GET /api/documents/[id]/versions - Get version history
export async function GET(request, { params }) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: docId } = await params
    const db = await getDb()

    const versions = await db.collection('document_versions')
      .find({ documentId: docId })
      .sort({ version: -1 })
      .toArray()

    // Get lock status
    const lockInfo = await db.collection('document_locks').findOne({ documentId: docId })

    return NextResponse.json({
      versions,
      lockInfo: lockInfo || null,
      totalVersions: versions.length,
    })
  } catch (error) {
    console.error('Document versions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/documents/[id]/versions - Create a new version
export async function POST(request, { params }) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: docId } = await params
    const body = await request.json()
    const { fileName, filePath, fileSize, fileType, changeNotes } = body

    const db = await getDb()

    // Check if document is locked by someone else
    const lockInfo = await db.collection('document_locks').findOne({ documentId: docId })
    if (lockInfo && lockInfo.lockedBy !== user.id) {
      return NextResponse.json({
        error: `Document is checked out by ${lockInfo.lockedByName}. Please wait for check-in.`,
      }, { status: 409 })
    }

    // Get current highest version
    const latestVersion = await db.collection('document_versions')
      .findOne({ documentId: docId }, { sort: { version: -1 } })
    const newVersionNum = (latestVersion?.version || 0) + 1

    const versionId = `ver_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    const version = {
      id: versionId,
      documentId: docId,
      version: newVersionNum,
      fileName: fileName || `Version ${newVersionNum}`,
      filePath: filePath || null,
      fileSize: fileSize || 0,
      fileType: fileType || 'application/octet-stream',
      changeNotes: changeNotes || '',
      uploadedBy: user.id,
      uploadedByName: user.email,
      createdAt: new Date().toISOString(),
    }

    await db.collection('document_versions').insertOne(version)

    // Auto check-in after uploading new version
    if (lockInfo && lockInfo.lockedBy === user.id) {
      await db.collection('document_locks').deleteOne({ documentId: docId })
    }

    return NextResponse.json({ version, message: `Version ${newVersionNum} created successfully` }, { status: 201 })
  } catch (error) {
    console.error('Document version create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
