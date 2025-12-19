# LifeStint - User Settings Reference

**Purpose:** Complete list of all user-configurable settings for the settings page implementation.

**Document Version:** 1.1
**Date:** December 19, 2025

---

## Account Settings

### Email Address
- **Type:** Text (email)
- **Default:** Set during registration
- **Constraints:**
  - Must be valid email format (regex: `^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$`)
  - Must be unique across all users
  - Email verification required after change
- **Validation:** Server-side email format validation
- **Storage:** `users.email`

### Full Name
- **Type:** Text
- **Default:** `null` (optional)
- **Constraints:**
  - No length limit specified (reasonable limit: 100 characters)
- **Storage:** `users.full_name`

### Password
- **Type:** Password
- **Default:** Set during registration
- **Constraints:**
  - Minimum 8 characters
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number
  - Cannot reuse last 3 passwords
  - Common passwords blocked (10,000 most common)
- **Validation:** Client-side and server-side validation
- **Change Flow:** Requires current password verification

### Timezone
- **Type:** Select (dropdown)
- **Default:** `'UTC'` (detected from browser on registration)
- **Constraints:**
  - Must be valid IANA timezone (e.g., "America/New_York", "Europe/London")
  - Validated against PostgreSQL `pg_timezone_names` table
- **Impact:** Affects daily reset timing, CSV export timestamps, streak calculations
- **Storage:** `users.timezone`

---

## Preferences

### Default Stint Duration
- **Type:** Number (minutes)
- **Default:** `120` minutes
- **Constraints:**
  - Range: 5-480 minutes
  - Integer only
- **Usage:** Used for new projects unless project has custom duration
- **Storage:** `user_preferences.default_stint_duration`

### Celebration Sound
- **Type:** Boolean (toggle)
- **Default:** `true` (enabled)
- **Description:** Plays sound effect when daily goal is reached
- **Storage:** `user_preferences.celebration_sound`

### Celebration Animation
- **Type:** Boolean (toggle)
- **Default:** `true` (enabled)
- **Description:** Shows confetti animation when daily goal is reached
- **Storage:** `user_preferences.celebration_animation`

### Desktop Notifications
- **Type:** Boolean (toggle)
- **Default:** `true` (enabled)
- **Description:** Browser notifications for stint completion
- **Note:** Requires browser permission (requested on first stint start)
- **Storage:** `user_preferences.desktop_notifications`

### Weekly Email Digest
- **Type:** Boolean (toggle)
- **Default:** `false` (disabled)
- **Description:** Weekly summary email sent every Monday at 8 AM UTC
- **Storage:** `user_preferences.weekly_email_digest`

### Theme
- **Type:** Select (radio buttons or dropdown)
- **Default:** `'system'` (follows OS preference)
- **Options:**
  - `'light'` - Light mode
  - `'dark'` - Dark mode
  - `'system'` - Follow system preference
- **Constraints:** Must be one of the three valid options
- **Storage:** `user_preferences.theme`

---

## Project Settings (Per Project)

### Project Name
- **Type:** Text
- **Default:** None (required)
- **Constraints:**
  - Length: 1-100 characters
  - Must be unique within user's projects (case-insensitive)
- **Storage:** `projects.name`

### Expected Daily Stints
- **Type:** Number (integer)
- **Default:** `2` stints per day
- **Constraints:**
  - Range: 1-8 stints per day
  - Integer only
- **Usage:** Used to calculate daily progress ("X of Y stints today")
- **Storage:** `projects.expected_daily_stints`

