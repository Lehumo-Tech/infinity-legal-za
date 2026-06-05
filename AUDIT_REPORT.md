# Infinity Legal ZA — Full Stack Launch Audit Report

**Date:** 2026-03-04  
**Auditor:** Launch Audit Agent (Task ID: 5)  
**Project:** Infinity Legal ZA — South African Law Firm Management Platform  
**Stack:** Next.js 16 + TypeScript + Prisma + Neon PostgreSQL + Tailwind CSS + shadcn/ui  

---

## EXECUTIVE SUMMARY

| Severity | Count | 
|----------|-------|
| CRITICAL | 10    |
| HIGH     | 12    |
| MEDIUM   | 10    |
| LOW      | 8     |

**Overall Verdict: NOT READY FOR PRODUCTION LAUNCH** — Critical security and infrastructure issues must be resolved before handling sensitive legal data.

---

## 1. CRITICAL ISSUES (Must Fix Before Launch)

### C-01: In-Memory Rate Limiting Breaks on Serverless (Vercel)
- **File:** `src/lib/security.ts:17-56`
- **Issue:** `RateLimiter` class uses an in-memory `Map<string, RateLimitEntry>`. On Vercel serverless, each function invocation gets a cold start with empty memory — rate limiting is completely ineffective.
- **Impact:** Auth endpoints (login/signup) have NO rate limiting in production. Attackers can brute-force passwords and mass-create accounts.
- **Fix:** Use Neon PostgreSQL-based rate limiting (the `RateLimitLog` model already exists in the schema!) or a Redis-based solution (Vercel KV).

### C-02: No 404 (not-found) Page
- **File:** Missing: `src/app/not-found.tsx`
- **Issue:** Next.js will render a generic 404 page for any non-existent route. For a legal platform, this looks unprofessional.
- **Fix:** Create `src/app/not-found.tsx` with branded 404 page matching the navy/gold theme.

### C-03: No Error Page (500)
- **File:** Missing: `src/app/error.tsx`
- **Issue:** No React error boundary at the route level. Unhandled errors in any page will show a blank white screen or Next.js default error UI.
- **Note:** An `ErrorBoundary` component exists at `src/components/ErrorBoundary.tsx` but is never used in the layout or pages.
- **Fix:** Create `src/app/error.tsx` (Next.js convention) with branded error UI and recovery actions.

### C-04: `.env` File Missing Critical Environment Variables
- **File:** `.env` — only contains `DATABASE_URL=file:/home/z/my-project/db/custom.db`
- **Issue:** The `.env` file is missing: `JWT_SECRET`, `ENCRYPTION_KEY`, `POSTGRES_URL`, `NEXT_PUBLIC_APP_URL`, and all PayFast vars. These are required for the app to start (auth.ts throws if `JWT_SECRET` is missing, security.ts throws if `ENCRYPTION_KEY` is missing).
- **Impact:** App crashes on startup without these vars.
- **Fix:** The `.env.example` needs updating too — missing `POSTGRES_URL`, `DIRECT_URL`, and all PayFast variables.

