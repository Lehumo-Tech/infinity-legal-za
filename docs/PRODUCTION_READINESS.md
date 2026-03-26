# Infinity Legal Platform — Production Readiness Checklist

## Version: 2.0.0
## Date: March 2026
## Platform: Next.js 14 + Supabase + MongoDB

---

## 1. Database Migrations

### Supabase (PostgreSQL)
- Migration file: `/infinity-os-migration.sql`
- Run via Supabase Dashboard → SQL Editor
- Tables: `profiles` (extended), `cases` (extended), `documents` (workflow cols), `leads`, `privileged_notes`, `audit_logs`
- Verify: `GET /api/setup/migrate` returns status of all required tables/columns

### MongoDB
- Collections auto-created on first write (no migration needed)
- Collections: `notifications`, `case_timeline`, `case_notes`, `case_tasks`, `case_messages`, `case_metadata`, `calendar_events`, `invoices`, `hr_leaves`, `conversations`, `announcements`, `knowledge_articles`, `conflict_checks`, `document_templates`, `notification_preferences`, `error_logs`, `api_analytics`, `page_analytics`, `health_checks`
- Recommended indexes:
  ```javascript
  db.case_timeline.createIndex({ caseId: 1, createdAt: -1 })
  db.case_notes.createIndex({ caseId: 1, createdAt: -1 })
  db.case_tasks.createIndex({ caseId: 1, dueDate: 1 })
  db.case_messages.createIndex({ caseId: 1, createdAt: 1 })
  db.case_metadata.createIndex({ caseId: 1 }, { unique: true })
  db.notifications.createIndex({ userId: 1, createdAt: -1 })
  db.error_logs.createIndex({ timestamp: -1, severity: 1 })
  db.page_analytics.createIndex({ date: 1, page: 1 })
  db.api_analytics.createIndex({ timestamp: -1, endpoint: 1 })
  ```

---

## 2. Environment Variables

