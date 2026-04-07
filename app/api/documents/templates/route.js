import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/api-auth'
import { listTemplates, createTemplate } from '@/lib/modules/documents'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const templates = await listTemplates()
    return NextResponse.json({ templates })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    if (!body.name || !body.content) return NextResponse.json({ error: 'name and content required' }, { status: 400 })
    const template = await createTemplate(body, user.id, user.email || 'Unknown')
    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
