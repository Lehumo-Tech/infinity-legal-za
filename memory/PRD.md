# Infinity Legal Platform - Product Requirements Document

## Overview
Infinity Legal is a legal tech platform for the South African market, providing AI-powered legal analysis, case management, and document vault functionality.

## Current State: Pre-Launch MVP (CIPC Pending)

### Core Constraints
- **Zero Payments / Free Tier Only**: All payment gateways disabled pending CIPC approval
- **Waitlist Mode**: All pricing CTAs replaced with "Join Waitlist" buttons
- **POPIA Compliance**: Full privacy compliance with consent checkboxes and data export
- **No Legacy Terminology**: No "cover/coverage", "court representations", "coverage limits", or "Attorney" — uses "Plan", "Unlimited Legal Support", "Legal Advisor"

### Implemented Features (Pre-Launch MVP)

#### Public Pages
- Homepage with CIPC disclaimer banner, Join Waitlist modal, WhatsApp floating button
- Pricing page with all CTAs as "Join Waitlist" (opening waitlist modal)
- Signup page converted to waitlist-only flow (no payment step, POPIA checkbox)
- Login page with Real Login (Supabase Auth) and Demo Mode
- Privacy Policy page (/privacy)
- Free AI Legal Analysis (/intake)

#### API Endpoints
- `POST /api/waitlist` — Join waitlist with POPIA consent
- `GET /api/waitlist` — Admin: view waitlist count and recent entries
- `POST /api/analyze` — Free-tier mock AI legal analysis (6 categories)
- `GET /api/user/export` — POPIA data export (authenticated)
- Full Cases, Tasks, Documents, Leads, Intakes CRUD (MongoDB)
- AI Intake Analysis, Document Assist, Case Insights (Emergent LLM)

#### Portal Dashboard
- CIPC pending banner ("Premium features pending CIPC approval")
- "Free Tier Active" badge with green indicator
- "Free AI Analysis" CTA button
- Contact Support section (Email + WhatsApp)
- Quick actions: AI Analysis, Documents, Approvals, AI Research

#### Settings Page (/portal/settings)
- Profile tab: Account info, plan status with "Free Tier Active" badge
- Privacy tab: "Export My Data" button (POPIA Section 23), privacy rights info
- Notifications tab: Preference toggles

### Tech Stack
- **Frontend**: Next.js 14 App Router, Tailwind CSS, shadcn/ui
- **Auth**: Supabase Authentication
- **Database**: MongoDB (business data), Supabase (auth profiles only)
- **AI**: Emergent LLM Key (OpenAI-compatible proxy)

### Admin Credentials
- Email: tsatsi@infinitylegal.org
- Password: Infinity2026!
- Role: Administrator (Full Access)

### Future Tasks (ON HOLD)
- PayFast payment integration (pending CIPC approval)
- NextAuth.js migration (if explicitly requested)
