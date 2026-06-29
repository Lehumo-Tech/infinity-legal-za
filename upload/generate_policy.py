#!/usr/bin/env python3
"""
Infinity Legal SA - Personal Legal Services Subscription Agreement
Body PDF generator (ReportLab).

This script builds the body of a legal-services subscription agreement. The
cover is rendered separately as HTML -> PDF and merged afterwards via pypdf.

Infinity Legal SA is a legal SERVICES company, NOT an insurance company.
This document contains NO insurance terminology (no premium, no cover, no
insured, no claim, no underwriter, no FSP, no policy, no waiting period).
It uses "legal advisor" terminology throughout (never "attorney").

Brand:
  - Primary Navy  #0c1e3c   (section headings, primary text)
  - Accent Gold   #c9a84c   (rules, dividers, accents)
  - Navy tint     #f0f4f8   (callout box backgrounds)
  - Text dark     #081428   (body text)

Fonts:
  - Liberation Serif (body) and Liberation Sans Bold (headings).

Output: /home/z/my-project/upload/body.pdf
"""

import os
import sys
import hashlib

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, mm, cm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    KeepTogether, CondPageBreak, HRFlowable, Flowable, ListFlowable, ListItem,
)
from reportlab.platypus.tableofcontents import TableOfContents

# ---------------------------------------------------------------------------
# Brand palette
# ---------------------------------------------------------------------------
NAVY        = colors.HexColor('#0c1e3c')
NAVY_DARK   = colors.HexColor('#081428')
NAVY_LIGHT  = colors.HexColor('#132d52')
NAVY_700    = colors.HexColor('#1a3358')
NAVY_50     = colors.HexColor('#f0f4f8')
NAVY_100    = colors.HexColor('#dbe4ed')
NAVY_200    = colors.HexColor('#b8c9dc')

GOLD        = colors.HexColor('#c9a84c')
GOLD_DARK   = colors.HexColor('#a88832')
GOLD_LIGHT  = colors.HexColor('#dfc475')
GOLD_50     = colors.HexColor('#fdf8ed')

TEXT_PRIMARY = NAVY_DARK
TEXT_MUTED   = colors.HexColor('#5a6a82')
BORDER       = colors.HexColor('#c5d1e0')

TABLE_HEADER_BG    = NAVY
TABLE_HEADER_TEXT  = colors.white
TABLE_ROW_EVEN     = colors.white
TABLE_ROW_ODD      = NAVY_50

# ---------------------------------------------------------------------------
# Font registration — Liberation Serif (body) + Liberation Sans (headings)
# ---------------------------------------------------------------------------
FONT_DIR = '/usr/share/fonts/truetype/liberation'

pdfmetrics.registerFont(TTFont('LibSerif',          f'{FONT_DIR}/LiberationSerif-Regular.ttf'))
pdfmetrics.registerFont(TTFont('LibSerif-Bold',     f'{FONT_DIR}/LiberationSerif-Bold.ttf'))
pdfmetrics.registerFont(TTFont('LibSerif-Italic',   f'{FONT_DIR}/LiberationSerif-Italic.ttf'))
pdfmetrics.registerFont(TTFont('LibSerif-BoldItalic', f'{FONT_DIR}/LiberationSerif-BoldItalic.ttf'))

pdfmetrics.registerFont(TTFont('LibSans',           f'{FONT_DIR}/LiberationSans-Regular.ttf'))
pdfmetrics.registerFont(TTFont('LibSans-Bold',      f'{FONT_DIR}/LiberationSans-Bold.ttf'))
pdfmetrics.registerFont(TTFont('LibSans-Italic',    f'{FONT_DIR}/LiberationSans-Italic.ttf'))
pdfmetrics.registerFont(TTFont('LibSans-BoldItalic', f'{FONT_DIR}/LiberationSans-BoldItalic.ttf'))

registerFontFamily('LibSerif',
    normal='LibSerif', bold='LibSerif-Bold',
    italic='LibSerif-Italic', boldItalic='LibSerif-BoldItalic')
registerFontFamily('LibSans',
    normal='LibSans', bold='LibSans-Bold',
    italic='LibSans-Italic', boldItalic='LibSans-BoldItalic')

# ---------------------------------------------------------------------------
# Page geometry
# ---------------------------------------------------------------------------
PAGE_W, PAGE_H = A4
MARGIN_L = 0.85 * inch
MARGIN_R = 0.85 * inch
MARGIN_T = 0.85 * inch
MARGIN_B = 0.95 * inch
CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R   # ~430pt
CONTENT_H = PAGE_H - MARGIN_T - MARGIN_B

# ---------------------------------------------------------------------------
# Paragraph styles
# ---------------------------------------------------------------------------
BODY = ParagraphStyle(
    'Body', fontName='LibSerif', fontSize=10.5, leading=15.5,
    textColor=TEXT_PRIMARY, alignment=TA_JUSTIFY, spaceAfter=7,
)
BODY_LEFT = ParagraphStyle(
    'BodyLeft', parent=BODY, alignment=TA_LEFT,
)
SMALL = ParagraphStyle(
    'Small', fontName='LibSerif', fontSize=9, leading=12.5,
    textColor=TEXT_MUTED, alignment=TA_LEFT,
)
ITALIC_NOTE = ParagraphStyle(
    'ItalicNote', parent=BODY, fontName='LibSerif-Italic',
    fontSize=10, leading=14, textColor=NAVY_LIGHT, alignment=TA_LEFT,
    spaceBefore=2, spaceAfter=8, leftIndent=10, rightIndent=10,
)
DEFINITION = ParagraphStyle(
    'Definition', parent=BODY, fontName='LibSerif-Italic',
    fontSize=9.8, leading=14, textColor=NAVY_LIGHT,
    alignment=TA_LEFT, leftIndent=14, rightIndent=14,
    spaceBefore=3, spaceAfter=8,
)

H1 = ParagraphStyle(
    'H1', fontName='LibSans-Bold', fontSize=15, leading=19,
    textColor=NAVY, alignment=TA_LEFT, spaceBefore=4, spaceAfter=4,
)
H2 = ParagraphStyle(
    'H2', fontName='LibSans-Bold', fontSize=12, leading=16,
    textColor=NAVY, alignment=TA_LEFT, spaceBefore=10, spaceAfter=4,
)
H3 = ParagraphStyle(
    'H3', fontName='LibSans-Bold', fontSize=10.5, leading=14,
    textColor=NAVY_LIGHT, alignment=TA_LEFT, spaceBefore=6, spaceAfter=3,
)
KICKER = ParagraphStyle(
    'Kicker', fontName='LibSans-Bold', fontSize=8.5, leading=11,
    textColor=GOLD_DARK, alignment=TA_LEFT, spaceBefore=0, spaceAfter=2,
)

BULLET = ParagraphStyle(
    'Bullet', parent=BODY, alignment=TA_LEFT, leftIndent=18,
    bulletIndent=4, spaceAfter=4,
)
NUMBERED = ParagraphStyle(
    'Numbered', parent=BODY, alignment=TA_JUSTIFY, leftIndent=22,
    bulletIndent=2, spaceAfter=5,
)
LETTERED = ParagraphStyle(
    'Lettered', parent=BODY, alignment=TA_JUSTIFY, leftIndent=22,
    bulletIndent=2, spaceAfter=4,
)

CALLOUT_TITLE = ParagraphStyle(
    'CalloutTitle', fontName='LibSans-Bold', fontSize=9.5, leading=12,
    textColor=NAVY, alignment=TA_LEFT, spaceAfter=3,
)
CALLOUT_BODY = ParagraphStyle(
    'CalloutBody', fontName='LibSerif', fontSize=9.8, leading=13.5,
    textColor=NAVY_DARK, alignment=TA_LEFT, spaceAfter=3,
)

TABLE_HEADER = ParagraphStyle(
    'TableHeader', fontName='LibSans-Bold', fontSize=9.5, leading=12,
    textColor=colors.white, alignment=TA_LEFT,
)
TABLE_HEADER_CENTER = ParagraphStyle(
    'TableHeaderCenter', fontName='LibSans-Bold', fontSize=9.5, leading=12,
    textColor=colors.white, alignment=TA_CENTER,
)
TABLE_CELL = ParagraphStyle(
    'TableCell', fontName='LibSerif', fontSize=9.5, leading=12.5,
    textColor=NAVY_DARK, alignment=TA_LEFT,
)
TABLE_CELL_CENTER = ParagraphStyle(
    'TableCellCenter', parent=TABLE_CELL, alignment=TA_CENTER,
)
TABLE_CELL_BOLD = ParagraphStyle(
    'TableCellBold', fontName='LibSans-Bold', fontSize=9.5, leading=12.5,
    textColor=NAVY, alignment=TA_LEFT,
)
TABLE_CELL_BOLD_CENTER = ParagraphStyle(
    'TableCellBoldCenter', parent=TABLE_CELL_BOLD, alignment=TA_CENTER,
)

TOC_HEADING = ParagraphStyle(
    'TOCHeading', fontName='LibSans-Bold', fontSize=22, leading=26,
    textColor=NAVY, alignment=TA_LEFT, spaceBefore=0, spaceAfter=4,
)
TOC_SUB = ParagraphStyle(
    'TOCSub', fontName='LibSerif-Italic', fontSize=10.5, leading=14,
    textColor=GOLD_DARK, alignment=TA_LEFT, spaceAfter=12,
)
TOC_LEVEL0 = ParagraphStyle(
    'TOCLevel0', fontName='LibSans-Bold', fontSize=10.5, leading=18,
    textColor=NAVY, leftIndent=0, rightIndent=20,
)
TOC_LEVEL1 = ParagraphStyle(
    'TOCLevel1', fontName='LibSerif', fontSize=10, leading=15,
    textColor=TEXT_PRIMARY, leftIndent=18, rightIndent=20,
)

COVER_LIKE_TITLE = ParagraphStyle(
    'CoverLikeTitle', fontName='LibSans-Bold', fontSize=20, leading=24,
    textColor=NAVY, alignment=TA_LEFT, spaceAfter=4,
)

REG_BODY = ParagraphStyle(
    'RegBody', parent=BODY, fontSize=9.5, leading=13.5, alignment=TA_LEFT,
)

# ---------------------------------------------------------------------------
# Custom flowables
# ---------------------------------------------------------------------------
class GoldRule(Flowable):
    """A thin gold horizontal rule."""
    def __init__(self, width=None, thickness=2.0, color=GOLD):
        super().__init__()
        self.width = width
        self.thickness = thickness
        self.color = color
        self.height = thickness

    def wrap(self, availWidth, availHeight):
        self._w = self.width or availWidth
        return (self._w, self.height)

    def draw(self):
        c = self.canv
        c.setFillColor(self.color)
        c.setStrokeColor(self.color)
        c.rect(0, 0, self._w, self.thickness, stroke=0, fill=1)


class SectionHeader(Flowable):
    """Big section header with navy heading, gold rule underneath, and
    a small 'SECTION N' kicker label. Used as an H1-level bookmark target."""
    def __init__(self, number, title, key=None):
        super().__init__()
        self.number = number
        self.title = title
        self.key = key or f'sec_{number}'
        self.bookmark_name = self.key
        self.bookmark_level = 0
        self.bookmark_text = f'Section {number}: {title}'
        self.bookmark_key = self.key
        self.height = 64

    def wrap(self, availWidth, availHeight):
        self._w = availWidth
        return (self._w, self.height)

    def draw(self):
        c = self.canv
        c.bookmarkPage(self.key)
        # Kicker
        c.setFont('LibSans-Bold', 8.5)
        c.setFillColor(GOLD_DARK)
        c.drawString(0, self.height - 12, f'SECTION {self.number}'.upper())
        # Title — auto-shrink if too wide
        title_size = 16
        title_w = c.stringWidth(self.title, 'LibSans-Bold', title_size)
        max_w = CONTENT_W
        while title_w > max_w and title_size > 12:
            title_size -= 0.5
            title_w = c.stringWidth(self.title, 'LibSans-Bold', title_size)
        c.setFont('LibSans-Bold', title_size)
        c.setFillColor(NAVY)
        c.drawString(0, self.height - 32, self.title)
        # Gold rule
        c.setFillColor(GOLD)
        c.rect(0, self.height - 44, 60, 2.5, stroke=0, fill=1)
        # Thin lighter rule across the rest
        c.setFillColor(NAVY_200)
        c.rect(64, self.height - 43.5, self._w - 64, 1.2, stroke=0, fill=1)


class PageHeader(Flowable):
    """Header used on intro/contact pages (not a numbered section)."""
    def __init__(self, kicker, title, key=None):
        super().__init__()
        self.kicker = kicker
        self.title = title
        self.key = key or 'pg_' + hashlib.md5(title.encode()).hexdigest()[:8]
        self.bookmark_name = self.key
        self.bookmark_level = 0
        self.bookmark_text = title
        self.bookmark_key = self.key
        self.height = 64

    def wrap(self, availWidth, availHeight):
        self._w = availWidth
        return (self._w, self.height)

    def draw(self):
        c = self.canv
        c.bookmarkPage(self.key)
        c.setFont('LibSans-Bold', 8.5)
        c.setFillColor(GOLD_DARK)
        c.drawString(0, self.height - 12, self.kicker.upper())
        title_size = 18
        title_w = c.stringWidth(self.title, 'LibSans-Bold', title_size)
        max_w = CONTENT_W
        while title_w > max_w and title_size > 12:
            title_size -= 0.5
            title_w = c.stringWidth(self.title, 'LibSans-Bold', title_size)
        c.setFont('LibSans-Bold', title_size)
        c.setFillColor(NAVY)
        c.drawString(0, self.height - 34, self.title)
        c.setFillColor(GOLD)
        c.rect(0, self.height - 46, 60, 2.5, stroke=0, fill=1)
        c.setFillColor(NAVY_200)
        c.rect(64, self.height - 45.5, self._w - 64, 1.2, stroke=0, fill=1)


