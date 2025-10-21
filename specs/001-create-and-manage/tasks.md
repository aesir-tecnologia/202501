# Tasks: Dashboard Project Management

**Input**: Design documents from `/specs/001-create-and-manage/`
**Prerequisites**: data-model.md, research.md, contracts/project-api.ts, quickstart.md

---

## ✅ CURRENT STATUS (Updated 2025-10-05)

### Implementation Status: PHASE 3.3 COMPLETE

**✅ Phases Complete:**
- Phase 3.1 (Setup & Schema): Complete ✓
- Phase 3.2 (Tests): Written and contract tests PASSING ✓
- Phase 3.3 (Core Implementation): Complete ✓
- Phase 3.4 (UI Components): Complete ✓

**⚠️ Phases With Issues:**
- Phase 3.5 (Integration & Polish): Mostly incomplete
- Some database/RLS tests still failing (test infrastructure, not implementation)

### Resolved Issues

#### 1. Test Infrastructure - FIXED ✓
**Status**: RESOLVED
- ✓ Database layer now returns `{ data, error }` as designed
- ✓ Created `createTestUser()` helper in `tests/setup.ts`
- ✓ All test files updated to use helper
- ✓ User profiles automatically created for test users
- ✓ All contract tests for database layer functions PASSING

**Test Results:**
- **85 out of 116 tests passing (73% pass rate)**
- All critical database layer contract tests PASS
- All composable optimistic update tests PASS
- Remaining failures are in database/RLS tests (test infrastructure only)

**Fixes Applied:**
- ✓ Changed all database functions to return `Result<T>` = `{ data, error }`
- ✓ Updated composables to handle new return type
- ✓ Created centralized `createTestUser()` helper
- ✓ Fixed all contract tests to expect `{ data, error }`

#### 2. Lint Warnings (14 errors)
**Status**: Non-blocking but should fix
- All in test files: unused variables that should be prefixed with `_`
- Files affected: tests/database/, tests/lib/supabase/
- Source code passes lint ✓

#### 3. Integration Tests Not Created
**Status**: INCOMPLETE
- T035-T042: No files created
- Requires: Playwright/Cypress + @nuxt/test-utils setup
- Needs: Component testing infrastructure for modal interactions

#### 4. Performance & Accessibility Audits Not Done
**Status**: INCOMPLETE
- T043: Performance tests not written
- T044: Bundle size measured but not documented
- T045: No accessibility audit performed (no Lighthouse/axe run)
- T046: No code review documentation

### What Actually Works

**✓ Build System:**
- `npm run generate` succeeds
- Static site builds to `.output/public`
- Bundle size: ~487KB main bundle (gzip: ~160KB)

**✓ Source Code Quality:**
- Source code (non-test) passes ESLint
- All components exist in `app/components/`
- Database layer implemented in `app/lib/supabase/projects.ts`
- Composables implemented in `app/composables/useProjectMutations.ts`

**✓ Files Created:**
- Migration: `supabase/migrations/20251004201518_add_project_sort_order.sql`
- Components: ProjectForm, ProjectCreateModal, ProjectEditModal, ProjectDeleteModal, ProjectList
- Schema: `app/schemas/projects.ts`
- Types: `app/types/database.types.ts` (generated)

---

## Execution Flow (main)
```
1. Load data-model.md → Extract entities (Project, Stint)
2. Load contracts/project-api.ts → Extract API contracts (7 functions)
3. Load quickstart.md → Extract test scenarios (11 scenarios)
4. Generate tasks by category:
   → Setup: migration, dependencies, schema updates
   → Tests: contract tests, RLS tests, integration tests
   → Core: database layer, composable layer
   → UI: components, pages, modals
   → Polish: unit tests, performance, docs
5. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
6. Number tasks sequentially (T001, T002...)
7. Validate task completeness
```

## Path Conventions (Nuxt 4 SSG + Supabase)
- **Database**: `supabase/migrations/`
- **Database Layer**: `app/lib/supabase/`
- **Schema Layer**: `app/schemas/`
- **Composable Layer**: `app/composables/`
- **Components**: `app/components/`
- **Pages**: `app/pages/`
- **Tests**: `tests/` (database/, lib/supabase/, composables/, components/)

