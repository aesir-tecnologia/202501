# Feature Specification: Migrate Supabase Edge Functions to Nuxt Client

**Feature Branch**: `001-migrate-edge-functions`
**Created**: 2025-11-19
**Status**: Draft
**Input**: User description: "Migrate all Supabase's edge functions to Nuxt client"

## Clarifications

### Session 2025-11-20

- Q: Auto-completion trigger mechanism - should it use client-side periodic checks, server-side cron job, or hybrid approach? → A: Server-side cron job (scheduled PostgreSQL function call every 2 minutes)
- Q: Observability requirements - what level of logging, metrics, or error tracking is needed for stint operations? → A: Client-side error logging for failed operations (validation errors, network errors, database errors)
- Q: Authentication token expiry handling - how should the system handle token expiration during operations? → A: Rely on Supabase client automatic token refresh (already built-in)
- Q: Network failure retry policy - should failed operations automatically retry, and if so, what retry strategy? → A: No automatic retry - user sees error immediately and must manually retry operation
- Q: Server-side cron execution interval - what exact interval should the auto-completion cron job run at? → A: Every 2 minutes (balanced responsiveness and efficiency)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start Work Sessions (Priority: P1)

Users need to start timed work sessions (stints) for their projects with automatic conflict detection and validation happening entirely on the client side.

**Why this priority**: Starting stints is the core functionality of the application. Without this, users cannot track their work sessions at all. This must work flawlessly as it's the entry point for all stint tracking.

**Independent Test**: Can be fully tested by attempting to start a stint for a project and verifying the stint is created with correct duration, or receiving appropriate error messages for conflicts (already active stint) or validation failures (invalid duration).

**Acceptance Scenarios**:

1. **Given** user has no active stints, **When** user starts a stint for a project with default duration, **Then** stint is created as active with 120-minute planned duration
2. **Given** user has an active stint, **When** user attempts to start another stint, **Then** user receives error message with details of the existing active stint
3. **Given** user starts a stint with custom duration (e.g., 90 minutes), **When** stint is created, **Then** stint has the specified planned duration
4. **Given** user attempts to start stint with duration outside valid range (5-480 minutes), **When** validation runs, **Then** user receives clear error about duration constraints
5. **Given** user tries to start stint for archived project, **When** project validation runs, **Then** user receives error that project is not available

---

### User Story 2 - Control Active Sessions (Priority: P1)

Users need to pause, resume, and stop their active work sessions with state transitions validated on the client to ensure data integrity.

**Why this priority**: These are critical operations for managing work sessions. Users must be able to interrupt their work (pause), continue later (resume), or end sessions early (stop). Without these, the application is unusable for real-world work patterns.

**Independent Test**: Can be fully tested by starting a stint, then performing pause/resume/stop operations and verifying correct state transitions and time tracking.

**Acceptance Scenarios**:

1. **Given** user has an active stint, **When** user pauses the stint, **Then** stint status changes to paused and elapsed time is preserved
2. **Given** user has a paused stint, **When** user resumes the stint, **Then** stint status changes to active and timer continues from where it was paused
3. **Given** user has an active or paused stint, **When** user stops the stint, **Then** stint status changes to completed with accurate total duration and manual completion type
4. **Given** user attempts to pause an already paused stint, **When** state validation runs, **Then** user receives error that stint is not in correct state
5. **Given** user attempts to resume a completed stint, **When** state validation runs, **Then** user receives error that operation is not allowed

---

### User Story 3 - View Active Session (Priority: P2)

Users need to quickly check if they have an active or paused work session across different pages and devices.

**Why this priority**: While important for user experience, this is informational only. Users can work around its temporary absence by checking their stint list or attempting to start a new stint.

**Independent Test**: Can be fully tested by starting a stint, then querying for active stint and verifying correct stint is returned, or null when no active stint exists.

**Acceptance Scenarios**:

1. **Given** user has an active stint, **When** user checks for active stint, **Then** the active stint details are returned
2. **Given** user has a paused stint, **When** user checks for active stint, **Then** the paused stint details are returned
3. **Given** user has no active or paused stints, **When** user checks for active stint, **Then** null is returned with no error
4. **Given** user has multiple completed stints but no active ones, **When** user checks for active stint, **Then** null is returned

---

### User Story 4 - Automatic Session Completion (Priority: P2)

Active work sessions should automatically complete when their planned duration expires, without requiring manual intervention.

