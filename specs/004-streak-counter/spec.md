# Feature Specification: Streak Counter Completion

**Feature Branch**: `004-streak-counter`
**Created**: December 15, 2025
**Status**: Draft
**Input**: User description: "Finish implementation of Streak Counter from development roadmap"

## Clarifications

### Session 2025-12-15

- Q: Where should the streak be displayed - on project cards or in a dedicated dashboard area? → A: Dashboard header/banner area (dedicated prominent location, not on individual project cards)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Current Streak on Dashboard (Priority: P1)

As a user, I want to see my current streak prominently displayed when I open the dashboard, so I can immediately know how many consecutive days I've been working without having to navigate to the analytics page.

**Why this priority**: This is the core visibility feature. Users need immediate feedback about their streak to stay motivated. Currently streaks are hidden in the analytics page, reducing their motivational impact.

**Independent Test**: Can be fully tested by logging in and viewing the dashboard after completing stints on consecutive days. Delivers immediate streak visibility without any other feature changes.

**Acceptance Scenarios**:

1. **Given** I have completed at least one stint on each of the last 5 days, **When** I open the dashboard, **Then** I see "🔥 5 day streak" displayed prominently in the dashboard header area
2. **Given** I have never completed a stint, **When** I open the dashboard, **Then** I see no streak indicator (not "0 day streak")
3. **Given** I completed stints yesterday but not today, **When** I open the dashboard, **Then** I see my current streak count (streak is still active until end of grace period)

---

### User Story 2 - Real-Time Streak Update on Stint Completion (Priority: P2)

As a user, when I complete a stint, I want to see my streak update immediately without refreshing the page, so I get instant feedback that my streak has been maintained or extended.

**Why this priority**: Real-time feedback reinforces positive behavior. Without this, users might not realize their streak was updated until they refresh or navigate away and back.

**Independent Test**: Can be tested by starting and completing a stint while watching the streak display. The number should update immediately upon stint completion.

**Acceptance Scenarios**:

1. **Given** my current streak is 3 days and I haven't completed a stint today, **When** I complete my first stint today, **Then** my streak display immediately updates to show "4 day streak"
2. **Given** my current streak is 4 days and I already completed a stint today, **When** I complete another stint today, **Then** my streak display remains at "4 day streak" (no duplicate counting)
3. **Given** I have no current streak (0 days), **When** I complete my first stint ever, **Then** my streak display immediately shows "🔥 1 day streak"

---

### User Story 3 - Grace Period for Streak Preservation (Priority: P3)

As a user, I want a 1-day grace period for my streak, so that missing a single day doesn't completely reset my progress if I work the next day.

**Why this priority**: Grace periods reduce frustration and account for real-life circumstances (illness, emergencies, rest days). This is a quality-of-life feature that builds on the core streak display.

**Independent Test**: Can be tested by completing stints for 5 days, skipping 1 day, then completing a stint on day 7. The streak should continue rather than reset to 1.

**Acceptance Scenarios**:

1. **Given** I have a 5-day streak and last stint was 2 days ago (1 day gap), **When** I view the dashboard, **Then** my streak still shows as 5 days (within grace period)
2. **Given** I have a 5-day streak and last stint was 2 days ago, **When** I complete a stint today, **Then** my streak becomes 6 days (grace period preserved the streak)
3. **Given** I have a 5-day streak and last stint was 3 days ago (2 day gap), **When** I view the dashboard, **Then** my streak shows as 0 days (grace period exceeded, streak reset)
4. **Given** I'm within the grace period, **When** I view the dashboard, **Then** I see a visual indicator that my streak is "at risk" or "grace period active"

---

### User Story 4 - Longest Streak Display (Priority: P3)

As a user, I want to see my longest streak ever alongside my current streak, so I have a personal record to beat and additional motivation.

**Why this priority**: Gamification element that provides long-term motivation. Builds on the core streak display without being essential to it.

**Independent Test**: Can be tested by building a streak, letting it reset, and verifying the longest streak is preserved while current streak shows the new count.

**Acceptance Scenarios**:

1. **Given** my longest streak was 10 days and current streak is 3 days, **When** I view the dashboard, **Then** I see both "🔥 3 day streak" and "Best: 10 days"
2. **Given** my current streak (7 days) exceeds my longest streak (5 days), **When** I complete a stint extending to 8 days, **Then** my longest streak updates to 8 days
3. **Given** I've never had a streak, **When** I view the dashboard, **Then** the longest streak area is hidden or shows nothing

---

### Edge Cases

- What happens when the user's timezone changes (e.g., traveling)? System uses the user's registered timezone for "day" calculation; timezone changes require profile update
- How does the system handle a stint that starts before midnight and ends after? The stint counts toward the day it was completed (ended_at date)
- What if the user completes a stint exactly at midnight? The stint counts toward the new day
- What happens if the database and client clocks are out of sync? Server time is authoritative; client displays may lag briefly but sync on next query
- What if a user has completed stints but all were interrupted (not completed)? Only completed stints count toward streaks; interrupted stints do not

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display the user's current streak count in a dedicated header/banner component on the dashboard (not on individual project cards)
- **FR-002**: System MUST calculate streaks based on consecutive calendar days with at least one completed stint per day
- **FR-003**: System MUST update the streak display in real-time when a stint is completed, without requiring page refresh
- **FR-004**: System MUST implement a 1-day grace period where missing a single day does not break the streak if the user completes a stint the following day
- **FR-005**: System MUST track and display the user's longest streak alongside their current streak
- **FR-006**: System MUST visually indicate when a streak is "at risk" (within grace period but no stint completed today)
- **FR-007**: System MUST use the user's registered timezone for determining calendar day boundaries
- **FR-008**: System MUST hide streak indicators when the user has no streak (0 days) rather than showing "0 day streak"
- **FR-009**: System MUST automatically update the longest streak record when current streak exceeds it
- **FR-010**: System MUST count a stint toward the calendar day when it was completed (ended_at timestamp), not when it was started

### Key Entities

- **User Streak**: Represents a user's streak data including current consecutive day count, longest streak ever achieved, date of last completed stint, and streak status (active, at-risk, broken)
- **Stint**: An existing entity; the completed stints determine streak calculation. Key attribute is the completion timestamp (ended_at)
- **Calendar Day**: A logical day boundary determined by the user's timezone, used for streak counting

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can see their current streak within 2 seconds of loading the dashboard
- **SC-002**: Streak display updates within 1 second of stint completion without page refresh
- **SC-003**: 100% of streak calculations correctly account for the 1-day grace period
- **SC-004**: Users with active streaks see accurate streak counts that match their actual consecutive days of activity
- **SC-005**: Streak visibility on dashboard increases user engagement with the streak feature (baseline: analytics page visits for streak viewing)

## Assumptions

- Users already have a registered timezone stored in their profile (detected at registration per Phase 1)
- The existing `user_streaks` database table schema is sufficient or can be extended
- The existing stint completion flow can be extended to trigger streak updates
- The analytics page streak calculation logic provides a reference implementation
- TanStack Query cache invalidation patterns from existing composables can be applied to streak data
