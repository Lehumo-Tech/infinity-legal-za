# Task 2: Mobile Responsiveness Fixes for HomePageClient.tsx

## Summary
Applied 15 comprehensive mobile responsiveness fixes to `/home/z/my-project/src/components/HomePageClient.tsx`.

## Changes Made

### 1. Mobile Sidebar Drawer
- Changed aside element from `flex` to `hidden md:flex` to hide on mobile
- Added `<Sheet>` mobile drawer component after `</aside>` with:
  - Left-side navigation matching the desktop sidebar content
  - Always-expanded layout (no collapse toggle)
  - Auto-close on nav item click via `setMobileMenuOpen(false)`
  - Logo area, nav groups, homepage button, user profile section
  - Accessible with `SheetTitle` and `SheetDescription` (sr-only)

### 2. Header Hamburger + Padding
- Changed `px-6` to `px-3 sm:px-6` for mobile padding
- Added hamburger `<Menu>` button as first child in header left div
  - Only visible on mobile: `md:hidden`
  - Opens mobile sidebar: `setMobileMenuOpen(true)`

### 3. Notification Dropdown Responsive
- Changed `w-80` to `w-80 max-w-[calc(100vw-2rem)]` to prevent overflow on small screens

### 4. Content Area Padding
- Changed `p-6` to `p-4 sm:p-6` for reduced padding on mobile

### 5. Footer Responsive
- Changed from `flex items-center justify-between` to `flex flex-col sm:flex-row items-center justify-between gap-2`
- Ensures footer content stacks on mobile and sits side-by-side on desktop

### 6. Role Display — displayRole() Function
Replaced all inline `role?.replace(/_/g, ' ')` patterns with the existing `displayRole()` function:
- Sidebar profile section: `user?.role?.replace(/_/g, ' ')` → `displayRole(user?.role)`
- Header user menu: `user?.role?.replace(/_/g, ' ')` → `displayRole(user?.role)`
- Welcome banner badge: `role.replace(/_/g, ' ').replace(/\b\w/g, ...)` → `displayRole(role)`
- StaffPortal filter pills: `roleLabels[r] || r.replace(/_/g, ' ')` → `displayRole(r)`
- StaffPortal group headings: `roleLabels[group] || group.replace(/_/g, ' ')` → `displayRole(group)`
- StaffPortal member cards: `roleLabels[m.role] || m.role.replace(/_/g, ' ')` → `displayRole(m.role)`
- OrgChart member cards: `roleLabels[m.role] || m.role.replace(/_/g, ' ')` → `displayRole(m.role)`
- Task create dialog staff select: `s.role.replace(/_/g, ' ')` → `displayRole(s.role)`

### 7. Chat Popup Height Fix
- Changed `style={{ height: '520px' }}` to `style={{ maxHeight: '70vh' }}`
- Added `h-[520px] sm:h-auto` classes for responsive sizing

### 8. Dialog Grid Responsive (8 instances)
Changed all `grid grid-cols-2 gap-4` inside DialogContent blocks to `grid grid-cols-1 sm:grid-cols-2 gap-4`:
- New Case dialog (Case Type + Urgency)
- New Case dialog (Opposing Party + Court Name)
- Upload Document dialog (Document Type + Case ID)
- Schedule Consultation dialog (Client Name + Email)
- Schedule Consultation dialog (Attorney/Legal Advisor + Meeting Type)
- Schedule Consultation dialog (Date & Time + Duration)
- Create Task dialog (Assign To + Priority)
- Create Task dialog (Due Date + Case ID)

### 9. CasesView Inline Table Responsive
- Filter bar: `flex items-center gap-3` → `flex flex-col sm:flex-row items-stretch sm:items-center gap-3`
- Status filter: `w-40` → `w-full sm:w-40`
- Table overflow: `-mx-6` → `-mx-4 sm:-mx-6`

### 10. ConsultationsView — Attorney → Legal Advisor
- Label: `Attorney` → `Legal Advisor`
- Select placeholder: `Select attorney` → `Select legal advisor`
- Fallback text: `'Attorney'` → `'Legal Advisor'`

### 11. StaffPortal — Attorney → Legal Advisor
- roleLabels: `attorney: 'Attorney'` → `attorney: 'Legal Advisor'`
- Badge CSS class kept as-is: `attorney: 'badge-status badge-pending'`

### 12. Welcome Banner Mobile Stats
- Added mobile stats section after the desktop `hidden md:flex` stats div
- Shows `MiniStat` components for "Active" and "Tasks" on mobile (`flex md:hidden`)

### 13. OrgChart — Attorney → Legal Advisor
- roleLabels: `attorney: 'Attorney'` → `attorney: 'Legal Advisor'`

### 14. Analytics Grid Breakpoints
- Changed `grid-cols-1 lg:grid-cols-2` to `grid-cols-1 md:grid-cols-2` (2 instances)
- Changed `grid-cols-1 lg:grid-cols-2 gap-4` in consultations to `grid-cols-1 md:grid-cols-2 gap-4`

### 15. Consultations Header Buttons — flex-wrap
- Added `flex-wrap` to the buttons container in Consultations header

## Lint Result
✅ `bun run lint` passed with no errors

## Dev Server
✅ Running correctly on port 3000