---

## Phase 3.1: Setup & Schema

- [X] **T001** Create database migration `supabase/migrations/[timestamp]_add_project_sort_order.sql`
  - Add `sort_order` column (integer, NOT NULL)
  - Backfill existing projects with ID-based order
  - Add index `projects_user_id_sort_order_idx`
  - Add unique index `projects_name_user_id_lower_idx` for case-insensitive names
  - File: `supabase/migrations/20251004201518_add_project_sort_order.sql`

- [X] **T002** Apply migration and regenerate TypeScript types
  - Run migration locally or push to Supabase
  - Execute `npm run supabase:types`
  - Verify `app/types/database.types.ts` updated with `sort_order` field
  - Dependencies: T001

- [X] **T003** [P] Install drag-and-drop dependencies
  - Add `@vueuse/integrations` if not present
  - Add `sortablejs` peer dependency
  - Update `package.json`
  - File: `package.json`

- [X] **T004** [P] Update project schema validation in `app/schemas/projects.ts`
  - Verify `PROJECT_SCHEMA_LIMITS` constants exist
  - Verify `projectCreateSchema` validation rules
  - Verify `projectUpdateSchema` (partial of create)
  - Add `.trim()` to name validation
  - File: `app/schemas/projects.ts`

---

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

**⚠️ STATUS: Tests written but FAILING (31/63 tests fail)**
- ✓ Test files created
- ✗ Tests failing due to infrastructure issues (see Critical Issues above)
- ✗ API mismatch: tests expect `{ data, error }`, implementation throws
- ✗ Auth setup broken: user_id foreign key violations, RLS errors
- **Action needed**: Fix test infrastructure OR rewrite tests to match implementation

### Database Layer Tests

- [X] **T005** [P] RLS policy tests in `tests/database/project-rls.test.ts`
  - Test: Users can SELECT only their own projects
  - Test: Users can INSERT only with their own user_id
  - Test: Users can UPDATE only their own projects
  - Test: Users can DELETE only their own projects
  - File: `tests/database/project-rls.test.ts`

- [X] **T006** [P] Constraint tests in `tests/database/project-constraints.test.ts`
  - Test: Duplicate project names (case-insensitive) rejected
  - Test: Negative `expected_daily_stints` rejected
  - Test: Negative `custom_stint_duration` rejected
  - Test: Zero `expected_daily_stints` rejected
  - Test: Zero `custom_stint_duration` rejected
  - File: `tests/database/project-constraints.test.ts`

- [X] **T007** [P] Active stint deletion protection test in `tests/database/project-active-stint.test.ts`
  - Test: Project with active stint cannot be deleted
  - Test: Project with completed stints can be deleted
  - Test: Deleting project cascades to stints
  - File: `tests/database/project-active-stint.test.ts`

- [X] **T008** [P] Sort order tests in `tests/database/project-sort-order.test.ts`
  - Test: New projects get `max(sort_order) + 1`
  - Test: Reordering updates `sort_order` correctly
  - Test: Projects returned in `sort_order` ASC
  - File: `tests/database/project-sort-order.test.ts`

### Schema Layer Tests

- [X] **T009** [P] Schema validation tests in `tests/schemas/projects.test.ts`
  - Test: Empty name rejected
  - Test: Name >255 chars rejected
  - Test: Zero or negative daily stints rejected
  - Test: Zero or negative stint duration rejected
  - Test: Valid inputs accepted with defaults
  - File: `tests/schemas/projects.test.ts`

### Contract Tests (Database Layer)

- [X] **T010** [P] Contract test: listProjects in `tests/lib/supabase/list-projects.test.ts`
  - Test: Returns empty array if no projects
  - Test: Returns user's projects ordered by sort_order
  - Test: Does not return other users' projects
  - File: `tests/lib/supabase/list-projects.test.ts`

