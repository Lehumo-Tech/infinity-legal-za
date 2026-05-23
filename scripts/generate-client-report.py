#!/usr/bin/env python3
"""
Infinity Legal ZA — Comprehensive Client Report Generator
Generates a professional multi-page PDF using ReportLab with navy/gold branding.
"""

import os
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable,
    Frame, PageTemplate, BaseDocTemplate, NextPageTemplate
)
from reportlab.lib.colors import HexColor

# ── Colour Palette ──────────────────────────────────────────────
NAVY      = HexColor("#0c1e3c")
GOLD      = HexColor("#c9a84c")
DARK_GOLD = HexColor("#a88832")
WHITE     = HexColor("#ffffff")
LGRAY     = HexColor("#f4f4f4")
MGRAY     = HexColor("#e0e0e0")
DGRAY     = HexColor("#555555")
BLACK     = HexColor("#222222")
GOLD_BG   = HexColor("#faf6eb")
RED_CONF  = HexColor("#cc3333")

PAGE_W, PAGE_H = A4
MARGIN = 1.8 * cm

# ── Styles ──────────────────────────────────────────────────────
base_styles = getSampleStyleSheet()


def make_styles():
    s = {}
    s['CoverTitle'] = ParagraphStyle(
        'CoverTitle', parent=base_styles['Title'],
        fontName='Helvetica-Bold', fontSize=30, leading=36,
        textColor=WHITE, alignment=TA_CENTER, spaceAfter=10,
    )
    s['CoverSubtitle'] = ParagraphStyle(
        'CoverSubtitle', parent=base_styles['Normal'],
        fontName='Helvetica', fontSize=16, leading=20,
        textColor=GOLD, alignment=TA_CENTER, spaceAfter=6,
    )
    s['CoverDate'] = ParagraphStyle(
        'CoverDate', parent=base_styles['Normal'],
        fontName='Helvetica', fontSize=13, leading=16,
        textColor=HexColor("#aabbcc"), alignment=TA_CENTER,
    )
    s['CoverPrepared'] = ParagraphStyle(
        'CoverPrepared', parent=base_styles['Normal'],
        fontName='Helvetica', fontSize=11, leading=14,
        textColor=HexColor("#8899aa"), alignment=TA_CENTER,
    )
    s['H1'] = ParagraphStyle(
        'H1', parent=base_styles['Heading1'],
        fontName='Helvetica-Bold', fontSize=20, leading=26,
        textColor=NAVY, spaceBefore=18, spaceAfter=10,
        borderColor=GOLD, borderWidth=2, borderPadding=4,
    )
    s['H2'] = ParagraphStyle(
        'H2', parent=base_styles['Heading2'],
        fontName='Helvetica-Bold', fontSize=15, leading=20,
        textColor=NAVY, spaceBefore=14, spaceAfter=6,
    )
    s['H3'] = ParagraphStyle(
        'H3', parent=base_styles['Heading3'],
        fontName='Helvetica-BoldOblique', fontSize=12, leading=16,
        textColor=HexColor("#1a3a6c"), spaceBefore=10, spaceAfter=4,
    )
    s['Body'] = ParagraphStyle(
        'Body', parent=base_styles['Normal'],
        fontName='Helvetica', fontSize=10, leading=14,
        textColor=BLACK, alignment=TA_JUSTIFY, spaceAfter=6,
    )
    s['BodySmall'] = ParagraphStyle(
        'BodySmall', parent=base_styles['Normal'],
        fontName='Helvetica', fontSize=9, leading=12,
        textColor=BLACK, alignment=TA_JUSTIFY, spaceAfter=3,
    )
    s['Bullet'] = ParagraphStyle(
        'Bullet', parent=base_styles['Normal'],
        fontName='Helvetica', fontSize=10, leading=14,
        textColor=BLACK, leftIndent=18, bulletIndent=6, spaceAfter=3,
    )
    s['TableHead'] = ParagraphStyle(
        'TableHead', parent=base_styles['Normal'],
        fontName='Helvetica-Bold', fontSize=9, leading=12,
        textColor=WHITE, alignment=TA_CENTER,
    )
    s['TableCell'] = ParagraphStyle(
        'TableCell', parent=base_styles['Normal'],
        fontName='Helvetica', fontSize=9, leading=12,
        textColor=BLACK,
    )
    s['TableCellCenter'] = ParagraphStyle(
        'TableCellCenter', parent=s['TableCell'],
        alignment=TA_CENTER,
    )
    s['Confidential'] = ParagraphStyle(
        'Confidential', parent=base_styles['Normal'],
        fontName='Helvetica-Bold', fontSize=11, leading=14,
        textColor=RED_CONF, alignment=TA_CENTER,
        spaceBefore=6, spaceAfter=6,
    )
    s['TOCEntry'] = ParagraphStyle(
        'TOCEntry', parent=base_styles['Normal'],
        fontName='Helvetica', fontSize=11, leading=20,
        textColor=NAVY, leftIndent=20,
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


def make_table(headers, rows, col_widths=None):
    avail = PAGE_W - 2 * MARGIN
    n_cols = len(headers)
    if col_widths is None:
        col_widths = [avail / n_cols] * n_cols
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
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, MGRAY),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 1), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]
    for i in range(1, len(data)):
        bg = LGRAY if i % 2 == 0 else WHITE
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))

    t.setStyle(TableStyle(style_cmds))
    return t


