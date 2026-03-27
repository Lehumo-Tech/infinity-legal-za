const { chromium } = require('/usr/lib/node_modules/@playwright/test/node_modules/playwright');
const fs = require('fs');

function img(name) {
  const p = `/app/public/client-ss/${name}.png`;
  if (!fs.existsSync(p)) return '';
  return `data:image/png;base64,${fs.readFileSync(p).toString('base64')}`;
}

const ss = {
  homepage: img('01_homepage'),
  features: img('02_homepage_features'),
  pricing: img('03_pricing'),
  apply: img('04_apply'),
  login: img('05_login'),
  dashboard: img('06_dashboard'),
  cases: img('07_cases'),
  intakes: img('08_intakes'),
  leads: img('09_leads'),
  documents: img('10_documents'),
  tasks: img('11_tasks'),
  calendar: img('12_calendar'),
  knowledge: img('13_knowledge'),
  billing: img('14_billing'),
  hr: img('15_hr'),
  reports: img('16_reports'),
  settings: img('17_settings'),
  intakesDetail: img('18_intakes_detail'),
  leadsForm: img('19_leads_form'),
};

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Infinity Legal Platform — Client Evaluation Report</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@600;700;800&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;color:#1a2744;background:white}
.page{width:100%;min-height:100vh;page-break-after:always;position:relative;overflow:hidden}
.page:last-child{page-break-after:avoid}

