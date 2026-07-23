/**
 * GET/POST /api/tasks - List/Create tasks with pagination via Prisma
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { sanitizeString } from '@/lib/security';
import { apiResponse, apiError, requireAuth, getPaginationParams, createPaginationResult } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

// Valid enum values per schema
const VALID_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

// GET - List tasks with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.VIEW_TASKS)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const { page, perPage } = getPaginationParams(request);
    const url = new URL(request.url);

    const assigned_to = url.searchParams.get('assigned_to');
    const case_id = url.searchParams.get('case_id');
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');
    const search = url.searchParams.get('search');

    // Build where clause
    const where: Record<string, unknown> = {};

    if (assigned_to) where.assigned_to = assigned_to;
    if (case_id) where.case_id = case_id;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Role-based filtering
    const role = auth.user.role as RoleKey;
    if (!hasPermission(role, PERMISSIONS.VIEW_ALL_CASES)) {
      // Non-admin users see only tasks assigned to them or created by them
      where.OR = [
        { assigned_to: auth.user.userId },
        { created_by: auth.user.userId },
      ];
    }

    const [tasks, total] = await Promise.all([
      db.task.findMany({
        where,
        include: {
          assignee: { select: { id: true, full_name: true, email: true, role: true } },
          creator: { select: { id: true, full_name: true, email: true, role: true } },
          case: { select: { id: true, case_ref: true, title: true, status: true } },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      db.task.count({ where }),
    ]);

    return apiResponse({
      data: tasks || [],
      pagination: createPaginationResult(total, page, perPage),
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

    // Permission check FIRST — fail fast before any input parsing
    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.CREATE_TASK)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
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

    // Validate assignee exists
    const assignee = await db.user.findUnique({
      where: { id: assigned_to },
      select: { id: true, full_name: true, email: true, role: true },
    });

    if (!assignee) {
      return apiError('Assignee not found', 404, 'ASSIGNEE_NOT_FOUND');
    }

    // Validate case exists if provided
    if (case_id) {
      const caseRecord = await db.case.findUnique({ where: { id: case_id } });
      if (!caseRecord) {
        return apiError('Case not found', 404, 'CASE_NOT_FOUND');
      }
    }

    const task = await db.task.create({
      data: {
        title: sanitizeString(title),
        description: description ? sanitizeString(description) : null,
        assigned_to,
        created_by: auth.user.userId,
        case_id: case_id || null,
        priority,
        status: 'pending',
        due_date: due_date ? new Date(due_date) : null,
      },
      include: {
        assignee: { select: { id: true, full_name: true, email: true, role: true } },
        creator: { select: { id: true, full_name: true, email: true, role: true } },
        case: { select: { id: true, case_ref: true, title: true } },
      },
    });

    // Create audit log
    await createAuditLog({
      user_id: auth.user.userId,
      action: 'CREATE_TASK',
      resource_type: 'task',
      resource_id: task.id,
      details: { message: `Task "${title}" assigned to ${assigned_to}` },
    });

    // Create notification for the assignee
    await db.notification.create({
      data: {
        user_id: assigned_to,
        type: 'info',
        title: 'New Task Assigned',
        message: `You have been assigned a new task: "${title}"`,
      },
    });

    return apiResponse(task, 201);
  } catch (error) {
    console.error('Create task error:', error);
    return apiError('Failed to create task', 500, 'CREATE_TASK_ERROR');
  }
}
