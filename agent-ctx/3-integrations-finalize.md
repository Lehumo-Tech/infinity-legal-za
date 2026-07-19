# Task ID 3 — full-stack-developer (integrations-finalize)

## Task
Finalize `.env.example` for all 7 services + build Integrations dashboard UI

## Files Changed
1. `/home/z/my-project/.env.example` — REWROTE (single clean reference for all 7 services + core + legacy)
2. `/home/z/my-project/src/components/IntegrationsDashboard.tsx` — CREATED (~425 lines, 'use client')
3. `/home/z/my-project/src/components/DashboardShell.tsx` — EDITED (5 surgical edits to wire nav item)

## Key Decisions
- **Supabase & PayFast kept**: Verified both are still actively used in the codebase. Supabase is the auth-session fallback in `src/lib/local-auth.ts:334` and `src/proxy.ts:102`. PayFast is in 15 files including `src/lib/payfast.ts`, `src/app/api/payfast/*`, and `src/components/PaymentWall.tsx`. Both marked as "(legacy)" in `.env.example`.
- **Nav item role gate**: Restricted to `managing_director` + `systems_admin` ONLY (exact match to `/api/integrations` role gate). Did NOT use the broader `isManagement` check (which includes `admin`) because the API would 403 for `admin` role and degrade UX.
- **Resend `configured` vs `enabled` discrepancy**: The API returns `enabled` for 6 services but `configured` for Resend (legacy naming in `src/lib/email-service.ts` getEmailServiceStatus). Built `isServiceOn(s) = Boolean(s.enabled ?? s.configured)` helper so Resend shows correctly without touching the API route.
- **Lint fix**: Hit `react-hooks/set-state-in-effect` on the `load()` call in useEffect. Pattern is identical to CommunicationsView (which passes lint) — used `// eslint-disable-next-line react-hooks/set-state-in-effect` with explanatory comment rather than restructuring, since the canonical "fetch on mount" pattern is correct.
- **Self-contained auth**: Component uses `useAuth()` directly to get `accessToken` (per brief) rather than accepting a `token` prop. This makes it drop-in for the render block in DashboardShell without prop drilling.

## Verification
- `bun run lint` → 0 errors, 0 warnings (entire project)
- `npx tsc --noEmit` → 0 errors in IntegrationsDashboard.tsx or DashboardShell.tsx
- Dev server restarted; logged in as tidimalo@infinitylegal.org; `GET /api/integrations` returned 200 with full 7-service payload (`{ success, data: { sentry, resend, stripe, clerk, upstash, pinecone, posthog } }`)
- All 7 services present in the response with correct `enabled`/`configured` + `label` fields

## Constraints Honored
- Did NOT touch `prisma/seed.ts`, `prisma/schema.prisma`, or run any DB commands
- Did NOT touch any existing integration lib files (stripe.ts, upstash.ts, clerk-config.ts, pinecone.ts, posthog*.ts, email-service.ts, sentry*.ts, instrumentation*.ts)
- Did NOT touch `src/app/api/integrations/route.ts` (already correct)
- Did NOT install any new packages (used existing shadcn/ui Card/Badge/Skeleton/Button + lucide-react + useAuth + sonner)
- Only created IntegrationsDashboard.tsx, edited .env.example, and edited DashboardShell.tsx
