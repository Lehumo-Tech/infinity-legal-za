# Task 2-b: Fix All Remaining API Routes to Match Supabase Schema

## Agent: schema-fixer

## Summary
Fixed 16 API route files with 80+ individual schema mismatches to align with the deployed Supabase schema defined in `supabase/migrations/000_complete_schema.sql`.

## Files Modified
1. `src/app/api/cases/route.ts` — Full rewrite of GET/POST handlers
2. `src/app/api/cases/[id]/route.ts` — Full rewrite of GET/PUT/DELETE handlers
3. `src/app/api/leads/route.ts` — Full rewrite of GET/POST handlers
4. `src/app/api/leads/[id]/route.ts` — Full rewrite of GET/PUT/DELETE handlers
5. `src/app/api/tasks/route.ts` — Full rewrite of GET/POST handlers
6. `src/app/api/tasks/[id]/route.ts` — Full rewrite of GET/PUT/DELETE handlers
7. `src/app/api/documents/route.ts` — Full rewrite of GET handler
8. `src/app/api/documents/[id]/route.ts` — Full rewrite of GET/PUT/DELETE handlers
9. `src/app/api/consultations/route.ts` — Full rewrite of GET/POST handlers
10. `src/app/api/consultations/[id]/route.ts` — Full rewrite of GET/PUT/DELETE handlers
11. `src/app/api/staff/route.ts` — Full rewrite of GET handler
12. `src/app/api/management/route.ts` — Full rewrite of GET handler
13. `src/app/api/hr/route.ts` — Full rewrite of GET handler
14. `src/app/api/paralegal/route.ts` — Full rewrite from Prisma-style to Supabase-style
15. `src/app/api/sales/route.ts` — Full rewrite of GET handler
16. `src/app/api/payfast/checkout/route.ts` — Fixed profiles PK and payment_records columns
17. `src/app/api/payfast/notify/route.ts` — Full rewrite of payment processing
18. `src/app/api/subscriptions/route.ts` — Fixed payment_records column names
19. `src/app/api/contact/route.ts` — Changed to crm_contact_messages table

## Key Schema Corrections
- `matter_number` → `case_ref` (cases table)
- `lead_attorney_id` → `attorney_id` FK to `attorneys(id)` (cases table)
- `name` → `first_name, last_name` (leads table)
- `assigned_paralegal_id`/`assigned_officer_id` → `assigned_to` (leads table)
- `workflow_status` → `status` (documents table)
- `prepared_by` → `uploaded_by` (documents table)
- `scheduled_date`/`scheduled_time` → `scheduled_at` (consultations table)
- `completed_date` → `completed_at` (tasks table)
- Profiles PK is `id` (not `user_id`)
- Removed non-existent columns: urgency, is_high_risk, department, is_active, supervisor_id, hire_date, is_locked, locked_by, approved_by, signed_by, supervising_officer, related_id, sla_deadline, first_contact_date
- All enum CHECK constraint values validated against schema

## Status
✅ Complete — Lint passes with zero errors
