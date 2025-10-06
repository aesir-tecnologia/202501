# Quickstart: Dashboard Project Management

**Feature**: Dashboard Project Management
**Branch**: 001-create-and-manage
**Date**: 2025-10-04

This document provides a step-by-step guide to verify the feature implementation against the specification requirements.

---

## Prerequisites

- [ ] Database migration applied (`[timestamp]_add_project_sort_order.sql`)
- [ ] Types regenerated (`npm run supabase:types`)
- [ ] Dependencies installed (if any new packages added)
- [ ] Tests pass (`npm run test:run`)
- [ ] Lint passes (`npm run lint`)
- [ ] Build succeeds (`npm run generate`)

---

## Test Scenarios

### Scenario 1: Create a New Project (FR-001 to FR-015)

**Objective**: Verify project creation via modal with validation

**Steps**:
1. Navigate to `/dashboard`
2. Locate and click "Create Project" button/action
3. **Verify**: Modal appears with project creation form
4. **Verify**: Form fields visible: name, expected daily stints, custom stint duration
5. Enter project name: "Client Alpha"
6. Set expected daily stints: 4
7. Set custom stint duration: 60
8. Click "Save" or equivalent submit action
9. **Verify**: Modal closes
10. **Verify**: New project "Client Alpha" appears in project list
11. **Verify**: Project shows: name="Client Alpha", daily goal=4, duration=60 minutes
12. **Verify**: Project appears at the bottom (end) of the list

**Success Criteria**:
- ✅ Modal displays on create action
- ✅ Form accepts valid input
- ✅ Project created and visible immediately
- ✅ Project data matches input
- ✅ New project positioned at end of list

---

### Scenario 2: Duplicate Name Validation (FR-011, FR-012)

**Objective**: Verify case-insensitive duplicate name prevention

**Steps**:
1. With "Client Alpha" already created from Scenario 1
2. Click "Create Project" button
3. Enter project name: "client alpha" (lowercase)
4. Attempt to save
5. **Verify**: Validation error displayed inline (modal stays open)
6. **Verify**: Error message: "A project with this name already exists" or similar
7. Change name to: "Client Beta"
8. Save
9. **Verify**: Modal closes, project created successfully

**Success Criteria**:
- ✅ Duplicate name (case-insensitive) rejected
- ✅ Error message shown inline
- ✅ Modal remains open after validation error
- ✅ Unique name allows successful creation

---

### Scenario 3: Form Validation (FR-006 to FR-009)

**Objective**: Verify field validation rules

**Steps**:
1. Click "Create Project"
2. Leave name field empty
3. Attempt to save
4. **Verify**: Validation error for name field
5. Enter name: "A" (valid)
6. Set expected daily stints: 0 (invalid)
7. Attempt to save
8. **Verify**: Validation error for daily stints (must be positive)
9. Set daily stints: 3 (valid)
10. Set custom stint duration: -5 (invalid)
11. Attempt to save
12. **Verify**: Validation error for stint duration (must be positive)
13. Set stint duration: 45 (valid)
14. Save
15. **Verify**: Project created successfully

**Success Criteria**:
- ✅ Empty name rejected
- ✅ Zero or negative daily stints rejected
- ✅ Negative stint duration rejected
- ✅ Valid inputs accepted
- ✅ Errors shown inline without closing modal

---

### Scenario 4: Edit Existing Project (FR-024 to FR-032)

**Objective**: Verify project editing with validation

**Steps**:
1. From project list, click "Edit" on "Client Alpha" project
2. **Verify**: Modal appears with form pre-filled with current values
3. **Verify**: Name="Client Alpha", daily stints=4, duration=60
4. Change name to: "Client Alpha Updated"
5. Save
6. **Verify**: Modal closes
7. **Verify**: Project name updated to "Client Alpha Updated" in list
8. **Verify**: Project position in list unchanged
9. Click "Edit" on same project
10. Attempt to change name to: "Client Beta" (existing project)
11. **Verify**: Validation error (duplicate name)
12. Revert name to: "Client Alpha Updated"
13. Save
14. **Verify**: Update succeeds

**Success Criteria**:
- ✅ Edit modal pre-fills current values
- ✅ Updates reflected immediately in list
- ✅ Project position preserved after edit
- ✅ Duplicate name validation applies to edits
- ✅ Current name allowed (not treated as duplicate)

