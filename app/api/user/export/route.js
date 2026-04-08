import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/api-auth'
import { getDb } from '@/lib/mongodb'
export const dynamic = 'force-dynamic'

// GET /api/user/export — Export user data (POPIA compliance)
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const db = await getDb()
    
    // Collect all user data from MongoDB
    const [cases, tasks, notes, messages, leads, documents, intakes] = await Promise.all([
      db.collection('cases').find({ $or: [{ createdBy: user.id }, { client_id: user.id }] }).toArray(),
      db.collection('case_tasks').find({ $or: [{ createdBy: user.id }, { assigneeId: user.id }] }).toArray(),
      db.collection('case_notes').find({ authorId: user.id }).toArray(),
      db.collection('case_messages').find({ senderId: user.id }).toArray(),
      db.collection('leads').find({ created_by: user.id }).toArray(),
      db.collection('documents').find({ created_by: user.id }).toArray(),
      db.collection('intakes').find({ userId: user.id }).toArray(),
    ])
    
    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      data: {
        cases: cases.map(c => ({ ...c, _id: undefined })),
        tasks: tasks.map(t => ({ ...t, _id: undefined })),
        notes: notes.map(n => ({ ...n, _id: undefined })),
        messages: messages.map(m => ({ ...m, _id: undefined })),
        leads: leads.map(l => ({ ...l, _id: undefined })),
        documents: documents.map(d => ({ ...d, _id: undefined })),
        intakes: intakes.map(i => ({ ...i, _id: undefined })),
      },
      summary: {
        totalCases: cases.length,
        totalTasks: tasks.length,
        totalNotes: notes.length,
        totalMessages: messages.length,
        totalLeads: leads.length,
        totalDocuments: documents.length,
        totalIntakes: intakes.length,
      },
      notice: 'This export is provided in compliance with POPIA Section 23 (Right of Access). For any queries, contact legal@infinitylegal.org.',
    }
    
    return NextResponse.json(exportData)
  } catch (error) {
    console.error('Data export error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
