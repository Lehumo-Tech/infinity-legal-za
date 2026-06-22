/**
 * Infinity Legal ZA - Database Query Helpers
 * Optimized query functions with cursor-based pagination, select/include,
 * transaction wrappers, and query timing/analytics.
 */

import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'

// ============================================================
// Types
// ============================================================

export interface PaginationParams {
  page: number
  perPage: number
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    perPage: number
    total: number
    totalPages: number
  }
}

export interface CursorPaginationParams {
  cursor?: string
  limit: number
}

export interface CursorPaginatedResult<T> {
  data: T[]
  nextCursor: string | null
  hasMore: boolean
}

// ============================================================
// Offset-based Pagination Helper
// ============================================================

/**
 * Generic paginate function for any Prisma model.
 * Uses offset-based pagination with count query.
 * Always uses select to limit fields - no SELECT *.
 */
export async function paginate<
  T extends Record<string, unknown>,
  M extends {
    findMany: (args: any) => Promise<T[]>
    count: (args: any) => Promise<number>
  }
>(
  model: M,
  where: Record<string, unknown> = {},
  page: number = 1,
  perPage: number = 20,
  orderBy: Record<string, unknown> = { created_at: 'desc' as const },
  select?: Record<string, unknown>
): Promise<PaginatedResult<T>> {
  const startTime = performance.now()

  const safePage = Math.max(1, page)
  const safePerPage = Math.min(Math.max(1, perPage), 100) // Cap at 100
  const skip = (safePage - 1) * safePerPage

  const findManyArgs: Record<string, unknown> = {
    where,
    orderBy,
    skip,
    take: safePerPage,
  }

  if (select) {
    findManyArgs.select = select
  }

  const [data, total] = await Promise.all([
    model.findMany(findManyArgs),
    model.count({ where }),
  ])

  const duration = performance.now() - startTime
  logQueryTime('paginate', duration)

  return {
    data,
    pagination: {
      page: safePage,
      perPage: safePerPage,
      total,
      totalPages: Math.ceil(total / safePerPage),
    },
  }
}

// ============================================================
// Cursor-based Pagination Helper
// ============================================================

/**
 * Generic cursor-based pagination for efficient large dataset traversal.
 * Better performance for infinite scroll / real-time feeds.
 */
export async function cursorPaginate<
  T extends Record<string, unknown> & { id: string },
  M extends {
    findMany: (args: any) => Promise<T[]>
  }
>(
  model: M,
  where: Record<string, unknown> = {},
  { cursor, limit }: CursorPaginationParams,
  orderBy: Record<string, unknown> = { created_at: 'desc' as const },
  select?: Record<string, unknown>
): Promise<CursorPaginatedResult<T>> {
  const startTime = performance.now()

  const safeLimit = Math.min(Math.max(1, limit), 100)

  const findManyArgs: Record<string, unknown> = {
    where,
    orderBy,
    take: safeLimit + 1, // Fetch one extra to check for more
    ...(select ? { select } : {}),
  }

  if (cursor) {
    findManyArgs.cursor = { id: cursor }
    findManyArgs.skip = 1
  }

  const results = await model.findMany(findManyArgs)
  const hasMore = results.length > safeLimit
  const data = hasMore ? results.slice(0, safeLimit) : results
  const nextCursor = hasMore && data.length > 0 ? data[data.length - 1].id : null

  const duration = performance.now() - startTime
  logQueryTime('cursorPaginate', duration)

  return {
    data: data as T[],
    nextCursor,
    hasMore,
  }
}

// ============================================================
// Transaction Helpers
// ============================================================

/**
 * Execute multiple operations in a transaction.
 * Automatically rolls back on error.
 */
export async function executeInTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: { maxWait?: number; timeout?: number }
): Promise<T> {
  return db.$transaction(fn, {
    maxWait: options?.maxWait ?? 5000,
    timeout: options?.timeout ?? 10000,
  })
}

/**
 * Execute a function with retry logic for transient errors.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 100
): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)))
      }
    }
  }
  throw lastError
}

// ============================================================
// Query Timing & Analytics
// ============================================================

const queryTimings: Map<string, number[]> = new Map()

function logQueryTime(operation: string, durationMs: number): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DB Query] ${operation}: ${durationMs.toFixed(2)}ms`)
  }

  const timings = queryTimings.get(operation) ?? []
  timings.push(durationMs)
  // Keep last 100 timings per operation
  if (timings.length > 100) timings.shift()
  queryTimings.set(operation, timings)
}

/**
 * Get average query times for monitoring.
 */
