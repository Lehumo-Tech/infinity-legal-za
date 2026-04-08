import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
export const dynamic = 'force-dynamic'

const LEGAL_NEED_SCORES = {
  'CCMA': 3,
  'Labour Dispute': 3,
  'Unfair Dismissal': 3,
  'Eviction': 2,
  'Divorce': 2,
  'Criminal': 2,
  'Custody': 2,
  'Debt Review': 1,
  'Consumer': 1,
  'Property': 1,
  'Contract': 1,
  'General': 0,
  'Other': 0,
}

function scoreLead(data) {
  let score = 0
  // Legal need scoring
  const need = data.legal_need || ''
  if (LEGAL_NEED_SCORES[need] !== undefined) {
    score += LEGAL_NEED_SCORES[need]
  }
  // SA domain = higher intent
  if (data.email && data.email.endsWith('.co.za')) score += 1
  // Phone provided = more engaged
  if (data.phone && data.phone.trim().length > 5) score += 1
  // Name provided
  if (data.name && data.name.trim().length > 1) score += 0.5
  // Clamp to 0-5
  return Math.min(Math.round(score * 10) / 10, 5)
}

function getPriority(score) {
  if (score >= 4) return 'hot'
  if (score >= 2.5) return 'warm'
  if (score >= 1) return 'cool'
  return 'cold'
}

// POST /api/waitlist — Lead capture
export async function POST(request) {
  try {
    const body = await request.json()
    const { email, phone, name, plan, legal_need } = body
    
    if (!email && !phone) {
      return NextResponse.json({ error: 'Email or phone required' }, { status: 400 })
    }
    
    const db = await getDb()
    
    // Check if already registered
    if (email) {
      const existing = await db.collection('waitlist').findOne({ email })
      if (existing) {
        // Update their legal_need and rescore if they come back
        if (legal_need && legal_need !== existing.legal_need) {
          const updatedScore = scoreLead({ ...existing, legal_need })
          await db.collection('waitlist').updateOne(
            { email },
            { $set: { legal_need, score: updatedScore, priority: getPriority(updatedScore), updatedAt: new Date().toISOString() } }
          )
        }
        return NextResponse.json({ message: 'Welcome back! Your details have been updated. We\'ll be in touch soon.', alreadyJoined: true })
      }
    }
    
    const score = scoreLead(body)
    const entry = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      email: email || '',
      phone: phone || '',
      name: name || '',
      legal_need: legal_need || '',
      interestedPlan: plan || 'general',
      source: body.source || 'website',
      score,
      priority: getPriority(score),
      status: 'new',
      joinedAt: new Date().toISOString(),
    }
    
    await db.collection('waitlist').insertOne(entry)
    
    return NextResponse.json({
      message: 'Thank you for registering! Our team will review your details and reach out shortly.',
      entry: { id: entry.id, email: entry.email },
    }, { status: 201 })
  } catch (error) {
    console.error('Lead capture error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET /api/waitlist — Lead list (admin)
export async function GET(request) {
  try {
    const db = await getDb()
    const { searchParams } = new URL(request.url)
    const priority = searchParams.get('priority')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    const filter = priority ? { priority } : {}
    const count = await db.collection('waitlist').countDocuments()
    const leads = await db.collection('waitlist').find(filter).sort({ score: -1, joinedAt: -1 }).limit(limit).toArray()
    
    // Stats
    const stats = {
      total: count,
      hot: await db.collection('waitlist').countDocuments({ priority: 'hot' }),
      warm: await db.collection('waitlist').countDocuments({ priority: 'warm' }),
      cool: await db.collection('waitlist').countDocuments({ priority: 'cool' }),
      cold: await db.collection('waitlist').countDocuments({ priority: 'cold' }),
    }
    
    return NextResponse.json({ count, stats, leads })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
