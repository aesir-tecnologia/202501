# Tasks: Dashboard UI Polish

**Input**: Design documents from `/specs/009-dashboard-ui-polish/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not requested — this is a visual-only feature. Verification is through lint, type-check, existing test regression, and visual inspection per SC-001 through SC-006.

**Organization**: Tasks grouped by user story (P1 → P2 → P3) from spec.md. Each story can be validated independently through visual inspection.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Exact file paths included in all task descriptions

---

## Phase 1: Setup

**Purpose**: No setup needed — branch `009-dashboard-ui-polish` exists, no new dependencies required, no database changes. All changes modify existing files.

*(No tasks in this phase)*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Token value changes that provide the color foundation consumed by US1 (active row background) and US3 (muted text contrast). These MUST be complete before story implementation.

**⚠️ CRITICAL**: US1's active row background (T003) depends on the `--bg-active-row` token defined here. US3's contrast compliance depends on the `--text-muted` values set here.

- [x] T001 Update `--text-muted` token values (light: `#a8a29e` → `#736b66`, dark: `#78716c` → `#908984`) and add new `--bg-active-row` token (light: `rgba(22, 163, 74, 0.05)`, dark: `rgba(34, 197, 94, 0.08)`) in `app/assets/css/tokens.css`

**Checkpoint**: Token foundation ready — all user stories can now proceed

---

## Phase 3: User Story 1 — Clear Visual Hierarchy on Dashboard (Priority: P1) 🎯 MVP

**Goal**: The active project is instantly identifiable. The tab control is visually lightweight and doesn't compete with project list content.

**Independent Test**: Open dashboard with one running stint → user can identify the active project within 3 seconds without prior training. Tab control feels secondary to the project list.

**Requirements covered**: FR-001 (tab control weight), FR-002 (active row distinction)

### Implementation for User Story 1

- [x] T002 [P] [US1] Switch `UTabs` to `variant="link"` `color="neutral"` and remove `font-serif` class from "Your Projects" section heading in `app/pages/dashboard.vue`
- [x] T003 [P] [US1] Add `background: var(--bg-active-row)` to `.card-v27.state-running` CSS rule in `app/components/ProjectListCard.vue`

**Checkpoint**: Dashboard visual hierarchy established — active project stands out, tabs are lightweight

---

## Phase 4: User Story 2 — Readable and Consistent Typography (Priority: P2)

**Goal**: All UI text uses Instrument Sans (sans-serif). Serif (Fraunces) reserved exclusively for the LifeStint logo. Timer digits are cohesive. Labels meet minimum readability size.

**Independent Test**: Grep `font-serif` in `app/` — only 9 logo instances remain. Timer colons sit close to digits. "Started"/"Duration"/"Ends" labels render at ≥11px.

**Requirements covered**: FR-003 (typography consistency), FR-004 (timer digit cohesion), FR-009 (label minimum size)

### Implementation for User Story 2

- [x] T004 [P] [US2] Remove `font-serif` from `.session-project`, remove `letter-spacing: 0.02em` from `.timer-display`, add `font-variant-numeric: tabular-nums` to `.timer-display`, and raise `.meta-label` font-size from `10px` to `11px` in `app/components/DashboardTimerHero.vue`
- [x] T005 [P] [US2] Remove `font-serif` from empty state headings in `app/components/ProjectList.vue` (~3 instances) and `app/components/ArchivedProjectsList.vue` (~1 instance)
- [x] T006 [P] [US2] Remove `font-serif` from page headings in `app/pages/auth/login.vue`, `app/pages/auth/register.vue`, `app/pages/auth/callback.vue` (~3 headings), `app/pages/auth/verify-email.vue`, `app/pages/auth/forgot-password.vue`, `app/pages/auth/reset-password.vue`
- [x] T007 [P] [US2] Remove `font-serif` from headings in `app/pages/index.vue` (~7 instances — hero, sections, CTA, pricing, FAQ) and page titles in `app/pages/legal/terms.vue`, `app/pages/legal/privacy.vue`
- [x] T008 [P] [US2] Remove `font-serif` from section headings in `app/pages/gallery.vue` (~5 instances) and layout title in `app/layouts/component-gallery.vue`
- [x] T009 [P] [US2] Update `docs/DESIGN_SYSTEM.md`: (a) change typography rules to reserve Fraunces exclusively for the LifeStint logo wordmark, Instrument Sans for all headings/titles/labels/body text, JetBrains Mono for timer digits — update Font Families table, Typography Patterns, Cards example, Empty States example, Typography Summary, Accessibility examples, and Best Practices sections; (b) update `--text-muted` hex values from `#a8a29e`/`#78716c` to `#736b66`/`#908984` in Token Reference, Color System table, and Quick Reference; (c) verify card spacing convention (12px gap) is consistent with Spacing Scale documentation