**Why this priority**: This provides convenience and ensures data accuracy, but users can manually stop stints if needed. The system remains functional without this automation.

**Independent Test**: Can be fully tested by starting a stint with short duration (e.g., 5 minutes), waiting for duration to expire, and verifying stint automatically completes with correct completion type.

**Acceptance Scenarios**:

1. **Given** active stint has reached its planned end time, **When** periodic check runs, **Then** stint is automatically completed with 'auto' completion type
2. **Given** multiple active stints across different users have expired, **When** batch completion runs, **Then** all expired stints are completed independently
3. **Given** active stint has not yet reached planned end time, **When** periodic check runs, **Then** stint remains active and unchanged
4. **Given** stint was manually stopped before planned end time, **When** periodic check runs, **Then** already completed stint is not modified

---

### User Story 5 - Timer Synchronization (Priority: P3)

Client-side timers should periodically synchronize with server-calculated remaining time to correct any drift from sleep mode, time zone changes, or clock adjustments.

**Why this priority**: Nice to have for accuracy, but not critical. Minor timer drift is acceptable, and manual stop/restart can work around issues. This is a polish feature.

**Independent Test**: Can be fully tested by starting a stint, simulating clock drift on client, calling sync check, and verifying server returns correct remaining time.

**Acceptance Scenarios**:

1. **Given** active stint with client timer drifted by 10 seconds, **When** sync check runs, **Then** server returns correct remaining time and drift amount
2. **Given** paused stint, **When** sync check runs, **Then** server returns remaining time at pause moment regardless of current time
3. **Given** active stint with client timer accurate within 5 seconds, **When** sync check runs, **Then** server indicates no correction needed
4. **Given** sync check for completed stint, **When** validation runs, **Then** error is returned indicating stint is not active

---

### Edge Cases

- What happens when user loses internet connection while starting a stint? User should receive clear network error immediately (no automatic retry), stint should not be created, and user must manually retry when connection is restored.
- What happens when two browser tabs attempt to start a stint simultaneously? One should succeed, the other should receive conflict error with details of the newly created stint.
- What happens when user's clock is significantly wrong (hours off)? Timer sync should detect large drift and correct client timer.
- What happens when database function returns unexpected format? Client-side validation should detect invalid data and return clear error rather than crashing.
- What happens when stint auto-completion fails for some stints but succeeds for others? Each stint should be processed independently with failures logged but not blocking other completions.
- What happens when user attempts operations on stints that don't belong to them? Client-side functions should enforce user ID matching through RLS policies and return not found errors.
- What happens when project is archived between starting a stint and the stint completing? Stint operations should still work as they reference project by ID, not by archived status.
- What happens when authentication token refresh fails? User should receive auth error and be redirected to login page, with operation not executed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST move all stint state management logic from Supabase Edge Functions to client-side Nuxt composables
- **FR-002**: System MUST validate stint start requests on client including project existence, active stint conflicts, and duration constraints (5-480 minutes)
- **FR-003**: System MUST enforce user authentication and authorization through existing RLS policies on direct database operations
- **FR-004**: System MUST preserve exact same business logic for stint state transitions (active → paused → active → completed)
- **FR-005**: System MUST maintain optimistic locking using user version to prevent concurrent stint creation
- **FR-006**: System MUST return detailed conflict information when user attempts to start stint while another is active
- **FR-007**: System MUST validate planned duration against project custom duration or system default (120 minutes)
- **FR-008**: System MUST preserve pause/resume functionality with accurate time tracking including paused_duration
- **FR-009**: System MUST support manual stint completion with optional notes (max 500 characters)
- **FR-010**: System MUST maintain auto-completion logic via server-side cron job that calls PostgreSQL auto-complete function every 2 minutes
- **FR-011**: System MUST provide timer synchronization endpoint that calculates server-side remaining time
- **FR-012**: System MUST handle both active and paused stints differently in remaining time calculations
- **FR-013**: System MUST remove all seven Supabase Edge Functions after migration is complete and verified
- **FR-014**: System MUST translate PostgreSQL errors to user-friendly error messages (e.g., "23505" → "A stint is already active")
- **FR-015**: System MUST maintain identical response formats for success and error cases to avoid breaking existing UI
- **FR-016**: System MUST perform all validations before database operations to minimize round trips
- **FR-017**: System MUST query active stint status by checking stints table for status in ['active', 'paused']
- **FR-018**: System MUST handle race conditions during concurrent stint creation attempts gracefully
- **FR-019**: System MUST preserve all existing RPC function calls for pause, resume, and complete operations
- **FR-020**: System MUST continue using get_active_stint, pause_stint, resume_stint, complete_stint, and validate_stint_start database functions
- **FR-021**: System MUST log client-side errors for all failed stint operations including validation failures, network errors, and database errors

