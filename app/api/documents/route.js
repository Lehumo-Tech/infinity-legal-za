import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/api-auth'
import { listDocuments, createDocument } from '@/lib/modules/documents'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const caseId = searchParams.get('caseId')
    const documents = await listDocuments({ caseId: caseId || undefined })
    return NextResponse.json({ documents })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const doc = await createDocument(body, user.id, user.email || 'Unknown')
    return NextResponse.json({ document: doc }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
