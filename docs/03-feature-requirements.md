# LifeStint - Feature Requirements

**Product Name:** LifeStint  
**Document Version:** 3.0  
**Date:** October 24, 2025

---

## 1. Project Organization

**Purpose:** Frictionless project management directly from dashboard.

### Capabilities

**Create Project:**
- Click "+ New Project" button on dashboard
- Modal appears with fields:
  - Project Name (required, 2-60 characters)
  - Expected Daily Stints (default: 2, range: 1-12)
  - Custom Stint Duration (optional, default: 120 minutes, range: 5-480 minutes)
  - Color Tag (optional, 8 preset colors)
- Validation: No duplicate names within user account
- Action: Creates project in "active" state

**Edit Project:**
- Click edit icon on project card
- Modal with editable fields (same as creation)
- Cannot change project ID or creation date
- Validation: Name uniqueness, valid ranges
- Action: Updates project, recalculates daily progress if daily stint expectation changed

**Activate/Deactivate:**
- Toggle switch on project card
- Active projects shown first in dashboard
- Inactive projects accessible via "Inactive" tab in dashboard
- Cannot deactivate project with active stint
- Deactivated projects excluded from daily totals and streaks

**Archive Project:**
- Archive option in edit modal (replaces delete)
- Confirmation dialog: "Archive [Project Name]? Past stints will be preserved for analytics."
- Archived projects hidden from dashboard, accessible via "View Archived" link
- All stint data preserved for analytics and exports

### Constraints

- Project names must be unique within user account
- Projects with active stints cannot be archived

---

## 2. Stint Management System

**Purpose:** Structure focused work with single-session enforcement and precise timing.

### Start Stint

- Click "Start" button on project card
- Confirmation modal if another project has active stint: "End current stint to start new one?"
- System checks server-side for active stints (prevents race conditions)
- Creates stint record with:
  - `started_at`: Server timestamp (UTC)
  - `planned_duration`: Project's custom duration or default 120 minutes
  - `status`: "active"
- Broadcasts real-time event to all user's connected devices
- Starts countdown timer on all devices

### Pause/Resume

- "Pause" button visible during active stint
- Pause action:
  - Sets `paused_at` to server timestamp
  - Sets `status` to "paused"
  - Timer freezes; working time stops accumulating
- Resume action:
  - Calculates pause duration in seconds: `now() - paused_at`
  - Adds to cumulative `paused_duration` (seconds)
  - Clears `paused_at`
  - Sets `status` to "active"
  - Timer resumes from remaining working time
- Pause/resume events broadcast in real-time
- Paused stints do not auto-complete; user must manually resume or stop

### Stop Stint Manually

- "Stop" button visible during active stint
- Completion modal appears with:
  - Notes field: "Add notes about this stint?" (0-500 characters, optional)
  - **"Complete"** button (primary action)
- Creates completion record:
  - `ended_at`: Server timestamp
  - `actual_duration`: Calculated from started_at to ended_at minus pause duration
  - `completion_type`: "manual"
  - `notes`: User input (optional)
- On completion:
  - Progress updates on dashboard immediately
  - Celebration animation if daily goal reached

### Auto-Complete

- Triggers when working time reaches planned duration (active stints only)
- Working time formula (in seconds): `(now - started_at) - paused_duration`
- Comparison: `working_time_seconds >= planned_duration_minutes * 60`
- Browser notification: "Stint auto-completed for [Project Name]! 🎉"
- Auto-completes with:
  - `ended_at`: Server timestamp
  - `actual_duration`: Working time in seconds
  - `completion_type`: "auto"
- If browser closed, server-side cron completes stint at planned end time
- Paused stints do not auto-complete

### Offline & Reconnection Handling

- If network drops during active stint, local timer continues
- On reconnect, syncs with server state:
  - If server stint still active: resumes real-time sync normally
  - If server stint was auto-completed (timer expired or cron): shows completion notification
  - If server has different active stint: shows conflict resolution dialog
