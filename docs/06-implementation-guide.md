# LifeStint - Technical Implementation Guide

**Product Name:** LifeStint  
**Document Version:** 4.0
**Date:** December 2, 2025

---

## Timezone Handling (Future Feature)

> **Note:** Timezone support is planned but not currently implemented. The `user_profiles.timezone` field does not exist yet. The following describes the intended implementation.

### User Timezone Storage

- Captured during registration (browser timezone detected via Intl.DateTimeFormat)
- Will be stored in `user_profiles.timezone` as IANA timezone string (e.g., "America/New_York")
- User can change in settings (dropdown of common timezones)

### Daily Reset Logic

- Scheduled task runs every hour at :00
- Queries user_profiles whose local midnight occurred in the last hour:
  ```sql
  SELECT * FROM user_profiles
  WHERE EXTRACT(HOUR FROM now() AT TIME ZONE timezone) = 0
    AND EXTRACT(MINUTE FROM now() AT TIME ZONE timezone) < 10
  ```
- Resets daily progress counters for matched users
- Triggers daily summary aggregation for previous day

### CSV Export Timestamps

- All timestamps converted to user's timezone
- Format: `YYYY-MM-DD HH:MM:SS` with timezone label in header
- Example: "2025-10-24 09:30:00 (America/New_York)"

### Streak Calculation

- Uses user's timezone to determine "today" and "yesterday"
- Query: `DATE(ended_at AT TIME ZONE v_timezone)`
- **Note:** Stints count towards the day they are completed (ended_at), not when they started
- Grace period: 1 day (can miss 1 day without breaking streak)

### Edge Cases

- **Timezone change:** Daily reset recalculates based on new timezone immediately
- **DST transitions:** PostgreSQL handles automatically with AT TIME ZONE
- **Traveling users:** Timezone can be manually changed in settings
- **Stint spanning midnight:** A stint that starts at 23:30 and ends at 00:30 the next day counts towards the next day (based on ended_at timestamp)

---

## Offline Sync Strategy

> **Note:** Offline capabilities are planned for a future release. The architecture below describes the intended implementation.

### Offline Capabilities (Future)

- Start/pause/resume/stop stints (queued locally)
- View cached dashboard data
- Timer continues in Web Worker using local system clock

### Offline Storage (Future)

- IndexedDB for queued operations (via Dexie.js)
- LocalStorage for last known dashboard state
- Service Worker for app shell caching (PWA)

### Online Reconciliation (Future)

**1. Detecting Offline State:**
- `navigator.onLine` event listener
- Heartbeat API call every 30 seconds
- WebSocket disconnect triggers offline mode

**2. Queuing Operations:**
```javascript
// Offline queue structure
{
  id: 'uuid',
  operation: 'start_stint' | 'stop_stint' | 'pause_stint' | 'resume_stint',
  payload: { project_id, started_at, ... },
  timestamp: Date.now(),
  retries: 0
}
```

**3. Sync on Reconnect:**
- Prioritize: Active stint sync first (prevents conflicts)
- Process queue in chronological order
- Server validates each operation:
  - Check for conflicts (another stint started)
  - Validate timestamps (no future dates)
  - Ensure operation is still valid (project not archived)

**4. Conflict Resolution:**

**Scenario: User starts stint offline on Device A, comes online on Device B, starts different stint**
- Device B syncs, sees Device A has pending start operation
- Server detects conflict: Two start operations without stop
- Resolution strategy: Server-authoritative timestamp
  - Earlier timestamp wins
  - Later operation rejected with 409 Conflict
  - Frontend on Device A shows modal: "Another stint was started while offline. Mark this stint as interrupted?"

**Scenario: User stops stint offline, server already auto-completed it**
- Server compares timestamps
- If manual stop is within 5 minutes of auto-complete time: Accept manual stop (more accurate)
- If manual stop is >5 minutes after auto-complete: Reject with message "Stint already completed"

