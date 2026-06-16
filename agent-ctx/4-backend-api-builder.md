# Task 4 - Backend API Builder

## Task
Build backend API routes for consultations, documents, tasks, staff, notifications

## Files Created
1. `/home/z/my-project/src/app/api/consultations/route.ts` - GET (list with pagination/filtering) + POST (create with attorney role validation)
2. `/home/z/my-project/src/app/api/documents/upload/route.ts` - POST (file upload with formData, saves to uploads/documents/)
3. `/home/z/my-project/src/app/api/documents/route.ts` - GET (list with pagination/filtering)
4. `/home/z/my-project/src/app/api/tasks/route.ts` - GET (list with pagination/filtering) + POST (create with validation)
5. `/home/z/my-project/src/app/api/staff/route.ts` - GET (flat list or hierarchy view grouped by department)
6. `/home/z/my-project/src/app/api/notifications/route.ts` - GET (user's notifications) + PUT (mark as read)

## Key Patterns Used
- `requireAuth(request)` for authentication on all routes
- `getPaginationParams(request)` / `createPaginationResult()` for pagination
- `apiResponse()` / `apiError()` for standardized responses
- `createAuditLog()` from `@/lib/audit` for audit trail
- `db` from `@/lib/db` (Prisma client) for all database operations

## Important Details
- Document upload: max 10MB, saves to `/home/z/my-project/uploads/documents/` with timestamp-based unique names
- Consultation POST validates attorney has a legal role (managing_director, senior_partner, associate, legal_officer, supervising_officer, candidate_attorney, senior_consultant, consultant)
- Staff route excludes client/guest roles; supports `view=hierarchy` for department-grouped output with supervisor/supervisee relationships
- Notifications are user-scoped; PUT validates ownership before marking as read
- Task and Consultation creation generate notifications for assignees/attorneys

## Lint Status
0 errors on all new files
