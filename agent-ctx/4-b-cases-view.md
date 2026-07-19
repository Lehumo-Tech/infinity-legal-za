# Task 4-b: Overhaul CasesView with create dialog + openable detail drawer

## Summary
Replaced the read-only `CasesView.tsx` (122 lines) with a fully interactive
~1115-line component that supports case creation (staff-only dialog), clickable
rows opening a detail Sheet with Overview/Documents/Tasks/Timeline tabs, and
an inline status changer. Lint clean, TypeScript clean, end-to-end verified.

## Files Changed
- `src/components/CasesView.tsx` (rewritten end-to-end)

## Component signature (updated)
```ts
export function CasesView({
  cases, page, total, onPageChange, onRefresh, loading,
  token, user, staff,
}: {
  cases: CaseRow[];
  page: number;
  total: number;
  onPageChange: (p: number) => void;
  onRefresh: () => void;
  loading?: boolean;
  token: string | null;
  user: User | null;
  staff: StaffMember[];
})
```
Parent (`DashboardShell.tsx` line 638) already passes `token`, `user`, `staff` —
no parent changes needed.

## Features built

### 1. "New Case" button (gold `bg-[#c9a84c]`, `Plus` icon)
Shown only for staff roles (`managing_director`, `systems_admin`, `admin`,
`attorney`, `paralegal`). Opens a Dialog with form fields:
- `title` (Input, required)
- `case_type` (Select — all 11 VALID_CASE_TYPES, required)
- `urgency` (Select: low / medium / high / critical, default medium)
- `client_id` Select (staff only — see "Client selector" note below)
- `description` (Textarea, optional)
- `estimated_value` (number Input, optional)
- `opposing_party` (Input, optional)
- `court_name` (Input, optional)
- `jurisdiction` (Input, optional)
- `attorney_id` (Select listing attorneys from `staff` prop, optional, with
  "Unassigned" option)
- Client users: `client_id` is omitted and the API auto-resolves their own
  Client profile.

On submit → `POST /api/cases` with `Authorization: Bearer <token>`. On success
→ close dialog, `onRefresh()`, `toast.success("Case created: {case_ref}")`,
and `clientTrack('case_created', { caseId, caseRef, caseType })`.

### 2. Clickable rows + mobile cards → open detail Sheet
Both desktop `<tr>` and mobile card layout now have `onClick={() => openCaseDetail(c)}`
+ `cursor-pointer` + hover styles. Mobile cards use `<button>` elements for
proper a11y. The detail Sheet uses `w-full sm:max-w-2xl` (full-width on mobile).

### 3. Case detail Sheet with Tabs
Fetches `GET /api/cases/[id]` with Bearer token on open. Four tabs:
- **Overview**: case info grid (type, urgency, est. value, retainer, opposing
  party, court, jurisdiction, next deadline, opened date, high-risk flag),
  client card, lead advisor card, description, internal notes. Staff-only
  action bar (status changer + disabled "Schedule Consultation" button with
  tooltip "Schedule from the Consultations view").
- **Documents**: list of case documents — each shows file_name, document_type,
  status badge, version, created_at.
- **Tasks**: list of case tasks — each shows title, priority, due date, status.
- **Timeline**: vertical timeline (gold dot markers) — each event shows
  event_type badge, formatted date/time, and event_description. Reverse chrono
  (API already returns desc order).

TabsList has `overflow-x-auto` for horizontal scroll on mobile.

### 4. Status changer (staff only)
A shadcn `Select` bound to the current case status. On change →
`PUT /api/cases/[id] { status }` with Bearer token. On success →
`toast.success("Status updated to {Humanized}")`, refresh case detail, call
`onRefresh()` to refresh the list, and `clientTrack('case_status_changed',
{ caseId, newStatus })`. Disabled while the PUT is in-flight.