export function getQueryStats(): Record<string, { avg: number; min: number; max: number; count: number }> {
  const stats: Record<string, { avg: number; min: number; max: number; count: number }> = {}
  for (const [operation, timings] of queryTimings.entries()) {
    if (timings.length === 0) continue
    stats[operation] = {
      avg: timings.reduce((a, b) => a + b, 0) / timings.length,
      min: Math.min(...timings),
      max: Math.max(...timings),
      count: timings.length,
    }
  }
  return stats
}

// ============================================================
// Case-specific Optimized Queries
// ============================================================

export const CaseQueries = {
  /**
   * Get cases with minimal fields for list views.
   */
  async getCaseList(
    where: Record<string, unknown> = {},
    page: number = 1,
    perPage: number = 20
  ) {
    return paginate(
      db.case,
      where,
      page,
      perPage,
      { created_at: 'desc' },
      {
        id: true,
        matter_number: true,
        title: true,
        case_type: true,
        urgency: true,
        status: true,
        client_id: true,
        lead_attorney_id: true,
        court_date: true,
        is_high_risk: true,
        next_action: true,
        next_action_date: true,
        created_at: true,
        updated_at: true,
        client: { select: { id: true, full_name: true, email: true } },
        lead_attorney: { select: { id: true, full_name: true } },
      }
    )
  },

  /**
   * Get full case details with related data.
   */
  async getCaseById(id: string) {
    const startTime = performance.now()
    const result = await db.case.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, full_name: true, email: true, phone: true } },
        lead_attorney: { select: { id: true, full_name: true, email: true } },
        support_paralegal: { select: { id: true, full_name: true } },
        documents: { select: { id: true, title: true, document_type: true, workflow_status: true, created_at: true } },
        tasks: { select: { id: true, title: true, status: true, priority: true, due_date: true, assignee: { select: { full_name: true } } } },
        timeline: { select: { id: true, action: true, description: true, created_at: true }, orderBy: { created_at: 'desc' } },
        consultations: { select: { id: true, scheduled_date: true, status: true, meeting_type: true } },
      },
    })
    logQueryTime('getCaseById', performance.now() - startTime)
    return result
  },

  /**
   * Get dashboard stats for cases.
   */
  async getCaseStats() {
    const startTime = performance.now()
    const [total, active, urgent, highRisk] = await Promise.all([
      db.case.count(),
      db.case.count({ where: { status: 'active' } }),
      db.case.count({ where: { urgency: { in: ['high', 'critical'] } } }),
      db.case.count({ where: { is_high_risk: true } }),
    ])
    logQueryTime('getCaseStats', performance.now() - startTime)
    return { total, active, urgent, highRisk }
  },
}

// ============================================================
// Lead-specific Optimized Queries
// ============================================================

export const LeadQueries = {
  async getLeadList(
    where: Record<string, unknown> = {},
    page: number = 1,
    perPage: number = 20
  ) {
    return paginate(
      db.lead,
      where,
      page,
      perPage,
      { created_at: 'desc' },
      {
        id: true,
        name: true,
        email: true,
        phone: true,
        source: true,
        status: true,
        case_type: true,
        estimated_value: true,
        sla_deadline: true,
        created_at: true,
        assigned_paralegal: { select: { id: true, full_name: true } },
      }
    )
  },

  async getLeadStats() {
    const startTime = performance.now()
    const [total, newLeads, converted, overdue] = await Promise.all([
      db.lead.count(),
      db.lead.count({ where: { status: 'new' } }),
      db.lead.count({ where: { status: 'retained' } }),
      db.lead.count({ where: { sla_deadline: { lt: new Date() }, status: { notIn: ['retained', 'lost', 'disqualified'] } } }),
    ])
    logQueryTime('getLeadStats', performance.now() - startTime)
    return { total, newLeads, converted, overdue }
  },
}

// ============================================================
// Task-specific Optimized Queries
// ============================================================

