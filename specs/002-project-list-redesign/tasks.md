---

description: "Task list for Project List Redesign implementation"
---

# Tasks: Project List Redesign

**Input**: Design documents from `/specs/002-project-list-redesign/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/component-api.md

**Tests**: Manual testing only - automated tests currently broken in project per CLAUDE.md

**Organization**: Tasks organized by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

This is a Nuxt 4 web application with standard `app/` directory structure:
- Components: `app/components/`
- Composables: `app/composables/` (no changes)
- Pages: `app/pages/`
- Tests: `tests/` (manual testing only - test infrastructure broken)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and environment validation

- [ ] T001 Verify @vueuse/integrations dependency installed (for drag-and-drop)
- [ ] T002 Review existing ProjectList component at app/components/ProjectList.vue
- [ ] T003 [P] Review design system documentation at docs/DESIGN_SYSTEM.md
- [ ] T004 [P] Review existing composables (useProjects, useStints, useStintTimer) - no changes needed

**Checkpoint**: Environment ready - component refactoring can begin

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core component extraction that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Create ProjectListCard component at app/components/ProjectListCard.vue with base structure (props, emits, helper functions)
- [ ] T006 Extract helper functions (formatDuration, getColorBorderClass) from ProjectList.vue to ProjectListCard.vue
- [ ] T007 Refactor ProjectList.vue to use ProjectListCard component with drag-and-drop integration

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Rapid Stint Initiation (Priority: P1) 🎯 MVP

**Goal**: Enable users to start stints within 2-3 seconds with minimal cognitive load. All projects visible, Start buttons prominent, disabled states clear when stint running.

**Independent Test**: Create 5 active projects, measure time from dashboard load to stint start. Verify Start buttons immediately visible and one-click to start.

### Implementation for User Story 1

- [ ] T008 [P] [US1] Update ProjectListCard component to show prominent Start Stint button in app/components/ProjectListCard.vue
- [ ] T009 [P] [US1] Implement canStartStint computed property (disabled when inactive OR other stint running) in app/components/ProjectListCard.vue
- [ ] T010 [US1] Add disabled state styling and tooltip for Start button ("Stop current stint to start new one") in app/components/ProjectListCard.vue
- [ ] T011 [US1] Update active stint section to show timer and controls prominently in app/components/ProjectListCard.vue
- [ ] T012 [US1] Add visual distinction for project with active stint (success border + ring + pulsing animation) in app/components/ProjectListCard.vue
- [ ] T013 [US1] Update ProjectList.vue to maintain existing drag-and-drop order persistence with useSortable
- [ ] T014 [US1] Verify stint start flow: click Start → stint begins → timer visible → other projects disabled

**Checkpoint**: User Story 1 complete - users can start stints rapidly with clear visual feedback

---

## Phase 4: User Story 2 - Progress Monitoring at a Glance (Priority: P2)

**Goal**: Display daily progress (X/Y stints) for each project without clicking. Users assess progress across all projects within 2 seconds.

**Independent Test**: Complete varying numbers of stints on different projects, verify progress indicators visible on all cards without interaction.

### Implementation for User Story 2

- [ ] T015 [P] [US2] Create computeDailyProgress function to calculate completed vs expected stints in app/components/ProjectListCard.vue
- [ ] T016 [P] [US2] Add DailyProgress interface type definition (completed, expected, percentage, isOverAchieving, isMet) in app/components/ProjectListCard.vue
- [ ] T017 [US2] Add progress indicator UI (text: "X/Y stints") to metadata section in app/components/ProjectListCard.vue
- [ ] T018 [US2] Add progress bar visual with color coding (neutral < 100%, success = 100%, success + fire emoji if overachieving) in app/components/ProjectListCard.vue
- [ ] T019 [US2] Implement client-side filtering from useStintsQuery to count today's completed stints (filter by completed_at timestamp) in app/components/ProjectListCard.vue
- [ ] T020 [US2] Add celebration indicator (success-colored UBadge with checkmark icon) when daily goal met in app/components/ProjectListCard.vue
- [ ] T021 [US2] Handle edge cases: 0/0 stints (show "0 stints/day"), 5/2 stints (show "5/2 🔥"), no stints today (show "0/2 stints"), midnight-spanning stints (count by completed_at)

**Checkpoint**: User Story 2 complete - progress visible at a glance on all project cards

---

## Phase 5: User Story 3 - Efficient Project Management (Priority: P3)

**Goal**: Enable drag-and-drop reordering, toggle active/inactive, and edit projects within 2 clicks without leaving dashboard.

**Independent Test**: Perform reorder, toggle, and edit operations. Verify all completable in 2 clicks or less, changes persist across sessions.

### Implementation for User Story 3

- [ ] T022 [P] [US3] Add drag handle (i-lucide-grip-vertical icon) with conditional visibility (only active projects) in app/components/ProjectListCard.vue
- [ ] T023 [P] [US3] Update drag handle styling with hover state and cursor-move in app/components/ProjectListCard.vue
- [ ] T024 [US3] Verify useSortable integration with 500ms debounce for backend updates in app/components/ProjectList.vue
- [ ] T025 [US3] Add toggle switch (USwitch) for active/inactive status with loading state in app/components/ProjectListCard.vue
- [ ] T026 [US3] Implement handleToggleActive event handler with toast notifications (success/error) in app/components/ProjectList.vue
- [ ] T027 [US3] Add edit button (i-lucide-settings icon) with tooltip in app/components/ProjectListCard.vue
- [ ] T028 [US3] Implement inactive projects section with collapsible behavior (collapsed by default) in app/components/ProjectList.vue
- [ ] T029 [US3] Add section header "Inactive Projects (N)" with chevron icon (i-lucide-chevron-down/right) in app/components/ProjectList.vue
- [ ] T030 [US3] Show "Inactive" badge on inactive project cards in app/components/ProjectListCard.vue
- [ ] T031 [US3] Disable drag handle on inactive projects (draggable=false prop) in app/components/ProjectList.vue
- [ ] T032 [US3] Add visual transition animation when project moves between active/inactive sections

**Checkpoint**: User Story 3 complete - all management operations work seamlessly

---

## Phase 6: User Story 4 - Visual Clarity and Focus (Priority: P4)

**Goal**: Clear visual hierarchy guiding attention to actionable items (Start buttons, timers) and de-emphasizing secondary information.

**Independent Test**: User testing - 80% of users identify active stint status within 1 second of viewing dashboard.

### Implementation for User Story 4

- [ ] T033 [P] [US4] Update icon from i-lucide-target to i-lucide-repeat for expected daily stints in app/components/ProjectListCard.vue
- [ ] T034 [P] [US4] Update icon from i-lucide-pencil to i-lucide-settings for edit button in app/components/ProjectListCard.vue
- [ ] T035 [US4] Refine active stint visual treatment: success-500 border + ring-2 + pulsing animation in app/components/ProjectListCard.vue
- [ ] T036 [US4] Update Start button to use success color variant (solid) with i-lucide-play icon in app/components/ProjectListCard.vue
- [ ] T037 [US4] Add responsive layout breakpoints (sm: for mobile→desktop) to card wrapper in app/components/ProjectListCard.vue
- [ ] T038 [US4] Implement mobile-first layout: vertical stack on mobile, horizontal on desktop in app/components/ProjectListCard.vue
- [ ] T039 [US4] Ensure color contrast meets WCAG AA standards for all text and interactive elements
- [ ] T040 [US4] Add motion-safe prefix to pulsing animation (respect prefers-reduced-motion) in app/components/ProjectListCard.vue
- [ ] T041 [US4] Verify dark mode support for all color classes (neutral backgrounds, borders, text)

**Checkpoint**: User Story 4 complete - visual hierarchy optimized for focus and clarity

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements affecting multiple user stories, accessibility, and performance

- [ ] T042 [P] Add ARIA labels to all icon-only buttons (drag handle, edit, toggle) in app/components/ProjectListCard.vue
- [ ] T043 [P] Add aria-label to progress indicators ("Daily progress: X of Y stints completed") in app/components/ProjectListCard.vue
- [ ] T044 [P] Implement screen reader announcements for state changes (stint started, project toggled) in app/components/ProjectList.vue
- [ ] T045 [P] Add keyboard navigation support: Tab to navigate, Enter/Space to activate in app/components/ProjectListCard.vue
- [ ] T046 [P] Wrap all icon-only buttons in UTooltip per design system requirement in app/components/ProjectListCard.vue
- [ ] T047 Add error handling for all mutations (start stint, toggle active, reorder) with toast notifications in app/components/ProjectList.vue
- [ ] T048 Add loading states for all async operations (UButton with loading prop) in app/components/ProjectListCard.vue
- [ ] T049 Implement v-memo optimization for ProjectListCard component (memo on project.id, project.updated_at, activeStint?.id)
- [ ] T050 Add empty state UI when user has zero projects (CTA to create first project) in app/components/ProjectList.vue
- [ ] T051 Add empty state variant when 0 active projects but N inactive (encourage activating) in app/components/ProjectList.vue
- [ ] T052 Run ESLint and fix all issues: npm run lint:fix
- [ ] T053 Manual testing checklist execution (desktop + mobile + accessibility) per quickstart.md
- [ ] T054 Performance validation: 60fps scrolling with 25 projects, bundle size < 50KB
- [ ] T055 [P] Update CLAUDE.md with new component notes (ProjectListCard extraction)
- [ ] T056 Code cleanup: remove unused code, ensure no comments unless complex logic

**Checkpoint**: All polish items complete - feature ready for final validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P4)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories ✅
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent, adds progress indicators ✅
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Independent, adds management features ✅
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) - Enhances visual hierarchy across all stories ✅

### Within Each User Story

- Tasks marked [P] within a story can run in parallel (different sections of same component)
- Core functionality before edge cases
- UI implementation before interaction handlers
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks can run sequentially (same files being modified)
- Once Foundational phase completes, all user stories can start in parallel (mostly same file but different sections)
- All Polish tasks marked [P] can run in parallel (accessibility, docs, performance)
- Different developers can work on different user stories after Phase 2

---

## Parallel Example: User Story 1

```bash
# Launch parallel tasks for User Story 1:
Task: "Update ProjectListCard component to show prominent Start Stint button"
Task: "Implement canStartStint computed property"

