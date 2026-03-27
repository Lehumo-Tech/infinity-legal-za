const { chromium } = require('/usr/lib/node_modules/@playwright/test/node_modules/playwright');
const fs = require('fs');
const path = require('path');

function imgToBase64(imgPath) {
  if (!fs.existsSync(imgPath)) return '';
  const data = fs.readFileSync(imgPath);
  return `data:image/png;base64,${data.toString('base64')}`;
}

const screenshots = {
  homepage: imgToBase64('/app/public/screenshots/01_homepage.png'),
  pricing: imgToBase64('/app/public/screenshots/02_pricing.png'),
  dashboard: imgToBase64('/app/public/screenshots/03_dashboard.png'),
  cases: imgToBase64('/app/public/screenshots/04_cases.png'),
  intakes: imgToBase64('/app/public/screenshots/05_intakes.png'),
  leads: imgToBase64('/app/public/screenshots/06_leads.png'),
  documents: imgToBase64('/app/public/screenshots/07_documents.png'),
  tasks: imgToBase64('/app/public/screenshots/08_tasks.png'),
  calendar: imgToBase64('/app/public/screenshots/09_calendar.png'),
  knowledge: imgToBase64('/app/public/screenshots/10_knowledge.png'),
};

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Infinity Legal Platform — Comprehensive Presentation</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@600;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; color: #1a2744; background: white; }
  .page { width: 100%; min-height: 100vh; page-break-after: always; position: relative; overflow: hidden; }
  .page:last-child { page-break-after: avoid; }
  
  /* Title Page */
  .title-page { background: linear-gradient(135deg, #1a2744 0%, #0f1a2e 50%, #1a2744 100%); display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 60px; }
  .title-page h1 { font-family: 'Playfair Display', serif; font-size: 52px; color: #d4a853; margin-bottom: 16px; line-height: 1.2; }
  .title-page h2 { font-size: 22px; color: rgba(255,255,255,0.7); font-weight: 300; margin-bottom: 40px; letter-spacing: 2px; }
  .title-page .meta { color: rgba(255,255,255,0.4); font-size: 14px; margin-top: 30px; }
  .title-page .badge { display: inline-block; padding: 8px 24px; border: 1px solid #d4a853; color: #d4a853; border-radius: 100px; font-size: 13px; font-weight: 600; margin-top: 20px; letter-spacing: 1px; }
  .gold-line { width: 80px; height: 3px; background: #d4a853; margin: 30px auto; }
  
  /* Content Pages */
  .content-page { padding: 50px 60px; }
  .page-header { margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #f0f0f0; }
  .page-header .section-num { font-size: 12px; color: #d4a853; font-weight: 700; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 8px; }
  .page-header h2 { font-family: 'Playfair Display', serif; font-size: 34px; color: #1a2744; }
  .page-header p { color: #666; font-size: 14px; margin-top: 6px; }
  
  .screenshot-container { border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin: 20px 0; border: 1px solid #e5e7eb; }
  .screenshot-container img { width: 100%; display: block; }
  
  .feature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
  .feature-card { background: #f8f9fa; border-radius: 12px; padding: 20px; border-left: 4px solid #d4a853; }
  .feature-card h4 { font-size: 15px; font-weight: 700; color: #1a2744; margin-bottom: 8px; }
  .feature-card p { font-size: 12px; color: #666; line-height: 1.6; }
  .feature-card .tag { display: inline-block; padding: 2px 8px; background: #d4a853; color: white; border-radius: 4px; font-size: 10px; font-weight: 600; margin-right: 4px; }
  
  .stats-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 24px 0; }
  .stat-item { background: linear-gradient(135deg, #1a2744, #2a3f6a); color: white; border-radius: 12px; padding: 16px; text-align: center; }
  .stat-item .num { font-size: 28px; font-weight: 800; color: #d4a853; }
  .stat-item .label { font-size: 11px; opacity: 0.7; margin-top: 4px; }
  
  .highlight-box { background: linear-gradient(135deg, #d4a853, #c49a3d); color: white; border-radius: 12px; padding: 20px; margin: 20px 0; }
  .highlight-box h4 { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
  .highlight-box p { font-size: 13px; opacity: 0.9; line-height: 1.6; }
  
  .api-list { list-style: none; margin: 16px 0; }
  .api-list li { padding: 8px 12px; background: #f3f4f6; margin-bottom: 6px; border-radius: 6px; font-size: 12px; font-family: 'Courier New', monospace; color: #1a2744; }
  .api-list li .method { display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 10px; margin-right: 8px; color: white; }
  .api-list li .get { background: #22c55e; }
  .api-list li .post { background: #3b82f6; }
  .api-list li .put { background: #f59e0b; }
  
  .footer { position: absolute; bottom: 20px; left: 60px; right: 60px; display: flex; justify-content: space-between; font-size: 10px; color: #aaa; border-top: 1px solid #f0f0f0; padding-top: 10px; }
  
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; align-items: start; }
  
  .check-list { list-style: none; margin: 16px 0; }
  .check-list li { padding: 6px 0; font-size: 13px; color: #444; display: flex; align-items: start; gap: 8px; }
  .check-list li::before { content: "✅"; flex-shrink: 0; }
  
  .tech-stack { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 16px 0; }
  .tech-item { background: #f3f4f6; border-radius: 8px; padding: 12px; text-align: center; }
  .tech-item .icon { font-size: 24px; margin-bottom: 4px; }
  .tech-item .name { font-size: 12px; font-weight: 600; color: #1a2744; }
</style>
</head>
<body>

<!-- PAGE 1: Title -->
<div class="page title-page">
  <div style="font-size: 40px; margin-bottom: 20px;">⚖️</div>
  <h1>Infinity Legal Platform</h1>
  <h2>COMPREHENSIVE PLATFORM PRESENTATION</h2>
  <div class="gold-line"></div>
  <p style="color: rgba(255,255,255,0.6); font-size: 16px; max-width: 600px; line-height: 1.7;">
    A next-generation legal tech SaaS platform for the South African market — featuring AI-powered intake, 
    case management, document versioning, leads pipeline, and enterprise-grade compliance.
  </p>
  <div class="badge">SOUTH AFRICA • POPIA COMPLIANT • AI-POWERED</div>
  <div class="meta">March 2026 • Version 2.0 • Confidential</div>
</div>

<!-- PAGE 2: Executive Summary -->
<div class="page content-page">
  <div class="page-header">
    <div class="section-num">Section 01</div>
    <h2>Executive Summary</h2>
    <p>Platform capabilities, market positioning, and key differentiators</p>
  </div>
  
  <div class="stats-bar">
    <div class="stat-item"><div class="num">15+</div><div class="label">Portal Modules</div></div>
    <div class="stat-item"><div class="num">6</div><div class="label">AI Features</div></div>
    <div class="stat-item"><div class="num">50+</div><div class="label">API Endpoints</div></div>
    <div class="stat-item"><div class="num">R95</div><div class="label">Starting Price/mo</div></div>
  </div>
  
  <div class="two-col" style="margin-top: 30px;">
    <div>
      <h3 style="font-size: 18px; margin-bottom: 16px; color: #1a2744;">Platform Modules</h3>
      <ul class="check-list">
        <li>Dashboard with real-time stats, cases, notifications</li>
        <li>Case Management with full lifecycle tracking</li>
        <li>AI Intake — GPT-powered legal analysis & case creation</li>
        <li>Document Versioning with check-in/out & workflow</li>
        <li>Leads Pipeline with qualification & conversion</li>
        <li>Task Management linked to cases</li>
        <li>Calendar with court date tracking</li>
        <li>Messaging (internal & client)</li>
        <li>Knowledge Base for legal research</li>
        <li>HR Module & Staff Management</li>
        <li>Billing & Time Tracking</li>
        <li>Case Archiving for compliance</li>
        <li>RBAC with 12+ granular roles</li>
      </ul>
    </div>
    <div>
      <h3 style="font-size: 18px; margin-bottom: 16px; color: #1a2744;">Competitive Advantages vs Scorpion.biz</h3>
      <div class="feature-card" style="margin-bottom: 12px;">
        <h4>🤖 AI-Powered Legal Intake</h4>
        <p>GPT-4o analyses client problems in real-time, categorises legal matters, suggests next steps, and auto-generates cases. Scorpion has no AI capabilities.</p>
      </div>
      <div class="feature-card" style="margin-bottom: 12px;">
        <h4>📋 Document Version Control</h4>
        <p>Full version history, check-in/out locking, and workflow approval (Draft → Review → Approved → Signed). Enterprise-grade document management.</p>
      </div>
      <div class="feature-card" style="margin-bottom: 12px;">
        <h4>🔐 POPIA Compliant by Design</h4>
        <p>End-to-end encryption, role-based access, audit logging, and privilege protection built into every module.</p>
      </div>
    </div>
  </div>
  <div class="footer"><span>Infinity Legal (Pty) Ltd</span><span>Page 2</span></div>
</div>

<!-- PAGE 3: Public Website -->
<div class="page content-page">
  <div class="page-header">
    <div class="section-num">Section 02</div>
    <h2>Public Website</h2>
    <p>Consumer-facing legal protection marketplace modeled after Scorpion.biz</p>
  </div>
  
  <div class="screenshot-container">
    <img src="${screenshots.homepage}" alt="Homepage" />
  </div>
  
  <div class="feature-grid" style="margin-top: 20px;">
    <div class="feature-card">
      <h4>Hero Section</h4>
      <p>"Legal Protection That Fights For You" — AI-powered legal help, POPIA compliant, from R95/month. Stats: 500+ attorneys, <5min response, 95% satisfaction, 24/7 help line.</p>
    </div>
    <div class="feature-card">
      <h4>Navigation</h4>
      <p>Legal Policies, AI Legal Help, Legal Resources, Contact Us, Member Login, Join Now. Clean, accessible, mobile-responsive design.</p>
    </div>
  </div>
  <div class="footer"><span>Infinity Legal (Pty) Ltd</span><span>Page 3</span></div>
</div>

<!-- PAGE 4: Pricing -->
<div class="page content-page">
  <div class="page-header">
    <div class="section-num">Section 03</div>
    <h2>Pricing Plans</h2>
    <p>Three-tier legal protection: Labour Shield, Civil Guard, Complete Cover</p>
  </div>
  
  <div class="screenshot-container">
    <img src="${screenshots.pricing}" alt="Pricing" />
  </div>
  
  <div class="feature-grid" style="margin-top: 20px;">
    <div class="feature-card">
      <h4>Labour Shield — R95/mo</h4>
      <p>Employment matters coverage up to R72,300. CCMA representation, disciplinary hearings, retrenchment advice.</p>
    </div>
    <div class="feature-card">
      <h4>Civil Guard — R150/mo <span class="tag">MOST POPULAR</span></h4>
      <p>Civil matters coverage up to R78,500. Consumer disputes, debt recovery, property matters, contractual disputes.</p>
    </div>
  </div>
  <div class="footer"><span>Infinity Legal (Pty) Ltd</span><span>Page 4</span></div>
</div>

<!-- PAGE 5: Portal Dashboard -->
<div class="page content-page">
  <div class="page-header">
    <div class="section-num">Section 04</div>
    <h2>Staff Portal — Dashboard</h2>
    <p>Personalized workspace with real-time metrics and quick actions</p>
  </div>
  
  <div class="screenshot-container">
    <img src="${screenshots.dashboard}" alt="Dashboard" />
  </div>
  
  <div class="feature-grid" style="margin-top: 20px;">
    <div class="feature-card">
      <h4>At-a-Glance Metrics</h4>
      <p>Active Cases, Pending Tasks, Court Dates Today, Notifications. Role-aware greeting with department info. Recent cases with status badges.</p>
    </div>
    <div class="feature-card">
      <h4>Quick Actions</h4>
      <p>New Case, Documents, Approvals, AI Research — one-click access to the most common workflows. Company info panel with MD details.</p>
    </div>
  </div>
  <div class="footer"><span>Infinity Legal (Pty) Ltd</span><span>Page 5</span></div>
</div>

<!-- PAGE 6: Case Management -->
<div class="page content-page">
  <div class="page-header">
    <div class="section-num">Section 05</div>
    <h2>Case Management</h2>
    <p>Full lifecycle: New → Active → Court → Settlement → Closed → Archived</p>
  </div>
  
  <div class="screenshot-container">
    <img src="${screenshots.cases}" alt="Cases" />
  </div>
  
  <div class="feature-grid" style="margin-top: 20px;">
    <div class="feature-card">
      <h4>Case Workspace Tabs</h4>
      <p>Timeline, Notes, Tasks, Messages, Billing, Details — complete case management in a single view. Search and filter by status, type, case number.</p>
    </div>
    <div class="feature-card">
      <h4>🗄️ Case Archiving (NEW)</h4>
      <p>Closed cases can be archived for compliance. Archived cases become read-only. Auto-archive for cases closed >30 days. Full audit trail preserved.</p>
    </div>
  </div>
  
  <div class="highlight-box">
    <h4>Prescription Period Tracking</h4>
    <p>South African prescription periods are auto-calculated (CCMA 6mo, Unfair Dismissal 12mo, General 3yr, Property 30yr). Visual badges warn when deadlines approach.</p>
  </div>
  <div class="footer"><span>Infinity Legal (Pty) Ltd</span><span>Page 6</span></div>
</div>

<!-- PAGE 7: AI Intakes -->
<div class="page content-page">
  <div class="page-header">
    <div class="section-num">Section 06</div>
    <h2>AI Intake → Case Conversion</h2>
    <p>GPT-4o powered legal analysis with one-click conversion to active cases</p>
  </div>
  
  <div class="screenshot-container">
    <img src="${screenshots.intakes}" alt="AI Intakes" />
  </div>
  
  <div class="feature-grid" style="margin-top: 20px;">
    <div class="feature-card">
      <h4>🤖 AI Legal Analysis</h4>
      <p>Client describes their problem → AI categorizes (Labour, Criminal, Family, etc.), identifies urgency, suggests next steps, relevant legislation, cost estimates, and timeline.</p>
    </div>
    <div class="feature-card">
      <h4>Convert to Case</h4>
      <p>Attorneys review AI analysis and convert intakes to active cases with one click. AI analysis is saved as a case note. Duplicate protection prevents double conversion.</p>
    </div>
  </div>
  
  <ul class="api-list">
    <li><span class="method post">POST</span>/api/intake/analyze — AI analyzes legal problem (saves to MongoDB)</li>
    <li><span class="method get">GET</span>/api/intakes — List submissions with status/category/search filters</li>
    <li><span class="method post">POST</span>/api/intakes/{id}/convert — Convert intake to case (Supabase + MongoDB)</li>
  </ul>
  <div class="footer"><span>Infinity Legal (Pty) Ltd</span><span>Page 7</span></div>
</div>

<!-- PAGE 8: Leads Pipeline -->
<div class="page content-page">
  <div class="page-header">
    <div class="section-num">Section 07</div>
    <h2>Leads Pipeline</h2>
    <p>Full lead lifecycle: New → Contacted → Qualified → Converted → Lost</p>
  </div>
  
  <div class="screenshot-container">
    <img src="${screenshots.leads}" alt="Leads Pipeline" />
  </div>
  
  <div class="feature-grid" style="margin-top: 20px;">
    <div class="feature-card">
      <h4>Lead Management</h4>
      <p>Create leads from web inquiries, referrals, walk-ins, or phone calls. Track urgency (Emergency → Low), case type, and source. Full CRUD with MongoDB backing.</p>
    </div>
    <div class="feature-card">
      <h4>Pipeline Workflow</h4>
      <p>Qualify → Assign to Paralegal (24hr SLA) → Ready for Strategy → Assign to Officer (48hr SLA) → Convert to Case. Notifications at each stage.</p>
    </div>
  </div>
  
  <ul class="api-list">
    <li><span class="method get">GET</span>/api/leads — List leads with status/search filters</li>
    <li><span class="method post">POST</span>/api/leads — Create new lead (name, email, phone, source, type, urgency)</li>
    <li><span class="method put">PUT</span>/api/leads — Update lead (qualify, contact, assign, convert, lost)</li>
  </ul>
  <div class="footer"><span>Infinity Legal (Pty) Ltd</span><span>Page 8</span></div>
</div>

<!-- PAGE 9: Document Management -->
<div class="page content-page">
  <div class="page-header">
    <div class="section-num">Section 08</div>
    <h2>Document Management & Versioning</h2>
    <p>Enterprise-grade document workflow with version control and check-in/out</p>
  </div>
  
  <div class="screenshot-container">
    <img src="${screenshots.documents}" alt="Documents" />
  </div>
  
  <div class="feature-grid" style="margin-top: 20px;">
    <div class="feature-card">
      <h4>📋 Version History (NEW)</h4>
      <p>Full version tracking for every document. Upload new versions with change notes. View complete history with timestamps and author attribution.</p>
    </div>
    <div class="feature-card">
      <h4>🔒 Check-in / Check-out (NEW)</h4>
      <p>Lock documents while editing to prevent conflicts. 4-hour auto-expiry. Only the lock holder can upload new versions. Prevents overwrite conflicts.</p>
    </div>
    <div class="feature-card">
      <h4>📄 Workflow Approval</h4>
      <p>Draft → Review → Approved → Signed. Only Legal Officers can approve and sign. Paralegal UPL protection enforced.</p>
    </div>
    <div class="feature-card">
      <h4>🤖 AI Document Assistant</h4>
      <p>AI-powered document review, drafting suggestions, and legal research. Built-in templates for common SA legal documents.</p>
    </div>
  </div>
  
  <ul class="api-list">
    <li><span class="method get">GET</span>/api/documents/{id}/versions — Get version history</li>
    <li><span class="method post">POST</span>/api/documents/{id}/versions — Upload new version</li>
    <li><span class="method get">GET</span>/api/documents/{id}/lock — Check lock status</li>
    <li><span class="method post">POST</span>/api/documents/{id}/lock — Check out / Check in</li>
    <li><span class="method put">PUT</span>/api/documents/{id}/workflow — Transition workflow status</li>
  </ul>
  <div class="footer"><span>Infinity Legal (Pty) Ltd</span><span>Page 9</span></div>
</div>

<!-- PAGE 10: Additional Modules -->
<div class="page content-page">
  <div class="page-header">
    <div class="section-num">Section 09</div>
    <h2>Additional Modules</h2>
    <p>Tasks, Calendar, Knowledge Base — supporting the complete legal workflow</p>
  </div>
  
  <div class="two-col">
    <div>
      <h3 style="font-size: 16px; margin-bottom: 12px;">📋 Tasks</h3>
      <div class="screenshot-container">
        <img src="${screenshots.tasks}" alt="Tasks" />
      </div>
    </div>
    <div>
      <h3 style="font-size: 16px; margin-bottom: 12px;">📅 Calendar</h3>
      <div class="screenshot-container">
        <img src="${screenshots.calendar}" alt="Calendar" />
      </div>
    </div>
  </div>
  
  <div style="margin-top: 24px;">
    <h3 style="font-size: 16px; margin-bottom: 12px;">📚 Knowledge Base</h3>
    <div class="screenshot-container">
      <img src="${screenshots.knowledge}" alt="Knowledge Base" />
    </div>
  </div>
  <div class="footer"><span>Infinity Legal (Pty) Ltd</span><span>Page 10</span></div>
</div>

<!-- PAGE 11: Technical Architecture -->
<div class="page content-page">
  <div class="page-header">
    <div class="section-num">Section 10</div>
    <h2>Technical Architecture</h2>
    <p>Modern, scalable, production-ready technology stack</p>
  </div>
  
  <div class="tech-stack">
    <div class="tech-item"><div class="icon">⚛️</div><div class="name">Next.js 14</div><p style="font-size:10px;color:#666;">App Router, SSR, API Routes</p></div>
    <div class="tech-item"><div class="icon">🍃</div><div class="name">MongoDB</div><p style="font-size:10px;color:#666;">Documents, Leads, Intakes, Versions</p></div>
    <div class="tech-item"><div class="icon">🔐</div><div class="name">Supabase</div><p style="font-size:10px;color:#666;">Auth, Users, Cases, RLS</p></div>
    <div class="tech-item"><div class="icon">🤖</div><div class="name">GPT-4o</div><p style="font-size:10px;color:#666;">Legal Analysis, Document Assist</p></div>
    <div class="tech-item"><div class="icon">🎨</div><div class="name">Tailwind CSS</div><p style="font-size:10px;color:#666;">Responsive, Dark Mode</p></div>
    <div class="tech-item"><div class="icon">🔑</div><div class="name">RBAC System</div><p style="font-size:10px;color:#666;">12+ Roles, 30+ Permissions</p></div>
  </div>
  
  <div class="feature-grid" style="margin-top: 20px;">
    <div class="feature-card">
      <h4>Security & Compliance</h4>
      <p>POPIA compliant data handling. Role-based access control (RBAC) with 12+ roles. Audit logging for every action. Encrypted data at rest and in transit. Middleware-enforced authentication.</p>
    </div>
    <div class="feature-card">
      <h4>Production Readiness</h4>
      <p>Health check API (/api/health). SEO optimized (sitemap.xml, robots.txt, JSON-LD). Analytics tracking. Custom 404 page. Cookie consent. Hot reload development.</p>
    </div>
  </div>
  
  <div class="highlight-box" style="margin-top: 20px;">
    <h4>API Architecture — 50+ Endpoints</h4>
    <p>RESTful API design. Auth via Supabase JWT tokens. Rate limiting. Error handling with proper HTTP status codes. MongoDB for flexible document storage. Supabase for relational data with RLS policies.</p>
  </div>
  <div class="footer"><span>Infinity Legal (Pty) Ltd</span><span>Page 11</span></div>
</div>

<!-- PAGE 12: Roadmap -->
<div class="page content-page" style="background: linear-gradient(180deg, white 0%, #f8f9fa 100%);">
  <div class="page-header">
    <div class="section-num">Section 11</div>
    <h2>Roadmap & Next Steps</h2>
    <p>Upcoming features and strategic direction</p>
  </div>
  
  <div class="feature-grid" style="margin-top: 20px;">
    <div class="feature-card" style="border-left-color: #22c55e;">
      <h4>✅ Completed (This Release)</h4>
      <p>
        • AI Intake → Case conversion<br>
        • Document versioning & check-in/out<br>
        • Leads pipeline (MongoDB-backed)<br>
        • Case archiving (read-only mode)<br>
        • Tasks bug fix (Supabase column)<br>
        • RBAC enhancements for attorneys<br>
        • Scorpion.biz competitive redesign<br>
        • Production readiness (health, SEO, analytics)
      </p>
    </div>
    <div class="feature-card" style="border-left-color: #3b82f6;">
      <h4>🔵 Upcoming</h4>
      <p>
        • PayFast payment integration<br>
        • Client self-service portal<br>
        • Advanced reporting & analytics dashboard<br>
        • Email/SMS notification integration<br>
        • Mobile responsive portal enhancements<br>
        • Multi-language support (ZA languages)
      </p>
    </div>
  </div>
  
  <div style="text-align: center; margin-top: 60px; padding: 40px;">
    <div style="font-size: 40px; margin-bottom: 16px;">⚖️</div>
    <h3 style="font-family: 'Playfair Display', serif; font-size: 28px; color: #1a2744; margin-bottom: 8px;">Infinity Legal (Pty) Ltd</h3>
    <p style="color: #666; font-size: 14px;">Block A, Eco Fusion 5, 1004 Witch-Hazel Avenue</p>
    <p style="color: #666; font-size: 14px;">Highveld Technopark, Centurion, South Africa</p>
    <p style="color: #d4a853; font-size: 14px; margin-top: 12px; font-weight: 600;">info@infinitylegal.co.za • +27 12 940 1080</p>
    <p style="color: #999; font-size: 11px; margin-top: 20px;">Managing Director: Tidimalo Tsatsi</p>
  </div>
  <div class="footer"><span>Infinity Legal (Pty) Ltd</span><span>Page 12</span></div>
</div>

</body>
</html>`;

// Write HTML
fs.writeFileSync('/app/public/presentation-v2.html', html);
console.log('HTML written');

// Convert to PDF
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`file:///app/public/presentation-v2.html`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  await page.pdf({
    path: '/app/public/Infinity_Legal_Platform_Presentation.pdf',
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });
  
  console.log('PDF generated!');
  const size = fs.statSync('/app/public/Infinity_Legal_Platform_Presentation.pdf').size;
  console.log(`Size: ${Math.round(size / 1024)}KB`);
  await browser.close();
})();
