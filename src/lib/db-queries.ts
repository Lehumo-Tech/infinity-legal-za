/**
 * Infinity Legal ZA - Database Query Helpers
 * Optimized query functions using Supabase client.
 *
 * NOTE: This module uses the Supabase admin client from @/lib/db.
 * The `db` export can be null when Supabase is not configured,
 * so every function must handle that case gracefully.
 */

import { db, type SupabaseClient } from '@/lib/db'
import type { Database } from '@/lib/supabase/types'

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

// Convenience type aliases from the generated Supabase types
type CaseRow = Database['public']['Tables']['cases']['Row']
type LeadRow = Database['public']['Tables']['leads']['Row']
type TaskRow = Database['public']['Tables']['tasks']['Row']
type DocumentRow = Database['public']['Tables']['documents']['Row']
type ProfileRow = Database['public']['Tables']['profiles']['Row']
type NotificationRow = Database['public']['Tables']['notifications']['Row']
type AttorneyRow = Database['public']['Tables']['attorneys']['Row']
type ConsultationRow = Database['public']['Tables']['consultations']['Row']
type CaseTimelineRow = Database['public']['Tables']['case_timeline']['Row']

// ============================================================
// Helper: get the Supabase client or throw
// ============================================================

function getClient(): SupabaseClient {
  if (!db) {
    throw new Error('Database not configured. Please set Supabase environment variables.')
  }
  return db
}

// ============================================================
// Offset-based Pagination Helper (Supabase)
// ============================================================

/**
 * Generic paginate function for any Supabase table.
 * Uses offset-based pagination with count query.
 * Always uses explicit field selection - no SELECT *.
 */
export async function paginate<T extends Record<string, unknown>>(
  table: string,
  selectFields: string,
  filters: Record<string, unknown> = {},
  page: number = 1,
  perPage: number = 20,
  orderBy: string = 'created_at.desc'
): Promise<PaginatedResult<T>> {
  const startTime = performance.now()
  const client = getClient()

  const safePage = Math.max(1, page)
  const safePerPage = Math.min(Math.max(1, perPage), 100) // Cap at 100
  const from = (safePage - 1) * safePerPage
  const to = from + safePerPage - 1

  // Build the query with filters
  let query = client
    .from(table)
    .select(selectFields, { count: 'exact' })
    .range(from, to)
    .order(orderBy.split('.')[0], { ascending: orderBy.endsWith('.asc') })

  // Apply equality filters
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null) {
      query = query.eq(key, value as string | number | boolean)
    }
  }

  const { data, count, error } = await query

  if (error) {
    throw new Error(`Paginate query failed for ${table}: ${error.message}`)
  }

  const total = count ?? 0

  const duration = performance.now() - startTime
  logQueryTime('paginate', duration)

  return {
    data: (data ?? []) as unknown as T[],
    pagination: {
      page: safePage,
      perPage: safePerPage,
      total,
      totalPages: Math.ceil(total / safePerPage),
    },
  }
}

// ============================================================
// Cursor-based Pagination Helper (Supabase)
// ============================================================

/**
 * Generic cursor-based pagination for efficient large dataset traversal.
 * Better performance for infinite scroll / real-time feeds.
 */
