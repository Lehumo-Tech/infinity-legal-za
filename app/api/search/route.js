import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUserFromRequest } from '@/lib/rbac'
export const dynamic = 'force-dynamic'

/**
 * GET /api/search?q=query
 * Unified search across cases, clients, documents, knowledge base
 */
export async function GET(request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    if (!q || q.length < 2) return NextResponse.json({ results: [] })

    const results = []

    // Search cases in Supabase
    try {
      const { data: cases } = await supabaseAdmin.from('cases')
        .select('id, case_number, case_type, case_subtype, status, created_at')
        .or(`case_number.ilike.%${q}%,case_type.ilike.%${q}%,case_subtype.ilike.%${q}%`)
        .limit(10)
      if (cases) {
        cases.forEach(c => results.push({
          id: c.id, type: 'case', title: c.case_number || 'Case',
          subtitle: `${c.case_type} - ${c.case_subtype || ''}`,
          status: c.status, href: '/portal/cases',
          createdAt: c.created_at,
        }))
      }
    } catch { /* ignore */ }

    // Search clients in MongoDB
    try {
      const db = await getDb()
      const clients = await db.collection('clients').find({
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
        ]
      }).limit(10).toArray()

      clients.forEach(c => results.push({
        id: c.id, type: 'client', title: c.name,
        subtitle: c.email || c.phone || '',
        href: '/portal/cases', createdAt: c.createdAt,
      }))
    } catch { /* ignore */ }

    // Search knowledge base
    try {
      const db = await getDb()
      const articles = await db.collection('knowledge_base').find({
        isActive: true,
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { summary: { $regex: q, $options: 'i' } },
          { tags: { $elemMatch: { $regex: q, $options: 'i' } } },
        ]
      }).limit(10).toArray()

      articles.forEach(a => results.push({
        id: a.id, type: 'knowledge', title: a.title,
        subtitle: a.summary?.substring(0, 80) || a.type || '',
        href: '/portal/knowledge', createdAt: a.createdAt,
      }))
    } catch { /* ignore */ }

    // Search documents in Supabase
    try {
      const { data: docs } = await supabaseAdmin.from('documents')
        .select('id, file_name, document_category, workflow_status, created_at')
        .ilike('file_name', `%${q}%`)
        .limit(10)
      if (docs) {
        docs.forEach(d => results.push({
          id: d.id, type: 'document', title: d.file_name,
          subtitle: d.document_category || 'Document',
          status: d.workflow_status,
          href: '/portal/documents', createdAt: d.created_at,
        }))
      }
    } catch { /* ignore */ }

    return NextResponse.json({ results, query: q })
  } catch (err) {
    console.error('Search error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
