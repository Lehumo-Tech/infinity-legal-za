import { NextResponse } from 'next/server';
import { sendEmail, sendWelcomeEmail, sendBookingConfirmation, sendCaseStatusUpdate, sendTaskReminder } from '@/lib/brevo';

/**
 * POST /api/emails
 * Send transactional emails via Brevo
 * Body: { type, to, data }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { type, to, data } = body;

    if (!type || !to) {
      return NextResponse.json({ error: 'Missing required fields: type, to' }, { status: 400 });
    }

    let result;

    switch (type) {
      case 'welcome':
        result = await sendWelcomeEmail(to, data?.fullName || '');
        break;

      case 'booking_confirmation':
        if (!data?.date || !data?.time) {
          return NextResponse.json({ error: 'Missing booking details: date, time' }, { status: 400 });
        }
        result = await sendBookingConfirmation(to, data?.fullName || '', {
          attorneyName: data.attorneyName,
          date: data.date,
          time: data.time,
          caseType: data.caseType,
        });
        break;

      case 'case_status_update':
        if (!data?.caseId || !data?.newStatus) {
          return NextResponse.json({ error: 'Missing case details: caseId, newStatus' }, { status: 400 });
        }
        result = await sendCaseStatusUpdate(to, data?.fullName || '', {
          caseId: data.caseId,
          caseType: data.caseType,
          newStatus: data.newStatus,
          description: data.description,
        });
        break;

      case 'task_reminder':
        if (!data?.taskTitle || !data?.dueDate) {
          return NextResponse.json({ error: 'Missing task details: taskTitle, dueDate' }, { status: 400 });
        }
        result = await sendTaskReminder(to, data?.fullName || '', {
          taskTitle: data.taskTitle,
          description: data.description,
          dueDate: data.dueDate,
        });
        break;

      case 'custom':
        if (!data?.subject || !data?.htmlContent) {
          return NextResponse.json({ error: 'Missing custom email fields: subject, htmlContent' }, { status: 400 });
        }
        result = await sendEmail({
          to: [{ email: to, name: data.fullName }],
          subject: data.subject,
          htmlContent: data.htmlContent,
          tags: data.tags || ['custom'],
        });
        break;

      default:
        return NextResponse.json({ error: `Unknown email type: ${type}` }, { status: 400 });
    }

    if (result.success) {
      return NextResponse.json({ success: true, messageId: result.messageId });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
  } catch (err) {
    console.error('Email API error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/emails/test
 * Quick test endpoint to verify Brevo integration
 */
export async function GET(request) {
  const url = new URL(request.url);
  const testEmail = url.searchParams.get('email');

  if (!testEmail) {
    return NextResponse.json({
      status: 'Email API is running',
      configured: !!process.env.BREVO_API_KEY,
      usage: 'POST /api/emails with { type, to, data }',
      types: ['welcome', 'booking_confirmation', 'case_status_update', 'task_reminder', 'custom'],
    });
  }

  // Send a test email
  const result = await sendWelcomeEmail(testEmail, 'Test User');
  return NextResponse.json({ testResult: result });
}