export async function cursorPaginate<T extends Record<string, unknown> & { id: string }>(
  table: string,
  selectFields: string,
  filters: Record<string, unknown> = {},
  { cursor, limit }: CursorPaginationParams,
  orderBy: string = 'created_at.desc'
): Promise<CursorPaginatedResult<T>> {
  const startTime = performance.now()
  const client = getClient()

  const safeLimit = Math.min(Math.max(1, limit), 100)

  let query = client
    .from(table)
    .select(selectFields)
    .limit(safeLimit + 1) // Fetch one extra to check for more
    .order(orderBy.split('.')[0], { ascending: orderBy.endsWith('.asc') })

  // Apply equality filters
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null) {
      query = query.eq(key, value as string | number | boolean)
    }
  }

  // Cursor: get rows with id > cursor (for desc) or id < cursor (for asc)
  if (cursor) {
    const ascending = orderBy.endsWith('.asc')
    if (ascending) {
      query = query.gt('id', cursor)
    } else {
      query = query.lt('id', cursor)
    }
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Cursor paginate query failed for ${table}: ${error.message}`)
  }

  const results = (data ?? []) as unknown as T[]
  const hasMore = results.length > safeLimit
  const slicedData = hasMore ? results.slice(0, safeLimit) : results
  const nextCursor = hasMore && slicedData.length > 0 ? slicedData[slicedData.length - 1].id : null

  const duration = performance.now() - startTime
  logQueryTime('cursorPaginate', duration)

  return {
    data: slicedData,
    nextCursor,
    hasMore,
  }
}

// ============================================================
// Transaction Helpers
// ============================================================

/**
 * @deprecated Not supported with Supabase client - use Supabase RPC instead.
 * Supabase does not support client-side transactions. To perform atomic
 * multi-step operations, create a Postgres function (RPC) and call it
 * via `db.rpc('function_name', params)`.
 */
export async function executeInTransaction<T>(
  _fn: (tx: unknown) => Promise<T>,
  _options?: { maxWait?: number; timeout?: number }
): Promise<T> {
  throw new Error(
    'executeInTransaction is not supported with the Supabase client. ' +
    'Use Supabase RPC (db.rpc) for atomic multi-step operations.'
  )
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
    return paginate<CaseRow>(
      'cases',
      'id, case_ref, title, case_type, status, client_id, attorney_id, court_name, estimated_value, next_deadline, tags, created_at, updated_at',
      where,
      page,
      perPage,
      'created_at.desc'
    )
  },

  /**
   * Get full case details with related data.
   * Supabase supports joining via foreign keys in select().
   */
  async getCaseById(id: string) {
    const startTime = performance.now()
    const client = getClient()

    const { data, error } = await client
      .from('cases')
      .select(`
        *,
        client:profiles!cases_client_id_fkey (id, email, full_name, phone),
        attorney:profiles!cases_attorney_id_fkey (id, full_name, email),
        attorney_profile:attorneys!cases_attorney_id_fkey (id, practice_number, specialization, available),
        documents (id, file_name, document_type, status, version, created_at),
        tasks (id, title, status, priority, due_date, assigned_to),
        case_timeline (id, event_type, event_description, performed_by, created_at),
        consultations (id, scheduled_at, status, meeting_type)
      `)
      .eq('id', id)
      .single()

    logQueryTime('getCaseById', performance.now() - startTime)

    if (error) {
      if (error.code === 'PGRST116') return null // No rows found
      throw new Error(`getCaseById failed: ${error.message}`)
    }

    return data
  },

  /**
   * Get dashboard stats for cases.
   */
  async getCaseStats() {
    const startTime = performance.now()
    const client = getClient()

    const [totalResult, activeResult, urgentResult, highRiskResult] = await Promise.all([
      client.from('cases').select('*', { count: 'exact', head: true }),
      client.from('cases').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      // Urgent = high or critical priority — need separate queries or use .in()
      client.from('cases').select('*', { count: 'exact', head: true }).in('case_type', ['criminal_defense', 'urgent_civil']),
      // High risk — using tags array contains (not directly supported in count, so approximate)
      client.from('cases').select('*', { count: 'exact', head: true }).contains('tags', ['high_risk']),
    ])

    logQueryTime('getCaseStats', performance.now() - startTime)

    return {
      total: totalResult.count ?? 0,
      active: activeResult.count ?? 0,
      urgent: urgentResult.count ?? 0,
      highRisk: highRiskResult.count ?? 0,
    }
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
    return paginate<LeadRow>(
      'leads',
      'id, first_name, last_name, email, phone, company, source, status, case_type, estimated_value, lead_score, assigned_to, next_follow_up, created_at, updated_at',
      where,
      page,
      perPage,
      'created_at.desc'
    )
  },

  async getLeadStats() {
    const startTime = performance.now()
    const client = getClient()

    const [totalResult, newResult, retainedResult, overdueResult] = await Promise.all([
      client.from('leads').select('*', { count: 'exact', head: true }),
      client.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'new'),
      client.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'retained'),
      // Overdue: next_follow_up is in the past and status is not terminal
      client
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .lt('next_follow_up', new Date().toISOString())
        .not('status', 'in', '("retained","lost","disqualified")'),
    ])

    logQueryTime('getLeadStats', performance.now() - startTime)

    return {
      total: totalResult.count ?? 0,
      newLeads: newResult.count ?? 0,
      converted: retainedResult.count ?? 0,
      overdue: overdueResult.count ?? 0,
    }
  },
}

// ============================================================
// Task-specific Optimized Queries
// ============================================================

export const TaskQueries = {
  async getTasksByUser(userId: string, status?: string) {
    const startTime = performance.now()
    const client = getClient()

    let query = client
      .from('tasks')
      .select(`
        id, title, description, status, priority, due_date,
        case:cases!tasks_case_id_fkey (id, title, case_ref),
        creator:profiles!tasks_created_by_fkey (id, full_name),
        created_at
      `)
      .eq('assigned_to', userId)
      .order('priority', { ascending: false })
      .order('due_date', { ascending: true })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    logQueryTime('getTasksByUser', performance.now() - startTime)

    if (error) {
      throw new Error(`getTasksByUser failed: ${error.message}`)
    }

    return data ?? []
  },

  async getOverdueTasks() {
    const startTime = performance.now()
    const client = getClient()

    const { data, error } = await client
      .from('tasks')
      .select(`
        id, title, due_date, priority,
        assignee:profiles!tasks_assigned_to_fkey (id, full_name),
        case:cases!tasks_case_id_fkey (id, title)
      `)
      .lt('due_date', new Date().toISOString())
      .in('status', ['pending', 'in_progress'])
      .order('due_date', { ascending: true })

    logQueryTime('getOverdueTasks', performance.now() - startTime)

    if (error) {
      throw new Error(`getOverdueTasks failed: ${error.message}`)
    }

    return data ?? []
  },
}

// ============================================================
// Document-specific Optimized Queries
// ============================================================

export const DocumentQueries = {
  async getDocumentsByCase(caseId: string) {
    const startTime = performance.now()
    const client = getClient()

    const { data, error } = await client
      .from('documents')
      .select('id, file_name, document_type, status, version, is_confidential, created_at')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })

    logQueryTime('getDocumentsByCase', performance.now() - startTime)

    if (error) {
      throw new Error(`getDocumentsByCase failed: ${error.message}`)
    }

    return data ?? []
  },
}

// ============================================================
// User-specific Optimized Queries
// ============================================================

export const UserQueries = {
  async getUserById(id: string) {
    const startTime = performance.now()
    const client = getClient()

    const { data, error } = await client
      .from('profiles')
      .select('id, email, full_name, phone, role, avatar_url, email_verified, last_login_at, created_at, updated_at')
      .eq('id', id)
      .single()

    logQueryTime('getUserById', performance.now() - startTime)

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`getUserById failed: ${error.message}`)
    }

    return data
  },

  async getUserByEmail(email: string) {
    const startTime = performance.now()
    const client = getClient()

    const { data, error } = await client
      .from('profiles')
      .select('id, email, full_name, role, email_verified, created_at, updated_at')
      .eq('email', email)
      .single()

    logQueryTime('getUserByEmail', performance.now() - startTime)

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`getUserByEmail failed: ${error.message}`)
    }

    return data
  },

  /**
   * Get a user's attorney profile if they have one.
   */
  async getAttorneyProfile(userId: string) {
    const startTime = performance.now()
    const client = getClient()

    const { data, error } = await client
      .from('attorneys')
      .select('*')
      .eq('id', userId)
      .single()

    logQueryTime('getAttorneyProfile', performance.now() - startTime)

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`getAttorneyProfile failed: ${error.message}`)
    }

    return data
  },
}

// ============================================================
// Notification Queries
// ============================================================

export const NotificationQueries = {
  async getUnreadCount(userId: string): Promise<number> {
    const client = getClient()

    const { count, error } = await client
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) {
      throw new Error(`getUnreadCount failed: ${error.message}`)
    }

    return count ?? 0
  },

  async getUserNotifications(userId: string, page: number = 1, perPage: number = 20) {
    return paginate<NotificationRow>(
      'notifications',
      'id, type, title, message, is_read, link, created_at',
      { user_id: userId },
      page,
      perPage,
      'created_at.desc'
    )
  },

  async markAllRead(userId: string): Promise<void> {
    const client = getClient()

    const { error } = await client
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) {
      throw new Error(`markAllRead failed: ${error.message}`)
    }
  },
}

// ============================================================
// Dashboard Queries
// ============================================================

export const DashboardQueries = {
  async getOverview() {
    const startTime = performance.now()
    const client = getClient()

    const [
      totalCasesResult,
      activeCasesResult,
      totalLeadsResult,
      newLeadsResult,
      totalTasksResult,
      pendingTasksResult,
      overdueTasksResult,
      totalDocumentsResult,
      totalClientsResult,
    ] = await Promise.all([
      client.from('cases').select('*', { count: 'exact', head: true }),
      client.from('cases').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      client.from('leads').select('*', { count: 'exact', head: true }),
      client.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'new'),
      client.from('tasks').select('*', { count: 'exact', head: true }),
      client.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      client
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .lt('due_date', new Date().toISOString())
        .in('status', ['pending', 'in_progress']),
      client.from('documents').select('*', { count: 'exact', head: true }),
      client.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client'),
    ])

    logQueryTime('getDashboardOverview', performance.now() - startTime)

    return {
      cases: {
        total: totalCasesResult.count ?? 0,
        active: activeCasesResult.count ?? 0,
      },
      leads: {
        total: totalLeadsResult.count ?? 0,
        new: newLeadsResult.count ?? 0,
      },
      tasks: {
        total: totalTasksResult.count ?? 0,
        pending: pendingTasksResult.count ?? 0,
        overdue: overdueTasksResult.count ?? 0,
      },
      documents: {
        total: totalDocumentsResult.count ?? 0,
      },
      clients: {
        total: totalClientsResult.count ?? 0,
      },
    }
  },
}
