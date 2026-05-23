#!/usr/bin/env python3
"""
Infinity Legal (Pty) Ltd — Comprehensive Client Report Generator
Generates a professional 12+ page PDF using ReportLab.
"""

import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, mm, cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable, ListFlowable, ListItem,
    Frame, PageTemplate, BaseDocTemplate, NextPageTemplate
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor

# ── Colour Palette ──────────────────────────────────────────────
NAVY   = HexColor("#0c1e3c")
GOLD   = HexColor("#c9a84c")
WHITE  = HexColor("#ffffff")
LGRAY  = HexColor("#f4f4f4")
MGRAY  = HexColor("#e0e0e0")
DGRAY  = HexColor("#555555")
BLACK  = HexColor("#222222")
LTBLUE = HexColor("#e8edf5")
GOLD_BG = HexColor("#faf6eb")

PAGE_W, PAGE_H = A4
MARGIN = 1.8 * cm

# ── Styles ──────────────────────────────────────────────────────
styles = getSampleStyleSheet()

def make_styles():
    """Create custom paragraph styles."""
    s = {}

    s['CoverTitle'] = ParagraphStyle(
        'CoverTitle', parent=styles['Title'],
        fontName='Helvetica-Bold', fontSize=28, leading=34,
        textColor=WHITE, alignment=TA_CENTER, spaceAfter=12,
    )
    s['CoverSubtitle'] = ParagraphStyle(
        'CoverSubtitle', parent=styles['Normal'],
        fontName='Helvetica', fontSize=16, leading=20,
        textColor=GOLD, alignment=TA_CENTER, spaceAfter=6,
    )
    s['CoverDate'] = ParagraphStyle(
        'CoverDate', parent=styles['Normal'],
        fontName='Helvetica', fontSize=13, leading=16,
        textColor=HexColor("#aabbcc"), alignment=TA_CENTER,
    )
    s['H1'] = ParagraphStyle(
        'H1', parent=styles['Heading1'],
        fontName='Helvetica-Bold', fontSize=20, leading=26,
        textColor=NAVY, spaceBefore=18, spaceAfter=10,
        borderColor=GOLD, borderWidth=2, borderPadding=4,
    )
    s['H2'] = ParagraphStyle(
        'H2', parent=styles['Heading2'],
        fontName='Helvetica-Bold', fontSize=15, leading=20,
        textColor=NAVY, spaceBefore=14, spaceAfter=6,
    )
    s['H3'] = ParagraphStyle(
        'H3', parent=styles['Heading3'],
        fontName='Helvetica-BoldOblique', fontSize=12, leading=16,
        textColor=HexColor("#1a3a6c"), spaceBefore=10, spaceAfter=4,
    )
    s['Body'] = ParagraphStyle(
        'Body', parent=styles['Normal'],
        fontName='Helvetica', fontSize=10, leading=14,
        textColor=BLACK, alignment=TA_JUSTIFY, spaceAfter=6,
    )
    s['BodySmall'] = ParagraphStyle(
        'BodySmall', parent=s['Body'],
        fontSize=9, leading=12, spaceAfter=3,
    )
    s['Bullet'] = ParagraphStyle(
        'Bullet', parent=s['Body'],
        leftIndent=18, bulletIndent=6, spaceAfter=3,
    )
    s['TableHead'] = ParagraphStyle(
        'TableHead', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=9, leading=12,
        textColor=WHITE, alignment=TA_CENTER,
    )
    s['TableCell'] = ParagraphStyle(
        'TableCell', parent=styles['Normal'],
        fontName='Helvetica', fontSize=9, leading=12,
        textColor=BLACK,
    )
    s['TableCellCenter'] = ParagraphStyle(
        'TableCellCenter', parent=s['TableCell'],
        alignment=TA_CENTER,
    )
    s['Footer'] = ParagraphStyle(
        'Footer', parent=styles['Normal'],
        fontName='Helvetica', fontSize=7, leading=9,
        textColor=DGRAY, alignment=TA_CENTER,
    )
    s['Confidential'] = ParagraphStyle(
        'Confidential', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=11, leading=14,
        textColor=HexColor("#cc3333"), alignment=TA_CENTER,
        spaceBefore=6, spaceAfter=6,
    )
    s['TOCEntry'] = ParagraphStyle(
        'TOCEntry', parent=styles['Normal'],
        fontName='Helvetica', fontSize=11, leading=18,
        textColor=NAVY, leftIndent=20,
    )
    s['TOCSub'] = ParagraphStyle(
        'TOCSub', parent=s['TOCEntry'],
        fontSize=10, leftIndent=40, leading=16,
        textColor=DGRAY,
    )
    return s

S = make_styles()

# ── Helper functions ────────────────────────────────────────────

def p(text, style_key='Body'):
    return Paragraph(text, S[style_key])

def bullet(text):
    return Paragraph(f"&bull; {text}", S['Bullet'])

def gold_rule():
    return HRFlowable(width="100%", thickness=1.5, color=GOLD,
                       spaceBefore=4, spaceAfter=8)

def navy_rule():
    return HRFlowable(width="100%", thickness=1, color=NAVY,
                       spaceBefore=2, spaceAfter=6)