export const TaskQueries = {
  async getTasksByUser(userId: string, status?: string) {
    const startTime = performance.now()
    const where: Record<string, unknown> = { assigned_to: userId }
    if (status) where.status = status

    const result = await db.task.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        due_date: true,
        case: { select: { id: true, title: true, matter_number: true } },
        creator: { select: { id: true, full_name: true } },
        created_at: true,
      },
      orderBy: [{ priority: 'desc' }, { due_date: 'asc' }],
    })
    logQueryTime('getTasksByUser', performance.now() - startTime)
    return result
  },

  async getOverdueTasks() {
    const startTime = performance.now()
    const result = await db.task.findMany({
      where: {
        due_date: { lt: new Date() },
        status: { in: ['pending', 'in_progress'] },
      },
      select: {
        id: true,
        title: true,
        due_date: true,
        priority: true,
        assignee: { select: { id: true, full_name: true } },
        case: { select: { id: true, title: true } },
      },
      orderBy: { due_date: 'asc' },
    })
    logQueryTime('getOverdueTasks', performance.now() - startTime)
    return result
  },
}

// ============================================================
// Document-specific Optimized Queries
// ============================================================

export const DocumentQueries = {
  async getDocumentsByCase(caseId: string) {
    const startTime = performance.now()
    const result = await db.document.findMany({
      where: { case_id: caseId },
      select: {
        id: true,
        title: true,
        document_type: true,
        workflow_status: true,
        version: true,
        is_locked: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    })
    logQueryTime('getDocumentsByCase', performance.now() - startTime)
    return result
  },
}

// ============================================================
// User-specific Optimized Queries
// ============================================================

export const UserQueries = {
  async getUserById(id: string) {
    const startTime = performance.now()
    const result = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        role: true,
        department: true,
        bar_number: true,
        is_active: true,
        avatar: true,
        email_verified: true,
        hire_date: true,
        created_at: true,
        profiles: true,
        attorney_profile: true,
      },
    })
    logQueryTime('getUserById', performance.now() - startTime)
    return result
  },

  async getUserByEmail(email: string) {
    const startTime = performance.now()
    const result = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        full_name: true,
        role: true,
        department: true,
        is_active: true,
        email_verified: true,
        password_expires_at: true,
        last_password_change: true,
      },
    })
    logQueryTime('getUserByEmail', performance.now() - startTime)
    return result
  },
}

// ============================================================
// Notification Queries
// ============================================================

export const NotificationQueries = {
  async getUnreadCount(userId: string): Promise<number> {
    return db.notification.count({
      where: { user_id: userId, is_read: false },
    })
  },

  async getUserNotifications(userId: string, page: number = 1, perPage: number = 20) {
    return paginate(
      db.notification,
      { user_id: userId },
      page,
      perPage,
      { created_at: 'desc' },
      {
        id: true,
        type: true,
        title: true,
        message: true,
        is_read: true,
        link: true,
        created_at: true,
      }
    )
  },

  async markAllRead(userId: string): Promise<void> {
    await db.notification.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true },
    })
  },
}

// ============================================================
// Dashboard Queries
// ============================================================

export const DashboardQueries = {
  async getOverview() {
    const startTime = performance.now()
    const [
      totalCases,
      activeCases,
      totalLeads,
      newLeads,
      totalTasks,
      pendingTasks,
      overdueTasks,
      totalDocuments,
      totalClients,
    ] = await Promise.all([
      db.case.count(),
      db.case.count({ where: { status: 'active' } }),
      db.lead.count(),
      db.lead.count({ where: { status: 'new' } }),
      db.task.count(),
      db.task.count({ where: { status: 'pending' } }),
      db.task.count({ where: { due_date: { lt: new Date() }, status: { in: ['pending', 'in_progress'] } } }),
      db.document.count(),
      db.user.count({ where: { role: 'client', is_active: true } }),
    ])

    logQueryTime('getDashboardOverview', performance.now() - startTime)

    return {
      cases: { total: totalCases, active: activeCases },
      leads: { total: totalLeads, new: newLeads },
      tasks: { total: totalTasks, pending: pendingTasks, overdue: overdueTasks },
      documents: { total: totalDocuments },
      clients: { total: totalClients },
    }
  },
}