### 5. Loading states
- List: existing `TableSkeleton` is preserved.
- Detail drawer fetching: `DetailSkeleton` (custom) shows shimmer for the
  TabsList + info grid + client/attorney cards + description.
- Action in-flight: status Select is disabled; create-case submit button
  shows a `RefreshCw` spinner.

### 6. Existing table + mobile card layout preserved
Status colors, urgency colors, pagination, and the "N total cases" header
all kept. Only additions are the "New Case" button (next to Refresh) and
the `onClick`/`cursor-pointer` on rows.

### 7. Brand colors
Navy `#0c1e3c`, gold `#c9a84c` / `#a88832`. NO indigo/blue. Sheet header has a
navy gradient with gold mono case_ref.

## Client selector — IMPORTANT FINDING

The task brief suggested fetching `GET /api/crm` for the client list. The
`/api/crm` route returns **aggregate metrics only** (totalUsers,
activeSubscriptions, leadFunnel, etc.) — NOT a client list. The neighbouring
`/api/crm/users?role=client` route returns users with role=client, but the
response mapping only exposes `user.id` (the User PK), NOT `client_profile.id`
(the Client profile PK). 

This matters because:
- `POST /api/cases` validates `client_id` via `db.client.findUnique({ where: { id: client_id } })`
  — i.e. against `Client.id`, the Client profile PK.
- Submitting `user.id` as `client_id` fails with `404 CLIENT_NOT_FOUND`.
- Likewise, `GET /api/cases` returns `case.client.id` = `c.client.user.id`
  (the user.id) — a known API inconsistency — BUT it ALSO returns the
  top-level `case.client_id` field which IS the actual Client profile PK.

**Workaround chosen:** the dialog's client Select is populated by fetching
`GET /api/cases?perPage=200` and extracting unique `(client_id, full_name,
email)` triples keyed by the top-level `client_id` field (the real Client
PK). The selected `client_id` is then sent to `POST /api/cases` and accepted
without error. End-to-end verified via curl: client list (3 unique clients
extracted from existing cases) → POST creates INF-202607-00004 → GET returns
1 timeline event → PUT changes status to active → final GET shows 2 timeline
events including the new `status_change` entry.

**Limitation:** if NO cases exist yet (e.g. a fresh seed), the Select shows
"No clients yet — convert a lead first (use the Leads view to convert an
intake submission into a client)." Brand-new clients without cases are not
selectable, because no API exposes their Client profile PK to the frontend.
A proper fix would be to extend `/api/crm/users` to also return
`client_profile.id` for users with role=client (out of scope per the brief —
"do NOT modify any API routes").

## Verification
1. `bun run lint` → 0 errors, 0 warnings (entire project).
2. `npx tsc --noEmit | grep CasesView` → 0 errors.
3. Homepage loads: `curl http://127.0.0.1:3000/` → HTTP 200.
4. End-to-end API flow (curl as tidimalo@infinitylegal.org):
   - GET /api/cases?perPage=200 → 3 cases, 1 unique client_id extracted.
   - POST /api/cases → 201 Created, case_ref `INF-202607-00004`.
   - GET /api/cases/[id] → case + 1 timeline event (`CASE_CREATED`).
   - PUT /api/cases/[id] { status: 'active' } → 200, status updated.
   - GET /api/cases/[id] → 2 timeline events (added `status_change`).

## Constraints honoured
- Did NOT modify LeadsView.tsx, ConsultationsView.tsx, DashboardShell.tsx,
  any API route, any prisma schema, or any lib file.
- Used only existing shadcn/ui components: Dialog, Sheet, Select, Input,
  Textarea, Button, Badge, Label, Card, Tabs, Skeleton, Tooltip.
- Imported `clientTrack` from `@/lib/posthog-client` (NOT posthog.ts).
- Brand palette navy/gold only — no indigo/blue.
- Mobile-first responsive (Sheet `w-full sm:max-w-2xl`, TabsList scrolls
  horizontally on mobile, mobile card layout uses `<button>` rows).