**Data Loss Prevention:**
- All queued operations persisted in IndexedDB (survives browser close)
- Failed sync operations retried with exponential backoff (max 3 retries)
- After 3 failures: Show "Sync failed" with manual retry button

**Limitations:**
- Cannot create/edit/archive projects offline (requires network)
- Analytics and exports require network
- Real-time sync disabled offline (obviously)

---

## Pause/Resume Mechanics

### Database Field Units

| Field | Unit | Description |
|-------|------|-------------|
| `planned_duration` | minutes | User-configured stint length |
| `paused_duration` | seconds | Cumulative time spent paused |
| `actual_duration` | seconds | Total working time on completion |
| `paused_at` | timestamp | When current pause started |

### State Transitions

```
ACTIVE ──pause──▶ PAUSED ──resume──▶ ACTIVE
   │                 │
   └──stop──▶ COMPLETED ◀──stop──┘
```

### Pause Operation

1. Validate stint is active
2. Set `paused_at = now()`
3. Set `status = 'paused'`
4. Broadcast pause event via Realtime
5. Frontend freezes timer display

### Resume Operation

1. Validate stint is paused
2. Calculate pause duration in seconds: `pause_seconds = EXTRACT(EPOCH FROM (now() - paused_at))`
3. Accumulate: `paused_duration = paused_duration + pause_seconds`
4. Clear: `paused_at = NULL`
5. Set `status = 'active'`
6. Broadcast resume event via Realtime
7. Frontend resumes timer from remaining working time

### Stop While Paused

If user stops a paused stint:
1. Calculate final pause in seconds: `pause_seconds = EXTRACT(EPOCH FROM (now() - paused_at))`
2. Accumulate: `paused_duration = paused_duration + pause_seconds`
3. Calculate actual duration in seconds: `actual_duration = EXTRACT(EPOCH FROM (ended_at - started_at)) - paused_duration`
4. Set `status = 'completed'`

### Working Time Calculation

At any moment, the elapsed working time in seconds is:

```
If status = 'active':
  working_seconds = EXTRACT(EPOCH FROM (now() - started_at)) - COALESCE(paused_duration, 0)

If status = 'paused':
  current_pause_seconds = EXTRACT(EPOCH FROM (now() - paused_at))
  working_seconds = EXTRACT(EPOCH FROM (now() - started_at)) - COALESCE(paused_duration, 0) - current_pause_seconds
```

Timer displays remaining time:
```
remaining_seconds = (planned_duration * 60) - working_seconds
```

---

## Real-Time Conflict Resolution

### Conflict Scenarios

**1. Simultaneous Stint Start (Race Condition):**
- User clicks "Start" on Device A
- Before response, user clicks "Start" on Device B
- Both requests reach server

**Resolution:**
- Server uses optimistic locking on `user_profiles.version` field
- First request increments version, succeeds
- Second request fails with 409 Conflict (version mismatch)
- Device B shows: "You already started a stint on another device. View it?"
- Button opens current active stint

**2. Pause/Resume Conflicts:**
- User pauses on Device A
- Before real-time event propagates, user resumes on Device B

**Resolution:**
- Each pause/resume increments `user_profiles.version` via database trigger
- Server rejects stale operation with 409 Conflict
- Frontend refetches latest stint state
- UI updates to show current state

**3. Stop Conflicts:**
- User stops stint on Device A (network slow)
- Timer reaches 0 on Device B, auto-completes
- Device A's manual stop request arrives after

**Resolution:**
- Server checks if stint already completed
- If completed <5 minutes ago: Accept manual stop notes (merge)
- If completed >5 minutes ago: Reject with "Already completed"

**4. Offline Divergence:**
- Device A offline: Starts Stint X, works for 30 min
- Device B online: Starts Stint Y, completes it
- Device A comes online, tries to sync Stint X

**Resolution:**
- Server sees Device B completed stint after Device A started (based on timestamps)
- Server rejects Device A's stint start
- Frontend shows: "Another stint was started while offline"
- Options:
  - Mark local stint as "interrupted" (preserves data)
  - Discard local stint
