# Task 4-a: Fix audit.ts to Match Supabase Schema

## Summary
Fixed 4 schema mismatches in `src/lib/audit.ts` and updated all callers.

## Changes Made

### `src/lib/audit.ts`
1. **`logConsent()` — removed `purpose` field**: consent_logs table has no `purpose` column. Removed from function signature and insert object.
2. **`logError()` — renamed `url` to `request_path`**: error_logs table uses `request_path` not `url`. Updated params and insert.
3. **`createAuditLog()` — changed `details` from `string` to `Record<string, unknown>`**: audit_logs.details is JSONB, not TEXT.
4. **Consent type — added `ConsentType` union, fixed `popia_general` → `popi_act`**: Added exported type matching CHECK constraint; changed invalid `popia_general` to `popi_act`.
5. **Bonus**: Changed `metadata` in `logError()` from `string` to `Record<string, unknown>` (also JSONB). Added `version` field to `logConsent()`.

### Caller fixes
- `src/app/api/contact/route.ts` — removed `purpose` from logConsent call
- `src/app/api/auth/signup/route.ts` — removed `purpose`, changed `'popia_general'` → `'popi_act'`
- `src/app/api/consultations/[id]/route.ts` — changed `details` from string to JSONB objects

## Verification
- Lint passes with zero errors
