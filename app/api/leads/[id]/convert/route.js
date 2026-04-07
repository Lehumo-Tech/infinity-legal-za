import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/api-auth'
import { convertLeadToCase } from '@/lib/modules/leads'
export const dynamic = 'force-dynamic'

export async function POST(request, { params }) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const result = await convertLeadToCase(id, user.id, user.email || 'Unknown')
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ caseId: result.caseId }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
