import { NextResponse } from 'next/server'
import { keepAlive } from '@/lib/keepalive-service'
export const dynamic = 'force-dynamic'

/**
 * GET /api/keep-alive
 * Called by Vercel Cron every 3 days to keep Supabase project active
 */
export async function GET() {
  const result = await keepAlive()
  return NextResponse.json(result)
}