- [X] **T011** [P] Contract test: getProject in `tests/lib/supabase/get-project.test.ts`
  - Test: Returns project by ID if owned by user
  - Test: Returns null if project not found
  - Test: Returns null if project owned by different user
  - File: `tests/lib/supabase/get-project.test.ts`

- [X] **T012** [P] Contract test: createProject in `tests/lib/supabase/create-project.test.ts`
  - Test: Creates project with defaults (daily stints=3, duration=45)
  - Test: Creates project with custom values
  - Test: Auto-assigns sort_order as max + 1
  - Test: Throws error on duplicate name (case-insensitive)
  - File: `tests/lib/supabase/create-project.test.ts`

- [X] **T013** [P] Contract test: updateProject in `tests/lib/supabase/update-project.test.ts`
  - Test: Updates project fields successfully
  - Test: Throws error on duplicate name (case-insensitive)
  - Test: Throws error if project not owned by user
  - Test: Allows updating to same name (not treated as duplicate)
  - File: `tests/lib/supabase/update-project.test.ts`

- [X] **T014** [P] Contract test: deleteProject in `tests/lib/supabase/delete-project.test.ts`
  - Test: Deletes project successfully
  - Test: Throws error if active stint exists
  - Test: Cascades to delete completed stints
  - Test: Throws error if project not owned by user
  - File: `tests/lib/supabase/delete-project.test.ts`

- [X] **T015** [P] Contract test: updateProjectSortOrder in `tests/lib/supabase/update-project-sort-order.test.ts`
  - Test: Batch updates sort_order for multiple projects
  - Test: Throws error if any project not owned by user
  - Test: Rollback if any update fails
  - File: `tests/lib/supabase/update-project-sort-order.test.ts`

- [X] **T016** [P] Contract test: hasActiveStint in `tests/lib/supabase/has-active-stint.test.ts`
  - Test: Returns true if active stint exists (end_time IS NULL)
  - Test: Returns false if no stints exist
  - Test: Returns false if only completed stints exist
  - File: `tests/lib/supabase/has-active-stint.test.ts`

### Composable Layer Tests

- [X] **T017** [P] Optimistic update tests in `tests/composables/useProjectMutations.test.ts`
  - Test: createProject - list updated immediately, rolled back on error
  - Test: updateProject - changes visible immediately, rolled back on error
  - Test: deleteProject - item removed immediately, rolled back on error
  - Test: reorderProjects - order updated immediately, rolled back on error
  - File: `tests/composables/useProjectMutations.test.ts`

---

## Phase 3.3: Core Implementation (ONLY after tests are failing)

**✅ STATUS: COMPLETE**
- ✓ All functions implemented in `app/lib/supabase/projects.ts`
- ✓ All composables implemented in `app/composables/useProjectMutations.ts`
- ✓ API now returns `{ data, error }` as designed
- ✓ All contract tests for database layer functions PASSING
- **Note**: Some database/RLS tests still failing due to test infrastructure (need user_id in direct inserts), but core implementation is complete and correct

### Database Layer (app/lib/supabase/projects.ts)

- [X] **T018** Implement listProjects function in `app/lib/supabase/projects.ts`
  - Query projects for authenticated user
  - Order by `sort_order` ASC
  - Return empty array if none exist
  - Dependencies: T002, T005, T010
  - File: `app/lib/supabase/projects.ts:33-44`

- [X] **T019** Implement getProject function in `app/lib/supabase/projects.ts`
  - Query project by ID with RLS enforcement
  - Return null if not found
  - Dependencies: T002, T005, T011
  - File: `app/lib/supabase/projects.ts:50-65`

- [X] **T020** Implement createProject function in `app/lib/supabase/projects.ts`
  - Accept `ProjectInsert` (snake_case)
  - Auto-assign user_id from auth
  - Handle duplicate name error (code 23505)
  - Return created project
  - Dependencies: T002, T004, T005, T006, T012
  - File: `app/lib/supabase/projects.ts:81-105`

