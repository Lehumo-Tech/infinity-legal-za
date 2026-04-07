import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/api-auth'
import { transitionWorkflow } from '@/lib/modules/documents'
export const dynamic = 'force-dynamic'

export async function PUT(request, { params }) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const { newStatus } = await request.json()
    if (!newStatus) return NextResponse.json({ error: 'newStatus required' }, { status: 400 })
    const result = await transitionWorkflow(id, newStatus, user.id, user.email || 'Unknown')
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ transition: result.transition })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
