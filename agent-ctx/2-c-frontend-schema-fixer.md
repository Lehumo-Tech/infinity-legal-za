# Task 2-c: Fix Frontend Component Type Mismatches with Supabase Schema

## Work Log

### Files Fixed

1. **`src/components/types.ts`** — Shared type definitions updated:
   - `UserRole`: Replaced 16-role union with schema-valid 6-role union: `'managing_director' | 'admin' | 'attorney' | 'paralegal' | 'systems_admin' | 'client'`
   - `User`: Removed `department`, added `avatar_url`, `phone`
   - `Consultation`: Replaced `scheduled_date`/`scheduled_time` → `scheduled_at` (single timestamp); `case.matter_number` → `case.case_ref`
   - `DocumentItem`: `title` → `file_name`; `workflow_status` → `status`; `prepared_by` → `uploaded_by`; `prepared_by_user` → `uploaded_by_user`; added `file_path`; `case.matter_number` → `case.case_ref`
   - `TaskItem`: `completed_date` → `completed_at`
   - `StaffMember`: Removed `department`, `is_active`, `supervisor`; added `avatar_url`

2. **`src/components/HomePageClient.tsx`** — Main app component with inline types and display logic:
   - Updated all inline interfaces to match types.ts changes
   - `c.matter_number` → `c.case_ref` in CasesView
   - Removed urgency column and `urgencyColors` from CasesView
   - `c.scheduled_date`/`c.scheduled_time` → parsed `c.scheduled_at` in WorkbenchView and ConsultationsView
   - `doc.workflow_status` → `doc.status`, `doc.prepared_by_user` → `doc.uploaded_by_user`, `doc.title` → `doc.file_name` in DocumentsView
   - `m.is_active`, `m.supervisor`, `m.department` removed from StaffPortal
   - StaffPortal now groups by role instead of department
   - Case type color map updated from old keys (e.g., `family_law`) to schema keys (e.g., `family`)
   - Lead name display: `l.name` → `[l.first_name, l.last_name].filter(Boolean).join(' ') || l.name || '-'`
   - `disqualified` → `nurturing` in leads status arrays
   - `pending_review` → `review`, removed `settled` from case status colors
   - Consultation form: `scheduled_date`/`scheduled_time` → `scheduled_at` with `datetime-local` input
   - Attorney filter: now `s.role === 'attorney'` instead of role list check
   - Added `in_progress` status color for consultations
   - Navigation role checks updated to schema-valid roles
   - OrgChart hierarchy updated to schema-valid roles

3. **`src/components/CasesView.tsx`** — Cases listing:
   - `matter_number` → `case_ref` in table
   - Removed urgency column and `urgencyColors`
   - `pending_review` → `review`, removed `settled` from status colors
   - Table header "Matter #" → "Case Ref"
   - Reduced column count from 7 to 6

4. **`src/components/LeadsView.tsx`** — Leads listing:
   - `l.name` → `[l.first_name, l.last_name].filter(Boolean).join(' ') || l.name || '-'`
   - `disqualified` → `nurturing` in status arrays and colors
   - Pipeline status array updated

5. **`src/components/DocumentsView.tsx`** — Documents listing:
   - `workflow_status` → `status` in badge rendering and color map
   - `prepared_by_user` → `uploaded_by_user`
   - `doc.title` → `doc.file_name`
   - Status color map updated to schema values: `uploading|uploaded|reviewing|approved|rejected|archived`
   - Document type options updated to match schema: removed `pleading`, `opinion`, `memo`, `invoice`, `consent_form`; added `evidence`, `financial`, `medical`, `police_report`
   - Type icon map updated accordingly

6. **`src/components/ConsultationsView.tsx`** — Consultations listing:
   - Form: `scheduled_date`/`scheduled_time` → `scheduled_at` with `datetime-local` input
   - Display: parse `scheduled_at` timestamp for date+time
   - Attorney filter: `s.role === 'attorney'`
   - Added `in_progress` to status colors

7. **`src/components/TasksView.tsx`** — Tasks listing:
   - Removed `overdue` from `statusColors` (schema has no overdue status; overdue is calculated from `due_date`)

8. **`src/components/StaffPortal.tsx`** — Staff listing:
   - Removed department filter, kept role filter only
   - Removed `is_active` indicator and `supervisor` display
   - Group by role instead of department
   - Role labels/colors updated to schema-valid roles

9. **`src/components/WorkbenchView.tsx`** — Workbench dashboard:
   - `c.scheduled_date`/`c.scheduled_time` → parse `c.scheduled_at`
   - Case type color map updated from old keys to schema keys
   - Role checks updated to schema-valid roles

10. **`src/components/OrgChartView.tsx`** — Org chart:
    - Hierarchy updated to schema-valid roles only (4 tiers instead of 5)
    - Removed `supervisor` display
    - Role labels updated

## Stage Summary
- Fixed 10 frontend component files with 50+ individual schema mismatches
- All TypeScript interfaces now match the actual API response format (which matches the Supabase schema)
- All status value references updated to valid CHECK constraint values
- All FK field names corrected (e.g., `attorney_id` through attorneys table)
- Removed references to non-existent columns: `matter_number`, `urgency`, `workflow_status`, `prepared_by`, `scheduled_date`, `scheduled_time`, `completed_date`, `is_active`, `department`, `supervisor`, `title` (on documents)
- Lint passes with zero errors