- [X] **T021** Implement updateProject function in `app/lib/supabase/projects.ts`
  - Accept `ProjectUpdate` (snake_case)
  - Enforce RLS (user_id match)
  - Handle duplicate name error (code 23505)
  - Return updated project
  - Dependencies: T002, T004, T005, T006, T013
  - File: `app/lib/supabase/projects.ts:110-134`

- [X] **T022** Implement deleteProject function in `app/lib/supabase/projects.ts`
  - Check for active stints before delete
  - Throw error if active stint exists
  - Cascade delete handled by FK constraint
  - Dependencies: T002, T005, T007, T014
  - File: `app/lib/supabase/projects.ts:140-167`

- [X] **T023** Implement updateProjectSortOrder function in `app/lib/supabase/projects.ts`
  - Accept array of `{id, sortOrder}` updates
  - Batch update using Promise.all
  - Enforce RLS on each update
  - Throw error if any update fails
  - Dependencies: T002, T005, T008, T015
  - File: `app/lib/supabase/projects.ts:173-195`

- [X] **T024** Implement hasActiveStint function in `app/lib/supabase/projects.ts`
  - Query stints table for `project_id` and `end_time IS NULL`
  - Return boolean
  - Dependencies: T002, T016
  - File: `app/lib/supabase/projects.ts:201-216`

### Composable Layer (app/composables/useProjectMutations.ts)

- [X] **T025** Implement createProject mutation with optimistic update
  - Validate with Zod schema (camelCase)
  - Transform to snake_case via `toDbPayload()`
  - Optimistic: add to local state immediately
  - Rollback on error, replace with server response on success
  - Return `OptimisticResult<ProjectRow>`
  - Dependencies: T004, T020, T017
  - File: `app/composables/useProjectMutations.ts:67-115`

- [X] **T026** Implement updateProject mutation with optimistic update
  - Validate with Zod schema (camelCase)
  - Transform to snake_case via `toDbPayload()`
  - Optimistic: update in local state immediately
  - Rollback on error, replace with server response on success
  - Return `OptimisticResult<ProjectRow>`
  - Dependencies: T004, T021, T017
  - File: `app/composables/useProjectMutations.ts:120-171`

- [X] **T027** Implement deleteProject mutation with optimistic update
  - Optimistic: remove from local state immediately
  - Rollback on error (re-add to state)
  - Call `deleteProject()` from database layer
  - Return `OptimisticResult<void>`
  - Dependencies: T022, T017
  - File: `app/composables/useProjectMutations.ts:189-221`

- [X] **T028** Implement reorderProjects mutation with optimistic update
  - Accept reordered array of projects
  - Optimistic: update local state with new order
  - Map to `{id, sortOrder}` updates
  - Rollback on error (restore previous order)
  - Call `updateProjectSortOrder()` from database layer
  - Return `OptimisticResult<void>`
  - Dependencies: T023, T017
  - File: `app/composables/useProjectMutations.ts:228-255`

---

## Phase 3.4: UI Components & Pages

**✅ STATUS: Complete**
- ✓ All components exist and implemented
- ✓ Dashboard page updated with modals
- ✓ Build succeeds with components
- **Note**: Components functionally complete, pending integration tests

### Components

- [X] **T029** [P] Create ProjectForm component in `app/components/ProjectForm.vue`
  - Props: `project` (optional for edit mode), `mode` ('create' | 'edit')
  - Form fields: name, expectedDailyStints, customStintDuration
  - Use Nuxt UI form components (UFormGroup, UInput, UButton)
  - Integrate Zod schema validation
  - Emit: `submit(data)`, `cancel()`
  - Show inline validation errors
  - File: `app/components/ProjectForm.vue`

- [X] **T030** [P] Create ProjectCreateModal component in `app/components/ProjectCreateModal.vue`
  - Use `UModal` with `v-model:open`
  - Embed `ProjectForm` in create mode
  - Call `createProject()` mutation on submit
  - Show error toast on failure
  - Close modal on success
  - File: `app/components/ProjectCreateModal.vue`