class CalloutBox(Flowable):
    """Light navy tinted box for NOTE: / EXAMPLE: callouts."""
    def __init__(self, title, body_paragraphs, width=None,
                 bg=NAVY_50, border=GOLD):
        super().__init__()
        self.title = title
        self.body_paragraphs = body_paragraphs if isinstance(body_paragraphs, list) \
            else [body_paragraphs]
        self.width = width
        self.bg = bg
        self.border = border
        self._para_width = None
        self._cached_height = None

    def wrap(self, availWidth, availHeight):
        self._w = self.width or availWidth
        inner_w = self._w - 24
        self._para_width = inner_w
        total_h = 14
        title_p = Paragraph(f'<b>{self.title}</b>', CALLOUT_TITLE)
        _, th = title_p.wrap(inner_w, availHeight)
        total_h += th + 4
        self._title_para = title_p
        self._wrapped_body = []
        for p in self.body_paragraphs:
            if isinstance(p, str):
                p = Paragraph(p, CALLOUT_BODY)
            _, ph = p.wrap(inner_w, availHeight)
            self._wrapped_body.append((p, ph))
            total_h += ph + 3
        total_h += 8
        self.height = total_h
        return (self._w, self.height)

    def draw(self):
        c = self.canv
        c.setFillColor(self.bg)
        c.setStrokeColor(self.border)
        c.setLineWidth(0)
        c.rect(0, 0, self._w, self.height, stroke=0, fill=1)
        c.setFillColor(self.border)
        c.rect(0, 0, 4, self.height, stroke=0, fill=1)
        x = 14
        y = self.height - 14
        _, th = self._title_para.wrap(self._para_width, self.height)
        self._title_para.drawOn(c, x, y - th)
        y -= th + 6
        for p, ph in self._wrapped_body:
            p.drawOn(c, x, y - ph)
            y -= ph + 3


# ---------------------------------------------------------------------------
# Page header / footer
# ---------------------------------------------------------------------------
DOC_TITLE_SHORT = 'Personal Legal Services Subscription Agreement'

def header_footer(canvas, doc):
    canvas.saveState()
    # Header
    canvas.setFont('LibSans-Bold', 8)
    canvas.setFillColor(NAVY)
    canvas.drawString(MARGIN_L, PAGE_H - 0.45 * inch, 'INFINITY LEGAL SA')
    canvas.setFont('LibSerif-Italic', 8)
    canvas.setFillColor(GOLD_DARK)
    canvas.drawString(MARGIN_L + 105, PAGE_H - 0.45 * inch,
                      'Personal Legal Services Subscription Agreement')
    canvas.setFont('LibSans', 7.5)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawRightString(PAGE_W - MARGIN_R, PAGE_H - 0.45 * inch,
                           'ILS PERSONAL/2025/06/01')
    # Header rule
    canvas.setStrokeColor(GOLD)
    canvas.setLineWidth(0.8)
    canvas.line(MARGIN_L, PAGE_H - 0.55 * inch,
                PAGE_W - MARGIN_R, PAGE_H - 0.55 * inch)

    # Footer
    canvas.setStrokeColor(NAVY_200)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN_L, MARGIN_B - 0.30 * inch,
                PAGE_W - MARGIN_R, MARGIN_B - 0.30 * inch)
    canvas.setFont('LibSans', 7.5)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawString(MARGIN_L, MARGIN_B - 0.45 * inch,
                      'Infinity Legal SA (Pty) Ltd  ·  Reg. No. 2024/123456/07')
    canvas.setFont('LibSerif-Italic', 7.5)
    canvas.setFillColor(GOLD_DARK)
    canvas.drawCentredString(PAGE_W / 2, MARGIN_B - 0.45 * inch,
                             'Justice without limits.')
    canvas.setFont('LibSans-Bold', 8)
    canvas.setFillColor(NAVY)
    # Page number — +1 to account for the cover page merged in front
    page_num = doc.page + 1
    canvas.drawRightString(PAGE_W - MARGIN_R, MARGIN_B - 0.45 * inch,
                           f'Page {page_num}')
    canvas.restoreState()


# ---------------------------------------------------------------------------
# Doc template with TOC support
# ---------------------------------------------------------------------------
class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        """Register TOC entries for SectionHeader / PageHeader flowables."""
        if isinstance(flowable, (SectionHeader, PageHeader)):
            level = 0
            text = flowable.bookmark_text
            key = flowable.bookmark_key
            self.notify('TOCEntry', (level, text, self.page, key))


# ---------------------------------------------------------------------------
# Helpers for content building
# ---------------------------------------------------------------------------
def p(text, style=BODY):
    return Paragraph(text, style)


def bullet_list(items, style=BULLET, bullet_char='•'):
    return ListFlowable(
        [ListItem(Paragraph(it, style), leftIndent=18,
                  value=bullet_char) for it in items],
        bulletType='bullet', start=bullet_char, leftIndent=8,
    )


def numbered_list(items, style=NUMBERED):
    return ListFlowable(
        [ListItem(Paragraph(it, style), leftIndent=22) for it in items],
        bulletType='1', leftIndent=8,
    )


def lettered_list(items, style=LETTERED):
    return ListFlowable(
        [ListItem(Paragraph(it, style), leftIndent=22) for it in items],
        bulletType='a', leftIndent=8,
    )


def small_gap(h=6):
    return Spacer(1, h)


