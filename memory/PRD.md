# Infinity Legal Platform - Product Requirements Document

## Overview
Infinity Legal is a legal tech platform for the South African market, providing AI-powered legal analysis, case management, and document vault functionality.

## Current State: Pre-Launch MVP (CIPC Pending)

### Core Constraints
- **Zero Payments / Free Tier Only**: All payment gateways disabled pending CIPC approval
- **No Waitlist Language**: Public-facing UI uses "Get Started Free" / "Register Now" — no "waitlist" references
- **POPIA Compliance**: Full privacy compliance with consent checkboxes and data export
- **No Legacy Terminology**: No "cover/coverage", "court representations", "coverage limits", or "Attorney"

### Implemented Features

#### Lead Capture & Scoring System
- **Registration forms** on Homepage (modal), Pricing (modal), and Signup page
- **Legal need dropdown**: CCMA, Labour Dispute, Divorce, Eviction, Criminal, Custody, Debt Review, Consumer, Property, General, Other
- **Lead scoring** (0-5): CCMA/Labour=+3, Divorce/Eviction=+2, Consumer/Property=+1, .co.za email=+1, phone=+1, name=+0.5
- **Priority classification**: Hot (≥4), Warm (≥2.5), Cool (≥1), Cold (<1)
- POPIA consent checkbox required on all forms

#### Reddit RSS Social Listening
- Fetches public posts from r/SouthAfrica via RSS (no API key, $0 cost)
- Filters for legal keywords: CCMA, eviction, divorce, unfair dismissal, etc.
- Scores and prioritizes posts by urgency + recency
- Ethics: Only public posts, no DMs, always links to consent form

#### Advisor Leads Dashboard (`/portal/leads-dashboard`)
- **Registered Leads tab**: Full table with priority, name, email, legal need, score, plan, source, date
- **Social Listening tab**: Reddit feed with View Post + Respond Publicly buttons
- Priority filters: All, Hot, Warm, Cool, Cold
- Stats cards: Total, Hot, Warm, Cool, Cold counts
- POPIA compliance banner

#### API Endpoints
- `POST /api/waitlist` — Lead capture with scoring, legal_need, POPIA consent
- `GET /api/waitlist` — Admin lead list with stats, filters, sorted by score
- `GET /api/reddit-leads` — Reddit RSS social listener
- `POST /api/analyze` — Free-tier mock AI legal analysis (6 categories)
- `GET /api/user/export` — POPIA data export (authenticated)
- Full Cases, Tasks, Documents, Leads, Intakes CRUD (MongoDB)

#### Portal Features
- Dashboard: CIPC banner, Free Tier badge, AI Analysis CTA, Contact Support (Email + WhatsApp)
- Settings: Profile, Privacy (Export My Data), Notifications
- Lead Intelligence: Leads table + Reddit social listening

### Tech Stack
- **Frontend**: Next.js 14 App Router, Tailwind CSS, shadcn/ui
- **Auth**: Supabase Authentication
- **Database**: MongoDB (business data), Supabase (auth profiles only)
- **AI**: Emergent LLM Key (OpenAI-compatible)
- **Social Listening**: Reddit public RSS feed ($0 cost)

### Admin Credentials
- Email: tsatsi@infinitylegal.org
- Password: Infinity2026!
- Role: Administrator (Full Access)

### Future Tasks (ON HOLD)
- PayFast payment integration (pending CIPC approval)
- NextAuth.js migration (if requested)