### Non-Functional Requirements

- **NFR-001**: System MUST log detailed error information for debugging including operation type, error message, user context, and timestamp
- **NFR-002**: Error logs MUST NOT contain sensitive information such as authentication tokens or personally identifiable user data
- **NFR-003**: Logging mechanism MUST NOT impact user experience (async, non-blocking)
- **NFR-004**: System MUST NOT automatically retry failed user-initiated operations (start, pause, resume, stop) to prevent duplicate operations
- **NFR-005**: Network errors MUST be displayed to user immediately with clear message and manual retry option

### Key Entities

- **Stint**: Work session with status (active/paused/completed), timestamps (started_at, paused_at, completed_at), duration tracking (planned_duration, paused_duration), completion type (manual/auto/interrupted), and optional notes
- **User Profile**: Contains version number for optimistic locking to prevent concurrent stint creation
- **Project**: Has custom_stint_duration field that overrides system default of 120 minutes when specified
- **Stint Constraints**: Duration limits (5-480 minutes), max total duration (240 minutes), max notes length (500 characters)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All existing stint functionality continues to work identically from user perspective with same success/error behaviors
- **SC-002**: Stint start operation completes in under 1 second for successful cases, including validation and conflict detection
- **SC-003**: Concurrent stint creation attempts from multiple tabs/devices are handled without data corruption, with exactly one succeeding
- **SC-004**: Edge function code is completely removed from supabase/functions/ directory after successful migration
- **SC-005**: Client-side validation catches 100% of invalid requests before database operations (invalid duration, missing project ID, etc.)
- **SC-006**: Timer synchronization corrects drift exceeding 5 seconds within next sync cycle (60 seconds)
- **SC-007**: All seven edge functions are replaced with equivalent client-side logic: stints-start, stints-stop, stints-pause, stints-resume, stints-active, stint-auto-complete, stint-sync-check
- **SC-008**: Error messages remain user-friendly and specific, not exposing database error codes or stack traces
- **SC-009**: Existing tests continue to pass without modification after migration
- **SC-010**: No new CORS configuration or authentication issues are introduced by removal of edge functions

## Assumptions

1. Existing PostgreSQL RPC functions (validate_stint_start, pause_stint, resume_stint, complete_stint, get_active_stint) remain unchanged and available
2. Row Level Security policies on stints table are correctly configured to enforce user ownership
3. Client always has valid authentication token when performing stint operations, with Supabase client handling automatic token refresh
4. User profiles table maintains version column for optimistic locking
5. Projects table has custom_stint_duration column (nullable integer) for project-specific duration overrides
6. Database constraints (planned_duration CHECK, status enum) remain in place to catch invalid data
7. Existing UI code expects current response formats from app/lib/supabase/stints.ts functions
8. TanStack Query is already set up for optimistic updates and cache invalidation
9. Auto-completion will be triggered by server-side cron job that calls the auto-complete PostgreSQL function every 2 minutes
10. Timer drift threshold of 5 seconds is acceptable tolerance for sync corrections
11. STINT_CONSTRAINTS constants are defined in both client and edge functions with identical values
12. Network errors and timeouts are handled by existing error handling infrastructure with immediate user feedback (no automatic retries for mutations)

## Dependencies

- PostgreSQL RPC functions: validate_stint_start, pause_stint, resume_stint, complete_stint, get_active_stint
- Row Level Security policies on stints, projects, and user_profiles tables
- Existing validation schemas in app/schemas/stints.ts
- TanStack Query setup in app/composables/useStints.ts
- Supabase client configuration with proper authentication
- Database constraints on stints table for data integrity

## Out of Scope

- Modifying any PostgreSQL RPC functions or their behavior
- Changing database schema or adding new tables/columns
- Updating UI components or pages (only data layer migration)
- Adding new stint features or changing business logic
- Performance optimizations beyond maintaining current behavior
- Migration of non-stint-related edge functions (if any exist)
- Changes to authentication or authorization mechanisms
- Modifications to TanStack Query configuration or patterns
- Database migration for historical stint data
