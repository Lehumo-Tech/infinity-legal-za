/**
 * Brevo (Sendinblue) Transactional Email Service
 * Handles all outgoing email notifications for Infinity Legal
 */

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'noreply@infinitylegal.org';
const SENDER_NAME = process.env.BREVO_SENDER_NAME || 'Infinity Legal';

/**
 * Send a transactional email via Brevo HTTP API
 */
export async function sendEmail({ to, subject, htmlContent, tags = [] }) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn('BREVO_API_KEY not set — email not sent');
    return { success: false, error: 'BREVO_API_KEY not configured' };
  }

  const payload = {
    sender: { name: SENDER_NAME, email: SENDER_EMAIL },
    to: Array.isArray(to) ? to : [{ email: to }],
    subject,
    htmlContent,
    tags,
  };

  try {
    const res = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error('Brevo API error:', res.status, errData);
      return { success: false, error: errData.message || `HTTP ${res.status}`, status: res.status };
    }

    const data = await res.json();
    return { success: true, messageId: data.messageId };
  } catch (err) {
    console.error('Brevo send error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Branded HTML email wrapper for Infinity Legal
 */
function brandedTemplate(content, preheader = '') {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Infinity Legal</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f9fafb; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .email-wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .email-header { background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); padding: 32px 24px; text-align: center; }
    .email-header h1 { color: #d4af37; font-family: 'Georgia', serif; font-size: 24px; margin: 0; }
    .email-header p { color: rgba(255,255,255,0.7); font-size: 13px; margin: 8px 0 0; }
    .email-body { padding: 32px 24px; color: #1a365d; line-height: 1.6; }
    .email-body h2 { font-family: 'Georgia', serif; color: #1a365d; font-size: 20px; margin: 0 0 16px; }
    .email-body p { margin: 0 0 16px; font-size: 15px; color: #374151; }
    .email-cta { display: inline-block; padding: 12px 28px; background: #d4af37; color: #1a365d; font-weight: 600; text-decoration: none; border-radius: 8px; font-size: 15px; }
    .email-cta:hover { background: #f6e05e; }
    .email-info-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .email-info-box table { width: 100%; border-collapse: collapse; }
    .email-info-box td { padding: 8px 0; font-size: 14px; color: #374151; border-bottom: 1px solid #f3f4f6; }
    .email-info-box td:first-child { font-weight: 600; color: #1a365d; width: 40%; }
    .email-footer { background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb; }
    .email-footer p { font-size: 12px; color: #9ca3af; margin: 4px 0; }
    .email-footer a { color: #d4af37; text-decoration: none; }
    .preheader { display: none !important; max-height: 0; overflow: hidden; mso-hide: all; }
  </style>
</head>
<body>
  <span class="preheader">${preheader}</span>
  <div style="padding: 24px 16px;">
    <div class="email-wrapper">
      <div class="email-header">
        <h1>Infinity Legal</h1>
        <p>AI-Powered Legal Help for South Africa</p>
      </div>
      <div class="email-body">
        ${content}
      </div>
      <div class="email-footer">
        <p>&copy; 2026 Infinity Legal. All rights reserved.</p>
        <p>Registered in South Africa | <a href="#">POPIA Compliant</a></p>
        <p style="margin-top: 12px;"><a href="#">Privacy Policy</a> &middot; <a href="#">Terms of Service</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ============ Pre-built Email Templates ============

/**
 * Welcome email for new user signups
 */
export async function sendWelcomeEmail(email, fullName) {
  const firstName = fullName?.split(' ')[0] || 'there';
  const html = brandedTemplate(`
    <h2>Welcome to Infinity Legal, ${firstName}!</h2>
    <p>Thank you for joining us. You now have access to AI-powered legal guidance and a network of verified South African attorneys.</p>
    <p>Here's what you can do next:</p>
    <div class="email-info-box">
      <table>
        <tr><td>AI Legal Intake</td><td>Describe your issue and get instant guidance</td></tr>
        <tr><td>Book a Consultation</td><td>Connect with a matched, LPC-verified attorney</td></tr>
        <tr><td>Apply for Services</td><td>Submit a full legal services application</td></tr>
      </table>
    </div>
    <p style="text-align: center; margin-top: 24px;">
      <a href="${process.env.NEXT_PUBLIC_BASE_URL || ''}/intake" class="email-cta">Start Your Free AI Intake &rarr;</a>
    </p>
    <p style="font-size: 13px; color: #6b7280; margin-top: 24px;">Your data is protected under POPIA and our strict privacy policy. We never share your information without your consent.</p>
  `, `Welcome to Infinity Legal, ${firstName}! Start with a free AI legal intake.`);

  return sendEmail({
    to: [{ email, name: fullName }],
    subject: `Welcome to Infinity Legal, ${firstName}!`,
    htmlContent: html,
    tags: ['welcome', 'signup'],
  });
}

/**
 * Booking confirmation email
 */
export async function sendBookingConfirmation(email, fullName, bookingDetails) {
  const firstName = fullName?.split(' ')[0] || 'there';
  const { attorneyName, date, time, caseType } = bookingDetails;

  const html = brandedTemplate(`
    <h2>Consultation Confirmed!</h2>
    <p>Dear ${firstName}, your consultation has been booked successfully.</p>
    <div class="email-info-box">
      <table>
        <tr><td>Attorney</td><td>${attorneyName || 'To be assigned'}</td></tr>
        <tr><td>Date</td><td>${date}</td></tr>
        <tr><td>Time</td><td>${time}</td></tr>
        <tr><td>Case Type</td><td>${caseType || 'General Consultation'}</td></tr>
      </table>
    </div>
    <p><strong>What to prepare:</strong></p>
    <p>Please have any relevant documents, court papers, or correspondence ready for your consultation. The more information you can provide, the better guidance your attorney can offer.</p>
    <p style="text-align: center; margin-top: 24px;">
      <a href="${process.env.NEXT_PUBLIC_BASE_URL || ''}/dashboard" class="email-cta">View in Dashboard &rarr;</a>
    </p>
  `, `Your consultation with ${attorneyName || 'an attorney'} on ${date} is confirmed.`);

  return sendEmail({
    to: [{ email, name: fullName }],
    subject: `Consultation Confirmed — ${date} at ${time}`,
    htmlContent: html,
    tags: ['booking', 'confirmation'],
  });
}

/**
 * Case status update email
 */
export async function sendCaseStatusUpdate(email, fullName, caseDetails) {
  const firstName = fullName?.split(' ')[0] || 'there';
  const { caseId, caseType, newStatus, description } = caseDetails;

  const statusColors = {
    'open': '#059669',
    'in_progress': '#d97706',
    'under_review': '#2563eb',
    'resolved': '#059669',
    'closed': '#6b7280',
  };
  const statusColor = statusColors[newStatus?.toLowerCase()] || '#1a365d';

  const html = brandedTemplate(`
    <h2>Case Status Update</h2>
    <p>Dear ${firstName}, there's an update on your case.</p>
    <div class="email-info-box">
      <table>
        <tr><td>Case ID</td><td>${caseId}</td></tr>
        <tr><td>Type</td><td>${caseType || 'Legal Matter'}</td></tr>
        <tr><td>New Status</td><td><span style="color: ${statusColor}; font-weight: 700;">${newStatus}</span></td></tr>
      </table>
    </div>
    ${description ? `<p>${description}</p>` : ''}
    <p style="text-align: center; margin-top: 24px;">
      <a href="${process.env.NEXT_PUBLIC_BASE_URL || ''}/dashboard" class="email-cta">View Case Details &rarr;</a>
    </p>
  `, `Your case ${caseId} status has been updated to ${newStatus}.`);

  return sendEmail({
    to: [{ email, name: fullName }],
    subject: `Case Update: ${caseType || 'Your Case'} — ${newStatus}`,
    htmlContent: html,
    tags: ['case', 'status-update'],
  });
}

/**
 * Task reminder email
 */
export async function sendTaskReminder(email, fullName, taskDetails) {
  const firstName = fullName?.split(' ')[0] || 'there';
  const { taskTitle, description, dueDate } = taskDetails;

  const html = brandedTemplate(`
    <h2>Task Reminder</h2>
    <p>Dear ${firstName}, this is a friendly reminder about an upcoming task.</p>
    <div class="email-info-box">
      <table>
        <tr><td>Task</td><td><strong>${taskTitle}</strong></td></tr>
        <tr><td>Due Date</td><td>${dueDate}</td></tr>
        ${description ? `<tr><td>Details</td><td>${description}</td></tr>` : ''}
      </table>
    </div>
    <p style="text-align: center; margin-top: 24px;">
      <a href="${process.env.NEXT_PUBLIC_BASE_URL || ''}/dashboard" class="email-cta">View in Dashboard &rarr;</a>
    </p>
  `, `Reminder: ${taskTitle} is due on ${dueDate}.`);

  return sendEmail({
    to: [{ email, name: fullName }],
    subject: `Reminder: ${taskTitle} — Due ${dueDate}`,
    htmlContent: html,
    tags: ['task', 'reminder'],
  });
}