- All recorded time counts toward daily progress (network issues don't invalidate work)

### Single Active Stint Enforcement

- Server-side validation on stint start: checks for existing active stints for user
- If found, returns 409 Conflict with existing stint details
- Frontend shows resolution dialog:
  - Option 1: "End current stint and start new one"
  - Option 2: "Continue current stint"
  - Option 3: "Cancel"
- Race condition handling: Server uses optimistic locking (version field on user record)
- Cross-device: Real-time broadcasts ensure all devices show same active stint
- **Conflict resolution completion:** When ending a stint via "End current stint and start new one":
  - Shows quick completion modal with notes field
  - `completion_type`: "conflict_resolution"

### Timer Accuracy

- Frontend: Countdown timer in Web Worker (continues in background tabs)
- Backend: Server-side scheduled task checks for auto-completions every 1 minute (pg_cron minimum interval)
- Sync: Every 60 seconds, frontend syncs with server to correct drift
- Offline: Local timer continues, reconciles on reconnect with server-authoritative time

### Midnight Boundary Behavior

- Stints that span midnight are attributed to their **start date**
- Example: Stint started at 11:30 PM, ends 12:30 AM → counts toward the start date
- Daily progress ("X of Y stints today") uses `DATE(started_at)` in user's timezone
- Streak calculation uses start date: a stint started before midnight counts for that day
- This ensures predictable behavior for users working late-night sessions

### Time Unit Standardization

> **Note:** Duration fields require standardization. See [Issue #28](https://github.com/aesir-tecnologia/202501/issues/28) for tracking.

All duration fields in the database use **seconds** as the base unit:
- `planned_duration`: Stored in seconds (e.g., 7200 for 2 hours)
- `paused_duration`: Stored in seconds
- `actual_duration`: Stored in seconds

User-facing display converts to minutes/hours as appropriate.

### Completion Types

**Completion Types** (stored in `completion_type` field):
- `manual`: User clicked "Stop" and completed normally
- `auto`: Timer reached planned duration
- `interrupted`: Ended via conflict dialog to start new stint on different project

### Constraints

- Only 1 active stint per user across all devices
- Unlimited paused stints allowed (users can pause multiple projects)
- Minimum stint duration: 5 minutes (300 seconds)
- Maximum stint duration: 480 minutes (28,800 seconds)
- **Minimum working time for completion:** 1 minute (60 seconds) - stints stopped before 1 minute of actual working time are discarded to prevent accidental micro-stints from polluting analytics
- Maximum 50 stints per project per day (anti-abuse)
- **Global daily limit:** Maximum 200 stints per user per day across all projects (anti-abuse)
- **Cooldown period:** Minimum 10 seconds between stint completions (prevents rapid-fire stint creation)

---

## 3. Real-Time Dashboard

**Purpose:** Eliminate friction between deciding to focus and starting work.

### Layout

- Grid of project cards (1 column on mobile and desktop)
- Tab navigation: Active (default), Inactive, Archived
- "+ New Project" button in section header

### Project Card Contents

- Project name with color accent bar (left edge, uses project color tag)
- Status pill indicating current state:
  - "Ready" (active project, can start stint)
  - "Running" (this project has active stint)
  - "Paused" (this project's stint is paused)
  - "Busy" (another project has active stint)
  - "Inactive" (project is deactivated)
- Stint duration badge: "Xh Ym / stint" showing configured stint length
- Daily progress section:
  - Label: "Daily progress"
  - Segmented progress bar (visual representation)
  - Text: "X/Y today" showing completed vs expected stints
  - "+X extra" badge when exceeding daily goal
  - "Met" badge when daily goal is reached
- Last stint time: "2 hours ago" (relative) - *See [Issue #30](https://github.com/aesir-tecnologia/202501/issues/30)*
- Drag handle for reordering projects (desktop only)
- Action buttons:
  - "Start" play button (if no active stint)
  - "Stop" + "Pause" buttons + countdown timer (if this project has active stint)
  - "Resume" + countdown timer (if this project's stint is paused)
  - Settings icon (opens edit modal)
  - Activate/deactivate toggle switch

### Active Stint Highlighting

- Pulsing green dot indicator next to countdown timer
- Countdown timer displayed in MM:SS format
- Pause/Stop buttons prominently displayed
- Timer badge shows "Running" or "Paused" state with color coding
- Other project cards show disabled Start button with "Busy" status pill

### Real-Time Updates

- Supabase Realtime subscription to user's stints
- Events trigger immediate UI updates:
  - Stint started: Update active project card, disable other Start buttons
  - Stint paused: Show Resume button, update pause time every second
  - Stint completed: Celebration animation, update progress badge
  - Progress reset: At midnight user's timezone, reset "X of Y" to "0 of Y"
- Optimistic updates: UI responds immediately, rollback if server rejects
- Reconnection: On network restore, fetches latest state and reconciles

### Daily Progress Reset

- Triggered at midnight in user's timezone (stored in user preferences)
- Backend scheduled task runs every hour, checks for users whose local midnight passed
- Resets daily progress counters to 0
- Preserves stint history for analytics
- Frontend subscribes to reset events, updates UI immediately

### Empty States

- No projects: "Start your first project" with "+ New Project" CTA
- No stints today: "Start your first stint of the day" with motivation quote
- All projects inactive: "Activate a project to get started"

### Error States

- Network offline: Banner "Working offline. Changes will sync when connected."
- Server error: Banner "Connection issues. Retrying..." with manual retry button
- Conflict detected: Modal with resolution options (described in Stint Management)

### Performance

- Dashboard loads in <2 seconds on 3G
- Real-time updates appear within 500ms of server event
- Smooth animations (60fps) on project card updates

---

## 4. Progress Analytics

**Purpose:** Provide motivation and professional evidence with minimal reporting overhead.

### Analytics View (Separate Page)

**Daily Summary:**
- Total stints completed today across all projects
- Total focus time (sum of actual durations)
- Average stint duration
- Projects worked on today (list with stint counts)
- Daily goal progress: "Met goal on 3 of 5 active projects"

**Weekly Summary:**
- 7-day overview with bar chart (stints per day)
- Total weekly stints and focus time
- Longest streak this week
- Most productive day
- Breakdown by project (top 5 by stint count)

**Streak Tracking:**
- Current streak: "🔥 12 day streak! Keep it going!"
- Longest streak all-time
- Streak definition: At least 1 completed stint per day
- Grace period: 1 day (can miss 1 day without breaking streak)
- Timezone-aware: Streak calculated using user's timezone

### Constraints

- Analytics limited to last 90 days in free tier, unlimited in Pro
- Charts use cached data (refreshes every 5 minutes)

---

## 5. Focus Ledger Export

**Purpose:** Provide professional evidence of focused work with minimal reporting overhead.

### Export Capabilities

- "Export CSV" button in analytics view
- Generates CSV with columns:
  - Date (YYYY-MM-DD in user's timezone)
  - Project Name
  - Started At (YYYY-MM-DD HH:MM:SS in user's timezone)
  - Ended At
  - Planned Duration (minutes)
  - Actual Duration (minutes)
  - Pause Duration (minutes)
  - Completion Type
  - Notes
- Filename: `LifeStint-Focus-Ledger-[StartDate]-[EndDate].csv`
- Date range selector: Last 7 days, Last 30 days, Last 90 days, Custom
- Professional formatting: Clean, client-ready presentation
- Download triggers immediately (no email)

### Constraints

- CSV exports limited to 10 per month in free tier, unlimited in Pro

---

## 6. User Authentication & Security

### Registration

- Email + password via Supabase Auth
- Password requirements:
  - Minimum 8 characters
  - At least 1 uppercase, 1 lowercase, 1 number
  - Common passwords blocked (10,000 most common)
- Email verification required before dashboard access
- Verification email sent immediately with 24-hour expiration
- Welcome email after verification with getting started guide

### Login

- Email + password
- "Remember me" checkbox (30-day session vs 24-hour)
- Rate limiting: 5 failed attempts per email per hour
- After 5 failures: CAPTCHA required
- After 10 failures: 1-hour lockout

### Password Recovery

- "Forgot password" link on login
- Email with secure reset link (6-hour expiration)
- Rate limiting: 3 reset emails per email per day
- Password reset requires new password (can't reuse last 3)

### Session Management

- JWT tokens with refresh rotation
- Automatic token refresh before expiration
- Device tracking: Shows "Active sessions" in settings
- "Log out all devices" option

### Security Measures

- HTTPS enforced on all endpoints
- Supabase encryption at rest and in transit
- Rate limiting on all authenticated endpoints
- No sensitive data in localStorage (tokens only in httpOnly cookies)
- CSRF protection via double-submit cookie pattern

---

**Related Documents:**
- [02-user-personas-flows.md](./02-user-personas-flows.md) - User experience flows
- [05-database-schema.md](./05-database-schema.md) - Database structure for these features
- [06-implementation-guide.md](./06-implementation-guide.md) - Technical implementation details