### Required (app will not start without these)
| Variable | Description |
|----------|-------------|
| `MONGO_URL` | MongoDB connection string |
| `DB_NAME` | Database name (e.g., `infinitylegal`) |
| `NEXT_PUBLIC_BASE_URL` | Public URL (e.g., `https://infinitylegal.org`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |

### Optional (features degrade gracefully without these)
| Variable | Description |
|----------|-------------|
| `BREVO_API_KEY` | Email sending via Brevo |
| `LLM_KEY` | AI features (intake analysis, document assist) |
| `KIMI_API_KEY` | Alternative AI model |
| `PAYFAST_MERCHANT_ID` | Payment processing (ON HOLD) |
| `PAYFAST_MERCHANT_KEY` | Payment processing (ON HOLD) |

### Validation
- `GET /api/health` checks all env vars on each request
- Startup validation in `/lib/env-validation.js`

---

## 3. SSL Certificate

- Managed by Kubernetes ingress controller (auto-renewal via cert-manager/Let's Encrypt)
- HSTS header configured: `max-age=31536000; includeSubDomains; preload`
- Force HTTPS via `upgrade-insecure-requests` in CSP
- Verify: `curl -I https://infinitylegal.org` → check for `Strict-Transport-Security` header

---

## 4. Backup Strategy

### Supabase (PostgreSQL)
- Automatic daily backups via Supabase Pro plan
- Point-in-time recovery available (last 7 days)
- Manual backup: Supabase Dashboard → Database → Backups
- Test restore: Create a new Supabase project from backup, verify data integrity

### MongoDB
- Recommended: Use `mongodump` for scheduled backups
  ```bash
  # Daily backup cron job
  mongodump --uri="$MONGO_URL" --db=infinitylegal --out=/backups/$(date +%Y%m%d)
  ```
- Store backups in secure cloud storage (AWS S3, Google Cloud Storage)
- Restore procedure:
  ```bash
  mongorestore --uri="$MONGO_URL" --db=infinitylegal /backups/20260326/infinitylegal
  ```
- Test: Restore to a test database monthly and verify collection counts match

### Backup Testing Frequency
- Automated: Weekly verification of backup file integrity
- Manual restore test: Monthly (document results)
- Full disaster recovery test: Quarterly

---

## 5. Monitoring & Alerting

### Health Check Endpoint
- `GET /api/health` — returns status of MongoDB, Supabase, environment, memory
- Configure uptime monitoring (e.g., UptimeRobot, Pingdom) to poll every 60 seconds
- Alert on: HTTP status ≠ 200, response time > 5s, two consecutive failures

### Error Monitoring
- Application errors logged to MongoDB `error_logs` collection
- Admin dashboard at `/portal/reports` shows error summaries
- Monitor `error_logs` collection for severity: 'critical' entries

### Alerting Thresholds
| Metric | Warning | Critical |
|--------|---------|----------|
| Health check | 1 failure | 2+ consecutive failures |
| Error rate | >10 errors/hour | >50 errors/hour |
| Response time | >3 seconds | >10 seconds |
| Memory usage | >400MB heap | >450MB heap |
| MongoDB latency | >500ms | >2000ms |

---

## 6. Analytics

- Privacy-compliant (POPIA/GDPR by design)
- No cookies, no IP tracking, no fingerprinting, no third-party scripts
- Page view tracking via `/api/analytics` POST endpoint
- Dashboard available at `GET /api/analytics` (authenticated)
- Data retained: 90 days (configurable)

---

## 7. SEO

- Meta tags: Title, description, OpenGraph, Twitter Cards on all public pages
- Structured data: JSON-LD Organization + LegalService schema on homepage
- `robots.txt`: Blocks `/api/`, `/portal/`, `/dashboard/`, AI crawlers
- `sitemap.xml`: Auto-generated with all public pages
- Canonical URLs via `metadataBase` in layout

---

## 8. Custom Error Pages

- `404 (Not Found)`: Custom branded page with navigation links
- `500 (Server Error)`: Custom error page with retry button
- Error boundary component wraps the app for graceful client-side error handling

---

## 9. Security

### Headers (via middleware.js)
- Content-Security-Policy (strict)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security (HSTS)
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=()

### RBAC
- 20+ roles with granular permissions
- All API endpoints enforce authentication + role checks
- Audit logging for sensitive operations

### Dependency Audit
- Run: `yarn audit` regularly
- Known: recharts lodash transitive vulnerability (moderate)
- Action: Monitor for recharts update that bumps lodash

---

## 10. Rollback Plan

### Code Rollback
1. All deployments via Emergent platform with version history
2. Use the platform's "Save to GitHub" feature for version control
3. Rollback steps:
   - Navigate to Emergent platform deployment history
   - Select previous working version
   - Click "Rollback" to redeploy
   - Verify: `GET /api/health` returns 200

### Database Rollback
1. **Supabase**: Use point-in-time recovery from Supabase dashboard
2. **MongoDB**: Restore from most recent backup (see Backup Strategy)
3. **Caution**: If schema changes were applied, ensure the rolled-back code is compatible

### Rollback Testing
- Test rollback procedure in staging before production deployment
- Document the exact time of each deployment for point-in-time recovery
- Keep previous version's env configuration documented

---

## 11. Staff Training & Documentation

### For Managing Director / Partners
- Portal overview: `/portal` dashboard with role-specific views
- Case management: Create cases, assign attorneys, track progress
- Approval workflows: Document approvals, leave requests, billing
- Reports: Cross-module analytics at `/portal/reports`

### For Legal Staff (Attorneys, Associates)
- Case workspace: Timeline, Notes, Tasks, Messages, Billing tabs
- Matter numbers: Auto-generated (IL-YYYY-NNNN)
- Prescription tracking: SA-specific prescription periods
- Knowledge base: Legal research at `/portal/knowledge`

### For Paralegals / Intake Agents
- Lead pipeline: Intake → Qualification → Assignment → Case Creation
- Document drafting: Create and submit documents for review
- Task management: View assigned tasks, update status

### For IT Administrators
- Staff onboarding: `/portal/staff` — create accounts with roles
- Audit logs: `/portal/audit` — review all system activity
- System health: `GET /api/health` — monitor service status
- Error monitoring: Check MongoDB `error_logs` collection

### Key Training Topics
1. Login and authentication (2FA recommended for production)
2. Navigation and role-based access
3. Case creation and management workflow
4. Document upload and approval process
5. Communication (messages, announcements)
6. Billing and invoicing
7. Calendar and scheduling
8. Reporting and analytics

---

## 12. UAT Checklist

- [ ] Managing Director signs off on all portal features
- [ ] Test case creation → assignment → timeline → closure flow
- [ ] Test document upload → review → approval → signing flow
- [ ] Test lead intake → qualification → conversion flow
- [ ] Test billing: invoice creation → sending → payment
- [ ] Test calendar: event creation, court date reminders
- [ ] Test messaging: internal and client communication
- [ ] Test all role-based access restrictions
- [ ] Verify mobile responsiveness
- [ ] Confirm email notifications working (requires Brevo key)
- [ ] Confirm AI features working (requires LLM key)
