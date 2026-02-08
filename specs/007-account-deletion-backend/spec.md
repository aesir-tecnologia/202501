# Feature Specification: Account Deletion Backend

**Feature Branch**: `007-account-deletion-backend`
**Created**: 2026-02-02
**Status**: Draft
**Source**: GitHub Issue #43 - [Phase 8] Implement account deletion backend

## Clarifications

### Session 2026-02-06

- Q: Should users receive a reminder email before permanent deletion? → A: Yes - send reminder 7 days before the 30-day grace period expires. Reminder is best-effort; delivery failure does not delay deletion.

### Session 2026-02-03

- Q: Should users with pending deletion have full access during grace period? → A: Full access - users retain complete functionality during 30-day period
- Q: What happens to audit logs when user is permanently deleted? → A: Keep audit logs forever with anonymized user reference for compliance
- Q: Should deletion request be accepted if confirmation email fails? → A: Accept request, retry email delivery in background
- Q: Is email re-entry sufficient for re-authentication, or password required? → A: Password required - adds password field to deletion confirmation flow
- Q: Should active stints be auto-saved or discarded on deletion request? → A: Block deletion until user manually ends active stint
- Q: What observability signals for deletion operations? → A: Structured logs only (timestamps, user IDs, operation type)
- Q: Should rate limiting be applied to deletion requests? → A: No rate limiting - one active request per account is natural limit
- Q: Track documentation sync requirement in spec? → A: Yes - add explicit requirement to update roadmap doc
- Q: What deletion mechanism after 30-day grace period? → A: Hard delete - actually DELETE rows from database. User profile, projects, stints, preferences all removed. Timestamps only in audit log.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Request Account Deletion (Priority: P1)

A user who wants to leave the platform navigates to Settings and requests account deletion. After confirming their intent by re-entering their email address and password, the system acknowledges the request and sends a confirmation email. The user's account enters a 30-day grace period before permanent deletion.

**Why this priority**: This is the core functionality - without the ability to request deletion, the entire feature is non-functional. It's also a GDPR compliance requirement.

**Independent Test**: Can be fully tested by a user clicking "Delete Account" in settings, confirming via email and password entry, and verifying the confirmation email is received and account is marked for deletion.

**Acceptance Scenarios**:

1. **Given** an authenticated user on the Settings page with no active stints, **When** they click "Delete Account" and confirm by entering their email address and password correctly, **Then** the system records the deletion request, sends a confirmation email, and displays a "deletion scheduled" message.

2. **Given** an authenticated user on the Settings page, **When** they click "Delete Account" but enter an incorrect email address or password, **Then** the system rejects the request and displays an error message.

3. **Given** a user who has already requested deletion, **When** they attempt to request deletion again, **Then** the system informs them that deletion is already scheduled and shows the remaining grace period.

4. **Given** an authenticated user with an active (running) stint, **When** they attempt to request account deletion, **Then** the system blocks the request and prompts them to end the active stint first.

---

### User Story 2 - Cancel Account Deletion (Priority: P2)

A user who previously requested account deletion changes their mind during the 30-day grace period. They log in, navigate to Settings, and cancel the pending deletion. Their account is restored to normal status immediately.

**Why this priority**: Allowing users to recover from accidental deletion requests is essential for user experience and reduces support burden. However, it depends on P1 being implemented first.

**Independent Test**: Can be tested by requesting deletion, then canceling it, and verifying the account functions normally afterward.

**Acceptance Scenarios**:

1. **Given** a user with a pending deletion request within the 30-day grace period, **When** they navigate to Settings and click "Cancel Deletion", **Then** the deletion request is removed and the account continues functioning normally.

2. **Given** a user with a pending deletion request, **When** they log in, **Then** they see a prominent notice about the scheduled deletion with remaining days and an option to cancel.

3. **Given** a user with a pending deletion request, **When** they use the application normally (create projects, start stints, etc.), **Then** all features work without restriction during the grace period.

---

### User Story 3 - Automatic Permanent Deletion (Priority: P3)

After the 30-day grace period expires, the system automatically and permanently deletes all user data, including projects, stints, and preferences. The associated authentication account is also removed. Audit log entries are retained with anonymized user references.

**Why this priority**: This is the final cleanup step that ensures GDPR compliance. It runs automatically without user interaction after P1 is complete.

**Independent Test**: Can be tested by fast-forwarding time (in a test environment) past the 30-day window and verifying all user data is permanently removed.

**Acceptance Scenarios**:

1. **Given** a deletion request older than 30 days, **When** the scheduled cleanup job runs, **Then** all user data (projects, stints, preferences, profile) is permanently deleted.

2. **Given** a deletion request older than 30 days, **When** the scheduled cleanup job runs, **Then** the user's authentication account is removed from the auth system.

3. **Given** a permanently deleted user, **When** they attempt to log in with their old credentials, **Then** authentication fails with a generic "invalid credentials" message.

4. **Given** a permanently deleted user, **When** an admin queries the audit log, **Then** deletion events are visible with anonymized user reference (e.g., "user_deleted_<hash>").

