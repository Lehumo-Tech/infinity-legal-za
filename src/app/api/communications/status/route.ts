/**
 * GET /api/communications/status - Get email/SMS service status
 */

import { NextRequest } from 'next/server';
import { apiResponse, apiError, requireAuth } from '@/lib/middleware';
import { getEmailServiceStatus } from '@/lib/email-service';
import { getSmsServiceStatus } from '@/lib/sms-service';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.error!;

    // Service config exposes provider details — restrict to admin roles
    if (!['managing_director', 'systems_admin', 'admin'].includes(auth.user.role)) {
      return apiError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    const emailStatus = getEmailServiceStatus();
    const smsStatus = getSmsServiceStatus();

    // Get some quick stats
    const [totalEmails, totalSms, sentToday, failedToday] = await Promise.all([
      db.communicationLog.count({ where: { channel: 'email' } }),
      db.communicationLog.count({ where: { channel: 'sms' } }),
      db.communicationLog.count({
        where: {
          status: 'sent',
          sent_at: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      db.communicationLog.count({
        where: {
          status: 'failed',
          created_at: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    return apiResponse({
      email: emailStatus,
      sms: smsStatus,
      stats: {
        totalEmails,
        totalSms,
        sentToday,
        failedToday,
      },
    });
  } catch (error) {
    console.error('[Communications/Status] Error:', error);
    return apiError('Failed to load communications status', 500, 'COMM_STATUS_ERROR');
  }
}