def info_box(text, bg=GOLD_BG, border_color=GOLD):
    """Create a highlighted info box."""
    avail = PAGE_W - 2 * MARGIN
    data = [[Paragraph(text, S['BodySmall'])]]
    t = Table(data, colWidths=[avail * 0.92])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), bg),
        ('BOX', (0, 0), (-1, -1), 1.5, border_color),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    return t


# ── Page templates ──────────────────────────────────────────────

def cover_page(canvas_obj, doc):
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
    # Decorative gold lines
    c.setStrokeColor(GOLD)
    c.setLineWidth(1.5)
    c.line(MARGIN * 2, PAGE_H * 0.36, PAGE_W - MARGIN * 2, PAGE_H * 0.36)
    c.line(MARGIN * 2, PAGE_H * 0.56, PAGE_W - MARGIN * 2, PAGE_H * 0.56)
    c.restoreState()


def normal_page(canvas_obj, doc):
    c = canvas_obj
    c.saveState()
    # Header bar
    c.setFillColor(NAVY)
    c.rect(0, PAGE_H - 28, PAGE_W, 28, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, PAGE_H - 31, PAGE_W, 3, fill=1, stroke=0)
    c.setFont('Helvetica-Bold', 8)
    c.setFillColor(WHITE)
    c.drawString(MARGIN, PAGE_H - 20, "Infinity Legal ZA")
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 20, "Intranet Platform Report")
    # Footer
    c.setStrokeColor(GOLD)
    c.setLineWidth(0.8)
    c.line(MARGIN, 30, PAGE_W - MARGIN, 30)
    c.setFont('Helvetica', 7)
    c.setFillColor(DGRAY)
    c.drawString(MARGIN, 18, "CONFIDENTIAL — For authorised personnel only")
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
        title="Infinity Legal ZA — Intranet Platform Report",
        author="Infinity Legal Technology Division",
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
    # COVER PAGE
    # ═══════════════════════════════════════════════════════════
    story.append(Spacer(1, PAGE_H * 0.20))
    story.append(p("Infinity Legal ZA", 'CoverTitle'))
    story.append(Spacer(1, 6))
    story.append(p("Intranet Platform Report", 'CoverTitle'))
    story.append(Spacer(1, 4))
    story.append(p("Comprehensive System Overview &amp; Access Guide", 'CoverSubtitle'))
    story.append(Spacer(1, 40))
    story.append(p("May 2026", 'CoverDate'))
    story.append(Spacer(1, 12))
    story.append(p("Prepared by: Infinity Legal Technology Division", 'CoverPrepared'))
    story.append(Spacer(1, 24))
    story.append(p("CONFIDENTIAL", 'CoverDate'))

    story.append(NextPageTemplate('Normal'))
    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════
    # TABLE OF CONTENTS
    # ═══════════════════════════════════════════════════════════
    story.append(p("Table of Contents", 'H1'))
    story.append(gold_rule())

    toc_items = [
        ("1.", "Executive Summary"),
        ("2.", "System Architecture"),
        ("3.", "Login Credentials"),
        ("4.", "Portal Access by Role"),
        ("5.", "Core Features"),
        ("6.", "Security Features"),
        ("7.", "API Endpoints"),
        ("8.", "Data Summary"),
        ("9.", "Next Steps &amp; Recommendations"),
    ]
    for num, title in toc_items:
        story.append(p(f"<b>{num}</b>&nbsp;&nbsp;&nbsp;{title}", 'TOCEntry'))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════
    # SECTION 1: EXECUTIVE SUMMARY
    # ═══════════════════════════════════════════════════════════
    story.append(p("1. Executive Summary", 'H1'))
    story.append(gold_rule())

    story.append(p(
        "Infinity Legal ZA is a comprehensive, role-based intranet platform designed to centralise "
        "and streamline operations for Infinity Legal (Pty) Ltd, a legal services firm based in South Africa. "
        "The platform provides dedicated interfaces for management, paralegals, sales consultants, HR "
        "personnel, and general staff — each tailored to their specific operational needs and access privileges."
    ))

    story.append(Spacer(1, 8))

    # Key metrics box
    metrics_data = [
        [Paragraph("<b>Platform</b>", S['TableHead']),
         Paragraph("<b>Compliance</b>", S['TableHead']),
         Paragraph("<b>Security</b>", S['TableHead']),
         Paragraph("<b>Portals</b>", S['TableHead']),
         Paragraph("<b>Theme</b>", S['TableHead'])],
        [Paragraph("Next.js 16 +\nPrisma/SQLite", S['TableCellCenter']),
         Paragraph("POPIA\nCompliant", S['TableCellCenter']),
         Paragraph("AES-256\nEncryption", S['TableCellCenter']),
         Paragraph("6 Portal\nViews", S['TableCellCenter']),
         Paragraph("Navy/Gold\n#0c1e3c / #c9a84c", S['TableCellCenter'])],
    ]
    metrics_table = Table(metrics_data, colWidths=[avail * 0.2] * 5)
    metrics_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('BACKGROUND', (0, 1), (-1, 1), GOLD_BG),
        ('GRID', (0, 0), (-1, -1), 0.5, GOLD),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(metrics_table)

    story.append(Spacer(1, 10))
    story.append(p("<b>Key Highlights:</b>", 'H3'))
    for item in [
        "<b>6 Fully Functional Portals:</b> Workbench, Paralegal, Sales, HR, Management, and Staff portals with role-based navigation",
        "<b>16-Tier RBAC:</b> Comprehensive hierarchical role system from Managing Director to Guest with granular permissions",
        "<b>POPIA Compliance:</b> Full data protection compliance with consent logging, PII redaction, and encryption at rest",
        "<b>Navy &amp; Gold Professional Theme:</b> Consistent branding with #0c1e3c (navy) and #c9a84c (gold) throughout",
    ]:
        story.append(bullet(item))

    story.append(Spacer(1, 8))
    # Status indicator
    status_data = [[Paragraph("<b>Platform Status: PRODUCTION READY</b>", S['TableHead'])]]
    status_table = Table(status_data, colWidths=[avail * 0.55])
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
    # SECTION 2: SYSTEM ARCHITECTURE
    # ═══════════════════════════════════════════════════════════
    story.append(p("2. System Architecture", 'H1'))
    story.append(gold_rule())

    story.append(p("2.1 Technology Stack", 'H2'))
    stack_rows = [
        ["Frontend", "Next.js 16 with App Router, React 19, TypeScript"],
        ["Database", "SQLite via Prisma ORM"],
        ["Authentication", "Custom JWT (24h expiry), HMAC-SHA512 password hashing"],
        ["Security", "CSP headers, X-Frame-Options DENY, rate limiting, PII redaction, XSS sanitization"],
        ["Middleware", "Security headers on all routes, CORS locked to same-origin"],
    ]
    story.append(make_table(["Component", "Technology / Implementation"], stack_rows,
                            col_widths=[avail * 0.25, avail * 0.75]))

    story.append(Spacer(1, 10))
    story.append(p("2.2 Architecture Layers", 'H2'))
    arch_rows = [
        ["Client Layer", "React 19 (Next.js 16) + shadcn/ui + Tailwind CSS"],
        ["API Layer", "Next.js API Routes with RBAC middleware"],
        ["Auth Layer", "JWT authentication + HMAC-SHA512 + role-based access control"],
        ["Security Layer", "AES-256-GCM encryption, input sanitization, rate limiting, CSP/HSTS"],
        ["Data Layer", "Prisma ORM with SQLite (production-ready for scaling to PostgreSQL)"],
    ]
    story.append(make_table(["Layer", "Components"], arch_rows,
                            col_widths=[avail * 0.22, avail * 0.78]))

    story.append(Spacer(1, 10))
    story.append(p("2.3 Key Design Decisions", 'H2'))
    for item in [
        "<b>App Router Architecture:</b> Next.js 16 App Router enables server components and streaming SSR for optimal performance",
        "<b>Prisma ORM:</b> Type-safe database access with automatic migrations and seeding",
        "<b>JWT + HMAC-SHA512:</b> Custom authentication with 24-hour token expiry and timing-safe password verification",
        "<b>Security Headers:</b> All routes enforce CSP, X-Frame-Options DENY, and CORS same-origin at the middleware level",
        "<b>POPIA Compliance:</b> All personal data handling follows South African data protection regulations",
    ]:
        story.append(bullet(item))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════
    # SECTION 3: LOGIN CREDENTIALS
    # ═══════════════════════════════════════════════════════════
    story.append(p("3. Login Credentials", 'H1'))
    story.append(gold_rule())

    # Confidential warning
    conf_data = [[Paragraph(
        "<b>&#9888; CONFIDENTIAL — This section contains login credentials. "
        "Do not distribute outside the firm.</b>", S['Confidential']
    )]]
    conf_table = Table(conf_data, colWidths=[avail * 0.92])
    conf_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), HexColor("#fff0f0")),
        ('BOX', (0, 0), (-1, -1), 2, RED_CONF),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(conf_table)
    story.append(Spacer(1, 10))

    story.append(info_box(
        "<b>Default Password for All Users: Password123!</b><br/><br/>"
        "In production, each user must set their own password on first login. "
        "The system enforces a 90-day password expiry policy. Passwords must meet "
        "minimum complexity requirements (8+ characters, uppercase, lowercase, number, special character)."
    ))
    story.append(Spacer(1, 10))

    cred_rows = [
        ["Managing Director", "md@infinitylegal.co.za", "Thabo Molefe"],
        ["Senior Partner", "partner@infinitylegal.co.za", "Nomsa Dlamini"],
        ["Associate", "associate@infinitylegal.co.za", "Sipho Nkosi"],
        ["Paralegal", "paralegal@infinitylegal.co.za", "Lindiwe Mthembu"],
        ["Legal Officer", "officer@infinitylegal.co.za", "Bongani Khumalo"],
        ["Systems Admin", "admin@infinitylegal.co.za", "Tech Admin"],
        ["Senior Consultant", "consultant@infinitylegal.co.za", "Zanele Mokoena"],
        ["Client", "client1@example.co.za", "John Citizen"],
        ["Client", "client2@example.co.za", "Mary Smith"],
        ["Client", "client3@example.co.za", "David Ndlovu"],
    ]
    story.append(make_table(
        ["Role", "Email", "Name"],
        cred_rows,
        col_widths=[avail * 0.25, avail * 0.40, avail * 0.35]
    ))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════
    # SECTION 4: PORTAL ACCESS BY ROLE
    # ═══════════════════════════════════════════════════════════
    story.append(p("4. Portal Access by Role", 'H1'))
    story.append(gold_rule())

    story.append(p(
        "The following matrix details which portals and features are accessible to each role category. "
        "Access is enforced at both the UI navigation level and the API endpoint level to prevent unauthorised access."
    ))

    story.append(Spacer(1, 8))

    # Managing Director / Senior Partner
    story.append(p("Managing Director / Senior Partner — Full access to all portals", 'H2'))
    for item in [
        "Workbench, Cases, Consultations, Leads, Documents, Tasks, Staff Portal, Org Structure, Analytics, Pricing"
    ]:
        story.append(bullet(item))

    # Associate / Legal Officer
    story.append(p("Associate / Legal Officer — Legal practice focus", 'H2'))
    for item in [
        "Workbench, Cases, Consultations, Leads, Documents, Tasks, Staff Portal, Org Structure, Pricing"
    ]:
        story.append(bullet(item))

    # Paralegal
    story.append(p("Paralegal — Case support &amp; documentation", 'H2'))
    for item in [
        "Workbench, Cases, Consultations, Documents, Tasks, Staff Portal, Org Structure, Pricing"
    ]:
        story.append(bullet(item))

    # Systems Admin
    story.append(p("Systems Admin — Full system access", 'H2'))
    for item in [
        "Workbench, Cases, Consultations, Leads, Documents, Tasks, Staff Portal, Org Structure, Analytics, Pricing"
    ]:
        story.append(bullet(item))

    # HR Manager / Finance Manager
    story.append(p("HR Manager / Finance Manager — Firm management", 'H2'))
    for item in [
        "Workbench, Cases, Consultations, Documents, Tasks, Staff Portal, Org Structure, Pricing"
    ]:
        story.append(bullet(item))

    # Receptionist / Office Admin
    story.append(p("Receptionist / Office Admin — Lead intake", 'H2'))
    for item in [
        "Workbench, Cases, Consultations, Leads, Documents, Tasks, Pricing"
    ]:
        story.append(bullet(item))

    # Client
    story.append(p("Client — Limited access", 'H2'))
    for item in [
        "Workbench, Pricing only"
    ]:
        story.append(bullet(item))

    story.append(Spacer(1, 12))

    # Permission matrix table
    story.append(p("4.1 Permission Matrix", 'H2'))
    story.append(p(
        "The following matrix shows feature access by role category. "
        "Access levels: <b>Full</b> = Full access, <b>R</b> = Read-only, "
        "<b>RW</b> = Read-Write, <b>&#8212;</b> = No Access"
    ))

    perm_headers = ["Feature", "MD/SP", "Assoc/LO", "Para-legal", "Admin", "HR/Fin", "Recep.", "Client"]
    perm_rows = [
        ["Workbench", "Full", "R", "R", "Full", "R", "R", "R"],
        ["Cases", "Full", "RW", "RW", "Full", "R", "R", "&#8212;"],
        ["Consultations", "Full", "RW", "RW", "Full", "R", "RW", "&#8212;"],
        ["Leads", "Full", "RW", "&#8212;", "Full", "&#8212;", "RW", "&#8212;"],
        ["Documents", "Full", "RW", "RW", "Full", "R", "R", "&#8212;"],
        ["Tasks", "Full", "RW", "RW", "Full", "RW", "RW", "&#8212;"],
        ["Staff Portal", "Full", "R", "R", "Full", "Full", "R", "&#8212;"],
        ["Org Structure", "Full", "R", "R", "Full", "Full", "R", "&#8212;"],
        ["Analytics", "Full", "&#8212;", "&#8212;", "Full", "&#8212;", "&#8212;", "&#8212;"],
        ["Pricing", "Full", "R", "R", "Full", "R", "R", "R"],
    ]
    story.append(make_table(perm_headers, perm_rows,
                            col_widths=[avail * 0.18, avail * 0.11, avail * 0.11,
                                        avail * 0.11, avail * 0.11, avail * 0.11,
                                        avail * 0.11, avail * 0.11]))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════
    # SECTION 5: CORE FEATURES
    # ═══════════════════════════════════════════════════════════
    story.append(p("5. Core Features", 'H1'))
    story.append(gold_rule())

    # 5.1 Workbench Dashboard
    story.append(p("5.1 Workbench Dashboard", 'H2'))
    story.append(p(
        "The Workbench serves as the central command centre for the firm. It provides an at-a-glance "
        "overview of firm operations and is accessible to all authenticated users with role-personalised views."
    ))
    for f in [
        "<b>KPIs:</b> Total cases, active leads, revenue figures, and task counts displayed as summary cards",
        "<b>Quick Actions:</b> One-click access to create cases, add leads, assign tasks, and log consultations",
        "<b>Upcoming Consultations:</b> Calendar-based view of scheduled client meetings with time and case details",
        "<b>Task Overview:</b> Priority-sorted task overview with assignee information and due dates",
        "<b>Case Distribution Chart:</b> Visual breakdown of cases by type and status",
        "<b>Firm Health Status:</b> Revenue trends, case resolution rates, lead conversion metrics, and staff utilisation",
    ]:
        story.append(bullet(f))

    story.append(Spacer(1, 6))

    # 5.2 Case Management
    story.append(p("5.2 Case Management", 'H2'))
    story.append(p(
        "Full case lifecycle management with 15 case types, comprehensive matter tracking, and "
        "AI-assisted analysis capabilities."
    ))
    for f in [
        "<b>15 Case Types:</b> Family Law, Civil Litigation, Criminal Defence, Conveyancing, Estate Planning, Corporate, and more",
        "<b>Matter Numbering:</b> Auto-generated format IL-YYYY-NNNN for unique case identification",
        "<b>Status Workflow:</b> Intake → Pending Review → Active → On Hold → Settled → Closed → Archived",
        "<b>Urgency Levels:</b> Critical, High, Medium, Low classification with visual indicators",
        "<b>Estimated Values:</b> Financial tracking with case value estimation and monitoring",
        "<b>AI Analysis Field:</b> Dedicated field for AI-assisted case analysis and insights",
    ]:
        story.append(bullet(f))

    story.append(Spacer(1, 6))

    # 5.3 Lead Management
    story.append(p("5.3 Lead Management", 'H2'))
    for f in [
        "<b>7 Lead Sources:</b> Website, Referral, Walk-in, Social Media, Cold Call, Advertisement, Other",
        "<b>7 Status Stages:</b> New → Contacted → Qualified → Proposal → Negotiation → Won → Lost",
        "<b>Lead Scoring:</b> Automated scoring system based on engagement, budget, and timeline indicators",
        "<b>SLA Deadlines:</b> Configurable service-level agreement deadlines for follow-up actions",
        "<b>Assignment:</b> Paralegal and officer assignment for lead progression and conversion",
    ]:
        story.append(bullet(f))

    story.append(Spacer(1, 6))

    # 5.4 Consultation Logging
    story.append(p("5.4 Consultation Logging", 'H2'))
    for f in [
        "<b>Meeting Types:</b> In-person, Video Call, Phone Call with full scheduling support",
        "<b>Scheduling:</b> Date, time, and duration tracking with case linkage",
        "<b>Notes:</b> Comprehensive consultation notes with follow-up action items",
        "<b>Status Tracking:</b> Scheduled → Completed → Cancelled → No-show workflow",
    ]:
        story.append(bullet(f))

    story.append(Spacer(1, 6))

    # 5.5 Document Management
    story.append(p("5.5 Document Management", 'H2'))
    for f in [
        "<b>Upload &amp; Version Tracking:</b> Secure file upload with automatic version control",
        "<b>Workflow States:</b> Draft → Review → Approved → Signed → Filed → Archived",
        "<b>Document Locking:</b> Prevent concurrent editing with document lock mechanism",
        "<b>11 Document Types:</b> Contract, Affidavit, Court Filing, Correspondence, Memo, Plea, Pleading, Report, Will, Agreement, Other",
    ]:
        story.append(bullet(f))

    story.append(Spacer(1, 6))

    # 5.6 Task Management
    story.append(p("5.6 Task Management", 'H2'))
    for f in [
        "<b>Priority Levels:</b> Urgent, High, Medium, Low with visual indicators and sorting",
        "<b>Due Dates:</b> Deadline tracking with overdue alerts and reminders",
        "<b>Case Linking:</b> Associate tasks with specific cases for context",
        "<b>Assignment Tracking:</b> Assign tasks to team members with progress monitoring",
        "<b>Status Flow:</b> Pending → In Progress → Completed → Cancelled workflow",
    ]:
        story.append(bullet(f))

    story.append(Spacer(1, 6))

    # 5.7 Staff Portal
    story.append(p("5.7 Staff Portal", 'H2'))
    for f in [
        "<b>Directory:</b> Searchable directory of all employees with contact information and roles",
        "<b>Org Chart:</b> Visual organisational hierarchy showing reporting lines",
        "<b>Department Grouping:</b> Browse staff by department (Legal, Consulting, Administration, IT)",
        "<b>Supervisor Hierarchy:</b> Define and view reporting relationships between staff members",
    ]:
        story.append(bullet(f))

    story.append(Spacer(1, 6))

    # 5.8 Analytics
    story.append(p("5.8 Analytics", 'H2'))
    for f in [
        "<b>Case Distribution:</b> Visual breakdown by case type and status",
        "<b>Lead Source Analysis:</b> Track lead generation channels and conversion rates",
        "<b>Revenue Tracking:</b> Real-time revenue figures by case type, lead source, and time period",
        "<b>Attorney Count:</b> Verified attorney profiles with LPC numbers and specialisations",
    ]:
        story.append(bullet(f))

    story.append(Spacer(1, 6))

    # 5.9 Pricing
    story.append(p("5.9 Pricing Plans", 'H2'))
    price_rows = [
        ["Civil Legal Plan", "R99/month", "Family law, maintenance, domestic violence, basic legal advice"],
        ["Labour Legal Plan", "R99/month", "Unfair dismissal, CCMA representation, employment contracts, workplace disputes"],
        ["Extensive Plan", "R139/month", "All Civil + Labour, criminal matters, traffic offences, property transfers, estates"],
    ]
    story.append(make_table(
        ["Plan", "Price", "Key Coverage"],
        price_rows,
        col_widths=[avail * 0.22, avail * 0.15, avail * 0.63]
    ))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════
    # SECTION 6: SECURITY FEATURES
    # ═══════════════════════════════════════════════════════════
    story.append(p("6. Security Features", 'H1'))
    story.append(gold_rule())

    story.append(p(
        "The Infinity Legal Intranet Portal implements a multi-layered security architecture designed "
        "to protect sensitive legal data and ensure compliance with South African data protection regulations (POPIA)."
    ))

    story.append(Spacer(1, 6))

    sec_rows = [
        ["RBAC", "16-tier Role-Based Access Control with granular permissions (22 permission types)"],
        ["JWT Tokens", "24-hour token expiry with secure HTTP-only cookie storage"],
        ["Password Hashing", "HMAC-SHA512 with 32-byte salt for all password storage"],
        ["Password Expiry", "90-day password expiry policy enforced across all accounts"],
        ["Field Encryption", "AES-256-GCM field-level encryption for sensitive data at rest"],
        ["API Rate Limiting", "60 requests/min for API endpoints"],
        ["Auth Rate Limiting", "5 requests per 5 minutes for authentication endpoints"],
        ["Signup Rate Limiting", "3 signups per hour to prevent mass account creation"],
        ["Upload Rate Limiting", "10 uploads per minute for document file uploads"],
        ["Input Sanitization", "XSS, SQL injection, and script injection pattern detection and mitigation"],
        ["PII Redaction", "Automatic redaction of SA ID numbers, phone numbers, credit cards, and emails in logs"],
        ["Keyword Detection", "High-risk keyword detection for criminal case content"],
        ["Audit Logging", "Comprehensive logging of all user actions with timestamps and IP addresses"],
        ["POPIA Consent", "Consent logging for all data processing activities"],
        ["Security Headers", "CSP, X-Frame-Options DENY, HSTS (2yr preload), X-Content-Type-Options nosniff"],
        ["CORS Policy", "Locked to same-origin to prevent cross-origin attacks"],
        ["Session Timeout", "30-minute idle timeout for automatic session expiration"],
    ]
    story.append(make_table(["Feature", "Implementation Detail"], sec_rows,
                            col_widths=[avail * 0.22, avail * 0.78]))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════
    # SECTION 7: API ENDPOINTS
    # ═══════════════════════════════════════════════════════════
    story.append(p("7. API Endpoints", 'H1'))
    story.append(gold_rule())

    story.append(p(
        "The following RESTful API endpoints are available. All endpoints (except /api/health and "
        "/api/auth/login) require a valid JWT token and enforce role-based access control."
    ))

    api_rows = [
        ["POST /api/auth/login", "Authentication — returns JWT token and user profile"],
        ["POST /api/auth/signup", "User registration with POPIA consent"],
        ["GET /api/dashboard", "Dashboard statistics — cases, leads, revenue, tasks"],
        ["GET /api/cases", "Case listing with pagination and search"],
        ["GET /api/leads", "Lead listing with pagination"],
        ["GET /api/documents", "Document listing and management"],
        ["GET /api/tasks", "Task listing and management"],
        ["GET /api/consultations", "Consultation listing and management"],
        ["GET /api/staff", "Staff directory with org structure"],
        ["GET /api/notifications", "User notifications"],
        ["GET /api/analytics", "Firm analytics data"],
        ["GET /api/report", "This PDF report generation"],
        ["GET /api/health", "System health check (database, API status)"],
        ["GET /api/backup", "Database backup endpoint"],
    ]
    story.append(make_table(
        ["Endpoint", "Description"],
        api_rows,
        col_widths=[avail * 0.32, avail * 0.68]
    ))

    story.append(Spacer(1, 12))
    story.append(p("7.1 Authentication Flow", 'H2'))
    for step in [
        "Client sends POST to /api/auth/login with email and password",
        "Server validates credentials using HMAC-SHA512 with timing-safe comparison",
        "On success, server returns a JWT token (24-hour expiry) and user profile",
        "Client stores the token and includes it in the Authorization header for subsequent requests",
        "All protected endpoints validate the token and check role-based permissions",
        "Expired tokens require re-authentication; session timeout after 30 minutes of inactivity",
    ]:
        story.append(bullet(step))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════
    # SECTION 8: DATA SUMMARY
    # ═══════════════════════════════════════════════════════════
    story.append(p("8. Data Summary", 'H1'))
    story.append(gold_rule())

    story.append(p(
        "The system has been pre-populated with realistic sample data for testing and demonstration purposes. "
        "The following summary reflects the current data state."
    ))

    story.append(Spacer(1, 8))

    data_rows = [
        ["Users", "10 (7 staff + 3 clients)"],
        ["Cases", "15 across 5 practice areas"],
        ["Leads", "10 from multiple sources"],
        ["Pricing Plans", "3 (Civil R99, Labour R99, Extensive R139)"],
        ["Notifications", "25+ across staff members"],
        ["Tasks", "8 with various priorities"],
        ["Audit Log Entries", "20 system activity records"],
        ["Attorney Profiles", "3 verified with LPC numbers"],
    ]
    story.append(make_table(
        ["Metric", "Value"],
        data_rows,
        col_widths=[avail * 0.35, avail * 0.65]
    ))

    story.append(Spacer(1, 12))

    story.append(p("8.1 Case Distribution", 'H2'))
    case_dist_rows = [
        ["Family Law", "3 cases"],
        ["Civil Litigation", "3 cases"],
        ["Criminal Defence", "3 cases"],
        ["Conveyancing", "2 cases"],
        ["Estate Planning", "2 cases"],
        ["Corporate", "2 cases"],
    ]
    story.append(make_table(
        ["Case Type", "Count"],
        case_dist_rows,
        col_widths=[avail * 0.5, avail * 0.5]
    ))

    story.append(Spacer(1, 12))

    story.append(p("8.2 Lead Sources", 'H2'))
    lead_source_rows = [
        ["Website", "3 leads"],
        ["Referral", "2 leads"],
        ["Walk-in", "2 leads"],
        ["Social Media", "1 lead"],
        ["Cold Call", "1 lead"],
        ["Advertisement", "1 lead"],
    ]
    story.append(make_table(
        ["Source", "Count"],
        lead_source_rows,
        col_widths=[avail * 0.5, avail * 0.5]
    ))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════
    # SECTION 9: NEXT STEPS & RECOMMENDATIONS
    # ═══════════════════════════════════════════════════════════
    story.append(p("9. Next Steps &amp; Recommendations", 'H1'))
    story.append(gold_rule())

    story.append(p(
        "The following recommendations are provided for the production deployment and ongoing "
        "enhancement of the Infinity Legal ZA Intranet Platform."
    ))

    story.append(Spacer(1, 8))

    recommendations = [
        ("<b>1. Production Deployment:</b>", "Configure environment variable management via Vercel dashboard. "
         "Generate new JWT_SECRET and ENCRYPTION_KEY for production. Never commit secrets to the repository."),
        ("<b>2. SSL/TLS Certificate:</b>", "Ensure SSL/TLS certificates are properly configured for the production "
         "domain. Vercel provides automatic SSL, but custom domains require DNS validation."),
        ("<b>3. Database Backup Scheduling:</b>", "Implement automated backup scheduling using the /api/backup "
         "endpoint. Store backups in a secure, off-site location with encryption at rest."),
        ("<b>4. Email Notification Integration:</b>", "Integrate email service (SendGrid, AWS SES, or similar) "
         "for automated notifications on case updates, consultation reminders, and task assignments."),
        ("<b>5. Document Storage:</b>", "Migrate file storage from local filesystem to cloud storage (AWS S3 "
         "or Cloudflare R2) for production scalability and durability."),
        ("<b>6. Two-Factor Authentication:</b>", "Implement TOTP-based 2FA for enhanced security, particularly "
         "for admin and management accounts accessing sensitive data."),
        ("<b>7. Mobile-Responsive Testing:</b>", "Conduct comprehensive testing across mobile devices and tablets "
         "to ensure full functionality on all screen sizes and platforms."),
        ("<b>8. Load Testing:</b>", "Perform load testing to verify the system handles concurrent users "
         "effectively. Target: 50+ simultaneous users with sub-2-second response times."),
    ]

    for title, desc in recommendations:
        story.append(p(title, 'H3'))
        story.append(p(desc))

    story.append(Spacer(1, 16))

    # Closing statement
    story.append(HRFlowable(width="100%", thickness=1.5, color=GOLD, spaceBefore=10, spaceAfter=10))

    close_data = [[Paragraph(
        "<b>For questions or support, contact the Infinity Legal Technology Division.</b><br/><br/>"
        "This report was generated on " + datetime.now().strftime('%d %B %Y at %H:%M') + " SAST.<br/>"
        "CONFIDENTIAL — Infinity Legal (Pty) Ltd — All Rights Reserved",
        S['BodySmall']
    )]]
    close_table = Table(close_data, colWidths=[avail * 0.92])
    close_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), GOLD_BG),
        ('BOX', (0, 0), (-1, -1), 1.5, GOLD),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
    ]))
    story.append(close_table)

    # ── Build PDF ──────────────────────────────────────────────
    doc.build(story)
    return output_path


if __name__ == '__main__':
    output = '/home/z/my-project/reports/infinity-legal-client-report.pdf'
    os.makedirs(os.path.dirname(output), exist_ok=True)
    result = build_report(output)
    size_kb = os.path.getsize(result) / 1024
    print(f"PDF report generated: {result}")
    print(f"File size: {size_kb:.1f} KB")