# ---------------------------------------------------------------------------
# Build the story
# ---------------------------------------------------------------------------
def build_story():
    story = []

    # =====================================================================
    # PAGE 2 — Welcome & How to Subscribe
    # =====================================================================
    story.append(PageHeader('Welcome', 'Welcome to Infinity Legal SA',
                            key='welcome'))
    story.append(p(
        'Thank you for choosing Infinity Legal SA as your personal legal services '
        'partner. We are a modern, client-focused legal services company that '
        'delivers affordable, professional legal advice and representation to '
        'individuals and families across South Africa through a simple monthly '
        'or annual subscription. Our mission is captured in three words: '
        '<i>Justice without limits.</i>'))
    story.append(p(
        'This Subscription Agreement explains what you receive as a Subscriber, '
        'how your plan works, what we ask of you in return, and the legal terms '
        'that govern the relationship between you and Infinity Legal SA (Pty) Ltd. '
        'Please read it together with your selected Plan Schedule (Section 2) and '
        'our Fair Usage Policy (Section 7). Once you subscribe, this Agreement '
        'takes effect and remains in force for as long as your subscription is active.'))

    story.append(p('How to Subscribe', H2))
    story.append(p(
        'Subscribing to an Infinity Legal SA plan takes only a few minutes. The '
        'process is fully digital and is designed so that you can choose a plan, '
        'verify your identity, and meet your dedicated legal advisor without ever '
        'leaving home. The four steps below summarise the journey from sign-up to '
        'your first consultation.'))
    story.append(numbered_list([
        '<b>Visit the Member Portal.</b> Go to <b>portal.infinitylegal.co.za</b> and click "Subscribe". You will be asked to create an account using your email address and a password, or to sign in if you already have one.',
        '<b>Choose your Plan.</b> Compare the Civil Legal Plan, Labour Legal Plan, and Extensive Plan side-by-side and select the one that fits your needs. You can switch plans later from your Member Dashboard at any time (see Section 14).',
        '<b>Verify your identity (FICA).</b> Upload a copy of your South African ID or passport and a recent proof of address. Our onboarding team verifies these documents within 48 to 72 hours, in line with our obligations under the Financial Intelligence Centre Act.',
        '<b>Make your first payment.</b> Pay your first subscription fee by PayFast (online card or instant EFT), debit order, or manual EFT. Your plan activates as soon as onboarding is complete and your first payment reflects.',
    ]))

    story.append(p('Managing Your Subscription', H2))
    story.append(p(
        'Once your subscription is active, you can manage every aspect of it from '
        'the Member Portal. The Portal lets you update your personal details, '
        'change your payment method, upgrade or downgrade your plan, view your '
        'consultation history, upload documents, message your legal advisor, and '
        'cancel your subscription. The Infinity AI Assistant is also available '
        'in-app to answer common legal questions and route complex matters to a '
        'human legal advisor.'))
    story.append(p(
        'If you prefer to speak to a person, our contact centre is available on '
        '<b>0861 4 LEGAL (0861 453 425)</b> during business hours, and on WhatsApp '
        'at <b>011 842 7890</b>. Subscribers on the Extensive Plan receive 24/7 '
        'priority support. We are here to help you get the most from your plan.'))

    story.append(CalloutBox(
        'NOTE — Onboarding Period',
        ['Your plan does not begin to deliver services until your FICA '
         'verification is complete. The Onboarding Period usually takes 48 to '
         '72 hours from the time you submit your documents. This is not a '
         'penalty or a restriction — it is a statutory compliance step required '
         'of all legal practitioners in South Africa. We will notify you by '
         'email and SMS the moment your plan is active.']))
    story.append(PageBreak())

    # =====================================================================
    # PAGE 3 — Table of Contents
    # =====================================================================
    story.append(PageHeader('Contents', 'Table of Contents', key='toc'))
    story.append(p(
        'This Agreement is organised into seventeen numbered sections, plus a '
        'Welcome page, a Service & Contact Points page, and an About Infinity '
        'Legal SA page at the back. Use the page numbers below to navigate.',
        TOC_SUB))
    toc = TableOfContents()
    toc.levelStyles = [TOC_LEVEL0, TOC_LEVEL1]
    story.append(toc)
    story.append(PageBreak())

    # =====================================================================
    # SECTION 1 — Interpretation and Definitions
    # =====================================================================
    story.append(SectionHeader(1, 'Interpretation and Definitions'))
    story.append(p(
        'In this Subscription Agreement, unless the context requires otherwise, '
        'the following words and expressions have the meanings assigned to them '
        'below. Defined terms are used consistently throughout the document and '
        'appear with an initial capital letter. Words importing one gender '
        'include the other genders, words in the singular include the plural '
        'and vice versa, and references to statutes include any subordinate '
        'legislation made under those statutes and any successor legislation.'))
    story.append(p(
        'Where a definition refers to a section of this Agreement, that section '
        'forms part of the definition. Headings are for convenience only and do '
        'not affect interpretation. References to "writing" include email, '
        'WhatsApp messages, in-app messages through the Member Portal, and any '
        'other form of electronic communication that produces a durable record.'))

    defs = [
        ('"Subscriber" or "Member"',
         'means the natural person who has subscribed to an Infinity Legal SA '
         'plan in their personal capacity. A Subscriber may add eligible family '
         'members as additional users of the plan in accordance with Section 9 '
         'and the rules of the selected plan.'),
        ('"We", "Us", "Our" or "Infinity Legal SA"',
         'means Infinity Legal SA (Pty) Ltd, a private company registered in '
         'the Republic of South Africa with registration number 2024/123456/07, '
         'registered with the Legal Practice Council of South Africa, and '
         'including its successors in title and permitted assigns.'),
        ('"Plan"',
         'means one of the three subscription plans offered by us from time to '
         'time: the Civil Legal Plan, the Labour Legal Plan, or the Extensive '
         'Plan. Each Plan is described in detail in Section 2 and the Schedule '
         'of Benefits.'),
        ('"Subscription Fee"',
         'means the monthly or annual fee payable by the Subscriber in exchange '
         'for the Services under the selected Plan. The Subscription Fee is '
         'exclusive of value-added tax where applicable, and is payable in '
         'advance by PayFast, debit order, or EFT.'),
        ('"Legal Advisor"',
         'means a legal practitioner registered with the Legal Practice Council '
         'of South Africa who is appointed by us to provide Services to the '
         'Subscriber. The term includes candidate legal practitioners, paralegals '
         'working under supervision, and any Network Legal Advisor instructed on '
         'our behalf.'),
        ('"Network Legal Advisor"',
         'means an independent legal advisor or firm of legal advisors appointed '
         'by us to deliver Services to a Subscriber on our behalf, typically '
         'where local representation is required (for example, in a Magistrate\'s '
         'Court outside Gauteng).'),
        ('"Consultation"',
         'means a one-on-one interaction between the Subscriber and a Legal '
         'Advisor in which legal advice is given. Consultations may take place '
         'in person, by telephone, by video call, by email, or by in-app '
         'chat, at our discretion and in line with the selected Plan.'),
        ('"Document"',
         'means any written or electronic record that the Subscriber asks us to '
         'review, draft, summarise, or comment on as part of the Services, '
         'including contracts, letters, emails, pleadings, and similar '
         'instruments.'),
        ('"Matter" or "Case"',
         'means a discrete legal question, dispute, or transaction for which '
         'the Subscriber requests Services. A Matter may comprise multiple '
         'consultations and documents but is treated as a single working file '
         'for billing, capacity, and Fair Usage purposes.'),
        ('"Services"',
         'means the legal services described in Section 3 that we agree to '
         'provide to the Subscriber under the selected Plan, including '
         'consultations, document review and drafting, court and CCMA '
         'representation, AI case analysis, and related support.'),
        ('"Schedule of Benefits"',
         'means the table in Section 2 that lists the features, capacity '
         'limits, and pricing of each Plan, together with any plan-specific '
         'notes. The Schedule of Benefits forms part of this Agreement.'),
        ('"Onboarding Period"',
         'means the period of 48 to 72 hours from the date on which the '
         'Subscriber submits their FICA documents, during which we verify the '
         'Subscriber\'s identity and set up their account. The Onboarding '
         'Period is a verification and setup step, not a delay in service '
         'availability for any other reason.'),
        ('"AI Case Analysis"',
         'means the artificial-intelligence-powered review of a Matter that '
         'produces an indication of the likely legal issues, risks, and '
         'options, generated by our Infinity AI Assistant and reviewed by a '
         'human Legal Advisor before being shared with the Subscriber.'),
        ('"Member Portal"',
         'means the secure online portal accessible at '
         'portal.infinitylegal.co.za through which Subscribers manage their '
         'subscription, request Services, communicate with their Legal '
         'Advisor, and access their documents.'),
        ('"Business Day"',
         'means any day other than a Saturday, Sunday, or public holiday '
         'recognised in the Republic of South Africa.'),
        ('"Cooling-off Period"',
         'means the seven-day period after activation during which a new '
         'Subscriber may cancel their subscription and receive a pro-rata '
         'refund of the Subscription Fee, provided that no Services have been '
         'used, as described in Section 5.'),
        ('"FICA"',
         'means the Financial Intelligence Centre Act 38 of 2001, as amended, '
         'which requires us to establish and verify the identity of every '
         'Subscriber before providing Services.'),
        ('"POPIA"',
         'means the Protection of Personal Information Act 4 of 2013, as '
         'amended, which governs the processing of personal information in '
         'South Africa and is described in Section 10.'),
        ('"Legal Practice Council" or "LPC"',
         'means the statutory regulatory body for legal practitioners in South '
         'Africa, established under the Legal Practice Act 28 of 2014, with '
         'which we and our Legal Advisors are registered.'),
    ]
    for term, definition in defs:
        story.append(Paragraph(f'<b>{term}</b> {definition}', DEFINITION))
    story.append(PageBreak())

    # =====================================================================
    # SECTION 2 — Our Three Legal Plans
    # =====================================================================
    story.append(SectionHeader(2, 'Our Three Legal Plans'))
    story.append(p(
        'Infinity Legal SA offers three subscription plans, each designed for a '
        'different profile of Subscriber. Every plan is a recurring monthly or '
        'annual subscription that you can cancel at any time without penalty. '
        'Annual subscriptions receive a discount of approximately 16 per cent '
        'compared to twelve monthly payments. All prices include value-added '
        'tax where applicable. The three plans are summarised below and set '
        'out in detail in the Schedule of Benefits and the feature comparison '
        'table that follows.'))

    # Plan summary cards
    plan_summary_data = [
        [Paragraph('<b>Plan</b>', TABLE_HEADER),
         Paragraph('<b>Monthly Fee</b>', TABLE_HEADER_CENTER),
         Paragraph('<b>Annual Fee</b>', TABLE_HEADER_CENTER),
         Paragraph('<b>Best For</b>', TABLE_HEADER)],
        [Paragraph('<b>Civil Legal Plan</b>', TABLE_CELL_BOLD),
         Paragraph('R99', TABLE_CELL_CENTER),
         Paragraph('R999', TABLE_CELL_CENTER),
         Paragraph('Civil disputes and general legal matters', TABLE_CELL)],
        [Paragraph('<b>Labour Legal Plan</b>  <font color="#a88832">(Most Popular)</font>', TABLE_CELL_BOLD),
         Paragraph('R99', TABLE_CELL_CENTER),
         Paragraph('R999', TABLE_CELL_CENTER),
         Paragraph('Workplace and employment matters, including CCMA', TABLE_CELL)],
        [Paragraph('<b>Extensive Plan</b>  <font color="#a88832">(Best Value)</font>', TABLE_CELL_BOLD),
         Paragraph('R139', TABLE_CELL_CENTER),
         Paragraph('R1 399', TABLE_CELL_CENTER),
         Paragraph('All practice areas, including family and criminal advice', TABLE_CELL)],
    ]
    plan_summary_widths = [
        CONTENT_W * 0.30,
        CONTENT_W * 0.16,
        CONTENT_W * 0.16,
        CONTENT_W * 0.38,
    ]
    plan_summary = Table(plan_summary_data, colWidths=plan_summary_widths,
                         repeatRows=1)
    plan_summary.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, NAVY_50]),
        ('LINEBELOW', (0, 0), (-1, 0), 1.5, GOLD),
        ('LINEBELOW', (0, 1), (-1, -2), 0.5, NAVY_200),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
    ]))
    story.append(KeepTogether([plan_summary]))
    story.append(small_gap(10))

    # Civil Legal Plan
    story.append(p('2.1  Civil Legal Plan — R99 per month or R999 per year', H2))
    story.append(p(
        'The Civil Legal Plan is our entry-level subscription and is intended '
        'for Subscribers who primarily need assistance with civil disputes and '
        'general legal matters. It provides unlimited civil consultations, '
        'document review and drafting up to the plan limit, court representation '
        'for matters within the plan scope, AI case analysis, and email support. The plan '
        'allows up to ten active Matters at any time and up to fifty documents '
        'per annual cycle.'))
    story.append(p(
        'This plan is well suited to individuals who want day-to-day legal '
        'guidance on contracts, consumer disputes, neighbour issues, debt '
        'queries, and similar civil matters. It is not intended for workplace '
        'matters (please consider the Labour Legal Plan) or for the full range '
        'of family, criminal, and estate matters (please consider the Extensive '
        'Plan). Response time on the Civil Legal Plan is within 24 business '
        'hours of a service request.'))

    # Labour Legal Plan
    story.append(p('2.2  Labour Legal Plan — R99 per month or R999 per year (Most Popular)', H2))
    story.append(p(
        'The Labour Legal Plan is our most popular subscription and is designed '
        'for Subscribers who need assistance with workplace and employment '
        'matters. It includes unlimited labour consultations, representation at '
        'the Commission for Conciliation, Mediation and Arbitration (CCMA) and '
        'related bargaining councils, employment contract review, dismissal '
        'advice, and priority support. The plan allows up to ten active Matters '
        'and up to fifty documents per annual cycle.'))
    story.append(p(
        'This plan is ideal for employees, contractors, and small employers '
        'who face workplace disputes, disciplinary processes, or unfair labour '
        'practice allegations. CCMA representation includes preparation of '
        'referral documents, conciliation, and arbitration, subject to the '
        'Fair Usage Policy in Section 7. Response time on the Labour Legal '
        'Plan is within four business hours of a service request, ahead of '
        'the Civil Legal Plan.'))

    # Extensive Plan
    story.append(p('2.3  Extensive Plan — R139 per month or R1 399 per year (Best Value)', H2))
    story.append(p(
        'The Extensive Plan is our most comprehensive subscription and is '
        'intended for Subscribers who want access to the full range of legal '
        'services across every practice area we support. It includes all '
        'Civil and Labour plan features, family law consultations, criminal '
        'defence advice, estate planning, 24/7 priority support, and a '
        'dedicated Legal Advisor assigned to your account. The plan allows '
        'up to fifty active Matters and up to 999 documents per annual cycle.'))
    story.append(p(
        'This plan is best for families, business owners, and individuals '
        'with complex or recurring legal needs. The dedicated Legal Advisor '
        'becomes your single point of contact, gets to know your '
        'circumstances, and proactively manages your Matters. Response time '
        'on the Extensive Plan is within four business hours during business '
        'hours and within twelve hours outside business hours, seven days a '
        'week.'))

    story.append(small_gap(8))
    story.append(p('2.4  Feature Comparison Table', H2))
    story.append(p(
        'The table below compares the features of all three plans side by '
        'side. "Yes" means the feature is included; an em dash (—) '
        'means the feature is not included in that plan but is available in '
        'a higher-tier plan or as a separate instruction at our standard '
        'hourly rate.'))

    feature_rows = [
        # (feature, civil, labour, extensive)
        ('Monthly Subscription Fee', 'R99', 'R99', 'R139'),
        ('Annual Subscription Fee', 'R999', 'R999', 'R1 399'),
        ('Unlimited civil consultations', 'Yes', 'Yes', 'Yes'),
        ('Unlimited labour consultations', '—', 'Yes', 'Yes'),
        ('Document review & drafting', 'Yes (up to 50)', 'Yes (up to 50)', 'Yes (up to 999)'),
        ('Court representation', 'Yes', 'Yes', 'Yes'),
        ('CCMA representation', '—', 'Yes', 'Yes'),
        ('Employment contract review', '—', 'Yes', 'Yes'),
        ('Dismissal advice', '—', 'Yes', 'Yes'),
        ('AI case analysis (Infinity AI)', 'Yes', 'Yes', 'Yes'),
        ('Family law consultations', '—', '—', 'Yes'),
        ('Criminal defence advice', '—', '—', 'Yes'),
        ('Estate planning & will drafting', '—', '—', 'Yes'),
        ('Personal income tax advice', '—', '—', 'Yes'),
        ('Dedicated Legal Advisor', '—', '—', 'Yes'),
        ('Maximum active Matters', '10', '10', '50'),
        ('Maximum documents per year', '50', '50', '999'),
        ('Email support', 'Yes', 'Yes', 'Yes'),
        ('Priority support (4 business hours)', '—', 'Yes', 'Yes'),
        ('24/7 priority support', '—', '—', 'Yes'),
        ('Member Portal & Infinity AI Assistant', 'Yes', 'Yes', 'Yes'),
    ]
    # Build the comparison table
    table_data = [[
        Paragraph('Feature', TABLE_HEADER),
        Paragraph('Civil', TABLE_HEADER_CENTER),
        Paragraph('Labour', TABLE_HEADER_CENTER),
        Paragraph('Extensive', TABLE_HEADER_CENTER),
    ]]
    for row in feature_rows:
        feat, civil, labour, extensive = row
        table_data.append([
            Paragraph(feat, TABLE_CELL),
            Paragraph(civil, TABLE_CELL_CENTER),
            Paragraph(labour, TABLE_CELL_CENTER),
            Paragraph(extensive, TABLE_CELL_CENTER),
        ])
    # Column widths: feature column wide, others equal
    feat_w = CONTENT_W * 0.46
    other_w = (CONTENT_W - feat_w) / 3
    compare_widths = [feat_w, other_w, other_w, other_w]
    compare_table = Table(table_data, colWidths=compare_widths, repeatRows=1)
    compare_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, NAVY_50]),
        ('LINEBELOW', (0, 0), (-1, 0), 1.5, GOLD),
        ('LINEBELOW', (0, 1), (-1, -2), 0.4, NAVY_200),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 7),
        ('RIGHTPADDING', (0, 0), (-1, -1), 7),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(compare_table)
    story.append(small_gap(8))
    story.append(CalloutBox(
        'NOTE — Switching Plans',
        ['You can upgrade or downgrade your plan at any time from the Member '
         'Portal. Upgrades take effect immediately and you are charged a '
         'pro-rata fee for the remainder of the current billing cycle. '
         'Downgrades take effect at the start of the next billing cycle. '
         'See Section 14 for the full upgrades, downgrades, and cancellation '
         'policy.']))
    story.append(PageBreak())

    # =====================================================================
    # SECTION 3 — Services We Provide
    # =====================================================================
    story.append(SectionHeader(3, 'Services We Provide'))
    story.append(p(
        'This section describes the categories of legal services that we '
        'provide under our plans. The Services available to you depend on the '
        'plan you have selected, as set out in the Schedule of Benefits. Where '
        'a Service is described as "unlimited", it is subject to the Fair '
        'Usage Policy in Section 7, which is designed to ensure that all '
        'Subscribers receive fair and timely access to their Legal Advisor.'))

    story.append(p('3.1  Legal Consultations', H2))
    story.append(p(
        'Every plan includes a specified number of legal consultations per '
        'month. The Civil Legal Plan and Labour Legal Plan both offer '
        'unlimited civil or labour consultations respectively, subject to the '
        'Fair Usage Policy. The Extensive Plan offers unlimited consultations '
        'across all practice areas. A consultation may take place in person at '
        'our Johannesburg office, by telephone, by video call, by email, or '
        'by in-app chat, at the discretion of the Legal Advisor and depending '
        'on the nature of the Matter.'))
    story.append(p(
        'Each consultation is recorded as a note on your file so that you '
        'receive consistent advice even if you speak to different Legal '
        'Advisors over time. Subscribers on the Extensive Plan normally speak '
        'to the same dedicated Legal Advisor for every Matter.'))
    story.append(CalloutBox(
        'Example — What counts as one consultation?',
        ['A single 30-minute video call about an unfair dismissal is one '
         'consultation. A follow-up email asking the same Legal Advisor to '
         'clarify a point discussed in the call is part of the same '
         'consultation, not a separate one. A new Matter about a different '
         'issue, even if raised in the same call, is treated as a separate '
         'consultation.']))

    story.append(p('3.2  Document Review and Drafting', H2))
    story.append(p(
        'We will review and comment on documents that you send us, and we '
        'will draft documents on your behalf, up to the document limit of '
        'your plan. The Civil Legal Plan and Labour Legal Plan each include '
        'up to fifty documents per annual cycle. The Extensive Plan includes '
        'up to 999 documents per annual cycle. A "document" for this purpose '
        'means a single contract, letter, email of substance, pleading, or '
        'similar instrument that requires dedicated review or drafting time. '
        'Routine correspondence and chat messages are not counted.'))
    story.append(p(
        'Where a document exceeds the scope of your plan (for example, a '
        'complex commercial lease on the Civil Legal Plan), we will advise '
        'you honestly and provide a quote for the work as a separate '
        'instruction at our standard hourly rate. You are under no obligation '
        'to accept such a quote.'))

    story.append(p('3.3  Court Representation', H2))
    story.append(p(
        'Where court proceedings are necessary in a Matter that falls within '
        'the scope of your plan, we will arrange for a Legal Advisor or '
        'Network Legal Advisor to represent you in the Magistrate\'s Court, '
        'High Court, or specialist tribunal, as appropriate. Court '
        'representation includes preparation of pleadings, attendance at '
        'hearings, and conduct of the Matter through to judgment, settlement, '
        'or other conclusion.'))
    story.append(p(
        'We retain the right to determine whether a Matter has reasonable '
        'prospects of success before agreeing to provide court representation. '
        'If we consider that a Matter has no reasonable prospect of success, '
        'we will explain our view in writing and may decline to represent '
        'you, in line with the duty of candour that applies to all Legal '
        'Advisors in South Africa.'))

    story.append(p('3.4  CCMA Representation (Labour & Extensive Plans)', H2))
    story.append(p(
        'Subscribers on the Labour Legal Plan and Extensive Plan receive '
        'representation at the Commission for Conciliation, Mediation and '
        'Arbitration (CCMA) and at recognised bargaining councils for '
        'workplace disputes. This service includes drafting and filing the '
        'referral, preparing you for the hearing, attending conciliation and '
        'arbitration, and representing you at the hearing itself. We also '
        'provide advice on whether to refer a dispute to the Labour Court '
        'rather than the CCMA where the law permits.'))

    story.append(p('3.5  AI Case Analysis', H2))
    story.append(p(
        'All plans include AI case analysis powered by our Infinity AI '
        'Assistant. When you submit a Matter through the Member Portal, the '
        'AI Assistant analyses the facts and produces an indication of the '
        'likely legal issues, the relevant statutes and case law, the risks '
        'and strengths of your position, and the options available to you. '
        'The output of the AI Assistant is reviewed by a human Legal Advisor '
        'before being shared with you.'))
    story.append(p(
        'AI case analysis is a decision-support tool, not legal advice on its '
        'own. The final advice you receive is provided by a human Legal '
        'Advisor who takes professional responsibility for it.'))

    story.append(p('3.6  Employment Contract Review', H2))
    story.append(p(
        'Subscribers on the Labour Legal Plan and Extensive Plan may submit '
        'employment contracts, including new employment offers, contractor '
        'agreements, and restraint-of-trade clauses, for review before '
        'signing. We will identify clauses that are unusual, unfair, '
        'potentially unlawful, or contrary to the Basic Conditions of '
        'Employment Act, and we will suggest amendments in writing.'))

    story.append(p('3.7  Family Law Consultations (Extensive Plan only)', H2))
    story.append(p(
        'Subscribers on the Extensive Plan may consult their dedicated Legal '
        'Advisor on family law matters, including divorce, maintenance, '
        'custody and access, parental rights, and domestic partnerships. We '
        'provide advice and assistance with the relevant documentation and, '
        'where appropriate, refer you to a specialist family law practitioner '
        'within our network for contested matters.'))

    story.append(p('3.8  Criminal Defence Advice (Extensive Plan only)', H2))
    story.append(p(
        'Subscribers on the Extensive Plan may consult their dedicated Legal '
        'Advisor on criminal matters and receive advice on the procedure, '
        'their rights, bail applications, and likely outcomes. The Extensive '
        'Plan includes <i>advice and consultation</i> on criminal matters, '
        'not full defence representation in criminal trials. Where full '
        'representation is required, we will provide a quote for a separate '
        'instruction or refer you to a specialist criminal defence '
        'practitioner within our network.'))

    story.append(p('3.9  Estate Planning (Extensive Plan only)', H2))
    story.append(p(
        'Subscribers on the Extensive Plan receive advice on estate planning, '
        'including the drafting and updating of a basic will, advice on '
        'intestate succession, and guidance on the use of inter vivos trusts '
        'for asset protection. Complex estate planning involving offshore '
        'assets, business interests, or significant tax structuring is '
        'available as a separate instruction at our standard hourly rate.'))
    story.append(PageBreak())

    # =====================================================================
    # SECTION 4 — Matters We Assist With
    # =====================================================================
    story.append(SectionHeader(4, 'Matters We Assist With'))
    story.append(p(
        'This section lists the types of Matters that we will assist you with '
        'under your plan. The list is comprehensive but not exhaustive. If '
        'you have a Matter that does not appear below, please raise it '
        'through the Member Portal and we will advise whether it falls '
        'within the scope of your plan. Matters marked "Extensive Plan only" '
        'are not included in the Civil Legal Plan or Labour Legal Plan.'))

    story.append(p('4.1  Civil and Consumer Matters', H3))
    story.append(numbered_list([
        'Review of consumer contracts for goods and services',
        'Advice on defective goods and the consumer\'s right to return, repair, or replace under the Consumer Protection Act',
        'Assistance with complaints against suppliers and service providers',
        'Recovery of money owed to you for goods or services supplied',
        'Defence against demands for payment that you dispute',
        'Neighbour disputes, including noise, nuisance, and encroachment',
        'Property damage claims against wrongdoers or their insurers',
        'Disputes with contractors over building work and renovations',
        'Assistance with summons and default judgments served on you',
        'General contractual disputes not involving a business entity',
    ]))

    story.append(p('4.2  Home and Accommodation Matters', H3))
    story.append(numbered_list([
        'Lease agreement review for tenants and landlords',
        'Disputes over rental deposits and deductions',
        'Advice on eviction procedure under the PIE Act',
        'Sectional title and body corporate disputes',
        'Homeowners\' association rule disputes',
        'Disputes with estate agents over commission and mandates',
        'Advice on municipal rates and services accounts',
        'Assistance with defective workmanship claims against builders',
    ]))

    story.append(p('4.3  Motor Vehicle Matters', H3))
    story.append(numbered_list([
        'Advice following a motor vehicle accident, including fault and damages',
        'Assistance with the Road Accident Fund claims process',
        'Defective vehicle claims under the Consumer Protection Act',
        'Vehicle repossession disputes and advice on your rights',
        'Advice on rejected motor vehicle insurance disputes',
        'Disputes with panel beaters over repair quality and invoicing',
        'Traffic fine review and advice on administrative adjudication',
    ]))

    story.append(p('4.4  Labour and Employment Matters (Labour and Extensive Plans)', H3))
    story.append(numbered_list([
        'Unfair dismissal advice and CCMA representation',
        'Unfair labour practice disputes at the CCMA and bargaining councils',
        'Workplace discrimination and harassment advice',
        'Review of employment contracts, restraint clauses, and settlement agreements',
        'Advice on disciplinary hearings and chairing of internal enquiries',
        'Assistance with retrenchment consultations and severance calculations',
        'Advice on constructive dismissal and workplace grievances',
        'Advice on parental, sick, and family responsibility leave rights',
    ]))

    story.append(p('4.5  Family Law Matters (Extensive Plan only)', H3))
    story.append(numbered_list([
        'Divorce consultation and referral to a specialist practitioner where required',
        'Maintenance claims for spouses and children',
        'Custody, access, and parental responsibilities and rights',
        'Antenuptial contract advice and referral to a notary',
        'Domestic partnership and cohabitation agreements',
        'Variation of existing divorce orders',
        'Domestic violence protection applications under the DVA',
    ]))

    story.append(p('4.6  Criminal Matters (Extensive Plan only — Advice and Consultation)', H3))
    story.append(numbered_list([
        'Advice on criminal procedure and your rights on arrest',
        'Bail application advice and assistance with paperwork',
        'Consultation on likely outcomes and sentencing ranges',
        'Advice on the rights of victims of crime',
        'Referral to a specialist criminal defence practitioner for full representation',
    ]))

    story.append(p('4.7  Estate and Wills Matters (Extensive Plan only)', H3))
    story.append(numbered_list([
        'Drafting and updating of a basic Last Will and Testament',
        'Advice on intestate succession where no will exists',
        'Estate planning advice for individuals and couples',
        'Referral to a specialist trust practitioner for inter vivos trusts',
        'Advice on the role and duties of an executor',
        'Living wills and advance health care directives',
    ]))

    story.append(p('4.8  Banking, Insurance and Credit Matters', H3))
    story.append(numbered_list([
        'Advice on rejected insurance disputes and the short-term insurance ombudsman',
        'Banking disputes, including unauthorised debit orders disputes',
        'Advice on the National Credit Act and reckless credit',
        'Debt review and debt counselling referral',
        'Assistance with credit bureau disputes and listings',
        'Advice on prescription of debts',
        'Assistance with administration orders and sequestration alternatives',
    ]))

    story.append(p('4.9  Personal Tax Matters (Extensive Plan only)', H3))
    story.append(numbered_list([
        'Advice on personal income tax returns and SARS queries',
        'Assistance with SARS disputes and objection procedures',
        'Advice on capital gains tax implications of personal transactions',
        'Referral to a registered tax practitioner for complex matters',
    ]))

    story.append(CalloutBox(
        'NOTE — Pre-existing Matters',
        ['If a Matter arose before you subscribed to a plan, we will advise '
         'you on the way forward, but the active Services under your '
         'subscription (including consultations, document drafting, and '
         'representation) only apply to Matters that arise or continue after '
         'your Onboarding Period ends. We will be transparent about this when '
         'you raise the Matter.']))
    story.append(PageBreak())

    # =====================================================================
    # SECTION 5 — The Subscription Agreement
    # =====================================================================
    story.append(SectionHeader(5, 'The Subscription Agreement'))
    story.append(p(
        'This Subscription Agreement is a contract between you, the Subscriber, '
        'and Infinity Legal SA (Pty) Ltd. It takes effect when you complete '
        'the sign-up process on the Member Portal and your first Subscription '
        'Fee is received. It remains in force until it is cancelled in '
        'accordance with Section 14, or until it is terminated by either '
        'party for material breach in accordance with Section 17.'))

    story.append(p('5.1  Monthly and Annual Billing', H2))
    story.append(p(
        'You may choose to pay your Subscription Fee monthly or annually. '
        'Monthly subscriptions are billed in advance on the first day of each '
        'calendar month. Annual subscriptions are billed in advance on the '
        'anniversary of your activation date. Annual subscriptions receive a '
        'discount of approximately 16 per cent compared to twelve monthly '
        'payments, because we save on payment-processing and administration '
        'costs and pass that saving on to you.'))
    story.append(p(
        'The Subscription Fee for each plan is set out in the Schedule of '
        'Benefits in Section 2. All fees are quoted in South African Rand '
        'and include value-added tax where applicable. We may from time to '
        'time offer promotional pricing, introductory discounts, or '
        'coupons; any such promotional pricing is honoured for the '
        'promotional period and reverts to the standard fee at the end of '
        'that period, with at least 31 days\' notice as set out in '
        'Section 13.'))

    story.append(p('5.2  Cooling-off Period', H2))
    story.append(p(
        'A new Subscriber may cancel their subscription within seven calendar '
        'days of activation and receive a full pro-rata refund of the '
        'Subscription Fee, provided that no Services have been used during '
        'that period. If any Services have been used (for example, a '
        'consultation has taken place or a document has been drafted), the '
        'refund will be reduced by the reasonable value of those Services at '
        'our standard hourly rate, and the balance will be refunded.'))
    story.append(p(
        'The Cooling-off Period applies only to new Subscribers and does '
        'not apply to renewals, upgrades, or reactivations after a previous '
        'cancellation. To exercise your right to cancel during the '
        'Cooling-off Period, please email client.services@infinitylegal.co.za '
        'or use the cancellation function in the Member Portal.'))

    story.append(p('5.3  Plan Upgrades and Downgrades', H2))
    story.append(p(
        'You may upgrade or downgrade your plan at any time from the Member '
        'Portal. Upgrades take effect immediately and you are charged a '
        'pro-rata fee for the difference between your current plan and the '
        'upgraded plan for the remainder of the current billing cycle. '
        'Downgrades take effect at the start of the next billing cycle so '
        'that you continue to enjoy the higher-tier services you have '
        'already paid for. The full upgrades, downgrades, and cancellation '
        'policy is set out in Section 14.'))

    story.append(p('5.4  Parties to the Agreement', H2))
    story.append(p(
        'The only parties to this Agreement are the Subscriber and Infinity '
        'Legal SA (Pty) Ltd. Our Legal Advisors, Network Legal Advisors, '
        'staff, and contractors act on our behalf and do not contract '
        'personally with the Subscriber. Where a Network Legal Advisor '
        'is instructed to represent you in court, they do so as our agent '
        'and under our professional indemnity arrangements.'))
    story.append(PageBreak())

    # =====================================================================
    # SECTION 6 — What's Not Included (Exclusions)
    # =====================================================================
    story.append(SectionHeader(6, "What's Not Included (Exclusions)"))
    story.append(p(
        'This section lists the categories of Matters and Services that are '
        'not included in any of our plans. These exclusions are framed as '
        'service-scope limits: they describe what we do not do as part of a '
        'subscription. In many cases the excluded Matter can still be '
        'handled by us as a separate instruction at our standard hourly '
        'rate, or referred to a specialist practitioner within our network. '
        'Where this is possible, we will tell you upfront and provide a '
        'transparent quote.'))

    exclusions = [
        ('Business and commercial legal matters',
         'Matters that arise in the operation of a business, including company '
         'formation, shareholder agreements, commercial contracts, and '
         'regulatory compliance, are not included in any plan except where '
         'the Extensive Plan explicitly states otherwise.'),
        ('Class actions and representative proceedings',
         'We do not provide Services as part of any plan in respect of class '
         'actions or other representative proceedings, whether as lead or '
         'group member, because of the scale and complexity of such Matters.'),
        ('Matters where legal representation is not permitted',
         'The Small Claims Court does not permit legal representation. We '
         'will advise you on how to present your own case in the Small '
         'Claims Court, but we cannot appear on your behalf.'),
        ('Matters with no reasonable prospect of success',
         'If we consider that a Matter has no reasonable prospect of success, '
         'we will advise you honestly and decline to provide ongoing '
         'representation. This duty of candour applies to all Legal Advisors '
         'in South Africa.'),
        ('Matters outside South African jurisdiction',
         'We do not provide advice on the law of any country other than '
         'South Africa. If your Matter has an international element, we '
         'will refer you to a practitioner in the relevant jurisdiction.'),
        ('Punitive or exemplary damages',
         'We do not pursue claims for punitive or exemplary damages on '
         'behalf of Subscribers. South African law generally does not '
         'recognise such damages, and we will not advance them.'),
        ('Fines, penalties, and bail money',
         'We do not pay fines, administrative penalties, or bail money on '
         'behalf of Subscribers. We will, however, advise you on the '
         'procedure for contesting fines and applying for bail.'),
        ('Pre-existing Matters',
         'Matters that arose before your subscription activated, or before '
         'the end of your Onboarding Period, are not addressed by the active '
         'Services under your subscription. We will advise you on the way '
         'forward but past events are not retrospectively addressed.'),
        ('Tax matters for juristic persons',
         'Personal income tax advice is included in the Extensive Plan, '
         'but tax advice for companies, trusts, partnerships, and other '
         'juristic persons is not included in any plan and is available as '
         'a separate instruction.'),
        ('Insolvency and business rescue administration',
         'Sequestration of individuals is available as a referral service '
         'only. Business rescue, liquidation, and corporate insolvency '
         'administration are not included in any plan.'),
        ('Complex commercial contracts',
         'Drafting and negotiation of complex commercial contracts, '
         'including franchise agreements, joint venture agreements, and '
         'mergers and acquisitions, is available as a separate instruction '
         'only.'),
        ('Intellectual property registration',
         'Filing and prosecution of patents, trade marks, and designs at '
         'the Companies and Intellectual Property Commission is not '
         'included in any plan. We can advise on ownership and licensing '
         'questions only.'),
        ('Immigration and citizenship',
         'Immigration applications, visa renewals, and citizenship matters '
         'are not included in any plan. We can refer you to a specialist '
         'immigration practitioner on request.'),
        ('Personal injury contingency work',
         'We do not act on a contingency (no-win, no-fee) basis for '
         'personal injury Matters under any plan. Where appropriate, we '
         'will refer you to a specialist personal injury practitioner.'),
        ('Family law contested trials',
         'The Extensive Plan includes family law consultations, but '
         'contested divorce trials are referred to a specialist family law '
         'practitioner within our network.'),
        ('Criminal defence trials',
         'The Extensive Plan includes criminal defence advice, but full '
         'representation in a criminal trial is referred to a specialist '
         'criminal defence practitioner within our network.'),
        ('Matters requiring the counsel of senior counsel',
         'Where the engagement of senior counsel (an advocate with silk '
         'status) is required, the cost of senior counsel is not included '
         'in any plan and will be quoted separately.'),
        ('Matters in conflict with another Subscriber',
         'Where two or more Subscribers are on opposite sides of the same '
         'Matter, we will not act for either party and will refer both to '
         'independent practitioners.'),
        ('Disciplinary proceedings against Legal Advisors',
         'We do not assist Subscribers in bringing professional conduct '
         'complaints against Legal Advisors, whether our own or '
         'independent practitioners.'),
        ('Costs ordered against you',
         'If a court orders you to pay the other party\'s legal costs, '
         'those costs are not addressed by any plan and are payable by you '
         'personally.'),
        ('Expert witness fees',
         'Fees for expert witnesses (medical, forensic, valuation, and '
         'similar) are not included in any plan and will be quoted '
         'separately where required.'),
        ('Translation and interpretation',
         'Costs of translating documents or interpreting in consultations '
         'in languages other than English and Afrikaans are not included '
         'and will be quoted separately where required.'),
    ]
    for title, body in exclusions:
        story.append(Paragraph(f'<b>{title}.</b> {body}', BULLET,
                               bulletText='•'))
    story.append(PageBreak())

    # =====================================================================
    # SECTION 7 — Fair Usage Policy
    # =====================================================================
    story.append(SectionHeader(7, 'Fair Usage Policy'))
    story.append(p(
        'Our plans describe certain Services as "unlimited" (for example, '
        '"unlimited civil consultations"). We use this language to signal '
        'that there is no fixed per-month cap on the volume of a particular '
        'Service. In practice, every plan is subject to a Fair Usage Policy '
        'so that one Subscriber\'s usage does not unreasonably affect the '
        'service that other Subscribers receive. This section explains what '
        'fair usage means and what happens if you exceed it.'))

    story.append(p('7.1  What Fair Usage Means', H2))
    story.append(p(
        'Fair usage means using the Services in a way that is consistent '
        'with the ordinary needs of an individual or family Subscriber for '
        'their own personal legal Matters. As a guideline, a Subscriber on '
        'the Civil Legal Plan or Labour Legal Plan who uses more than '
        'twelve consultations in any calendar month, or more than fifty '
        'documents in any annual cycle, will be considered to have '
        'exceeded fair usage without extraordinary justification. The '
        'Extensive Plan has higher limits in line with its higher capacity '
        'caps, as set out in the Schedule of Benefits.'))

    story.append(p('7.2  Active Matter Limits', H2))
    story.append(p(
        'Each plan limits the number of Matters that may be open at the '
        'same time. The Civil Legal Plan and Labour Legal Plan each allow '
        'up to ten active Matters at any time. The Extensive Plan allows '
        'up to fifty active Matters at any time. An active Matter is one '
        'that has been opened but not yet concluded. Once a Matter is '
        'concluded (by advice given, document delivered, hearing concluded, '
        'or settlement reached), it is archived and no longer counts '
        'against the active limit.'))

    story.append(p('7.3  Document Limits', H2))
    story.append(p(
        'Each plan limits the number of documents that may be reviewed or '
        'drafted per annual cycle. The Civil Legal Plan and Labour Legal '
        'Plan each allow up to fifty documents per annual cycle. The '
        'Extensive Plan allows up to 999 documents per annual cycle. The '
        'annual cycle resets on the anniversary of your activation date. '
        'Unused document capacity does not carry over to the next cycle.'))

    story.append(p('7.4  What Happens if You Exceed Fair Usage', H2))
    story.append(p(
        'If you approach or exceed the fair-usage guidelines, your Legal '
        'Advisor will discuss the situation with you. We will not '
        'arbitrarily suspend your Services. Instead, we will consider '
        'whether the volume is justified by your circumstances, whether '
        'a plan upgrade is appropriate, or whether some Matters should be '
        'handled as separate instructions at our standard hourly rate. Our '
        'aim is always to find a workable solution that keeps you as a '
        'Subscriber.'))
    story.append(CalloutBox(
        'Example — When fair usage matters',
        ['A Subscriber on the Civil Legal Plan submits fifteen separate '
         'Matters in a single month relating to disputes with various '
         'online retailers. We would treat this as exceeding fair usage '
         'and would discuss whether a plan upgrade or a separate '
         'instruction is more appropriate, rather than declining to help '
         'with any individual Matter.']))
    story.append(PageBreak())

    # =====================================================================
    # SECTION 8 — Onboarding & Your First Consultation
    # =====================================================================
    story.append(SectionHeader(8, 'Onboarding and Your First Consultation'))
    story.append(p(
        'Onboarding is the process that takes you from sign-up to your '
        'first consultation with a Legal Advisor. It is designed to be '
        'fast, transparent, and respectful of the statutory obligations '
        'that apply to all legal practitioners in South Africa. The '
        'Onboarding Period is the time required to verify your identity '
        'and set up your account; it is not a delay in service '
        'availability for any other reason.'))

    story.append(p('8.1  The Onboarding Period', H2))
    story.append(p(
        'The Onboarding Period is 48 to 72 hours from the date on which '
        'you submit your FICA documents (a copy of your South African ID '
        'or passport and a recent proof of address). During this period, '
        'our onboarding team verifies your documents, sets up your '
        'account on the Member Portal, and assigns you to a Legal Advisor '
        '(for Extensive Plan Subscribers) or to the advisor pool for your '
        'plan. We will notify you by email and SMS as soon as your plan '
        'is active.'))
    story.append(p(
        'In rare cases — for example, where FICA documents are unclear or '
        'where additional verification is required — the Onboarding Period '
        'may take longer. We will keep you informed throughout and will '
        'not deduct any Subscription Fee until your plan is active.'))

    story.append(p('8.2  Your First Consultation', H2))
    story.append(p(
        'Once your plan is active, your first consultation is booked '
        'within 48 hours. For Extensive Plan Subscribers, the first '
        'consultation is normally with your dedicated Legal Advisor. For '
        'Civil Legal Plan and Labour Legal Plan Subscribers, the first '
        'consultation is with the next available advisor in your plan\'s '
        'advisor pool. The first consultation is an opportunity for you '
        'to raise your first Matter and for us to confirm your contact '
        'details, communication preferences, and any accessibility needs.'))

    story.append(p('8.3  Identity Verification (FICA)', H2))
    story.append(p(
        'Identity verification under the Financial Intelligence Centre '
        'Act (FICA) is a statutory requirement that applies to all legal '
        'practitioners in South Africa. We are required to establish and '
        'verify the identity of every Subscriber, the identity of any '
        'person acting on behalf of a Subscriber, and the nature of the '
        'business relationship. We do this by collecting and verifying '
        'your identity document and proof of address before activating '
        'your plan.'))
    story.append(p(
        'If your identity cannot be verified, we will not be able to '
        'activate your plan and any Subscription Fee received will be '
        'refunded in full. We may, at our discretion, request additional '
        'information or documentation to complete the verification '
        'process.'))
    story.append(PageBreak())

    # =====================================================================
    # SECTION 9 — Client Responsibilities & Code of Conduct
    # =====================================================================
    story.append(SectionHeader(9, 'Client Responsibilities and Code of Conduct'))
    story.append(p(
        'A successful legal services relationship depends on mutual trust '
        'and cooperation. This section sets out the responsibilities that '
        'we ask of you as a Subscriber. These responsibilities are not '
        'onerous — they reflect ordinary standards of honesty and courtesy '
        'that the vast majority of our Subscribers meet without effort. '
        'They exist so that we can deliver high-quality, professional '
        'Services to every Subscriber.'))

    story.append(p('9.1  Truthful and Complete Information', H2))
    story.append(p(
        'You agree to provide truthful, accurate, and complete information '
        'to your Legal Advisor at all times. Legal advice is only as good '
        'as the facts on which it is based. If you withhold relevant '
        'facts, present them inaccurately, or provide misleading '
        'information, the advice you receive may be wrong, and we cannot '
        'accept responsibility for the consequences.'))

    story.append(p('9.2  Timely Responses', H2))
    story.append(p(
        'You agree to respond to reasonable requests for information from '
        'your Legal Advisor within a reasonable time. What is reasonable '
        'depends on the urgency of the Matter. For urgent Matters (for '
        'example, an upcoming court date), we may ask for a response '
        'within hours; for non-urgent Matters, a few days is normally '
        'sufficient. If you do not respond within a reasonable time, we '
        'may pause work on the Matter until we hear from you.'))

    story.append(p('9.3  Attendance at Consultations', H2))
    story.append(p(
        'You agree to attend consultations that you have booked, in '
        'person, by telephone, or by video call as arranged. If you '
        'cannot attend, please give us at least 24 hours\' notice so '
        'that we can offer the slot to another Subscriber. Repeated '
        'failure to attend booked consultations without notice may '
        'result in your plan being paused or cancelled under Section 14.'))

    story.append(p('9.4  Following Reasonable Advice', H2))
    story.append(p(
        'You agree to consider and act on the reasonable advice of your '
        'Legal Advisor. We cannot guarantee any specific legal outcome '
        '(see Section 16), but we can assure you that our advice is given '
        'in good faith and based on professional judgement. If you '
        'choose not to follow our advice, we will document your decision '
        'on your file and cannot be held responsible for the consequences.'))

    story.append(p('9.5  Payment of Subscription Fees', H2))
    story.append(p(
        'You agree to pay your Subscription Fee on time and in full. '
        'Fees are payable in advance by PayFast, debit order, or EFT. '
        'Failed payments are subject to a seven-day grace period, after '
        'which your Services may be suspended as set out in Section 12.'))

    story.append(p('9.6  Courtesy and Respect', H2))
    story.append(p(
        'You agree to treat our staff, Legal Advisors, and contractors '
        'with courtesy and respect at all times. Abusive, threatening, '
        'or harassing behaviour will not be tolerated. We reserve the '
        'right to terminate this Agreement immediately and without '
        'refund where a Subscriber engages in such behaviour.'))

    story.append(p('9.7  Consequences of Breach', H2))
    story.append(p(
        'If you breach any of the responsibilities above, we will '
        'normally give you written notice and an opportunity to remedy '
        'the breach within a reasonable period. For serious or '
        'repeated breaches, we may pause or cancel your Services '
        'immediately. Where we cancel for material breach, no refund is '
        'payable for the current billing cycle, but any prepaid annual '
        'fees for future months will be refunded on a pro-rata basis '
        'less the reasonable value of Services already rendered.'))
    story.append(PageBreak())

    # =====================================================================
    # SECTION 10 — Confidentiality & POPIA Compliance
    # =====================================================================
    story.append(SectionHeader(10, 'Confidentiality and POPIA Compliance'))
    story.append(p(
        'Protecting your personal information and the confidentiality of '
        'your legal Matters is fundamental to our relationship. This '
        'section explains what information we collect, how we use it, '
        'with whom we share it, and the rights you have under the '
        'Protection of Personal Information Act 4 of 2013 (POPIA).'))

    story.append(p('10.1  Information We Collect', H2))
    story.append(p(
        'We collect personal information that is necessary to provide our '
        'Services and to comply with our statutory obligations. This '
        'includes your name, identity number, contact details, FICA '
        'documents, payment information, and the substance of your '
        'Matters (consultation notes, correspondence, documents, and '
        'pleadings). We also collect technical information about your '
        'use of the Member Portal, such as login times and IP address, '
        'for security and fraud prevention.'))

    story.append(p('10.2  How We Use Your Information', H2))
    story.append(p(
        'We use your personal information to provide the Services you '
        'have subscribed to, to communicate with you about your Matters, '
        'to process your Subscription Fees, to comply with our statutory '
        'obligations under FICA and POPIA, to maintain our internal '
        'records, and to improve the quality of our Services. We do not '
        'sell your personal information to third parties under any '
        'circumstances.'))

    story.append(p('10.3  Sharing of Information', H2))
    story.append(p(
        'We share your personal information only where it is necessary '
        'to provide the Services, where we are required to do so by law, '
        'or where you have consented. In particular, we share information '
        'with your assigned Legal Advisor and any Network Legal Advisor '
        'instructed on your behalf, with PayFast and our payment '
        'partners to process Subscription Fees, with the Legal Practice '
        'Council and other regulators where required, and with courts '
        'and tribunals where necessary to represent you.'))

    story.append(p('10.4  Data Security', H2))
    story.append(p(
        'We take reasonable technical and organisational measures to '
        'protect your personal information against loss, unauthorised '
        'access, alteration, or disclosure. These measures include '
        'encryption in transit and at rest, access controls limited to '
        'authorised staff and Legal Advisors, regular security audits, '
        'and staff training on POPIA compliance. Despite these measures, '
        'no system can be guaranteed to be perfectly secure, and we '
        'cannot guarantee the security of information transmitted over '
        'the internet.'))

    story.append(p('10.5  Your Rights Under POPIA', H2))
    story.append(p(
        'As a Subscriber, you have the following rights under POPIA in '
        'relation to your personal information:'))
    story.append(bullet_list([
        '<b>Right of access.</b> You may request a copy of the personal information we hold about you.',
        '<b>Right to correction.</b> You may request that we correct inaccurate or out-of-date personal information.',
        '<b>Right to deletion.</b> In limited circumstances (for example, where the information is no longer necessary), you may request that we delete your personal information, subject to our statutory record-keeping obligations under FICA.',
        '<b>Right to object.</b> You may object to the processing of your personal information for direct marketing purposes at any time.',
        '<b>Right to withdraw consent.</b> Where we process your personal information on the basis of your consent, you may withdraw that consent at any time, without affecting the lawfulness of processing before the withdrawal.',
        '<b>Right to complain.</b> You have the right to lodge a complaint with the Information Regulator (www.inforegulator.org.za) if you believe that we have processed your personal information in breach of POPIA.',
    ]))

    story.append(p('10.6  Confidentiality of Legal Matters', H2))
    story.append(p(
        'All communication between you and your Legal Advisor is '
        'confidential and is subject to legal professional privilege '
        'where the requirements for privilege are met. We will not '
        'disclose the substance of your Matters to any third party '
        'without your consent, except where we are required to do so by '
        'law or by order of a court of competent jurisdiction.'))

    story.append(p('10.7  Data Retention', H2))
    story.append(p(
        'We retain your personal information for as long as your '
        'subscription is active, and for a period of five years after '
        'your subscription ends, in line with our statutory '
        'record-keeping obligations under FICA. Matter files may be '
        'retained for longer where this is required by the rules of '
        'court, the Legal Practice Council, or other regulatory '
        'authorities.'))
    story.append(PageBreak())

    # =====================================================================
    # SECTION 11 — Communication
    # =====================================================================
    story.append(SectionHeader(11, 'Communication'))
    story.append(p(
        'Clear, timely communication is essential to a successful legal '
        'services relationship. This section explains how we communicate '
        'with you, the response timeframes that apply to each plan, and '
        'what you can do to help us reach you promptly.'))

    story.append(p('11.1  Channels We Use', H2))
    story.append(p(
        'We communicate with Subscribers through the following channels: '
        'email, SMS, WhatsApp, the Member Portal, the Infinity AI '
        'Assistant (in-app chat), telephone, and video call. We choose '
        'the channel based on the nature and urgency of the message. For '
        'example, appointment reminders are normally sent by SMS or '
        'WhatsApp, while substantive legal advice is communicated by '
        'email or in-app message so that there is a durable record.'))

    story.append(p('11.2  Keeping Your Contact Details Up to Date', H2))
    story.append(p(
        'You are responsible for keeping your contact details up to date '
        'on the Member Portal. If your email address, phone number, or '
        'physical address changes, please update it promptly. We cannot '
        'be held responsible for messages that do not reach you because '
        'your contact details are out of date.'))

    story.append(p('11.3  Response Timeframes', H2))
    story.append(p(
        'We aim to acknowledge every service request within the following '
        'timeframes, counted from the moment the request is received on '
        'the Member Portal:'))
    response_data = [
        [Paragraph('Plan', TABLE_HEADER),
         Paragraph('Acknowledgement', TABLE_HEADER_CENTER),
         Paragraph('First Response from Legal Advisor', TABLE_HEADER_CENTER)],
        [Paragraph('Civil Legal Plan', TABLE_CELL_BOLD),
         Paragraph('Within 24 business hours', TABLE_CELL_CENTER),
         Paragraph('Within 2 business days', TABLE_CELL_CENTER)],
        [Paragraph('Labour Legal Plan', TABLE_CELL_BOLD),
         Paragraph('Within 4 business hours', TABLE_CELL_CENTER),
         Paragraph('Within 1 business day', TABLE_CELL_CENTER)],
        [Paragraph('Extensive Plan', TABLE_CELL_BOLD),
         Paragraph('Within 4 business hours (12 hours off-hours)', TABLE_CELL_CENTER),
         Paragraph('Within 1 business day', TABLE_CELL_CENTER)],
    ]
    response_widths = [CONTENT_W * 0.30, CONTENT_W * 0.35, CONTENT_W * 0.35]
    response_table = Table(response_data, colWidths=response_widths,
                           repeatRows=1)
    response_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, NAVY_50]),
        ('LINEBELOW', (0, 0), (-1, 0), 1.5, GOLD),
        ('LINEBELOW', (0, 1), (-1, -2), 0.5, NAVY_200),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(response_table)
    story.append(small_gap(8))

    story.append(p('11.4  Urgent Matters', H2))
    story.append(p(
        'If you have an urgent Matter (for example, you have been '
        'arrested, you have a court appearance the next morning, or you '
        'have received a summons with a deadline), please mark the '
        'service request as "Urgent" on the Member Portal or call our '
        'contact centre on 0861 4 LEGAL. Extensive Plan Subscribers may '
        'use the 24/7 priority support line for after-hours emergencies. '
        'We will do everything reasonably possible to assist you within '
        'the relevant timeframes above.'))

    story.append(p('11.5  In-App Chat and the Infinity AI Assistant', H2))
    story.append(p(
        'The Member Portal includes an in-app chat function that you can '
        'use to send messages to your Legal Advisor. The Infinity AI '
        'Assistant is also available in-app to answer common legal '
        'questions, route complex Matters to a human Legal Advisor, and '
        'help you find your way around the portal. Messages sent to your '
        'Legal Advisor are normally answered within the response '
        'timeframes above.'))
    story.append(PageBreak())

    # =====================================================================
    # SECTION 12 — Subscription Fees & Payment
    # =====================================================================
    story.append(SectionHeader(12, 'Subscription Fees and Payment'))
    story.append(p(
        'This section sets out the fees for each plan, the payment methods '
        'we accept, when fees are due, and what happens if a payment '
        'fails. Fees are quoted in South African Rand and include '
        'value-added tax where applicable. We may change our fees from '
        'time to time in accordance with Section 13.'))

    story.append(p('12.1  Current Fees', H2))
    fee_data = [
        [Paragraph('Plan', TABLE_HEADER),
         Paragraph('Monthly', TABLE_HEADER_CENTER),
         Paragraph('Annual', TABLE_HEADER_CENTER),
         Paragraph('Annual Saving', TABLE_HEADER_CENTER)],
        [Paragraph('Civil Legal Plan', TABLE_CELL_BOLD),
         Paragraph('R99', TABLE_CELL_CENTER),
         Paragraph('R999', TABLE_CELL_CENTER),
         Paragraph('~R189 (16%)', TABLE_CELL_CENTER)],
        [Paragraph('Labour Legal Plan', TABLE_CELL_BOLD),
         Paragraph('R99', TABLE_CELL_CENTER),
         Paragraph('R999', TABLE_CELL_CENTER),
         Paragraph('~R189 (16%)', TABLE_CELL_CENTER)],
        [Paragraph('Extensive Plan', TABLE_CELL_BOLD),
         Paragraph('R139', TABLE_CELL_CENTER),
         Paragraph('R1 399', TABLE_CELL_CENTER),
         Paragraph('~R269 (16%)', TABLE_CELL_CENTER)],
    ]
    fee_widths = [CONTENT_W * 0.32, CONTENT_W * 0.20, CONTENT_W * 0.22, CONTENT_W * 0.26]
    fee_table = Table(fee_data, colWidths=fee_widths, repeatRows=1)
    fee_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, NAVY_50]),
        ('LINEBELOW', (0, 0), (-1, 0), 1.5, GOLD),
        ('LINEBELOW', (0, 1), (-1, -2), 0.5, NAVY_200),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(fee_table)
    story.append(small_gap(8))

    story.append(p('12.2  Payment Methods', H2))
    story.append(p(
        'We accept the following payment methods. All payments are '
        'processed in South African Rand through secure, PCI-compliant '
        'payment partners.'))
    story.append(bullet_list([
        '<b>PayFast (online card or instant EFT).</b> The default payment method for new Subscribers. PayFast supports all major South African credit and debit cards as well as instant EFT from major banks. Your card details are stored securely by PayFast and are never seen by us.',
        '<b>Debit order.</b> A recurring debit order against your South African bank account, processed on the first business day of each month. Debit orders are convenient for monthly subscriptions and avoid the need to manually pay each month.',
        '<b>Manual EFT.</b> A once-off or recurring electronic funds transfer to our bank account. If you pay by manual EFT, please use your Subscriber reference number so that we can allocate the payment to your account without delay.',
    ]))

    story.append(p('12.3  When Fees Are Due', H2))
    story.append(p(
        'Monthly Subscription Fees are due on the first day of each '
        'calendar month and are payable in advance. Annual Subscription '
        'Fees are due on the anniversary of your activation date and are '
        'payable in advance. If your payment method fails on the due '
        'date, we will retry the payment on three further occasions over '
        'the following seven days and will notify you by email and SMS '
        'each time.'))

    story.append(p('12.4  Failed Payments and Suspension', H2))
    story.append(p(
        'If your Subscription Fee remains unpaid seven calendar days '
        'after the due date, your Services will be suspended. During '
        'suspension, you retain access to the Member Portal and to your '
        'historical Matter files, but you cannot open new Matters or '
        'consultations. If your subscription remains unpaid for a '
        'further 30 days, your subscription will be cancelled in '
        'accordance with Section 14.'))
    story.append(CalloutBox(
        'NOTE — Reinstatement',
        ['If your subscription is suspended and you then pay the '
         'outstanding amount in full, your Services will be reinstated '
         'within one business day. No re-onboarding is required, and '
         'your existing Matters will continue without interruption.']))

    story.append(p('12.5  Annual Subscription Discount', H2))
    story.append(p(
        'Annual subscriptions are discounted by approximately 16 per '
        'cent compared to twelve monthly payments. The discount is '
        'applied automatically when you select the annual billing option '
        'on the Member Portal. Annual subscriptions are non-refundable '
        'except as set out in the refund policy in Section 14.'))
    story.append(PageBreak())

    # =====================================================================
    # SECTION 13 — Changes to Plans, Fees, and Terms
    # =====================================================================
    story.append(SectionHeader(13, 'Changes to Plans, Fees, and Terms'))
    story.append(p(
        'From time to time we may need to change our plans, our fees, or '
        'the terms of this Agreement. This section explains how we make '
        'such changes, the notice we give, and the rights you have if '
        'you do not agree with a change. We are committed to '
        'transparency: no Subscriber will ever be surprised by a change '
        'to their plan or fee.'))

    story.append(p('13.1  Notice of Changes', H2))
    story.append(p(
        'We will give you at least 31 calendar days\' written notice of '
        'any change to your plan, your Subscription Fee, or the terms of '
        'this Agreement. Notice will be sent by email to the address '
        'registered on your account, and will also be posted in the '
        'announcements section of the Member Portal. The notice will '
        'explain what is changing, when the change takes effect, and '
        'what your options are.'))

    story.append(p('13.2  Existing Matters Continue Under Previous Terms', H2))
    story.append(p(
        'If a change to fees or terms takes effect while you have an '
        'active Matter, that Matter will continue to be handled under '
        'the terms that applied when the Matter was opened, until the '
        'Matter is concluded. This protects you from mid-Matter changes '
        'and ensures continuity of advice. New Matters opened after the '
        'effective date of the change will be handled under the new '
        'terms.'))

    story.append(p('13.3  Right to Cancel After a Change', H2))
    story.append(p(
        'If we make a change to your Subscription Fee or to a material '
        'term of this Agreement, and you do not agree with the change, '
        'you may cancel your subscription within 31 calendar days of '
        'the effective date of the change. If you cancel under this '
        'clause, you will receive a pro-rata refund of any prepaid '
        'Subscription Fee for the period after the cancellation takes '
        'effect.'))
    story.append(CalloutBox(
        'Example — How the cancellation-after-change right works',
        ['If your monthly fee increases from R99 to R119 with effect '
         'from 1 September, you may cancel any time before 1 October '
         'and receive a full refund of any fee paid for the period '
         'after your cancellation date. You are not locked in by the '
         'fee change.']))

    story.append(p('13.4  Improvements That Do Not Require Notice', H2))
    story.append(p(
        'From time to time we may improve our Services in ways that do '
        'not reduce the value of your plan and do not increase your '
        'Subscription Fee — for example, by adding new features to the '
        'Member Portal, by extending our Network Legal Advisor presence '
        'to a new town, or by improving the Infinity AI Assistant. Such '
        'improvements do not require 31 days\' notice, and we will '
        'communicate them as good news rather than as contractual '
        'changes.'))
    story.append(PageBreak())

    # =====================================================================
    # SECTION 14 — Upgrades, Downgrades & Cancellation
    # =====================================================================
    story.append(SectionHeader(14, 'Upgrades, Downgrades and Cancellation'))
    story.append(p(
        'You are never locked into a plan with Infinity Legal SA. You '
        'may upgrade, downgrade, or cancel your subscription at any '
        'time from the Member Portal, without penalty. This section '
        'sets out how each option works, the effective date of the '
        'change, and the refund policy that applies.'))

    story.append(p('14.1  Upgrades', H2))
    story.append(p(
        'You may upgrade to a higher-tier plan at any time. Upgrades '
        'take effect immediately on confirmation. You are charged a '
        'pro-rata fee for the difference between your current plan and '
        'the upgraded plan for the remainder of the current billing '
        'cycle. From the start of the next billing cycle, you are '
        'charged the full Subscription Fee of the upgraded plan.'))
    story.append(p(
        'When you upgrade, your active Matters continue without '
        'interruption, and any document capacity you have already used '
        'is carried over to the upgraded plan\'s higher limit. If you '
        'upgrade to the Extensive Plan, a dedicated Legal Advisor is '
        'assigned to your account within 48 hours.'))

    story.append(p('14.2  Downgrades', H2))
    story.append(p(
        'You may downgrade to a lower-tier plan at any time. Downgrades '
        'take effect at the start of the next billing cycle, so that '
        'you continue to enjoy the higher-tier services you have '
        'already paid for. From the start of the next billing cycle, '
        'you are charged the Subscription Fee of the downgraded plan.'))
    story.append(p(
        'When you downgrade, your active Matters continue under the '
        'terms of the higher-tier plan until they are concluded. New '
        'Matters opened after the effective date of the downgrade are '
        'handled under the lower-tier plan. If you have more active '
        'Matters or documents than the lower-tier plan allows, we will '
        'discuss with you how to manage the transition.'))

    story.append(p('14.3  Cancellation by You', H2))
    story.append(p(
        'You may cancel your subscription at any time, without penalty '
        'and without giving a reason. To cancel, use the cancellation '
        'function in the Member Portal, or email '
        'client.services@infinitylegal.co.za. Your cancellation takes '
        'effect at the end of the current billing cycle.'))

    story.append(p('14.4  Refund Policy', H2))
    story.append(p(
        'The refund policy depends on whether you pay monthly or '
        'annually, and on whether you have used any Services in the '
        'current billing cycle:'))
    story.append(bullet_list([
        '<b>Monthly subscriptions.</b> No refund is given for the current month, because the Subscription Fee is payable in advance. You will not be charged for any subsequent month. You retain access to the Member Portal and to your historical Matter files after cancellation.',
        '<b>Annual subscriptions.</b> A pro-rata refund is given for the unused full months remaining in your annual cycle, less the reasonable value of any Services already rendered. For example, if you cancel after six months of an annual subscription, you receive a refund of approximately six-twelfths of the annual fee, less the value of Services rendered in the six months you were a Subscriber.',
        '<b>Cooling-off period.</b> If you cancel within the seven-day cooling-off period and have used no Services, you receive a full refund (see Section 5).',
        '<b>Cancellation after a change.</b> If you cancel within 31 days of a fee or term change (see Section 13), you receive a pro-rata refund for the period after the cancellation takes effect.',
    ]))

    story.append(p('14.5  Cancellation by Us', H2))
    story.append(p(
        'We may cancel your subscription only for material breach of '
        'this Agreement (for example, persistent non-payment, fraud, or '
        'abusive behaviour towards our staff) and only after giving you '
        'written notice and a reasonable opportunity to remedy the '
        'breach, except in cases of fraud or abuse where we may cancel '
        'immediately. Where we cancel for material breach, any prepaid '
        'annual fees for future months are refunded on a pro-rata basis '
        'less the reasonable value of Services already rendered.'))
    story.append(PageBreak())

    # =====================================================================
    # SECTION 15 — Disputes & Complaints
    # =====================================================================
    story.append(SectionHeader(15, 'Disputes and Complaints'))
    story.append(p(
        'We are committed to resolving any dispute or complaint '
        'promptly, fairly, and at the lowest possible level. This '
        'section sets out our internal complaints process and the '
        'external escalation routes available to you. We are a legal '
        'services company regulated by the Legal Practice Council of '
        'South Africa, and we take complaints seriously.'))

    story.append(p('15.1  Internal Complaints Process', H2))
    story.append(p(
        'If you have a complaint about any aspect of our Services, '
        'please contact our Client Services team at '
        '<b>client.services@infinitylegal.co.za</b> or call '
        '<b>0861 4 LEGAL (0861 453 425)</b>. Please provide your '
        'Subscriber reference number, a clear description of the '
        'complaint, and the outcome you are seeking.'))
    story.append(p(
        'We will acknowledge your complaint within two business days '
        'and provide a substantive response within ten business days. '
        'If the complaint requires further investigation, we will tell '
        'you when you can expect a full response, normally within '
        'twenty business days.'))

    story.append(p('15.2  Escalation to the Managing Director', H2))
    story.append(p(
        'If you are not satisfied with the response from our Client '
        'Services team, you may escalate your complaint to the '
        'Managing Director by email at <b>md@infinitylegal.co.za</b>. '
        'The Managing Director will review the complaint, the response '
        'provided, and any additional information you provide, and will '
        'respond within ten business days. The Managing Director\'s '
        'decision is the final step in our internal complaints process.'))

    story.append(p('15.3  Escalation to the Legal Practice Council', H2))
    story.append(p(
        'If your complaint is about the professional conduct of one of '
        'our Legal Advisors and you are not satisfied with our internal '
        'response, you may refer the complaint to the Legal Practice '
        'Council of South Africa, which is the statutory regulatory '
        'body for legal practitioners. The Legal Practice Council can '
        'be contacted as follows:'))
    story.append(bullet_list([
        '<b>Website:</b> www.legalpracticecouncil.org.za',
        '<b>Email:</b> complaints@lpc.org.za',
        '<b>Postal address:</b> The Legal Practice Council, 1st Floor, '
        'Lily Arrow Office Park, 387 Pretoria Avenue, Randburg, 2194',
        '<b>Complaints line:</b> 011 830 6200',
    ]))

    story.append(p('15.4  Escalation to the Legal Practice Council Ombud', H2))
    story.append(p(
        'If your complaint remains unresolved after the Legal Practice '
        'Council has considered it, you may refer it to the Legal '
        'Practice Council\'s Ombud, who is an independent officer '
        'appointed to resolve disputes between legal practitioners and '
        'their clients. The Ombud\'s decision is binding on the legal '
        'practitioner concerned and may be appealed to the High Court '
        'on a point of law only.'))

    story.append(p('15.5  Other Statutory Avenues', H2))
    story.append(p(
        'Depending on the nature of your Matter, you may also have '
        'rights under the Consumer Protection Act 68 of 2008, which '
        'allows consumers to refer complaints to the National Consumer '
        'Commission or the National Consumer Tribunal, and under the '
        'Protection of Personal Information Act 4 of 2013, which allows '
        'complaints to be referred to the Information Regulator. We '
        'will not treat the use of any statutory avenue as a breach of '
        'this Agreement.'))
    story.append(PageBreak())

    # =====================================================================
    # SECTION 16 — Limitation of Liability
    # =====================================================================
    story.append(SectionHeader(16, 'Limitation of Liability'))
    story.append(p(
        'This section sets out the limits on our liability to you in '
        'respect of the Services we provide. The limits are consistent '
        'with the standard practice of professional services firms in '
        'South Africa and are necessary so that we can offer affordable '
        'subscription pricing to all Subscribers. Nothing in this '
        'section excludes liability that cannot be excluded by law.'))

    story.append(p('16.1  No Guarantee of Outcome', H2))
    story.append(p(
        'Legal matters are inherently uncertain. The outcome of any '
        'Matter depends on facts that may not be fully known, on the '
        'evidence available, on the decisions of courts and tribunals, '
        'and on the conduct of other parties. We do not guarantee any '
        'specific outcome in any Matter. We do guarantee that we will '
        'provide the Services with reasonable care and skill, in '
        'accordance with the standards expected of legal practitioners '
        'in South Africa.'))

    story.append(p('16.2  Cap on Liability', H2))
    story.append(p(
        'Our aggregate liability to you in respect of any Matter, '
        'series of Matters, or this Agreement as a whole, whether in '
        'contract, delict (including negligence), or otherwise, is '
        'limited to the total Subscription Fees paid by you to us in '
        'the twelve calendar months preceding the event giving rise to '
        'the liability. This cap does not apply to liability for '
        'death or personal injury caused by our negligence, or for '
        'fraud or fraudulent misrepresentation.'))

    story.append(p('16.3  Exclusion of Indirect and Consequential Damages', H2))
    story.append(p(
        'To the fullest extent permitted by law, we are not liable to '
        'you for any indirect, incidental, special, or consequential '
        'damages of any kind, including loss of profits, loss of '
        'business, loss of goodwill, loss of opportunity, or loss of '
        'data, whether arising in contract, delict (including '
        'negligence), or otherwise, even if we have been advised of '
        'the possibility of such damages.'))

    story.append(p('16.4  Advice Based on Information Provided', H2))
    story.append(p(
        'All advice we give is based on the information you provide to '
        'us. If that information is incomplete, inaccurate, or '
        'misleading, the advice may be wrong, and we cannot accept '
        'responsibility for the consequences. You are responsible for '
        'ensuring that the information you provide to us is truthful, '
        'accurate, and complete, as set out in Section 9.'))

    story.append(p('16.5  Third-Party Services', H2))
    story.append(p(
        'Where we refer you to a Network Legal Advisor or to a '
        'specialist practitioner outside our network, the relationship '
        'in respect of that referral is between you and that '
        'practitioner. We are not liable for the acts or omissions of '
        'such practitioners, although we will use reasonable efforts to '
        'ensure that they meet our professional standards.'))

    story.append(p('16.6  Force Majeure', H2))
    story.append(p(
        'We are not liable for any failure or delay in performing our '
        'obligations under this Agreement to the extent that the '
        'failure or delay is caused by an event beyond our reasonable '
        'control, including acts of God, natural disasters, pandemics, '
        'war, terrorism, civil unrest, industrial action, failure of '
        'utilities or telecommunications, and decisions of courts or '
        'regulators. We will use reasonable efforts to resume '
        'performance as soon as reasonably practicable after the event.'))
    story.append(PageBreak())

    # =====================================================================
    # SECTION 17 — General Terms
    # =====================================================================
    story.append(SectionHeader(17, 'General Terms'))
    story.append(p(
        'This section sets out the general legal terms that apply to '
        'this Agreement. These terms are standard for professional '
        'services contracts in South Africa and are designed to '
        'provide certainty for both parties.'))

    story.append(p('17.1  Entire Agreement', H2))
    story.append(p(
        'This Agreement, together with the Schedule of Benefits in '
        'Section 2 and any documents expressly referred to in it, '
        'constitutes the entire agreement between you and us in '
        'respect of its subject matter. It supersedes all previous '
        'agreements, negotiations, representations, and understandings, '
        'whether written or oral. Each party acknowledges that it has '
        'not relied on any representation, warranty, or statement '
        'other than those expressly set out in this Agreement.'))

    story.append(p('17.2  Severability', H2))
    story.append(p(
        'If any provision of this Agreement is held by a court of '
        'competent jurisdiction to be invalid, illegal, or '
        'unenforceable, the remaining provisions continue in full '
        'force and effect. The invalid provision is deemed modified to '
        'the minimum extent necessary to make it valid, legal, and '
        'enforceable, or, if it cannot be so modified, is deemed '
        'deleted.'))

    story.append(p('17.3  Governing Law', H2))
    story.append(p(
        'This Agreement is governed by and construed in accordance with '
        'the laws of the Republic of South Africa. The parties submit '
        'to the exclusive jurisdiction of the courts of the Republic '
        'of South Africa in respect of any dispute arising out of or '
        'in connection with this Agreement, except where a statute '
        'provides for a different forum (for example, the CCMA in '
        'respect of labour disputes, or the Legal Practice Council in '
        'respect of professional conduct complaints).'))

    story.append(p('17.4  Amendments Must Be in Writing', H2))
    story.append(p(
        'No amendment or variation of this Agreement is effective '
        'unless it is in writing and signed by an authorised '
        'representative of each party. For purposes of this clause, '
        'an email sent from a registered Infinity Legal SA email '
        'address and signed by a director or the Managing Director '
        'constitutes a writing signed by us.'))

    story.append(p('17.5  No Waiver', H2))
    story.append(p(
        'No failure or delay by us in exercising any right or remedy '
        'under this Agreement is a waiver of that right or remedy. No '
        'single or partial exercise of any right or remedy precludes '
        'any further exercise of that right or any other right or '
        'remedy. A waiver is only effective if it is in writing and '
        'signed by us.'))

    story.append(p('17.6  Assignment', H2))
    story.append(p(
        'You may not assign, transfer, or otherwise dispose of any of '
        'your rights or obligations under this Agreement without our '
        'prior written consent. We may assign, transfer, or otherwise '
        'dispose of our rights and obligations under this Agreement to '
        'any successor in title or to any group company, provided that '
        'we give you at least 31 days\' written notice of any such '
        'assignment and that the assignee assumes all our obligations '
        'under this Agreement.'))

    story.append(p('17.7  Notices', H2))
    story.append(p(
        'Any notice under this Agreement must be in writing and is '
        'best sent through the Member Portal, by email, or by WhatsApp '
        'to the contact details registered on your account. Notices '
        'sent to us should be addressed to '
        'client.services@infinitylegal.co.za. Notices are deemed '
        'received on the day they are sent if sent before 16:00 South '
        'African time on a business day, and on the next business day '
        'otherwise.'))

    story.append(p('17.8  Relationship of the Parties', H2))
    story.append(p(
        'Nothing in this Agreement is intended to constitute a '
        'partnership, joint venture, agency, or employment relationship '
        'between you and us. Our Legal Advisors and Network Legal '
        'Advisors act on our behalf in providing Services to you and '
        'do not contract personally with you.'))

    story.append(p('17.9  Consumer Protection Act', H2))
    story.append(p(
        'You are a consumer of legal services for purposes of the '
        'Consumer Protection Act 68 of 2008. Nothing in this Agreement '
        'is intended to limit any right you have under that Act that '
        'cannot be limited by agreement. Where any term of this '
        'Agreement is inconsistent with a non-excludable right you '
        'have under the Consumer Protection Act, that Act prevails to '
        'the extent of the inconsistency.'))

    story.append(p('17.10  Contact Details', H2))
    story.append(p(
        'Our contact details for all purposes under this Agreement '
        'are: <b>Infinity Legal SA (Pty) Ltd</b>, Reg. No. '
        '2024/123456/07, registered with the Legal Practice Council '
        'of South Africa, email <b>legal@infinitylegal.co.za</b>, '
        'telephone <b>0861 4 LEGAL (0861 453 425)</b>, website '
        '<b>www.infinitylegal.co.za</b>.'))
    story.append(PageBreak())

    # =====================================================================
    # SERVICE & CONTACT POINTS page
    # =====================================================================
    story.append(PageHeader('Service', 'Service and Contact Points',
                            key='contact'))
    story.append(p(
        'Infinity Legal SA is primarily a digital legal services company, '
        'supported by a contact centre and a Johannesburg office. The '
        'table below summarises every channel through which you can '
        'reach us. Our Member Portal and Infinity AI Assistant are '
        'available 24 hours a day, every day of the year.'))

    contact_data = [
        [Paragraph('Service', TABLE_HEADER),
         Paragraph('Channel', TABLE_HEADER),
         Paragraph('Details', TABLE_HEADER)],
        [Paragraph('Member Portal', TABLE_CELL_BOLD),
         Paragraph('Web', TABLE_CELL),
         Paragraph('portal.infinitylegal.co.za', TABLE_CELL)],
        [Paragraph('Infinity AI Assistant', TABLE_CELL_BOLD),
         Paragraph('In-app chat', TABLE_CELL),
         Paragraph('Available 24/7 inside the Member Portal', TABLE_CELL)],
        [Paragraph('Contact Centre', TABLE_CELL_BOLD),
         Paragraph('Telephone', TABLE_CELL),
         Paragraph('0861 4 LEGAL  (0861 453 425)', TABLE_CELL)],
        [Paragraph('WhatsApp', TABLE_CELL_BOLD),
         Paragraph('Mobile', TABLE_CELL),
         Paragraph('011 842 7890', TABLE_CELL)],
        [Paragraph('General Email', TABLE_CELL_BOLD),
         Paragraph('Email', TABLE_CELL),
         Paragraph('legal@infinitylegal.co.za', TABLE_CELL)],
        [Paragraph('Client Services & Complaints', TABLE_CELL_BOLD),
         Paragraph('Email', TABLE_CELL),
         Paragraph('client.services@infinitylegal.co.za', TABLE_CELL)],
        [Paragraph('Managing Director', TABLE_CELL_BOLD),
         Paragraph('Email', TABLE_CELL),
         Paragraph('md@infinitylegal.co.za', TABLE_CELL)],
        [Paragraph('Johannesburg Office', TABLE_CELL_BOLD),
         Paragraph('In-person', TABLE_CELL),
         Paragraph('By appointment only — book via the Member Portal', TABLE_CELL)],
        [Paragraph('Facebook', TABLE_CELL_BOLD),
         Paragraph('Social', TABLE_CELL),
         Paragraph('@infinitylegalSA', TABLE_CELL)],
        [Paragraph('Instagram', TABLE_CELL_BOLD),
         Paragraph('Social', TABLE_CELL),
         Paragraph('@infinitylegalSA', TABLE_CELL)],
        [Paragraph('TikTok', TABLE_CELL_BOLD),
         Paragraph('Social', TABLE_CELL),
         Paragraph('@infinitylegalSA', TABLE_CELL)],
    ]
    contact_widths = [CONTENT_W * 0.30, CONTENT_W * 0.18, CONTENT_W * 0.52]
    contact_table = Table(contact_data, colWidths=contact_widths,
                          repeatRows=1)
    contact_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, NAVY_50]),
        ('LINEBELOW', (0, 0), (-1, 0), 1.5, GOLD),
        ('LINEBELOW', (0, 1), (-1, -2), 0.5, NAVY_200),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(contact_table)
    story.append(small_gap(12))

    story.append(p('Response Times by Plan', H2))
    story.append(p(
        'Our response timeframes vary by plan and are set out in '
        'Section 11. As a quick reminder: Civil Legal Plan Subscribers '
        'can expect acknowledgement within 24 business hours; Labour '
        'Legal Plan and Extensive Plan Subscribers within 4 business '
        'hours (and Extensive Plan Subscribers receive 24/7 priority '
        'support outside business hours).'))

    story.append(p('Branch Network', H2))
    story.append(p(
        'Infinity Legal SA operates a primarily digital service model '
        'so that we can keep our Subscription Fees affordable for all '
        'South Africans. We maintain a single physical office in '
        'Johannesburg for in-person consultations by appointment. '
        'Where a Matter requires local representation elsewhere in '
        'the country, we instruct a Network Legal Advisor in the '
        'relevant town or city at no additional cost to you under '
        'your plan.'))
    story.append(PageBreak())

    # =====================================================================
    # ABOUT INFINITY LEGAL SA page
    # =====================================================================
    story.append(PageHeader('About', 'About Infinity Legal SA',
                            key='about'))
    story.append(p(
        'Infinity Legal SA (Pty) Ltd is a South African legal services '
        'company that makes professional legal advice and representation '
        'affordable and accessible through simple monthly and annual '
        'subscription plans. We are not an insurance company. We do not '
        'sell insurance, we are not underwritten by any insurer, and we '
        'are not registered as a financial services provider. Our '
        'business is the provision of legal services, and our '
        'regulator is the Legal Practice Council of South Africa.'))

    story.append(p('Company Information', H2))
    info_data = [
        [Paragraph('Registered Name', TABLE_HEADER),
         Paragraph('Infinity Legal SA (Pty) Ltd', TABLE_CELL)],
        [Paragraph('Registration Number', TABLE_HEADER),
         Paragraph('2024/123456/07', TABLE_CELL)],
        [Paragraph('Legal Form', TABLE_HEADER),
         Paragraph('Private company (Pty) Ltd, incorporated in the Republic of South Africa', TABLE_CELL)],
        [Paragraph('Regulator', TABLE_HEADER),
         Paragraph('Legal Practice Council of South Africa', TABLE_CELL)],
        [Paragraph('Data Protection', TABLE_HEADER),
         Paragraph('Compliant with the Protection of Personal Information Act 4 of 2013 (POPIA)', TABLE_CELL)],
        [Paragraph('Identity Verification', TABLE_HEADER),
         Paragraph('Compliant with the Financial Intelligence Centre Act 38 of 2001 (FICA)', TABLE_CELL)],
        [Paragraph('Website', TABLE_HEADER),
         Paragraph('www.infinitylegal.co.za', TABLE_CELL)],
        [Paragraph('Member Portal', TABLE_HEADER),
         Paragraph('portal.infinitylegal.co.za', TABLE_CELL)],
        [Paragraph('General Email', TABLE_HEADER),
         Paragraph('legal@infinitylegal.co.za', TABLE_CELL)],
        [Paragraph('Telephone', TABLE_HEADER),
         Paragraph('0861 4 LEGAL  (0861 453 425)', TABLE_CELL)],
        [Paragraph('WhatsApp', TABLE_HEADER),
         Paragraph('011 842 7890', TABLE_CELL)],
        [Paragraph('Office', TABLE_HEADER),
         Paragraph('Johannesburg, Gauteng — by appointment only', TABLE_CELL)],
    ]
    info_widths = [CONTENT_W * 0.32, CONTENT_W * 0.68]
    info_table = Table(info_data, colWidths=info_widths, repeatRows=1)
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), NAVY),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.white),
        ('BACKGROUND', (1, 0), (1, -1), colors.white),
        ('TEXTCOLOR', (1, 0), (1, -1), NAVY_DARK),
        ('LINEBELOW', (0, 0), (-1, -2), 0.5, NAVY_200),
        ('LINEAFTER', (0, 0), (0, -1), 1.5, GOLD),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(info_table)
    story.append(small_gap(12))

    story.append(p('Our Mission', H2))
    story.append(p(
        'Our mission is captured in three words: <b>Justice without '
        'limits.</b> We believe that every South African deserves '
        'access to professional legal advice, regardless of income or '
        'background. By combining modern technology (the Member Portal '
        'and the Infinity AI Assistant) with a network of registered '
        'legal practitioners, we are able to deliver high-quality '
        'legal services at a fraction of the traditional cost.'))
    story.append(p(
        'We are committed to transparent pricing, plain-language '
        'communication, and honest advice. We will tell you when a '
        'Matter has reasonable prospects of success and when it does '
        'not. We will never pressure you into a separate instruction '
        'or a plan upgrade that you do not need. We will treat your '
        'Matters with the same care and urgency that we would wish '
        'for our own families.'))

    story.append(p('Our Regulator and Your Protection', H2))
    story.append(p(
        'As a legal services company registered with the Legal '
        'Practice Council of South Africa, we are subject to the '
        'rules of professional conduct that apply to all legal '
        'practitioners in South Africa. These rules are designed to '
        'protect you, the client, and they include duties of '
        'confidentiality, diligence, candour, and loyalty. If you '
        'believe that we have breached any of these duties, you may '
        'refer a complaint to the Legal Practice Council as set out '
        'in Section 15.'))
    story.append(p(
        'As a Subscriber, you also benefit from the Consumer '
        'Protection Act 68 of 2008, which provides additional '
        'protections for consumers of services in South Africa, and '
        'from the Protection of Personal Information Act 4 of 2013, '
        'which protects your personal information as described in '
        'Section 10.'))

    story.append(small_gap(8))
    story.append(GoldRule(width=CONTENT_W))
    story.append(small_gap(6))
    story.append(Paragraph(
        '<i>Justice without limits.</i>',
        ParagraphStyle('Closing', fontName='LibSerif-Italic', fontSize=14,
                       leading=18, textColor=GOLD_DARK, alignment=TA_CENTER,
                       spaceBefore=8, spaceAfter=4)))
    story.append(Paragraph(
        'Reference: ILS PERSONAL/2025/06/01  ·  Issued: June 2025  ·  '
        'Infinity Legal SA (Pty) Ltd  ·  Reg. No. 2024/123456/07',
        ParagraphStyle('ClosingMeta', fontName='LibSans', fontSize=8,
                       leading=11, textColor=TEXT_MUTED, alignment=TA_CENTER)))

    return story


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    out_path = '/home/z/my-project/upload/body.pdf'
    doc = TocDocTemplate(
        out_path,
        pagesize=A4,
        leftMargin=MARGIN_L,
        rightMargin=MARGIN_R,
        topMargin=MARGIN_T,
        bottomMargin=MARGIN_B,
        title='Infinity Legal SA Personal Legal Services Subscription Agreement',
        author='Infinity Legal SA',
        subject='Personal Legal Services Subscription Agreement',
        creator='Infinity Legal SA',
    )
    story = build_story()
    doc.multiBuild(story, onFirstPage=header_footer, onLaterPages=header_footer)
    print(f'✓ Body PDF written: {out_path}')


if __name__ == '__main__':
    main()