/* Cover */
.cover{background:linear-gradient(135deg,#1a2744 0%,#0d1422 60%,#1a2744 100%);display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:80px 60px}
.cover .logo{width:80px;height:80px;background:#d4a853;border-radius:20px;display:flex;align-items:center;justify-content:center;font-size:36px;margin-bottom:30px}
.cover h1{font-family:'Playfair Display',serif;font-size:52px;color:white;margin-bottom:12px;line-height:1.15}
.cover h1 span{color:#d4a853}
.cover .sub{font-size:18px;color:rgba(255,255,255,0.55);font-weight:300;letter-spacing:3px;text-transform:uppercase;margin-bottom:40px}
.cover .desc{max-width:640px;color:rgba(255,255,255,0.6);font-size:15px;line-height:1.8;margin-bottom:40px}
.cover .badge{display:inline-block;padding:10px 30px;border:1.5px solid #d4a853;color:#d4a853;border-radius:100px;font-size:13px;font-weight:600;letter-spacing:1.5px}
.cover .meta{color:rgba(255,255,255,0.3);font-size:12px;margin-top:40px}
.goldline{width:60px;height:3px;background:#d4a853;margin:0 auto 30px}

/* Content */
.content{padding:50px 56px}
.hdr{margin-bottom:28px;padding-bottom:18px;border-bottom:2px solid #f0f0f0}
.hdr .num{font-size:11px;color:#d4a853;font-weight:700;text-transform:uppercase;letter-spacing:3px;margin-bottom:6px}
.hdr h2{font-family:'Playfair Display',serif;font-size:32px;color:#1a2744;line-height:1.2}
.hdr p{color:#888;font-size:13px;margin-top:4px}

.ss{border-radius:10px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);margin:16px 0;border:1px solid #e5e7eb}
.ss img{width:100%;display:block}

.grid2{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:16px 0}
.card{background:#f8f9fa;border-radius:10px;padding:18px;border-left:4px solid #d4a853}
.card h4{font-size:14px;font-weight:700;color:#1a2744;margin-bottom:6px}
.card p{font-size:11.5px;color:#666;line-height:1.65}
.card .tag{display:inline-block;padding:2px 8px;background:#d4a853;color:white;border-radius:4px;font-size:9px;font-weight:700;margin-left:4px;vertical-align:middle}

.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:20px 0}
.stat{background:linear-gradient(135deg,#1a2744,#2a3f6a);color:white;border-radius:10px;padding:16px;text-align:center}
.stat .n{font-size:28px;font-weight:800;color:#d4a853}
.stat .l{font-size:10px;opacity:0.65;margin-top:3px}

.gold{background:linear-gradient(135deg,#d4a853,#b8882e);color:white;border-radius:10px;padding:18px;margin:16px 0}
.gold h4{font-size:15px;font-weight:700;margin-bottom:6px}
.gold p{font-size:12px;opacity:0.9;line-height:1.65}

.col2{display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start}

.check li{padding:5px 0;font-size:12px;color:#444;list-style:none;display:flex;align-items:start;gap:6px}
.check li::before{content:"✅";flex-shrink:0;font-size:11px}

.ft{position:absolute;bottom:16px;left:56px;right:56px;display:flex;justify-content:space-between;font-size:9px;color:#bbb;border-top:1px solid #f0f0f0;padding-top:8px}

.api{list-style:none;margin:12px 0}
.api li{padding:7px 10px;background:#f3f4f6;margin-bottom:5px;border-radius:6px;font-size:11px;font-family:'Courier New',monospace;color:#1a2744}
.api .m{display:inline-block;padding:2px 5px;border-radius:3px;font-weight:700;font-size:9px;margin-right:6px;color:white}
.api .get{background:#22c55e}.api .post{background:#3b82f6}.api .put{background:#f59e0b}

.tech{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:16px 0}
.tech-i{background:#f3f4f6;border-radius:8px;padding:12px;text-align:center}
.tech-i .ic{font-size:22px;margin-bottom:3px}
.tech-i .nm{font-size:11px;font-weight:600;color:#1a2744}
.tech-i .de{font-size:9px;color:#888}
</style>
</head>
<body>

<!-- COVER -->
<div class="page cover">
<div class="logo">⚖️</div>
<h1>Infinity <span>Legal</span> Platform</h1>
<div class="sub">Client Evaluation Report</div>
<div class="goldline"></div>
<p class="desc">A comprehensive review of the Infinity Legal Platform — South Africa's next-generation legal tech SaaS. This report covers all implemented features, portal modules, AI capabilities, and screenshots of every major system component.</p>
<div class="badge">15+ MODULES • AI-POWERED • POPIA COMPLIANT</div>
<div class="meta">March 2026 &nbsp;•&nbsp; Version 2.0 &nbsp;•&nbsp; Confidential</div>
</div>

<!-- TABLE OF CONTENTS -->
<div class="page content">
<div class="hdr"><div class="num">Contents</div><h2>Table of Contents</h2></div>
<div style="margin-top:30px;columns:2;column-gap:40px">
<div style="margin-bottom:20px"><span style="color:#d4a853;font-weight:700;font-size:13px">01.</span> <span style="font-size:14px;font-weight:600">Executive Summary</span><br><span style="font-size:11px;color:#888">Platform overview, key stats, competitive advantages</span></div>
<div style="margin-bottom:20px"><span style="color:#d4a853;font-weight:700;font-size:13px">02.</span> <span style="font-size:14px;font-weight:600">Public Website — Homepage</span><br><span style="font-size:11px;color:#888">Hero section, features, trust indicators</span></div>
<div style="margin-bottom:20px"><span style="color:#d4a853;font-weight:700;font-size:13px">03.</span> <span style="font-size:14px;font-weight:600">Pricing Plans</span><br><span style="font-size:11px;color:#888">Three-tier legal protection packages</span></div>
<div style="margin-bottom:20px"><span style="color:#d4a853;font-weight:700;font-size:13px">04.</span> <span style="font-size:14px;font-weight:600">Member Application</span><br><span style="font-size:11px;color:#888">Online join flow and plan selection</span></div>
<div style="margin-bottom:20px"><span style="color:#d4a853;font-weight:700;font-size:13px">05.</span> <span style="font-size:14px;font-weight:600">Staff Portal — Dashboard</span><br><span style="font-size:11px;color:#888">Real-time metrics and workspace</span></div>
<div style="margin-bottom:20px"><span style="color:#d4a853;font-weight:700;font-size:13px">06.</span> <span style="font-size:14px;font-weight:600">Case Management</span><br><span style="font-size:11px;color:#888">Full lifecycle with archiving</span></div>
<div style="margin-bottom:20px"><span style="color:#d4a853;font-weight:700;font-size:13px">07.</span> <span style="font-size:14px;font-weight:600">AI Intake & Conversion</span><br><span style="font-size:11px;color:#888">GPT-powered analysis with case creation</span></div>
<div style="margin-bottom:20px"><span style="color:#d4a853;font-weight:700;font-size:13px">08.</span> <span style="font-size:14px;font-weight:600">Leads Pipeline</span><br><span style="font-size:11px;color:#888">Full lead lifecycle and conversion</span></div>
<div style="margin-bottom:20px"><span style="color:#d4a853;font-weight:700;font-size:13px">09.</span> <span style="font-size:14px;font-weight:600">Document Management</span><br><span style="font-size:11px;color:#888">Version control, check-in/out, workflow</span></div>
<div style="margin-bottom:20px"><span style="color:#d4a853;font-weight:700;font-size:13px">10.</span> <span style="font-size:14px;font-weight:600">Tasks, Calendar & Knowledge</span><br><span style="font-size:11px;color:#888">Supporting workflow modules</span></div>
<div style="margin-bottom:20px"><span style="color:#d4a853;font-weight:700;font-size:13px">11.</span> <span style="font-size:14px;font-weight:600">Billing, HR & Reports</span><br><span style="font-size:11px;color:#888">Enterprise operations modules</span></div>
<div style="margin-bottom:20px"><span style="color:#d4a853;font-weight:700;font-size:13px">12.</span> <span style="font-size:14px;font-weight:600">Technical Architecture</span><br><span style="font-size:11px;color:#888">Tech stack, security, API summary</span></div>
<div style="margin-bottom:20px"><span style="color:#d4a853;font-weight:700;font-size:13px">13.</span> <span style="font-size:14px;font-weight:600">Roadmap & Next Steps</span><br><span style="font-size:11px;color:#888">Upcoming features and enhancements</span></div>
</div>
<div class="ft"><span>Infinity Legal (Pty) Ltd — Confidential</span><span>Page 2</span></div>
</div>

<!-- EXECUTIVE SUMMARY -->
<div class="page content">
<div class="hdr"><div class="num">Section 01</div><h2>Executive Summary</h2><p>Platform capabilities and competitive positioning</p></div>
<div class="stats">
<div class="stat"><div class="n">15+</div><div class="l">Portal Modules</div></div>
<div class="stat"><div class="n">6</div><div class="l">AI Features</div></div>
<div class="stat"><div class="n">50+</div><div class="l">API Endpoints</div></div>
<div class="stat"><div class="n">R95</div><div class="l">Starting Price/mo</div></div>
</div>
<div class="col2" style="margin-top:24px">
<div>
<h3 style="font-size:16px;margin-bottom:14px">Platform Modules</h3>
<ul class="check">
<li>Dashboard with real-time stats & quick actions</li>
<li>Case Management — full lifecycle with archiving</li>
<li>AI Intake — GPT-powered legal analysis & case creation</li>
<li>Document Versioning with check-in/out & approval workflow</li>
<li>Leads Pipeline with SLA tracking & conversion</li>
<li>Task Management linked to cases</li>
<li>Calendar with court date tracking</li>
<li>Internal Messaging system</li>
<li>Knowledge Base for legal research</li>
<li>HR Module & Staff Management</li>
<li>Billing & Time Tracking</li>
<li>Reports & Analytics</li>
<li>Role-Based Access Control (12+ roles)</li>
</ul>
</div>
<div>
<h3 style="font-size:16px;margin-bottom:14px">Competitive Advantages</h3>
<div class="card" style="margin-bottom:10px"><h4>🤖 AI-Powered Legal Intake</h4><p>GPT-4o analyses problems in real-time, categorises matters, suggests legislation & next steps. Auto-creates cases. No competitor offers this.</p></div>
<div class="card" style="margin-bottom:10px"><h4>📋 Document Version Control</h4><p>Full version history, check-in/out locking, 4-level approval workflow. Enterprise-grade document management.</p></div>
<div class="card" style="margin-bottom:10px"><h4>🗄️ Case Archiving</h4><p>Closed cases auto-archive after 30 days. Archived cases become read-only for compliance. Full audit trail preserved.</p></div>
<div class="card"><h4>🔐 POPIA Compliant</h4><p>End-to-end encryption, role-based access, audit logging, privilege protection. Built for SA legal requirements.</p></div>
</div>
</div>
<div class="ft"><span>Infinity Legal (Pty) Ltd — Confidential</span><span>Page 3</span></div>
</div>

<!-- HOMEPAGE -->
<div class="page content">
<div class="hdr"><div class="num">Section 02</div><h2>Public Website — Homepage</h2><p>Consumer-facing legal protection marketplace</p></div>
<div class="ss"><img src="${ss.homepage}" alt="Homepage" /></div>
<div class="grid2">
<div class="card"><h4>Hero Section</h4><p>"Legal Protection That Fights For You" — clear value proposition with R95/month pricing. AI-powered help, POPIA compliant badges. Trust stats: 500+ attorneys, &lt;5min response, 95% satisfaction.</p></div>
<div class="card"><h4>Navigation & CTAs</h4><p>Legal Policies, AI Legal Help, Legal Resources, Contact Us. Dual CTAs: "Join Infinity Legal" and "Free AI Intake". Member Login for portal access.</p></div>
</div>
<div class="ft"><span>Infinity Legal (Pty) Ltd — Confidential</span><span>Page 4</span></div>
</div>

<!-- HOMEPAGE FEATURES -->
<div class="page content">
<div class="hdr"><div class="num">Section 02 (cont.)</div><h2>Homepage — Features & Trust</h2><p>Below-the-fold content showcasing platform capabilities</p></div>
<div class="ss"><img src="${ss.features}" alt="Features" /></div>
<div class="gold"><h4>Designed to Outclass Scorpion.biz</h4><p>The public website follows the Scorpion.biz model for legal protection plans but adds AI capabilities, modern design, and POPIA compliance that competitors lack. Exclusively focused on Legal Protection — no funeral plans, no distracting products.</p></div>
<div class="ft"><span>Infinity Legal (Pty) Ltd — Confidential</span><span>Page 5</span></div>
</div>

<!-- PRICING -->
<div class="page content">
<div class="hdr"><div class="num">Section 03</div><h2>Pricing Plans</h2><p>Three-tier legal protection: Labour Shield, Civil Guard, Complete Cover</p></div>
<div class="ss"><img src="${ss.pricing}" alt="Pricing" /></div>
<div class="grid2" style="margin-top:16px">
<div class="card"><h4>Labour Shield — R95/mo</h4><p>Employment matters coverage up to R72,300. CCMA representation, disciplinary hearings, retrenchment advice. Perfect for workers needing labour protection.</p></div>
<div class="card"><h4>Civil Guard — R150/mo <span class="tag">POPULAR</span></h4><p>Civil matters coverage up to R78,500. Consumer disputes, debt recovery, property matters, contractual disputes. Best value for comprehensive protection.</p></div>
</div>
<div class="ft"><span>Infinity Legal (Pty) Ltd — Confidential</span><span>Page 6</span></div>
</div>

<!-- APPLY -->
<div class="page content">
<div class="hdr"><div class="num">Section 04</div><h2>Member Application</h2><p>Online join flow with plan selection and personal details</p></div>
<div class="ss"><img src="${ss.apply}" alt="Apply" /></div>
<div class="grid2" style="margin-top:16px">
<div class="card"><h4>Plan Selection</h4><p>Users select their preferred legal protection plan. Clear pricing displayed with coverage details. Seamless transition from pricing page.</p></div>
<div class="card"><h4>Application Form</h4><p>Full name, email, phone, ID number, address. Terms acceptance. Secure submission. Account created automatically after signup.</p></div>
</div>
<div class="ft"><span>Infinity Legal (Pty) Ltd — Confidential</span><span>Page 7</span></div>
</div>

<!-- DASHBOARD -->
<div class="page content">
<div class="hdr"><div class="num">Section 05</div><h2>Staff Portal — Dashboard</h2><p>Personalized workspace with real-time metrics and quick actions</p></div>
<div class="ss"><img src="${ss.dashboard}" alt="Dashboard" /></div>
<div class="grid2" style="margin-top:16px">
<div class="card"><h4>At-a-Glance Metrics</h4><p>Active Cases, Pending Tasks, Court Dates Today, Notifications. Role-aware greeting with department info. Recent cases with clickable status badges.</p></div>
<div class="card"><h4>Quick Actions</h4><p>New Case, Documents, Approvals, AI Research — one-click access. Company info panel with managing director details. Full sidebar navigation to all 15+ modules.</p></div>
</div>
<div class="ft"><span>Infinity Legal (Pty) Ltd — Confidential</span><span>Page 8</span></div>
</div>

<!-- CASES -->
<div class="page content">
<div class="hdr"><div class="num">Section 06</div><h2>Case Management</h2><p>Full lifecycle: New → Active → Court → Settlement → Closed → Archived</p></div>
<div class="ss"><img src="${ss.cases}" alt="Cases" /></div>
<div class="grid2" style="margin-top:16px">
<div class="card"><h4>Case Workspace</h4><p>Tabbed interface: Timeline, Notes, Tasks, Messages, Billing, Details. Search & filter by status, type, number. Matter numbering: IL-2026-XXXX format.</p></div>
<div class="card"><h4>🗄️ Case Archiving <span class="tag">NEW</span></h4><p>Closed cases can be archived to read-only. Auto-archive for cases closed &gt;30 days. Archived tab in filter. Full audit trail with timeline entries preserved.</p></div>
</div>
<div class="gold"><h4>Prescription Period Tracking</h4><p>SA prescription periods auto-calculated: CCMA 6mo, Unfair Dismissal 12mo, General 3yr, Property 30yr. Visual urgency badges warn when deadlines approach.</p></div>
<div class="ft"><span>Infinity Legal (Pty) Ltd — Confidential</span><span>Page 9</span></div>
</div>

<!-- AI INTAKES -->
<div class="page content">
<div class="hdr"><div class="num">Section 07</div><h2>AI Intake & Case Conversion</h2><p>GPT-4o powered legal analysis with one-click case creation</p></div>
<div class="ss"><img src="${ss.intakes}" alt="AI Intakes" /></div>
<div class="grid2" style="margin-top:16px">
<div class="card"><h4>🤖 AI Legal Analysis <span class="tag">NEW</span></h4><p>Client describes problem → AI categorizes (Labour, Criminal, Family, etc.), identifies urgency, suggests next steps, relevant SA legislation, cost estimates, and timeline.</p></div>
<div class="card"><h4>Convert to Case <span class="tag">NEW</span></h4><p>Attorneys review AI analysis and convert intakes to active cases with one click. AI analysis auto-saved as case note. Duplicate protection prevents double conversion.</p></div>
</div>
<div class="ft"><span>Infinity Legal (Pty) Ltd — Confidential</span><span>Page 10</span></div>
</div>

<!-- INTAKES DETAIL -->
<div class="page content">
<div class="hdr"><div class="num">Section 07 (cont.)</div><h2>AI Intake — Detail View</h2><p>Expanded view showing client problem and AI analysis side by side</p></div>
<div class="ss"><img src="${ss.intakesDetail}" alt="Intake Detail" /></div>
<div class="grid2" style="margin-top:16px">
<div class="card"><h4>Client's Problem</h4><p>Original description, timeline, desired outcome, involved parties, and documents — exactly as submitted by the client through the public AI intake form.</p></div>
<div class="card"><h4>AI Analysis Panel</h4><p>Recommended next steps (numbered), relevant SA legislation with section references, warnings about time limits or evidence preservation, cost and timeline estimates.</p></div>
</div>
<div class="ft"><span>Infinity Legal (Pty) Ltd — Confidential</span><span>Page 11</span></div>
</div>

<!-- LEADS -->
<div class="page content">
<div class="hdr"><div class="num">Section 08</div><h2>Leads Pipeline</h2><p>Full lead lifecycle: New → Contacted → Qualified → Converted → Lost</p></div>
<div class="ss"><img src="${ss.leads}" alt="Leads Pipeline" /></div>
<div class="ss" style="margin-top:12px"><img src="${ss.leadsForm}" alt="New Lead Form" /></div>
<div class="grid2" style="margin-top:16px">
<div class="card"><h4>Lead Management</h4><p>Create leads from web, referrals, walk-ins, phone calls. Track urgency (Emergency/High/Medium/Low), case type, source. Status filters and search.</p></div>
<div class="card"><h4>Pipeline Workflow</h4><p>Qualify → Assign Paralegal (24hr SLA) → Strategy Review → Assign Officer (48hr SLA) → Convert to Case. Notifications at every stage.</p></div>
</div>
<div class="ft"><span>Infinity Legal (Pty) Ltd — Confidential</span><span>Page 12</span></div>
</div>

<!-- DOCUMENTS -->
<div class="page content">
<div class="hdr"><div class="num">Section 09</div><h2>Document Management & Versioning</h2><p>Enterprise-grade document workflow with version control</p></div>
<div class="ss"><img src="${ss.documents}" alt="Documents" /></div>
<div class="grid2" style="margin-top:16px">
<div class="card"><h4>📋 Version History <span class="tag">NEW</span></h4><p>Full version tracking for every document. Upload new versions with change notes. Version history modal with timestamps and author attribution. Latest version highlighted.</p></div>
<div class="card"><h4>🔒 Check-in / Check-out <span class="tag">NEW</span></h4><p>Lock documents while editing to prevent conflicts. 4-hour auto-expiry. Only lock holder can upload new versions. Visual lock status indicators.</p></div>
<div class="card"><h4>📄 Workflow Approval</h4><p>Draft → Review → Approved → Signed. Only Legal Officers can approve and sign. Paralegal UPL protection enforced automatically.</p></div>
<div class="card"><h4>🤖 AI Document Assistant</h4><p>AI-powered document review, drafting suggestions, and legal research. Templates for common SA legal documents (contracts, pleadings, notices).</p></div>
</div>
<div class="ft"><span>Infinity Legal (Pty) Ltd — Confidential</span><span>Page 13</span></div>
</div>

<!-- TASKS CALENDAR KNOWLEDGE -->
<div class="page content">
<div class="hdr"><div class="num">Section 10</div><h2>Tasks, Calendar & Knowledge Base</h2><p>Supporting workflow modules for daily operations</p></div>
<div class="col2">
<div><h3 style="font-size:14px;margin-bottom:10px">📋 Task Management</h3><div class="ss"><img src="${ss.tasks}" alt="Tasks" /></div><p style="font-size:11px;color:#666;margin-top:8px">Create, assign, and track tasks linked to cases. Priority levels, due dates, status tracking. Filter by status or assignee.</p></div>
<div><h3 style="font-size:14px;margin-bottom:10px">📅 Calendar</h3><div class="ss"><img src="${ss.calendar}" alt="Calendar" /></div><p style="font-size:11px;color:#666;margin-top:8px">Court dates, deadlines, meetings. Visual calendar with day/week/month views. Colour-coded by event type. Auto-syncs with case dates.</p></div>
</div>
<div style="margin-top:20px"><h3 style="font-size:14px;margin-bottom:10px">📚 Knowledge Base</h3><div class="ss"><img src="${ss.knowledge}" alt="Knowledge Base" /></div></div>
<div class="ft"><span>Infinity Legal (Pty) Ltd — Confidential</span><span>Page 14</span></div>
</div>

<!-- BILLING HR REPORTS -->
<div class="page content">
<div class="hdr"><div class="num">Section 11</div><h2>Billing, HR & Reports</h2><p>Enterprise operations modules</p></div>
<div class="col2">
<div><h3 style="font-size:14px;margin-bottom:10px">💰 Billing & Time Tracking</h3><div class="ss"><img src="${ss.billing}" alt="Billing" /></div><p style="font-size:11px;color:#666;margin-top:8px">Time entries, billing rates, invoice generation. Track billable hours per case. Client billing summaries.</p></div>
<div><h3 style="font-size:14px;margin-bottom:10px">👥 HR Management</h3><div class="ss"><img src="${ss.hr}" alt="HR" /></div><p style="font-size:11px;color:#666;margin-top:8px">Staff directory, role management, department organisation. Leave tracking and staff performance metrics.</p></div>
</div>
<div class="col2" style="margin-top:20px">
<div><h3 style="font-size:14px;margin-bottom:10px">📊 Reports & Analytics</h3><div class="ss"><img src="${ss.reports}" alt="Reports" /></div><p style="font-size:11px;color:#666;margin-top:8px">Case analytics, revenue tracking, performance dashboards. Export capabilities for management review.</p></div>
<div><h3 style="font-size:14px;margin-bottom:10px">⚙️ Settings</h3><div class="ss"><img src="${ss.settings}" alt="Settings" /></div><p style="font-size:11px;color:#666;margin-top:8px">Profile management, notification preferences, security settings. Two-factor authentication support.</p></div>
</div>
<div class="ft"><span>Infinity Legal (Pty) Ltd — Confidential</span><span>Page 15</span></div>
</div>

<!-- TECH ARCHITECTURE -->
<div class="page content">
<div class="hdr"><div class="num">Section 12</div><h2>Technical Architecture</h2><p>Modern, scalable, production-ready technology stack</p></div>
<div class="tech">
<div class="tech-i"><div class="ic">⚛️</div><div class="nm">Next.js 14</div><div class="de">App Router, SSR, API Routes</div></div>
<div class="tech-i"><div class="ic">🍃</div><div class="nm">MongoDB</div><div class="de">Documents, Leads, Intakes, Versions</div></div>
<div class="tech-i"><div class="ic">🔐</div><div class="nm">Supabase</div><div class="de">Auth, Users, Cases, RLS</div></div>
<div class="tech-i"><div class="ic">🤖</div><div class="nm">GPT-4o</div><div class="de">Legal Analysis, Document Assist</div></div>
<div class="tech-i"><div class="ic">🎨</div><div class="nm">Tailwind CSS</div><div class="de">Responsive, Dark Mode Ready</div></div>
<div class="tech-i"><div class="ic">🔑</div><div class="nm">RBAC System</div><div class="de">12+ Roles, 30+ Permissions</div></div>
</div>
<div class="grid2" style="margin-top:16px">
<div class="card"><h4>Security & Compliance</h4><p>POPIA compliant data handling. Role-based access control with 12+ roles. Audit logging for every action. Middleware-enforced authentication. Encrypted data at rest and in transit.</p></div>
<div class="card"><h4>Production Readiness</h4><p>Health check API. SEO optimised (sitemap.xml, robots.txt, JSON-LD). Analytics tracking. Custom 404 page. Cookie consent. Responsive design for mobile & desktop.</p></div>
</div>
<div style="margin-top:20px">
<h3 style="font-size:14px;margin-bottom:10px">Key API Endpoints (50+)</h3>
<ul class="api">
<li><span class="m post">POST</span>/api/intake/analyze — AI legal analysis</li>
<li><span class="m get">GET</span>/api/intakes — List AI intake submissions</li>
<li><span class="m post">POST</span>/api/intakes/{id}/convert — Convert intake to case</li>
<li><span class="m get">GET</span>/api/leads — Leads pipeline</li>
<li><span class="m post">POST</span>/api/documents/{id}/versions — Document versioning</li>
<li><span class="m post">POST</span>/api/documents/{id}/lock — Check-in/out</li>
<li><span class="m post">POST</span>/api/cases/archive — Case archiving</li>
<li><span class="m get">GET</span>/api/health — System health check</li>
</ul>
</div>
<div class="ft"><span>Infinity Legal (Pty) Ltd — Confidential</span><span>Page 16</span></div>
</div>

<!-- ROADMAP -->
<div class="page content" style="background:linear-gradient(180deg,white 0%,#f8f9fa 100%)">
<div class="hdr"><div class="num">Section 13</div><h2>Roadmap & Next Steps</h2><p>Current release highlights and upcoming features</p></div>
<div class="grid2" style="margin-top:20px">
<div class="card" style="border-left-color:#22c55e"><h4>✅ Delivered (Current Release)</h4><p>
• AI Intake → Case conversion with GPT-4o<br>
• Document versioning & check-in/out<br>
• Leads pipeline with full lifecycle<br>
• Case archiving (read-only mode)<br>
• 15+ portal modules fully functional<br>
• Scorpion.biz competitive redesign<br>
• RBAC with 12+ granular roles<br>
• Production readiness (health, SEO, analytics)<br>
• POPIA compliant architecture
</p></div>
<div class="card" style="border-left-color:#3b82f6"><h4>🔵 Upcoming Features</h4><p>
• PayFast payment integration<br>
• Client self-service portal<br>
• Advanced reporting & analytics dashboard<br>
• Email/SMS notification integration (SendGrid/Twilio)<br>
• Mobile responsive portal enhancements<br>
• Multi-language support (ZA official languages)<br>
• E-signature integration<br>
• Automated billing & invoicing<br>
• Client feedback system
</p></div>
</div>
<div style="text-align:center;margin-top:50px;padding:40px">
<div style="font-size:44px;margin-bottom:16px">⚖️</div>
<h3 style="font-family:'Playfair Display',serif;font-size:28px;color:#1a2744;margin-bottom:6px">Infinity Legal (Pty) Ltd</h3>
<p style="color:#888;font-size:13px">Block A, Eco Fusion 5, 1004 Witch-Hazel Avenue</p>
<p style="color:#888;font-size:13px">Highveld Technopark, Centurion, South Africa</p>
<div style="width:40px;height:2px;background:#d4a853;margin:16px auto"></div>
<p style="color:#d4a853;font-size:13px;font-weight:600">info@infinitylegal.co.za</p>
<p style="color:#999;font-size:11px;margin-top:16px">Managing Director: Tidimalo Tsatsi</p>
<p style="color:#ccc;font-size:10px;margin-top:20px">This document is confidential and intended solely for evaluation purposes.</p>
</div>
<div class="ft"><span>Infinity Legal (Pty) Ltd — Confidential</span><span>Page 17</span></div>
</div>

</body>
</html>`;

fs.writeFileSync('/app/public/client-presentation.html', html);
console.log('HTML written');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('file:///app/public/client-presentation.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);
  await page.pdf({
    path: '/app/public/Infinity_Legal_Client_Evaluation.pdf',
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });
  const sz = fs.statSync('/app/public/Infinity_Legal_Client_Evaluation.pdf').size;
  console.log(`PDF: ${Math.round(sz/1024)}KB (${Math.round(sz/1024/1024*10)/10}MB)`);
  await browser.close();
})();
