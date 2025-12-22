# Feature Specification: Pause and Switch

**Feature Branch**: `006-suspend-switch`
**GitHub Issue**: [#22 - Unable to start new stint with paused stint](https://github.com/aesir-tecnologia/202501/issues/22)
**Created**: 2025-12-22
**Status**: Draft
**Input**: User description: "Allow users to start a new stint on a different project while another stint is paused, then return to the paused stint later."

## Clarifications

### Session 2025-12-22

- Q: How should the 24-hour auto-expiry be implemented? → A: On-demand check when user interacts with the app (consistent with existing paused stint handling via `auto_stale`)
- Q: What completion type for resumed-then-completed stints? → A: Use existing `manual` type
- Q: Where is "Switch Project" action accessible from? → A: Via conflict dialog when user tries to start a stint on a different project while one is paused
- Q: Do we need a separate "suspended" status? → A: No, just relax the constraint to allow one paused + one active stint simultaneously

## Problem Statement

Currently, LifeStint enforces a single active/paused stint per user. When users need to temporarily switch to a different project (e.g., handling an urgent task), they must either:

1. **End the current stint early** — which inflates their stint count with partially completed work
2. **Stay blocked** — unable to track work on the urgent task

This creates inaccurate tracking for users who experience legitimate work interruptions. The solution is simple: allow users to start a new stint while another is paused.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Switch to Different Project (Priority: P1)

As a user working on a stint, when an urgent task arrives on a different project, I want to pause my current work and start a new stint without losing my progress, so that I can handle interruptions without inflating my stint count.

**Why this priority**: This is the core value proposition—enabling context switches without data accuracy loss. Without this, the feature has no purpose.

**Independent Test**: Can be fully tested by starting a stint, pausing it, clicking to start a stint on a different project, and verifying the new stint starts while the original remains paused.

**Acceptance Scenarios**:

1. **Given** a user has a paused stint on Project A, **When** they start a stint on Project B, **Then** a new active stint starts on Project B while Project A's stint remains paused
2. **Given** a user has an active stint, **When** they try to start a stint on a different project, **Then** the system first pauses the stint and shows the conflict dialog with "Pause and switch" as primary option
3. **Given** a user has a paused stint, **When** they view their dashboard, **Then** they see the paused stint with remaining time and project name

---

### User Story 2 - Return to Paused Stint (Priority: P1)

As a user who paused a stint to work on something else, I want to return to my paused work after completing or stopping the interrupting stint, so that I can finish what I started with accurate time tracking.

**Why this priority**: Equal priority to switching because pause without resume capability would leave users stranded with incomplete stints.

**Independent Test**: Can be fully tested by having a paused stint, completing the active stint, then clicking the resume button on the paused stint and verifying it resumes as active.

**Acceptance Scenarios**:

1. **Given** a user has a paused stint on Project A and no active stint, **When** they click the resume button on the paused stint, **Then** the paused stint becomes active and the timer resumes from where it left off
2. **Given** a user has a paused stint and an active stint, **When** they try to resume the paused stint, **Then** the system prompts them to stop or pause the active stint first
3. **Given** a user resumes a paused stint, **When** the timer completes, **Then** it counts as one completed stint with total work time across both sessions

---

### User Story 3 - Abandon Paused Stint (Priority: P2)

As a user who paused a stint but no longer needs to complete it, I want to stop the paused stint without it counting toward my daily totals, so that my progress metrics remain accurate.

**Why this priority**: Secondary because most users will want to complete paused work; abandonment is an escape hatch for edge cases.

**Independent Test**: Can be fully tested by having a paused stint, clicking the stop button, confirming the action, and verifying the stint is marked as excluded from daily totals.

**Acceptance Scenarios**:

1. **Given** a user has a paused stint, **When** they click the stop button and confirm, **Then** the stint is marked as abandoned and does not count toward daily stint totals
2. **Given** a user clicks the stop button on a paused stint, **When** the confirmation dialog appears, **Then** it clearly states the stint will not count toward their daily progress
3. **Given** an abandoned stint, **When** the user views their stint history, **Then** the stint appears with an "abandoned" indicator but is excluded from statistics

---

### User Story 4 - Conflict Resolution Dialog (Priority: P2)

As a user trying to start a new stint while another is paused, I want to see clear options in the conflict dialog, so that I can easily decide what to do.

**Why this priority**: Enhances discoverability but users can still start new stints directly once the constraint is relaxed.

**Independent Test**: Can be fully tested by having a paused stint, clicking "Start Stint" on a different project, and verifying the conflict dialog shows appropriate options.

**Acceptance Scenarios**:

1. **Given** a user has a paused stint, **When** they try to start a stint on a different project, **Then** a dialog appears with "Pause and switch" as the primary option
2. **Given** the conflict dialog is shown, **When** the user views all options, **Then** they see: "Pause and switch", "Complete paused and start new", "Resume paused", and "Cancel"
3. **Given** the user selects "Pause and switch", **Then** the new stint starts immediately while the paused stint remains paused

---

### Edge Cases

- What happens when a user tries to pause a second stint while one is already paused?
  - System prevents this; only one paused stint allowed at a time
- What happens if the user closes the app with a paused stint?
  - Paused stint persists in the database and reappears on next app load (existing behavior)
- What happens if a user tries to resume a paused stint while an active stint is running?
  - System prompts user to pause or stop the active stint first
- What happens to paused stints during the daily reset at midnight?
  - Paused stints persist across midnight; they are attributed to their original start date when eventually completed (existing behavior)
- What happens to stale paused stints after 24 hours?
  - Existing `auto_stale` behavior handles this — stint is auto-completed with actual time worked

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow a maximum of one active stint per user at any time
- **FR-002**: System MUST allow a maximum of one paused stint per user at any time
- **FR-003**: System MUST allow starting a new stint when a paused stint exists (resulting in 1 active + 1 paused)
- **FR-004**: System MUST preserve the elapsed time and remaining duration of paused stints (existing behavior)
- **FR-005**: System MUST allow resuming a paused stint only when no active stint exists
- **FR-006**: System MUST NOT count paused stints toward daily stint totals until they are completed (existing behavior)
- **FR-007**: System MUST display paused stint information on the dashboard with project name, remaining time, and actions
- **FR-008**: System MUST allow resuming a paused stint via the resume button (existing behavior)
- **FR-009**: System MUST allow stopping a paused stint via the stop button, marking it as abandoned
- **FR-010**: System MUST mark abandoned stints as excluded from daily totals and statistics
- **FR-011**: System MUST record completion type as "abandoned" for user-stopped paused stints
- **FR-012**: System MUST update the conflict resolution dialog to include "Pause and switch" as the primary option
- **FR-013**: System MUST show a confirmation dialog when stopping a paused stint, warning that it will be abandoned
- **FR-014**: System MUST continue using existing `auto_stale` completion type for paused stints that expire after 24 hours

### Key Entities

- **Stint**: No schema changes required; existing `status` and `completion_type` fields suffice
- **Stint Status**: No changes — uses existing: active, paused, completed, interrupted
- **Completion Type**: Add `abandoned` to existing: manual, auto, auto_stale, conflict_resolution

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can pause current stint and start a new one within 3 seconds (2 taps/clicks)
- **SC-002**: Users can resume a paused stint within 2 seconds (1 tap/click on the resume button)
- **SC-003**: 100% of paused stints are either resumed, abandoned, or auto-expired within 24 hours (no zombie stints)
- **SC-004**: Daily stint counts accurately reflect only completed work (paused/abandoned stints don't inflate counts)
- **SC-005**: Users who experience work interruptions can track all their work without workarounds

## Assumptions

1. **Single pause depth**: Users typically have at most one interruption at a time; limiting to one paused stint is acceptable
2. **24-hour expiry is sufficient**: Existing `auto_stale` behavior provides ample buffer for overnight/next-day resumption
3. **Abandon is rare**: Most users will complete or resume paused stints; the abandon feature is an escape hatch

## Out of Scope

- Multiple paused stints (stint stacking)
- Transferring paused stint time to a different project
- Merging interrupted work sessions into a single stint
- Notifications/reminders about paused stints approaching expiry
- Undo functionality for abandoned stints
