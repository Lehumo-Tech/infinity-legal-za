/**
 * GET/PUT /api/notifications - List/Update notifications for current user via Prisma/SQLite
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiResponse, apiError, requireAuth, getPaginationParams, createPaginationResult } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

// GET - List notifications for current user
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const { page, perPage, skip, take } = getPaginationParams(request);
    const url = new URL(request.url);

    const is_read = url.searchParams.get('is_read');
    const type = url.searchParams.get('type');

    // Build where clause - always filter by current user
    const where: Record<string, unknown> = {
      user_id: auth.user.userId,
    };

    if (is_read !== null && is_read !== undefined) {
      where.is_read = is_read === 'true';
    }
    if (type) where.type = type;

    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: 'desc' },
      }),
      db.notification.count({ where }),
    ]);

    // Get unread count for convenience
    const unreadCount = await db.notification.count({
      where: {
        user_id: auth.user.userId,
        is_read: false,
      },
    });

    return apiResponse({
      data: notifications,
      pagination: createPaginationResult(total, page, perPage),
      unread_count: unreadCount,
    });
  } catch (error) {
    console.error('Notifications list error:', error);
    return apiError('Failed to load notifications', 500, 'NOTIFICATIONS_ERROR');
  }
}

// PATCH - Mark all notifications as read for current user
export async function PATCH(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const result = await db.notification.updateMany({
      where: { user_id: auth.user.userId, is_read: false },
      data: { is_read: true },
    });

    await createAuditLog({
      user_id: auth.user.userId,
      action: 'MARK_ALL_NOTIFICATIONS_READ',
      resource_type: 'notification',
    });

    return apiResponse({ updated_count: result.count });
  } catch (error) {
    console.error('Mark all read error:', error);
    return apiError('Failed to mark notifications as read', 500, 'NOTIFICATION_UPDATE_ERROR');
  }
}

// PUT - Mark notification as read
export async function PUT(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    const body = await request.json();
    const { notification_id } = body;

    if (!notification_id) {
      return apiError('notification_id is required', 400, 'MISSING_NOTIFICATION_ID');
    }

    // Find the notification and verify ownership
    const notification = await db.notification.findUnique({
      where: { id: notification_id },
    });

    if (!notification) {
      return apiError('Notification not found', 404, 'NOTIFICATION_NOT_FOUND');
    }

    if (notification.user_id !== auth.user.userId) {
      return apiError('You can only mark your own notifications as read', 403, 'FORBIDDEN');
    }

    const updated = await db.notification.update({
      where: { id: notification_id },
      data: { is_read: true },
    });

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
