/**
 * GET/PUT/DELETE /api/tasks/[id] - Get/Update/Delete a single task via Prisma
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { sanitizeString } from '@/lib/security';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

// Valid enum values per schema
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const VALID_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'];

// GET - Get single task by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.VIEW_TASKS)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const { id } = await params;

    const task = await db.task.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, full_name: true, email: true, role: true } },
        creator: { select: { id: true, full_name: true, email: true, role: true } },
        case: { select: { id: true, case_ref: true, title: true, status: true } },
      },
    });

    if (!task) {
      return apiError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    return apiResponse(task);
  } catch (error) {
    console.error('Get task error:', error);
    return apiError('Failed to load task', 500, 'TASK_ERROR');
  }
}

// PUT - Update a task
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.EDIT_TASK)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const { id } = await params;

    // Verify task exists
    const existingTask = await db.task.findUnique({ where: { id } });

    if (!existingTask) {
      return apiError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    const body = await request.json();
    const {
      title,
      description,
      status,
      priority,
      due_date,
    } = body;

    // Validate priority enum if provided
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return apiError(`Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`, 400, 'INVALID_PRIORITY');
    }

    // Validate status enum if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return apiError(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 400, 'INVALID_STATUS');
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = sanitizeString(title);
    if (description !== undefined) updateData.description = description ? sanitizeString(description) : null;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (due_date !== undefined) updateData.due_date = due_date ? new Date(due_date) : null;

    // If status changes to 'completed', set completed_at to now
    if (status === 'completed' && existingTask.status !== 'completed') {
      updateData.completed_at = new Date();
    }

    const updatedTask = await db.task.update({
      where: { id },
      data: updateData,
      include: {
        assignee: { select: { id: true, full_name: true, email: true, role: true } },
        creator: { select: { id: true, full_name: true, email: true, role: true } },
        case: { select: { id: true, case_ref: true, title: true } },
      },
    });

    // Create notification if status changes
    if (status && status !== existingTask.status) {
      await db.notification.create({
        data: {
          user_id: existingTask.assigned_to,
          type: 'task_status_update',
          title: 'Task Status Updated',
          message: `Task "${existingTask.title}" status changed from ${existingTask.status} to ${status}`,
        },
      });
    }

    await createAuditLog({
      user_id: auth.user.userId,
      action: 'UPDATE_TASK',
      resource_type: 'task',
      resource_id: id,
      details: { message: `Task "${existingTask.title}" updated` },
    });

    return apiResponse(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    return apiError('Failed to update task', 500, 'UPDATE_TASK_ERROR');
  }
}

// DELETE - Delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.DELETE_TASK)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const { id } = await params;

    // Verify task exists
    const existingTask = await db.task.findUnique({
      where: { id },
      select: { id: true, title: true },
    });

    if (!existingTask) {
      return apiError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    await db.task.delete({ where: { id } });

    await createAuditLog({
      user_id: auth.user.userId,
      action: 'DELETE_TASK',
      resource_type: 'task',
      resource_id: id,
      details: { message: `Task "${existingTask.title}" deleted` },
    });

    return apiResponse({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    return apiError('Failed to delete task', 500, 'DELETE_TASK_ERROR');
  }
}