- If "interrupted": Local stint saved with `status: 'interrupted'`, doesn't count toward progress

### Implementation

```sql
-- Optimistic locking validation before stint start
CREATE FUNCTION validate_stint_start(p_user_id UUID, p_project_id UUID, p_version INTEGER)
RETURNS TABLE(can_start BOOLEAN, existing_stint_id UUID, conflict_message TEXT) AS $$
DECLARE
  v_current_version INTEGER;
BEGIN
  -- Check version matches (optimistic locking)
  SELECT version INTO v_current_version
  FROM user_profiles WHERE id = p_user_id;

  IF v_current_version IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, 'User not found'::TEXT;
    RETURN;
  END IF;

  IF v_current_version != p_version THEN
    RETURN QUERY SELECT false, NULL::UUID, 'Version mismatch - concurrent operation detected'::TEXT;
    RETURN;
  END IF;

  -- Check no active stints
  IF EXISTS (SELECT 1 FROM stints WHERE user_id = p_user_id AND status IN ('active', 'paused')) THEN
    RETURN QUERY SELECT false, NULL::UUID, 'Active stint exists'::TEXT;
    RETURN;
  END IF;

  -- Can start (caller creates stint via INSERT, trigger increments version)
  RETURN QUERY SELECT true, NULL::UUID, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;
```

---

## Timer Accuracy & Background Tabs

### Problem

- Browser throttles timers in background tabs (1-second resolution becomes 1-minute+)
- User switches tabs or minimizes browser, timer appears to "freeze"

### Solution: Web Worker Timer

**Architecture:**
```
Main Thread (UI)          Web Worker
─────────────────         ────────────
startStint()    ────────> startTimer(duration)
                          ↓
updateUI()      <──────── postMessage({ secondsRemaining })
                          (every 1 second)
                          ↓
stintComplete() <──────── postMessage({ completed: true })
```

**Implementation:**
```javascript
// worker.js
let intervalId;
let endTime;

self.onmessage = (e) => {
  if (e.data.action === 'start') {
    endTime = Date.now() + e.data.duration * 1000;
    intervalId = setInterval(() => {
      const remaining = Math.max(0, endTime - Date.now());
      self.postMessage({ secondsRemaining: Math.floor(remaining / 1000) });
      if (remaining <= 0) {
        clearInterval(intervalId);
        self.postMessage({ completed: true });
      }
    }, 1000);
  } else if (e.data.action === 'stop') {
    clearInterval(intervalId);
  }
};
```

### Server-Side Validation

