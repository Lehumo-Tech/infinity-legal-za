import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
export const dynamic = 'force-dynamic'

// POST /api/waitlist — Join waitlist
export async function POST(request) {
  try {
    const body = await request.json()
    const { email, phone, name, plan } = body
    
    if (!email && !phone) {
      return NextResponse.json({ error: 'Email or phone required' }, { status: 400 })
    }
    
    const db = await getDb()
    
    // Check if already on waitlist
    if (email) {
      const existing = await db.collection('waitlist').findOne({ email })
      if (existing) {
        return NextResponse.json({ message: 'You are already on the waitlist! We will contact you when premium features launch.', alreadyJoined: true })
      }
    }
    
    const entry = {
      id: `wl_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      email: email || '',
      phone: phone || '',
      name: name || '',
      interestedPlan: plan || 'general',
      source: body.source || 'website',
      joinedAt: new Date().toISOString(),
    }
    
    await db.collection('waitlist').insertOne(entry)
    
    return NextResponse.json({
      message: 'Welcome to the Infinity Legal waitlist! We will notify you as soon as premium plans launch.',
      entry: { id: entry.id, email: entry.email },
    }, { status: 201 })
  } catch (error) {
    console.error('Waitlist error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET /api/waitlist — Count (admin only)
export async function GET(request) {
  try {
    const db = await getDb()
    const count = await db.collection('waitlist').countDocuments()
    const recent = await db.collection('waitlist').find().sort({ joinedAt: -1 }).limit(10).toArray()
    return NextResponse.json({ count, recent })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
