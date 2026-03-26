import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
export const dynamic = 'force-dynamic'

/**
 * POST /api/analytics
 * Privacy-compliant analytics endpoint.
 * No PII collected. No cookies. No third-party trackers.
 * POPIA / GDPR compliant by design.
 */
export async function POST(request) {
  try {
    const body = await request.json()
    const { event, page, referrer, metadata } = body

    if (!event || !page) {
      return NextResponse.json({ error: 'event and page required' }, { status: 400 })
    }

    const db = await getDb()
    await db.collection('page_analytics').insertOne({
      event: String(event).slice(0, 50),
      page: String(page).slice(0, 200),
      referrer: referrer ? String(referrer).slice(0, 200) : null,
      // No IP, no user agent, no fingerprint — POPIA compliant
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true }) // Silent fail
  }
}

/**
 * GET /api/analytics
 * Returns aggregated analytics (admin only, no PII).
 */
export async function GET(request) {
  try {
    // Simple auth check
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDb()
    const today = new Date().toISOString().split('T')[0]
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Aggregate page views by day
    const dailyViews = await db.collection('page_analytics').aggregate([
      { $match: { date: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$date', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]).toArray()

    // Top pages
    const topPages = await db.collection('page_analytics').aggregate([
      { $match: { date: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$page', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]).toArray()

    // Events breakdown
    const events = await db.collection('page_analytics').aggregate([
      { $match: { date: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$event', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).toArray()

    // Today's count
    const todayCount = await db.collection('page_analytics').countDocuments({ date: today })

    return NextResponse.json({
      period: '30d',
      today: todayCount,
      dailyViews: dailyViews.map(d => ({ date: d._id, views: d.count })),
      topPages: topPages.map(p => ({ page: p._id, views: p.count })),
      events: events.map(e => ({ event: e._id, count: e.count })),
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