5. **Given** a deletion request that is 23 days old (7 days before expiry), **When** the scheduled reminder job runs, **Then** the system sends a reminder email to the user warning that permanent deletion will occur in 7 days unless they cancel.

6. **Given** a deletion request that was canceled before the 7-day reminder window, **When** the scheduled reminder job runs, **Then** no reminder email is sent (the request no longer exists).

---

### Edge Cases

- What happens when a user requests deletion and then their session expires before receiving confirmation?
  - The deletion request is still processed; user sees status on next login.
- How does the system handle deletion requests for users with active (running) stints?
  - Deletion request is blocked until user manually ends the active stint.
- What happens if the cleanup job fails mid-deletion?
  - Job should be idempotent; partial deletions are retried on next run.
- How does the system handle re-registration with the same email after permanent deletion?
  - Treated as a new user; no data recovery possible.
- What happens if confirmation email delivery fails?
  - Deletion request is still accepted; email delivery is retried in background.
- What happens if the 7-day reminder email fails to deliver?
  - Permanent deletion proceeds on schedule regardless; reminder is best-effort and does not affect the deletion timeline.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow authenticated users to request account deletion from the Settings page
- **FR-002**: System MUST require users to re-enter their email address AND password before accepting a deletion request (re-authentication confirmation)
- **FR-003**: System MUST send a confirmation email when a deletion request is submitted; email delivery failures are handled by the email provider (Resend) via built-in retries and do not block the request
- **FR-003a**: The deletion confirmation email MUST include the user's account ID (user_id) so they can reference it later for audit trail lookups via support
- **FR-004**: System MUST implement a 30-day grace period before permanent deletion
- **FR-005**: System MUST allow users to cancel a pending deletion request during the grace period
- **FR-006**: System MUST display the deletion status and remaining grace period to users with pending deletions
- **FR-007**: System MUST automatically perform permanent deletion after the grace period expires
- **FR-008**: Permanent deletion MUST hard-delete (not soft-delete) all user data including user profile (with embedded preferences), projects, stints, user streaks, and daily summaries - rows are removed from database, not just marked as deleted
- **FR-009**: Permanent deletion MUST remove the user's authentication account
- **FR-010**: System MUST record all deletion events (request, cancellation, completion) in the deletion_audit_log database table using structured entries with event type, anonymized user reference, and timestamp; audit entries MUST be retained indefinitely and survive user data deletion
- **FR-011**: System MUST block deletion requests if user has an active (running) stint and prompt them to end it first
- **FR-012**: System MUST allow full application access during the 30-day grace period (no restrictions)
- **FR-014**: System MUST send a reminder email 7 days before permanent deletion, notifying the user that their account and all data will be permanently removed unless they cancel; email delivery failures MUST NOT block or delay the scheduled deletion

### Key Entities

- **User Profile**: Extended with one deletion-tracking field:
  - `deletion_requested_at` (nullable) - When deletion was requested, NULL if not pending
  - Note: Row is hard-deleted after grace period (no `deleted_at` column needed on this table)
- **Audit Log**: Records deletion events (request, cancellation, completion) with:
  - Event type, timestamp, anonymized user reference, and completion timestamp
  - Contains the authoritative `deleted_at` timestamp for compliance records
  - Retained indefinitely (not deleted with user data)
- **Related Data (hard-deleted via CASCADE on user profile)**:
  - Projects - all user's projects permanently removed
  - Stints - all user's stints permanently removed
  - User Streaks - all user's streak records permanently removed
  - Daily Summaries - all user's daily summaries permanently removed

### Out of Scope

- Rate limiting on deletion requests (natural one-per-account limit is sufficient)
- Metrics or alerting for deletion operations (structured logs are sufficient)
- Configurable grace period per user (fixed 30 days for all users)
- UI redesign for deletion flow (existing modal is sufficient, only adding password field)
- Soft-delete approach (data is hard-deleted, not hidden via RLS)
- Preserving anonymized user data for analytics (complete erasure for GDPR compliance)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete the deletion request process in under 60 seconds
- **SC-002**: Deletion confirmation email is dispatched within 5 minutes of request; delivery failures are retried by Resend but do not block the deletion flow
- **SC-003**: Users can cancel a pending deletion with a single action from the Settings page
- **SC-004**: All user data is permanently removed within 24 hours after the 30-day grace period expires
- **SC-005**: Zero user-identifiable data remnants exist in the system after permanent deletion (verified by FR-010 audit trail compliance)
- **SC-006**: System supports processing at least 100 deletion requests per day without performance degradation

## Assumptions

- The existing Settings page UI for account deletion (confirmation modal with email verification) requires only the addition of a password field
- Email delivery requires Resend API setup (free tier sufficient for development); RESEND_API_KEY must be configured as a Supabase Edge Function secret before US1 acceptance testing. Resend handles delivery retries natively.
- The application uses Supabase Auth for authentication, which supports user deletion via admin API
- Foreign key constraints with CASCADE DELETE exist for user-related tables (projects, stints, user_streaks, daily_summaries)
- A job scheduling mechanism (pg_cron or equivalent) is available for the cleanup process
- The 30-day grace period is a fixed business requirement (not configurable per user)
- Supabase Auth supports password verification for the re-authentication requirement