---

### Scenario 5: Project Reordering (FR-020 to FR-023)

**Objective**: Verify drag-and-drop reordering

**Steps**:
1. Ensure at least 3 projects exist in list
2. Note initial order (e.g., Alpha, Beta, Gamma)
3. Drag "Beta" project to top of list
4. Drop
5. **Verify**: List immediately reorders to Beta, Alpha, Gamma
6. **Verify**: Visual feedback during drag (dragged item indicator)
7. Refresh page (`Cmd+R` or `F5`)
8. **Verify**: Order persisted (still Beta, Alpha, Gamma)

**Success Criteria**:
- ✅ Drag-and-drop interface functional
- ✅ Visual feedback during drag
- ✅ List updates immediately on drop
- ✅ Order persisted across page reload

---

### Scenario 6: Delete Project (FR-033 to FR-040)

**Objective**: Verify project deletion with confirmation and cascade

**Steps**:
1. Create test project: "Test Delete"
2. Create a stint for "Test Delete" project (via existing stint UI)
3. Complete the stint (set end_time)
4. Click "Delete" on "Test Delete" project
5. **Verify**: Confirmation modal appears
6. **Verify**: Warning message mentions permanent deletion of stint history
7. Click "Cancel"
8. **Verify**: Modal closes, project still in list
9. Click "Delete" again
10. Click "Confirm" (or equivalent)
11. **Verify**: Modal closes
12. **Verify**: "Test Delete" project removed from list immediately
13. Check database (via Supabase dashboard or query):
    - Project deleted
    - Associated stint deleted (cascade)

**Success Criteria**:
- ✅ Confirmation modal shown before delete
- ✅ Warning about stint data loss displayed
- ✅ Cancel aborts deletion
- ✅ Confirm removes project from list
- ✅ Database cascade deletes stints

---

### Scenario 7: Active Stint Deletion Protection (FR-037, FR-038)

**Objective**: Verify deletion blocked when active stint exists

**Steps**:
1. Create project: "Active Project"
2. Start a stint for "Active Project" (via existing stint UI)
3. Leave stint running (do not stop/complete it)
4. Attempt to delete "Active Project"
5. **Verify**: Error message displayed
6. **Verify**: Message instructs to stop stint first
7. **Verify**: Project NOT deleted, still in list
8. Stop the active stint
9. Attempt to delete "Active Project" again
10. **Verify**: Confirmation modal appears (no blocking error)
11. Confirm deletion
12. **Verify**: Project deleted successfully

**Success Criteria**:
- ✅ Deletion blocked when active stint exists
- ✅ Clear error message with instruction
- ✅ Project remains in list after blocked deletion
- ✅ Deletion succeeds after stopping stint

---

### Scenario 8: Soft Limit Warning (FR-014, FR-015, FR-047, FR-048)

**Objective**: Verify warning at 20+ projects (non-blocking)

**Steps**:
1. Create projects until total count = 19
2. Create 20th project
3. **Verify**: No warning shown (at threshold, not over)
4. Create 21st project
5. **Verify**: Warning message appears
6. **Verify**: Warning recommends reviewing/consolidating projects
7. **Verify**: Warning does NOT block creation
8. **Verify**: 21st project created successfully
9. Create 22nd project
10. **Verify**: System continues to function (no technical failure)

**Success Criteria**:
- ✅ Warning shown at 21+ projects
- ✅ Warning is informational, not blocking
- ✅ System supports >20 projects technically

---

### Scenario 9: Optimistic UI Updates (FR-044, FR-045)

**Objective**: Verify immediate UI updates with rollback on error

**Steps**:
1. **Setup**: Simulate network latency (browser DevTools Network > Slow 3G)
2. Create new project: "Optimistic Test"
3. **Verify**: Project appears in list immediately (before network completes)
4. Wait for network request to complete
5. **Verify**: Project remains in list (request succeeded)
6. **Setup**: Disconnect network (DevTools > Offline)
7. Attempt to create project: "Offline Test"
8. **Verify**: Project appears in list immediately
9. Wait for request to fail
10. **Verify**: "Offline Test" removed from list (rollback)
11. **Verify**: Error message displayed to user
12. Reconnect network
13. Attempt same creation again
14. **Verify**: Creation succeeds

