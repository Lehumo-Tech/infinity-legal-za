import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/api-auth'
import { getVersions, createVersion } from '@/lib/modules/documents'
export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const result = await getVersions(id)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const body = await request.json()
    const result = await createVersion(id, body, user.id, user.email || 'Unknown')
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ version: result.version, message: 'Version created successfully' }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
