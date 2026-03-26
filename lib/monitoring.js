/**
 * Monitoring & Error Tracking Utility
 * Lightweight, privacy-compliant server-side monitoring for Infinity Legal.
 * Logs errors to MongoDB for review via the admin audit dashboard.
 */

import { getDb } from './mongodb'

// Error severity levels
export const SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
}

/**
 * Log an application error to MongoDB
 */
export async function logError({
  error,
  context = '',
  severity = SEVERITY.MEDIUM,
  userId = null,
  endpoint = '',
  metadata = {},
}) {
  try {
    const db = await getDb()
    await db.collection('error_logs').insertOne({
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      message: error?.message || String(error),
      stack: error?.stack || null,
      context,
      severity,
      userId,
      endpoint,
      metadata,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    })
  } catch (logErr) {
    // Fallback to console if DB logging fails
    console.error('[MONITOR] Failed to log error:', logErr.message)
    console.error('[MONITOR] Original error:', error?.message || error)
  }
}

/**
 * Log an API request for analytics
 */
export async function logApiRequest({
  method,
  endpoint,
  statusCode,
  responseTimeMs,
  userId = null,
}) {
  try {
    const db = await getDb()
    await db.collection('api_analytics').insertOne({
      method,
      endpoint,
      statusCode,
      responseTimeMs,
      userId,
      timestamp: new Date().toISOString(),
    })
  } catch {
    // Silent fail for analytics
  }
}

/**
 * Log a health check event
 */
export async function logHealthCheck() {
  try {
    const db = await getDb()
    await db.collection('health_checks').insertOne({
      status: 'ok',
      services: {
        mongodb: 'connected',
        nextjs: 'running',
      },
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    })
    return { status: 'healthy' }
  } catch (err) {
    return { status: 'degraded', error: err.message }
  }
}

/**
 * Get error summary for admin dashboard
 */
export async function getErrorSummary(hours = 24) {
  try {
    const db = await getDb()
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
    
    const errors = await db.collection('error_logs')
      .find({ timestamp: { $gte: since } })
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray()

    const bySeverity = errors.reduce((acc, e) => {
      acc[e.severity] = (acc[e.severity] || 0) + 1
      return acc
    }, {})

    return {
      total: errors.length,
      bySeverity,
      recent: errors.slice(0, 10).map(e => ({
        id: e.id,
        message: e.message,
        severity: e.severity,
        context: e.context,
        endpoint: e.endpoint,
        timestamp: e.timestamp,
      })),
    }
  } catch {
    return { total: 0, bySeverity: {}, recent: [] }
  }
}