# Then sequential:
Task: "Add disabled state styling and tooltip for Start button"
Task: "Update active stint section to show timer and controls prominently"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (15 minutes)
2. Complete Phase 2: Foundational (1-1.5 hours) - Extract ProjectListCard
3. Complete Phase 3: User Story 1 (1 hour) - Rapid stint initiation
4. **STOP and VALIDATE**: Test User Story 1 independently via manual checklist
5. Deploy/demo if ready

**Estimated Time**: 2.5-3 hours for MVP

### Incremental Delivery

1. Complete Setup + Foundational → Component extracted (1.5-2 hours)
2. Add User Story 1 → Test independently → Deploy/Demo (MVP: Rapid stint initiation!)
3. Add User Story 2 → Test independently → Deploy/Demo (Progress monitoring!)
4. Add User Story 3 → Test independently → Deploy/Demo (Project management!)
5. Add User Story 4 → Test independently → Deploy/Demo (Visual polish!)
6. Each story adds value without breaking previous stories

**Total Estimated Time**: 4-5 hours for all user stories + polish

### Parallel Team Strategy

With multiple developers (not recommended due to same file modifications):

1. Team completes Setup + Foundational together (1.5-2 hours)
2. Once Foundational is done:
   - Developer A: User Story 1 (Phase 3)
   - Developer B: User Story 2 (Phase 4)
   - Developer C: User Story 3 (Phase 5)
   - Developer D: User Story 4 (Phase 6)