**Checkpoint**: Typography system is consistent — serif appears only on logos, timer is cohesive, labels are readable

---

## Phase 5: User Story 3 — Accessible Color Contrast and Intentional Color Usage (Priority: P2)

**Goal**: All muted text meets WCAG AA contrast (4.5:1). Project color indicators are clearly decorative solid dots, not interactive-looking hollow rings.

**Independent Test**: Browser contrast checker shows ≥4.5:1 for `--text-muted` against all background tokens in both modes. Color dots look solid and decorative, not like radio buttons.

**Requirements covered**: FR-005 (muted text contrast — achieved via T001 token change), FR-006 (solid color dots)

### Implementation for User Story 3

- [x] T010 [US3] Change project color indicators from hollow rings to solid filled dots in `app/components/ProjectListCard.vue` — update `.project-color` CSS (remove `background: transparent`, `border-width`, `border-style`; set `width: 12px`, `height: 12px`; add background fill) and update computed color classes from `border-*` to `bg-*` variants in the template

**Checkpoint**: Color usage is accessible and intentional — muted text passes WCAG AA, dots are clearly decorative

---

## Phase 6: User Story 4 — Balanced Spacing and Aligned Layout (Priority: P3)

**Goal**: Card spacing follows the Tailwind 4px scale. Action buttons have uniform gaps. Navigation items form a cohesive group.

**Independent Test**: DevTools measurement shows card gap is `12px` (not `14px`). Action button gaps are equal across all project rows. Navigation items appear grouped.

**Requirements covered**: FR-007 (button spacing), FR-008 (navigation grouping)

### Implementation for User Story 4

- [x] T011 [US4] Standardize `.card-v27` gap from `14px` to `12px` and padding from `14px 20px` to `12px 20px` in `app/components/ProjectListCard.vue`
- [x] T012 [P] [US4] Verify navigation grouping in `app/layouts/default.vue` — confirm existing `bg-[#fef7ed] dark:bg-[#1f1b18] p-1 rounded-full gap-1` container satisfies FR-008 (likely no-op; document finding)

**Checkpoint**: All spacing is consistent and aligned — card gaps follow design system scale, navigation is cohesive

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final verification across all stories, regression testing, cross-mode validation

- [x] T013 Verify `font-serif` removal completeness — run `grep -r "font-serif" app/` and confirm only 9 logo instances remain (per research.md inventory)
- [x] T014 Run `npm run lint:fix && npm run type-check && npm run test:run` to verify no regressions
- [ ] T015 *(requires manual visual inspection)* Visual review of all modified pages in both light and dark modes across viewports (768px, 1024px, 1440px, 1920px) — verify SC-001 through SC-006

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: N/A — no setup required
- **Foundational (Phase 2)**: No dependencies — start immediately. **BLOCKS** US1 (T003 needs `--bg-active-row` token)
- **US1 (Phase 3)**: Depends on Phase 2 completion (T003 uses `--bg-active-row`)
- **US2 (Phase 4)**: Depends on Phase 2 completion (muted text renders with updated values)
- **US3 (Phase 5)**: Depends on Phase 2 completion (contrast already fixed by T001)
- **US4 (Phase 6)**: Depends on Phase 2 completion (no direct token dependency, but phases should be sequential for `ProjectListCard.vue` file contention with T003 and T010)
- **Polish (Phase 7)**: Depends on all story phases being complete

