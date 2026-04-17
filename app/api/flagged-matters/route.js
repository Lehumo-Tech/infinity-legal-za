import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
export const dynamic = 'force-dynamic'

const HIGH_RISK_KEYWORDS = ['murder', 'rape', 'sexual assault', 'high court', 'constitutional', 'supreme court', 'terrorism', 'treason', 'kidnapping', 'armed robbery', 'gender-based violence', 'gbv', 'child abuse']

export function checkHighRisk(query) {
  const lower = query.toLowerCase()
  const matched = HIGH_RISK_KEYWORDS.filter(kw => lower.includes(kw))
  return { isHighRisk: matched.length > 0, matchedKeywords: matched }
}

// POST /api/flagged-matters — Flag a high-risk matter for human review
export async function POST(request) {
  try {
    const body = await request.json()
    const { query, userId, userEmail, categories, matchedKeywords, aiResponse } = body
    const db = await getDb()

    const flag = {
      id: `flag_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      query,
      userId: userId || 'anonymous',
      userEmail: userEmail || '',
      categories: categories || [],
      matchedKeywords: matchedKeywords || [],
      aiResponse: aiResponse ? aiResponse.substring(0, 500) : '',
      status: 'pending_review',
      severity: matchedKeywords?.some(k => ['murder', 'rape', 'terrorism', 'child abuse'].includes(k)) ? 'critical' : 'high',
      assignedAdvisor: null,
      reviewNotes: '',
      createdAt: new Date().toISOString(),
    }

    await db.collection('flagged_matters').insertOne(flag)
    return NextResponse.json({ success: true, flagId: flag.id, severity: flag.severity }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET /api/flagged-matters — List flagged matters for advisors
export async function GET(request) {
  try {
    const db = await getDb()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const filter = status ? { status } : {}

    const matters = await db.collection('flagged_matters').find(filter).sort({ createdAt: -1 }).limit(50).toArray()
    const stats = {
      total: await db.collection('flagged_matters').countDocuments(),
      pending: await db.collection('flagged_matters').countDocuments({ status: 'pending_review' }),
      inProgress: await db.collection('flagged_matters').countDocuments({ status: 'in_progress' }),
      resolved: await db.collection('flagged_matters').countDocuments({ status: 'resolved' }),
    }

    return NextResponse.json({ success: true, stats, matters })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
