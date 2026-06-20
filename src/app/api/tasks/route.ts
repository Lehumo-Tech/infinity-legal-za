/**
 * GET/POST /api/tasks - List/Create tasks with pagination via Supabase
 */

import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/api-client';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { sanitizeString, sanitizeSearchQuery } from '@/lib/security';
import { apiResponse, apiError, requireAuth, getPaginationParams, createPaginationResult } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

// Valid enum values per Supabase schema
const VALID_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

// GET - List tasks with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const db = getAdminClient();
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.VIEW_TASKS)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const { page, perPage, from, to } = getPaginationParams(request);
    const url = new URL(request.url);

    const assigned_to = url.searchParams.get('assigned_to');
    const case_id = url.searchParams.get('case_id');
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');
    const search = url.searchParams.get('search');

    // Build query — cases has case_ref (not matter_number), profiles has no department column
    let query = db
      .from('tasks')
      .select('*, assignee:profiles!tasks_assigned_to_fkey(id, full_name, email, role), creator:profiles!tasks_created_by_fkey(id, full_name, email, role), case:cases(id, case_ref, title, status)', { count: 'exact' });

    if (assigned_to) query = query.eq('assigned_to', assigned_to);
    if (case_id) query = query.eq('case_id', case_id);
    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);
    if (search) query = query.or(`title.ilike.%${sanitizeSearchQuery(search)}%,description.ilike.%${sanitizeSearchQuery(search)}%`);

    const { data: tasks, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Tasks list query error:', error);
      return apiError('Failed to load tasks', 500, 'TASKS_ERROR');
    }

    return apiResponse({
      data: tasks || [],
      pagination: createPaginationResult(count || 0, page, perPage),
    });
  } catch (error) {
    console.error('Tasks list error:', error);
    return apiError('Failed to load tasks', 500, 'TASKS_ERROR');
  }
}

// POST - Create a new task
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const db = getAdminClient();
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    const body = await request.json();
    const {
      title,
      description,
      assigned_to,
      case_id,
      priority,
      due_date,
    } = body;

    // Validate required fields
    if (!title || !assigned_to || !priority) {
      return apiError(
        'title, assigned_to, and priority are required',
        400,
        'MISSING_FIELDS'
      );
    }

    // Validate priority enum
    if (!VALID_PRIORITIES.includes(priority)) {
      return apiError(
        `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`,
        400,
        'INVALID_PRIORITY'
      );
    }

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.CREATE_TASK)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    // Validate assignee exists — profiles PK is `id` (not `user_id`)
    const { data: assignee } = await db
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('id', assigned_to)
      .single();

    if (!assignee) {
      return apiError('Assignee not found', 404, 'ASSIGNEE_NOT_FOUND');
    }

    // Validate case exists if provided
    if (case_id) {
      const { data: caseRecord } = await db
        .from('cases')
        .select('id')
        .eq('id', case_id)
        .single();
      if (!caseRecord) {
        return apiError('Case not found', 404, 'CASE_NOT_FOUND');
      }
    }

    const { data: task, error: insertError } = await db
      .from('tasks')
      .insert({
        title: sanitizeString(title),
        description: description ? sanitizeString(description) : null,
        assigned_to,
        created_by: auth.user.userId,
        case_id: case_id || null,
        priority,
        status: 'pending',
        due_date: due_date || null,
      })
      .select('*, assignee:profiles!tasks_assigned_to_fkey(id, full_name, email, role), creator:profiles!tasks_created_by_fkey(id, full_name, email, role), case:cases(id, case_ref, title)')
      .single();

    if (insertError || !task) {
      console.error('Create task insert error:', insertError);
      return apiError('Failed to create task', 500, 'CREATE_TASK_ERROR');
    }

    // Create audit log
    await createAuditLog({
      user_id: auth.user.userId,
      action: 'CREATE_TASK',
      resource_type: 'task',
      resource_id: task.id,
      details: { message: `Task "${title}" assigned to ${assigned_to}` },
    });

    // Create notification for the assignee — notifications has no `related_id` column
    await db.from('notifications').insert({
      user_id: assigned_to,
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: `You have been assigned a new task: "${title}"`,
      link: `/tasks/${task.id}`,
    });

    return apiResponse(task, 201);
  } catch (error) {
    console.error('Create task error:', error);
    return apiError('Failed to create task', 500, 'CREATE_TASK_ERROR');
  }
}