**Success Criteria**:
- ✅ UI updates immediately (optimistic)
- ✅ Changes persist if request succeeds
- ✅ Changes rollback if request fails
- ✅ Error message shown on failure

---

### Scenario 10: Close Modal Without Saving (Edge Case)

**Objective**: Verify modal close discards unsaved changes

**Steps**:
1. Click "Create Project"
2. Enter name: "Unsaved Project"
3. Press `Escape` key (or click outside modal)
4. **Verify**: Modal closes
5. **Verify**: "Unsaved Project" NOT in project list
6. Click "Edit" on existing project
7. Change name to: "Unsaved Edit"
8. Press `Escape` key
9. **Verify**: Modal closes
10. **Verify**: Original name unchanged in list

**Success Criteria**:
- ✅ `Escape` key closes modal
- ✅ Click outside modal closes modal (if UModal configured)
- ✅ Unsaved changes discarded

---

### Scenario 11: Network Error Handling (Edge Case)

**Objective**: Verify user-friendly error messages on network failures

**Steps**:
1. **Setup**: Disconnect network (DevTools > Offline)
2. Attempt to create project: "Network Error Test"
3. **Verify**: User-friendly error message displayed (not raw error)
4. **Verify**: Error message actionable (e.g., "Check your connection")
5. Reconnect network
6. Retry creation
7. **Verify**: Creation succeeds

**Success Criteria**:
- ✅ Network errors caught and transformed
- ✅ User-friendly error messages
- ✅ No console errors exposed to user

---

## Performance Validation

### Load Time (FR-046)

**Test**:
1. Clear browser cache
2. Open DevTools > Network
3. Set throttling to "Slow 3G"
4. Navigate to `/dashboard`
5. Measure time from navigation to "projects list visible"

**Acceptance**: ≤1 second on 3G

---

### Bundle Size (Constitution Principle V)

**Test**:
1. Run `npm run generate`
2. Check bundle size in `.output/public/_nuxt/`
3. Compare to previous build (before feature)

**Acceptance**: Bundle increase ≤50KB (estimated ~20KB for feature)

---

## Accessibility Validation

**Manual Checks**:
- [ ] Tab navigation works through modals and forms
- [ ] `Escape` key closes modals
- [ ] Screen reader announces modal open/close
- [ ] Form validation errors announced
- [ ] Drag-and-drop has keyboard alternative (optional, nice-to-have)

---

## Automated Test Validation

**Run Tests**:
```bash
npm run test:run
```

**Required Passing Tests**:
- [ ] `tests/database/project-rls.test.ts` — All RLS policies
- [ ] `tests/database/project-constraints.test.ts` — Duplicate names, active stint check
- [ ] `tests/composables/useProjectMutations.test.ts` — Optimistic updates, rollback
- [ ] `tests/components/ProjectCreateModal.test.ts` — Modal behavior
- [ ] `tests/components/ProjectEditModal.test.ts` — Edit flow
- [ ] `tests/components/ProjectForm.test.ts` — Validation

**Coverage Target**: ≥80% per layer

---

## Deployment Validation

**Pre-Deployment Checklist**:
- [ ] `npm run lint` passes
- [ ] `npm run test:run` passes
- [ ] `npm run generate` succeeds
- [ ] `npm run serve` — Preview static site locally
- [ ] Test auth flows on preview (login, protected routes)
- [ ] Test all scenarios on preview
- [ ] Lighthouse audit: Performance ≥90

**Post-Deployment**:
- [ ] Verify feature on production URL
- [ ] Verify database migration applied on production
- [ ] Smoke test: Create, edit, delete project on production

---

## Rollback Plan

If critical issues found post-deployment:

1. **Immediate**: Revert deployment to previous version
2. **Database**: Run rollback migration to remove `sort_order` column (if needed)
3. **Communication**: Notify stakeholders of rollback
4. **Fix**: Address issues on feature branch
5. **Re-deploy**: After validation via quickstart

**Rollback Migration**:
```sql
-- Only if necessary
DROP INDEX IF EXISTS projects_name_user_id_lower_idx;
DROP INDEX IF EXISTS projects_user_id_sort_order_idx;
ALTER TABLE projects DROP COLUMN IF EXISTS sort_order;
```

---

**Quickstart Status**: ✅ Complete — Ready for `/tasks` command
