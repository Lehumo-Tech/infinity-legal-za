import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { createClient } from '@supabase/supabase-js'
export const dynamic = 'force-dynamic'

async function getUserFromRequest(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  const token = authHeader.split(' ')[1]
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  return user
}

// GET /api/intakes - List intake submissions
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const category = searchParams.get('category')
    const urgency = searchParams.get('urgency')
    const search = searchParams.get('search')

    const db = await getDb()
    const filter = {}
    
    if (status && status !== 'all') {
      filter.status = status
    }
    if (category) {
      filter['analysis.category'] = category
    }
    if (urgency) {
      filter['analysis.urgency'] = urgency
    }
    if (search) {
      filter['$or'] = [
        { 'analysis.summary': { $regex: search, $options: 'i' } },
        { 'analysis.category': { $regex: search, $options: 'i' } },
        { 'analysis.subcategory': { $regex: search, $options: 'i' } },
      ]
    }

    const intakes = await db.collection('intake_submissions')
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray()

    return NextResponse.json({ intakes })
  } catch (error) {
    console.error('Intakes list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
