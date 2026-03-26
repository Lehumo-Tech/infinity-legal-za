import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// GET /api/plans - List active pricing plans
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('pricing_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_zar', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ plans: data || [] })
  } catch (error) {
    console.error('Plans API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
