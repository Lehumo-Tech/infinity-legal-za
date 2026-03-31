# Infinity Legal Platform — Product Requirements Document

## Overview
Comprehensive legal tech SaaS platform for the South African market. Provides AI-powered legal intake, member management, attorney portals, lead intelligence, and legal resources.

## Brand Guidelines
- **Primary Navy:** #0f2b46
- **Gold Accent:** #c9a961
- **Font:** Playfair Display (headings), Inter (body)
- **Logo:** `/public/logo-icon-*.png` (official, processed)

## Pricing (Official)
| Plan     | Monthly | Annual (20% off) |
|----------|---------|-------------------|
| Basic    | R95     | R76/mo            |
| Premium  | R115    | R92/mo            |
| Business | R130    | R104/mo           |

## Architecture
- Next.js 14 App Router + Tailwind + shadcn/ui
- MongoDB (intakes, cases, leads, documents)
- Supabase (real auth — paused)
- localStorage (demo auth — active)
- GPT-4o via Emergent LLM Key (AI intake)
- Brevo (email notifications)

## Demo Mode (ACTIVE)
Three portals powered by `lib/demo-data.js` and `lib/demo-auth.js`:
- Member Portal: `/portal/member`
- Staff Portal: `/portal/staff`
- Admin Portal: `/portal/admin`

## Key Features
- [x] AI Legal Intake Wizard (5-step, MongoDB, Zod)
- [x] Cases Module (TS Clean Architecture)
- [x] Legal Resources Hub (34+ items, email gate)
- [x] Member/Staff/Admin Demo Portals
- [x] Lead Scraper UI
- [x] Homepage with app content carousel
- [x] Ask Infinity — AI Legal Information Assistant (GPT-4o + cached SA legislation)
- [x] Pricing: Civil R99 / Labour R99 / Extensive R139 (court included)
- [x] Dual Auth: Supabase (real) + localStorage (demo toggle)
- [ ] Phase 3: Leads TS Rebuild
- [ ] Phase 4: Documents Module
- [ ] Convert Demo → Real Backends
- [ ] PayFast Integration (ON HOLD)

## Reports Generated
- `/public/Infinity_Legal_Feb2026_Report.pdf` (Latest)
- `/public/Infinity_Legal_Progress_Report.pdf`
- `/public/Infinity_Legal_Demo_Report.pdf`
