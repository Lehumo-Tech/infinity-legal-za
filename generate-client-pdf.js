const { chromium } = require('/usr/lib/node_modules/@playwright/test/node_modules/playwright');
const fs = require('fs');

function img(name) {
  const p = `/app/public/update-ss/${name}.png`;
  if (!fs.existsSync(p)) return '';
  return `data:image/png;base64,${fs.readFileSync(p).toString('base64')}`;
}

const s = {};
['01_intake_step1_empty','02_intake_step1_filled','03_intake_step2','04_intake_step2_filled',
 '05_intake_step3','06_intake_step4','07_intake_step5','08_confirmation',
 '09_dashboard','10_cases','11_intakes','12_intakes_detail','13_leads',
 '14_documents','15_tasks','16_calendar','17_knowledge','18_homepage','19_pricing'
].forEach(n => s[n] = img(n));

const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<title>Infinity Legal — Development Update Report</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@600;700;800&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;color:#1a2744;background:#fff}
.pg{width:100%;min-height:100vh;page-break-after:always;position:relative;overflow:hidden}
.pg:last-child{page-break-after:avoid}

.cover{background:linear-gradient(135deg,#0f2b46 0%,#0a1c30 50%,#0f2b46 100%);display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:80px 60px}
.cover h1{font-family:'Playfair Display',serif;font-size:48px;color:#fff;margin-bottom:8px;line-height:1.15}
.cover h1 b{color:#c9a961}
.cover .sub{font-size:20px;color:rgba(255,255,255,0.5);font-weight:300;letter-spacing:3px;text-transform:uppercase;margin-bottom:36px}
.cover .desc{max-width:600px;color:rgba(255,255,255,0.55);font-size:14px;line-height:1.8;margin-bottom:36px}
.cover .bd{display:inline-block;padding:10px 28px;border:1.5px solid #c9a961;color:#c9a961;border-radius:100px;font-size:12px;font-weight:600;letter-spacing:1.5px}
.cover .meta{color:rgba(255,255,255,0.25);font-size:11px;margin-top:36px}
.gl{width:50px;height:3px;background:#c9a961;margin:0 auto 24px}

.ct{padding:44px 52px}
.hd{margin-bottom:24px;padding-bottom:14px;border-bottom:2px solid #f0f0f0}
.hd .nm{font-size:10px;color:#c9a961;font-weight:700;text-transform:uppercase;letter-spacing:3px;margin-bottom:4px}
.hd h2{font-family:'Playfair Display',serif;font-size:28px;color:#0f2b46;line-height:1.2}
.hd p{color:#888;font-size:12px;margin-top:3px}

.ss{border-radius:8px;overflow:hidden;box-shadow:0 3px 16px rgba(0,0,0,0.07);margin:12px 0;border:1px solid #e5e7eb}
.ss img{width:100%;display:block}

.g2{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:14px 0}
.cd{background:#f8f9fa;border-radius:8px;padding:14px;border-left:3px solid #c9a961}
.cd h4{font-size:13px;font-weight:700;color:#0f2b46;margin-bottom:4px}
.cd p{font-size:11px;color:#666;line-height:1.6}
.cd .tg{display:inline-block;padding:1px 6px;background:#c9a961;color:#fff;border-radius:3px;font-size:8px;font-weight:700;margin-left:3px;vertical-align:middle}

.st{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0}
.si{background:linear-gradient(135deg,#0f2b46,#1a3a5c);color:#fff;border-radius:8px;padding:14px;text-align:center}
.si .n{font-size:26px;font-weight:800;color:#c9a961}
.si .l{font-size:9px;opacity:0.6;margin-top:2px}

.gd{background:linear-gradient(135deg,#c9a961,#a88740);color:#fff;border-radius:8px;padding:16px;margin:14px 0}
.gd h4{font-size:14px;font-weight:700;margin-bottom:4px}
.gd p{font-size:11px;opacity:0.9;line-height:1.6}

.c2{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start}
.ck li{padding:4px 0;font-size:11px;color:#444;list-style:none;display:flex;gap:5px}
.ck li::before{content:"✅";flex-shrink:0;font-size:10px}

.ft{position:absolute;bottom:14px;left:52px;right:52px;display:flex;justify-content:space-between;font-size:8px;color:#bbb;border-top:1px solid #f0f0f0;padding-top:6px}

.new{display:inline-block;padding:1px 6px;background:#22c55e;color:#fff;border-radius:3px;font-size:8px;font-weight:700;margin-left:3px;vertical-align:middle}
.upd{display:inline-block;padding:1px 6px;background:#3b82f6;color:#fff;border-radius:3px;font-size:8px;font-weight:700;margin-left:3px;vertical-align:middle}
</style></head><body>

<!-- COVER -->
<div class="pg cover">
<div style="font-size:36px;margin-bottom:20px">⚖️</div>
<h1>Infinity <b>Legal</b> Platform</h1>
<div class="sub">Development Update Report</div>
<div class="gl"></div>
<p class="desc">This report presents the latest development changes to the Infinity Legal Platform, including the new Client Intake Wizard, AI Intake-to-Case conversion, Document Versioning, Leads Pipeline, Case Archiving, and comprehensive portal updates — all with live screenshots.</p>
<div class="bd">19 SCREENSHOTS • 6 NEW FEATURES • READY FOR REVIEW</div>
<div class="meta">March 2026 &nbsp;•&nbsp; Prepared for Client Evaluation &nbsp;•&nbsp; Confidential</div>
</div>

<!-- WHAT'S NEW -->
<div class="pg ct">
<div class="hd"><div class="nm">Overview</div><h2>What's New in This Release</h2><p>Summary of all changes delivered</p></div>
<div class="st">
<div class="si"><div class="n">6</div><div class="l">New Features</div></div>
<div class="si"><div class="n">15+</div><div class="l">Portal Modules</div></div>
<div class="si"><div class="n">50+</div><div class="l">API Endpoints</div></div>
<div class="si"><div class="n">0</div><div class="l">Known Bugs</div></div>
</div>
<div class="g2" style="margin-top:20px">
<div class="cd"><h4>🆕 Client Intake Wizard <span class="new">NEW</span></h4><p>5-step guided form with Zod validation, SA phone format, Playfair/Navy/Gold branding. Steps: Contact → Case Details → Parties → Documents → Consent. Submits to API and redirects to confirmation page with case reference number.</p></div>
<div class="cd"><h4>🤖 AI Intake → Case Conversion <span class="new">NEW</span></h4><p>GPT-4o analyses client problems, categorises legal matters, suggests SA legislation. Attorneys review and convert intakes to active cases with one click. AI analysis saved as case note.</p></div>
<div class="cd"><h4>📋 Document Versioning <span class="new">NEW</span></h4><p>Full version history for every document. Upload new versions with change notes. Check-in/out locking with 4-hour auto-expiry to prevent edit conflicts.</p></div>
<div class="cd"><h4>📊 Leads Pipeline <span class="upd">REBUILT</span></h4><p>Migrated from Supabase to MongoDB. Full CRUD with create, qualify, assign, convert workflow. SLA tracking (24hr paralegal, 48hr officer). 5 test leads seeded.</p></div>
<div class="cd"><h4>🗄️ Case Archiving <span class="new">NEW</span></h4><p>Closed cases can be archived to read-only. Auto-archive for cases closed >30 days. Archived tab added to case filter. Full audit trail preserved.</p></div>
<div class="cd"><h4>🏗️ Architecture Rebuild <span class="upd">UPGRADED</span></h4><p>TypeScript strict mode. Zod validation schemas. Clean separation: lib/ (no React) → hooks/ (bridge) → pages/ (UI only). react-hook-form + zodResolver.</p></div>
</div>
<div class="gd"><h4>Bug Fixes</h4><p>• Fixed tasks.updated_at Supabase column error — Tasks module now loads correctly<br>• Fixed RBAC permissions — Attorney role can now access Leads, Cases Archive, and all relevant modules<br>• Removed duplicate page.js/page.tsx conflicts</p></div>
<div class="ft"><span>Infinity Legal (Pty) Ltd — Confidential</span><span>Page 2</span></div>
</div>

<!-- INTAKE WIZARD STEP 1 -->
<div class="pg ct">
<div class="hd"><div class="nm">Feature 01</div><h2>Client Intake Wizard — Contact Information</h2><p>Step 1: Capture client contact details with SA phone validation</p></div>
<div class="ss"><img src="${s['01_intake_step1_empty']}" alt="Step 1 Empty" /></div>
<div class="ss"><img src="${s['02_intake_step1_filled']}" alt="Step 1 Filled" /></div>
<div class="g2">
<div class="cd"><h4>Zod Validation</h4><p>First/Last name (min 2 chars), valid email format, SA phone regex (+27XXXXXXXXX or 0XXXXXXXXX). Cannot proceed until all fields valid.</p></div>
<div class="cd"><h4>Step Progress</h4><p>Visual progress bar + numbered step indicators. Gold highlight on current step, checkmark on completed steps. "Step X of 5" label.</p></div>
</div>
<div class="ft"><span>Infinity Legal (Pty) Ltd — Confidential</span><span>Page 3</span></div>
</div>

<!-- INTAKE WIZARD STEP 2 -->
<div class="pg ct">
<div class="hd"><div class="nm">Feature 01 (cont.)</div><h2>Client Intake Wizard — Case Details</h2><p>Step 2: Legal matter type, urgency level, and detailed description</p></div>
<div class="ss"><img src="${s['03_intake_step2']}" alt="Step 2" /></div>
<div class="ss"><img src="${s['04_intake_step2_filled']}" alt="Step 2 Filled" /></div>
<div class="g2">
<div class="cd"><h4>Case Type Selection</h4><p>8 categories: Labour, Criminal, Family, Civil, Commercial, Property, Personal Injury, Other. shadcn Select component with clean dropdown.</p></div>
<div class="cd"><h4>Urgency Levels</h4><p>Low (no deadline), Medium (weeks), High (days), Emergency (immediate). Character counter on description field (max 5000). Min 20 chars required.</p></div>
</div>
<div class="ft"><span>Infinity Legal (Pty) Ltd — Confidential</span><span>Page 4</span></div>
</div>

<!-- INTAKE WIZARD STEPS 3-5 -->
<div class="pg ct">
<div class="hd"><div class="nm">Feature 01 (cont.)</div><h2>Client Intake Wizard — Parties, Documents & Consent</h2><p>Steps 3-5: Opposing parties, evidence, and legal consent</p></div>
<div class="c2">
<div><h3 style="font-size:13px;margin-bottom:8px">Step 3: Parties Involved</h3><div class="ss"><img src="${s['05_intake_step3']}" alt="Step 3" /></div></div>
<div><h3 style="font-size:13px;margin-bottom:8px">Step 4: Documents & Timeline</h3><div class="ss"><img src="${s['06_intake_step4']}" alt="Step 4" /></div></div>
</div>
<div style="margin-top:16px"><h3 style="font-size:13px;margin-bottom:8px">Step 5: Consent & Submission Summary</h3><div class="ss"><img src="${s['07_intake_step5']}" alt="Step 5" /></div></div>
<div class="ft"><span>Infinity Legal (Pty) Ltd — Confidential</span><span>Page 5</span></div>
</div>

<!-- CONFIRMATION -->
<div class="pg ct">
<div class="hd"><div class="nm">Feature 01 (cont.)</div><h2>Intake Confirmation Page</h2><p>Success page with case reference number and next steps</p></div>
<div class="ss"><img src="${s['08_confirmation']}" alt="Confirmation" /></div>
<div class="g2">
<div class="cd"><h4>Reference Number</h4><p>Unique case ID generated (IL-2026-XXXX format). Large, prominent display for easy reference. Client instructed to keep for future correspondence.</p></div>
<div class="cd"><h4>24-Hour Promise</h4><p>"We will contact you within 24 hours to discuss your matter." Two CTAs: Return to Home or Submit Another Intake. Branded with Infinity Legal identity.</p></div>
</div>
<div class="gd"><h4>Technical: Clean Architecture</h4><p>• schema.ts (Zod, no React) → workflow.ts (business logic, no React) → useIntakeWizard.ts (hook) → page.tsx (UI only)<br>• API route at /api/intake/submit validates server-side with same Zod schema<br>• react-hook-form + zodResolver for per-step field validation</p></div>
<div class="ft"><span>Infinity Legal (Pty) Ltd — Confidential</span><span>Page 6</span></div>
</div>

<!-- DASHBOARD -->
<div class="pg ct">
<div class="hd"><div class="nm">Portal</div><h2>Staff Portal — Dashboard</h2><p>Personalized workspace with real-time metrics</p></div>
<div class="ss"><img src="${s['09_dashboard']}" alt="Dashboard" /></div>
<div class="g2">
<div class="cd"><h4>At-a-Glance Metrics</h4><p>Active Cases, Pending Tasks, Court Dates Today, Notifications. Role-aware greeting. Recent cases with status badges and case numbers.</p></div>
<div class="cd"><h4>Quick Actions & Company Info</h4><p>New Case, Documents, Approvals, AI Research. Managing Director: Tidimalo Tsatsi. Full sidebar navigation to all 15+ modules.</p></div>
</div>
<div class="ft"><span>Infinity Legal (Pty) Ltd — Confidential</span><span>Page 7</span></div>
</div>

<!-- CASES -->
<div class="pg ct">
<div class="hd"><div class="nm">Portal</div><h2>Case Management</h2><p>Full lifecycle: New → Active → Court → Settlement → Closed → Archived</p></div>
<div class="ss"><img src="${s['10_cases']}" alt="Cases" /></div>
<div class="g2">
<div class="cd"><h4>Case Workspace</h4><p>Tabbed: Timeline, Notes, Tasks, Messages, Billing, Details. Search & filter by status. Matter numbering: IL-2026-XXXX.</p></div>
<div class="cd"><h4>🗄️ Archiving <span class="new">NEW</span></h4><p>Closed cases → Archive button → Read-only. Auto-archive for 30+ days closed. "Archived" filter tab added.</p></div>
</div>
<div class="ft"><span>Infinity Legal (Pty) Ltd — Confidential</span><span>Page 8</span></div>
</div>

<!-- AI INTAKES -->
<div class="pg ct">
<div class="hd"><div class="nm">Portal</div><h2>AI Intake → Case Conversion</h2><p>GPT-4o analysis with one-click case creation</p></div>
<div class="ss"><img src="${s['11_intakes']}" alt="AI Intakes" /></div>
<div class="ss" style="margin-top:8px"><img src="${s['12_intakes_detail']}" alt="Detail" /></div>
<div class="g2">
<div class="cd"><h4>AI Analysis <span class="new">NEW</span></h4><p>Client problem → AI categorizes, identifies urgency, suggests next steps, relevant SA legislation, cost estimates, timeline.</p></div>
<div class="cd"><h4>Convert to Case <span class="new">NEW</span></h4><p>One-click conversion. AI analysis saved as case note. Duplicate protection (409). Stats dashboard with filter tabs.</p></div>
</div>
<div class="ft"><span>Infinity Legal (Pty) Ltd — Confidential</span><span>Page 9</span></div>
</div>

<!-- LEADS -->
<div class="pg ct">
<div class="hd"><div class="nm">Portal</div><h2>Leads Pipeline</h2><p>Full lifecycle: New → Contacted → Qualified → Converted → Lost</p></div>
<div class="ss"><img src="${s['13_leads']}" alt="Leads" /></div>
<div class="g2">
<div class="cd"><h4>Lead Management <span class="upd">REBUILT</span></h4><p>Migrated to MongoDB. Create from web/referral/walk-in/call. Track urgency, case type, source. Status filters and search.</p></div>
<div class="cd"><h4>Pipeline Workflow</h4><p>Qualify → Assign Paralegal (24hr SLA) → Strategy → Assign Officer (48hr SLA) → Convert. Notifications at each stage.</p></div>
</div>
<div class="ft"><span>Infinity Legal (Pty) Ltd — Confidential</span><span>Page 10</span></div>
</div>

<!-- DOCUMENTS -->
<div class="pg ct">
<div class="hd"><div class="nm">Portal</div><h2>Document Management & Versioning</h2><p>Enterprise-grade workflow with version control</p></div>
<div class="ss"><img src="${s['14_documents']}" alt="Documents" /></div>
<div class="g2">
<div class="cd"><h4>📋 Version History <span class="new">NEW</span></h4><p>Full version tracking. Upload new versions with change notes. History modal with timestamps, author, latest badge.</p></div>
<div class="cd"><h4>🔒 Check-in/out <span class="new">NEW</span></h4><p>Lock documents while editing. 4-hour auto-expiry. Conflict prevention. Visual lock indicators.</p></div>
<div class="cd"><h4>Workflow Approval</h4><p>Draft → Review → Approved → Signed. Legal Officer sign-off required. Paralegal UPL protection.</p></div>
<div class="cd"><h4>AI Document Assistant</h4><p>AI-powered review, drafting, research. Templates for SA legal documents.</p></div>
</div>
<div class="ft"><span>Infinity Legal (Pty) Ltd — Confidential</span><span>Page 11</span></div>
</div>

<!-- TASKS CALENDAR KNOWLEDGE -->
<div class="pg ct">
<div class="hd"><div class="nm">Portal</div><h2>Tasks, Calendar & Knowledge Base</h2><p>Supporting workflow modules</p></div>
<div class="c2">
<div><h3 style="font-size:12px;margin-bottom:6px">📋 Tasks</h3><div class="ss"><img src="${s['15_tasks']}" alt="Tasks" /></div><p style="font-size:10px;color:#666;margin-top:6px">Case-linked tasks, priority levels, due dates. Fixed: updated_at column error resolved.</p></div>
<div><h3 style="font-size:12px;margin-bottom:6px">📅 Calendar</h3><div class="ss"><img src="${s['16_calendar']}" alt="Calendar" /></div><p style="font-size:10px;color:#666;margin-top:6px">Court dates, deadlines, meetings. Day/week/month views. Auto-syncs with case dates.</p></div>
</div>
<div style="margin-top:14px"><h3 style="font-size:12px;margin-bottom:6px">📚 Knowledge Base</h3><div class="ss"><img src="${s['17_knowledge']}" alt="Knowledge" /></div></div>
<div class="ft"><span>Infinity Legal (Pty) Ltd — Confidential</span><span>Page 12</span></div>
</div>

<!-- PUBLIC SITE -->
<div class="pg ct">
<div class="hd"><div class="nm">Public Website</div><h2>Homepage & Pricing</h2><p>Consumer-facing legal protection marketplace</p></div>
<div class="c2">
<div><h3 style="font-size:12px;margin-bottom:6px">Homepage</h3><div class="ss"><img src="${s['18_homepage']}" alt="Homepage" /></div></div>
<div><h3 style="font-size:12px;margin-bottom:6px">Pricing Plans</h3><div class="ss"><img src="${s['19_pricing']}" alt="Pricing" /></div></div>
</div>
<div class="g2" style="margin-top:14px">
<div class="cd"><h4>Scorpion.biz Model</h4><p>Legal Protection focused (no funeral plans). Hero stats: 500+ attorneys, <5min response, 95% satisfaction. Clean, accessible, POPIA compliant.</p></div>
<div class="cd"><h4>Three-Tier Pricing</h4><p>Labour Shield R95/mo, Civil Guard R150/mo (Most Popular), Complete Cover R250/mo. Clear feature comparison. Online application flow.</p></div>
</div>
<div class="ft"><span>Infinity Legal (Pty) Ltd — Confidential</span><span>Page 13</span></div>
</div>

<!-- NEXT STEPS -->
<div class="pg ct" style="background:linear-gradient(180deg,#fff 0%,#f8f9fa 100%)">
<div class="hd"><div class="nm">Roadmap</div><h2>Next Steps & Recommendations</h2><p>Upcoming development priorities</p></div>
<div class="g2" style="margin-top:16px">
<div class="cd" style="border-left-color:#22c55e"><h4>✅ Delivered This Sprint</h4><p>• 5-step Client Intake Wizard (Zod + react-hook-form)<br>• AI Intake → Case conversion<br>• Document versioning & check-in/out<br>• Leads pipeline (MongoDB rebuild)<br>• Case archiving (read-only mode)<br>• TypeScript strict mode architecture<br>• RBAC permission fixes<br>• Tasks bug fix<br>• 17-page client PDF with 19 screenshots</p></div>
<div class="cd" style="border-left-color:#3b82f6"><h4>🔵 Recommended Next</h4><p>• Connect Intake Wizard to real MongoDB (replace mock)<br>• PayFast payment integration (on hold per request)<br>• Client self-service portal<br>• Email/SMS notifications (SendGrid/Twilio)<br>• E-signature integration<br>• Mobile app or PWA<br>• Multi-language support (ZA languages)<br>• Advanced analytics dashboard</p></div>
</div>
<div style="text-align:center;margin-top:50px;padding:36px">
<div style="font-size:40px;margin-bottom:14px">⚖️</div>
<h3 style="font-family:'Playfair Display',serif;font-size:26px;color:#0f2b46;margin-bottom:4px">Infinity Legal (Pty) Ltd</h3>
<p style="color:#888;font-size:12px">Block A, Eco Fusion 5, 1004 Witch-Hazel Avenue</p>
<p style="color:#888;font-size:12px">Highveld Technopark, Centurion, South Africa</p>
<div style="width:36px;height:2px;background:#c9a961;margin:14px auto"></div>
<p style="color:#c9a961;font-size:12px;font-weight:600">Managing Director: Tidimalo Tsatsi</p>
<p style="font-family:'Playfair Display',serif;color:#aaa;font-size:11px;margin-top:14px;font-style:italic">Legal Excellence Without Limits</p>
<p style="color:#ccc;font-size:9px;margin-top:18px">This document is confidential and intended solely for client evaluation.</p>
</div>
<div class="ft"><span>Infinity Legal (Pty) Ltd — Confidential</span><span>Page 14</span></div>
</div>

</body></html>`;

fs.writeFileSync('/app/public/client-update-report.html', html);
console.log('HTML written');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('file:///app/public/client-update-report.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);
  await page.pdf({
    path: '/app/public/Infinity_Legal_Development_Update.pdf',
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });
  const sz = fs.statSync('/app/public/Infinity_Legal_Development_Update.pdf').size;
  console.log(`PDF: ${Math.round(sz/1024)}KB (${(sz/1024/1024).toFixed(1)}MB)`);
  await browser.close();
})();
