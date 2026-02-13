# Feature Specification: Stint Progress Modal

**Feature Branch**: `008-stint-progress-modal`
**Created**: 2026-02-12
**Status**: Draft
**Input**: User description: "Make the stint progress indicator clickable. Show modal with included stints. Show: started, ended, planned duration, actual duration, paused duration, status, completion type, attributed date, and notes. You're free to sort columns as you wish. Make sure you use the helper for showing durations."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Today's Completed Stints (Priority: P1)

As a user working on a project, I want to click the progress badge (e.g., "1/3") on a project card to see a detailed breakdown of all stints that count toward today's progress, so I can review my session history at a glance.

**Why this priority**: This is the core interaction — without the clickable badge and modal, the feature doesn't exist. It delivers immediate value by turning a passive indicator into an actionable detail view.

**Independent Test**: Can be fully tested by clicking the progress badge on any project card and verifying the modal opens with the correct stints listed. Delivers value by giving users visibility into their daily work sessions.

**Acceptance Scenarios**:

1. **Given** a project with 2 completed stints today, **When** the user clicks the progress badge ("2/3"), **Then** a modal opens showing a table with those 2 stints and all required columns.
2. **Given** a project with 0 completed stints today, **When** the user clicks the progress badge ("0/3"), **Then** the modal opens showing an empty state message (e.g., "No stints completed today").
3. **Given** the modal is open, **When** the user clicks outside the modal or presses Escape, **Then** the modal closes.

---

### User Story 2 - Review Stint Details in Modal (Priority: P2)

As a user reviewing my daily stints, I want to see each stint's started time, ended time, planned duration, actual duration, paused duration, status, completion type, attributed date, and notes, so I can understand how I spent my time.

**Why this priority**: The detail columns are what make the modal useful beyond just a count. Without readable details, the modal adds little value over the badge itself.

**Independent Test**: Can be tested by completing a stint with known values (e.g., 25-minute planned duration, notes added) and verifying each column displays correctly in the modal.

**Acceptance Scenarios**:

1. **Given** a stint with all fields populated, **When** the modal is displayed, **Then** all columns show the correct values: started time, ended time, planned duration (formatted via duration helper), actual duration (formatted), paused duration (formatted), status, completion type, attributed date, and notes.
2. **Given** a stint with null/empty optional fields (e.g., no notes, no attributed date), **When** the modal is displayed, **Then** those columns show a dash or appropriate empty indicator rather than "null" or blank.
3. **Given** durations are displayed, **When** viewing planned, actual, and paused duration columns, **Then** they are formatted using the existing duration formatting helper (e.g., "0h 25m", "1h 10m").

---

### User Story 3 - Stints Sorted by Recency (Priority: P3)

As a user, I want the stints in the modal to be sorted with the most recent stint first, so I can quickly see my latest session at the top.

**Why this priority**: A sensible default sort order improves usability but is not critical for the feature to function. Users expect chronological ordering in time-based data.

**Independent Test**: Can be tested by completing multiple stints and verifying the modal lists them with the most recently ended stint at the top.

**Acceptance Scenarios**:

1. **Given** 3 stints completed at different times today, **When** the modal opens, **Then** stints are sorted by ended time descending (most recent first).

---

### Edge Cases

- What happens when a stint is currently active or paused (not yet completed)? The modal only shows completed stints, matching the progress badge count. Active/paused stints are excluded.
- What happens when a stint has an `attributed_date` different from its `ended_at` date? The modal filters by `ended_at` (same as the progress badge), not `attributed_date`. The badge computes `endedAt >= startOfDay(now) && endedAt < startOfDay(now) + 1 day` with `status === 'completed'`. A stint ended yesterday but attributed to today will NOT appear in the modal.
- What happens on mobile/small screens where table columns may not fit? The table retains its full column set and scrolls horizontally within the modal. No columns are hidden or rearranged.
- What happens when a project has many stints completed today (e.g., 10+)? The modal content should be scrollable vertically.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The progress badge on each project card MUST be clickable (with appropriate cursor and hover feedback).
- **FR-002**: Clicking the progress badge MUST open a modal dialog displaying today's completed stints for that specific project.
- **FR-003**: The modal MUST display a table with the following columns: Started, Ended, Planned Duration, Actual Duration, Paused Duration, Status, Completion Type, Attributed Date, and Notes.
- **FR-004**: Duration columns (Planned, Actual, Paused) MUST be formatted using the existing `formatDuration` helper from `daily-summaries.ts`.
- **FR-005**: Started and Ended columns MUST display human-readable date and time (e.g., "Feb 12, 2:30 PM").
- **FR-006**: The Attributed Date column MUST display a human-readable date (e.g., "Feb 12, 2026").
- **FR-007**: Stints MUST be sorted by ended time descending (most recent first).
- **FR-008**: The modal MUST show an empty state when no completed stints exist for today.
- **FR-009**: The modal MUST include the project name in its header/title for context.
- **FR-010**: Null or empty optional fields (notes, attributed date) MUST display a dash ("—") rather than empty space or "null".
- **FR-011**: The modal MUST be dismissible via clicking outside, pressing Escape, or a close button.
- **FR-012**: The modal content MUST be scrollable when stints exceed the visible area.
- **FR-013**: The modal MUST fetch stints via its own dedicated query when opened (not read from an external cache).
- **FR-014**: The Notes column MUST truncate text beyond 50 characters with an ellipsis, displaying the full text in a hover tooltip.

### Key Entities

- **Stint**: A focused work session belonging to a project. Key attributes: start/end times, planned/actual/paused durations, status (active/paused/completed/interrupted), completion type (manual/auto/interrupted), attributed date, and optional notes. **Note**: `planned_duration` is stored in **minutes**; `actual_duration` and `paused_duration` are stored in **seconds**. Multiply `planned_duration` by 60 before passing to `formatDuration(seconds)`.
- **Daily Progress**: A per-project calculation of completed stints today vs. expected daily stints. Drives the progress badge display.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can access all stint detail columns (9 data fields) without navigating away from the dashboard.
- **SC-002**: No duration value in the modal is displayed as raw seconds, milliseconds, or an inconsistent format.
- **SC-003**: The modal accurately reflects the same count shown in the progress badge (badge says "3/5" → modal shows exactly 3 stints).
- **SC-004**: The modal renders without content overflow on viewports as narrow as 375px (horizontal table scroll enabled, close button remains accessible without scrolling).

## Assumptions

- The progress badge already displays completed stints for today — the modal will show the same set of stints using the same filtering logic.
- The existing `formatDuration(seconds)` helper is sufficient for all three duration columns.
- The modal will use existing Nuxt UI modal components consistent with the app's design system.
- Started and Ended times will be displayed in the user's local timezone (browser default).
- The "Status" column is included for completeness, though all stints shown will be "completed" (since only completed stints count toward progress). This field may be useful if the scope is later expanded to show all stints.
- The Attributed Date column is retained for consistency with the user's request and future extensibility. It may show today's date, a different date, or a dash (if null) depending on the stint's attribution.
- The modal owns its data: it triggers a dedicated query on open rather than coupling to dashboard cache state.

## Clarifications

### Session 2026-02-12

- Q: Should the modal fetch stints via a new dedicated query or read from existing TanStack Query cache? → A: New dedicated query on open.
- Q: How should long notes be displayed in the Notes column? → A: Truncate at 50 chars with ellipsis; full text shown in hover tooltip.
- Q: Keep the Attributed Date column despite always showing today? → A: Yes, keep for future extensibility.
- Q: How should the table behave on mobile/narrow viewports? → A: Horizontal scrolling table; no column hiding or layout change.
