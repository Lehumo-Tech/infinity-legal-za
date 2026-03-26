import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'
export const dynamic = 'force-dynamic'

async function getUserFromRequest(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  const token = authHeader.split(' ')[1]
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  return user
}

// GET /api/documents - List documents
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const caseId = searchParams.get('case_id')

    let query = supabaseAdmin
      .from('documents')
      .select('*, cases(case_number, case_subtype, case_type)')

    if (caseId) {
      query = query.eq('case_id', caseId)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('Documents fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ documents: data || [] })
  } catch (error) {
    console.error('Documents API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/documents - Upload document metadata
export async function POST(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { file_name, file_path, file_type, file_size_bytes, case_id, document_category } = body

    if (!file_name || !file_path) {
      return NextResponse.json({ error: 'File name and path are required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('documents')
      .insert([{
        case_id: case_id || null,
        uploaded_by: user.id,
        file_name,
        file_path,
        file_type: file_type || 'application/octet-stream',
        file_size_bytes: file_size_bytes || 0,
        document_category: document_category || 'other',
        is_confidential: true,
        version: 1
      }])
      .select('*, cases(case_number, case_subtype, case_type)')
      .single()

    if (error) {
      console.error('Document create error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ document: data }, { status: 201 })
  } catch (error) {
    console.error('Documents API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