- Every 60 seconds, frontend syncs with server: `GET /api/stints/active`
- Server returns actual remaining time based on `started_at`
- Frontend corrects timer if drift >5 seconds
- Prevents manipulation (user can't hack local timer)

### Auto-Completion Fallback

- pg_cron job runs every 1 minute (`* * * * *`)
- Queries active stints where working time has reached planned duration:
  ```sql
  SELECT * FROM stints
  WHERE status = 'active'
    AND (EXTRACT(EPOCH FROM (now() - started_at)) - COALESCE(paused_duration, 0))
        >= (planned_duration * 60)
  ```
  - `EXTRACT(EPOCH FROM ...)` returns seconds
  - `paused_duration` is stored in seconds (COALESCE handles NULL safety)
  - `planned_duration` is stored in minutes, multiplied by 60 for comparison
- Auto-completes matched stints by calling `complete_stint()` function
- If browser closed during stint, server still completes on time
- Paused stints are excluded; working time does not accumulate while paused

### Notification Handling

- Timer worker sends `postMessage({ completed: true })` at completion
- Main thread requests notification permission (if not granted)
- Shows browser notification: "Stint completed for [Project Name]! 🎉"
- Clicking notification focuses LifeStint tab (if open) or opens new tab

---

## Data Validation & Constraints

### Client-Side Validation (Immediate Feedback)

```javascript
// Project name validation
const projectNameSchema = z.string()
  .min(1, "Name required")
  .max(100, "Name too long")
  .refine(name => !existingProjects.includes(name), "Name already exists");

// Stint duration validation
const stintDurationSchema = z.number()
  .int()
  .min(5, "Minimum 5 minutes")
  .max(480, "Maximum 480 minutes");

// Expected daily stints validation
const dailyStintsSchema = z.number()
  .int()
  .min(1, "At least 1 stint")
  .max(8, "Maximum 8 stints");
```

### Server-Side Validation (Authoritative)

- All PostgreSQL constraints enforced (see [05-database-schema.md](./05-database-schema.md))
- Database constraints and RLS policies validate all operations:
  - Project name uniqueness (case-insensitive) via unique constraint
  - Numeric ranges via CHECK constraints
  - Foreign key existence via FK constraints
  - Business rules (e.g., no active stint exists) via database functions

### Rate Limiting

```javascript
// Cloudflare rate limits (per user IP)
{
  '/api/stints/start': '60 per hour',    // Prevent stint spam
  '/api/projects': '100 per hour',        // CRUD operations
  '/api/auth/login': '10 per 15 min',    // Brute force protection
  '/api/auth/register': '5 per hour',    // Signup spam
  '/api/export/csv': '20 per hour'       // Export abuse
}

// Additional Supabase-level rate limits
{
  'read_operations': '1000 per minute',
  'write_operations': '200 per minute',
  'realtime_connections': '10 per user'
}
```

### Input Sanitization

- All text inputs sanitized with DOMPurify before rendering
- Markdown/HTML not supported (plain text only)
- SQL injection prevented by Supabase parameterized queries

---

## CSV Export Format

### File Naming

- Format: `LifeStint-Focus-Ledger-YYYY-MM-DD-to-YYYY-MM-DD.csv`
- Example: `LifeStint-Focus-Ledger-2025-10-17-to-2025-10-23.csv`

### CSV Structure

```csv
LifeStint Focus Ledger
User: Sarah Johnson (sarah@example.com)
Timezone: America/New_York
Export Date: 2025-10-24 14:30:00
Date Range: 2025-10-17 to 2025-10-23

Date,Project Name,Started At,Ended At,Planned Duration (min),Actual Duration (min),Pause Duration (min),Completion Type,Notes
2025-10-23,Client Website Redesign,2025-10-23 09:15:00,2025-10-23 10:05:00,50,50,0,auto,
2025-10-23,API Integration Project,2025-10-23 11:00:00,2025-10-23 11:45:00,50,45,5,manual,"Finished task early, documented API endpoints"
2025-10-23,Personal Learning,2025-10-23 14:30:00,2025-10-23 15:20:00,50,50,0,auto,
2025-10-22,Client Website Redesign,2025-10-22 09:00:00,2025-10-22 09:50:00,50,50,0,auto,
...

Summary
Total Stints: 14
Total Focus Time: 11 hours 30 minutes
Total Pause Time: 25 minutes
Completion Rate: 85.7% (12 completed, 2 interrupted)
Projects Worked On: 3
```

### Field Descriptions

- Timestamps in user's timezone (converted from UTC)
- Duration columns in minutes for readability
- Notes column includes user-entered text (escaped for CSV safety)
- Summary section at bottom for quick insights

### Generation Process

1. User clicks "Export CSV" button
2. Frontend queries stints in date range via Supabase client
3. Client converts timestamps to user's timezone
4. Generates CSV string in browser memory
5. Creates downloadable blob and triggers browser download
6. No server-side processing required (fully client-side)

### Professional Formatting

- Clean, readable layout
- Header with user context
- Summary statistics at bottom
- Client-ready (no internal IDs or technical jargon)

---

**Related Documents:**
- [04-technical-architecture.md](./04-technical-architecture.md) - Architecture context
- [05-database-schema.md](./05-database-schema.md) - Database schema reference
- [03-feature-requirements.md](./03-feature-requirements.md) - Feature requirements

