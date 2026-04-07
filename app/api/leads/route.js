import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/api-auth'
import { listLeads, createLead, updateLead } from '@/lib/modules/leads'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const leads = await listLeads({ status: status || undefined })
    return NextResponse.json({ leads })
  } catch (error) {
    console.error('Leads GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const result = await createLead(body, user.id)
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ lead: result.lead }, { status: 201 })
  } catch (error) {
    console.error('Leads POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const result = await updateLead(body, user.id, user.email || 'Unknown')
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ lead: result.lead })
  } catch (error) {
    console.error('Leads PUT error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