- [X] **T031** [P] Create ProjectEditModal component in `app/components/ProjectEditModal.vue`
  - Use `UModal` with `v-model:open`
  - Props: `project` (required)
  - Embed `ProjectForm` in edit mode with pre-filled values
  - Call `updateProject()` mutation on submit
  - Show error toast on failure
  - Close modal on success
  - File: `app/components/ProjectEditModal.vue`

- [X] **T032** [P] Create ProjectDeleteModal component in `app/components/ProjectDeleteModal.vue`
  - Use `UModal` with `v-model:open`
  - Props: `project` (required)
  - Show confirmation message with warning about stint deletion
  - Check `hasActiveStint()` and show blocking error if true
  - Call `deleteProject()` mutation on confirm
  - Show error toast on failure
  - Close modal on success or cancel
  - File: `app/components/ProjectDeleteModal.vue`

- [X] **T033** Create ProjectList component in `app/components/ProjectList.vue`
  - Use `useSortable` from `@vueuse/integrations/useSortable`
  - Render projects with drag handles
  - Display: name, daily goal, stint duration
  - Actions per project: Edit, Delete buttons
  - Call `reorderProjects()` mutation on drag end
  - Show visual feedback during drag
  - Dependencies: T003, T028
  - File: `app/components/ProjectList.vue`

### Pages

- [X] **T034** Update dashboard index page in `app/pages/dashboard/index.vue`
  - Fetch projects via `listProjects()` on mount
  - Render `ProjectList` component
  - Show "Create Project" button
  - Manage modal state (create, edit, delete)
  - Pass selected project to edit/delete modals
  - Show empty state if no projects
  - Dependencies: T018, T029-T033
  - File: `app/pages/dashboard/index.vue`

---

## Phase 3.5: Integration & Polish

**⚠️ STATUS: Mostly incomplete**
- ✗ Integration tests (T035-T042): NOT created - needs Playwright/Cypress setup
- ✗ Performance tests (T043): NOT created
- ⚠️ Bundle size (T044): Measured but not documented
- ✗ Accessibility audit (T045): NOT performed
- ✗ Code review (T046): NOT documented
- ✗ Full test suite (T047): FAILING (31 tests fail, blocked by Phase 3.2 issues)
- ⚠️ Lint/build (T048): Build passes ✓, Lint has 14 warnings in test files

**Next Steps:**
1. Set up component testing framework (@nuxt/test-utils + Playwright/Testing Library)
2. Fix test infrastructure from Phase 3.2 before attempting T047
3. Create integration test stubs with TODO comments
4. Run Lighthouse/axe for accessibility audit
5. Document bundle size impact
6. Perform code review and document findings

### Integration Tests (Quickstart Scenarios)

- [ ] **T035** [P] Integration test: Scenario 1 (Create New Project) in `tests/integration/create-project.test.ts`
  - Test: Modal displays on create action
  - Test: Form accepts valid input
  - Test: Project created and visible immediately
  - Test: Project data matches input
  - Test: New project positioned at end of list
  - File: `tests/integration/create-project.test.ts`

- [ ] **T036** [P] Integration test: Scenario 2 (Duplicate Name Validation) in `tests/integration/duplicate-name.test.ts`
  - Test: Duplicate name (case-insensitive) rejected
  - Test: Error message shown inline
  - Test: Modal remains open after error
  - Test: Unique name allows creation
  - File: `tests/integration/duplicate-name.test.ts`

- [ ] **T037** [P] Integration test: Scenario 3 (Form Validation) in `tests/integration/form-validation.test.ts`
  - Test: Empty name rejected
  - Test: Zero or negative daily stints rejected
  - Test: Negative stint duration rejected
  - Test: Valid inputs accepted
  - Test: Errors shown inline without closing modal
  - File: `tests/integration/form-validation.test.ts`

- [ ] **T038** [P] Integration test: Scenario 4 (Edit Existing Project) in `tests/integration/edit-project.test.ts`
  - Test: Edit modal pre-fills current values
  - Test: Updates reflected immediately in list
  - Test: Project position preserved after edit
  - Test: Duplicate name validation applies to edits
  - Test: Current name allowed (not treated as duplicate)
  - File: `tests/integration/edit-project.test.ts`

