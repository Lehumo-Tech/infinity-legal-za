#!/usr/bin/env python3
"""
Infinity Legal SA - Personal Legal Membership Agreement
Body PDF generator (ReportLab).

This script builds the body of the policy document. The cover is rendered
separately as HTML -> PDF and merged afterwards via pypdf.

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
# Brand palette (overrides auto-generated cascade palette — brand colours win)
# ---------------------------------------------------------------------------
NAVY        = colors.HexColor('#0c1e3c')   # primary navy
NAVY_DARK   = colors.HexColor('#081428')   # darkest navy (body text)
NAVY_LIGHT  = colors.HexColor('#132d52')   # lighter navy
NAVY_700    = colors.HexColor('#1a3358')   # navy 700
NAVY_50     = colors.HexColor('#f0f4f8')   # navy tint (callout bg)
NAVY_100    = colors.HexColor('#dbe4ed')   # navy 100 (table stripe)
NAVY_200    = colors.HexColor('#b8c9dc')   # navy 200 (borders)

GOLD        = colors.HexColor('#c9a84c')   # accent gold
GOLD_DARK   = colors.HexColor('#a88832')   # gold dark
GOLD_LIGHT  = colors.HexColor('#dfc475')   # gold light
GOLD_50     = colors.HexColor('#fdf8ed')   # gold tint

TEXT_PRIMARY = NAVY_DARK
TEXT_MUTED   = colors.HexColor('#5a6a82')
BORDER       = colors.HexColor('#c5d1e0')

# Aliases for table styling
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
TABLE_CELL = ParagraphStyle(
    'TableCell', fontName='LibSerif', fontSize=9.5, leading=12.5,
    textColor=NAVY_DARK, alignment=TA_LEFT,
)
TABLE_CELL_NUM = ParagraphStyle(
    'TableCellNum', fontName='LibSans-Bold', fontSize=9.5, leading=12.5,
    textColor=NAVY, alignment=TA_CENTER,
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
    """A thin gold horizontal rule with optional navy section number tag."""
    def __init__(self, width=None, thickness=2.0, color=GOLD,
                 label=None, label_color=NAVY):
        super().__init__()
        self.width = width
        self.thickness = thickness
        self.color = color
        self.label = label
        self.label_color = label_color
        self.height = thickness + (12 if label else 0)

    def wrap(self, availWidth, availHeight):
        self._w = self.width or availWidth
        return (self._w, self.height)

    def draw(self):
        c = self.canv
        # Draw the gold rule
        c.setFillColor(self.color)
        c.setStrokeColor(self.color)
        c.rect(0, 0, self._w, self.thickness, stroke=0, fill=1)
        # Optional navy label tag on the left
        if self.label:
            c.setFont('LibSans-Bold', 9)
            c.setFillColor(self.label_color)
            c.drawString(0, self.thickness + 3, self.label)


class SectionHeader(Flowable):
    """Big section header with navy heading, gold rule underneath, and
    a small 'SECTION N' kicker label. Used as an H1-level bookmark target."""
    def __init__(self, number, title, key=None):
        super().__init__()
        self.number = number
        self.title = title
        self.key = key or f'sec_{number}'
        # Bookmark attributes for TOC
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
        # Draw bookmark anchor (invisible)
        c.bookmarkPage(self.key)
        # Kicker
        c.setFont('LibSans-Bold', 8.5)
        c.setFillColor(GOLD_DARK)
        c.drawString(0, self.height - 12, f'SECTION {self.number}'.upper())
        # Title — auto-shrink if too wide for content area
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


class AddendumHeader(Flowable):
    """Header for optional addendums."""
    def __init__(self, title, key=None):
        super().__init__()
        self.title = title
        self.key = key or 'add_' + hashlib.md5(title.encode()).hexdigest()[:8]
        self.bookmark_name = self.key
        self.bookmark_level = 0
        self.bookmark_text = title
        self.bookmark_key = self.key
        self.height = 60

    def wrap(self, availWidth, availHeight):
        self._w = availWidth
        return (self._w, self.height)

    def draw(self):
        c = self.canv
        c.bookmarkPage(self.key)
        c.setFont('LibSans-Bold', 8.5)
        c.setFillColor(GOLD_DARK)
        c.drawString(0, self.height - 12, 'OPTIONAL ADDENDUM')
        c.setFont('LibSans-Bold', 15)
        c.setFillColor(NAVY)
        c.drawString(0, self.height - 32, self.title)
        c.setFillColor(GOLD)
        c.rect(0, self.height - 44, 60, 2.5, stroke=0, fill=1)
        c.setFillColor(NAVY_200)
        c.rect(64, self.height - 43.5, self._w - 64, 1.2, stroke=0, fill=1)


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
        total_h = 14  # top padding
        # Title
        title_p = Paragraph(f'<b>{self.title}</b>', CALLOUT_TITLE)
        _, th = title_p.wrap(inner_w, availHeight)
        total_h += th + 4
        self._title_para = title_p
        # Body paragraphs
        self._wrapped_body = []
        for p in self.body_paragraphs:
            if isinstance(p, str):
                p = Paragraph(p, CALLOUT_BODY)
            _, ph = p.wrap(inner_w, availHeight)
            self._wrapped_body.append((p, ph))
            total_h += ph + 3
        total_h += 8  # bottom padding
        self.height = total_h
        return (self._w, self.height)

    def draw(self):
        c = self.canv
        # Background
        c.setFillColor(self.bg)
        c.setStrokeColor(self.border)
        c.setLineWidth(0)
        c.rect(0, 0, self._w, self.height, stroke=0, fill=1)
        # Left gold accent bar
        c.setFillColor(self.border)
        c.rect(0, 0, 4, self.height, stroke=0, fill=1)
        # Inner content
        x = 14
        y = self.height - 14
        # Title
        _, th = self._title_para.wrap(self._para_width, self.height)
        self._title_para.drawOn(c, x, y - th)
        y -= th + 6
        # Body
        for p, ph in self._wrapped_body:
            p.drawOn(c, x, y - ph)
            y -= ph + 3


# ---------------------------------------------------------------------------
# Page header / footer
# ---------------------------------------------------------------------------
def header_footer(canvas, doc):
    canvas.saveState()
    # Header
    canvas.setFont('LibSans-Bold', 8)
    canvas.setFillColor(NAVY)
    canvas.drawString(MARGIN_L, PAGE_H - 0.45 * inch,
                      'INFINITY LEGAL SA')
    canvas.setFont('LibSerif-Italic', 8)
    canvas.setFillColor(GOLD_DARK)
    canvas.drawString(MARGIN_L + 105, PAGE_H - 0.45 * inch,
                      'Personal Legal Membership Agreement')
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
                      'Justice without limits.')
    # Page number — body PDF page number PLUS ONE (cover is merged in front)
    page_num = doc.page + 1
    canvas.drawRightString(PAGE_W - MARGIN_R, MARGIN_B - 0.45 * inch,
                           f'Page {page_num}')
    # Center small disclaimer
    canvas.setFont('LibSerif-Italic', 7)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawCentredString(PAGE_W / 2, MARGIN_B - 0.45 * inch,
                             'Authorised Financial Services Provider (FSP 53214)')
    canvas.restoreState()


# ---------------------------------------------------------------------------
# TocDocTemplate — page numbers offset by +1 for the merged cover page
# ---------------------------------------------------------------------------
class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            level = getattr(flowable, 'bookmark_level', 0)
            text = getattr(flowable, 'bookmark_text', '')
            key = getattr(flowable, 'bookmark_key', '')
            # +1 to account for the cover page that will be merged in front
            self.notify('TOCEntry', (level, text, self.page + 1, key))


# ---------------------------------------------------------------------------
# Helper builders
# ---------------------------------------------------------------------------
def P(text, style=BODY):
    return Paragraph(text, style)


def bullet_list(items, style=BULLET):
    return ListFlowable(
        [ListItem(Paragraph(t, style), leftIndent=18, value='circle')
         for t in items],
        bulletType='bullet', start='circle', leftIndent=18,
        bulletFontName='LibSans-Bold', bulletFontSize=8, bulletColor=GOLD_DARK,
        spaceBefore=2, spaceAfter=6,
    )


def numbered_list(items, start=1, style=NUMBERED):
    return ListFlowable(
        [ListItem(Paragraph(t, style), leftIndent=22) for t in items],
        bulletType='1', start=start, leftIndent=22,
        bulletFontName='LibSans-Bold', bulletFontSize=10, bulletColor=NAVY,
        spaceBefore=2, spaceAfter=6,
    )


def lettered_list(items, style=LETTERED):
    return ListFlowable(
        [ListItem(Paragraph(t, style), leftIndent=22) for t in items],
        bulletType='a', leftIndent=22,
        bulletFontName='LibSans-Bold', bulletFontSize=10, bulletColor=NAVY,
        spaceBefore=2, spaceAfter=6,
    )


def defn(term, body):
    """Italic definition paragraph with the term bolded inline."""
    return Paragraph(f'<b>"{term}"</b> {body}', DEFINITION)


def section_header(number, title, key=None):
    return SectionHeader(number, title, key=key)


def addendum_header(title, key=None):
    return AddendumHeader(title, key=key)


def callout(title, body_text):
    """A NOTE: or EXAMPLE: callout box."""
    if isinstance(body_text, str):
        paras = [Paragraph(body_text, CALLOUT_BODY)]
    else:
        paras = [Paragraph(t, CALLOUT_BODY) if isinstance(t, str) else t
                 for t in body_text]
    return CalloutBox(title, paras)


# ---------------------------------------------------------------------------
# CONTENT — pages 2 onward (cover is page 1, merged later)
# ---------------------------------------------------------------------------
def build_story():
    story = []

    # ===========================================================
    # PAGE 2 — How to Pay & Member Portal
    # ===========================================================
    story.append(Paragraph(
        '<font color="#a88832">INFINITY LEGAL SA</font>',
        ParagraphStyle('HT', fontName='LibSans-Bold', fontSize=9, leading=11,
                       textColor=GOLD_DARK, alignment=TA_LEFT, spaceAfter=2)))
    story.append(Paragraph(
        'How to Pay & Member Portal',
        ParagraphStyle('HP', fontName='LibSans-Bold', fontSize=20, leading=24,
                       textColor=NAVY, alignment=TA_LEFT, spaceAfter=6)))
    story.append(GoldRule(width=70, thickness=2.5))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        'We have made paying your monthly premium as simple and convenient as '
        'possible. Choose any of the payment methods below. Whichever method '
        'you use, please always quote your Infinity Legal SA membership '
        'number so that your payment can be allocated without delay. If you '
        'have any difficulty paying, contact our Member Care team on '
        '<b>0861 4 LEGAL (0861 453 425)</b> or email '
        '<b>legal@infinitylegal.co.za</b> and we will assist you.',
        BODY))

    story.append(Spacer(1, 10))
    story.append(Paragraph('Member Portal', H2))
    story.append(Paragraph(
        'The Infinity Legal SA Member Portal at '
        '<b>portal.infinitylegal.co.za</b> is the fastest and most secure way '
        'to manage your membership. From the portal you can pay your monthly '
        'premium by card or instant EFT, download your membership card, view '
        'your Schedule of Insurance, retrieve a copy of this Membership '
        'Agreement, log a new legal matter, track the status of an existing '
        'matter, and update your personal details. The portal is mobile '
        'friendly and is available 24 hours a day, seven days a week.',
        BODY))

    story.append(Paragraph('Debit Order', H2))
    story.append(Paragraph(
        'A debit order is the recommended way to keep your membership Paid-Up. '
        'On the date you choose, your monthly premium is collected directly '
        'from your nominated bank account. To set up or amend a debit order, '
        'log in to the Member Portal or call <b>0861 4 LEGAL</b> at least '
        '30 days before your next collection date. We do not charge debit '
        'order collection fees, but your own bank may levy a fee for failed '
        'deductions; such fees remain your responsibility.',
        BODY))

    story.append(Paragraph('Stop Order', H2))
    story.append(Paragraph(
        'A stop order is an instruction given by you to your employer to '
        'deduct your premium directly from your salary and pay it to us. This '
        'facility is most commonly available to employees of government '
        'departments, state-owned entities and certain large employers. To '
        'arrange a stop order, contact our Member Care team and we will '
        'provide you with the necessary mandate form for your employer.',
        BODY))

    story.append(Paragraph('Electronic Funds Transfer (EFT)', H2))
    story.append(Paragraph(
        'You may pay your premium by EFT directly into the Infinity Legal SA '
        'bank account. Use your membership number as the payment reference. '
        'Our banking details appear on your membership card, your Schedule of '
        'Insurance and the Member Portal. Please allow two business days for '
        'an EFT to reflect before it shows as Paid-Up on your membership '
        'record.',
        BODY))

    story.append(Paragraph('Retail Outlets', H2))
    story.append(Paragraph(
        'You can pay your monthly premium in cash at any EasyPay-enabled '
        'retail outlet across South Africa. Present your membership card or '
        'quote your EasyPay number (found on the back of your card) to the '
        'cashier, and <b>always ask for a receipt</b>. EasyPay payments '
        'usually reflect on your membership within 24 hours. Participating '
        'retailers include:',
        BODY))
    story.append(bullet_list([
        'Pep and Pep Cell',
        'Shoprite and Checkers',
        'Pick n Pay',
        'Spar',
        'Boxer Superstores',
        'Lewis, Joshua Doore and Russells',
    ]))

    story.append(Paragraph('Infinity Legal SA Branches', H2))
    story.append(Paragraph(
        'Selected Infinity Legal SA branches accept cash and card payments '
        'at the till. When paying at a branch, please present your membership '
        'card to the consultant and retain your receipt. To confirm whether '
        'your nearest branch accepts in-branch payments, call '
        '<b>0861 4 LEGAL</b> or visit <b>www.infinitylegal.co.za/branches</b>.',
        BODY))

    story.append(Spacer(1, 8))
    story.append(callout(
        'NOTE:',
        'Whichever payment method you choose, your membership only becomes '
        'Paid-Up once the funds have reflected in our bank account. To avoid '
        'a break in cover, please pay your premium on or before the 1st day '
        'of every month.'))

    story.append(PageBreak())

    # ===========================================================
    # PAGE 3 — Table of Contents
    # ===========================================================
    story.append(Paragraph('Table of Contents', TOC_HEADING))
    story.append(Paragraph(
        'Personal Legal Membership Agreement · ILS PERSONAL/2025/06/01',
        TOC_SUB))
    story.append(GoldRule(width=70, thickness=2.5))
    story.append(Spacer(1, 12))

    toc = TableOfContents()
    toc.levelStyles = [TOC_LEVEL0, TOC_LEVEL1]
    story.append(toc)

    story.append(PageBreak())

    # ===========================================================
    # SECTION 1 — Interpretation and Definitions
    # ===========================================================
    story.append(section_header(1, 'Interpretation and Definitions'))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        'This Membership Agreement (the "Agreement") is the binding contract '
        'between you, the Member, and Infinity Legal SA. It sets out the '
        'benefits, terms, conditions and exclusions that apply to your '
        'personal legal expenses cover. The headings, diagrams, notes, '
        'examples and any addendums you have selected all form part of this '
        'Agreement and must be read together. The singular includes the '
        'plural and vice versa, and the meaning of certain words is explained '
        'where they are used in the text.',
        BODY))

    story.append(lettered_list([
        '<b>Membership</b> means being an insured person under this insurance '
        'policy (this Agreement) in consideration of the monthly premium in '
        'force from time to time. The monthly premium in force at the time '
        'you join will be shown in your Schedule of Insurance. You will be '
        'advised of subsequent increases as set out in Section 13.',

        '<b>We</b>, <b>Us</b> and <b>Our</b> means the insurer, LegalGuard '
        'Insurance Southern Africa Limited (Reg. No. 2010/045678/06, FSP '
        '48012), and Infinity Legal SA (Pty) Ltd (Reg. No. 2024/123456/07, '
        'FSP 53214), which administers the Agreement as a non-mandated '
        'intermediary.',

        '<b>Main Member</b> is the natural person whose name appears as the '
        'main insured on the application form for Membership.',

        '<b>You</b>, <b>Your</b> and <b>Member</b> means the Main Member and '
        'the following additional persons (proof of relationship may be '
        'requested): the nominated Spouse; the Main Member\'s biological or '
        'legally adopted children under 18 years of age; and the Main '
        'Member\'s biological or legally adopted children aged 18 up to 21 '
        'who are in full-time study at a recognised institution in the '
        'Republic of South Africa (RSA) and who remain financially dependent '
        'on the Main Member or nominated Spouse. Children aged 21 and older '
        'do not qualify for Cover, save as may be provided in the Extended '
        'Family Protection Addendum.',

        '<b>Spouse</b> (including a <b>Life Partner</b>) means a person who, '
        'at the time the Relevant Events occurred, was married to, or living '
        'with, the Main Member as if married by civil rights or customary '
        'law, for at least the Minimum Period as Life Partner shown in your '
        'Schedule of Insurance, and who is still married to, or living with, '
        'the Main Member when a Benefit is claimed.',

        '<b>Extender Member</b> is any Family Member added in terms of the '
        'Extended Family Protection Addendum, excluding any person who does '
        'not qualify in terms of the definition of "You" above.',

        '<b>Membership is confirmed</b> when We issue your Schedule of '
        'Insurance. The Agreement between You and Us has a reference number '
        'shown in your Schedule of Insurance. Please confirm that it matches '
        'the reference number printed on this document (ILS PERSONAL/2025/06/01).',

        '<b>Paid-Up</b> means that every monthly premium has been paid in '
        'full from the date of the Relevant Event or events to the date the '
        'matter is Reported to Us, with no break in your Membership. '
        'Part-payment does not constitute being Paid-Up.',

        '<b>Relevant Event</b> means the event (shown in bold capital letters '
        'in Section 4) that triggers a potential claim under an Insured '
        'Matter. The Relevant Event must occur in the RSA after the Waiting '
        'Period and while your Membership is Paid-Up.',

        '<b>Waiting Period</b> means the period after Membership is '
        'confirmed during which Insurance Cover is not available. The '
        'Waiting Period is shown in your Schedule of Insurance.',

        '<b>Covered</b> (or <b>Insurance Cover</b> or simply <b>Cover</b>) '
        'means that an Insured Matter qualifies for the payment of legal '
        'expenses under Section 2(2) of this Agreement.',

        '<b>Insured Matter</b> means a matter listed in Section 4 that, '
        'provided all conditions are met, potentially qualifies for Cover.',

        '<b>Reported</b> means that We have received your completed Official '
        'Claim Form (OCF), which forms part of this Agreement.',

        '<b>Case</b> means all Court, Tribunal or Arbitration proceedings '
        'based on the same Relevant Events.',

        '<b>Lawyer</b> means a legal practitioner practising in the RSA and '
        'registered with the Legal Practice Council. Throughout this '
        'Agreement the words "Lawyer" and "legal advisor" are used '
        'interchangeably and refer to the same regulated professional.',

        '<b>Legal Advisor</b> means a legal practitioner practising in the '
        'RSA and registered with the Legal Practice Council of South Africa '
        'in terms of the Legal Practice Act 28 of 2014. The words "legal '
        'advisor" and "lawyer" are used interchangeably in this Agreement '
        'and refer to the same regulated profession. Infinity Legal SA uses '
        'the term "legal advisor" throughout this document.',

        '<b>Schedule of Insurance</b> means the document We issue to you '
        'that records your personal details, premium, Waiting Period, '
        'Maximum Limits, First Amount Payable and other key parameters.',
    ]))

    story.append(Spacer(1, 6))
    story.append(callout(
        'NOTE:',
        'The headings, notes, examples, diagrams and addendums in this '
        'Agreement are all part of the contract. If a defined term is used '
        'with a capital letter, it has the meaning given to it in this '
        'Section 1 or where it is first defined in the text.'))

    story.append(PageBreak())

    # ===========================================================
    # SECTION 2 — Membership Benefits
    # ===========================================================
    story.append(section_header(2, 'Membership Benefits'))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        'While your Membership is Paid-Up, you are entitled, subject to the '
        'terms and conditions of this Agreement, to Our Services. Our '
        'Services consist of two complementary components: <b>Legal Advisory '
        'Services</b> (delivered by Our legally trained counsellors) and '
        '<b>Legal Expenses Insurance</b> (the payment of your legal expenses '
        'when a matter qualifies for Cover). Unless otherwise indicated, '
        'both components apply to any Addendums you have selected.',
        BODY))

    story.append(Paragraph('1. Legal Advisory Services', H2))
    story.append(Paragraph(
        'Legal Advisory Services are dispute prevention services that We '
        'provide through Our legally trained counsellors. The aim is to give '
        'Us flexibility to help you as much as We can, and to reduce the '
        'need for Court proceedings wherever possible. Because these '
        'services are provided at no additional cost to you, We provide them '
        'at Our discretion. We may set limits at any time, and We have no '
        'obligation to provide them in any particular matter.',
        BODY))
    story.append(Paragraph(
        'You agree that the provision of Legal Advisory Services to you does '
        'not, on its own, mean that a matter qualifies for Insurance Cover, '
        'nor that you have rights in respect of that matter as if it were an '
        'Insured Matter.',
        BODY))

    story.append(callout(
        'NOTE:',
        'Not many people enjoy disputes or spending time in a Court. It is '
        'generally known that We will pay a Paid-Up Member\'s legal advisor '
        'to take a Covered matter to Court if a dispute cannot be prevented '
        'by Our legal counsellors. Many potential disputes and Court cases '
        'are avoided as a result of that.'))

    story.append(Paragraph(
        'Legal Advisory Services are available for the following categories '
        'of matters:', BODY))
    story.append(bullet_list([
        'An Insured Matter that qualifies for Cover. Even when an Insured '
        'Matter is Covered, We do not pay the legal costs of your legal '
        'advisor to try to resolve the issue before starting a Case. Unless '
        'We agree otherwise, you will be responsible for such costs. If you '
        'wish to avoid that, Our Legal Advisory Services will try to resolve '
        'the issue at no cost to you. If We are unable to resolve the matter, '
        'you may consult a legal advisor of your choice.',

        'An Insured Matter that does not qualify for Cover. This is mainly '
        'when the conditions in this Agreement are not met, such as a '
        'Relevant Event happening before the end of the Waiting Period.',

        'Matters outside the scope of this Agreement, which is when a matter '
        'is not shown as an Insured Matter in any of the Insurance Cover '
        'sections or the Addendums.',

        'The exclusions in Section 6 and in the Addendums, except those that '
        'are specifically excluded from Legal Advisory Services as well, as '
        'indicated in Section 6.',
    ]))

    story.append(Paragraph('2. Legal Expenses Insurance', H2))
    story.append(Paragraph(
        'If We are unable to resolve a matter via Legal Advisory Services '
        'and the matter (a) qualifies for Cover as set out in Section 3 and '
        '(b) is not excluded as set out in Section 6, then, as long as you '
        'remain a Paid-Up Member, We will pay your legal advisor for those '
        'legal expenses set out in Section 7, up to the limits in Section 10, '
        'to represent you in a Case or criminal charge. We refer to this as '
        '"Insurance Cover" or simply "Cover".',
        BODY))
    story.append(defn('Legal Advisor',
        'is a legal practitioner practising in the RSA and registered with '
        'the Legal Practice Council. The words "legal advisor" and "lawyer" '
        'are used interchangeably in this Agreement and refer to the same '
        'regulated profession. Infinity Legal SA uses the term "legal '
        'advisor" throughout this document.'))

    story.append(PageBreak())

    # ===========================================================
    # SECTION 3 — Covered Matters
    # ===========================================================
    story.append(section_header(3, 'Covered Matters'))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        'Section 4 lists Insured Matters that potentially qualify for Cover, '
        'showing the Relevant Event for each. An Insured Matter qualifies '
        'for Cover only if <b>all</b> of the conditions set out below are '
        'met. Where any one condition is not satisfied, the matter will be '
        'treated as not Covered, although Legal Advisory Services may still '
        'be available under Section 2(1).',
        BODY))

    story.append(lettered_list([
        'The Relevant Events that apply to an Insured Matter all happen in '
        'the RSA after the Waiting Period and while your Membership is '
        'Paid-Up.',

        'Where a dispute is about a series of Relevant Events, the first '
        'Relevant Event happens or commences to happen after the Waiting '
        'Period.',

        'Your legal advisor agrees in writing that your chances of '
        'succeeding in a civil or labour Case, or an application for leave '
        'to appeal, are better than not succeeding.',

        'All the elements of a crime, or all the things the police allege '
        'as the reasons for charging you, happen after the Waiting Period. '
        'Being arrested after the Waiting Period for a criminal offence '
        'alleged to have been committed before the end of the Waiting '
        'Period does <b>not</b> qualify for Cover.',

        'The matter is Reported to Us while your Membership is Paid-Up or '
        'within the Maximum Period to Report After Cancellation shown in '
        'your Schedule of Insurance.',

        'You have paid the First Amount Payable shown in your Schedule of '
        'Insurance. If you use a legal advisor who is not on Our Network, '
        'We will deduct the First Amount Payable from any amount due to '
        'that legal advisor. If you have already paid the legal advisor, '
        'the First Amount Payable will be deducted from any amount due to '
        'you. We must pay that legal advisor in terms of your Legal '
        'Expenses Insurance claim.',

        'The Relevant Event for each Insured Matter is wrongful, unlawful '
        'or is another basis for a valid legal claim by you or against you, '
        'in your personal, private and individual capacity.',

        'If a legal claim by you is based solely on the meaning of a '
        'document, law or regulation (that is, the Relevant Events '
        'themselves are not in dispute), that document, law or regulation '
        'must come into existence after the Waiting Period. This condition '
        'does not apply if there is a legal claim against you.',

        'If the Main Member suffers an Accidental Death, a Legal Expenses '
        'Accidental Death (LEAD) lump sum is payable, subject to the '
        'conditions in Section 4.',
    ]))

    story.append(callout(
        'EXAMPLE:',
        'A finance house obtains a Court order to repossess your car because '
        'you are in arrears with instalments. If you do not dispute the '
        'arrears, the repossession is likely lawful. If so, there is no '
        'basis for a legal defence and the matter is not Covered.'))

    story.append(defn('Accidental Death',
        'means death in the RSA as a result of a sudden, violent and '
        'unforeseeable: road traffic or transport-related accident; an '
        'accident while performing your duties as an employee; an accident '
        'at your Place of Residence or while on holiday or visiting friends; '
        'an accident while shopping or visiting places of entertainment or '
        'other public places for personal and private purposes; assault or '
        'murder; or medical negligence. Death by natural causes and suicide '
        'are not accidental.'))

    story.append(PageBreak())

    # ===========================================================
    # SECTION 4 — Covered Matters and Their Relevant Events
    # ===========================================================
    story.append(section_header(4, 'Covered Matters and Their Relevant Events'))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        'The events shown below in <b>BOLD CAPITAL LETTERS</b> are the '
        'Relevant Events that must happen after the Waiting Period in the '
        'RSA. The list may not be exhaustive, and We may modify or add '
        'further Insured Matters and Relevant Events at Our discretion. If '
        'a matter is not listed below, it is not an Insured Matter and does '
        'not qualify for Cover.',
        BODY))

    story.append(Paragraph(
        'Personal Injury, Property, Consumer and Debt Matters',
        H2))
    story.append(numbered_list([
        'Personal injury, illness or death of another person or that '
        'person\'s pet as a result of <b>AN ACT OR OMISSION</b> by you or '
        'your pet (by "omission" We mean a failure to do something).',

        'Personal injury, illness or death of a Member or his or her pet as '
        'a result of <b>AN ACT OR OMISSION</b> by another person or pet.',

        'Damage to the physical property of another person as a result of '
        '<b>AN ACT OR OMISSION</b> by you or your pet (physical damage '
        'excludes intellectual property such as copyright, patents and '
        'trademarks).',

        'Damage to your physical property as a result of <b>AN ACT OR '
        'OMISSION</b> by another person or their pet (same exclusion as in '
        'item 3).',

        'A refund or other legal remedy for <b>THE PURCHASE</b> by you of '
        'defective consumer goods or services.',

        '<b>BREACH</b> (acting against the terms) of a contract, including '
        'a warranty, for the hire or purchase by you of consumer goods or '
        'other goods and services.',

        '<b>BREACH</b> of a contract regarding the sale or lending of '
        'private property.',

        'A <b>VIOLATION</b> of your rights in terms of the Consumer '
        'Protection Act 68 of 2008 that causes financial damage to you.',

        '<b>OVER-CHARGING</b> by any supplier, being the charging of more '
        'than the agreed fees or rates.',

        '<b>BREACH OF AN AGREEMENT</b> by another party to repay a debt due '
        'to you.',

        'Proceedings to remove an <b>INCORRECTLY TAKEN JUDGEMENT</b> '
        'against you.',
    ]))

    story.append(Paragraph('Home and Accommodation Matters', H2))
    story.append(numbered_list([
        'A <b>BREACH</b> of any contract that is necessary to buy or sell '
        'your Place of Residence (necessary contracts include the offer to '
        'purchase and a mandate to the estate agent and conveyancer. We do '
        'not pay conveyancing fees, transfer duties or contract drafting '
        'costs).',

        '<b>BREACH OF CONTRACT</b> or <b>UNLAWFUL CONDUCT</b> by the lessor '
        '(landlord) in relation to a lease agreement for your Place of '
        'Residence.',

        '<b>AN ACT OR OMISSION</b> by a neighbour or other person that '
        'causes damage to your Place of Residence or household possessions.',

        '<b>THE WRONGFUL ATTACHMENT</b> of your home or household goods by '
        'an officer of court or an asset forfeiture unit of the State.',

        '<b>BREACH OF CONTRACT</b> or <b>FAULTY WORKMANSHIP</b> by a '
        'contractor to build, repair, replace, modify or add something to '
        'your Place of Residence.',

        '<b>AN ACT OR OMISSION</b> by you involving a lease agreement for '
        'your Place of Residence that results in cancellation of the lease, '
        'eviction from your Place of Residence, or a claim for damages '
        'against you.',

        '<b>WRONGFUL FAILURE</b> by the landlord to refund a security '
        'deposit due to you after termination of the lease for your Place '
        'of Residence.',

        '<b>AN ACT OR OMISSION</b> by you or your guests, workers, '
        'contractors and pets at your Place of Residence that causes damage '
        'to a person or a person\'s property, resulting in a claim against '
        'you.',

        '<b>THE FAILURE</b> by the seller of a property, or a third party '
        'living in the property you bought as a Place of Residence, to '
        'vacate the property in terms of the sale agreement.',

        '<b>BREACH OF CONTRACT</b>, <b>NEGLIGENCE</b> or <b>OVER-CHARGING</b> '
        'by a travel or booking agent, a hotel or other vacation or board '
        'and lodging establishment.',

        '<b>NON-COMPLIANCE</b> with the rules by the body corporate or '
        'similar body at your Place of Residence.',
    ], start=12))

    story.append(callout(
        'NOTE:',
        'We will pay for only one eviction matter over a continuous 12-month '
        'period of Paid-Up Membership. We will only pay your legal expenses '
        'for action in the Magistrates Court in respect of an eviction.'))

    story.append(Paragraph('Motor Vehicle Matters', H2))
    story.append(numbered_list([
        'Damage to the motor vehicle, motorcycle ("vehicle") or other '
        'property of another person as a result of <b>AN ACCIDENT OR '
        'COLLISION</b> involving the vehicle driven by you.',

        'Damage to you, your vehicle or property as a result of a private, '
        'public or commercial transport <b>ACCIDENT OR COLLISION</b> caused '
        'by someone else.',

        '<b>BREACH OF CONTRACT</b> by a seller or lender regarding the '
        'terms of a contract to finance a vehicle bought by you.',

        '<b>BREACH OF CONTRACT</b> by a seller regarding the terms of a '
        'contract or warranty for the purchase of a vehicle by you.',

        '<b>WRONGFUL REPOSSESSION</b> of your vehicle under the terms of a '
        'credit agreement with you.',

        '<b>DEFECTIVE WORKMANSHIP</b> to your vehicle by mechanics, panel '
        'beaters and related service providers.',

        '<b>WRONGFUL REJECTION</b> of a vehicle insurance claim by you for '
        'damage to, or destruction of, your vehicle.',

        '<b>BREACH OF CONTRACT</b> by the seller of a vehicle you bought, '
        'regarding transfer of the vehicle and delivery of registration '
        'documents and log books.',

        '<b>THE PURCHASE</b> by you of a vehicle with a latent defect. If '
        'you were not aware of the latent defect when you bought the '
        'vehicle, it is not your discovery of the defect that is the '
        'Relevant Event; it is the date of purchase that is relevant. You '
        'are Covered only if the date of purchase is after the Waiting '
        'Period and while your Membership is Paid-Up.',

        '<b>BREACH OF CONTRACT</b>, <b>NEGLIGENCE</b> or <b>OVER-CHARGING</b> '
        'by a vehicle rental company.',
    ], start=23))

    story.append(Paragraph('Education Matters', H2))
    story.append(numbered_list([
        '<b>AN ACT OR OMISSION</b> by you that results in a disciplinary '
        'proceeding by a school or other institute of education that can '
        'lead to your expulsion or suspension as a scholar or student.',

        '<b>BREACH</b> of a contract with you as a scholar or student, by a '
        'school or an institute of higher education such as a college or '
        'university.',

        '<b>BREACH</b> of a contract with you relating to the lodging of '
        'your child who is attending school or an institute of higher '
        'education.',
    ], start=33))

    story.append(Paragraph('Status, Reputation and Identity Matters', H2))
    story.append(numbered_list([
        'Financial loss or damage to you as the result of <b>A NEGLIGENT '
        'ACT</b> by a bank or other person or body after you have notified '
        'them of your identity theft or credit card fraud.',

        'Financial loss or damage to you due to the negligence of a public '
        'body when they <b>RECORD OR CHANGE</b> your personal details in '
        'public records.',

        'A defamation claim against you based on <b>A COMMUNICATION</b> in '
        'writing or in another form (a defamation claim by you is excluded '
        'under Section 6).',
    ], start=36))

    story.append(Paragraph('Employment Matters', H2))
    story.append(numbered_list([
        'A <b>BREACH</b> of the terms of your contract of employment or an '
        '<b>UNFAIR LABOUR PRACTICE</b> by your employer.',

        'A <b>NOTICE ISSUED</b> by your employer for your retrenchment from '
        'employment.',

        '<b>AN ACT OR OMISSION</b> by you which is used as the basis for '
        'your dismissal, constructive dismissal or suspension from '
        'employment.',

        'Rejection of a claim by you for workmen\'s compensation for '
        '<b>AN INJURY</b> at work.',

        '<b>AN INJURY</b> to you while at work, which may not be covered by '
        'workmen\'s compensation (due to a change in laws or another '
        'reason) and for which your employer wrongfully fails to compensate '
        'you.',

        'A <b>CCMA AWARD</b> in your favour that requires enforcement '
        'through an order of court.',

        'An alleged <b>ACT OR OMISSION</b> by you as employer that gives '
        'rise to a claim against you by your domestic employee or '
        'employees.',
    ], start=39))

    story.append(Paragraph(
        'Banking, Insurance, Pensions, Wills and Investment Matters', H2))
    story.append(numbered_list([
        '<b>WRONGFUL WITHHOLDING</b> or <b>SHORT/LATE PAYMENT</b> of your '
        'pension or retirement benefits.',

        '<b>BREACH OF CONTRACT</b> or <b>UNLAWFUL CONDUCT</b> by a lender '
        'of the terms of a credit or loan agreement with you.',

        '<b>WRONGFUL REJECTION</b> of your claim under an insurance policy. '
        'This includes home and contents insurance, life insurance, funeral '
        'insurance, medical aid or health insurance, hospital plans and '
        'credit life insurance. It excludes any rejection by Us of an '
        'insurance claim by you under this Agreement (see Section 14 for '
        'what you can do if you think We have rejected your insurance claim '
        'without a good reason).',

        'A wrongful or negligent <b>ACT OR OMISSION</b> by a financial '
        'institution managing or holding a financial investment of yours, '
        'which gives rise to financial damages. This Insured Matter is '
        'restricted to investments up to the Maximum Financial Value shown '
        'in your Schedule of Insurance.',

        'The wrongful or negligent <b>DISTRIBUTION</b> of South African '
        'assets to which you are entitled in terms of a will or '
        'testamentary trust or the laws of intestate succession (dying '
        'without a will). This Insured Matter is restricted to assets up '
        'to the Maximum Financial Value shown in your Schedule of '
        'Insurance.',

        'The <b>DEATH</b> of a person who leaves a will or trust made in '
        'South Africa in which you are a beneficiary and which gives rise '
        'to a dispute between you and other heirs about the terms of the '
        'will or trust. This Insured Matter is restricted to trust or '
        'deceased estate assets up to the Maximum Financial Value shown in '
        'your Schedule of Insurance.',

        'The negligent <b>CONDUCT</b> of an insurance broker, claims '
        'assessor or financial advisor.',
    ], start=46))

    story.append(Paragraph('Criminal Matters', H2))
    story.append(numbered_list([
        'Subject to the exclusions in Section 6, a criminal charge against '
        'you based on <b>AN ACT OR OMISSION</b> concerning an Insured '
        'Matter that the prosecuting authority alleges was committed by '
        'you (whether you admit or deny it).',
    ], start=53))
    story.append(callout(
        'PLEASE NOTE:',
        'We do not pay any fines, penalties or bail money in respect of '
        'criminal matters.'))

    story.append(Paragraph(
        'Legal Expenses Accidental Death (LEAD)', H2))
    story.append(numbered_list([
        'Upon the <b>ACCIDENTAL</b> death of the Main Member, a lump sum '
        '(cash) payment will be paid to the beneficiary appointed by the '
        'Main Member.',

        'The cash payment will be made to the nominated beneficiary shown '
        'in your Schedule of Insurance, if that beneficiary is 18 years or '
        'older. If not, or if nobody is nominated, the lump sum will be '
        'paid into the deceased estate.',
    ], start=54))

    story.append(Paragraph('Other Matters', H2))
    story.append(numbered_list([
        '<b>AN ACT</b> by the State to declare you unfit to possess a '
        'firearm and related issues.',
    ], start=56))

    story.append(PageBreak())

    # ===========================================================
    # SECTION 5 — The Agreement, Fairness and Cooling-off Period
    # ===========================================================
    story.append(section_header(5, 'The Agreement, Fairness and Cooling-off Period'))
    story.append(Spacer(1, 6))

    story.append(Paragraph('1. The Agreement', H2))
    story.append(lettered_list([
        'This is a monthly Agreement between the Main Member and Us, for '
        'which a monthly premium is payable.',

        'When you deal with any legal advisor in connection with a claim '
        'under this Agreement, that engagement is an agreement between you '
        'and that legal advisor, to which We are not a party.',

        'You can cancel your Membership at any time without any cancellation '
        'fees or penalties. See Section 13(4)(a).',

        'We can cancel your Membership for the reasons set out in '
        'Section 13(4)(d) and Section 8(5).',

        'Unless specifically modified, this Agreement applies to all '
        'optional product Addendums.',

        'All premiums, maximum limits and the First Amount Payable are '
        'inclusive of all taxes and VAT.',
    ]))

    story.append(Paragraph('2. Fairness', H2))
    story.append(lettered_list([
        'An event which happened before or during the Waiting Period does '
        'not qualify for Insurance Cover. That is the case even if you were '
        'unaware of the event, forgot that it happened, or were aware of '
        'it but did not realise that it could lead to a Case.',

        'Should We decide that your matter does not qualify for Insurance '
        'Cover and you disagree with Our reasons, you may ask for an '
        'independent referee to review Our decision. See Section 14.',
    ]))

    story.append(callout(
        'EXAMPLE:',
        'If your Waiting Period is one month and a Relevant Event occurs on '
        'day 20 of your Membership (during the Waiting Period), the matter '
        'does not qualify for Cover, even if you only become aware of the '
        'event after the Waiting Period has expired.'))

    story.append(Paragraph('3. Cooling-off Period', H2))
    story.append(lettered_list([
        'If you cancel your Membership during the Waiting Period, We will '
        'refund the premiums you have paid only if you have not received '
        'any assistance (including Legal Advisory Services) under this '
        'Membership Agreement.',

        'If you cancel your Membership after the Waiting Period, We will '
        'not refund any premiums you have paid, even if you did not receive '
        'any benefit, whether Insurance or Legal Advisory Services.',

        'If We cancel your Membership during the Waiting Period due to '
        'non-payment of premiums, We do not refund any premiums.',
    ]))

    story.append(callout(
        'NOTE:',
        'Like home insurance, you cannot, for example, claim a refund of '
        'premiums if your home did not burn down while you were insured. '
        'The premium pays for the availability of Cover during the period '
        'of insurance, not for the occurrence of an insured event.'))

    story.append(PageBreak())

    # ===========================================================
    # SECTION 6 — Exclusions
    # ===========================================================
    story.append(section_header(6, 'Exclusions'))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        'In addition to any exclusions set out in Section 4, a matter or '
        'dispute that arises out of, is based on, or relates to any of the '
        'following does not qualify for Insurance Cover under Section 2(2). '
        'We may, however, still provide the Legal Advisory Services '
        'referred to in Section 2(1), unless we have specifically excluded '
        'them as indicated in this Section.',
        BODY))

    story.append(numbered_list([
        'Business activities (including activities relating to a proposed '
        'business) and your acts in any business as a director, public '
        'officer, agent, shareholder, partner, sole proprietor or part '
        'owner. This exclusion also applies to Legal Advisory Services.',

        'Marriage (including customary marriages), divorce, enforcement or '
        'annulment of a divorce order, alimony, maintenance disputes, '
        'maintenance investigations, enquiries or other proceedings related '
        'to custody of children, visitation rights, child support, '
        'guardianship, paternity, engagement or promise to marry, and '
        'living together as husband and wife or as life partners, or out of '
        'an affectionate relationship (an intimate relationship between our '
        'Member and his or her significant other regardless of gender), or '
        'out of a union in terms of the Civil Union Act (including '
        'same-sex marriage).',

        'Any dispute that may arise as a result of living together as '
        'husband and wife or as life partners, or out of an affectionate '
        'relationship, or out of a union in terms of the Civil Union Act '
        '(including same-sex marriage).',

        'A claim by you for defamation, insult, verbal abuse or any other '
        'infringement of your personality, reputation or dignity (a claim '
        'against you is Covered); or a claim by or against you in terms of '
        'the Protection from Harassment Act 17 of 2011 or the Domestic '
        'Violence Act 116 of 1998.',

        'Where your chances of succeeding in a civil or labour Case, or an '
        'application for leave to appeal, are not better than not '
        'succeeding.',

        'A claim by you that is of an emotional nature and does not affect '
        'your corporeal interests. "Corporeal" means money or physical '
        'property.',

        'The following exclusion also applies to Legal Advisory Services: '
        'matters involving you as a member, public officer, trustee, '
        'executor, curator, agent or spokesperson of a non-profit company, '
        'institution or association; a political party or similar movement; '
        'a trust, deceased estate or similar entity; a trade or similar '
        'union; or any other union or group of persons with a common cause '
        'or purpose.',

        'A claim by you based on a surety, cession, assignment, novation, '
        'delegation or other derived right of recourse.',

        'The drafting of any document. This exclusion also applies to '
        'Legal Advisory Services.',

        'A matter related to mineral rights. This exclusion also applies '
        'to Legal Advisory Services.',

        'Gambling, lottery and any awards in any form of competition.',

        'A collective or class action.',

        'An application to change your personal status, or the status, '
        'zoning or right of use of your permanent residence. This '
        'exclusion also applies to Legal Advisory Services.',

        'A rejection by Us of a claim by you for Cover under this '
        'Agreement.',

        'Insolvency (bankruptcy). This exclusion also applies to Legal '
        'Advisory Services.',

        'A dispute with a claim value less than the Threshold Value shown '
        'in your Schedule of Insurance (which can be settled by the Small '
        'Claims Court), or a dispute for which an official dispute '
        'resolution service exists.',

        'Debt counselling proceedings and related applications in terms of '
        'the National Credit Act 34 of 2005.',

        'Any Case or matter directly caused by pandemics and any other '
        'natural or environmental disasters such as flooding and climate '
        'change. This exclusion also applies to Legal Advisory Services.',

        'Lawful blacklisting and garnishee orders, and placing your '
        'financial affairs under the control of an administrator.',

        'An application to a public service body or other person or '
        'institution to grant any licence, permission or approval.',

        'Foreigners\' residency, work permit, visa, refugee, asylum and '
        'citizenship matters.',

        'Disciplinary enquiries at work where no legal representation is '
        'allowed.',

        'If the interpretation of any law, regulation or document is the '
        'only issue in dispute in a civil claim by you, it is not Covered. '
        'This exclusion also applies to Legal Advisory Services.',

        'A cause of action which is vexatious or malicious, or a matter '
        'that is tainted with illegality.',

        'Rates and taxes. This exclusion also applies to Legal Advisory '
        'Services.',

        'Contempt of court, civil disobedience, public disorder, '
        'unprotected strikes, lock-out, labour disturbance and similar '
        'labour actions.',

        'War, martial law, mutiny, military coup or usurped power, '
        'rebellion or revolution.',

        'Any activity or attempt to perform or bring about nuclear weapons '
        'or material, ionising radiation, or contamination from any nuclear '
        'waste or from the combustion of nuclear fuel. This exclusion also '
        'applies to Legal Advisory Services.',

        'An unlawful protest, intimidation or threat of violence or force '
        'against any public body.',

        'Any occurrence for which a fund has been established in terms of '
        'the War Damage Insurance and Compensation Act, 1976.',

        'An act aimed at promoting or frustrating economic, political, '
        'social or environmental change.',

        'A criminal charge against you. Cover for criminal matters differs '
        'for serious and non-serious offences and is subject to the '
        'special conditions in Section 32 below.',

        'Income tax matters listed in Section 33 below.',

        'Load-shedding and water-shedding, or any other act or omission by '
        'the Government, or any of its constituent parts, amounting to '
        'negligence or non-performance of its public obligations.',
    ]))

    story.append(Paragraph('32. Special conditions for criminal charges', H3))
    story.append(Paragraph(
        'Cover for criminal matters differs for serious and non-serious '
        'offences and is subject to the following special conditions and '
        'exclusions:', BODY))
    story.append(lettered_list([
        '<b>Serious offences</b> (Schedule 5 and/or 6 offences). You are '
        'not Covered for legal expenses for serious offences if you have '
        'been convicted of a serious offence in the previous six years.',

        '<b>Non-serious offences</b> (non-Schedule 5 and/or 6 offences). '
        'You are not Covered for legal expenses for non-serious offences '
        'if you have been convicted of a non-serious offence in the '
        'previous three years.',

        '<b>Combined serious and non-serious offences.</b> If in the six '
        'years before the current charge, you have three or more previous '
        'convictions (serious and/or non-serious) against you for any '
        'offence, you are not Covered.',

        'A criminal charge based on fraud in connection with this '
        'Agreement. This exclusion also applies to Legal Advisory Services.',

        'Where there is an option to pay a fine without a conviction being '
        'recorded against your name.',

        'If We have already confirmed Cover for your legal expenses for '
        'the maximum number of offences shown in your Schedule of '
        'Insurance (see Section 10).',

        'A criminal charge involving a matter listed in exclusions 25 to '
        '31 above.',
    ]))

    story.append(Paragraph('33. Income tax matters', H3))
    story.append(Paragraph(
        'The following income tax matters are excluded from Cover under '
        'this Agreement:', BODY))
    story.append(lettered_list([
        'Juristic persons or entities, including but not limited to sole '
        'proprietors.',

        'A matter in your capacity as a director of a company, member of '
        'a close corporation, partner in a partnership, or any participant '
        'or business partner involved in a relationship considered to be a '
        'business that conducts a trade or business or any business '
        'combination.',

        'Taxation of trusts, estates and body corporates.',

        'Taxation of persons acting in any representative capacity, for '
        'example trustees, executors, curators and so on.',

        'Taxation of beneficiaries of trusts and estates.',

        'Residents or non-residents of South Africa who have earned more '
        'than 50% of their income outside the borders of South Africa.',

        'Income earned in a currency other than the South African Rand.',

        'Income earned from a company or juristic entity not registered '
        'within South Africa.',

        'Any other form of taxation including, but not limited to, customs '
        'and excise queries, VAT and so on.',

        'Making payment arrangements on your behalf for any outstanding '
        'amounts owing to SARS.',

        'Applications for tax directives and tax clearance certificates '
        'on your behalf or on behalf of juristic persons.',

        'Any tax matter incurring insurance benefits by or against SARS.',

        'Any matter where you are not resident within the borders of '
        'South Africa.',
    ]))

    story.append(PageBreak())

    # ===========================================================
    # SECTION 7 — Legal Expenses We Pay
    # ===========================================================
    story.append(section_header(7, 'Legal Expenses We Pay'))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        'Subject to the limits in Section 10, and provided you remain a '
        'Paid-Up Member, We will pay the following legal expenses in '
        'respect of a Covered Case:', BODY))
    story.append(numbered_list([
        'The fees and expenses of your legal advisor for a Case, at Our '
        'Tariffs in force from time to time. The Tariffs form part of this '
        'Agreement and are available on request.',

        'Only if We agree in writing, the fees of a legal advisor for a '
        'second opinion about your chances of success. We will generally '
        'consider this only if new facts or circumstances are presented.',

        'The cost of expert evidence and the arbitrator\'s fees that We '
        'agree to in writing.',

        'Court fees or charges.',

        'The legal expenses that the court orders you to pay to the other '
        'party (your opponent) if you lose a Case.',

        'The legal expenses of further action to force an unwilling or '
        'unable "loser" to obey a court order when you win a Case.',

        'The legal expenses of an appeal or review if you lose a Case, but '
        'only if your legal advisor agrees that your chances of succeeding '
        'in the appeal or review are better than not succeeding.',

        'If We have agreed to it, the costs of your opponent in order to '
        'settle a Case.',

        'The Legal Expenses Accidental Death cash payment is for the '
        'reporting and winding up of the deceased estate, dealing with '
        'debtors (including Workmen\'s Compensation and the Road Accident '
        'Fund if applicable) and creditors (including estate duty), and '
        'obtaining expert financial, legal and tax advice. The amount is '
        'shown in your Schedule of Insurance.',

        'We only pay legal expenses for a Case conducted and concluded in '
        'a court or tribunal in the RSA in respect of Relevant Events that '
        'happened in the RSA. "Conducted and concluded" means that the '
        'Case is initiated and finalised in a court in the RSA, which '
        'includes execution steps and any recovery associated with a Case.',
    ]))
    story.append(defn('Case',
        'means all Court, Tribunal or Arbitration proceedings based on the '
        'same Relevant Events.'))
    story.append(defn('Arbitration Proceedings',
        'mean arbitration proceedings in terms of the Arbitration Act 42 '
        'of 1965.'))

    story.append(PageBreak())

    # ===========================================================
    # SECTION 8 — Legal Expenses We Do Not Pay
    # ===========================================================
    story.append(section_header(8, 'Legal Expenses We Do Not Pay'))
    story.append(Spacer(1, 6))
    story.append(numbered_list([
        'That are above the limits set out in Section 10.',

        'That are higher than Our Tariffs.',

        'For work done by your legal advisor before We have issued a '
        'written Confirmation of Cover (unless We agree otherwise in '
        'writing).',

        'That are duplicated because you changed legal advisors without '
        'Our written agreement.',

        'After the following actions or inactions by you which entitle Us '
        'to cancel your Membership, We will have no obligation to pay '
        'legal expenses not already incurred in a Case: '
        '(a) without a reasonable explanation, you fail to respond to Our '
        'request or your legal advisor\'s request for relevant information '
        'or instructions regarding a Case; (b) you withhold or give false '
        'or misleading information in relation to your Insurance claim or '
        'a Case; (c) without a reasonable explanation, you fail to '
        'co-operate or turn up for consultations or court appearances.',

        'For any new matters that you report to Us after the Maximum '
        'Period to Report a Claim shown in your Schedule of Insurance, '
        'after cancellation of your Membership for any reason. The legal '
        'expenses of an appeal or review arising from a Covered matter '
        'received outside of the Maximum Period to Report a Claim are '
        'excluded from Cover.',

        'If you are joined with other persons in a Case (a joint or class '
        'action), We will pay only a portion of the legal expenses for '
        'which you are jointly liable. That portion is the same as the '
        'proportion that you are of the total number of persons, but only '
        'up to the Maximum Limit.',

        'If you offer to pay the legal expenses of your opponent to settle '
        'a Case, you are personally responsible for payment. We do not '
        'pay those legal expenses unless We agree in writing.',

        'We do not pay legal expenses for negotiation, mediation or '
        'Alternative Dispute Resolution efforts or proceedings unless We '
        'agree otherwise in writing.',

        'We do not pay legal costs that are punitive costs awards (for '
        'example, costs awards against you by the court that serve as a '
        'punishment).',

        'We do not pay the cost of expert evidence, expert opinions, '
        'medical reports, and mediator or arbitrator fees that We have '
        'not agreed to in writing beforehand.',

        'We do not pay your cost and/or your opponent\'s cost: '
        '(a) when you abandon a court case; (b) if the court finds that '
        'a legal action by you is vexatious or malicious; or (c) arising '
        'from a Contempt of Court case against you.',
    ]))

    story.append(PageBreak())

    # ===========================================================
    # SECTION 9 — Recovery and Restriction of Expenses
    # ===========================================================
    story.append(section_header(9, 'Recovery and Restriction of Expenses'))
    story.append(Spacer(1, 6))
    story.append(numbered_list([
        'If a court orders your opponent who loses a Case to pay all or '
        'some of your legal expenses, then, if the amount that your '
        'opponent must pay: (a) is less than the legal expenses We paid, '
        'the total amount paid by your opponent must be refunded to Us; '
        '(b) is more than the legal expenses We paid, the total legal '
        'expenses We paid must be refunded to Us.',

        'You agree that your legal advisor can refund Us when the money is '
        'received from your opponent in terms of the Court Order.',

        'If your opponent does not pay for any reason, you give Us the '
        'right to claim it directly from that opponent in your name.',

        'We may, at Our discretion, require you at any time before or '
        'after payment of a claim to cede to Us any contingent, future or '
        'actual right to claim any costs in respect of any proceedings '
        'Covered by this Agreement.',

        'We must be advised immediately if you receive a settlement offer. '
        'You may not accept or reject a settlement offer without Our '
        'written consent. (a) If you request Our consent to accept an '
        'offer, We may agree on condition that all or some of the legal '
        'expenses We paid must be recovered from your opponent. (b) If you '
        'request Our consent to reject an offer, We will set a limit on '
        'the legal expenses We will pay to carry on. Because the dispute '
        'is now only about how much more you claim, We determine how much '
        'more We will pay to carry on by multiplying the amount or value '
        'of how much more you claim by the Claim Value Multiplier shown in '
        'your Schedule of Insurance. We will pay up to that amount, '
        'provided the Maximum Limit in terms of Section 10 is not '
        'exceeded.',

        'If you are Covered against payment of legal fees under any other '
        'insurance policy, Our liability shall be limited to the prorated '
        '(rateable) portion of the total legal expenses incurred.',
    ]))

    story.append(PageBreak())

    # ===========================================================
    # SECTION 10 — Maximum Limits We Pay
    # ===========================================================
    story.append(section_header(10, 'Maximum Limits We Pay'))
    story.append(Spacer(1, 6))
    story.append(numbered_list([
        'All limits are limits per Agreement, irrespective of how many '
        'Members are entitled to Insurance Cover under this Agreement.',

        'The maximum that We will pay over any period of time as a Member '
        'is the "Life Time Limit" shown in your Schedule of Insurance.',

        'The maximum that We will pay for a civil or labour Case is the '
        'lowest of: (a) the Maximum Limit shown in your Schedule of '
        'Insurance; or (b) the amount or value of your claim multiplied '
        'by the Claim Value Multiplier (CVM) shown in your Schedule of '
        'Insurance.',

        'The maximum that We will pay for Covered criminal cases: (a) for '
        'a single criminal Case, We will pay up to the Maximum Limit; '
        '(b) for different criminal cases over any period of time as a '
        'Member, We will only pay for the Maximum Number of Offences shown '
        'in your Schedule of Insurance.',

        'The Maximum Limit for the Legal Expenses Accidental Death benefit '
        'is as shown in your Schedule of Insurance.',

        'The Maximum Limit per Case is for the combined total of all '
        'expense items under Section 7.',
    ]))
    story.append(callout(
        'NOTE:',
        'The Claim Value "rule" is to encourage acceptance of reasonable '
        'offers to settle. It avoids disproportionate legal expenses when '
        'there is a risk of either a very small or no extra reward.'))

    # Maximum limits reference table
    story.append(Spacer(1, 12))
    story.append(Paragraph('Reference: Key Limits and Values', H3))
    limits_data = [
        [Paragraph('<b>Parameter</b>', TABLE_HEADER),
         Paragraph('<b>Where Shown</b>', TABLE_HEADER)],
        [Paragraph('Monthly Premium', TABLE_CELL),
         Paragraph('Schedule of Insurance', TABLE_CELL)],
        [Paragraph('Waiting Period', TABLE_CELL),
         Paragraph('Schedule of Insurance', TABLE_CELL)],
        [Paragraph('First Amount Payable', TABLE_CELL),
         Paragraph('Schedule of Insurance', TABLE_CELL)],
        [Paragraph('Maximum Limit per Case', TABLE_CELL),
         Paragraph('Schedule of Insurance', TABLE_CELL)],
        [Paragraph('Life Time Limit', TABLE_CELL),
         Paragraph('Schedule of Insurance', TABLE_CELL)],
        [Paragraph('Claim Value Multiplier (CVM)', TABLE_CELL),
         Paragraph('Schedule of Insurance', TABLE_CELL)],
        [Paragraph('Maximum Number of Offences', TABLE_CELL),
         Paragraph('Schedule of Insurance', TABLE_CELL)],
        [Paragraph('Maximum Financial Value (investments / estates)',
                   TABLE_CELL),
         Paragraph('Schedule of Insurance', TABLE_CELL)],
        [Paragraph('Maximum Period to Report After Cancellation',
                   TABLE_CELL),
         Paragraph('Schedule of Insurance', TABLE_CELL)],
        [Paragraph('Maximum TTD Number of Months', TABLE_CELL),
         Paragraph('Schedule of Insurance', TABLE_CELL)],
        [Paragraph('Threshold Value (Small Claims Court)', TABLE_CELL),
         Paragraph('Schedule of Insurance', TABLE_CELL)],
    ]
    col_widths = [CONTENT_W * 0.55, CONTENT_W * 0.45]
    limits_table = Table(limits_data, colWidths=col_widths, hAlign='CENTER',
                         repeatRows=1)
    limits_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_BG),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1),
         [TABLE_ROW_EVEN, TABLE_ROW_ODD]),
        ('GRID', (0, 0), (-1, -1), 0.4, BORDER),
        ('LINEBELOW', (0, 0), (-1, 0), 1.2, GOLD),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(limits_table)

    story.append(PageBreak())

    # ===========================================================
    # SECTION 11 — How to Claim
    # ===========================================================
    story.append(section_header(11, 'How to Claim'))
    story.append(Spacer(1, 6))
    story.append(Paragraph('Legal Expenses Accidental Death (LEAD)', H2))
    story.append(Paragraph(
        'The death must be Reported to Us by submitting the LEAD Claim '
        'Form, which forms part of this Agreement, within the period after '
        'death shown in your Schedule of Insurance. Additional conditions '
        'may apply to this benefit; if so, they are shown in your Schedule '
        'of Insurance and/or the LEAD Claim Form.',
        BODY))

    story.append(Paragraph('Legal Matters — Three-Step Process', H2))
    story.append(Paragraph(
        'In legal matters, some laws have time limits to start or defend a '
        'Case. If you miss a deadline, you may lose your right to sue or '
        'defend. You must report a matter to Us as soon as possible. We '
        'are not responsible if you lose your rights because you did not '
        'report a matter in time. You can report a matter on the 24-hour '
        'Infinity LegalLine on <b>0861 4 LEGAL</b>, at any Branch, or by '
        'email to <b>legal@infinitylegal.co.za</b>.',
        BODY))

    story.append(Paragraph('Step 1 — Report the Matter', H3))
    story.append(Paragraph(
        'If your issue is a labour or civil matter (not criminal), Our '
        'legal counsellors will try to resolve it on a reasonable basis. '
        'If it is Covered and We decide that We cannot resolve it, or '
        'that it is complicated or requires immediate action, or it is a '
        'criminal matter, We will refer you to a Network legal advisor, '
        'or you may consult your own legal advisor.',
        BODY))

    story.append(Paragraph('Step 2 — Submit the Official Claim Form', H3))
    story.append(Paragraph(
        'If you have chosen a Network legal advisor, he or she will submit '
        'Our Official Claim Form (OCF) to Us on your behalf. If you choose '
        'another legal advisor, you or your legal advisor must submit the '
        'OCF to Us within 7 days of consulting with that legal advisor. We '
        'cannot process your claim for Insurance Cover unless We have '
        'received the OCF. The OCF is available at any Branch, on the '
        'Member Portal at <b>portal.infinitylegal.co.za</b>, or on '
        'request.',
        BODY))
    story.append(callout(
        'PLEASE NOTE:',
        'Once We have received the OCF, and before We can decide whether '
        'your matter qualifies for Insurance Cover, We may request more '
        'information from you or your legal advisor. If it qualifies, We '
        'will issue a written Confirmation of Cover to your legal advisor. '
        'We will not pay legal expenses incurred before We have issued a '
        'written Confirmation of Cover, nor while you are not a Paid-Up '
        'Member.'))

    story.append(Paragraph('Step 3 — First Option: Network Legal Advisor',
                           H3))
    story.append(Paragraph(
        'If you elect to choose a Network legal advisor, We have '
        'information about who specialises in particular types of cases. '
        'You can request that information from Us. Network legal advisors '
        'have agreed to charge according to Our Tariffs and to assist you '
        'to comply with your obligations under this Agreement. Your '
        'Network legal advisor will deal directly with Us in connection '
        'with your Insurance claim, and there is no risk of being charged '
        'above the Tariffs (which may happen under the Second Option).',
        BODY))

    story.append(Paragraph(
        'Step 3 — Second Option: Non-Network Legal Advisor', H3))
    story.append(Paragraph(
        'If you have chosen a legal advisor who is not a Network legal '
        'advisor, you must provide Us with an Official Claim Form (if We '
        'have not received it yet) within 7 days of consulting with that '
        'legal advisor. Please be aware that the legal advisor: may not '
        'be prepared to charge at Our Tariffs; or may not agree to assist '
        'you to comply with Our reasonable requests for relevant '
        'information. It is in your own interests to clarify these two '
        'points with your legal advisor.',
        BODY))
    story.append(Paragraph(
        'If you or your legal advisor do not provide Us with information '
        'We reasonably need to process your Insurance claim, We will not '
        'pay any of your legal expenses. If your legal advisor agrees to '
        'co-operate but does not agree to charge at Our Tariffs, We will '
        'adjust the legal advisor\'s total charges to Our Tariffs and pay '
        'that amount. You will then be personally responsible to pay the '
        'shortfall to your legal advisor out of your own pocket.',
        BODY))

    story.append(PageBreak())

    # ===========================================================
    # SECTION 12 — Premiums, Information Exchange, Communication, Leniency
    # ===========================================================
    story.append(section_header(12,
        'Premiums, Information Exchange, Communication and Leniency'))
    story.append(Spacer(1, 6))

    story.append(Paragraph('1. Payment of Premiums', H2))
    story.append(lettered_list([
        'The monthly premium is due on the 1st day of every month, even '
        'though We may collect it at any time up to the end of a month.',

        'You must make sure that premiums are paid, even if someone else '
        'pays them on your behalf.',

        'If a debit order deduction is not successful for whatever reason '
        'on the premium due date, resulting in your Membership going into '
        'arrears, We may do a double premium deduction from your nominated '
        'bank account on the next premium due date.',

        'If you pay by debit or stop order: (i) We do not pay the '
        'collection costs and any unusual additional fees or charges by '
        'your bank; (ii) if you want Us to change or cancel your debit or '
        'stop order arrangement, you must contact Us at least 30 days '
        'before the existing collection date.',
    ]))

    story.append(Paragraph(
        '2. Information Exchange, Confidentiality and POPIA', H2))
    story.append(Paragraph(
        'The protection of your personal information is fundamental to '
        'Infinity Legal SA. We process all personal information in '
        'accordance with the <b>Protection of Personal Information Act 4 '
        'of 2013 (POPIA)</b>, the General Data Protection Regulation '
        'principles where applicable, and all other applicable South '
        'African privacy and data protection legislation. We have '
        'appointed an Information Officer and have implemented appropriate '
        'technical and organisational measures to keep your information '
        'complete, secure and accurate.',
        BODY))
    story.append(lettered_list([
        'You agree to provide your personal information to gain access to '
        'Our products and services and to allow Us to administer your '
        'Insurance product and/or to advance your Case.',

        'You agree that We can provide any information (including personal '
        'information) to your legal advisor or applicable third party if '
        'it is needed to handle your Case, or if a law or Court requires '
        'Us to do so.',

        'You agree that your legal advisor or any other person who has '
        'your information can provide Us with any information (including '
        'personal information) which relates to your Insurance product or '
        'Case if it is needed.',

        'In accordance with POPIA, you are entitled to: (i) request the '
        'details of your personal information that We hold in Our records; '
        '(ii) request the details about the recipients of your personal '
        'information; and (iii) request the amendment or deletion of your '
        'personal information, subject to the record-keeping requirements '
        'of the Short-Term Insurance Act and other applicable legislation.',
    ]))

    story.append(Paragraph('3. Communicating With You', H2))
    story.append(lettered_list([
        'We will send all general communications to the Main Member\'s '
        'contact details on record.',

        'We may send any document or communication that is part of, or '
        'that We issue in terms of, the Agreement by mail, email, SMS, '
        'website, post, WhatsApp or fax.',

        'If you change your contact details, you must please let Us know. '
        'We will send you an acknowledgement within 10 business days. '
        'Please let Us know if you do not receive it.',

        'If any Member communicates with Us about his or her Insurance '
        'claim, We will respond to that Member.',
    ]))

    story.append(Paragraph('4. Leniency', H2))
    story.append(lettered_list([
        'If you do not comply with a term of this Agreement, We may '
        'overlook it. If We do, even if it is over a long period of time, '
        'it does not mean that We have to continue to be lenient.',

        'We retain Our rights to enforce any term of the Agreement at any '
        'time.',
    ]))

    story.append(PageBreak())

    # ===========================================================
    # SECTION 13 — Premium Changes, Change of Terms, Cancellation
    # ===========================================================
    story.append(section_header(13,
        'Premium Changes, Change of Terms and Cancellation'))
    story.append(Spacer(1, 6))

    story.append(Paragraph('1. Premium Increase', H2))
    story.append(Paragraph(
        'The monthly premium will increase every year on the anniversary '
        'date of when you first joined Infinity Legal SA.', BODY))

    story.append(Paragraph('2. Changing the Terms or Increasing the Premium',
                           H2))
    story.append(lettered_list([
        'We may change any term of the Agreement on 31 days\' written '
        'notice to you. If We do, it will apply only to Relevant Events '
        'that arise after the change. It will not affect Our existing '
        'obligations to you under the previous terms for Relevant Events '
        'that arose before the change.',

        'When We change a term or increase the premium, you accept that '
        'We can notify you in any reasonable manner at Our discretion.',

        'An increase or change of term will be deemed effective from the '
        'date mentioned in the notice.',

        'If you do not accept the increase or the change of term, and you '
        'cancel your Membership within 31 days of the increase or change '
        'of term, We will refund premiums received after the increase or '
        'change.',
    ]))

    story.append(Paragraph('3. Unauthorised Changes', H2))
    story.append(Paragraph(
        'None of Our employees may give any undertaking that deviates '
        'from the terms of the Agreement, except for a duly authorised '
        'ex-gratia payment.', BODY))

    story.append(Paragraph('4. How Your Membership Can Be Cancelled', H2))
    story.append(lettered_list([
        'If you pay by cash, you can simply stop paying the premium. '
        'Otherwise, you can ask your bank or employer to cancel your '
        'direct debit or stop order deduction, or you can request Us to '
        'instruct your bank or employer to cancel it.',

        'We can cancel your Membership without notice to you, if We do '
        'not receive a premium by 24h00 on the last day of the month in '
        'which it is due (a 31-day grace period).',

        'If We don\'t cancel, you agree that We may collect the number of '
        'unpaid premiums shown in your Schedule of Insurance. (i) If We '
        'collect unpaid premiums, you will be treated as if you paid all '
        'premiums on due date. (ii) If We fail to collect unpaid premiums, '
        'your Membership will be cancelled with effect from the 1st of '
        'the 1st month that the premium was not collected. (iii) If We '
        'have cancelled as above, and collect or receive a premium at '
        'any time after that, it amounts to entering into a new Agreement.',

        'We can cancel your Membership on 31 days\' notice to you, for '
        'any other reason at Our discretion. If We inadvertently collect '
        'or receive a premium after such a cancellation, it does not '
        'amount to entering into a new Agreement and We will refund that '
        'premium.',

        'If your Membership is cancelled for any reason, except if it is '
        'in terms of Section 8(5), it will not affect Our obligations to '
        'pay your legal expenses up to the finalisation of a Case in '
        'respect of matters that qualify and that you Reported to Us '
        'before "The Maximum Period after Cancellation to Report a Claim" '
        'referred to in your Schedule of Insurance.',

        'We have no obligation to accept you as a Member again at any '
        'time after your Membership has been cancelled for any reason.',
    ]))

    story.append(PageBreak())

    # ===========================================================
    # SECTION 14 — Disputes and Complaints
    # ===========================================================
    story.append(section_header(14, 'Disputes and Complaints'))
    story.append(Spacer(1, 6))
    story.append(numbered_list([
        'If We decide that a claim by you does not qualify for any '
        'payment, or only qualifies for payment of a portion of your '
        'legal expenses, We will inform you, together with Our reasons, '
        'within 10 days after being placed in possession of all the '
        'information We have reasonably requested. You then have 90 days '
        'from the date We inform you to let Us know in writing if you '
        'object and do not agree with it.',

        'We will reconsider the matter and let you know Our decision '
        'within 10 days of receiving your written objection. If We still '
        'decide not to pay what you claim and Our decision: (a) is based '
        'on the fact that you did not pay a Premium due, or on the fact '
        'that the Relevant Event occurred before the end of the Waiting '
        'Period, Our decision is final; (b) is based on the fact that the '
        'Maximum Limit of indemnity was paid, Our decision is final; '
        '(c) is based on any other reason or fact relating to the matter '
        'under consideration, and you request it in writing, We will pay '
        'an Independent Referee nominated by Us to review it. He or she '
        'will review Our decision and give Us a recommendation.',

        'We do not have to follow the recommendation of the External '
        'Referee, but it will be carefully considered. We will inform you '
        'of the Referee\'s recommendation and of Our final decision '
        'within 15 days after We receive the recommendation.',

        'Nothing in this Agreement prevents you from starting a Case '
        'against Us at your own cost. However, you must do so within 365 '
        'days of the date on which We first informed you of any decision '
        'concerning this Agreement that you do not agree with. You lose '
        'your rights to take action against Us after the 365-day period.',
    ]))

    story.append(defn('Independent External Referee',
        'means a legal advisor who is not on Our Network and who has a '
        'minimum of seven years\' post-qualification legal experience.'))

    story.append(callout(
        'NOTE:',
        'Should you wish to lodge a complaint about Our services, you may '
        'do so in writing to the Infinity Legal SA Compliance Officer at '
        'complaints@infinitylegal.co.za. If your complaint is not resolved '
        'to your satisfaction, you may approach the Financial Sector '
        'Conduct Authority (FSCA) or the Ombud for Financial Services '
        'Providers (FAIS Ombud) in accordance with the Financial Advisory '
        'and Intermediary Services Act 37 of 2002.'))

    story.append(PageBreak())

    # ===========================================================
    # SECTION 15 — Total and Temporary Disablement and Retrenchment
    # ===========================================================
    story.append(section_header(15,
        'Total and Temporary Disablement and Retrenchment'))
    story.append(Spacer(1, 6))
    story.append(numbered_list([
        'This benefit is an integral part of the Agreement. It cannot be '
        'bought as a stand-alone policy.',

        'If the Main Member is retrenched or becomes totally and '
        'temporarily disabled to work (TTD) after a period of continuous '
        'Paid-Up Membership shown in your Schedule of Insurance: '
        '(a) your Membership will be treated as Paid-Up for the Maximum '
        'TTD Number of Months shown in your Schedule of Insurance; '
        '(b) during this period, while out of work, you do not have to '
        'pay the premiums.',
    ]))

    story.append(Paragraph('Conditions', H3))
    story.append(lettered_list([
        'You must provide Us with proof of the retrenchment or '
        'disablement.',

        'The disablement must be due to an Accident as defined in this '
        'Agreement.',

        'The maximum period within which you must report the retrenchment '
        'or disablement is shown in your Schedule of Insurance.',
    ]))

    story.append(PageBreak())

    # ===========================================================
    # SECTION 16 — Personal Income Tax Support
    # ===========================================================
    story.append(section_header(16, 'Personal Income Tax Support'))
    story.append(Spacer(1, 6))
    story.append(numbered_list([
        'This benefit is an integral part of the Agreement. It cannot be '
        'bought as a stand-alone policy and is only applicable to a '
        'Paid-Up Membership.',

        'Main Members and Spouses on Policy A and Platinum A, who are in '
        'possession of a green bar-coded identity document or the new '
        'identity card, qualify for tax advice and assistance from Our '
        'in-house tax practitioners for the following South African '
        'Revenue Service (SARS) personal income tax matters:',
    ]))
    story.append(bullet_list([
        'Understanding your SARS notice of assessment (ITA34)',
        'Understanding tax calculations',
        'Checking the status of tax accounts with SARS',
        'Helping to interpret the Income Tax Act and the Tax '
        'Administration Act, and the SARS tax self-help guides',
        'Tax registration advice if you are an individual personal income '
        'tax payer',
        'Querying outstanding personal income tax returns',
        'SARS audits',
        'Lodging SARS objections',
        'Penalties and interest raised by SARS',
        'Identity theft',
        'SARS garnishees (IT88)',
        'Tax implications on pension and provident fund pay-outs',
        'Liaising with employers regarding the cancellation of duplicate '
        'IRP5 certificates or correcting mistakes on issued IT3 or IRP5 '
        'certificates',
        'Liaising with employers on queries regarding incorrect PAYE '
        'deductions and obtaining IRP5 or IT3 certificates',
        'General tax queries',
    ]))
    story.append(Paragraph(
        '3. Policy B and C, and Platinum B and C, Members and Spouses '
        'qualify for tax advice only (no assistance with SARS proceedings).',
        BODY))

    story.append(PageBreak())

    # ===========================================================
    # ADDENDUM 1 — Platinum Membership
    # ===========================================================
    story.append(addendum_header('Platinum Membership Addendum'))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        'Applicable to Platinum (previously called Platinum A). Not '
        'applicable to Platinum B and C.', KICKER))
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        'This Addendum is subject to the terms of the Membership '
        'Agreement, except as modified in your Schedule of Insurance and '
        'as set out below, and applies while your Membership is Paid-Up.',
        BODY))
    story.append(lettered_list([
        'The Waiting Periods that apply to each benefit listed below, and '
        'the increased Maximum Limit per Case, Life Time Limit and Claim '
        'Value Multiplier, are shown in your Schedule of Insurance.',

        'The increased Maximum Limit per Case applies only to Relevant '
        'Events that all happen after the Platinum Waiting Period shown '
        'in your Schedule of Insurance and while your Membership is '
        'Paid-Up.',

        'The Life Time Limit is calculated on the premium in force when '
        'We do the calculation.',

        'We will pay the fees and expenses of your legal advisor for a '
        'Case at the Platinum Tariffs in force from time to time. The '
        'Platinum Tariffs form part of this Addendum and are available on '
        'request.',
    ]))
    story.append(Paragraph(
        'In consideration of the Platinum premium in force from time to '
        'time, the following services (additional to the services under '
        'the Main Membership Agreement) will be provided to you, on '
        'condition that they are rendered by legal advisors appointed and '
        'paid by Us, as per the Platinum Tariffs.',
        BODY))

    # A) Uncontested Divorce
    story.append(Paragraph('A. Uncontested Divorce', H2))
    story.append(lettered_list([
        'This benefit is only available to the Main Member.',

        'This benefit covers uncontested divorces where the parties reach '
        'consensus on all issues, eliminating the need for Court '
        'intervention. For example, agreement on asset division, '
        'children\'s rights, custody and other terms are achieved '
        'amicably.',

        'This benefit applies exclusively to uncontested divorce matters, '
        'including settlement agreements. Please refer to Section 1(i) of '
        'Our Membership Agreement for the definition of "Spouse".',

        'We will pay the appointed legal advisor\'s fees for obtaining a '
        'final divorce order.',

        'There is a continuous 18-month waiting period of Paid-Up '
        'Platinum Membership.',

        'We will pay for only one uncontested divorce over a continuous '
        '36-month period of Paid-Up Platinum Membership.',

        'If an initially uncontested divorce becomes opposed, Cover '
        'continues as per Our Platinum Schedule of Tariffs until the '
        'matter becomes opposed.',

        'Terminating the mandate during an uncontested divorce ceases Our '
        'responsibilities and Cover from the date of termination. We will '
        'pay as per the Platinum Schedule of Tariffs up to the point of '
        'termination of the mandate.',
    ]))
    story.append(Paragraph('Exclusions:', H3))
    story.append(bullet_list([
        'Fees and disbursements for ancillary applications (such as '
        'maintenance). You are personally responsible for paying these to '
        'the appointed legal advisor.',

        'If you enjoyed concurrent Cover for the same set of '
        'circumstances under the Child Maintenance Benefit, and vice '
        'versa.',
    ]))

    # B) Child Maintenance
    story.append(Paragraph('B. Child Maintenance', H2))
    story.append(lettered_list([
        'This benefit is only available to the Main Member.',

        'The benefit covers the various proceedings regarding the '
        'application or opposition of child maintenance matters such as '
        'application, opposition, rescission and variations of Court '
        'orders.',

        'We will pay the appointed legal advisor\'s fees: for '
        'consultations; to draft the relevant Court documents; and for '
        'appearances at the Maintenance Officer and appearances in the '
        'Maintenance Court as per Our Platinum Schedule of Tariffs.',

        'There is a continuous 12-month waiting period of Paid-Up '
        'Platinum Membership.',

        'We will pay for only one maintenance matter over a continuous '
        '24-month period of Paid-Up Platinum Membership.',

        'If you enjoyed Cover under the Uncontested Divorce Benefit, you '
        'are Covered for only one maintenance matter over a continuous '
        '24-month period of Paid-Up Platinum Membership.',
    ]))
    story.append(Paragraph('Exclusions:', H3))
    story.append(bullet_list([
        'Your defence for a criminal charge arising from failure to pay '
        'maintenance;',

        'Fees and disbursements for ancillary applications (such as '
        'maintenance). You are personally responsible for paying these to '
        'the appointed legal advisor;',

        'If you enjoyed concurrent Cover for the same set of '
        'circumstances under the Uncontested Divorce Benefit, and vice '
        'versa;',

        'Spousal maintenance.',
    ]))

    # C) Rescission of Orders
    story.append(Paragraph(
        'C. Rescission of Administration Orders and Debt Review Orders',
        H2))
    story.append(lettered_list([
        'This benefit is only available to the Main Member.',

        'This benefit involves cancelling or setting aside a judgment or '
        'Court order for Administration Orders and Debt Review Orders, '
        'legally known as a rescission order.',

        'We will pay the appointed legal advisor\'s fees to rescind '
        '(cancel) an administration order against you.',

        'There is a continuous 12-month waiting period of Paid-Up '
        'Platinum Membership.',

        'We will pay for one rescission matter over a 24-month continuous '
        'period of Paid-Up Platinum Membership.',
    ]))
    story.append(Paragraph('Exclusions:', H3))
    story.append(bullet_list([
        'Any additional legal proceedings or ancillary applications '
        'related to the Administration Order or Debt Review Order '
        'outside of its rescission. These are actions brought by or '
        'against you involving your administrator, debt counsellor, '
        'creditors or any other interested party. You will be personally '
        'responsible for any related costs;',

        'The cost of your legal advisor\'s fees in any opposition to '
        'rescission of Administration Orders and Debt Review Orders.',
    ]))

    # D) Ante Nuptial Contracts
    story.append(Paragraph('D. Ante Nuptial Contracts', H2))
    story.append(lettered_list([
        'This benefit is only available to the Main Member.',

        'This benefit covers you exclusively for the drafting, lodgement '
        'and execution of an Ante-Nuptial Contract (ANC) in South Africa, '
        'regulating the terms and conditions of a marriage between '
        'prospective spouses.',

        'There is a continuous 12-month waiting period of Paid-Up '
        'Platinum Membership.',

        'We will pay for one Ante-Nuptial Contract over a 36-month period '
        'of continuous Paid-Up Platinum Membership.',

        'We will pay the appointed notary\'s fees to draft, lodge and '
        'execute an Ante-Nuptial Contract in accordance with Our Platinum '
        'Schedule of Tariffs.',
    ]))

    # E) Conveyancing Fees
    story.append(Paragraph('E. Conveyancing Fees', H2))
    story.append(lettered_list([
        'This benefit is available to the Main Member only.',

        'A conveyancer nominated by Us will give you a 20% discount on '
        'transfer fees.',

        'The standard waiting period applies as specified in your '
        'Schedule of Insurance.',

        'This benefit is limited to covering your primary place of '
        'residence.',

        'This benefit is available for only one transfer over a '
        'continuous 12-month period of Paid-Up Platinum Membership.',
    ]))
    story.append(Paragraph('Exclusions:', H3))
    story.append(bullet_list([
        'Costs such as transfer duty, clearance certificates and deeds '
        'office fees are for your own account.',
    ]))

    # F) Municipal Services
    story.append(Paragraph('F. Municipal Services', H2))
    story.append(lettered_list([
        'This benefit is available to the Main Member and Spouse.',

        'You are Covered for the unlawful conduct or failure by Local '
        'Government in respect of services and billing relating '
        'specifically to your Place of Residence.',

        'There is a one-month waiting period of Paid-Up Platinum '
        'Membership for the Municipal Services Benefit.',

        'We will assist you with one Municipal Services matter over a '
        'continuous 12-month period of Paid-Up Platinum Membership.',
    ]))

    # G) Personal Income Tax additional
    story.append(Paragraph(
        'G. Personal Income Tax (PIT) — Additional Services', H2))
    story.append(Paragraph(
        'In addition to the PIT services specified in the Main Agreement, '
        'the following additional services are only available to Platinum '
        'Members:', BODY))
    story.append(lettered_list([
        'The completion and electronic submission of your annual personal '
        'income tax return (including rental income from properties or '
        'rooms to let);',

        'The submission of supporting documents.',
    ]))

    # H) Infinity Legacy Accumulator
    story.append(Paragraph('H. Infinity Legacy Accumulator', H2))
    story.append(lettered_list([
        'The Main Member will be entitled to the Infinity Legacy '
        'Accumulator, which is an insurance loyalty benefit. It is an '
        'integral part of the Agreement, and it cannot be bought as a '
        'stand-alone policy.',

        'If the Main Member whose Membership has been Paid-Up for more '
        'than the number of months shown in your Schedule of Insurance '
        'dies while their Membership is active, We will pay a lump sum to '
        'the LEAD Beneficiary nominated by the Main Member. The lump sum '
        'will be the maximum of the most recent number of premiums '
        'received as shown in your Schedule of Insurance. Effective '
        'accumulation from 1 July 2024.',

        'The cash payment will be made to the nominated LEAD Beneficiary '
        'shown in your Schedule of Insurance, if that Beneficiary is 18 '
        'years or older. If not, or if nobody is nominated as a '
        'Beneficiary, the lump sum will be paid into the deceased estate.',
    ]))
    story.append(Paragraph(
        'We will not pay a cash benefit if the Member\'s death is '
        'directly or indirectly caused by any of the following:', BODY))
    story.append(Paragraph('Warlike activities', H3))
    story.append(bullet_list([
        'Nuclear, radioactive contamination, biological and chemical '
        'warfare, or sabotage;',

        'The Member actively taking part in: any war, invasion, '
        'rebellion, revolution, uprising, riot, civil commotion, strike, '
        'labour disturbance and the seizing of power; or overthrowing or '
        'influencing any government by force or terrorism.',
    ]))
    story.append(Paragraph('Self-inflicted death', H3))
    story.append(bullet_list([
        'The Member deliberately or negligently exposing themselves to '
        'the risks and events that led to the claim, except where the '
        'Member attempts to save a human life;',

        'Attempting suicide or deliberately self-inflicting injury;',

        'Refusing to seek or follow reasonable medical advice or '
        'treatment;',

        'Being under the influence of alcohol and/or drugs;',

        'Taking poison.',
    ]))
    story.append(Paragraph(
        'This Insurance benefit is conditional on Us receiving the fully '
        'completed Infinity Legacy Accumulator Benefit Claim Form, which '
        'forms part of this Agreement, within 180 days after the date of '
        'death. Additional conditions may apply when claiming this '
        'benefit; if so, they are shown in your Schedule of Insurance '
        'and/or the Infinity Legacy Accumulator Benefit Claim Form.',
        BODY))

    story.append(PageBreak())

    # ===========================================================
    # ADDENDUM 2 — Extended Family Protection
    # ===========================================================
    story.append(addendum_header('Extended Family Protection Addendum (EFP)'))
    story.append(Spacer(1, 6))
    story.append(Paragraph('Applicable to Policy A and Platinum A.', KICKER))
    story.append(Spacer(1, 4))
    story.append(numbered_list([
        'This Addendum is subject to the terms of the Main Membership '
        'Agreement, except as modified in your Schedule of Insurance and '
        'as set out below, and applies while your Membership is Paid-Up.',

        'In consideration of the EFP premium in force from time to time, '
        '"Family Members" include the persons shown in the Schedule of '
        'Insurance as the nominated: (a) biological parents or adoptive '
        'parents who are sixty years of age or older, of the Main Member; '
        '(b) biological parents or adoptive parents who are sixty years '
        'of age or older, of the Main Member\'s Spouse.',

        'The Maximum Limit per nominated person is shown in your Schedule '
        'of Insurance.',
    ]))
    story.append(callout(
        'NOTE:',
        'Cover under the Extended Family Protection Addendum is restricted '
        'to the personal, private and individual legal matters of the '
        'nominated Family Members, in line with the Insured Matters in '
        'Section 4. Business-related matters, matrimonial disputes and '
        'the other exclusions in Section 6 continue to apply.'))

    story.append(PageBreak())

    # ===========================================================
    # SERVICE & CONTACT POINTS
    # ===========================================================
    story.append(addendum_header('Service & Contact Points'))
    story.append(Spacer(1, 6))

    story.append(Paragraph('Branch Network', H2))
    story.append(Paragraph('Full-service branches', H3))
    story.append(Paragraph(
        'Our full-service branches are located nationwide. What makes our '
        'full-service branches different from our 24-hour legal contact '
        'centre and express branches is that, at a full-service branch, '
        'you can have a face-to-face consultation with one of our legal '
        'counsellors, you can collect your Membership Agreement, and you '
        'can also pay your premiums at selected branches.',
        BODY))
    story.append(Paragraph('Express branches', H3))
    story.append(Paragraph(
        'Express branches are usually hosted offices located mostly in '
        'remote areas where there are no full-service branches nearby. '
        'Our express branches have consultants who can assist in sending '
        'through any documentation required.',
        BODY))
    story.append(Paragraph(
        'Find your closest branch on our website at '
        '<b>www.infinitylegal.co.za/branches</b>.', BODY))

    story.append(Paragraph('Contact Centre', H2))
    story.append(Paragraph(
        'Call us 24 hours a day, 7 days a week, on <b>0861 4 LEGAL '
        '(0861 453 425)</b>. Our contact centre is staffed by trained '
        'legal counsellors who can log a new matter, give preliminary '
        'legal advice under the Legal Advisory Services benefit, and '
        'assist with any Membership query.',
        BODY))

    story.append(Paragraph('Digital Portals', H2))
    story.append(Paragraph('Infinity AI Assistant — Your 24/7 Digital Helper',
                           H3))
    story.append(Paragraph(
        'The Infinity AI Assistant is our smart self-service assistant, '
        'available any time to help with your policy queries, membership '
        'status, payment details and more — instantly and hassle-free. '
        'You will find the Infinity AI Assistant in the bottom-right '
        'corner of our website at <b>www.infinitylegal.co.za</b>. Just '
        'click the gold live-chat box to get started.',
        BODY))
    story.append(Paragraph('Website', H3))
    story.append(Paragraph(
        'On our website you can find all the latest newsletters, scam '
        'alerts, videos, legal articles, or you can contact us with any '
        'queries. To use our website, go to <b>www.infinitylegal.co.za</b>.',
        BODY))
    story.append(Paragraph('Member Portal', H3))
    story.append(Paragraph(
        'The Member Portal at <b>portal.infinitylegal.co.za</b> allows you '
        'to pay premiums, download your membership card and Schedule of '
        'Insurance, log new matters and track existing ones.',
        BODY))
    story.append(Paragraph('WhatsApp', H3))
    story.append(Paragraph(
        'Simply save our number <b>011 842 7890</b> to your contacts, '
        'then send "Hi" and you will get a list of menu options to '
        'choose from.',
        BODY))
    story.append(Paragraph('Facebook', H3))
    story.append(Paragraph(
        'You can follow us on Facebook for helpful legal tips or to send '
        'us a private message through Facebook Messenger. It is important '
        'that you do not post your personal details, such as your ID '
        'number or membership number, on our public pages.',
        BODY))
    story.append(Paragraph('Instagram', H3))
    story.append(Paragraph(
        'Find us on Instagram <b>@InfinityLegalSA</b> and follow us for '
        'great content such as legal tips, to see the work we do in our '
        'communities, to get in touch with us and much more.',
        BODY))
    story.append(Paragraph('TikTok', H3))
    story.append(Paragraph(
        'Find us on TikTok <b>@InfinityLegalSA</b> and follow us for '
        'great content such as legal tips, to see the work we do in our '
        'communities, to get in touch with us and much more.',
        BODY))

    story.append(PageBreak())

    # ===========================================================
    # FINAL REGULATORY PAGE
    # ===========================================================
    story.append(addendum_header('Regulatory & Compliance Information'))
    story.append(Spacer(1, 6))

    story.append(Paragraph('Infinity Legal SA (Pty) Ltd', H2))
    story.append(Paragraph(
        'Infinity Legal SA (Pty) Ltd (Reg. No. 2024/123456/07) is an '
        'Authorised Financial Services Provider (FSP 53214). Directors '
        'and their details are available at '
        '<b>www.infinitylegal.co.za</b>. Infinity Legal SA policies are '
        'underwritten by LegalGuard Insurance Southern Africa Limited '
        '(Reg. No. 2010/045678/06), a licensed insurer conducting '
        'non-life insurance business and a licensed controlling company, '
        'and an Authorised Financial Services Provider (FSP 48012).',
        REG_BODY))

    story.append(Spacer(1, 8))
    reg_data = [
        [Paragraph('<b>Entity</b>', TABLE_HEADER),
         Paragraph('<b>Registration Number</b>', TABLE_HEADER),
         Paragraph('<b>FSP Number</b>', TABLE_HEADER)],
        [Paragraph('Infinity Legal SA (Pty) Ltd', TABLE_CELL),
         Paragraph('2024/123456/07', TABLE_CELL),
         Paragraph('53214', TABLE_CELL_NUM)],
        [Paragraph('LegalGuard Insurance Southern Africa Limited',
                   TABLE_CELL),
         Paragraph('2010/045678/06', TABLE_CELL),
         Paragraph('48012', TABLE_CELL_NUM)],
    ]
    reg_widths = [CONTENT_W * 0.50, CONTENT_W * 0.30, CONTENT_W * 0.20]
    reg_table = Table(reg_data, colWidths=reg_widths, hAlign='CENTER',
                      repeatRows=1)
    reg_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_BG),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1),
         [TABLE_ROW_EVEN, TABLE_ROW_ODD]),
        ('GRID', (0, 0), (-1, -1), 0.4, BORDER),
        ('LINEBELOW', (0, 0), (-1, 0), 1.2, GOLD),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(reg_table)

    story.append(Spacer(1, 12))
    story.append(Paragraph('Compliance Statement', H2))
    story.append(Paragraph(
        'Infinity Legal SA (Pty) Ltd is registered as a Financial '
        'Services Provider in terms of the Financial Advisory and '
        'Intermediary Services Act 37 of 2002 (FAIS Act) and is authorised '
        'to render intermediary services in respect of the legal expenses '
        'insurance products described in this Agreement. All personal '
        'information processed in connection with this Agreement is '
        'processed in accordance with the Protection of Personal '
        'Information Act 4 of 2013 (POPIA). This Agreement is governed by '
        'the laws of the Republic of South Africa and any dispute arising '
        'out of or in connection with it shall be subject to the '
        'exclusive jurisdiction of the South African courts, save where '
        'otherwise required by the FAIS Act or the Policyholder '
        'Protection Rules made under the Short-Term Insurance Act 53 of '
        '1998.',
        REG_BODY))

    story.append(Spacer(1, 8))
    story.append(Paragraph('Complaints', H2))
    story.append(Paragraph(
        'Complaints may be directed in writing to the Compliance Officer, '
        'Infinity Legal SA, at <b>complaints@infinitylegal.co.za</b>. '
        'Should the complaint not be resolved to your satisfaction, you '
        'may approach the Ombud for Financial Services Providers (FAIS '
        'Ombud) at <b>www.faisombud.co.za</b> or on 012 470 9080, or the '
        'Financial Sector Conduct Authority (FSCA) at '
        '<b>www.fsca.co.za</b> on 0800 110 443.',
        REG_BODY))

    story.append(Spacer(1, 8))
    story.append(Paragraph('Contact', H2))
    story.append(Paragraph(
        '<b>Telephone:</b> 0861 4 LEGAL (0861 453 425)   |   '
        '<b>WhatsApp:</b> 011 842 7890<br/>'
        '<b>Email:</b> legal@infinitylegal.co.za   |   '
        '<b>Member Portal:</b> portal.infinitylegal.co.za<br/>'
        '<b>Website:</b> www.infinitylegal.co.za',
        REG_BODY))

    story.append(Spacer(1, 14))
    story.append(GoldRule(width=CONTENT_W, thickness=1.5))
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        '<i>Justice without limits.</i>',
        ParagraphStyle('TagEnd', fontName='LibSerif-Italic', fontSize=11,
                       leading=14, textColor=GOLD_DARK, alignment=TA_CENTER)))
    story.append(Paragraph(
        'Reference Number: ILS PERSONAL/2025/06/01 · '
        'Underwritten by LegalGuard Insurance Southern Africa Limited '
        '(FSP 48012)',
        ParagraphStyle('RegEnd', fontName='LibSans', fontSize=7.5,
                       leading=11, textColor=TEXT_MUTED, alignment=TA_CENTER)))

    return story


# ---------------------------------------------------------------------------
# Build the body PDF
# ---------------------------------------------------------------------------
def build_pdf(output_path):
    doc = TocDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=MARGIN_L,
        rightMargin=MARGIN_R,
        topMargin=MARGIN_T,
        bottomMargin=MARGIN_B,
        title='Infinity Legal SA Personal Legal Membership Agreement',
        author='Infinity Legal SA',
        subject='Membership Agreement',
        creator='Infinity Legal SA',
    )

    story = build_story()
    doc.multiBuild(story, onFirstPage=header_footer,
                   onLaterPages=header_footer)
    print(f'Body PDF generated: {output_path}')


if __name__ == '__main__':
    output = '/home/z/my-project/upload/body.pdf'
    build_pdf(output)
