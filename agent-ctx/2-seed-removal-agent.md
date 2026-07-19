# Task 2 — full-stack-developer (seed-removal)

**Task:** Remove all simulated/seed data from the platform.

## What I changed
- **Only** edited `/home/z/my-project/prisma/seed.ts`. No other files were touched (no schema changes, no lib / component / API changes).

## What the new seed.ts does
1. Creates / updates the 3 real pricing plans with identical data and slugs as before:
   - `civil_legal_plan` (R99/mo)
   - `labour_legal_plan` (R99/mo, `is_popular`)
   - `extensive_plan` (R139/mo)
2. Runs the slug-migration cleanup block (maps legacy `civil-legal`, `labour-legal`, `extensive-cover` to the canonical slugs and removes the old plan rows).
3. Creates / updates ONE bootstrap managing_director admin only:
   - `tidimalo@infinitylegal.org` / `Tidimalo@2025!`
   - full_name `Tidimalo Tsatsi`, role `managing_director`, department `management`, practice_number `NP/2019/0001`, bar_admission_date `2010-06-15`, specialization `["corporate_commercial","civil_litigation","labour_law"]`, is_active / email_verified / popi_consent = true, password_expires_at +90 days, last_password_change = now.
   - Password hashed with bcryptjs SALT_ROUNDS=12 — matches `src/lib/local-auth.ts`.
4. Creates a single POPIA consent log for that bootstrap admin only (the old per-user loop is gone).
5. Updated the header comment + final console summary to reflect the new purpose and only show the single bootstrap credential.

## What was removed
- Staff users `brian@infinitylegal.org` and `tshepo@infinitylegal.org`.
- Fake client users `thabo@example.com` and `sarah@example.com`, their `Client` profiles, `Case` rows, and `UserSubscription` rows.
- The per-user POPIA consent-log loop that created a log for every user in the DB.

## DB reset + reseed commands run
```bash
cd /home/z/my-project
bunx prisma db push --force-reset --accept-data-loss   # wiped + recreated schema (Prisma Client auto-regenerated)
bunx tsx prisma/seed.ts                                 # ran new seed
```

## Seed output
```
🌱 Seeding Infinity Legal ZA database...

✅ Created plan: Civil Legal Plan (R99/mo)
✅ Created plan: Labour Legal Plan (R99/mo)
✅ Created plan: Extensive Plan (R139/mo)
✅ Created bootstrap admin: Tidimalo Tsatsi (managing_director)
✅ Created POPIA consent log for bootstrap admin

🎉 Seeding complete!
... (bootstrap credential box) ...
🧹 All simulated client / case / staff data has been removed.
```

## DB row counts after reseed (verified directly via Prisma)
| Table             | Count |
|-------------------|-------|
| pricingPlan       | 3     |
| user              | 1     |
| client            | 0     |
| case              | 0     |
| userSubscription  | 0     |
| consentLog        | 1     |

The single user row:
```json
{ "email": "tidimalo@infinitylegal.org", "role": "managing_director", "full_name": "Tidimalo Tsatsi" }
```

## Platform verification
- Dev server was started with `nohup bun run dev > /home/z/my-project/dev.log 2>&1 & disown` and polled until port 3000 returned non-000. (The sandbox reaps the dev server when the launching shell exits — that's expected; I tested within the same command that launched it.)
- `curl http://localhost:3000/` → **HTTP 200**, 42 KB of valid HTML, title "Infinity Legal | South Africa's Premier Legal Services Platform".
- Login test:
  ```bash
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -H "Origin: http://localhost:3000" \
    -d '{"email":"tidimalo@infinitylegal.org","password":"Tidimalo@2025!"}'
  ```
  → **HTTP 200**, response:
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....",
      "authProvider": "local",
      "user": {
        "id": "fc45ff3c-25e8-403d-8b22-99b2b4aac024",
        "email": "tidimalo@infinitylegal.org",
        "full_name": "Tidimalo Tsatsi",
        "role": "managing_director",
        "email_verified": true
      }
    }
  }
  ```
  No CSRF/403 quirk was encountered once the `Origin` header was supplied. (`/api/auth/` paths are CSRF-skipped when no Origin/Referer is present, but supplying `Origin: http://localhost:3000` makes it a clean pass either way.)

## Notes for next agent
- The bootstrap admin (`tidimalo@infinitylegal.org` / `Tidimalo@2025!`) exists ONLY so the platform stays accessible when Clerk auth keys are absent. Once Clerk is enabled, this user should be deleted and users managed in Clerk's dashboard.
- Plan slugs MUST remain `civil_legal_plan`, `labour_legal_plan`, `extensive_plan` — they match `PricingView.tsx` `PLAN_STYLES` keys.
- The DB file lives at `/home/z/my-project/db/custom.db` (per `.env` `DATABASE_URL=file:/home/z/my-project/db/custom.db`). A `prisma db push --force-reset` was run, so the file was recreated from scratch.
- The dev server process does not survive the shell command that launched it in this sandbox — when re-testing, launch + test in the same command and poll until port 3000 returns non-000.
