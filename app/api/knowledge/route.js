import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getUserFromRequest, hasPermission } from '@/lib/rbac'
export const dynamic = 'force-dynamic'

/**
 * GET /api/knowledge
 * Search and browse legal knowledge base (precedents, articles, memos)
 */
export async function GET(request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const db = await getDb()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const type = searchParams.get('type')

    const filter = { isActive: true }
    if (category) filter.category = category
    if (type) filter.type = type
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } },
        { tags: { $elemMatch: { $regex: search, $options: 'i' } } },
        { caseReference: { $regex: search, $options: 'i' } },
      ]
    }

    const articles = await db.collection('knowledge_base')
      .find(filter)
      .sort({ viewCount: -1, createdAt: -1 })
      .limit(100)
      .toArray()

    return NextResponse.json({
      articles: articles.map(a => ({
        id: a.id, title: a.title, summary: a.summary || '',
        content: a.content || '', type: a.type || 'article',
        category: a.category || 'general',
        caseReference: a.caseReference || '',
        court: a.court || '', jurisdiction: a.jurisdiction || 'south_africa',
        dateDecided: a.dateDecided || null,
        tags: a.tags || [], relatedCaseTypes: a.relatedCaseTypes || [],
        viewCount: a.viewCount || 0,
        authorId: a.authorId, authorName: a.authorName || '',
        createdAt: a.createdAt, updatedAt: a.updatedAt,
      }))
    })
  } catch (err) {
    console.error('Knowledge GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/knowledge
 * Add to knowledge base (precedent, memo, article)
 */
export async function POST(request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.profile?.role || 'client'
  if (!hasPermission(role, 'MANAGE_KNOWLEDGE')) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { title, summary, content, type, category, caseReference, court, dateDecided, tags, relatedCaseTypes } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content required' }, { status: 400 })
    }

    const db = await getDb()
    const now = new Date().toISOString()
    const articleId = `kb_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`

    const article = {
      id: articleId, title: title.trim(),
      summary: (summary || '').trim(),
      content: content.trim(),
      type: type || 'article',
      category: category || 'general',
      caseReference: (caseReference || '').trim(),
      court: (court || '').trim(),
      jurisdiction: 'south_africa',
      dateDecided: dateDecided || null,
      tags: tags || [], relatedCaseTypes: relatedCaseTypes || [],
      viewCount: 0, isActive: true,
      authorId: user.id,
      authorName: user.profile?.full_name || user.email,
      createdAt: now, updatedAt: now,
    }

    await db.collection('knowledge_base').insertOne(article)
    return NextResponse.json({ article }, { status: 201 })
  } catch (err) {
    console.error('Knowledge POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
