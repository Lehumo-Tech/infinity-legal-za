import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/api-auth'
import { toggleLock } from '@/lib/modules/documents'
export const dynamic = 'force-dynamic'

export async function POST(request, { params }) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const { action } = await request.json()
    if (!action || !['checkout', 'checkin'].includes(action)) {
      return NextResponse.json({ error: 'action must be "checkout" or "checkin"' }, { status: 400 })
    }
    const result = await toggleLock(id, action, user.id, user.email || 'Unknown')
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ message: result.message })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