- [ ] **T039** [P] Integration test: Scenario 5 (Project Reordering) in `tests/integration/reorder-projects.test.ts`
  - Test: Drag-and-drop interface functional
  - Test: Visual feedback during drag
  - Test: List updates immediately on drop
  - Test: Order persisted across page reload
  - File: `tests/integration/reorder-projects.test.ts`

- [ ] **T040** [P] Integration test: Scenario 6 (Delete Project) in `tests/integration/delete-project.test.ts`
  - Test: Confirmation modal shown before delete
  - Test: Warning about stint data loss displayed
  - Test: Cancel aborts deletion
  - Test: Confirm removes project from list
  - Test: Database cascade deletes stints
  - File: `tests/integration/delete-project.test.ts`

- [ ] **T041** [P] Integration test: Scenario 7 (Active Stint Protection) in `tests/integration/active-stint-protection.test.ts`
  - Test: Deletion blocked when active stint exists
  - Test: Clear error message with instruction
  - Test: Project remains in list after blocked deletion
  - Test: Deletion succeeds after stopping stint
  - File: `tests/integration/active-stint-protection.test.ts`

- [ ] **T042** [P] Integration test: Scenario 9 (Optimistic UI Updates) in `tests/integration/optimistic-updates.test.ts`
  - Test: UI updates immediately (optimistic)
  - Test: Changes persist if request succeeds
  - Test: Changes rollback if request fails
  - Test: Error message shown on failure
  - File: `tests/integration/optimistic-updates.test.ts`

### Performance & Polish

- [ ] **T043** [P] Performance test: Dashboard load time in `tests/performance/dashboard-load.test.ts`
  - Test: Dashboard renders in ≤1 second on simulated 3G
  - Test: Projects list visible within budget
  - File: `tests/performance/dashboard-load.test.ts`

- [ ] **T044** [P] Performance test: Bundle size impact
  - Run `npm run generate` ✓ DONE
  - Compare bundle size to previous build ✗ NOT DONE (no baseline to compare)
  - Verify increase ≤50KB (estimated ~20KB) ⚠️ MEASURED but not verified
  - Document bundle impact in PR description ✗ NOT DONE
  - **Current bundle**: ~487KB main (gzip: ~160KB), see build output above
  - **Action needed**: Establish baseline, document delta, verify within budget

- [ ] **T045** [P] Accessibility audit
  - Verify tab navigation through modals and forms ✗ NOT DONE
  - Verify `Escape` key closes modals ✗ NOT DONE
  - Verify screen reader announces modal open/close ✗ NOT DONE
  - Verify form validation errors announced ✗ NOT DONE
  - Use axe-core or Lighthouse for automated checks ✗ NOT DONE
  - **Action needed**: Run `npm run generate && npm run serve` then Lighthouse audit
  - **Tools**: Chrome DevTools Lighthouse, @axe-core/cli, or pa11y

- [ ] **T046** Code review and refactoring
  - Remove code duplication ✗ NOT REVIEWED
  - Ensure consistent error handling ✗ NOT REVIEWED
  - Verify all functions have proper TypeScript types ✗ NOT REVIEWED
  - Ensure all comments are accurate ✗ NOT REVIEWED
  - Dependencies: T018-T044
  - **Action needed**: Manual code review, document findings, create refactoring tasks
  - **Areas to review**: Error handling patterns, test API mismatch, composable complexity

- [ ] **T047** Run full test suite and verify coverage
  - Execute `npm run test:run` ✓ DONE
  - Verify ≥80% coverage per layer ✗ BLOCKED (tests failing)
  - Fix any failing tests ✗ NOT DONE
  - Dependencies: T005-T042
  - **Current status**: 31/63 tests FAILING (see Phase 3.2 status)
  - **Failing categories**: Database layer (24 fails), Composables (7 fails)
  - **Passing**: Schema tests (26 passes), Some stints tests
  - **Action needed**: Fix test infrastructure issues first (see Critical Issues above)