3. Stories integrate via careful merge (expect conflicts in ProjectListCard.vue)

**Note**: Due to single-component focus, sequential implementation recommended.

---

## Manual Testing Checklist

### Desktop Testing (Chrome/Firefox/Safari)

- [ ] Drag-and-drop reordering works smoothly
- [ ] Drag handle only visible on active projects
- [ ] Start Stint button works (one-click to start)
- [ ] Toggle active/inactive works with visual transition
- [ ] Edit button opens modal with pre-filled values
- [ ] Inactive projects section collapses/expands
- [ ] Active stint shows timer and controls (pause/stop)
- [ ] Pulsing animation on active stint (if prefers-reduced-motion: no-preference)
- [ ] Dark mode works correctly (all text readable, borders visible)
- [ ] Color tags show as left border accent
- [ ] Progress indicators visible ("X/Y stints") with progress bars
- [ ] Celebration indicator when daily goal met
- [ ] Icons changed: repeat (stints/day), settings (edit button)

### Mobile Testing (375px viewport)

- [ ] Cards stack vertically
- [ ] All buttons are tappable (min 44×44px touch targets)
- [ ] Text doesn't overflow or truncate incorrectly
- [ ] Drag-and-drop works on touch (hold-drag gesture)
- [ ] No horizontal scrolling required