def make_table(headers, rows, col_widths=None):
    """Create a styled table with Paragraph-wrapped cells."""
    avail = PAGE_W - 2 * MARGIN
    n_cols = len(headers)

    if col_widths is None:
        col_widths = [avail / n_cols] * n_cols

    # Verify widths fit
    total = sum(col_widths)
    if total > avail:
        scale = avail / total
        col_widths = [w * scale for w in col_widths]

    head_row = [Paragraph(h, S['TableHead']) for h in headers]
    data = [head_row]
    for row in rows:
        data.append([Paragraph(str(c), S['TableCell']) for c in row])

    t = Table(data, colWidths=col_widths, repeatRows=1)
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME',  (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE',  (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, MGRAY),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 1), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]
    # Alternating row colours
    for i in range(1, len(data)):
        bg = LGRAY if i % 2 == 0 else WHITE
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))

    t.setStyle(TableStyle(style_cmds))
    return t


# ── Page templates ──────────────────────────────────────────────

def cover_page(canvas_obj, doc):
    """Draw the cover page background."""
    c = canvas_obj
    c.saveState()
    # Full navy background
    c.setFillColor(NAVY)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    # Gold accent bar at top
    c.setFillColor(GOLD)
    c.rect(0, PAGE_H - 8, PAGE_W, 8, fill=1, stroke=0)
    # Gold accent bar at bottom
    c.rect(0, 0, PAGE_W, 8, fill=1, stroke=0)
    # Decorative gold line
    c.setStrokeColor(GOLD)
    c.setLineWidth(1.5)
    c.line(MARGIN * 2, PAGE_H * 0.38, PAGE_W - MARGIN * 2, PAGE_H * 0.38)
    c.line(MARGIN * 2, PAGE_H * 0.58, PAGE_W - MARGIN * 2, PAGE_H * 0.58)
    c.restoreState()


def normal_page(canvas_obj, doc):
    """Draw header and footer on normal pages."""
    c = canvas_obj
    c.saveState()
    # Header bar
    c.setFillColor(NAVY)
    c.rect(0, PAGE_H - 28, PAGE_W, 28, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, PAGE_H - 31, PAGE_W, 3, fill=1, stroke=0)
    c.setFont('Helvetica-Bold', 8)
    c.setFillColor(WHITE)
    c.drawString(MARGIN, PAGE_H - 20, "Infinity Legal (Pty) Ltd")
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 20, "Intranet Portal — Technical & Functional Report")
    # Footer
    c.setStrokeColor(GOLD)
    c.setLineWidth(0.8)
    c.line(MARGIN, 30, PAGE_W - MARGIN, 30)
    c.setFont('Helvetica', 7)
    c.setFillColor(DGRAY)
    c.drawString(MARGIN, 18, "CONFIDENTIAL — For internal use only")
    c.drawRightString(PAGE_W - MARGIN, 18, f"Page {doc.page}")
    c.drawCentredString(PAGE_W / 2, 18, "Infinity Legal (Pty) Ltd")
    c.restoreState()


# ── Document Builder ────────────────────────────────────────────

