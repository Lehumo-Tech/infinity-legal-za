import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/api-auth'
import { getDb } from '@/lib/mongodb'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const db = await getDb()
    
    const [totalCases, activeCases, newCases, closedCases, totalClients, totalTasks, pendingTasks, totalDocuments, totalLeads] = await Promise.all([
      db.collection('cases').countDocuments(),
      db.collection('cases').countDocuments({ status: { $in: ['active', 'pending_court', 'settlement'] } }),
      db.collection('cases').countDocuments({ status: 'new' }),
      db.collection('cases').countDocuments({ status: { $in: ['closed', 'resolved'] } }),
      db.collection('clients').countDocuments(),
      db.collection('case_tasks').countDocuments(),
      db.collection('case_tasks').countDocuments({ status: 'pending' }),
      db.collection('documents').countDocuments(),
      db.collection('leads').countDocuments(),
    ])
    
    // Recent cases
    const recentCases = await db.collection('cases').find().sort({ createdAt: -1 }).limit(5).toArray()
    
    // Today's court dates
    const today = new Date().toISOString().split('T')[0]
    const courtDates = await db.collection('cases').find({
      court_date: { $regex: `^${today}` }
    }).toArray()
    
    return NextResponse.json({
      stats: {
        totalCases, activeCases, newCases, closedCases,
        totalClients, totalTasks, pendingTasks,
        totalDocuments, totalLeads,
        courtDatesToday: courtDates.length,
      },
      recentCases,
      courtDates,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