### Accessibility Testing

- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] All icon-only buttons have tooltips
- [ ] Screen reader announces state changes (use macOS VoiceOver or NVDA)
- [ ] ARIA labels present on interactive elements
- [ ] Color contrast meets WCAG AA (use browser DevTools)
- [ ] Focus visible on all interactive elements

### Performance Testing

- [ ] Create 25 test projects
- [ ] Scroll through project list: 60fps smooth
- [ ] Drag-and-drop performance: no lag or stutter
- [ ] Component bundle size < 50KB (check in Nuxt build output)
- [ ] Lighthouse audit scores: Performance > 90, Accessibility = 100

---

## Notes

- [P] tasks = different files or different sections of same file, no sequential dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Manual testing required - automated tests currently broken per CLAUDE.md
- Commit after each task or logical group (use git commit, NOT auto-commit)
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, circular dependencies, breaking existing functionality

---

## Success Criteria Summary

**From spec.md acceptance criteria:**

- ✅ SC-001: Users identify progress on all projects within 2 seconds (US2)
- ✅ SC-002: 90% of users start stint within 3 seconds (US1)
- ✅ SC-003: Common tasks (reorder, toggle, edit) in 2 clicks or fewer (US3)
- ✅ SC-004: Active stint identifiable within 1 second by 80% of users (US4)
- ✅ SC-005: Mobile users view critical info without horizontal scrolling (US1, US4)
- ✅ SC-006: 60fps scrolling with 25 projects (Performance validation)
- ✅ SC-007: Keyboard-only navigation works (Accessibility)
- ✅ SC-008: Screen reader announcements for state changes (Accessibility)

---

**Total Tasks**: 56 tasks
- Setup: 4 tasks (15 minutes)
- Foundational: 3 tasks (1-1.5 hours) - BLOCKING
- User Story 1 (P1 - MVP): 7 tasks (1 hour)
- User Story 2 (P2): 7 tasks (45 minutes)
- User Story 3 (P3): 11 tasks (1.5 hours)
- User Story 4 (P4): 9 tasks (1 hour)
- Polish: 15 tasks (1 hour)

**Parallelizable Tasks**: 24 marked with [P]

**Recommended Approach**: Sequential implementation (MVP first: US1, then US2, US3, US4, Polish)

**MVP Scope**: Phase 1 + Phase 2 + Phase 3 (User Story 1 only) = 14 tasks, ~2.5-3 hours