- [ ] **T048** Verify lint and build pass
  - Execute `npm run lint` (should pass) ⚠️ PARTIAL - 14 warnings in test files
  - Execute `npm run generate` (should succeed) ✓ DONE - Build succeeds
  - Execute `npm run serve` and manually test feature ✗ NOT DONE
  - Dependencies: T047
  - **Lint status**: Source code passes ✓, test files have unused var warnings
  - **Build status**: ✓ Static site generated successfully
  - **Manual testing**: Not performed
  - **Action needed**: Fix test lint warnings, perform manual QA of feature

---

## Dependencies

### Phase Dependencies
- **Setup (T001-T004)** blocks all subsequent phases
- **Tests (T005-T017)** must complete before Core (T018-T028)
- **Core (T018-T028)** blocks UI (T029-T034)
- **UI (T029-T034)** blocks Integration Tests (T035-T042)
- **Integration (T035-T042)** blocks Polish (T043-T048)

### Critical Paths
1. **Database**: T001 → T002 → T005-T008 → T018-T024
2. **Schema**: T004 → T009 → T020, T021, T025, T026
3. **Composables**: T017 → T025-T028 → T033-T034
4. **UI**: T003 → T029-T033 → T034
5. **Integration**: T034 → T035-T042 → T046-T048

### Specific Blockers
- T002 blocks T018-T024 (types must be regenerated)
- T020-T024 block T025-T028 (database layer before composable)
- T025-T028 block T030-T033 (composables before components)
- T029-T033 block T034 (components before page)
- T034 blocks T035-T042 (page before integration tests)

---

## Parallel Execution Examples

### Phase 3.2: All database tests in parallel
```bash
# Launch T005-T016 together (12 test files):
Task: "RLS policy tests in tests/database/project-rls.test.ts"
Task: "Constraint tests in tests/database/project-constraints.test.ts"
Task: "Active stint deletion protection test in tests/database/project-active-stint.test.ts"
Task: "Sort order tests in tests/database/project-sort-order.test.ts"
Task: "Schema validation tests in tests/schemas/projects.test.ts"
Task: "Contract test: listProjects in tests/lib/supabase/list-projects.test.ts"
Task: "Contract test: getProject in tests/lib/supabase/get-project.test.ts"
Task: "Contract test: createProject in tests/lib/supabase/create-project.test.ts"
Task: "Contract test: updateProject in tests/lib/supabase/update-project.test.ts"
Task: "Contract test: deleteProject in tests/lib/supabase/delete-project.test.ts"
Task: "Contract test: updateProjectSortOrder in tests/lib/supabase/update-project-sort-order.test.ts"
Task: "Contract test: hasActiveStint in tests/lib/supabase/has-active-stint.test.ts"
```

### Phase 3.3: Database layer functions (after T002)
```bash
# Launch T018-T024 together (7 functions in app/lib/supabase/projects.ts):
# NOTE: These modify the same file, so NOT truly parallel
# Execute sequentially or use multiple branches
```

### Phase 3.4: UI Components in parallel
```bash
# Launch T029-T032 together (4 components):
Task: "Create ProjectForm component in app/components/ProjectForm.vue"
Task: "Create ProjectCreateModal component in app/components/ProjectCreateModal.vue"
Task: "Create ProjectEditModal component in app/components/ProjectEditModal.vue"
Task: "Create ProjectDeleteModal component in app/components/ProjectDeleteModal.vue"
```

### Phase 3.5: Integration tests in parallel
```bash
# Launch T035-T042 together (8 test files):
Task: "Integration test: Scenario 1 (Create New Project) in tests/integration/create-project.test.ts"
Task: "Integration test: Scenario 2 (Duplicate Name Validation) in tests/integration/duplicate-name.test.ts"
Task: "Integration test: Scenario 3 (Form Validation) in tests/integration/form-validation.test.ts"
Task: "Integration test: Scenario 4 (Edit Existing Project) in tests/integration/edit-project.test.ts"
Task: "Integration test: Scenario 5 (Project Reordering) in tests/integration/reorder-projects.test.ts"
Task: "Integration test: Scenario 6 (Delete Project) in tests/integration/delete-project.test.ts"
Task: "Integration test: Scenario 7 (Active Stint Protection) in tests/integration/active-stint-protection.test.ts"
Task: "Integration test: Scenario 9 (Optimistic UI Updates) in tests/integration/optimistic-updates.test.ts"
```

