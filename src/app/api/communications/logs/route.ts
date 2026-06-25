/**
 * GET /api/communications/logs - Get communication logs
 *
 * Query params:
 *   channel?: 'email' | 'sms' (filter by channel)
 *   status?: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced'
 *   category?: string
 *   page?: number (default 1)
 *   limit?: number (default 20, max 100)
 *   userId?: string (filter by user)
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiResponse, apiError } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel') || undefined;
    const status = searchParams.get('status') || undefined;
    const category = searchParams.get('category') || undefined;
    const userId = searchParams.get('userId') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (channel) where.channel = channel;
    if (status) where.status = status;
    if (category) where.category = category;
    if (userId) where.user_id = userId;

    const [logs, total] = await Promise.all([
      db.communicationLog.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, full_name: true, email: true, role: true },
          },
        },
      }),
      db.communicationLog.count({ where }),
    ]);

    // Stats
    const [emailCount, smsCount, sentCount, failedCount] = await Promise.all([
      db.communicationLog.count({ where: { channel: 'email', ...where } }),
      db.communicationLog.count({ where: { channel: 'sms', ...where } }),
      db.communicationLog.count({ where: { status: 'sent', ...where } }),
      db.communicationLog.count({ where: { status: 'failed', ...where } }),
    ]);

    return apiResponse({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        emails: emailCount,
        sms: smsCount,
        sent: sentCount,
        failed: failedCount,
      },
    });
  } catch (error) {
    console.error('[Communications/Logs] Error:', error);
    return apiError('Failed to fetch communication logs', 500, 'FETCH_ERROR');
  }
}