### C-05: PayFast Sandbox Credentials Hardcoded as Defaults
- **File:** `src/lib/payfast.ts:106-114`
- **Issue:** `getMerchantId()` defaults to `'10000100'` and `getMerchantKey()` defaults to `'46f0cd694581a'` — these are PayFast sandbox test credentials. If `PAYFAST_MERCHANT_ID` env var is not set (which it won't be on a fresh deploy), the app silently uses sandbox credentials in production.
- **Impact:** Real customer payments would go to sandbox, no real money collected.
- **Fix:** Remove defaults and throw errors if env vars are missing in production.

### C-06: `typescript.ignoreBuildErrors: true` in next.config.ts
- **File:** `next.config.ts:53`
- **Issue:** TypeScript errors are silently ignored during build. This means type errors that could cause runtime crashes are not caught.
- **Impact:** Runtime type errors in production.
- **Fix:** Remove `ignoreBuildErrors` and fix any TypeScript errors.

### C-07: No CORS Configuration on API Routes
- **File:** All API routes + `src/proxy.ts`
- **Issue:** There is no CORS (Cross-Origin Resource Sharing) configuration. While `Cross-Origin-Resource-Policy: same-origin` is set, there's no explicit `Access-Control-Allow-Origin` header handling. Browser-based attacks from other origins could still make simple requests.
- **Fix:** Add CORS headers in proxy.ts — restrict `Access-Control-Allow-Origin` to the app's own domain.

### C-08: Login Route Returns Password Expiry Info Without Re-authentication
- **File:** `src/app/api/auth/login/route.ts:48-55`
- **Issue:** When a password is expired, the API returns `{ requiresPasswordChange: true, userId: user.id, email: user.email }` — this leaks that the account exists and exposes the user ID before re-authentication.
- **Impact:** Information disclosure — attackers can enumerate valid accounts.
- **Fix:** Return a generic message without user ID, or require a password reset token flow.

### C-09: No Email Verification Flow
- **File:** `src/app/api/auth/signup/route.ts:63` — `email_verified: false` is set but never followed up
- **Issue:** Users sign up with `email_verified: false` but there is no email verification mechanism. Any email can be used, including someone else's.
- **Impact:** For a legal platform handling sensitive data, this is a POPIA compliance risk. Users could impersonate others.
- **Fix:** Implement email verification with a token sent to the registered email.

### C-10: Signup Route in LoginScreen Sends `role: 'client'` (Redundant but Unsafe Pattern)
- **File:** `src/components/LoginScreen.tsx:58`
- **Issue:** The frontend sends `role: 'client'` in the signup request body. While the backend correctly ignores it (line 23 of signup route), this is a dangerous pattern — if the backend code is ever changed to trust the request body, it creates a privilege escalation vulnerability.
- **Fix:** Remove `role` from the signup request payload entirely.

---

## 2. HIGH ISSUES (Should Fix Before Launch)

### H-01: ErrorBoundary Component Exists But Is Never Used
- **File:** `src/components/ErrorBoundary.tsx`
- **Issue:** The ErrorBoundary component is defined but not wrapping any page/layout. React errors will crash the entire app.
- **Fix:** Wrap `children` in `layout.tsx` with `<ErrorBoundary>` or use Next.js `error.tsx` convention.

### H-02: No Token Refresh Mechanism
- **File:** `src/lib/auth.ts:86-99`
- **Issue:** JWTs have a 24-hour expiry but there's no refresh token mechanism. When the token expires, the user is silently logged out with no way to continue their session.
- **Fix:** Implement refresh tokens or auto-renewal before expiry.

### H-03: JWT Token Stored in localStorage (XSS Vulnerable)
- **File:** `src/components/HomePageClient.tsx:196-197`
- **Issue:** `localStorage.setItem('il_token', data.data.token)` — JWT stored in localStorage is accessible to any XSS attack. For a legal platform, this is a high-severity concern.
- **Fix:** Use httpOnly cookies for token storage, or at minimum use sessionStorage + short token expiry.

### H-04: No Session Expiry Check on Client
- **File:** `src/components/HomePageClient.tsx:344-365`
- **Issue:** When the user returns, the saved token is used without checking if it's expired. The token could be days old and still be presented to APIs (which will reject it, but the UI shows the authenticated state).
- **Fix:** Decode the JWT client-side and check expiry before restoring session.

### H-05: `/api/contact` Route Has No Auth or Rate Limiting
- **File:** `src/app/api/contact/route.ts`
- **Issue:** The contact form endpoint has no authentication and no rate limiting. Spammers can abuse it to send unlimited messages.
- **Fix:** Add rate limiting to the contact endpoint.

### H-06: `/api/ai/chat` Route Has No Auth
- **File:** `src/app/api/ai/chat/route.ts`
- **Issue:** The AI chat endpoint has no authentication. Anyone can use it without limits, potentially costing money in AI API calls.
- **Fix:** Add at least basic auth or rate limiting.

### H-07: `/api/report` Route Has No Auth
- **File:** `src/app/api/report/route.ts`
- **Issue:** The report endpoint generates a full HTML report and has no authentication. Anyone can access system information.
- **Fix:** Add authentication or remove this endpoint for production.

### H-08: Duplicate Security Headers in next.config.ts and proxy.ts
- **Files:** `next.config.ts:3-44`, `src/proxy.ts:10-62`
- **Issue:** Both files define overlapping security headers (CSP, X-Frame-Options, HSTS, etc.). The proxy.ts headers take precedence at runtime, but the duplication creates maintenance risk — if one is updated, the other may be forgotten.
- **Fix:** Remove security headers from next.config.ts and keep them only in proxy.ts (or vice versa).

### H-09: CSP Allows `unsafe-inline` and `unsafe-eval`
- **File:** `src/proxy.ts:12`, `next.config.ts:17`
- **Issue:** `script-src 'self' 'unsafe-inline' 'unsafe-eval'` significantly weakens CSP protection. `unsafe-eval` allows `eval()` which is a major XSS vector.
- **Impact:** CSP provides limited protection against XSS with these directives.
- **Fix:** Use nonce-based CSP and remove `unsafe-inline`/`unsafe-eval`. This requires adding nonce support to the Next.js config.

### H-10: `reactStrictMode: false` in next.config.ts
- **File:** `next.config.ts:56`
- **Issue:** React Strict Mode is disabled. This means potential issues like double-rendering bugs, stale closures, and missing cleanup functions won't be caught during development.
- **Fix:** Set `reactStrictMode: true`.

### H-11: No Database Connection Pooling for Neon
- **File:** `src/lib/db.ts:13-19`
- **Issue:** PrismaClient is created with default settings. For Neon serverless PostgreSQL, connection pooling should be explicitly configured. The schema has `directUrl` set but the application uses the pooler URL.
- **Fix:** Ensure the Prisma client uses the Neon pooler connection string and configure `connection_limit` and `pool_timeout` in the connection URL.

### H-12: Prisma Schema Missing `onDelete: Cascade` on Several Relations
- **File:** `prisma/schema.prisma`
- **Issue:** The following relations have NO `onDelete: Cascade`, meaning deleting a user will fail if they have related records:
  - `User.audit_logs` → AuditLog (line 252)
  - `User.consent_logs` → ConsentLog (line 253)
  - `User.consultations_as_client` → Consultation (line 255)
  - `User.consultations_as_attorney` → Consultation (line 256)
  - `User.documents_prepared` → Document (line 260)
  - `User.documents_approved` → Document (line 261)
  - `User.documents_signed` → Document (line 262)
  - `User.documents_supervised` → Document (line 263)
  - `User.privileged_notes` → PrivilegedNote (line 264)
  - `Case.consultations` → Consultation (line 326)
  - `Lead.assigned_paralegal` → Lead (line 357)
  - `Lead.assigned_officer` → Lead (line 358)
  - `PrivilegedNote.author` → User (line 621)
  - `PaymentRecord.user` → User (line 734)
  - `PaymentRecord.subscription` → UserSubscription (line 735)
- **Impact:** Deleting a user or case will throw a foreign key constraint error.
- **Fix:** Add `onDelete: Cascade` or `onDelete: SetNull` as appropriate.

---

## 3. MEDIUM ISSUES (Nice to Fix)

### M-01: Excessive Use of `any` Type (40+ instances)
- **Files:** `src/lib/middleware.ts:193,210,232`, `src/app/api/cases/route.ts:27`, `src/app/api/leads/route.ts:28`, `src/app/api/dashboard/route.ts:67-68`, `src/components/HomePageClient.tsx` (multiple), and more
- **Fix:** Replace `any` with proper TypeScript types.

### M-02: console.log in PayFast Notify Route
- **File:** `src/app/api/payfast/notify/route.ts:27`
- **Issue:** `console.log('PayFast ITN received:', JSON.stringify(itnData, null, 2))` — logs full ITN data including payment details. This is a data leak in production logs.
- **Fix:** Remove or replace with structured logging that redacts PII.

### M-03: console.log in db-queries.ts
- **File:** `src/lib/db-queries.ts:198`
- **Issue:** `console.log('[DB Query] ...')` — debug logging left in code.
- **Fix:** Remove or use a proper logger.

### M-04: No Loading States for Initial Page Load
- **File:** `src/app/page.tsx` / `src/components/HomePageClient.tsx`
- **Issue:** The homepage renders the full client component immediately. There's no `loading.tsx` for the root route, so users see a blank page while JS loads.
- **Fix:** Create `src/app/loading.tsx` with a branded skeleton/spinner.

### M-05: Footer Links Point to `#` (Nowhere)
- **File:** `src/components/LandingPage.tsx:624-626`
- **Issue:** Privacy Policy, Terms of Service, and POPIA Compliance links all point to `#`. For a legal platform, these are expected pages.
- **Fix:** Create at least basic privacy/terms/POPIA pages.

### M-06: Google Site Verification Is Placeholder
- **File:** `src/app/layout.tsx:97`
- **Issue:** `verification: { google: "google-site-verification-code" }` — placeholder value.
- **Fix:** Replace with actual Google Search Console verification code.

### M-07: Sitemap Only Contains Root URL
- **File:** `src/app/sitemap.ts`
- **Issue:** Sitemap only lists the homepage. No sub-pages for SEO discovery.
- **Fix:** Add all public-facing pages (pricing, consultation booking, etc.) as they become available.

### M-08: IntakeSubmission.status Is `String` Instead of Enum
- **File:** `prisma/schema.prisma:417`
- **Issue:** `status String @default("submitted")` — should be an enum for type safety and data integrity.
- **Fix:** Create an `IntakeStatus` enum and update the field.

### M-09: PaymentRecord.payment_status Is `String` Instead of Enum
- **File:** `prisma/schema.prisma:727`
- **Issue:** `payment_status String @default("pending")` — should be an enum.
- **Fix:** Create a `PaymentStatus` enum.

### M-10: Vercel Region Set to `iad1` (US East)
- **File:** `vercel.json:6`
- **Issue:** `"regions": ["iad1"]` deploys to US East. South African users will experience high latency.
- **Fix:** Change to `"regions": ["cpt1"]` (Cape Town) or `"regions": ["cdg1"]` (Paris — closest EU to SA with better performance).

---

## 4. LOW ISSUES (Optional Improvements)

### L-01: Audit Library Comment Says "SQLite"
- **File:** `src/lib/audit.ts:4`
- **Issue:** Comment says "Uses Prisma + SQLite" — should be PostgreSQL.
- **Fix:** Update comment.

### L-02: Multiple API Route Comments Say "SQLite"
- **Files:** `src/app/api/cases/route.ts:3`, `src/app/api/leads/route.ts:3`, `src/app/api/tasks/route.ts:3`, `src/app/api/consultations/route.ts:3`, `src/app/api/documents/route.ts:3`, `src/app/api/notifications/route.ts:3`
- **Issue:** Comments still reference SQLite instead of PostgreSQL.
- **Fix:** Update comments.

### L-03: Unused Dependencies in package.json
- **File:** `package.json`
- **Issue:** Several dependencies appear unused: `pocketbase`, `next-auth`, `next-intl`, `bcryptjs` (crypto is used instead), `@dnd-kit/*`, `framer-motion`, `zustand`, `sharp`.
- **Fix:** Audit and remove unused dependencies to reduce bundle size.

### L-04: No `apple-touch-icon` Specific File
- **File:** `src/app/layout.tsx:105`
- **Issue:** Apple touch icon points to `/infinity_logo.png` which is a full logo, not a proper 180x180 Apple touch icon.
- **Fix:** Create a dedicated 180x180 apple-touch-icon.png.

### L-05: site.webmanifest Icon Sizes Incorrect
- **File:** `public/site.webmanifest:10`
- **Issue:** `infinity_logo.png` is listed as `512x512` but the actual image dimensions may not match.
- **Fix:** Generate proper icon sizes or remove incorrect sizes.

### L-06: No Web Accessibility (a11y) Audit
- **Issue:** While ARIA labels exist on key interactive elements, there's no comprehensive a11y audit. Legal platforms in South Africa may need to comply with accessibility requirements.
- **Fix:** Run automated a11y testing (e.g., axe-core) and manual keyboard navigation testing.

### L-07: Password Hashing Uses HMAC Instead of PBKDF2/bcrypt/scrypt
- **File:** `src/lib/auth.ts:17-23`
- **Issue:** `hashPassword` uses `createHmac('sha512', salt).update(password)` — HMAC is not a proper password hashing function. It's too fast for password hashing. Should use bcrypt, scrypt, or Argon2.
- **Note:** `bcryptjs` is in package.json but not used for hashing.
- **Fix:** Replace HMAC with `bcryptjs.hash()` which is already installed.

### L-08: Duplicate `bcryptjs` and Custom Hashing
- **File:** `src/lib/auth.ts`, `package.json:58`
- **Issue:** `bcryptjs` is installed as a dependency but the custom HMAC-based hashing is used instead. This is less secure and creates confusion.
- **Fix:** Use bcryptjs for password hashing as intended.

---

## 5. SECURITY AUDIT CHECKLIST

| Check | Status | Notes |
|-------|--------|-------|
| API routes have proper auth | ⚠️ PARTIAL | `/api/contact`, `/api/ai/chat`, `/api/report`, `/api/health`, `/api/pricing` have no auth |
| SQL injection risks | ✅ PASS | All queries use Prisma parameterized queries |
| XSS vulnerabilities | ⚠️ PARTIAL | `dangerouslySetInnerHTML` used for JSON-LD in layout.tsx (acceptable), but CSP allows `unsafe-inline`/`unsafe-eval` |
| Rate limiting on auth endpoints | ❌ FAIL | In-memory rate limiting is ineffective on serverless |
| JWT token validation on protected routes | ✅ PASS | All protected routes use `requireAuth()` |
| CORS configuration | ❌ FAIL | No explicit CORS configuration |
| CSP headers | ⚠️ PARTIAL | Present but weakened by `unsafe-inline`/`unsafe-eval` |
| Sensitive data in responses | ✅ PASS | Password hash not returned in any API response |
| Hardcoded secrets in .env | ⚠️ PARTIAL | `.env` incomplete; PayFast defaults are sandbox credentials in code |
| PayFast signature verification | ✅ PASS | ITN verification with signature check + server-side validation |

## 6. FUNCTIONALITY AUDIT CHECKLIST

| Check | Status | Notes |
|-------|--------|-------|
| Login works end-to-end | ✅ PASS | Verified in prior tasks |
| Signup works end-to-end | ✅ PASS | Creates user + profile + consent logs |
| PayFast checkout flow | ⚠️ PARTIAL | Works in sandbox only; needs production credentials |
| All API routes return proper responses | ✅ PASS | Standardized response format |
| Broken imports or missing files | ✅ PASS | Lint passes clean |
| Landing page renders | ✅ PASS | SSR with SEO metadata |
| Dashboard works after login | ✅ PASS | Stats, charts, notifications load |
| Notifications working | ✅ PASS | Created for task assignments, consultations |
| Consultation booking | ✅ PASS | Full CRUD with validation |
| Password change flow | ❌ FAIL | No password change/reset endpoint exists |

## 7. DATABASE AUDIT CHECKLIST

| Check | Status | Notes |
|-------|--------|-------|
| Prisma schema consistent | ✅ PASS | All models properly defined |
| Relations properly defined | ⚠️ PARTIAL | Missing `onDelete: Cascade` on 15+ relations |
| Indexes on frequently queried fields | ✅ PASS | Comprehensive indexes on all models |
| Cascading deletes | ❌ FAIL | Many relations lack cascade deletes |
| Enum consistency | ⚠️ PARTIAL | `IntakeSubmission.status` and `PaymentRecord.payment_status` are strings, not enum |

## 8. PRODUCTION READINESS CHECKLIST

| Check | Status | Notes |
|-------|--------|-------|
| Error boundaries for React | ⚠️ PARTIAL | Component exists but not used in layout |
| Loading states for async ops | ⚠️ PARTIAL | Skeletons exist for dashboard stats only |
| 404 page | ❌ FAIL | Missing `not-found.tsx` |
| 500 error page | ❌ FAIL | Missing `error.tsx` |
| Proper favicon/icons | ⚠️ PARTIAL | Logo used but proper sizes missing |
| Meta tags for all pages | ✅ PASS | Comprehensive in layout.tsx and page.tsx |
| Sitemap accessible | ✅ PASS | Generated at `/sitemap.xml` |
| robots.txt accessible | ✅ PASS | Generated at `/robots.txt` |
| Password reset flow | ❌ FAIL | No password reset functionality exists |
| Email verification | ❌ FAIL | No email verification flow exists |

## 9. PERFORMANCE AUDIT CHECKLIST

| Check | Status | Notes |
|-------|--------|-------|
| Unnecessary re-renders | ⚠️ PARTIAL | HomePageClient is a massive monolith (~1900 lines) |
| API calls optimized | ✅ PASS | Dashboard uses `Promise.all` for parallel queries |
| Database connection pooling | ⚠️ PARTIAL | Neon pooler configured but no explicit pool settings |
| Bundle size | ⚠️ PARTIAL | Many unused dependencies inflate bundle |
| React Strict Mode | ❌ FAIL | Disabled, missing double-render optimizations |

---

## 10. RECOMMENDED FIX PRIORITY

### Immediate (Before Launch):
1. **Fix rate limiting** — Use PostgreSQL-based rate limiting with the existing `RateLimitLog` model
2. **Create `not-found.tsx`** and **`error.tsx`** 
3. **Complete `.env`** with all required variables and update `.env.example`
4. **Remove PayFast sandbox defaults** from `payfast.ts`
5. **Remove `ignoreBuildErrors`** from `next.config.ts`
6. **Add `onDelete: Cascade`** to Prisma schema relations
7. **Fix password hashing** — use bcryptjs instead of HMAC
8. **Create password reset flow**
9. **Add CORS configuration** to proxy.ts
10. **Wrap layout children** in ErrorBoundary

### Before Public Launch:
1. Implement email verification
2. Move JWT from localStorage to httpOnly cookies
3. Fix CSP to remove `unsafe-inline`/`unsafe-eval`
4. Add rate limiting to `/api/contact` and `/api/ai/chat`
5. Protect `/api/report` with auth
6. Create Privacy Policy, Terms of Service, and POPIA pages
7. Change Vercel region to Cape Town or closer
8. Remove unused npm dependencies
9. Add `loading.tsx` for root route
10. Implement refresh tokens

### Post-Launch Improvements:
1. Replace `any` types with proper TypeScript types
2. Remove `console.log` statements
3. Update stale SQLite comments
4. Create proper apple-touch-icon
5. Run comprehensive a11y audit
6. Add IntakeStatus and PaymentStatus enums
7. Expand sitemap with additional pages
8. Refactor HomePageClient into smaller components
