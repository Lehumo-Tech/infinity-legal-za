/**
 * Communication Templates — Infinity Legal SA
 *
 * Professional email and SMS templates for a South African law firm.
 * All templates support variable interpolation with {{variable}} syntax.
 *
 * Template Categories:
 * - welcome: New user signup welcome
 * - verification: Email/phone verification OTP
 * - consultation_reminder: Upcoming consultation alert
 * - case_update: Case status change notification
 * - payment_confirmation: Payment receipt
 * - notification: General notifications
 */

import { db } from '@/lib/db';

// ============================================
// TEMPLATE VARIABLES
// ============================================

export interface TemplateVars {
  // Common
  full_name?: string;
  first_name?: string;
  email?: string;
  phone?: string;
  firm_name?: string;
  firm_phone?: string;
  firm_email?: string;
  firm_website?: string;
  app_url?: string;

  // Verification
  otp_code?: string;
  otp_expires_minutes?: string;

  // Case
  case_ref?: string;
  case_title?: string;
  case_status?: string;
  case_type?: string;

  // Consultation
  consultation_date?: string;
  consultation_time?: string;
  consultation_type?: string;
  attorney_name?: string;

  // Payment
  amount?: string;
  currency?: string;
  plan_name?: string;
  payment_date?: string;

  // Custom
  [key: string]: string | undefined;
}

// ============================================
// DEFAULT VALUES
// ============================================

const DEFAULTS = {
  firm_name: 'Infinity Legal SA',
  firm_phone: '068 127 6038',
  firm_email: 'info@infinitylegal.org',
  firm_website: 'infinitylegal.org',
  app_url: process.env.NEXT_PUBLIC_APP_URL || 'https://infinitylegal.org',
};

// ============================================
// TEMPLATE INTERPOLATION
// ============================================

function interpolate(template: string, vars: TemplateVars): string {
  const allVars = { ...DEFAULTS, ...vars };
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return allVars[key] || match;
  });
}

// ============================================
// BUILT-IN EMAIL TEMPLATES
// ============================================

