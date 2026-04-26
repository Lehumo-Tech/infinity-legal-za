"use server";

/**
 * Infinity Legal - Email Service
 * Wrapper around existing Brevo service or mock fallback
 */

import { sendEmail } from "./brevo";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://infinitylegal.org";

/**
 * Send case creation confirmation to client
 */
export async function sendCaseConfirmationEmail(email, fullName, caseData, analysis) {
  const firstName = fullName?.split(" ")[0] || "there";
  const subject = `Your Legal Matter Has Been Submitted — ${caseData.category || "General"}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Case Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; background: #f9fafb; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="background: #1a365d; padding: 32px 24px; text-align: center;">
      <h1 style="color: #d4af37; margin: 0; font-family: Georgia, serif;">Infinity Legal</h1>
      <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0; font-size: 13px;">AI-Powered Legal Help for South Africa</p>
    </div>
    <div style="padding: 32px 24px; color: #1a365d;">
      <h2 style="margin: 0 0 16px; font-family: Georgia, serif;">Hi ${firstName},</h2>
      <p style="color: #374151; line-height: 1.6;">Your legal matter has been submitted successfully. Our AI has analyzed your case and a matching attorney will review it shortly.</p>

      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; font-weight: 600; color: #1a365d; width: 40%; border-bottom: 1px solid #f3f4f6;">Category</td><td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">${analysis.category || "General"}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: 600; color: #1a365d; border-bottom: 1px solid #f3f4f6;">Urgency</td><td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">${analysis.urgency || "Medium"}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: 600; color: #1a365d; border-bottom: 1px solid #f3f4f6;">Est. Cost</td><td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">${analysis.costEstimate?.range || "TBD"}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: 600; color: #1a365d;">Status</td><td style="padding: 8px 0;">Open — Awaiting attorney assignment</td></tr>
        </table>
      </div>

      <p style="color: #374151; line-height: 1.6;"><strong>Next Steps:</strong></p>
      <ol style="color: #374151; line-height: 1.6;">
        ${(analysis.nextSteps || []).map(step => `<li>${step}</li>`).join("")}
      </ol>

      <div style="text-align: center; margin-top: 24px;">
        <a href="${BASE_URL}/dashboard" style="display: inline-block; padding: 12px 28px; background: #d4af37; color: #1a365d; font-weight: 600; text-decoration: none; border-radius: 8px;">View in Dashboard</a>
      </div>

      <p style="font-size: 13px; color: #6b7280; margin-top: 24px;">This is general information only and does not constitute legal advice. A qualified attorney will provide specific guidance.</p>
    </div>
    <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 12px; color: #9ca3af; margin: 4px 0;">&copy; 2026 Infinity Legal. All rights reserved.</p>
      <p style="font-size: 12px; color: #9ca3af; margin: 4px 0;">Registered in South Africa | POPIA Compliant</p>
    </div>
  </div>
</body>
</html>`;

  return sendEmail({ to: email, subject, htmlContent, tags: ["case", "confirmation"] });
}

/**
 * Send attorney verification email
 */
export async function sendAttorneyVerificationEmail(email, fullName) {
  const firstName = fullName?.split(" ")[0] || "there";
  const subject = "Your Infinity Legal Attorney Account Has Been Verified";

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Account Verified</title>
</head>
<body style="font-family: Arial, sans-serif; background: #f9fafb; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="background: #1a365d; padding: 32px 24px; text-align: center;">
      <h1 style="color: #d4af37; margin: 0; font-family: Georgia, serif;">Infinity Legal</h1>
    </div>
    <div style="padding: 32px 24px; color: #1a365d;">
      <h2 style="margin: 0 0 16px; font-family: Georgia, serif;">Congratulations, ${firstName}!</h2>
      <p style="color: #374151; line-height: 1.6;">Your attorney account has been verified by our admin team. You can now receive case assignments and communicate with clients through the platform.</p>

      <div style="text-align: center; margin-top: 24px;">
        <a href="${BASE_URL}/attorney/dashboard" style="display: inline-block; padding: 12px 28px; background: #d4af37; color: #1a365d; font-weight: 600; text-decoration: none; border-radius: 8px;">Go to Dashboard</a>
      </div>
    </div>
    <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 12px; color: #9ca3af; margin: 4px 0;">&copy; 2026 Infinity Legal. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  return sendEmail({ to: email, subject, htmlContent, tags: ["attorney", "verification"] });
}
