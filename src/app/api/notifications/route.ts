/**
 * GET/PATCH/PUT /api/notifications - List/Update notifications for current user via Supabase
 * notifications schema: id, user_id, title, message, type, link, is_read, metadata, created_at
 * No `related_id` column
 */

import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/api-client';
import { apiResponse, apiError, requireAuth, getPaginationParams, createPaginationResult } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

// GET - List notifications for current user
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const db = getAdminClient();
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    const { page, perPage, from, to } = getPaginationParams(request);
    const url = new URL(request.url);

    const is_read = url.searchParams.get('is_read');
    const type = url.searchParams.get('type');

    // Build query — always filter by current user
    let query = db
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', auth.user.userId);

    if (is_read !== null && is_read !== undefined) {
      query = query.eq('is_read', is_read === 'true');
    }
    if (type) query = query.eq('type', type);

    const [notificationsResult, unreadResult] = await Promise.all([
      query
        .order('created_at', { ascending: false })
        .range(from, to),
      db
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', auth.user.userId)
        .eq('is_read', false),
    ]);

    const { data: notifications, count, error } = notificationsResult;
    const { count: unreadCount } = unreadResult;

    if (error) {
      console.error('Notifications list query error:', error);
      return apiError('Failed to load notifications', 500, 'NOTIFICATIONS_ERROR');
    }

    return apiResponse({
      data: notifications || [],
      pagination: createPaginationResult(count || 0, page, perPage),
      unread_count: unreadCount || 0,
    });
  } catch (error) {
    console.error('Notifications list error:', error);
    return apiError('Failed to load notifications', 500, 'NOTIFICATIONS_ERROR');
  }
}

// PATCH - Mark all notifications as read for current user
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const db = getAdminClient();
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    const { count, error } = await db
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', auth.user.userId)
      .eq('is_read', false);

    if (error) {
      console.error('Mark all read error:', error);
      return apiError('Failed to mark notifications as read', 500, 'NOTIFICATION_UPDATE_ERROR');
    }

    await createAuditLog({
      user_id: auth.user.userId,
      action: 'MARK_ALL_NOTIFICATIONS_READ',
      resource_type: 'notification',
    });

    return apiResponse({ updated_count: count || 0 });
  } catch (error) {
    console.error('Mark all read error:', error);
    return apiError('Failed to mark notifications as read', 500, 'NOTIFICATION_UPDATE_ERROR');
  }
}

// PUT - Mark notification as read
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const db = getAdminClient();
    if (!db) {
      return apiError('Database not configured. Please set Supabase environment variables.', 503, 'DB_NOT_CONFIGURED');
    }

    const body = await request.json();
    const { notification_id } = body;

    if (!notification_id) {
      return apiError('notification_id is required', 400, 'MISSING_NOTIFICATION_ID');
    }

    // Find the notification and verify ownership
    const { data: notification, error: fetchError } = await db
      .from('notifications')
      .select('*')
      .eq('id', notification_id)
      .single();

    if (fetchError || !notification) {
      return apiError('Notification not found', 404, 'NOTIFICATION_NOT_FOUND');
    }

    if (notification.user_id !== auth.user.userId) {
      return apiError('You can only mark your own notifications as read', 403, 'FORBIDDEN');
    }

    const { data: updated, error: updateError } = await db
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notification_id)
      .select()
      .single();

    if (updateError) {
      console.error('Mark notification read error:', updateError);
      return apiError('Failed to mark notification as read', 500, 'NOTIFICATION_READ_ERROR');
    }

    // Create audit log
    await createAuditLog({
      user_id: auth.user.userId,
      action: 'MARK_NOTIFICATION_READ',
      resource_type: 'notification',
      resource_id: notification_id,
    });

    return apiResponse(updated);
  } catch (error) {
    console.error('Mark notification read error:', error);
    return apiError('Failed to mark notification as read', 500, 'NOTIFICATION_READ_ERROR');
  }
}