export const EMAIL_TEMPLATES = {
  welcome: {
    name: 'welcome',
    channel: 'email',
    category: 'welcome',
    subject: 'Welcome to Infinity Legal SA — Your Legal Journey Starts Here',
    getHtml: (vars: TemplateVars) => interpolate(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f8f9fa;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;">
    <!-- Header -->
    <tr>
      <td style="background:linear-gradient(135deg,#0c1e3c 0%,#1a365d 100%);padding:32px 40px;text-align:center;">
        <h1 style="margin:0;color:#c9a84c;font-size:28px;font-weight:700;letter-spacing:1px;">Infinity Legal SA</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Your Trusted Legal Partner in South Africa</p>
      </td>
    </tr>
    <!-- Body -->
    <tr>
      <td style="padding:40px;">
        <h2 style="margin:0 0 16px;color:#0c1e3c;font-size:22px;">Welcome, {{first_name}}!</h2>
        <p style="margin:0 0 16px;color:#4a5568;font-size:15px;line-height:1.7;">
          Thank you for joining <strong>Infinity Legal SA</strong>. We are delighted to have you as part of our legal community. Your account has been successfully created and you now have access to our comprehensive legal services platform.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background:#f7f9fc;border-radius:8px;border-left:4px solid #c9a84c;">
          <tr>
            <td style="padding:20px 24px;">
              <p style="margin:0 0 8px;color:#0c1e3c;font-weight:600;font-size:15px;">Your Account Details</p>
              <table cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;color:#4a5568;">
                <tr><td style="padding:4px 0;"><strong>Name:</strong></td><td style="padding:4px 8px;">{{full_name}}</td></tr>
                <tr><td style="padding:4px 0;"><strong>Email:</strong></td><td style="padding:4px 8px;">{{email}}</td></tr>
              </table>
            </td>
          </tr>
        </table>
        <h3 style="margin:24px 0 12px;color:#0c1e3c;font-size:17px;">What You Can Do Now</h3>
        <table cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;color:#4a5568;">
          <tr><td style="padding:8px 0;">⚖️</td><td style="padding:8px 8px;"><strong>Submit Legal Matters</strong> — Describe your legal issue and get matched with the right advisor</td></tr>
          <tr><td style="padding:8px 0;">📋</td><td style="padding:8px 8px;"><strong>Book Consultations</strong> — Schedule meetings with our experienced legal team</td></tr>
          <tr><td style="padding:8px 0;">📁</td><td style="padding:8px 8px;"><strong>Upload Documents</strong> — Securely share and manage your legal documents</td></tr>
          <tr><td style="padding:8px 0;">💬</td><td style="padding:8px 8px;"><strong>Track Your Cases</strong> — Stay updated on every development in real time</td></tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
          <tr>
            <td style="text-align:center;">
              <a href="{{app_url}}" style="display:inline-block;background:#c9a84c;color:#ffffff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:600;font-size:15px;">Go to Your Dashboard</a>
            </td>
          </tr>
        </table>
        <p style="margin:0 0 12px;color:#4a5568;font-size:14px;line-height:1.7;">
          If you have any questions, please don't hesitate to reach out. We are here to help you every step of the way.
        </p>
        <p style="margin:0;color:#4a5568;font-size:14px;line-height:1.7;">
          Warm regards,<br>
          <strong style="color:#0c1e3c;">The Infinity Legal SA Team</strong><br>
          <span style="font-size:13px;color:#718096;">{{firm_phone}} | {{firm_email}}</span>
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="background:#0c1e3c;padding:24px 40px;text-align:center;">
        <p style="margin:0;color:rgba(255,255,255,0.6);font-size:12px;">
          © {{current_year}} Infinity Legal SA. All rights reserved.<br>
          POPIA Compliant | {{firm_website}}<br>
          <a href="{{app_url}}" style="color:#c9a84c;text-decoration:none;">Visit our website</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`, { ...vars, first_name: vars.first_name || vars.full_name?.split(' ')[0] || 'Client', current_year: new Date().getFullYear().toString() }),
    getText: (vars: TemplateVars) => interpolate(`Welcome to Infinity Legal SA, {{first_name}}!

Thank you for joining Infinity Legal SA. Your account has been successfully created.

Your Account Details:
- Name: {{full_name}}
- Email: {{email}}

What You Can Do Now:
• Submit Legal Matters — Describe your legal issue and get matched with the right advisor
• Book Consultations — Schedule meetings with our experienced legal team
• Upload Documents — Securely share and manage your legal documents
• Track Your Cases — Stay updated on every development in real time

Visit {{app_url}} to get started.

If you have any questions, please contact us at {{firm_phone}} or {{firm_email}}.

Warm regards,
The Infinity Legal SA Team`, { ...vars, first_name: vars.first_name || vars.full_name?.split(' ')[0] || 'Client' }),
  },

  verification: {
    name: 'verification',
    channel: 'email',
    category: 'verification',
    subject: 'Verify Your Email — Infinity Legal SA',
    getHtml: (vars: TemplateVars) => interpolate(`
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;">
    <tr>
      <td style="background:linear-gradient(135deg,#0c1e3c 0%,#1a365d 100%);padding:32px 40px;text-align:center;">
        <h1 style="margin:0;color:#c9a84c;font-size:28px;font-weight:700;">Infinity Legal SA</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:40px;text-align:center;">
        <h2 style="margin:0 0 16px;color:#0c1e3c;font-size:22px;">Verify Your Email Address</h2>
        <p style="margin:0 0 24px;color:#4a5568;font-size:15px;line-height:1.7;">
          Hi {{first_name}}, please use the verification code below to confirm your email address.
        </p>
        <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;background:#f7f9fc;border-radius:8px;border:2px dashed #c9a84c;">
          <tr>
            <td style="padding:24px 48px;">
              <span style="font-size:36px;font-weight:700;color:#0c1e3c;letter-spacing:8px;font-family:'Courier New',monospace;">{{otp_code}}</span>
            </td>
          </tr>
        </table>
        <p style="margin:0 0 16px;color:#718096;font-size:13px;">
          This code expires in <strong>{{otp_expires_minutes}} minutes</strong>.
        </p>
        <p style="margin:0;color:#718096;font-size:13px;">
          If you didn't request this, please ignore this email.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background:#0c1e3c;padding:20px 40px;text-align:center;">
        <p style="margin:0;color:rgba(255,255,255,0.6);font-size:12px;">© {{current_year}} Infinity Legal SA | {{firm_website}}</p>
      </td>
    </tr>
  </table>
</body>
</html>`, { ...vars, first_name: vars.first_name || vars.full_name?.split(' ')[0] || 'User', otp_expires_minutes: vars.otp_expires_minutes || '10', current_year: new Date().getFullYear().toString() }),
    getText: (vars: TemplateVars) => interpolate(`Verify Your Email — Infinity Legal SA

Hi {{first_name}},

Your verification code is: {{otp_code}}

This code expires in {{otp_expires_minutes}} minutes.

If you didn't request this, please ignore this email.

Infinity Legal SA | {{firm_phone}}`, { ...vars, first_name: vars.first_name || vars.full_name?.split(' ')[0] || 'User', otp_expires_minutes: vars.otp_expires_minutes || '10' }),
  },

  consultation_reminder: {
    name: 'consultation_reminder',
    channel: 'email',
    category: 'consultation_reminder',
    subject: 'Upcoming Consultation Reminder — Infinity Legal SA',
    getHtml: (vars: TemplateVars) => interpolate(`
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;">
    <tr>
      <td style="background:linear-gradient(135deg,#0c1e3c 0%,#1a365d 100%);padding:32px 40px;text-align:center;">
        <h1 style="margin:0;color:#c9a84c;font-size:28px;font-weight:700;">Infinity Legal SA</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:40px;">
        <h2 style="margin:0 0 16px;color:#0c1e3c;font-size:22px;">Consultation Reminder</h2>
        <p style="margin:0 0 20px;color:#4a5568;font-size:15px;line-height:1.7;">
          Hi {{first_name}}, this is a friendly reminder about your upcoming consultation.
        </p>
        <table cellpadding="0" cellspacing="0" style="width:100%;background:#f7f9fc;border-radius:8px;border-left:4px solid #c9a84c;">
          <tr>
            <td style="padding:20px 24px;">
              <table style="width:100%;font-size:14px;color:#4a5568;">
                <tr><td style="padding:6px 0;font-weight:600;color:#0c1e3c;">📅 Date</td><td style="padding:6px 8px;">{{consultation_date}}</td></tr>
                <tr><td style="padding:6px 0;font-weight:600;color:#0c1e3c;">🕐 Time</td><td style="padding:6px 8px;">{{consultation_time}}</td></tr>
                <tr><td style="padding:6px 0;font-weight:600;color:#0c1e3c;">⚖️ Legal Advisor</td><td style="padding:6px 8px;">{{attorney_name}}</td></tr>
                <tr><td style="padding:6px 0;font-weight:600;color:#0c1e3c;">📋 Type</td><td style="padding:6px 8px;">{{consultation_type}}</td></tr>
              </table>
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0;color:#718096;font-size:13px;">
          If you need to reschedule, please contact us at {{firm_phone}} or {{firm_email}}.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background:#0c1e3c;padding:20px 40px;text-align:center;">
        <p style="margin:0;color:rgba(255,255,255,0.6);font-size:12px;">© {{current_year}} Infinity Legal SA | {{firm_website}}</p>
      </td>
    </tr>
  </table>
</body>
</html>`, { ...vars, first_name: vars.first_name || vars.full_name?.split(' ')[0] || 'Client', current_year: new Date().getFullYear().toString() }),
    getText: (vars: TemplateVars) => interpolate(`Consultation Reminder — Infinity Legal SA

Hi {{first_name}},

Your consultation is coming up:
- Date: {{consultation_date}}
- Time: {{consultation_time}}
- Legal Advisor: {{attorney_name}}
- Type: {{consultation_type}}

To reschedule, contact {{firm_phone}} or {{firm_email}}.

Infinity Legal SA`, { ...vars, first_name: vars.first_name || vars.full_name?.split(' ')[0] || 'Client' }),
  },

  case_update: {
    name: 'case_update',
    channel: 'email',
    category: 'case_update',
    subject: 'Case Update: {{case_ref}} — Infinity Legal SA',
    getHtml: (vars: TemplateVars) => interpolate(`
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;">
    <tr>
      <td style="background:linear-gradient(135deg,#0c1e3c 0%,#1a365d 100%);padding:32px 40px;text-align:center;">
        <h1 style="margin:0;color:#c9a84c;font-size:28px;font-weight:700;">Infinity Legal SA</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:40px;">
        <h2 style="margin:0 0 16px;color:#0c1e3c;font-size:22px;">Case Status Update</h2>
        <p style="margin:0 0 20px;color:#4a5568;font-size:15px;line-height:1.7;">
          Hi {{first_name}}, there has been an update on your case.
        </p>
        <table cellpadding="0" cellspacing="0" style="width:100%;background:#f7f9fc;border-radius:8px;border-left:4px solid #c9a84c;">
          <tr>
            <td style="padding:20px 24px;">
              <table style="width:100%;font-size:14px;color:#4a5568;">
                <tr><td style="padding:6px 0;font-weight:600;color:#0c1e3c;">📋 Case Ref</td><td style="padding:6px 8px;">{{case_ref}}</td></tr>
                <tr><td style="padding:6px 0;font-weight:600;color:#0c1e3c;">📝 Title</td><td style="padding:6px 8px;">{{case_title}}</td></tr>
                <tr><td style="padding:6px 0;font-weight:600;color:#0c1e3c;">📊 Status</td><td style="padding:6px 8px;">{{case_status}}</td></tr>
              </table>
            </td>
          </tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
          <tr>
            <td style="text-align:center;">
              <a href="{{app_url}}" style="display:inline-block;background:#c9a84c;color:#ffffff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:600;">View Case Details</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="background:#0c1e3c;padding:20px 40px;text-align:center;">
        <p style="margin:0;color:rgba(255,255,255,0.6);font-size:12px;">© {{current_year}} Infinity Legal SA | {{firm_website}}</p>
      </td>
    </tr>
  </table>
</body>
</html>`, { ...vars, first_name: vars.first_name || vars.full_name?.split(' ')[0] || 'Client', current_year: new Date().getFullYear().toString() }),
    getText: (vars: TemplateVars) => interpolate(`Case Update: {{case_ref}} — Infinity Legal SA

Hi {{first_name}},

Your case has been updated:
- Case: {{case_ref}} — {{case_title}}
- New Status: {{case_status}}

View details at {{app_url}}

Infinity Legal SA | {{firm_phone}}`, { ...vars, first_name: vars.first_name || vars.full_name?.split(' ')[0] || 'Client' }),
  },

  payment_confirmation: {
    name: 'payment_confirmation',
    channel: 'email',
    category: 'payment_confirmation',
    subject: 'Payment Confirmation — Infinity Legal SA',
    getHtml: (vars: TemplateVars) => interpolate(`
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;">
    <tr>
      <td style="background:linear-gradient(135deg,#0c1e3c 0%,#1a365d 100%);padding:32px 40px;text-align:center;">
        <h1 style="margin:0;color:#c9a84c;font-size:28px;font-weight:700;">Infinity Legal SA</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:40px;">
        <h2 style="margin:0 0 16px;color:#0c1e3c;font-size:22px;">Payment Confirmed ✅</h2>
        <p style="margin:0 0 20px;color:#4a5568;font-size:15px;line-height:1.7;">
          Hi {{first_name}}, your payment has been successfully processed.
        </p>
        <table cellpadding="0" cellspacing="0" style="width:100%;background:#f7f9fc;border-radius:8px;border-left:4px solid #38a169;">
          <tr>
            <td style="padding:20px 24px;">
              <table style="width:100%;font-size:14px;color:#4a5568;">
                <tr><td style="padding:6px 0;font-weight:600;color:#0c1e3c;">💰 Amount</td><td style="padding:6px 8px;">{{currency}} {{amount}}</td></tr>
                <tr><td style="padding:6px 0;font-weight:600;color:#0c1e3c;">📋 Plan</td><td style="padding:6px 8px;">{{plan_name}}</td></tr>
                <tr><td style="padding:6px 0;font-weight:600;color:#0c1e3c;">📅 Date</td><td style="padding:6px 8px;">{{payment_date}}</td></tr>
              </table>
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0;color:#718096;font-size:13px;">
          Thank you for your trust in Infinity Legal SA. For billing questions, contact {{firm_email}}.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background:#0c1e3c;padding:20px 40px;text-align:center;">
        <p style="margin:0;color:rgba(255,255,255,0.6);font-size:12px;">© {{current_year}} Infinity Legal SA | {{firm_website}}</p>
      </td>
    </tr>
  </table>
</body>
</html>`, { ...vars, first_name: vars.first_name || vars.full_name?.split(' ')[0] || 'Client', current_year: new Date().getFullYear().toString() }),
    getText: (vars: TemplateVars) => interpolate(`Payment Confirmation — Infinity Legal SA

Hi {{first_name}},

Your payment has been confirmed:
- Amount: {{currency}} {{amount}}
- Plan: {{plan_name}}
- Date: {{payment_date}}

Thank you for choosing Infinity Legal SA.
For billing questions, contact {{firm_email}}.

Infinity Legal SA | {{firm_phone}}`, { ...vars, first_name: vars.first_name || vars.full_name?.split(' ')[0] || 'Client' }),
  },
};

// ============================================
// BUILT-IN SMS TEMPLATES
// ============================================

export const SMS_TEMPLATES = {
  welcome: {
    name: 'welcome',
    channel: 'sms',
    category: 'welcome',
    getText: (vars: TemplateVars) => interpolate(`Welcome to Infinity Legal SA, {{first_name}}! Your account is ready. Visit {{firm_website}} to get started. For help, call {{firm_phone}}.`, { ...vars, first_name: vars.first_name || vars.full_name?.split(' ')[0] || 'Client' }),
  },

  verification: {
    name: 'verification',
    channel: 'sms',
    category: 'verification',
    getText: (vars: TemplateVars) => interpolate(`Your Infinity Legal SA verification code is: {{otp_code}}. Valid for {{otp_expires_minutes}} minutes. Do not share this code.`, { ...vars, otp_expires_minutes: vars.otp_expires_minutes || '10' }),
  },

  consultation_reminder: {
    name: 'consultation_reminder',
    channel: 'sms',
    category: 'consultation_reminder',
    getText: (vars: TemplateVars) => interpolate(`Reminder: Your consultation with {{attorney_name}} is on {{consultation_date}} at {{consultation_time}} ({{consultation_type}}). To reschedule, call {{firm_phone}}. - Infinity Legal SA`, { ...vars }),
  },

  case_update: {
    name: 'case_update',
    channel: 'sms',
    category: 'case_update',
    getText: (vars: TemplateVars) => interpolate(`Case Update: {{case_ref}} status changed to {{case_status}}. View details at {{firm_website}}. - Infinity Legal SA`, { ...vars }),
  },

  payment_confirmation: {
    name: 'payment_confirmation',
    channel: 'sms',
    category: 'payment_confirmation',
    getText: (vars: TemplateVars) => interpolate(`Payment of {{currency}} {{amount}} confirmed for {{plan_name}}. Thank you for choosing Infinity Legal SA!`, { ...vars }),
  },
};

// ============================================
// HELPER: Generate OTP
// ============================================

export function generateOtp(length = 6): string {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
}

// ============================================
// HELPER: Render template by name
// ============================================

export function renderEmailTemplate(templateName: string, vars: TemplateVars): { subject: string; html: string; text: string } | null {
  const template = (EMAIL_TEMPLATES as any)[templateName];
  if (!template) return null;
  return {
    subject: interpolate(template.subject, vars),
    html: template.getHtml(vars),
    text: template.getText(vars),
  };
}

export function renderSmsTemplate(templateName: string, vars: TemplateVars): string | null {
  const template = (SMS_TEMPLATES as any)[templateName];
  if (!template) return null;
  return template.getText(vars);
}

// ============================================
// SEED: Create system templates in database
// ============================================

export async function seedSystemTemplates() {
  const emailTemplates = Object.values(EMAIL_TEMPLATES);
  const smsTemplates = Object.values(SMS_TEMPLATES);

  for (const tmpl of emailTemplates) {
    await db.emailTemplate.upsert({
      where: { name: `system_email_${tmpl.name}` },
      update: {
        subject: tmpl.subject,
        body_text: tmpl.getText({ full_name: '{{full_name}}', first_name: '{{first_name}}', email: '{{email}}' }),
        is_active: true,
        is_system: true,
      },
      create: {
        name: `system_email_${tmpl.name}`,
        channel: 'email',
        category: tmpl.category,
        subject: tmpl.subject,
        body_text: tmpl.getText({ full_name: '{{full_name}}', first_name: '{{first_name}}', email: '{{email}}' }),
        variables: ['full_name', 'first_name', 'email', 'firm_name', 'firm_phone', 'app_url'],
        is_active: true,
        is_system: true,
      },
    });
  }

  for (const tmpl of smsTemplates) {
    await db.emailTemplate.upsert({
      where: { name: `system_sms_${tmpl.name}` },
      update: {
        body_text: tmpl.getText({ full_name: '{{full_name}}', first_name: '{{first_name}}' }),
        is_active: true,
        is_system: true,
      },
      create: {
        name: `system_sms_${tmpl.name}`,
        channel: 'sms',
        category: tmpl.category,
        body_text: tmpl.getText({ full_name: '{{full_name}}', first_name: '{{first_name}}' }),
        variables: ['full_name', 'first_name', 'firm_name', 'firm_phone'],
        is_active: true,
        is_system: true,
      },
    });
  }
}
