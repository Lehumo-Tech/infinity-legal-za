/**
 * GET/PUT/DELETE /api/tasks/[id] - Get/Update/Delete a single task via Supabase
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hasPermission, PERMISSIONS, type RoleKey } from '@/lib/auth';
import { sanitizeString } from '@/lib/security';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

// Valid enum values
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const VALID_STATUSES = ['pending', 'in_progress', 'completed', 'overdue', 'cancelled'];

// GET - Get single task by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.VIEW_TASKS)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const { id } = await params;

    const { data: task, error } = await db
      .from('tasks')
      .select('*, assignee:profiles!tasks_assigned_to_fkey(user_id, full_name, email, role, department), creator:profiles!tasks_created_by_fkey(user_id, full_name, email, role), case:cases(id, matter_number, title, status)')
      .eq('id', id)
      .single();

    if (error || !task) {
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
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.EDIT_TASK)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const { id } = await params;

    // Verify task exists
    const { data: existingTask, error: fetchError } = await db
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingTask) {
      return apiError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    const body = await request.json();
    const {
      title,
      description,
      status,
      priority,
      due_date,
      completed_date,
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
    if (due_date !== undefined) updateData.due_date = due_date || null;
    if (completed_date !== undefined) updateData.completed_date = completed_date || null;

    // If status changes to 'completed', set completed_date to now
    if (status === 'completed' && existingTask.status !== 'completed') {
      updateData.completed_date = new Date().toISOString();
    }

    const { data: updatedTask, error: updateError } = await db
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select('*, assignee:profiles!tasks_assigned_to_fkey(user_id, full_name, email, role, department), creator:profiles!tasks_created_by_fkey(user_id, full_name, email, role), case:cases(id, matter_number, title)')
      .single();

    if (updateError || !updatedTask) {
      console.error('Update task error:', updateError);
      return apiError('Failed to update task', 500, 'UPDATE_TASK_ERROR');
    }

    // Create notification if status changes
    if (status && status !== existingTask.status) {
      await db.from('notifications').insert({
        user_id: existingTask.assigned_to,
        type: 'task_assigned',
        title: 'Task Status Updated',
        message: `Task "${existingTask.title}" status changed from ${existingTask.status} to ${status}`,
        link: `/tasks/${id}`,
        related_id: id,
      });
    }

    await createAuditLog({
      user_id: auth.user.userId,
      action: 'UPDATE_TASK',
      resource_type: 'task',
      resource_id: id,
      details: `Task "${existingTask.title}" updated`,
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
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    if (!hasPermission(auth.user.role as RoleKey, PERMISSIONS.DELETE_TASK)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const { id } = await params;

    // Verify task exists
    const { data: existingTask, error: fetchError } = await db
      .from('tasks')
      .select('id, title')
      .eq('id', id)
      .single();

    if (fetchError || !existingTask) {
      return apiError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    const { error: deleteError } = await db
      .from('tasks')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Delete task error:', deleteError);
      return apiError('Failed to delete task', 500, 'DELETE_TASK_ERROR');
    }

    await createAuditLog({
      user_id: auth.user.userId,
      action: 'DELETE_TASK',
      resource_type: 'task',
      resource_id: id,
      details: `Task "${existingTask.title}" deleted`,
    });

    return apiResponse({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    return apiError('Failed to delete task', 500, 'DELETE_TASK_ERROR');
  }
}
