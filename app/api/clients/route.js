import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUserFromRequest, hasPermission } from '@/lib/rbac'
export const dynamic = 'force-dynamic'

/**
 * GET /api/clients
 * Search and list clients
 */
export async function GET(request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const db = await getDb()

    // Get client profiles from MongoDB (enriched data)
    const filter = {}
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { idNumber: { $regex: search, $options: 'i' } },
      ]
    }

    const clients = await db.collection('clients')
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray()

    // Also search Supabase profiles with role='client' if no MongoDB results
    let supabaseClients = []
    if (clients.length === 0 || search) {
      try {
        let query = supabaseAdmin.from('profiles').select('id, full_name, email, phone, role, created_at').eq('role', 'client')
        if (search) {
          query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
        }
        const { data } = await query.order('created_at', { ascending: false }).limit(100)
        if (data) supabaseClients = data.map(p => ({
          id: p.id, name: p.full_name || '', email: p.email || '',
          phone: p.phone || '', source: 'supabase',
          createdAt: p.created_at,
        }))
      } catch { /* ignore */ }
    }

    // Merge and deduplicate
    const allClients = [...clients.map(c => ({
      id: c.id, name: c.name || '', email: c.email || '',
      phone: c.phone || '', idNumber: c.idNumber || '',
      company: c.company || '', address: c.address || '',
      source: 'mongodb', caseCount: c.caseCount || 0,
      createdAt: c.createdAt,
    }))]

    // Add Supabase clients not already in MongoDB
    const existingIds = new Set(allClients.map(c => c.id))
    const existingEmails = new Set(allClients.map(c => c.email?.toLowerCase()).filter(Boolean))
    supabaseClients.forEach(sc => {
      if (!existingIds.has(sc.id) && !existingEmails.has(sc.email?.toLowerCase())) {
        allClients.push(sc)
      }
    })

    return NextResponse.json({ clients: allClients })
  } catch (err) {
    console.error('Clients GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/clients
 * Create a new client record
 */
export async function POST(request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { name, email, phone, idNumber, company, address } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Client name is required' }, { status: 400 })
    }

    const db = await getDb()

    // Check for duplicates
    if (email) {
      const existing = await db.collection('clients').findOne({ email: email.toLowerCase() })
      if (existing) {
        return NextResponse.json({ error: 'A client with this email already exists', existingClient: { id: existing.id, name: existing.name } }, { status: 409 })
      }
    }
    if (idNumber) {
      const existing = await db.collection('clients').findOne({ idNumber })
      if (existing) {
        return NextResponse.json({ error: 'A client with this ID number already exists', existingClient: { id: existing.id, name: existing.name } }, { status: 409 })
      }
    }

    const now = new Date().toISOString()
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`

    const client = {
      id: clientId,
      name: name.trim(),
      email: (email || '').toLowerCase().trim(),
      phone: (phone || '').trim(),
      idNumber: (idNumber || '').trim(),
      company: (company || '').trim(),
      address: (address || '').trim(),
      caseCount: 0,
      createdBy: user.id,
      createdByName: user.profile?.full_name || user.email,
      createdAt: now, updatedAt: now,
    }

    await db.collection('clients').insertOne(client)
    return NextResponse.json({ client }, { status: 201 })
  } catch (err) {
    console.error('Clients POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
