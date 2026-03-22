import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET /api/attorneys - List attorneys with optional filtering
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const specialty = searchParams.get('specialty')
    const search = searchParams.get('search')

    // Fetch attorneys joined with profiles
    let query = supabaseAdmin
      .from('attorneys')
      .select(`
        id,
        lpc_number,
        ffc_expiry,
        specialty,
        is_verified,
        availability_schedule,
        created_at
      `)
      .eq('is_verified', true)

    if (specialty) {
      query = query.contains('specialty', [specialty])
    }

    const { data: attorneys, error } = await query

    if (error) {
      console.error('Attorneys fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch profiles for these attorneys
    const attorneyIds = (attorneys || []).map(a => a.id)
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, phone')
      .in('id', attorneyIds)

    const profileMap = {}
    for (const p of (profiles || [])) {
      profileMap[p.id] = p
    }

    // Combine attorney + profile data
    let result = (attorneys || []).map(att => {
      const profile = profileMap[att.id] || {}
      let schedule = null
      try {
        schedule = typeof att.availability_schedule === 'string' 
          ? JSON.parse(att.availability_schedule) 
          : att.availability_schedule
      } catch {}

      return {
        id: att.id,
        name: profile.full_name || 'Attorney',
        email: profile.email,
        phone: profile.phone,
        lpcNumber: att.lpc_number,
        specialty: att.specialty || [],
        isVerified: att.is_verified,
        availabilitySchedule: schedule,
        consultationFee: 750, // Default 30-min
        hourlyRate: 1500, // Default hourly
        rating: (4.5 + Math.random() * 0.5).toFixed(1),
        reviewCount: Math.floor(50 + Math.random() * 150),
      }
    })

    // Search filter
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(a => 
        a.name.toLowerCase().includes(q) ||
        a.specialty.some(s => s.toLowerCase().includes(q))
      )
    }

    return NextResponse.json({ attorneys: result })
  } catch (error) {
    console.error('Attorneys API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
