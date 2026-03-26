import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { validateEnvironment } from '@/lib/env-validation'
export const dynamic = 'force-dynamic'

/**
 * GET /api/health
 * System health check endpoint for monitoring/alerting.
 * Returns status of all services.
 */
export async function GET() {
  const startTime = Date.now()
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    uptime: Math.floor(process.uptime()),
    services: {},
  }

  // Check MongoDB
  try {
    const db = await getDb()
    await db.command({ ping: 1 })
    checks.services.mongodb = { status: 'connected', latencyMs: Date.now() - startTime }
  } catch (err) {
    checks.services.mongodb = { status: 'error', error: err.message }
    checks.status = 'degraded'
  }

  // Check Supabase
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (supabaseUrl) {
      const res = await fetch(`${supabaseUrl}/auth/v1/health`, {
        headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
        signal: AbortSignal.timeout(5000),
      })
      checks.services.supabase = { status: res.ok || res.status === 200 ? 'connected' : 'degraded', httpStatus: res.status }
    } else {
      checks.services.supabase = { status: 'not_configured' }
    }
  } catch (err) {
    checks.services.supabase = { status: 'error', error: err.message }
    checks.status = 'degraded'
  }

  // Environment validation
  const envCheck = validateEnvironment()
  checks.environment = {
    valid: envCheck.isValid,
    errors: envCheck.errors.length,
    warnings: envCheck.warnings.length,
  }
  if (!envCheck.isValid) checks.status = 'degraded'

  // Memory usage
  const mem = process.memoryUsage()
  checks.memory = {
    heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
    heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
    rssMB: Math.round(mem.rss / 1024 / 1024),
  }

  checks.responseTimeMs = Date.now() - startTime

  const statusCode = checks.status === 'healthy' ? 200 : 503
  return NextResponse.json(checks, { status: statusCode })
}