### Custom Stint Duration
- **Type:** Number (minutes, optional)
- **Default:** `null` (uses user's default stint duration)
- **Constraints:**
  - Range: 5-480 minutes (if specified)
  - Integer only
  - Optional (can be null)
- **Usage:** Overrides default stint duration for this project only
- **Storage:** `projects.custom_stint_duration`

### Color Tag
- **Type:** Select (color picker)
- **Default:** `null` (no color)
- **Options:** 8 preset colors
  - `'red'`
  - `'orange'`
  - `'yellow'`
  - `'green'`
  - `'blue'`
  - `'purple'`
  - `'pink'`
  - `'gray'`
- **Constraints:** Must be one of the 8 valid colors or null
- **Usage:** Visual identifier in dashboard project cards
- **Storage:** `projects.color_tag`

### Project Status (Active/Inactive)
- **Type:** Boolean (toggle)
- **Default:** `true` (active)
- **Description:** Active projects shown first, inactive projects in collapsed section
- **Constraints:** Cannot deactivate project with active stint
- **Storage:** `projects.is_active`

---

## Security & Privacy

### Active Sessions
- **Type:** Read-only list
- **Description:** Shows all active login sessions across devices
- **Actions:**
  - View session details (device, location, last active)
  - Log out individual session
  - Log out all devices

### Data Export (GDPR)
- **Type:** Action button
- **Description:** Export all user data as JSON
- **Includes:**
  - User profile (email, name, timezone)
  - All projects
  - All stints (with full history)
  - User preferences
  - Daily summaries
  - Streak data
- **Format:** JSON file download
- **Purpose:** GDPR compliance (Right to Data Portability)

### Analytics Opt-Out
- **Type:** Boolean (toggle)
- **Default:** `false` (analytics enabled)
- **Description:** Opt-out of analytics tracking (Mixpanel events)
- **Note:** Mentioned in privacy considerations but not explicitly in schema
- **Storage:** May need to add `user_preferences.analytics_opt_out` field

### Account Deletion
- **Type:** Action button (destructive)
- **Description:** Permanently delete account and all data
- **Process:**
  - Confirmation modal with password verification
  - Soft delete (marked deleted, not purged immediately)
  - Scheduled cleanup after 30 days
  - Email confirmation sent
- **Impact:** All projects, stints, preferences, and analytics data deleted

---

## Subscription & Billing (Post-MVP)

### Subscription Tier
- **Type:** Read-only display
- **Options:**
  - Free Tier: 2 active projects, 90-day analytics history, 10 CSV exports/month
  - Pro Tier ($1.99/month): Unlimited projects, unlimited history, unlimited exports, custom branding
- **Actions:** Upgrade to Pro, Manage billing, Cancel subscription

### CSV Export Limits
- **Type:** Read-only display
- **Free Tier:** 10 exports per month
- **Pro Tier:** Unlimited
- **Display:** "X of 10 exports used this month" (free tier)

---

## Notification Settings

### Browser Notification Permission
- **Type:** Status display + request button
- **States:**
  - Not requested: Show "Enable notifications" button
  - Granted: Show "Notifications enabled" status
  - Denied: Show "Notifications blocked" with instructions
- **Note:** Browser-level permission, not stored in database

---

## Constraints Summary

### Numeric Ranges
- **Default Stint Duration:** 5-480 minutes
- **Custom Stint Duration:** 5-480 minutes (optional)
- **Expected Daily Stints:** 1-8 per day
- **Project Name Length:** 1-100 characters

### Boolean Defaults
- **Celebration Sound:** `true`
- **Celebration Animation:** `true`
- **Desktop Notifications:** `true`
- **Weekly Email Digest:** `false`
- **Project Active Status:** `true`

### Enum/Select Options
- **Theme:** `'light'`, `'dark'`, `'system'` (default: `'system'`)
- **Color Tags:** 8 colors: `'red'`, `'orange'`, `'yellow'`, `'green'`, `'blue'`, `'purple'`, `'pink'`, `'gray'`

### Required Fields
- **Email:** Required, unique, verified
- **Timezone:** Required, defaults to UTC
- **Project Name:** Required (1-100 chars), unique per user
- **Expected Daily Stints:** Required, defaults to 2

### Optional Fields
- **Full Name:** Optional
- **Custom Stint Duration:** Optional (null = use default)
- **Color Tag:** Optional (null = no color)

---

## Settings Page Structure Recommendations

### Section 1: Account
- Email (with change/verification flow)
- Full Name
- Password (change button → modal)
- Timezone (dropdown)

### Section 2: Preferences
- Default Stint Duration (number input with slider)
- Theme (radio buttons: Light / Dark / System)
- Celebration Sound (toggle)
- Celebration Animation (toggle)
- Desktop Notifications (toggle + permission status)
- Weekly Email Digest (toggle)

### Section 3: Security
- Active Sessions (list with logout options)
- Password Change (button → modal)

### Section 4: Privacy
- Data Export (button → download JSON)
- Analytics Opt-Out (toggle, if implemented)
- Account Deletion (destructive button → confirmation modal)

### Section 5: Subscription
- Current Plan (Free/Pro)
- Usage Limits (projects, exports)
- Upgrade/Manage Billing buttons

---

## Database Schema References

### `users` Table
- `email` (TEXT, UNIQUE, NOT NULL)
- `full_name` (TEXT, nullable)
- `timezone` (TEXT, NOT NULL, DEFAULT 'UTC')

### `user_preferences` Table
- `default_stint_duration` (INTEGER, NOT NULL, DEFAULT 120, CHECK: 5-480)
- `celebration_sound` (BOOLEAN, NOT NULL, DEFAULT true)
- `celebration_animation` (BOOLEAN, NOT NULL, DEFAULT true)
- `desktop_notifications` (BOOLEAN, NOT NULL, DEFAULT true)
- `weekly_email_digest` (BOOLEAN, NOT NULL, DEFAULT false)
- `theme` (TEXT, NOT NULL, DEFAULT 'system', CHECK: 'light'|'dark'|'system')

### `projects` Table (Project Settings)
- `name` (TEXT, NOT NULL, CHECK: length 1-100, UNIQUE per user)
- `expected_daily_stints` (INTEGER, NOT NULL, DEFAULT 2, CHECK: 1-8)
- `custom_stint_duration` (INTEGER, nullable, CHECK: 5-480 if not null)
- `color_tag` (TEXT, nullable, CHECK: one of 8 colors or null)
- `is_active` (BOOLEAN, NOT NULL, DEFAULT true)

---

## Implementation Notes

1. **Settings Page Location:** `/settings` route
2. **Real-time Updates:** Changes to preferences should apply immediately (no page refresh)
3. **Validation:** Client-side validation with Zod schemas, server-side validation via PostgreSQL constraints
4. **Error Handling:** Show toast notifications for validation errors or save failures
5. **Loading States:** Show loading indicators during save operations
6. **Success Feedback:** Show toast notification on successful save

---

**Related Documents:**
- [05-database-schema.md](05-database-schema.md) - Database schema with all constraints
- [03-feature-requirements.md](03-feature-requirements.md) - Feature requirements including settings
- [07-development-roadmap.md](07-development-roadmap.md) - Phase 8: Settings & Preferences implementation