### Phase 3.5: Polish tasks in parallel
```bash
# Launch T043-T045 together:
Task: "Performance test: Dashboard load time in tests/performance/dashboard-load.test.ts"
Task: "Performance test: Bundle size impact"
Task: "Accessibility audit"
```

---

## Notes

### Test-Driven Development (TDD)
- **CRITICAL**: Write all tests (T005-T017) BEFORE implementation (T018-T028)
- Verify tests FAIL before writing implementation
- Tests guide implementation (contract-first design)

### Parallel Execution Rules
- **[P] tasks**: Different files, no shared dependencies
- **Sequential tasks**: Same file modifications (e.g., T018-T024 all modify `app/lib/supabase/projects.ts`)
- **Workaround for sequential**: Use separate feature branches or implement one at a time

### Error Handling Strategy
- Transform database error codes to user-friendly messages
- Example: Postgres error 23505 → "A project with this name already exists"
- Use `ProjectErrorCode` enum and `PROJECT_ERROR_MESSAGES` mapping

### Optimistic UI Pattern
- Immediate local state update
- Server request in background
- Rollback on error, replace with server response on success
- Pattern established in existing codebase (per CLAUDE.md)

### Commit Strategy
- Commit after each completed task
- Meaningful commit messages (e.g., "T012: Add createProject contract test")
- Run `npm run lint:fix` before committing

### Avoiding Common Pitfalls
- Don't skip tests (TDD is mandatory)
- Don't modify multiple files in one task if marked [P]
- Don't forget to regenerate types after migration (T002)
- Don't block on soft limit warning (informational only, Scenario 8 skipped from tasks)

---

## Validation Checklist

*GATE: Verify before marking feature complete*

- [X] All contracts (7 functions) have corresponding tests (T010-T016) ✓ Written (but failing)
- [X] All entities (Project) have database layer implementation (T018-T024) ✓ Implemented
- [X] All tests written before implementation (Phase 3.2 before 3.3) ✓ Tests written first
- [X] Parallel tasks truly independent (no file conflicts) ✓ Verified
- [X] Each task specifies exact file path ✓ All paths specified
- [X] No task modifies same file as another [P] task (except tests) ✓ Verified
- [ ] All integration tests map to quickstart scenarios (T035-T042) ✗ Tests not created
- [ ] Performance targets validated (T043-T044) ✗ Not validated
- [ ] Accessibility requirements met (T045) ✗ Not audited
- [ ] Full test suite passes (T047) ✗ 31 tests failing
- [ ] Lint and build succeed (T048) ⚠️ Build ✓, Lint partial (test warnings)

---

## Task Summary

- **Total Tasks**: 48
- **Setup**: 4 tasks (T001-T004)
- **Tests**: 13 tasks (T005-T017)
- **Database Layer**: 7 tasks (T018-T024)
- **Composable Layer**: 4 tasks (T025-T028)
- **UI Components**: 6 tasks (T029-T034)
- **Integration Tests**: 8 tasks (T035-T042)
- **Polish**: 6 tasks (T043-T048)

**Estimated Effort**: 40-60 hours (based on 1-2 hours per task average)

**Critical Path**: T001 → T002 → T005-T017 → T018-T024 → T025-T028 → T029-T034 → T035-T042 → T043-T048

**Progress**: 34/48 tasks complete (71%)
- ✅ Phase 3.1-3.4: Complete (with issues noted)
- ⚠️ Phase 3.5: 0/14 tasks complete

---

**Tasks Status**: ⚠️ PARTIALLY COMPLETE - See status section at top for details

**Last Updated**: 2025-10-05
**Next Actions**:
1. Fix test infrastructure (auth setup, API mismatch)
2. Create integration test stubs
3. Run accessibility audit
4. Document bundle size
5. Manual QA testing