### User Story Dependencies

- **US1 (P1)**: After Phase 2 — no dependencies on other stories
- **US2 (P2)**: After Phase 2 — no dependencies on other stories. Can run in parallel with US1
- **US3 (P2)**: After Phase 2 — no dependencies on other stories. **File contention**: T010 touches `ProjectListCard.vue` (also modified by T003 in US1 and T011 in US4) → execute US3 after US1 or manage edits carefully
- **US4 (P3)**: After Phase 2 — **file contention**: T011 touches `ProjectListCard.vue` → execute after US1 and US3

### File Contention Map

`ProjectListCard.vue` is modified by 3 tasks across 3 different stories:
1. T003 [US1] — adds `background: var(--bg-active-row)` to `.state-running`
2. T010 [US3] — changes `.project-color` from hollow ring to solid dot
3. T011 [US4] — standardizes `.card-v27` gap and padding

**Recommended order**: T003 → T010 → T011 (matches phase/priority ordering)

### Parallel Opportunities

**Within Phase 3 (US1)**:
- T002 and T003 are [P] — different files (`dashboard.vue` vs `ProjectListCard.vue`)

**Within Phase 4 (US2)** — maximum parallelism:
- T004, T005, T006, T007, T008, T009 are ALL [P] — each touches different files

**Within Phase 6 (US4)**:
- T011 and T012 are [P] — different files (`ProjectListCard.vue` vs `default.vue`)

**Cross-story parallelism**:
- US1 and US2 phases can run in parallel (no shared files, both depend only on Phase 2)
- US3 must wait for US1 due to `ProjectListCard.vue` contention
- US4 must wait for US3 due to `ProjectListCard.vue` contention

---

## Parallel Example: User Story 2

```text
# All 6 tasks can launch simultaneously (different files, no dependencies):
T004: DashboardTimerHero.vue (font-serif + timer + label)
T005: ProjectList.vue + ArchivedProjectsList.vue (font-serif)
T006: auth/*.vue × 6 files (font-serif)
T007: index.vue + legal/*.vue (font-serif)
T008: gallery.vue + component-gallery.vue (font-serif)
T009: DESIGN_SYSTEM.md (docs update)
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 2: Foundational (T001 — token updates)
2. Complete Phase 3: US1 (T002, T003 — tabs + active row)
3. **STOP and VALIDATE**: Dashboard hierarchy is clear, tabs are lightweight, active row is distinct
4. This delivers the highest-priority visual improvement with just 3 tasks

### Recommended: Atomic Delivery

Per plan.md, all 9 requirements work together for a cohesive visual improvement. Deliver as a single PR:

1. Phase 2: Foundation (T001) → 1 task
2. Phase 3: US1 (T002–T003) → 2 tasks
3. Phase 4: US2 (T004–T009) → 6 tasks (all parallel)
4. Phase 5: US3 (T010) → 1 task
5. Phase 6: US4 (T011–T012) → 2 tasks
6. Phase 7: Polish (T013–T015) → 3 tasks
7. Total: 15 tasks, single PR

### Natural Slices (if incremental preferred)

1. **Slice 1**: T001 + T009 (tokens + docs) — foundation, no visual regressions
2. **Slice 2**: T002–T008 + T010 (hierarchy + typography + dots) — P1 + P2 requirements
3. **Slice 3**: T011–T012 (spacing) — P3 requirements
4. **Slice 4**: T013–T015 (polish) — verification and regression

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks within the same phase
- No test tasks generated — spec confirms visual inspection as primary verification method
- `ProjectListCard.vue` is the highest-contention file (3 tasks across 3 stories) — phase ordering prevents conflicts
- T012 (navigation grouping) is likely a no-op — existing implementation already satisfies FR-008 per quickstart.md analysis
- Font-serif removal (T004–T008) is the highest-volume work (~30 class removals across ~15 files) but is entirely parallelizable
- All token values in T001 are from research.md decision D-001 and D-002 with WCAG AA headroom built in
