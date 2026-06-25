/**
 * GET /api/communications/status - Get email/SMS service status
 */

import { apiResponse } from '@/lib/middleware';
import { getEmailServiceStatus } from '@/lib/email-service';
import { getSmsServiceStatus } from '@/lib/sms-service';
import { db } from '@/lib/db';

export async function GET() {
  try {
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
    return apiResponse({
      email: getEmailServiceStatus(),
      sms: getSmsServiceStatus(),
      stats: { totalEmails: 0, totalSms: 0, sentToday: 0, failedToday: 0 },
    });
  }
}
