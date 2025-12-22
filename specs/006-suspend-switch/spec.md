# Feature Specification: Suspend and Switch

**Feature Branch**: `006-suspend-switch`
**GitHub Issue**: [#22 - Unable to start new stint with paused stint](https://github.com/aesir-tecnologia/202501/issues/22)
**Created**: 2025-12-22
**Status**: Draft
**Input**: User description: "Suspend and Switch feature - Allow users to temporarily suspend a paused stint and start a new one on a different project, then return to the suspended stint later."

## Clarifications

### Session 2025-12-22

- Q: How should the 24-hour auto-expiry be implemented? → A: On-demand check when user interacts with the app (consistent with paused stint handling)
- Q: What completion type for resumed-then-completed stints? → A: Use existing `manual` type; suspension history tracked via `suspended_at` timestamp
- Q: Where is "Switch Project" action accessible from? → A: Only via conflict dialog when user tries to start a stint on a different project (no dedicated button in timer controls)

## Problem Statement

Currently, LifeStint enforces a single active/paused stint per user. When users need to temporarily switch to a different project (e.g., handling an urgent task), they must either:

1. **End the current stint early** — which inflates their stint count with partially completed work
2. **Stay blocked** — unable to track work on the urgent task

This creates inaccurate tracking for users who experience legitimate work interruptions. The "Suspend and Switch" feature addresses this by allowing users to "park" a stint without completing it, work on something else, and return later.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Suspend and Start New Stint (Priority: P1)

As a user working on a stint, when an urgent task arrives on a different project, I want to suspend my current work and start a new stint without losing my progress, so that I can handle interruptions without inflating my stint count.

**Why this priority**: This is the core value proposition—enabling context switches without data accuracy loss. Without this, the feature has no purpose.

**Independent Test**: Can be fully tested by starting a stint, pausing it, clicking to start a stint on a different project (triggering conflict dialog), selecting "Suspend and switch", and verifying the original stint moves to suspended status while a new stint becomes active.

**Acceptance Scenarios**:

1. **Given** a user has a paused stint on Project A with 10 minutes of work completed, **When** they try to start a stint on Project B and select "Suspend and switch" in the conflict dialog, **Then** the Project A stint moves to "suspended" status and a new active stint starts on Project B
2. **Given** a user has an active stint, **When** they try to start a stint on a different project, **Then** the system first pauses the stint and shows the conflict dialog with "Suspend and switch" as primary option
3. **Given** a user has a suspended stint, **When** they view their dashboard, **Then** they see a visible indicator showing the suspended stint with remaining time and project name

---

### User Story 2 - Return to Suspended Stint (Priority: P1)

As a user who suspended a stint, I want to return to my suspended work after completing or stopping the interrupting stint, so that I can finish what I started with accurate time tracking.

**Why this priority**: Equal priority to P1 because suspend without resume capability would leave users stranded with incomplete stints.

**Independent Test**: Can be fully tested by having a suspended stint, completing the active stint, then clicking "Return to [Project]" and verifying the suspended stint resumes as active.

**Acceptance Scenarios**:

1. **Given** a user has a suspended stint on Project A and no active stint, **When** they click "Return to Project A", **Then** the suspended stint becomes active and the timer resumes from where it left off
2. **Given** a user has a suspended stint and an active stint, **When** they click "Return to suspended stint", **Then** the system prompts them to stop or pause the active stint first
3. **Given** a user resumes a suspended stint, **When** the timer completes, **Then** it counts as one completed stint with total work time across both sessions

---

### User Story 3 - Abandon Suspended Stint (Priority: P2)

As a user who suspended a stint but no longer needs to complete it, I want to abandon the suspended stint without it counting toward my daily totals, so that my progress metrics remain accurate.

**Why this priority**: Secondary because most users will want to complete suspended work; abandonment is an escape hatch for edge cases.

**Independent Test**: Can be fully tested by having a suspended stint, clicking "Abandon", confirming the action, and verifying the stint is marked as excluded from daily totals.

**Acceptance Scenarios**:

1. **Given** a user has a suspended stint, **When** they click "Abandon" and confirm, **Then** the stint is marked as excluded and does not count toward daily stint totals
2. **Given** a user clicks "Abandon", **When** the confirmation dialog appears, **Then** it clearly states the stint will not count toward their daily progress
3. **Given** an abandoned stint, **When** the user views their stint history, **Then** the stint appears with an "abandoned" indicator but is excluded from statistics

---

### User Story 4 - Auto-Expiry of Stale Suspended Stints (Priority: P2)

As a user who forgot about a suspended stint, I want the system to automatically handle stale suspended stints after 24 hours, so that I don't accumulate zombie stints indefinitely.

**Why this priority**: Important for data hygiene but not required for core functionality; system can function without this initially.

**Independent Test**: Can be fully tested by creating a suspended stint, advancing system time by 24+ hours, and verifying the stint auto-completes with actual time worked.

**Acceptance Scenarios**:

1. **Given** a suspended stint is older than 24 hours, **When** the user loads the dashboard or performs any stint action, **Then** the stint is automatically completed with the actual time worked before suspension
2. **Given** a stint auto-expires, **When** the user next opens the app, **Then** they see a notification that their suspended stint was auto-completed
3. **Given** an auto-expired stint, **When** viewing stint history, **Then** it shows completion type as "auto_suspended" with the time actually worked

---

### User Story 5 - Conflict Resolution with Suspend Option (Priority: P2)

As a user trying to start a new stint while another is paused, I want to see "Suspend and switch" as the primary option in the conflict dialog, so that I can easily handle interruptions.

**Why this priority**: Enhances discoverability of the suspend feature but users can still access it through other UI paths.

**Independent Test**: Can be fully tested by having a paused stint, clicking "Start Stint" on a different project, and verifying the conflict dialog shows "Suspend and switch" as the first/primary option.

**Acceptance Scenarios**:

1. **Given** a user has a paused stint, **When** they try to start a stint on a different project, **Then** a dialog appears with "Suspend and switch" as the primary option
2. **Given** the conflict dialog is shown, **When** the user selects "Suspend and switch", **Then** the paused stint moves to suspended and the new stint starts
3. **Given** the conflict dialog, **When** the user views all options, **Then** they see: "Suspend and switch", "Complete and start new", "Resume current", and "Cancel"

---

### Edge Cases

- What happens when a user tries to suspend a second stint while one is already suspended?
  - System prevents this; user must complete, resume, or abandon the existing suspended stint first
- What happens if the user closes the app with a suspended stint?
  - Suspended stint persists in the database and reappears on next app load
- What happens if a user tries to resume a suspended stint while an active stint is running?
  - System prompts user to pause or stop the active stint first
- What happens to suspended stints during the daily reset at midnight?
  - Suspended stints persist across midnight; they are attributed to their original start date when eventually completed
- What happens if both active and suspended stints exist and user wants to switch the active one?
  - System prevents this; only one suspended stint allowed at a time

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support a new stint status called "suspended" that is distinct from "active", "paused", and "completed"
- **FR-002**: System MUST allow only one active or paused stint per user at any time
- **FR-003**: System MUST allow only one suspended stint per user at any time
- **FR-004**: System MUST allow transitioning a paused stint to suspended status via the "Suspend and switch" option in the conflict dialog (triggered when user starts a stint on a different project)
- **FR-005**: System MUST allow starting a new stint when only a suspended stint exists (no active/paused)
- **FR-006**: System MUST preserve the elapsed time and remaining duration when a stint is suspended
- **FR-007**: System MUST allow resuming a suspended stint to active status when no other active/paused stint exists
- **FR-008**: System MUST NOT count suspended stints toward daily stint totals until they are completed
- **FR-009**: System MUST display suspended stint information on the dashboard with project name, remaining time, and quick actions
- **FR-010**: System MUST provide a "Return to [Project]" action to resume suspended stints
- **FR-011**: System MUST provide an "Abandon" action to discard suspended stints without counting them
- **FR-012**: System MUST mark abandoned stints as excluded from daily totals and statistics
- **FR-013**: System MUST auto-complete suspended stints older than 24 hours with actual time worked, checked on-demand when user loads dashboard or performs stint actions (no background jobs)
- **FR-014**: System MUST record completion type as "auto_suspended" for auto-expired stints
- **FR-015**: System MUST record completion type as "abandoned" for user-abandoned stints
- **FR-016**: System MUST update the conflict resolution dialog to include "Suspend and switch" as the primary option
- **FR-017**: System MUST track when a stint was suspended (timestamp) for expiry calculations
- **FR-018**: System MUST show a confirmation dialog before abandoning a suspended stint

### Key Entities

- **Stint**: Extended with new status value "suspended", new timestamp field for suspension time, and new completion types "auto_suspended" and "abandoned"
- **Stint Status**: Enumeration now includes: active, paused, suspended, completed, interrupted
- **Completion Type**: Enumeration now includes: manual, auto, auto_stale, auto_suspended, abandoned, conflict_resolution. Note: Stints resumed from suspension and completed normally use `manual`; only auto-expired suspended stints use `auto_suspended`

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can suspend a paused stint and start a new one within 3 seconds (2 taps/clicks)
- **SC-002**: Users can return to a suspended stint within 2 seconds (1 tap/click from dashboard)
- **SC-003**: 100% of suspended stints are either resumed, abandoned, or auto-expired within 24 hours (no zombie stints)
- **SC-004**: Daily stint counts accurately reflect only completed work (suspended stints don't inflate counts)
- **SC-005**: Users who experience work interruptions can track all their work without workarounds (no "phantom" stints)
- **SC-006**: Suspended stint indicator is visible on dashboard without scrolling when a suspended stint exists

## Assumptions

1. **Single suspend depth**: Users typically have at most one interruption at a time; nested interruptions (suspending a stint to handle something, then suspending that) are rare enough that limiting to one suspended stint is acceptable
2. **24-hour expiry is sufficient**: Users will either return to their suspended work within a day or no longer need it; 24 hours provides ample buffer for overnight/next-day resumption
3. **Auto-expiry credits work done**: When a suspended stint expires, crediting the actual time worked (rather than discarding it entirely) respects the user's effort while cleaning up stale data
4. **Abandon is rare**: Most users will complete or resume suspended stints; the abandon feature is an escape hatch, not a primary workflow

## Out of Scope

- Multiple suspended stints (stint stacking)
- Transferring suspended stint time to a different project
- Merging interrupted work sessions into a single stint
- Notifications/reminders about suspended stints approaching expiry
- Undo functionality for abandoned stints