def build_report(output_path):
    doc = BaseDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=MARGIN + 20, bottomMargin=MARGIN + 10,
        title="Infinity Legal — Intranet Portal Report",
        author="Infinity Legal (Pty) Ltd",
    )

    frame_cover = Frame(MARGIN, MARGIN, PAGE_W - 2 * MARGIN, PAGE_H - 2 * MARGIN,
                        id='cover_frame')
    frame_normal = Frame(MARGIN, MARGIN + 20, PAGE_W - 2 * MARGIN, PAGE_H - 2 * MARGIN - 40,
                         id='normal_frame')

    doc.addPageTemplates([
        PageTemplate(id='Cover', frames=[frame_cover], onPage=cover_page),
        PageTemplate(id='Normal', frames=[frame_normal], onPage=normal_page),
    ])

    story = []
    avail = PAGE_W - 2 * MARGIN

    # ═══════════════════════════════════════════════════════════
    # 1. COVER PAGE
    # ═══════════════════════════════════════════════════════════
    story.append(Spacer(1, PAGE_H * 0.22))
    story.append(p("Infinity Legal (Pty) Ltd", 'CoverTitle'))
    story.append(Spacer(1, 12))
    story.append(p("Intranet Portal", 'CoverTitle'))
    story.append(Spacer(1, 4))
    story.append(p("Technical &amp; Functional Report", 'CoverSubtitle'))
    story.append(Spacer(1, 40))
    story.append(p("May 2026", 'CoverDate'))
    story.append(Spacer(1, 16))
    story.append(p("CONFIDENTIAL", 'CoverDate'))
    story.append(NextPageTemplate('Normal'))
    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════
    # 2. TABLE OF CONTENTS
    # ═══════════════════════════════════════════════════════════
    story.append(p("Table of Contents", 'H1'))
    story.append(gold_rule())

    toc_items = [
        ("1.", "Executive Summary"),
        ("2.", "System Architecture"),
        ("3.", "Portal Overview"),
        ("4.", "Role-Based Access Control"),
        ("5.", "Current Data &amp; Statistics"),
        ("6.", "Staff Directory &amp; Login Credentials"),
        ("7.", "Security Features"),
        ("8.", "Pricing Plans"),
        ("9.", "API Endpoints"),
        ("10.", "Deployment &amp; Access"),
        ("11.", "Recommendations &amp; Next Steps"),
    ]
    for num, title in toc_items:
        story.append(p(f"<b>{num}</b>&nbsp;&nbsp;&nbsp;{title}", 'TOCEntry'))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════
    # 3. EXECUTIVE SUMMARY
    # ═══════════════════════════════════════════════════════════
    story.append(p("1. Executive Summary", 'H1'))
    story.append(gold_rule())

    story.append(p(
        "The Infinity Legal Intranet Portal is a comprehensive, role-based web application designed "
        "to centralise and streamline operations for Infinity Legal (Pty) Ltd, a legal services firm "
        "based in South Africa. The portal provides dedicated interfaces for management, paralegals, "
        "sales consultants, HR personnel, and general staff — each tailored to their specific "
        "operational needs and access privileges."
    ))
    story.append(Spacer(1, 6))
    story.append(p("<b>Key Achievements:</b>", 'H3'))
    for item in [
        "Successfully deployed a full-stack intranet application with 6 distinct portal views",
        "Implemented comprehensive Role-Based Access Control (RBAC) with 16 defined roles",
        "Achieved POPIA (Protection of Personal Information Act) compliance across all data-handling operations",
        "Integrated AES-256 encryption for sensitive data at rest and JWT authentication for secure access",
        "Built a real-time workbench dashboard with live case distribution, task tracking, and revenue indicators",
        "Established lead scoring and qualification pipeline for the sales function",
        "Created a complete staff directory with organisational chart and supervisor hierarchies",
        "Deployed to Vercel with CI/CD and available via GitHub repository",
    ]:
        story.append(bullet(item))

    story.append(Spacer(1, 8))
    # Status box
    status_data = [[Paragraph("<b>Project Status: LIVE AND OPERATIONAL</b>", S['TableHead'])]]
    status_table = Table(status_data, colWidths=[avail * 0.6])
    status_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), HexColor("#1a6b3c")),
        ('TEXTCOLOR', (0, 0), (-1, -1), WHITE),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(status_table)

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════
    # 4. SYSTEM ARCHITECTURE
    # ═══════════════════════════════════════════════════════════
    story.append(p("2. System Architecture", 'H1'))
    story.append(gold_rule())

    story.append(p("The Infinity Legal Intranet Portal is built on a modern, full-stack JavaScript/TypeScript architecture, leveraging the Next.js framework for both server-side rendering and API development.", 'Body'))

    story.append(p("2.1 Technology Stack", 'H2'))
    stack_rows = [
        ["Frontend Framework", "Next.js 16 with App Router"],
        ["Language", "TypeScript (strict mode)"],
        ["Styling", "Tailwind CSS 4 + shadcn/ui component library"],
        ["Backend", "Next.js API Routes (serverless functions)"],
        ["ORM", "Prisma ORM"],
        ["Database", "SQLite (development) — PostgreSQL recommended for production"],
        ["Authentication", "JWT (JSON Web Tokens) with 24-hour token expiry"],
        ["Encryption", "AES-256 for sensitive data at rest"],
        ["State Management", "React hooks + server components"],
        ["Deployment", "Vercel (serverless) + GitHub CI/CD"],
    ]
    story.append(make_table(["Layer", "Technology"], stack_rows,
                            col_widths=[avail * 0.35, avail * 0.65]))

    story.append(Spacer(1, 10))
    story.append(p("2.2 Architecture Diagram", 'H2'))
    arch_rows = [
        ["Client Layer", "React (Next.js 16) + shadcn/ui + Tailwind CSS 4"],
        ["API Layer", "Next.js API Routes with RBAC middleware"],
        ["Auth Layer", "JWT authentication + role-based access control"],
        ["Security Layer", "AES-256 encryption, input sanitisation, rate limiting, CSP/HSTS"],
        ["Data Layer", "Prisma ORM → SQLite (dev) / PostgreSQL (prod)"],
    ]
    story.append(make_table(["Layer", "Components"], arch_rows,
                            col_widths=[avail * 0.25, avail * 0.75]))

    story.append(Spacer(1, 10))
    story.append(p("2.3 Key Design Decisions", 'H2'))
    for item in [
        "<b>Server-Side Rendering (SSR):</b> Critical pages pre-render on the server for performance and SEO",
        "<b>API Routes:</b> Backend logic co-located with frontend, enabling type-safe end-to-end development",
        "<b>Prisma ORM:</b> Type-safe database access with automatic migrations and seeding",
        "<b>RBAC at API level:</b> All endpoints enforce role-based permissions before data access",
        "<b>POPIA Compliance:</b> All personal data handling follows South African data protection regulations",
    ]:
        story.append(bullet(item))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════
    # 5. PORTAL OVERVIEW
    # ═══════════════════════════════════════════════════════════
    story.append(p("3. Portal Overview", 'H1'))
    story.append(gold_rule())

    story.append(p(
        "The intranet portal provides six distinct views, each tailored to the responsibilities and "
        "access requirements of different staff roles. Users are automatically directed to their "
        "appropriate portal upon login based on their assigned role."
    ))

    # 3.1 Workbench
    story.append(p("3.1 Workbench (Central Dashboard)", 'H2'))
    story.append(p(
        "The Workbench serves as the central command centre for the firm. It provides an at-a-glance "
        "overview of the firm's operations and is accessible to management-level roles."
    ))
    wb_features = [
        "<b>Key Statistics:</b> Total cases, active leads, revenue figures, and task counts displayed as summary cards",
        "<b>Quick Actions:</b> One-click access to create cases, add leads, assign tasks, and log consultations",
        "<b>Upcoming Consultations:</b> Calendar-based view of scheduled client meetings with time and case details",
        "<b>Task List:</b> Priority-sorted task overview with assignee information and due dates",
        "<b>Case Distribution Chart:</b> Visual breakdown of cases by type (Family Law, Civil Litigation, Criminal Defence, Conveyancing, Estate Planning, Corporate)",
        "<b>Firm Health Indicators:</b> Revenue trends, case resolution rates, lead conversion metrics, and staff utilisation",
    ]
    for f in wb_features:
        story.append(bullet(f))

    story.append(Spacer(1, 6))

    # 3.2 Paralegal Portal
    story.append(p("3.2 Paralegal Portal", 'H2'))
    story.append(p(
        "Designed for paralegals and candidate attorneys, this portal focuses on day-to-day case work "
        "and document management."
    ))
    for f in [
        "<b>Assigned Cases:</b> View and manage all cases assigned to the logged-in paralegal",
        "<b>Document Management:</b> Upload, view, and organise case-related documents with secure file handling",
        "<b>Consultation Logging:</b> Record client consultations with date, duration, notes, and case linkage",
        "<b>Task Management:</b> Track assigned tasks with priority levels and completion status",
    ]:
        story.append(bullet(f))

    story.append(Spacer(1, 6))

    # 3.3 Sales Portal
    story.append(p("3.3 Sales Portal", 'H2'))
    story.append(p(
        "The Sales Portal equips consultants and senior consultants with tools for lead management "
        "and conversion tracking."
    ))
    for f in [
        "<b>Lead Management:</b> Full CRUD operations for leads with contact details and source tracking",
        "<b>Lead Scoring:</b> Automated scoring system based on engagement, budget, and timeline indicators",
        "<b>Qualification Pipeline:</b> Visual pipeline moving leads through stages: New → Contacted → Qualified → Proposal → Negotiation → Won/Lost",
        "<b>Conversion Tracking:</b> Analytics on lead-to-client conversion rates and revenue attribution",
    ]:
        story.append(bullet(f))

    story.append(Spacer(1, 6))

    # 3.4 HR Portal
    story.append(p("3.4 HR Portal", 'H2'))
    story.append(p(
        "The HR Portal provides human resources management capabilities including staff administration "
        "and organisational structure management."
    ))
    for f in [
        "<b>Staff Directory:</b> Searchable directory of all employees with contact information and roles",
        "<b>Organisational Chart:</b> Visual hierarchy showing reporting lines and departmental structure",
        "<b>Department Management:</b> Create and manage departments with assigned staff and supervisors",
        "<b>Supervisor Hierarchies:</b> Define and modify reporting relationships between staff members",
    ]:
        story.append(bullet(f))

    story.append(Spacer(1, 6))

    # 3.5 Management Portal
    story.append(p("3.5 Management Portal", 'H2'))
    story.append(p(
        "The Management Portal provides senior leadership with full visibility across all firm operations."
    ))
    for f in [
        "<b>Full Analytics Dashboard:</b> Comprehensive business intelligence with customisable metrics",
        "<b>Revenue Tracking:</b> Real-time revenue figures by case type, lead source, and time period",
        "<b>Case Overview:</b> All cases across the firm with status, value, assigned staff, and timelines",
        "<b>Lead Pipeline:</b> Complete view of the sales pipeline from lead generation to conversion",
        "<b>Audit Logs:</b> Complete audit trail of all user actions for compliance and oversight",
    ]:
        story.append(bullet(f))

    story.append(Spacer(1, 6))

    # 3.6 Staff Portal
    story.append(p("3.6 Staff Portal", 'H2'))
    story.append(p(
        "The Staff Portal provides general employees with access to the firm directory and organisational "
        "information."
    ))
    for f in [
        "<b>Employee Directory:</b> Contact details and roles for all staff members",
        "<b>Organisational Structure Tree:</b> Interactive tree view of the firm's hierarchy",
        "<b>Departmental Views:</b> Browse staff by department with role descriptions",
    ]:
        story.append(bullet(f))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════
    # 6. ROLE-BASED ACCESS CONTROL
    # ═══════════════════════════════════════════════════════════
    story.append(p("4. Role-Based Access Control", 'H1'))
    story.append(gold_rule())

    story.append(p(
        "The system implements a comprehensive Role-Based Access Control (RBAC) model with 16 defined roles. "
        "Each role determines the user's portal access, available features, and data visibility. "
        "All API endpoints enforce role-based permissions before granting data access, ensuring that "
        "users can only view and modify information appropriate to their role."
    ))

    story.append(p("4.1 Defined Roles", 'H2'))
    role_rows = [
        ["Managing Director", "managing_director", "Full system access, all portals, audit logs"],
        ["Senior Partner", "senior_partner", "Management portal, case oversight, revenue tracking"],
        ["Associate", "associate", "Case management, document access, consultations"],
        ["Paralegal", "paralegal", "Assigned cases, document management, consultation logging"],
        ["Legal Officer", "legal_officer", "Case management, legal research, task assignment"],
        ["Supervising Officer", "supervising_officer", "Team oversight, case review, task monitoring"],
        ["Senior Consultant", "senior_consultant", "Sales portal, lead management, pipeline oversight"],
        ["Consultant", "consultant", "Sales portal, assigned leads, consultation scheduling"],
        ["Candidate Attorney", "candidate_attorney", "Assigned cases, document viewing, task completion"],
        ["HR Manager", "hr_manager", "HR portal, staff directory, org chart, department management"],
        ["Finance Manager", "finance_manager", "Revenue tracking, billing, financial reporting"],
        ["Office Administrator", "office_administrator", "Staff directory, scheduling, office operations"],
        ["Systems Admin", "systems_admin", "Full technical access, system configuration, user management"],
        ["Receptionist", "receptionist", "Staff directory, consultation scheduling, client check-in"],
        ["Client", "client", "Case status view, document access, consultation scheduling"],
        ["Guest", "guest", "Limited read-only access to public information"],
    ]
    story.append(make_table(["Role", "Identifier", "Access Scope"], role_rows,
                            col_widths=[avail * 0.22, avail * 0.22, avail * 0.56]))

    story.append(Spacer(1, 10))
    story.append(p("4.2 Permission Matrix", 'H2'))
    story.append(p(
        "The following matrix shows feature access by role category. Access levels: "
        "<b>F</b> = Full, <b>R</b> = Read, <b>W</b> = Write, <b>—</b> = No Access"
    ))
    perm_headers = ["Feature", "MD/SP", "Assoc/Para", "Sales", "HR", "Admin", "Client"]
    perm_rows = [
        ["Workbench Dashboard", "F", "R", "R", "R", "F", "—"],
        ["Case Management", "F", "W", "—", "—", "F", "R"],
        ["Lead Management", "F", "—", "W", "—", "F", "—"],
        ["Document Management", "F", "W", "R", "—", "F", "R"],
        ["Staff Directory", "F", "R", "R", "F", "F", "—"],
        ["HR / Org Chart", "F", "—", "—", "F", "F", "—"],
        ["Audit Logs", "F", "—", "—", "—", "F", "—"],
        ["Revenue Tracking", "F", "—", "—", "—", "F", "—"],
        ["System Configuration", "F", "—", "—", "—", "F", "—"],
    ]
    story.append(make_table(perm_headers, perm_rows,
                            col_widths=[avail * 0.26, avail * 0.12, avail * 0.14,
                                        avail * 0.12, avail * 0.12, avail * 0.12, avail * 0.12]))

    story.append(Spacer(1, 8))
    story.append(p("4.3 POPIA Compliance Enforcement", 'H2'))
    story.append(p(
        "All role-based access controls are designed to comply with the Protection of Personal Information "
        "Act (POPIA) of South Africa. Personal data is only accessible to roles that require it for their "
        "operational duties. The system implements data minimisation principles, ensuring that users see "
        "only the personal information necessary for their role. All access to personal data is logged in "
        "the audit trail for regulatory compliance."
    ))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════
    # 7. CURRENT DATA & STATISTICS
    # ═══════════════════════════════════════════════════════════
    story.append(p("5. Current Data &amp; Statistics", 'H1'))
    story.append(gold_rule())

    story.append(p("5.1 Case Statistics", 'H2'))
    case_rows = [
        ["Total Cases", "15"],
        ["Total Case Value", "R5,150,000"],
        ["Active Cases", "3"],
        ["Pending Cases", "3"],
        ["Closed Cases", "2"],
        ["Settled Cases", "2"],
        ["On-Hold Cases", "2"],
        ["Under Review", "2"],
        ["Archived", "1"],
    ]
    story.append(make_table(["Metric", "Value"], case_rows,
                            col_widths=[avail * 0.45, avail * 0.55]))

    story.append(Spacer(1, 10))
    story.append(p("5.2 Case Types", 'H2'))
    type_rows = [
        ["Family Law", "3 cases"],
        ["Civil Litigation", "3 cases"],
        ["Criminal Defence", "3 cases"],
        ["Conveyancing", "2 cases"],
        ["Estate Planning", "2 cases"],
        ["Corporate", "2 cases"],
    ]
    story.append(make_table(["Case Type", "Count"], type_rows,
                            col_widths=[avail * 0.5, avail * 0.5]))

    story.append(Spacer(1, 10))
    story.append(p("5.3 Lead Statistics", 'H2'))
    lead_rows = [
        ["Total Leads", "10"],
        ["Estimated Total Value", "R2,523,573"],
        ["New Leads", "3"],
        ["Contacted", "2"],
        ["Qualified", "2"],
        ["Proposal Sent", "1"],
        ["Negotiation", "1"],
        ["Won", "1"],
    ]
    story.append(make_table(["Metric", "Value"], lead_rows,
                            col_widths=[avail * 0.45, avail * 0.55]))

    story.append(Spacer(1, 10))
    story.append(p("5.4 Staff &amp; Task Summary", 'H2'))
    staff_task_rows = [
        ["Total Staff Members", "7"],
        ["Departments", "4 (Legal, Consulting, Administration, IT)"],
        ["Total Tasks", "8"],
        ["Urgent Tasks", "2"],
        ["High Priority Tasks", "2"],
        ["Medium Priority Tasks", "2"],
        ["Low Priority Tasks", "2"],
    ]
    story.append(make_table(["Metric", "Value"], staff_task_rows,
                            col_widths=[avail * 0.45, avail * 0.55]))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════
    # 8. STAFF DIRECTORY & LOGIN CREDENTIALS
    # ═══════════════════════════════════════════════════════════
    story.append(p("6. Staff Directory &amp; Login Credentials", 'H1'))
    story.append(gold_rule())

    # Confidential warning
    conf_data = [[Paragraph(
        "<b>&#9888; CONFIDENTIAL — This section contains login credentials. "
        "Do not distribute outside the firm.</b>", S['Confidential']
    )]]
    conf_table = Table(conf_data, colWidths=[avail * 0.9])
    conf_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), HexColor("#fff0f0")),
        ('BOX', (0, 0), (-1, -1), 2, HexColor("#cc3333")),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(conf_table)
    story.append(Spacer(1, 10))

    staff_rows = [
        ["Thabo Molefe", "Managing Director", "md@infinitylegal.co.za", "Password123!"],
        ["Nomsa Dlamini", "Senior Partner", "partner@infinitylegal.co.za", "Password123!"],
        ["Sipho Nkosi", "Associate", "associate@infinitylegal.co.za", "Password123!"],
        ["Bongani Khumalo", "Legal Officer", "officer@infinitylegal.co.za", "Password123!"],
        ["Zanele Mokoena", "Senior Consultant", "consultant@infinitylegal.co.za", "Password123!"],
        ["Lindiwe Mthembu", "Paralegal", "paralegal@infinitylegal.co.za", "Password123!"],
        ["Tech Admin", "Systems Admin", "admin@infinitylegal.co.za", "Password123!"],
    ]
    story.append(make_table(
        ["Full Name", "Role", "Email", "Password"],
        staff_rows,
        col_widths=[avail * 0.22, avail * 0.22, avail * 0.32, avail * 0.24]
    ))

    story.append(Spacer(1, 10))
    note_data = [[Paragraph(
        "<b>Important:</b> All users should change their password on first login. "
        "The system enforces a 90-day password expiry policy. Passwords must meet "
        "minimum complexity requirements (8+ characters, uppercase, lowercase, number, special character).",
        S['BodySmall']
    )]]
    note_table = Table(note_data, colWidths=[avail * 0.9])
    note_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), GOLD_BG),
        ('BOX', (0, 0), (-1, -1), 1, GOLD),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(note_table)

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════
    # 9. SECURITY FEATURES
    # ═══════════════════════════════════════════════════════════
    story.append(p("7. Security Features", 'H1'))
    story.append(gold_rule())

    story.append(p(
        "The Infinity Legal Intranet Portal implements a multi-layered security architecture designed "
        "to protect sensitive legal data and ensure compliance with South African data protection regulations."
    ))

    sec_rows = [
        ["Authentication", "JWT (JSON Web Tokens) with 24-hour token expiry. Tokens are validated on every API request. Secure HTTP-only cookie storage."],
        ["Encryption", "AES-256 encryption for sensitive data at rest (PII, financial records, case details). All data in transit secured via TLS/HTTPS."],
        ["POPIA Compliance", "Full compliance with the Protection of Personal Information Act (South Africa). Data minimisation, purpose limitation, and consent-based processing enforced."],
        ["RBAC", "Role-Based Access Control with 16 defined roles. All API endpoints enforce role permissions before data access."],
        ["Rate Limiting", "API endpoints protected by configurable rate limiting to prevent brute-force attacks and abuse."],
        ["Input Sanitisation", "All user inputs sanitised to prevent SQL injection and XSS (Cross-Site Scripting) attacks."],
        ["Security Headers", "Content Security Policy (CSP), HTTP Strict Transport Security (HSTS), X-Frame-Options, X-Content-Type-Options headers enforced."],
        ["Audit Logging", "Comprehensive audit trail for all user actions including login, data access, modifications, and deletions."],
        ["Password Policy", "90-day password expiry enforced. Minimum complexity: 8+ characters with uppercase, lowercase, number, and special character."],
        ["Secret Protection", ".gitignore prevents accidental commit of .env files, credentials, SSL certificates, and database files."],
    ]
    story.append(make_table(["Feature", "Implementation"], sec_rows,
                            col_widths=[avail * 0.22, avail * 0.78]))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════
    # 10. PRICING PLANS
    # ═══════════════════════════════════════════════════════════
    story.append(p("8. Pricing Plans", 'H1'))
    story.append(gold_rule())

    story.append(p(
        "Infinity Legal offers three legal service plans designed to provide affordable access to "
        "professional legal assistance for individuals and businesses across South Africa."
    ))

    # Civil Legal Plan
    story.append(Spacer(1, 6))
    story.append(p("8.1 Civil Legal Plan — R99/month", 'H2'))
    for f in [
        "Family law consultations and advice",
        "Maintenance applications and enforcement",
        "Domestic violence protection orders",
        "Basic legal advice and guidance",
    ]:
        story.append(bullet(f))

    story.append(Spacer(1, 6))

    # Labour Legal Plan
    story.append(p("8.2 Labour Legal Plan — R99/month", 'H2'))
    for f in [
        "Unfair dismissal claims and representation",
        "CCMA representation and preparation",
        "Employment contract review and drafting",
        "Workplace dispute resolution",
    ]:
        story.append(bullet(f))

    story.append(Spacer(1, 6))

    # Extensive Plan
    story.append(p("8.3 Extensive Plan — R139/month", 'H2'))
    for f in [
        "All Civil Legal Plan benefits",
        "All Labour Legal Plan benefits",
        "Property transfers and conveyancing",
        "Wills and estate planning",
        "Debt collection and recovery",
        "Corporate and commercial law",
        "Unlimited consultations",
    ]:
        story.append(bullet(f))

    story.append(Spacer(1, 10))
    # Pricing comparison table
    price_rows = [
        ["Family Law Consultations", "✓", "—", "✓"],
        ["Maintenance Applications", "✓", "—", "✓"],
        ["Domestic Violence Protection", "✓", "—", "✓"],
        ["Basic Legal Advice", "✓", "—", "✓"],
        ["Unfair Dismissal", "—", "✓", "✓"],
        ["CCMA Representation", "—", "✓", "✓"],
        ["Employment Contracts", "—", "✓", "✓"],
        ["Workplace Disputes", "—", "✓", "✓"],
        ["Property Transfers", "—", "—", "✓"],
        ["Wills &amp; Estates", "—", "—", "✓"],
        ["Debt Collection", "—", "—", "✓"],
        ["Corporate Law", "—", "—", "✓"],
        ["Unlimited Consultations", "—", "—", "✓"],
    ]
    story.append(make_table(
        ["Feature", "Civil (R99)", "Labour (R99)", "Extensive (R139)"],
        price_rows,
        col_widths=[avail * 0.40, avail * 0.20, avail * 0.20, avail * 0.20]
    ))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════
    # 11. API ENDPOINTS
    # ═══════════════════════════════════════════════════════════
    story.append(p("9. API Endpoints", 'H1'))
    story.append(gold_rule())

    story.append(p(
        "The following RESTful API endpoints are available. All endpoints (except /api/health and "
        "/api/auth/login) require a valid JWT token and enforce role-based access control."
    ))

    api_rows = [
        ["/api/auth/login", "POST", "Open", "User authentication — returns JWT token and user profile"],
        ["/api/dashboard", "GET", "MD/SP/Admin", "Dashboard statistics — cases, leads, revenue, tasks"],
        ["/api/cases", "GET", "Role-filtered", "Case management — results filtered by user role and assignments"],
        ["/api/leads", "GET/POST", "Sales/Admin", "Lead management — create, read, update lead records"],
        ["/api/documents", "GET/POST", "Role-filtered", "Document management — list and create document records"],
        ["/api/documents/upload", "POST", "Role-filtered", "File upload — handle document file uploads securely"],
        ["/api/consultations", "GET/POST", "Role-filtered", "Consultation logging — schedule and record consultations"],
        ["/api/tasks", "GET/POST", "Role-filtered", "Task management — create, assign, and track tasks"],
        ["/api/staff", "GET", "HR/Admin", "Staff directory — employee information and org structure"],
        ["/api/notifications", "GET", "Authenticated", "User notifications — retrieve notifications for current user"],
        ["/api/health", "GET", "Open", "System health check — database, API, and service status"],
    ]
    story.append(make_table(
        ["Endpoint", "Methods", "Access", "Description"],
        api_rows,
        col_widths=[avail * 0.22, avail * 0.10, avail * 0.16, avail * 0.52]
    ))

    story.append(Spacer(1, 12))
    story.append(p("9.1 Authentication Flow", 'H2'))
    for step in [
        "Client sends POST to /api/auth/login with email and password",
        "Server validates credentials against the database",
        "On success, server returns a JWT token (24-hour expiry) and user profile",
        "Client stores the token and includes it in the Authorization header for subsequent requests",
        "All protected endpoints validate the token and check role-based permissions",
        "Expired tokens require re-authentication",
    ]:
        story.append(bullet(step))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════
    # 12. DEPLOYMENT & ACCESS
    # ═══════════════════════════════════════════════════════════
    story.append(p("10. Deployment &amp; Access", 'H1'))
    story.append(gold_rule())

    story.append(p(
        "The Infinity Legal Intranet Portal is deployed and accessible through multiple channels "
        "to support both production use and ongoing development."
    ))

    deploy_rows = [
        ["Production (Vercel)", "https://infinity-legal-za.vercel.app/", "Live production deployment"],
        ["GitHub Repository", "https://github.com/Lehumo-Tech/infinity-legal-za", "Source code and documentation"],
        ["Local Development", "http://localhost:3000", "Local development server (npm run dev)"],
        ["Preview Panel", "Available via Preview Panel", "Click 'Open in New Tab' for full view"],
    ]
    story.append(make_table(["Channel", "URL / Access", "Notes"], deploy_rows,
                            col_widths=[avail * 0.22, avail * 0.44, avail * 0.34]))

    story.append(Spacer(1, 12))
    story.append(p("10.1 Deployment Architecture", 'H2'))
    for item in [
        "<b>Hosting:</b> Vercel serverless platform with automatic SSL/TLS certificates",
        "<b>CI/CD:</b> Automatic deployments triggered by pushes to the main branch on GitHub",
        "<b>Environment Variables:</b> Managed via Vercel dashboard — secrets never stored in code",
        "<b>Database:</b> SQLite for development; PostgreSQL recommended for production scaling",
        "<b>File Storage:</b> Local file system for development; cloud storage recommended for production",
    ]:
        story.append(bullet(item))

    story.append(Spacer(1, 12))
    story.append(p("10.2 Local Development Setup", 'H2'))
    dev_steps = [
        "Clone the repository: <font face='Courier' size=9>git clone https://github.com/Lehumo-Tech/infinity-legal-za.git</font>",
        "Install dependencies: <font face='Courier' size=9>npm install</font>",
        "Configure environment: Copy <font face='Courier' size=9>.env.example</font> to <font face='Courier' size=9>.env</font> and fill in values",
        "Set up database: <font face='Courier' size=9>npx prisma migrate dev</font>",
        "Seed data: <font face='Courier' size=9>npx prisma db seed</font>",
        "Start development server: <font face='Courier' size=9>npm run dev</font>",
        "Access at: <font face='Courier' size=9>http://localhost:3000</font>",
    ]
    for step in dev_steps:
        story.append(bullet(step))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════
    # 13. RECOMMENDATIONS & NEXT STEPS
    # ═══════════════════════════════════════════════════════════
    story.append(p("11. Recommendations &amp; Next Steps", 'H1'))
    story.append(gold_rule())

    story.append(p(
        "The following recommendations are proposed to enhance the portal's capabilities, "
        "improve operational efficiency, and ensure long-term scalability."
    ))

    rec_rows = [
        ["1", "Database Backups", "Schedule regular automated database backups (daily) with off-site storage. Implement point-in-time recovery for critical data protection.", "High"],
        ["2", "Email Notifications", "Implement email notifications for task assignments, consultation reminders, and case status changes. Integrate with SendGrid or AWS SES.", "High"],
        ["3", "Document Version Control", "Add document version control with diff tracking and e-signature capabilities using DocuSign or HelloSign API integration.", "High"],
        ["4", "PostgreSQL Migration", "Migrate from SQLite to PostgreSQL for production deployment. This provides better concurrency, scalability, and backup capabilities.", "High"],
        ["5", "CI/CD Pipeline", "Set up automated CI/CD pipeline with GitHub Actions for linting, testing, and staged deployments. Include automated test suites.", "Medium"],
        ["6", "Real-Time Chat", "Implement real-time chat functionality via WebSocket (Socket.io) for internal team communication and client messaging.", "Medium"],
        ["7", "Calendar Integration", "Add calendar integration for court dates, consultation scheduling, and deadline tracking. Support Google Calendar and Outlook.", "Medium"],
        ["8", "Mobile Optimisation", "Enhance mobile responsiveness and consider a Progressive Web App (PWA) for offline access and push notifications.", "Medium"],
        ["9", "Reporting Engine", "Build a custom reporting engine with PDF/Excel export for financial reports, case summaries, and lead analytics.", "Low"],
        ["10", "Two-Factor Authentication", "Implement 2FA/MFA for enhanced security, particularly for management and admin roles using TOTP or SMS verification.", "Low"],
    ]
    story.append(make_table(
        ["#", "Recommendation", "Description", "Priority"],
        rec_rows,
        col_widths=[avail * 0.04, avail * 0.16, avail * 0.66, avail * 0.10]
    ))

    story.append(Spacer(1, 16))

    # Closing statement
    closing_data = [[Paragraph(
        "This report was prepared for the internal use of Infinity Legal (Pty) Ltd. "
        "All information contained herein is confidential and should not be distributed "
        "outside the organisation. For questions or clarifications, please contact the "
        "Systems Administrator at admin@infinitylegal.co.za.",
        S['BodySmall']
    )]]
    closing_table = Table(closing_data, colWidths=[avail * 0.9])
    closing_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LTBLUE),
        ('BOX', (0, 0), (-1, -1), 1, NAVY),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
    ]))
    story.append(closing_table)

    story.append(Spacer(1, 20))

    # End mark
    end_data = [[Paragraph(
        "<b>— End of Report —</b>", 
        ParagraphStyle('EndMark', parent=S['Body'], alignment=TA_CENTER, textColor=NAVY, fontSize=11)
    )]]
    end_table = Table(end_data, colWidths=[avail * 0.4])
    end_table.setStyle(TableStyle([
        ('LINEABOVE', (0, 0), (-1, 0), 1.5, GOLD),
        ('LINEBELOW', (0, 0), (-1, 0), 1.5, GOLD),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    story.append(end_table)

    # ── Build ───────────────────────────────────────────────────
    doc.build(story)
    print(f"PDF generated: {output_path}")
    size_kb = os.path.getsize(output_path) / 1024
    print(f"File size: {size_kb:.1f} KB")


if __name__ == "__main__":
    output = "/home/z/my-project/reports/infinity-legal-client-report.pdf"
    build_report(output)
