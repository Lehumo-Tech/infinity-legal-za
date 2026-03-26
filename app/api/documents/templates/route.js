import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getUserFromRequest, hasPermission } from '@/lib/rbac'
export const dynamic = 'force-dynamic'

/**
 * GET /api/documents/templates
 * List document templates
 */
export async function GET(request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const db = await getDb()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const filter = { isActive: true }
    if (category) filter.category = category

    const templates = await db.collection('document_templates')
      .find(filter)
      .sort({ usageCount: -1, name: 1 })
      .limit(100)
      .toArray()

    return NextResponse.json({
      templates: templates.map(t => ({
        id: t.id, name: t.name, description: t.description || '',
        category: t.category || 'general', content: t.content || '',
        fields: t.fields || [], tags: t.tags || [],
        usageCount: t.usageCount || 0, createdBy: t.createdBy,
        createdByName: t.createdByName || '', createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      }))
    })
  } catch (err) {
    console.error('Templates GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/documents/templates
 * Create a document template
 */
export async function POST(request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.profile?.role || 'client'
  if (!hasPermission(role, 'MANAGE_DOCUMENTS')) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { name, description, category, content, fields, tags } = body

    if (!name || !content) {
      return NextResponse.json({ error: 'Name and content are required' }, { status: 400 })
    }

    const db = await getDb()
    const now = new Date().toISOString()
    const templateId = `tmpl_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`

    const template = {
      id: templateId, name: name.trim(),
      description: (description || '').trim(),
      category: category || 'general',
      content: content.trim(),
      fields: fields || [],
      tags: tags || [],
      usageCount: 0, isActive: true,
      createdBy: user.id,
      createdByName: user.profile?.full_name || user.email,
      createdAt: now, updatedAt: now,
    }

    await db.collection('document_templates').insertOne(template)
    return NextResponse.json({ template }, { status: 201 })
  } catch (err) {
    console.error('Templates POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
