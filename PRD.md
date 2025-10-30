# LifeStint - Product Requirements Document

**Product Name:** LifeStint  
**Tagline:** Small sprints. Big results.  
**Document Version:** 3.0  
**Date:** October 24, 2025  
**Status:** Ready for Development

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [Solution Overview](#solution-overview)
4. [Target Audience](#target-audience)
5. [Core Features](#core-features)
6. [User Experience](#user-experience)
7. [Technical Architecture](#technical-architecture)
8. [Data Models](#data-models)
9. [Technical Specifications](#technical-specifications)
10. [Development Roadmap](#development-roadmap)
11. [Success Metrics](#success-metrics)
12. [Risks and Mitigations](#risks-and-mitigations)
13. [Competitive Analysis](#competitive-analysis)
14. [Appendices](#appendices)

---

## Executive Summary

LifeStint is a productivity tracking application that helps busy professionals maintain focus across multiple projects through a "stint-based" approach—predetermined focused work sessions with single-session enforcement to prevent multitasking.

**The Core Innovation:** Unlike traditional time trackers that log work retroactively or Pomodoro apps that ignore project context, LifeStint combines project-level focus tracking with professional reporting capabilities while maintaining zero administrative overhead.

**Key Value Propositions:**
- **Zero Administrative Overhead:** One-click start/stop without categories, tags, or setup friction
- **Single Active Focus:** Technical enforcement prevents multitasking and context switching
- **Professional Analytics:** Client-ready reports demonstrating focus quality without surveillance
- **Habit Building:** Progress visualization and streak tracking motivate consistent productive work

**Target Market:** Independent professionals—freelancers, consultants, and remote workers managing 2-6 active projects who need to justify billing rates and demonstrate productivity to clients.

**Business Model:** Freemium SaaS with free tier (2 projects, basic analytics) and Pro tier ($12/month for unlimited projects, advanced analytics, and custom branding on exports).

---

## Problem Statement

### The Core Problem

Knowledge workers, particularly independent professionals, struggle with three interconnected challenges:

1. **Focus Fragmentation:** Managing 3-6 concurrent projects creates constant context switching, with each switch costing 15-25 minutes of productive time
2. **Productivity Opacity:** Clients equate "few meetings" with "no work," forcing professionals to defend their value
3. **Tool Inadequacy:** Existing solutions either micromanage (detailed time tracking) or oversimplify (basic Pomodoro timers)

### Impact Quantification

- Average consultant loses 2.1 hours daily to context switching (RescueTime 2024 study)
- 67% of independent consultants report client skepticism about remote work productivity
- Time tracking tools add 15-20 minutes of daily administrative overhead (Toggl user surveys)

### Current Solutions Fall Short

**Time Trackers (Toggl, Harvest):**
- Administrative burden of categorizing every work session
- Surveillance-oriented reporting that damages client trust
- No focus quality measurement

**Pomodoro Apps (Forest, Focus Keeper):**
- Generic 25-minute sessions ignore project needs
- No project-level progress tracking
- No professional reporting capabilities

**Project Management (Asana, Trello):**
- Task completion focus, not work quality
- No time/focus tracking integration
- Overhead of maintaining task hierarchies

### The Gap LifeStint Fills

A tool that tracks **project-level focus sessions** with **professional reporting** while maintaining **zero administrative overhead**.

---

## Solution Overview

### Core Concept: The Stint

A **stint** is a predetermined focused work session (default 50 minutes, customizable per project) where:
- User commits to single-project focus
- Timer runs with pause/resume capability
- System enforces single active stint across all devices
- Completion is tracked with precise timing

### How It Works

1. **Setup:** Create projects with expected daily stints (default: 2 per day)
2. **Execute:** Start stint from dashboard, work with timer running, stop manually or auto-complete
3. **Track:** View daily progress, maintain streaks, export professional reports
4. **Demonstrate:** Share focus ledger (CSV export) with clients showing consistent work quality

### Key Differentiators

- **Project-Aware Focus:** Unlike Pomodoro apps, stints understand project context
- **Single Active Session:** Technical enforcement prevents multitasking
- **Professional Reporting:** Client-ready exports without surveillance metrics
- **Zero Overhead:** No categories, tags, or pre-work required
- **Cross-Device Real-Time:** Seamless sync with conflict resolution

---

## Target Audience

### Primary Persona: Sarah the Client-Billable Consultant

**Demographics:**
- Age: 28-35
- Role: Independent software/tech consultant
- Location: Remote/hybrid, urban areas
- Income: $80-150K annually from consulting

**Context:**
- Manages 3-6 concurrent client projects
- Bills by retainer or time-and-materials
- Works from home office or coworking spaces
- Uses MacBook Pro + iPhone/iPad

**Goals:**
- Show consistent focus to clients without surveillance
- Defend premium rates with credible work evidence
- Reduce context switching to improve output quality
- Maintain work-life boundaries with clear session structure

**Pain Points:**
- Clients equate "few meetings" with "no work"
- Timesheets feel accusatory and damage trust
- Context switching destroys momentum and creativity
- No credible way to demonstrate focus quality
- Pomodoro timers don't account for project needs

**Behaviors:**
- Checks phone during work (breaks focus unintentionally)
- Struggles to say "no" to interruptions
- Feels guilty about billing hours without "proof"
- Uses 2-3 productivity apps, none work well together

### Secondary Persona: Marcus the Agency Remote Worker

**Demographics:**
- Age: 25-32
- Role: Designer/developer at distributed agency
- Reports to remote manager with minimal oversight

**Unique Needs:**
- Demonstrate productivity to manager without micromanagement
- Track billable vs. non-billable work
- Build portfolio of focused work for performance reviews

### Out of Scope (for MVP)

- Enterprise teams needing shared dashboards
- Students seeking study session tracking
- Professionals tracking non-knowledge work (e.g., manufacturing)

---

## Core Features

### 1. Project Organization

**Purpose:** Frictionless project management directly from dashboard.

**Capabilities:**

**Create Project:**
- Click "+ New Project" button on dashboard
- Modal appears with fields:
  - Project Name (required, 1-100 characters)
  - Expected Daily Stints (default: 2, range: 1-8)
  - Custom Stint Duration (optional, default: 50 minutes, range: 10-120 minutes)
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
- Inactive projects collapsed in "Inactive Projects" section
- Cannot deactivate project with active stint
- Deactivated projects excluded from daily totals and streaks

**Archive Project:**
- Archive option in edit modal (replaces delete)
- Confirmation dialog: "Archive [Project Name]? Past stints will be preserved for analytics."
- Archived projects hidden from dashboard, accessible via "View Archived" link
- All stint data preserved for analytics and exports

**Constraints:**
- Maximum 25 active projects per user (free tier: 2)
- Project names must be unique within user account
- Projects with active stints cannot be archived

---

### 2. Stint Management System

**Purpose:** Structure focused work with single-session enforcement and precise timing.

**Start Stint:**
- Click "Start" button on project card
- Confirmation modal if another project has active stint: "End current stint to start new one?"
- System checks server-side for active stints (prevents race conditions)
- Creates stint record with:
  - `started_at`: Server timestamp (UTC)
  - `planned_duration`: Project's custom duration or default 50 minutes
  - `status`: "active"
- Broadcasts real-time event to all user's connected devices
- Starts countdown timer on all devices

**Pause/Resume:**
- "Pause" button visible during active stint
- Pause records:
  - `paused_at`: Server timestamp
  - Total pause duration accumulated separately
- Resume restores countdown from remaining time
- Pause events broadcast in real-time

**Stop Stint Manually:**
- "Stop" button visible during active stint
- Optional notes modal: "Add notes about this stint?" (0-500 characters)
- Creates completion record:
  - `ended_at`: Server timestamp
  - `actual_duration`: Calculated from started_at to ended_at minus pause duration
  - `completion_type`: "manual"
  - `notes`: User input (optional)
- Progress updates on dashboard immediately
- Celebration animation if daily goal reached

**Auto-Complete:**
- Auto-complete when total stint duration is over 4 hours. Running or paused.
- Browser notification: "Stint auto-completed for [Project Name]! 🎉"
- Auto-completes with:
  - `ended_at`: started_at + planned_duration
  - `completion_type`: "auto"
  - Grace period: 30 seconds for user to add notes
- If browser closed, server-side cron completes stint at planned end time

**Interruption Handling:**
- If network drops during active stint, local timer continues
- On reconnect, syncs with server state:
  - If server has no active stint: marks local stint as "interrupted", preserves data
  - If server has different active stint: shows conflict resolution dialog
- User can manually mark stint as "interrupted" with reason (0-200 characters)
- Interrupted stints don't count toward daily progress but preserved in analytics

**Single Active Stint Enforcement:**
- Server-side validation on stint start: checks for existing active stints for user
- If found, returns 409 Conflict with existing stint details
- Frontend shows resolution dialog:
  - Option 1: "End current stint and start new one"
  - Option 2: "Continue current stint"
  - Option 3: "Cancel"
- Race condition handling: Server uses optimistic locking (version field on user record)
- Cross-device: Real-time broadcasts ensure all devices show same active stint

**Timer Accuracy:**
- Frontend: Countdown timer in Web Worker (continues in background tabs)
- Backend: Server-side scheduled task checks for auto-completions every 30 seconds
- Sync: Every 60 seconds, frontend syncs with server to correct drift
- Offline: Local timer continues, reconciles on reconnect with server-authoritative time

**Constraints:**
- Only 1 active stint per user across all devices
- Minimum stint duration: 10 minutes
- Maximum stint duration: 120 minutes
- Maximum total stint duration: 4 hours
- Maximum 50 stints per project per day (anti-abuse)

---

### 3. Real-Time Dashboard

**Purpose:** Eliminate friction between deciding to focus and starting work.

**Layout:**
- Grid of project cards (1 on mobile and desktop)
- "Inactive Projects" collapsible section below
- "+ New Project" button in top right

**Project Card Contents:**
- Project name with color indicator
- Daily progress badge: "X of Y stints today" with visual progress bar
- Current streak: "🔥 5 day streak" (if >0)
- Last stint time: "2 hours ago" (relative)
- Action buttons:
  - "Start" (if no active stint)
  - "Stop" + "Pause" + timer (if this project has active stint)
  - "Resume" + paused time (if this project paused)
  - Edit icon
  - Activate/deactivate toggle

**Active Stint Highlighting:**
- Card expands vertically
- Pulsing green border animation
- Large countdown timer (MM:SS format)
- Pause/Stop buttons prominently displayed
- All other cards show "Stop current stint to start new one" instead of Start button

**Real-Time Updates:**
- Supabase Realtime subscription to user's stints
- Events trigger immediate UI updates:
  - Stint started: Update active project card, disable other Start buttons
  - Stint paused: Show Resume button, update pause time every second
  - Stint completed: Celebration animation, update progress badge
  - Progress reset: At midnight user's timezone, reset "X of Y" to "0 of Y"
- Optimistic updates: UI responds immediately, rollback if server rejects
- Reconnection: On network restore, fetches latest state and reconciles

**Daily Progress Reset:**
- Triggered at midnight in user's timezone (stored in user preferences)
- Backend scheduled task runs every hour, checks for users whose local midnight passed
- Resets daily progress counters to 0
- Preserves stint history for analytics
- Frontend subscribes to reset events, updates UI immediately

**Empty States:**
- No projects: "Start your first project" with "+ New Project" CTA
- No stints today: "Start your first stint of the day" with motivation quote
- All projects inactive: "Activate a project to get started"

**Error States:**
- Network offline: Banner "Working offline. Changes will sync when connected."
- Server error: Banner "Connection issues. Retrying..." with manual retry button
- Conflict detected: Modal with resolution options (described in Stint Management)

**Performance:**
- Dashboard loads in <2 seconds on 3G
- Real-time updates appear within 500ms of server event
- Smooth animations (60fps) on project card updates

---

### 4. Progress Analytics

**Purpose:** Provide motivation and professional evidence with minimal reporting overhead.

**Analytics View (Separate Page):**

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
- Streak definition: At least 1 completed stint per day (not interrupted)
- Grace period: 1 day (can miss 1 day without breaking streak)
- Timezone-aware: Streak calculated using user's timezone

**Focus Ledger Export:**
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

**Constraints:**
- Analytics limited to last 90 days in free tier, unlimited in Pro
- CSV exports limited to 10 per month in free tier, unlimited in Pro
- Charts use cached data (refreshes every 5 minutes)

---

### 5. User Authentication & Security

**Registration:**
- Email + password via Supabase Auth
- Password requirements:
  - Minimum 8 characters
  - At least 1 uppercase, 1 lowercase, 1 number
  - Common passwords blocked (10,000 most common)
- Email verification required before dashboard access
- Verification email sent immediately with 24-hour expiration
- Welcome email after verification with getting started guide

**Login:**
- Email + password
- "Remember me" checkbox (30-day session vs 24-hour)
- Rate limiting: 5 failed attempts per email per hour
- After 5 failures: CAPTCHA required
- After 10 failures: 1-hour lockout

**Password Recovery:**
- "Forgot password" link on login
- Email with secure reset link (6-hour expiration)
- Rate limiting: 3 reset emails per email per day
- Password reset requires new password (can't reuse last 3)

**Session Management:**
- JWT tokens with refresh rotation
- Automatic token refresh before expiration
- Device tracking: Shows "Active sessions" in settings
- "Log out all devices" option

**Security Measures:**
- HTTPS enforced on all endpoints
- Supabase encryption at rest and in transit
- Rate limiting on all authenticated endpoints
- No sensitive data in localStorage (tokens only in httpOnly cookies)
- CSRF protection via double-submit cookie pattern

---

## User Experience

### Onboarding Flow

**Step 1: Registration**
- Land on marketing page with "Start Free" CTA
- Registration modal: Email, password, confirm password
- Agree to Terms and Privacy Policy (checkboxes)
- Submit → Email verification notice

**Step 2: Email Verification**
- Check inbox for verification email
- Click verification link → Redirects to dashboard
- Welcome modal appears

**Step 3: Welcome Modal**
- Slide 1: "Welcome to LifeStint! Let's get you started."
- Slide 2: Animated explanation of stints (30-second Lottie animation)
  - "A stint is a focused work session on one project"
  - "Choose your duration, start your timer, stay focused"
  - "Track progress, build streaks, demonstrate your work"
- Slide 3: "Create your first project"
  - Embedded project creation form (same as normal modal)
  - Pre-filled example: "Client Website Redesign"
  - User can edit or keep example
- Slide 4: "Start your first stint"
  - Shows new project card with pulsing "Start" button
  - User clicks Start → Begins 50-minute stint
  - Modal: "Great! Now focus for 50 minutes. We'll notify you when done."
- Slide 5: "You're all set!"
  - Quick tips:
    - "Pause if you need a break"
    - "Stop early if you finish your task"
    - "Check Analytics to see your progress"
  - "Got it!" button closes modal

**Guided First Stint:**
- If user stops before 10 minutes: Tooltip "Stints work best with at least 10 minutes of focus"
- At 25 minutes: Encouraging notification "Halfway there! Keep going 💪"
- At completion: Celebration animation with confetti
- Modal: "Congrats on your first stint! 🎉"
  - Shows summary: Project, duration, time
  - "View Analytics" button → Analytics page
  - "Start Another Stint" button → Dashboard

**Dashboard Tour (Optional, Skippable):**
- Tooltips highlight:
  1. Project cards: "Your projects live here"
  2. Progress badges: "Track daily goals"
  3. Active stint: "Only one stint at a time"
  4. "+ New Project" button: "Add more projects anytime"
  5. Analytics link: "View your progress and export reports"
- "Skip Tour" always visible

**Empty State After Onboarding:**
- If user doesn't create project during onboarding: Shows empty state with "+ New Project" CTA

---

### Daily Usage Flow

**Morning Routine:**
1. Open LifeStint (web app or PWA)
2. Dashboard loads with today's progress (all at 0 if new day)
3. Review project cards, decide which to work on first
4. Click "Start" on chosen project
5. Confirmation modal (if needed): "You're about to start a 50-minute stint on [Project]. Ready?"
6. Begin work with timer running in corner

**During Stint:**
- Timer visible in browser tab title: "(42:15) LifeStint - [Project Name]"
- Can switch browser tabs, timer continues
- If need break: Click "Pause", do break, click "Resume"
- If task completed early: Click "Stop", optionally add notes

**End of Stint:**
- Auto-complete: Browser notification + dashboard updates
- Manual stop: Notes modal (optional) → Dashboard updates
- Celebration if daily goal reached: Confetti animation + sound effect (can disable in settings)
- Progress badge updates: "2 of 2 stints today ✓"

**Afternoon Routine:**
- Switch to different project
- Repeat start → work → complete cycle
- Check progress badges throughout day

**Evening Wrap-Up:**
- Review dashboard to see completed stints
- Check streaks: "🔥 5 day streak maintained!"
- Optional: Export CSV for client update

---

### Weekly Review Flow

**Sunday Evening (Typical Use):**
1. Click "Analytics" in navigation
2. Review weekly summary:
   - Total stints: 14 (down from last week's 18)
   - Total focus time: 11.5 hours
   - Longest streak: 5 days
3. Observe bar chart showing daily pattern:
   - Notice: Wednesday had only 1 stint (identify improvement area)
4. Review project breakdown:
   - Client A: 6 stints (on track)
   - Client B: 4 stints (below expected 6)
   - Personal Project: 4 stints (unexpected, good!)
5. Click "Export CSV" → Select "Last 7 days"
6. Download Focus Ledger
7. Optional: Attach to weekly client update email with message: "Here's my focus time for the week"
8. Review project expectations:
   - Edit Client B: Increase daily stints from 2 to 3
   - Deactivate completed Personal Project

**Insight Gained:**
- Wednesday disruption identified → Schedule protected focus time
- Client B needs more attention → Adjust schedule
- Personal project making unexpected progress → Celebrate!

---

### Multi-Device Experience

**Scenario: Start on Desktop, Continue on Mobile**

1. **Desktop (9 AM):** Start stint on "Client Website" project → 50-minute timer begins
2. **Leave desk (9:30 AM):** Close laptop (timer continues via server)
3. **Open phone (9:35 AM):** LifeStint PWA loads
   - Real-time sync: Dashboard shows "Client Website" stint active
   - Timer shows 15:00 remaining (accurate despite device switch)
   - Can pause/resume/stop from phone
4. **Return to desk (9:50 AM):** Open laptop
   - Real-time sync: Shows stint ended at 10:00 AM (auto-completed on server)
   - Dashboard updated with completed stint

**Conflict Resolution:**
- If network was offline on mobile and user started different stint locally
- On reconnect: Dialog "Conflict detected"
  - Shows: Desktop stint (Client Website, 25 min remaining) vs Mobile stint (Personal Project, 5 min elapsed)
  - Options: Keep desktop stint, Keep mobile stint, Mark both interrupted
  - User chooses → Server resolves, broadcasts to all devices

---

### Accessibility Considerations

**WCAG 2.1 Level AA Compliance:**

**Visual:**
- Color contrast ratio ≥4.5:1 for all text
- Focus indicators on all interactive elements (3px solid outline)
- Color not sole indicator (progress uses text + visual bar)
- Font size minimum 16px, scalable to 200% without layout breaking

**Keyboard Navigation:**
- Tab order follows visual flow
- All actions accessible via keyboard:
  - Enter/Space: Activate buttons
  - Escape: Close modals
  - Arrow keys: Navigate project cards
- Skip links: "Skip to main content", "Skip to navigation"

**Screen Readers:**
- Semantic HTML (nav, main, article, section)
- ARIA labels on all icon buttons
- Live regions for timer updates (aria-live="polite")
- Status announcements: "Stint started", "Stint completed"

**Cognitive:**
- Clear, simple language (8th grade reading level)
- Consistent UI patterns (modals always same structure)
- Visual feedback for all actions (loading states, confirmations)
- Error messages explain issue and solution

**Motor:**
- Touch targets ≥44x44px on mobile
- No time-based interactions (except stint timer, which can be paused)
- No precise hover required

---

## Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────┐
│                    Client Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ Vue 3 + Nuxt │  │   Pinia      │  │ Tailwind  │ │
│  │  Components  │  │  (State)     │  │    CSS    │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
│  ┌──────────────────────────────────────────────┐  │
│  │        Supabase Client (JS SDK)               │  │
│  │   Auth • Realtime • Database • Storage       │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                          │
                  HTTPS / WebSocket
                          │
┌─────────────────────────────────────────────────────┐
│                   Supabase Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │  PostgreSQL  │  │   Realtime   │  │  Storage  │ │
│  │  + RLS       │  │   Server     │  │           │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
│  ┌──────────────────────────────────────────────┐  │
│  │         Edge Functions (Server Logic)        │  │
│  │  • Stint Completion Cron                     │  │
│  │  • Daily Reset Scheduler                     │  │
│  │  • CSV Export Generator                      │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                          │
                   External Services
                          │
┌─────────────────────────────────────────────────────┐
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  Sentry  │  │ Mixpanel │  │   Email Service  │  │
│  │  (Errors)│  │(Analytics)│  │   (Supabase)    │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Frontend Stack

**Framework:**
- **Vue 3** (Composition API)
  - Reactive state management
  - Component-based architecture
  - TypeScript support
- **Nuxt 3** (Vue meta-framework)
  - File-based routing
  - SSR/SSG capabilities (for marketing pages)
  - Auto-imports for components
  - Built-in optimization

**UI Framework:**
- **Nuxt UI 4**
  - Pre-built accessible components
  - Dark mode support out of box
  - Tailwind CSS integration
  - Minimal custom CSS needed

**State Management:**
- **Pinia**
  - User store (auth, preferences)
  - Projects store (CRUD operations)
  - Stints store (active stint tracking)
  - Analytics store (cached stats)
- **Composition API + Composables**
  - useTimer (Web Worker wrapper)
  - useRealtime (Supabase subscription wrapper)
  - useAuth (Auth state management)

**Styling:**
- **Tailwind CSS 3** (via Nuxt UI)
  - Utility-first styling
  - Responsive design system
  - Dark mode variants
  - Custom color palette (brand colors)

**Charts (Post-MVP):**
- **Chart.js**
  - Bar charts for daily/weekly summaries
  - Line charts for trend analysis
  - Lightweight, tree-shakeable

**Real-Time:**
- **Supabase Realtime Client**
  - WebSocket connections
  - Automatic reconnection
  - Subscription management
  - Broadcast events for stint updates

**Background Processing:**
- **Web Workers**
  - Timer accuracy in background tabs
  - CSV generation (offload from main thread)
  - Notification scheduling

**Build & Dev:**
- **Vite** (bundler)
- **TypeScript** (type safety)
- **ESLint + Prettier** (code quality)

---

### Backend Stack

**Database:**
- **Supabase PostgreSQL**
  - Version: PostgreSQL 15
  - Hosting: Managed by Supabase (AWS)
  - Row Level Security (RLS) for multi-tenancy
  - Full-text search capabilities
  - JSON/JSONB for flexible data

**Authentication:**
- **Supabase Auth**
  - JWT tokens with refresh rotation
  - Email verification workflow
  - Password reset with secure tokens
  - Session management across devices
  - OAuth providers (future: Google, Microsoft)

**Real-Time Sync:**
- **Supabase Realtime**
  - PostgreSQL replication to WebSockets
  - Row-level broadcasts
  - Channel-based subscriptions
  - User-specific channels for privacy

**Storage:**
- **Supabase Storage**
  - CSV export temporary files
  - User-uploaded files (future: stint attachments)
  - Auto-cleanup of temp files (24-hour retention)

**Server-Side Logic:**
- **Supabase Edge Functions** (Deno runtime)
  - `stint-completion-cron`: Auto-completes stints at planned end time (runs every 30 sec)
  - `daily-reset-scheduler`: Resets daily progress at user's midnight (runs hourly)
  - `csv-export-generator`: Generates Focus Ledger on demand
  - `webhook-handlers`: Stripe payment webhooks (future)

**Database Functions:**
- **PostgreSQL Functions** (PL/pgSQL)
  - `calculate_streak`: Computes current streak for user
  - `aggregate_daily_stats`: Pre-calculates daily summaries (runs at midnight)
  - `validate_stint_start`: Server-side validation for race conditions
  - `resolve_stint_conflict`: Conflict resolution algorithm

**Scheduled Jobs:**
- **pg_cron** (PostgreSQL extension)
  - Daily aggregation: `0 1 * * *` (1 AM UTC)
  - Cleanup old sessions: `0 2 * * *` (2 AM UTC)
  - Email digests: `0 8 * * 1` (8 AM UTC every Monday)

---

### Monitoring & Observability

**Error Tracking:**
- **Sentry**
  - Frontend errors (uncaught exceptions)
  - Backend errors (Edge Function failures)
  - Performance monitoring
  - User feedback widget
  - Alert rules: >10 errors in 5 min → Slack notification

**Analytics (Post-MVP):**
- **Mixpanel**
  - User events: stint_started, stint_completed, project_created
  - Funnel analysis: Registration → First stint → 7-day retention
  - Cohort analysis: Free vs Pro retention
  - A/B test tracking

**Performance:**
- **Core Web Vitals** (native browser APIs)
  - LCP (Largest Contentful Paint): <2.5s
  - FID (First Input Delay): <100ms
  - CLS (Cumulative Layout Shift): <0.1
- **Custom Metrics**:
  - Dashboard load time
  - Real-time sync latency
  - Timer drift measurement

**Uptime Monitoring:**
- **BetterUptime** (future)
  - HTTP checks every 30 seconds
  - WebSocket connection health
  - Database query performance
  - Alert via PagerDuty for downtime

**Logging:**
- **Supabase Logs** (built-in)
  - Database query logs
  - Edge Function logs
  - Auth event logs
  - Retention: 7 days free tier, 30 days Pro

---

### Infrastructure

**Hosting:**
- **Supabase Cloud**
  - Database: AWS us-east-1 (primary), multi-AZ
  - Edge Functions: Cloudflare Workers (global)
  - Storage: AWS S3
  - CDN: Cloudflare

**Domains & SSL:**
- **Primary:** lifestint.com (frontend)
- **API:** api.lifestint.com (Supabase proxy)
- **SSL:** Cloudflare Universal SSL (automatic)

**Environments:**
- **Production:** lifestint.com (Supabase Production project)
- **Staging:** staging.lifestint.com (Supabase Staging project)
- **Local Development:** localhost:3000 (Supabase local with Docker)

**CI/CD:**
- **GitHub Actions**
  - On push to `main`: Deploy to Staging
  - On release tag: Deploy to Production
  - Automated tests: Unit, integration, E2E (Playwright)
  - Lint checks: ESLint, TypeScript
  - Build time: <5 minutes

**Backups:**
- **Supabase Automated Backups**
  - Daily full backups (retained 7 days)
  - Point-in-time recovery (last 7 days)
  - Manual backup before major migrations

---

### Security Architecture

**Network Security:**
- HTTPS enforced (HSTS enabled)
- CSP headers: Restrict inline scripts
- CORS: Whitelist frontend domains only
- Rate limiting: Cloudflare + Supabase built-in

**Data Security:**
- Encryption at rest: AWS KMS (Supabase default)
- Encryption in transit: TLS 1.3
- Database backups encrypted
- No PII in logs

**Authentication Security:**
- Password hashing: bcrypt (cost factor 12)
- JWT signing: RS256 (asymmetric keys)
- Refresh token rotation on use
- Session invalidation on logout

**Authorization:**
- Row Level Security (RLS) on all tables
- User can only access own data
- API keys scoped per environment
- Service role key only in Edge Functions

**Compliance:**
- **GDPR:**
  - Data export API
  - Account deletion with cascade
  - Cookie consent banner
  - Privacy policy
- **CCPA:**
  - Do Not Sell opt-out
  - Data access requests
- **SOC 2:** (future, via Supabase certification)

---

## Data Models

### Schema Version: 1.0

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  email_verified BOOLEAN NOT NULL DEFAULT false,
  last_active TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1, -- Optimistic locking
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  CONSTRAINT valid_timezone CHECK (timezone IN (SELECT name FROM pg_timezone_names))
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_last_active ON users(last_active);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

-- Trigger for updated_at
CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Field Descriptions:**
- `timezone`: IANA timezone (e.g., "America/New_York") for daily reset and exports
- `version`: Incremented on every update for optimistic locking (prevents race conditions)
- `email_verified`: Must be true to access dashboard
- `last_active`: Updated on each API request, used for inactive user cleanup

**Constraints:**
- Email must be valid format and unique
- Timezone must be valid IANA timezone

---

### Projects Table

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  expected_daily_stints INTEGER NOT NULL DEFAULT 2,
  custom_stint_duration INTEGER, -- Minutes, NULL means use default (50)
  color_tag TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  archived_at TIMESTAMPTZ, -- NULL if not archived
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_name CHECK (length(name) >= 1 AND length(name) <= 100),
  CONSTRAINT valid_daily_stints CHECK (expected_daily_stints >= 1 AND expected_daily_stints <= 8),
  CONSTRAINT valid_stint_duration CHECK (custom_stint_duration IS NULL OR 
    (custom_stint_duration >= 10 AND custom_stint_duration <= 120)),
  CONSTRAINT valid_color CHECK (color_tag IS NULL OR color_tag IN 
    ('red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'gray')),
  CONSTRAINT unique_name_per_user UNIQUE (user_id, name)
);

-- Indexes
CREATE INDEX idx_projects_user_active ON projects(user_id, is_active) WHERE archived_at IS NULL;
CREATE INDEX idx_projects_user_sort ON projects(user_id, sort_order);

-- RLS Policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own projects" ON projects FOR ALL USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER set_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to count active projects per user
CREATE FUNCTION count_active_projects(p_user_id UUID) RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM projects 
  WHERE user_id = p_user_id AND is_active = true AND archived_at IS NULL;
$$ LANGUAGE SQL STABLE;
```

**Field Descriptions:**
- `custom_stint_duration`: Overrides default 50 minutes if set
- `color_tag`: Visual identifier in dashboard (8 preset colors)
- `archived_at`: Soft delete timestamp (NULL if active)
- `sort_order`: User-defined ordering (0 = first), future drag-to-reorder

**Constraints:**
- Project names must be unique per user
- Expected daily stints: 1-8
- Custom stint duration: 10-120 minutes if specified
- Maximum 25 active projects per user (enforced in application logic)

**Business Rules:**
- Archiving a project with active stint is prevented by application logic
- Archived projects excluded from daily totals and streak calculations

---

### Stints Table

```sql
CREATE TABLE stints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Denormalized for query performance
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  planned_duration INTEGER NOT NULL, -- Minutes
  actual_duration INTEGER, -- Seconds, calculated on completion
  paused_duration INTEGER NOT NULL DEFAULT 0, -- Seconds
  completion_type TEXT CHECK (completion_type IN ('manual', 'auto', 'interrupted')),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'interrupted')),
  paused_at TIMESTAMPTZ, -- Most recent pause time
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_planned_duration CHECK (planned_duration >= 10 AND planned_duration <= 120),
  CONSTRAINT valid_notes CHECK (notes IS NULL OR length(notes) <= 500),
  CONSTRAINT valid_ended CHECK (ended_at IS NULL OR ended_at >= started_at),
  CONSTRAINT completed_has_ended CHECK (status IN ('active', 'paused') OR ended_at IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_stints_user_date ON stints(user_id, started_at DESC);
CREATE INDEX idx_stints_project_date ON stints(project_id, started_at DESC);
CREATE INDEX idx_stints_active ON stints(user_id) WHERE status IN ('active', 'paused');
CREATE INDEX idx_stints_completed_date ON stints(user_id, DATE(started_at AT TIME ZONE (SELECT timezone FROM users WHERE id = stints.user_id)));

-- RLS Policies
ALTER TABLE stints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own stints" ON stints FOR ALL USING (auth.uid() = user_id);

-- Function to get active stint for user
CREATE FUNCTION get_active_stint(p_user_id UUID) RETURNS SETOF stints AS $$
  SELECT * FROM stints 
  WHERE user_id = p_user_id AND status IN ('active', 'paused')
  LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Function to complete stint
CREATE FUNCTION complete_stint(
  p_stint_id UUID,
  p_completion_type TEXT,
  p_notes TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_started_at TIMESTAMPTZ;
  v_paused_duration INTEGER;
BEGIN
  SELECT started_at, paused_duration INTO v_started_at, v_paused_duration
  FROM stints WHERE id = p_stint_id;
  
  UPDATE stints SET
    ended_at = now(),
    actual_duration = EXTRACT(EPOCH FROM (now() - v_started_at))::INTEGER - v_paused_duration,
    completion_type = p_completion_type,
    notes = p_notes,
    status = 'completed'
  WHERE id = p_stint_id;
END;
$$ LANGUAGE plpgsql;
```

**Field Descriptions:**
- `user_id`: Denormalized for faster queries (no join needed)
- `actual_duration`: Total seconds from start to end, minus pauses
- `paused_duration`: Cumulative pause time in seconds
- `status`: Current state (active, paused, completed, interrupted)
- `paused_at`: Timestamp of most recent pause (for calculating pause duration)

**Constraints:**
- Planned duration: 10-120 minutes
- Notes: Max 500 characters
- Completed stints must have ended_at

**Business Rules:**
- Only one active/paused stint per user (enforced by unique partial index)
- Auto-completion triggered by Edge Function when `started_at + planned_duration <= now()`
- Interrupted stints don't count toward daily progress but preserved in history

---

### User Preferences Table

```sql
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  default_stint_duration INTEGER NOT NULL DEFAULT 50,
  celebration_sound BOOLEAN NOT NULL DEFAULT true,
  celebration_animation BOOLEAN NOT NULL DEFAULT true,
  desktop_notifications BOOLEAN NOT NULL DEFAULT true,
  weekly_email_digest BOOLEAN NOT NULL DEFAULT false,
  theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_default_duration CHECK (default_stint_duration >= 10 AND default_stint_duration <= 120)
);

-- RLS Policy
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own preferences" ON user_preferences FOR ALL USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER set_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Field Descriptions:**
- `default_stint_duration`: Default for new projects (can be overridden per project)
- `celebration_*`: Control completion animations and sounds
- `desktop_notifications`: Browser notifications for stint completion
- `theme`: UI theme preference

---

### Daily Summaries Table (Pre-Aggregated for Performance)

```sql
CREATE TABLE daily_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_stints INTEGER NOT NULL DEFAULT 0,
  total_focus_seconds INTEGER NOT NULL DEFAULT 0,
  total_pause_seconds INTEGER NOT NULL DEFAULT 0,
  projects_worked JSONB NOT NULL DEFAULT '[]', -- Array of {project_id, project_name, stint_count}
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_date UNIQUE (user_id, date)
);

-- Indexes
CREATE INDEX idx_daily_summaries_user_date ON daily_summaries(user_id, date DESC);

-- RLS Policy
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own summaries" ON daily_summaries FOR SELECT USING (auth.uid() = user_id);

-- Function to aggregate daily summary (called by cron)
CREATE FUNCTION aggregate_daily_summary(p_user_id UUID, p_date DATE) RETURNS VOID AS $$
DECLARE
  v_timezone TEXT;
BEGIN
  SELECT timezone INTO v_timezone FROM users WHERE id = p_user_id;
  
  INSERT INTO daily_summaries (user_id, date, total_stints, total_focus_seconds, total_pause_seconds, projects_worked)
  SELECT 
    p_user_id,
    p_date,
    COUNT(*) as total_stints,
    SUM(actual_duration) as total_focus_seconds,
    SUM(paused_duration) as total_pause_seconds,
    jsonb_agg(jsonb_build_object(
      'project_id', project_id,
      'project_name', (SELECT name FROM projects WHERE id = project_id),
      'stint_count', COUNT(*)
    )) as projects_worked
  FROM stints
  WHERE user_id = p_user_id 
    AND status = 'completed'
    AND DATE(started_at AT TIME ZONE v_timezone) = p_date
  GROUP BY user_id
  ON CONFLICT (user_id, date) DO UPDATE SET
    total_stints = EXCLUDED.total_stints,
    total_focus_seconds = EXCLUDED.total_focus_seconds,
    total_pause_seconds = EXCLUDED.total_pause_seconds,
    projects_worked = EXCLUDED.projects_worked,
    completed_at = now();
END;
$$ LANGUAGE plpgsql;
```

**Purpose:**
- Pre-aggregates daily stats for fast analytics queries
- Avoids expensive SUM() queries on stints table for every analytics page load
- Generated nightly by scheduled task

---

### Streak Tracking Table

```sql
CREATE TABLE user_streaks (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_stint_date DATE,
  streak_updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policy
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own streaks" ON user_streaks FOR SELECT USING (auth.uid() = user_id);

-- Function to calculate streak
CREATE FUNCTION calculate_streak(p_user_id UUID) RETURNS INTEGER AS $$
DECLARE
  v_streak INTEGER := 0;
  v_current_date DATE;
  v_timezone TEXT;
  v_last_date DATE;
BEGIN
  SELECT timezone INTO v_timezone FROM users WHERE id = p_user_id;
  SELECT DATE(now() AT TIME ZONE v_timezone) INTO v_current_date;
  SELECT last_stint_date INTO v_last_date FROM user_streaks WHERE user_id = p_user_id;
  
  -- If last stint was today or yesterday, count streak
  IF v_last_date IS NOT NULL AND v_last_date >= v_current_date - INTERVAL '1 day' THEN
    -- Count consecutive days with stints going backwards from last_date
    SELECT COUNT(*) INTO v_streak FROM (
      SELECT DISTINCT DATE(started_at AT TIME ZONE v_timezone) as stint_date
      FROM stints
      WHERE user_id = p_user_id AND status = 'completed'
      ORDER BY stint_date DESC
    ) AS daily_stints
    WHERE stint_date >= v_current_date - INTERVAL '1 day' * v_streak;
  END IF;
  
  RETURN v_streak;
END;
$$ LANGUAGE plpgsql;
```

---

### Audit Log Table (For Support & Debugging)

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- 'project', 'stint', 'user_preferences'
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- No RLS (internal only, accessed via Edge Functions with service role key)
```

**Purpose:**
- Track user actions for support investigations
- Debug stint conflicts and data inconsistencies
- Not exposed to users (internal only)

**Retention:**
- 90 days (cleanup via scheduled task)

---

## Technical Specifications

### Timezone Handling

**User Timezone Storage:**
- Captured during registration (browser timezone detected via Intl.DateTimeFormat)
- Stored in `users.timezone` as IANA timezone string (e.g., "America/New_York")
- User can change in settings (dropdown of common timezones)

**Daily Reset Logic:**
- Scheduled task runs every hour at :00
- Queries users whose local midnight occurred in the last hour: 
  ```sql
  SELECT * FROM users 
  WHERE EXTRACT(HOUR FROM now() AT TIME ZONE timezone) = 0 
    AND EXTRACT(MINUTE FROM now() AT TIME ZONE timezone) < 10
  ```
- Resets daily progress counters for matched users
- Triggers daily summary aggregation for previous day

**CSV Export Timestamps:**
- All timestamps converted to user's timezone
- Format: `YYYY-MM-DD HH:MM:SS` with timezone label in header
- Example: "2025-10-24 09:30:00 (America/New_York)"

**Streak Calculation:**
- Uses user's timezone to determine "today" and "yesterday"
- Query: `DATE(started_at AT TIME ZONE v_timezone)`
- Grace period: 1 day (can miss 1 day without breaking streak)

**Edge Cases:**
- Timezone change: Daily reset recalculates based on new timezone immediately
- DST transitions: PostgreSQL handles automatically with AT TIME ZONE
- Traveling users: Timezone can be manually changed in settings

---

### Offline Sync Strategy

**Offline Capabilities:**
- Start/pause/resume/stop stints (queued locally)
- View cached dashboard data
- Timer continues in Web Worker using local system clock

**Offline Storage:**
- IndexedDB for queued operations (via Dexie.js)
- LocalStorage for last known dashboard state
- Service Worker for app shell caching (PWA)

**Online Reconciliation:**

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

### Real-Time Conflict Resolution

**Conflict Scenarios:**

**1. Simultaneous Stint Start (Race Condition):**
- User clicks "Start" on Device A
- Before response, user clicks "Start" on Device B
- Both requests reach server

**Resolution:**
- Server uses optimistic locking on `users.version` field
- First request increments version, succeeds
- Second request fails with 409 Conflict (version mismatch)
- Device B shows: "You already started a stint on another device. View it?"
- Button opens current active stint

**2. Pause/Resume Conflicts:**
- User pauses on Device A
- Before real-time event propagates, user resumes on Device B

**Resolution:**
- Each pause/resume increments stint's `version` field
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

**Implementation:**
```sql
-- Optimistic locking check before stint start
CREATE FUNCTION start_stint(p_user_id UUID, p_project_id UUID, p_version INTEGER) 
RETURNS SETOF stints AS $$
BEGIN
  -- Check version matches (no concurrent operations)
  IF (SELECT version FROM users WHERE id = p_user_id) != p_version THEN
    RAISE EXCEPTION 'Conflict: User version mismatch';
  END IF;
  
  -- Check no active stints
  IF EXISTS (SELECT 1 FROM stints WHERE user_id = p_user_id AND status IN ('active', 'paused')) THEN
    RAISE EXCEPTION 'Conflict: Active stint exists';
  END IF;
  
  -- Increment version
  UPDATE users SET version = version + 1 WHERE id = p_user_id;
  
  -- Create stint
  RETURN QUERY INSERT INTO stints (...) VALUES (...) RETURNING *;
END;
$$ LANGUAGE plpgsql;
```

---

### Timer Accuracy & Background Tabs

**Problem:**
- Browser throttles timers in background tabs (1-second resolution becomes 1-minute+)
- User switches tabs or minimizes browser, timer appears to "freeze"

**Solution: Web Worker Timer**

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

**Server-Side Validation:**
- Every 60 seconds, frontend syncs with server: `GET /api/stints/active`
- Server returns actual remaining time based on `started_at`
- Frontend corrects timer if drift >5 seconds
- Prevents manipulation (user can't hack local timer)

**Auto-Completion Fallback:**
- Edge Function runs every 30 seconds
- Queries stints where `status = 'active' AND started_at + planned_duration <= now()`
- Auto-completes matched stints
- If browser closed during stint, server still completes on time

**Notification Handling:**
- Timer worker sends `postMessage({ completed: true })` at completion
- Main thread requests notification permission (if not granted)
- Shows browser notification: "Stint completed for [Project Name]! 🎉"
- Clicking notification focuses LifeStint tab (if open) or opens new tab

---

### Data Validation & Constraints

**Client-Side Validation (Immediate Feedback):**
```javascript
// Project name validation
const projectNameSchema = z.string()
  .min(1, "Name required")
  .max(100, "Name too long")
  .refine(name => !existingProjects.includes(name), "Name already exists");

// Stint duration validation
const stintDurationSchema = z.number()
  .int()
  .min(10, "Minimum 10 minutes")
  .max(120, "Maximum 120 minutes");

// Expected daily stints validation
const dailyStintsSchema = z.number()
  .int()
  .min(1, "At least 1 stint")
  .max(8, "Maximum 8 stints");
```

**Server-Side Validation (Authoritative):**
- All PostgreSQL constraints enforced (see Data Models section)
- Edge Functions validate before database insert:
  - Project name uniqueness (case-insensitive)
  - Numeric ranges
  - Foreign key existence
  - Business rules (e.g., no active stint exists)

**Rate Limiting:**
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

**Input Sanitization:**
- All text inputs sanitized with DOMPurify before rendering
- Markdown/HTML not supported (plain text only)
- SQL injection prevented by Supabase parameterized queries

---

### Row Level Security (RLS) Policies

**Purpose:** Enforce multi-tenancy at database level, prevent data leakage.

**Policy Definitions:**

**Users Table:**
```sql
-- Users can read own profile
CREATE POLICY "users_select_own" ON users FOR SELECT 
USING (auth.uid() = id);

-- Users can update own profile (except id, created_at)
CREATE POLICY "users_update_own" ON users FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (id = auth.uid() AND created_at = (SELECT created_at FROM users WHERE id = auth.uid()));
```

**Projects Table:**
```sql
-- Users can read own projects
CREATE POLICY "projects_select_own" ON projects FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert own projects
CREATE POLICY "projects_insert_own" ON projects FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update own projects
CREATE POLICY "projects_update_own" ON projects FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete own projects (actually archives via application logic)
CREATE POLICY "projects_delete_own" ON projects FOR DELETE 
USING (auth.uid() = user_id);
```

**Stints Table:**
```sql
-- Users can read own stints
CREATE POLICY "stints_select_own" ON stints FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert own stints
CREATE POLICY "stints_insert_own" ON stints FOR INSERT 
WITH CHECK (auth.uid() = user_id AND 
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid()));

-- Users can update own stints (for pause/resume/stop)
CREATE POLICY "stints_update_own" ON stints FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users cannot delete stints (immutable record)
-- No DELETE policy = no deletions allowed
```

**Daily Summaries Table:**
```sql
-- Users can read own summaries
CREATE POLICY "summaries_select_own" ON daily_summaries FOR SELECT 
USING (auth.uid() = user_id);

-- Users cannot write summaries (generated by cron with service role key)
-- No INSERT/UPDATE policies = only system can write
```

**Service Role Bypass:**
- Edge Functions use service role key (bypasses RLS)
- Used for:
  - Auto-completing stints (cron job)
  - Generating daily summaries (cron job)
  - System maintenance operations
- Service role key stored in Supabase secrets, never exposed to frontend

**Testing RLS:**
```sql
-- Test as user
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims.sub = 'user-uuid-here';

-- Attempt to read another user's data (should return 0 rows)
SELECT * FROM projects WHERE user_id != 'user-uuid-here';

-- Attempt to insert with wrong user_id (should fail)
INSERT INTO projects (user_id, name) VALUES ('other-user-uuid', 'Test');
```

---

### CSV Export Format

**File Naming:**
- Format: `LifeStint-Focus-Ledger-YYYY-MM-DD-to-YYYY-MM-DD.csv`
- Example: `LifeStint-Focus-Ledger-2025-10-17-to-2025-10-23.csv`

**CSV Structure:**
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

**Field Descriptions:**
- Timestamps in user's timezone (converted from UTC)
- Duration columns in minutes for readability
- Notes column includes user-entered text (escaped for CSV safety)
- Summary section at bottom for quick insights

**Generation Process:**
1. User clicks "Export CSV" button
2. Frontend sends request to Edge Function: `POST /api/export/csv`
3. Edge Function queries stints in date range
4. Converts timestamps to user's timezone
5. Generates CSV string in memory
6. Returns CSV as downloadable file (no server storage)
7. Frontend triggers browser download

**Professional Formatting:**
- Clean, readable layout
- Header with user context
- Summary statistics at bottom
- Client-ready (no internal IDs or technical jargon)

---

## Development Roadmap

### Phase 1: Foundation (Weeks 1-2)

**Goal:** Set up authentication, database, and development environment.

**Tasks:**
1. Initialize Nuxt 3 project with TypeScript
2. Configure Supabase project (production + staging)
3. Set up Supabase local development (Docker)
4. Implement authentication:
   - Registration with email verification
   - Login/logout
   - Password recovery
   - Session persistence
5. Create database schema:
   - Users table with RLS
   - User preferences table
   - Implement utility functions (update_updated_at_column)
6. Set up CI/CD pipeline (GitHub Actions)
7. Configure Sentry for error tracking
8. Create basic UI shell (nav, layout, routing)

**Deliverable:** Working authentication flow, empty dashboard, database ready for projects.

**Dependencies:** None (foundational)

---

### Phase 2: Project Management (Weeks 3-4)

**Goal:** Enable project CRUD operations via dashboard modals.

**Tasks:**
1. Create projects table with RLS policies
2. Implement Project CRUD API (Edge Functions or direct Supabase client):
   - Create project
   - Read projects (user's only)
   - Update project
   - Archive project (soft delete)
3. Build project modal component:
   - Form validation (Zod schema)
   - Color picker
   - Expected daily stints slider
   - Custom stint duration input (optional)
4. Implement activate/deactivate toggle
5. Build project card component:
   - Display project info
   - Edit/archive buttons
   - Activate/deactivate toggle
6. Add project list to dashboard:
   - Grid layout (responsive)
   - Active projects first, sorted by last stint time
   - "Inactive Projects" collapsible section
7. Handle edge cases:
   - Empty state (no projects)
   - Maximum projects limit (25 active)
   - Name uniqueness validation

**Deliverable:** Full project management via dashboard, no separate project page needed.

**Dependencies:** Phase 1 complete (auth + database)

**Testing:**
- Unit tests for validation logic
- Integration tests for CRUD operations
- E2E tests for modal workflows

---

### Phase 3: Stint Management Core (Weeks 5-7)

**Goal:** Implement start/stop/pause/resume with single active stint enforcement.

**Tasks:**
1. Create stints table with RLS policies
2. Create user_streaks table
3. Implement single active stint constraint:
   - Database function: `validate_stint_start()`
   - Check for existing active stints before insert
   - Return 409 Conflict if found
4. Build stint API (Edge Functions):
   - `POST /api/stints/start`: Create active stint
   - `PATCH /api/stints/:id/pause`: Pause active stint
   - `PATCH /api/stints/:id/resume`: Resume paused stint
   - `PATCH /api/stints/:id/stop`: Complete stint manually
   - `GET /api/stints/active`: Get user's active stint
5. Implement optimistic locking:
   - Add version field to users table
   - Increment on stint operations
   - Reject stale operations with 409
6. Build timer system:
   - Web Worker for countdown timer
   - Sync with server every 60 seconds
   - Handle background tab throttling
7. Update project card UI:
   - Show Start/Stop/Pause/Resume buttons based on state
   - Display countdown timer during active stint
   - Highlight active project card
8. Implement completion logic:
   - Manual stop with optional notes modal
   - Auto-complete when timer reaches 0
   - Browser notification on completion
9. Handle interruptions:
   - Network loss detection
   - Mark stint as interrupted
   - Preserve data for analytics
10. Real-time UI updates:
    - Supabase Realtime subscription to stints table
    - Broadcast stint events to all user's devices
    - Optimistic UI updates with rollback on conflict

**Deliverable:** Fully functional stint tracking with pause/resume, single session enforcement, and real-time sync.

**Dependencies:** Phase 2 complete (projects exist)

**Testing:**
- Unit tests for timer logic
- Integration tests for API endpoints
- E2E tests for complete stint workflow
- Load testing for race conditions (simultaneous starts)

---

### Phase 4: Timer System & Auto-Completion (Week 8)

**Goal:** Ensure timer accuracy and server-side auto-completion.

**Tasks:**
1. Implement Web Worker timer:
   - High-precision countdown using Date.now()
   - Survives background tabs
   - Communicates with main thread via postMessage
2. Build server-side auto-completion:
   - Edge Function cron job (runs every 30 seconds)
   - Query stints where `started_at + planned_duration <= now()` and `status = 'active'`
   - Call `complete_stint()` function for matched stints
   - Broadcast completion event via Realtime
3. Implement timer sync:
   - Every 60 seconds, GET /api/stints/active
   - Compare local timer with server time
   - Correct drift if >5 seconds
4. Handle edge cases:
   - Browser closed during stint: Server auto-completes
   - Browser reopened after completion: Show completion UI retroactively
   - Clock changes (e.g., DST): Server-authoritative time prevents issues
5. Add browser notifications:
   - Request permission on first stint start
   - Show notification at completion
   - Clicking notification focuses LifeStint tab

**Deliverable:** Accurate, server-authoritative timer system with auto-completion.

**Dependencies:** Phase 3 complete (stint management)

**Testing:**
- Test timer accuracy in background tabs
- Test auto-completion when browser closed
- Test DST transitions
- Test notification delivery

---

### Phase 5: Dashboard Experience & Daily Reset (Weeks 9-10)

**Goal:** Polish dashboard with progress tracking and daily reset.

**Tasks:**
1. Implement daily progress calculation:
   - Count completed stints today
   - Compare to expected_daily_stints
   - Display as badge: "X of Y stints today"
2. Add visual progress bar to project cards
3. Implement streak counter:
   - Calculate on dashboard load
   - Display on project cards: "🔥 5 day streak"
   - Update in real-time when stint completed
4. Build daily reset logic:
   - Edge Function cron job (runs every hour)
   - Query users whose local midnight passed in last hour
   - Reset daily progress counters to 0
   - Trigger daily summary aggregation
   - Broadcast reset event via Realtime
5. Add celebration animations:
   - Confetti animation when daily goal reached
   - Celebration sound (optional, can disable)
   - Encouraging messages
6. Improve empty states:
   - No projects: Illustration + CTA
   - No stints today: Motivational quote
   - All projects inactive: Reminder to activate
7. Polish error handling:
   - Network offline banner
   - Server error retry button
   - Conflict resolution modal
8. Implement timezone selection:
   - Detect browser timezone on registration
   - Allow change in settings
   - Update daily reset calculations

**Deliverable:** Complete, polished dashboard with progress tracking and daily reset.

**Dependencies:** Phase 4 complete (timer system)

**Testing:**
- Test daily reset across timezones
- Test DST transitions
- Test celebration triggers
- E2E tests for complete daily workflow

---

### Phase 6: Offline Support (Week 11)

**Goal:** Enable offline stint tracking with smart sync.

**Tasks:**
1. Implement PWA manifest:
   - App icons (512x512, 192x192)
   - Splash screens
   - Display mode: standalone
   - Theme color
2. Build Service Worker:
   - Cache app shell (HTML, CSS, JS)
   - Cache static assets (fonts, icons)
   - Network-first strategy for API calls
   - Cache-first for static assets
3. Set up IndexedDB for offline queue:
   - Install Dexie.js
   - Create `offline_queue` table
   - Store pending operations with timestamps
4. Implement offline detection:
   - Listen to `navigator.onLine` events
   - Show offline banner when disconnected
   - Disable network-dependent features (projects CRUD, analytics)
5. Build sync manager:
   - Process queue on reconnect
   - Prioritize active stint sync
   - Handle server validation errors
   - Show sync progress UI
6. Implement conflict resolution:
   - Detect offline divergence
   - Show conflict resolution modal
   - Allow user to choose resolution strategy
7. Test offline scenarios:
   - Start stint offline, sync online
   - Stop stint offline, sync online
   - Concurrent device usage during offline period

**Deliverable:** PWA with offline stint tracking and intelligent sync.

**Dependencies:** Phase 5 complete (dashboard experience)

**Testing:**
- Test PWA installation on iOS/Android
- Test offline stint workflow
- Test sync with conflicts
- Test network reconnection handling

---

### Phase 7: Analytics & Export (Weeks 12-13)

**Goal:** Provide basic analytics and CSV export for professional reporting.

**Tasks:**
1. Create daily_summaries table
2. Implement aggregation function:
   - `aggregate_daily_summary()` SQL function
   - Edge Function cron job (runs at midnight user time)
   - Pre-calculate daily stats for performance
3. Build analytics page:
   - Daily summary section (today's stats)
   - Weekly summary section (7-day overview)
   - Simple bar chart (Chart.js)
   - Project breakdown list
4. Implement streak tracking:
   - `calculate_streak()` SQL function
   - Display current streak prominently
   - Show longest streak all-time
   - Grace period logic (1 day)
5. Build CSV export:
   - Edge Function: `POST /api/export/csv`
   - Query stints in date range
   - Convert timestamps to user timezone
   - Generate CSV with header and summary
   - Return as downloadable file
6. Add export UI:
   - Date range picker (presets + custom)
   - "Export CSV" button
   - Download triggers immediately
   - Show loading state during generation
7. Polish analytics UI:
   - Responsive design (mobile-friendly)
   - Loading skeletons
   - Empty state (no data yet)
8. Implement caching:
   - Cache daily summaries (5-minute TTL)
   - Invalidate cache on stint completion

**Deliverable:** Analytics page with CSV export for client reporting.

**Dependencies:** Phase 6 complete (offline support)

**Testing:**
- Test streak calculations across date ranges
- Test CSV export with various date ranges
- Test timezone conversions in export
- Test analytics performance with large datasets

---

### Phase 8: Settings & Preferences (Week 14)

**Goal:** Allow users to customize their experience.

**Tasks:**
1. Build settings page:
   - Account section (email, name)
   - Preferences section (default stint duration, theme, notifications)
   - Privacy section (data export, account deletion)
2. Implement preference updates:
   - Update user_preferences table
   - Apply changes immediately (no page refresh)
3. Add password change flow:
   - Current password verification
   - New password with confirmation
   - Email notification on change
4. Build data export feature:
   - Export all user data as JSON (GDPR compliance)
   - Include projects, stints, preferences
   - One-click download
5. Implement account deletion:
   - Confirmation modal with password
   - Soft delete (mark deleted, don't purge immediately)
   - Scheduled cleanup after 30 days
   - Email confirmation
6. Add theme switcher:
   - Light, Dark, System options
   - Persists in user_preferences
   - Applies immediately via CSS variables

**Deliverable:** Settings page with full preference control and GDPR compliance.

**Dependencies:** Phase 7 complete (analytics)

**Testing:**
- Test preference updates
- Test account deletion flow
- Test data export completeness
- Test theme switching

---

### Phase 9: Polish & Launch Prep (Weeks 15-16)

**Goal:** Final polish, performance optimization, and launch preparation.

**Tasks:**
1. Performance optimization:
   - Code splitting (lazy load routes)
   - Image optimization
   - Database query optimization (add indexes)
   - Bundle size reduction
   - Lighthouse audit (target: >90 on all metrics)
2. Accessibility audit:
   - WCAG 2.1 Level AA compliance check
   - Keyboard navigation testing
   - Screen reader testing (NVDA, VoiceOver)
   - Color contrast verification
   - Focus indicators on all interactive elements
3. Browser compatibility testing:
   - Chrome, Firefox, Safari, Edge (latest versions)
   - Mobile Safari, Mobile Chrome
   - Test on various screen sizes (320px to 2560px)
4. Security audit:
   - Penetration testing (basic)
   - RLS policy verification
   - Rate limiting testing
   - XSS prevention verification
   - CSRF protection testing
5. Documentation:
   - User guide (in-app help center)
   - Developer documentation (API reference)
   - Deployment guide
   - Troubleshooting guide
6. Marketing site:
   - Landing page with demo video
   - Pricing page (Free vs Pro)
   - FAQ page
   - Terms of Service, Privacy Policy
7. Analytics setup:
   - Implement Mixpanel events
   - Set up funnels and cohorts
   - Define key metrics dashboard
8. Launch checklist:
   - DNS setup (lifestint.com)
   - SSL certificates
   - Error monitoring (Sentry)
   - Uptime monitoring (BetterUptime)
   - Backup verification
   - Rollback plan

**Deliverable:** Production-ready application with all polish and monitoring in place.

**Dependencies:** Phase 8 complete (settings)

**Testing:**
- Full regression testing
- Performance benchmarking
- Security scan (OWASP ZAP)
- Load testing (simulate 100 concurrent users)

---

### Phase 10: Beta Launch & Iteration (Weeks 17-20)

**Goal:** Soft launch with early adopters, gather feedback, iterate.

**Tasks:**
1. Private beta invites:
   - Invite 50-100 consultants/freelancers
   - Onboarding email with guide
   - Set up feedback channel (email + Discord)
2. Monitoring & support:
   - Daily Sentry error review
   - Weekly feedback review
   - User interviews (5-10 users)
3. Iteration based on feedback:
   - Bug fixes (prioritize blockers)
   - UI/UX improvements
   - Performance optimizations
4. Feature additions (based on demand):
   - Tags/categories (if requested)
   - Weekly goals
   - Calendar integration
5. Prepare for public launch:
   - Press kit
   - Product Hunt launch
   - Social media content

**Deliverable:** Validated MVP with real users, ready for public launch.

**Dependencies:** Phase 9 complete (launch prep)

**Success Metrics:**
- 7-day retention: >40%
- Daily active users: >30% of signups
- Average stints per user per week: >5
- CSV exports per month: >20% of users

---

### Post-MVP Roadmap (Future Phases)

**Phase 11: Advanced Analytics**
- Weekly/monthly trends
- Project comparison charts
- Time of day productivity analysis
- Export to PDF with charts

**Phase 12: Collaboration Features**
- Shared projects (team stints)
- Team analytics dashboard
- Admin role for project managers

**Phase 13: Integrations**
- Calendar sync (Google Calendar, Outlook)
- Slack notifications
- Zapier integration
- Time tracking tool import (Toggl, Harvest)

**Phase 14: Mobile Apps**
- React Native app (iOS + Android)
- Native notifications
- Offline-first architecture
- Widget for home screen

**Phase 15: Enterprise Features**
- SSO (SAML, OAuth)
- Custom branding
- Advanced permissions
- Audit logs (user-facing)
- SLA guarantees

---

## Success Metrics

### MVP Success Criteria (First 3 Months)

**User Acquisition:**
- 500 registered users
- 200 weekly active users (WAU)
- 30% conversion from landing page to signup

**Engagement:**
- 7-day retention: >40%
- 30-day retention: >25%
- Average stints per user per week: >5
- Average session duration: >25 minutes
- Stint completion rate: >80% (not interrupted)

**Product Validation:**
- CSV export usage: >20% of active users monthly
- Streak maintenance: >30% of users with 5+ day streak
- Average projects per user: 3-4
- Mobile usage: >40% of sessions

**Business Metrics:**
- Free to Pro conversion: >5% (post-MVP with paid tier)
- Churn rate: <10% monthly
- NPS (Net Promoter Score): >40

**Technical Health:**
- Uptime: >99.5%
- API response time (p95): <500ms
- Dashboard load time: <2 seconds
- Error rate: <0.1% of requests

---

### Key Performance Indicators (KPIs)

**North Star Metric:** Weekly focused minutes per user
- Target: 300+ minutes (5+ stints at 50 min each)

**Supporting Metrics:**

**Usage:**
- Daily active users (DAU) / Monthly active users (MAU) ratio
- Average stints per user per day
- Stint completion rate (not interrupted)
- Pause frequency (lower is better)

**Retention:**
- D1 retention (return next day)
- D7 retention (return within 7 days)
- D30 retention (return within 30 days)
- Cohort retention curves

**Quality:**
- Average actual stint duration vs planned
- Projects with daily goals met
- Streak length distribution
- CSV export frequency

**Monetization (Post-MVP):**
- Free to Pro conversion rate
- Monthly recurring revenue (MRR)
- Average revenue per user (ARPU)
- Customer lifetime value (CLV)
- Churn rate

---

### Analytics Events

**User Lifecycle:**
- `user_registered`: Email, registration source
- `email_verified`: Time to verification
- `onboarding_completed`: Time to first stint

**Project Events:**
- `project_created`: Expected daily stints, custom duration
- `project_edited`: Changed fields
- `project_activated`: Project ID
- `project_deactivated`: Project ID
- `project_archived`: Project ID, stint count

**Stint Events:**
- `stint_started`: Project ID, planned duration, device type
- `stint_paused`: Project ID, time elapsed
- `stint_resumed`: Project ID, pause duration
- `stint_stopped_manual`: Project ID, actual duration, notes added
- `stint_auto_completed`: Project ID, actual duration
- `stint_interrupted`: Project ID, reason

**Analytics Events:**
- `analytics_viewed`: Page views
- `csv_exported`: Date range, stint count
- `streak_reached`: Streak length (milestones: 7, 14, 30 days)

**Settings Events:**
- `preferences_updated`: Changed fields
- `theme_changed`: New theme
- `password_changed`: Success/failure
- `account_deleted`: Reason (optional)

---

## Risks and Mitigations

### Technical Risks

**Risk 1: Real-Time Sync Latency**
- **Impact:** High. Poor sync experience damages core value prop.
- **Probability:** Medium. WebSocket connections can be unstable.
- **Mitigation:**
  - Implement fallback polling (every 5 seconds) if WebSocket disconnects
  - Use optimistic UI updates (immediate feedback, rollback if server rejects)
  - Server-authoritative time for all operations
  - Test on slow networks (3G simulation)
- **Contingency:** If real-time sync unreliable, revert to manual refresh button with warning banner.

**Risk 2: Timer Accuracy in Background Tabs**
- **Impact:** High. Inaccurate timers undermine trust.
- **Probability:** High. Browser throttling is expected behavior.
- **Mitigation:**
  - Use Web Workers (not affected by throttling)
  - Server-side auto-completion (fallback if browser closed)
  - Sync with server every 60 seconds
  - Server time is authoritative (client cannot manipulate)
- **Contingency:** If Web Worker fails, show warning: "Keep this tab active for accurate timing."

**Risk 3: Offline Sync Conflicts**
- **Impact:** Medium. Data loss or confusion damages trust.
- **Probability:** Medium. Users will work offline occasionally.
- **Mitigation:**
  - Clear conflict resolution UI (user chooses resolution)
  - Server-side validation prevents data corruption
  - Mark conflicted stints as "interrupted" (preserves data)
  - IndexedDB for persistent offline queue
- **Contingency:** If conflicts too complex, disable offline stint tracking (only allow viewing cached data offline).

**Risk 4: Database Performance at Scale**
- **Impact:** High. Slow queries damage UX.
- **Probability:** Low in MVP (small user base), High at scale.
- **Mitigation:**
  - Pre-aggregate daily summaries (avoid heavy SUM queries)
  - Strategic indexes on query-heavy columns
  - Query optimization (EXPLAIN ANALYZE)
  - Caching layer (5-minute TTL for analytics)
- **Contingency:** If database slow, implement read replicas or migrate to Timescale (time-series optimized PostgreSQL).

**Risk 5: Supabase Vendor Lock-In**
- **Impact:** Medium. Difficult to migrate if needed.
- **Probability:** Low. Supabase is PostgreSQL-based (standard).
- **Mitigation:**
  - Use standard PostgreSQL features (avoid Supabase-specific extensions)
  - Keep Edge Functions simple (easy to rewrite as AWS Lambda)
  - All data exportable as SQL dump
- **Contingency:** Migration path to self-hosted PostgreSQL + Auth0 + AWS Lambda documented.

---

### Product Risks

**Risk 6: Feature Creep (Building Too Much)**
- **Impact:** High. Delayed launch, bloated product.
- **Probability:** High. Consultants will request many features.
- **Mitigation:**
  - Strict MVP scope (this PRD)
  - "No" is default answer to new feature requests
  - Validate with 5+ users before adding features
  - Track feature request votes (build most-wanted only)
- **Contingency:** Regular scope reviews, ruthless prioritization.

**Risk 7: Insufficient User Adoption**
- **Impact:** High. Product doesn't reach critical mass.
- **Probability:** Medium. Productivity tool market is crowded.
- **Mitigation:**
  - Private beta with warm introductions (not cold launch)
  - Referral program (invite friends, earn Pro tier)
  - Content marketing (blog posts on focus techniques)
  - Product Hunt launch with demo video
- **Contingency:** Pivot focus: Target agencies/teams instead of individuals (easier sales motion).

**Risk 8: Pricing Model Rejection**
- **Impact:** Medium. No revenue despite usage.
- **Probability:** Medium. Users may expect free forever.
- **Mitigation:**
  - Free tier generous (2 projects, 90-day analytics)
  - Pro tier clear value (unlimited projects, custom branding)
  - Transparent pricing from day 1 (no bait-and-switch)
  - Annual discount (save 20%)
- **Contingency:** If conversions low, test different price points ($8, $12, $15/month).

**Risk 9: Competition from Established Players**
- **Impact:** Medium. Users stick with known tools.
- **Probability:** Medium. Toggl/Harvest could copy stint approach.
- **Mitigation:**
  - Focus on niche (consultants, not all knowledge workers)
  - Emphasize professional reporting (not just tracking)
  - Build community (Discord, newsletter)
  - Fast iteration (ship weekly updates)
- **Contingency:** If outcompeted, explore acquisition by larger player or pivot to B2B.

---

### Business Risks

**Risk 10: Regulatory Compliance (GDPR, CCPA)**
- **Impact:** High. Fines and legal issues.
- **Probability:** Low. We don't collect much PII.
- **Mitigation:**
  - GDPR compliance from day 1 (data export, deletion)
  - Privacy policy reviewed by lawyer
  - Cookie consent banner
  - No data sold to third parties
- **Contingency:** If regulation changes, hire compliance consultant.

**Risk 11: Customer Support Overload**
- **Impact:** Medium. Poor support damages reputation.
- **Probability:** Medium. Users will have questions.
- **Mitigation:**
  - Comprehensive help center (Intercom or similar)
  - In-app tooltips and onboarding
  - Email support with 24-hour SLA
  - User community (Discord) for peer support
- **Contingency:** If support volume high, hire part-time support agent.

**Risk 12: Financial Runway**
- **Impact:** High. Run out of money before product-market fit.
- **Probability:** Medium. SaaS typically takes 12-24 months.
- **Mitigation:**
  - Bootstrap (low burn rate, founder does all work)
  - Supabase free tier ($0 until 50K MAU)
  - No paid marketing initially (organic + referrals)
  - Target 3-month MVP launch (minimize time to revenue)
- **Contingency:** If runway low, offer consulting services to fund development.

---

## Competitive Analysis

### Market Landscape

**Category:** Productivity & Time Tracking  
**Market Size:** $10B globally (2024), growing 15% YoY  
**Trends:** Remote work permanence, focus on deep work, distrust of surveillance tools

### Direct Competitors

**1. Toggl Track**
- **Strengths:**
  - Mature product (14+ years)
  - Team features (timesheets, reporting)
  - Integrations (100+ apps)
  - Mobile apps
- **Weaknesses:**
  - Billing/client focus (not personal productivity)
  - Requires categorization (high friction)
  - Surveillance perception
  - Expensive for individuals ($9-18/user/month)
- **Differentiation:** LifeStint focuses on focus quality over billing hours, zero categorization overhead, and professional reporting without surveillance metrics.

**2. Harvest**
- **Strengths:**
  - Strong invoicing integration
  - Team collaboration
  - Expense tracking
  - Professional branding
- **Weaknesses:**
  - Expensive ($12/user/month)
  - Overkill for solo consultants
  - Complicated setup
  - Billing-centric (not productivity-centric)
- **Differentiation:** LifeStint is simpler, cheaper, and focuses on demonstrating work quality rather than tracking billable hours.

**3. RescueTime**
- **Strengths:**
  - Automatic tracking (no manual start/stop)
  - Detailed app/website tracking
  - Productivity scoring
- **Weaknesses:**
  - Passive tracking (no active commitment)
  - Privacy concerns (monitors all activity)
  - No project-level organization
  - Expensive ($12/month)
- **Differentiation:** LifeStint is intentional (active stints, not passive tracking), project-aware, and privacy-focused (only tracks what you start).

### Indirect Competitors

**4. Forest / Focus Keeper (Pomodoro Apps)**
- **Strengths:**
  - Simple, beautiful UI
  - Gamification (grow trees)
  - Low cost ($2-5 one-time)
- **Weaknesses:**
  - Generic 25-minute sessions (inflexible)
  - No project tracking
  - No professional reporting
  - Mobile-only (Forest)
- **Differentiation:** LifeStint is project-aware, customizable durations, and offers professional exports.

**5. Notion / Asana (Project Management)**
- **Strengths:**
  - Full project management
  - Collaboration features
  - Free tiers
- **Weaknesses:**
  - No focus time tracking
  - High overhead (tasks, subtasks, statuses)
  - Not designed for focus sessions
- **Differentiation:** LifeStint integrates focus tracking into project management, not separate tools.

**6. Clockify (Free Time Tracker)**
- **Strengths:**
  - Completely free (unlimited users)
  - Team features
  - Reporting
- **Weaknesses:**
  - Billing focus (like Toggl)
  - Requires categorization
  - UI feels dated
  - No focus-quality metrics
- **Differentiation:** LifeStint is focus-quality first, professional reporting, and modern UI.

---

### Competitive Positioning

**LifeStint's Unique Position:**
- **Target:** Independent consultants (not enterprises)
- **Focus:** Work quality demonstration (not billing compliance)
- **Approach:** Intentional stints (not passive surveillance)
- **Friction:** Zero overhead (not detailed categorization)

**Value Propositions Competitors Can't Match:**
1. **Single Active Stint Enforcement:** Technically prevents multitasking (competitors allow concurrent timers)
2. **Professional Focus Ledger:** CSV export emphasizes focus consistency without surveillance (competitors show "productivity scores")
3. **Project-Aware Streaks:** Tracks consistency across projects (Pomodoro apps are project-agnostic)
4. **Zero Setup:** Start tracking in <60 seconds (competitors require project setup, categories, billing rates)

---

### Pricing Comparison

| Product | Free Tier | Paid Tier | Notes |
|---------|-----------|-----------|-------|
| **LifeStint** | 2 projects, 90-day history | $12/month (unlimited) | Focus on individuals |
| Toggl Track | 5 users, basic reports | $9-18/user/month | Team-focused pricing |
| Harvest | 1 user, 2 projects | $12/user/month | No free tier for teams |
| RescueTime | Limited features | $12/month | No free tier |
| Clockify | Unlimited users | $5-10/user/month (optional) | Free tier is generous |
| Forest | N/A | $2 one-time (mobile) | Not subscription |

**LifeStint's Pricing Strategy:**
- **Free Tier:** Generous enough for casual users (2 projects covers most)
- **Pro Tier:** $12/month competitive with RescueTime/Harvest, higher than Toggl but more value for individuals
- **No Team Pricing:** MVP focuses on individuals (teams later)

---

### Market Opportunity

**Addressable Market:**
- **TAM (Total Addressable Market):** 50M+ independent professionals globally
- **SAM (Serviceable Addressable Market):** 10M+ consultants/freelancers in US/EU who bill clients
- **SOM (Serviceable Obtainable Market):** 50K users (0.5% of SAM) in first 2 years

**Unit Economics (Projected):**
- **Average Revenue Per User (ARPU):** $10/month (assumes 40% on free tier, 60% on Pro)
- **Customer Acquisition Cost (CAC):** $30 (organic + referrals)
- **Lifetime Value (LTV):** $240 (24-month avg retention)
- **LTV:CAC Ratio:** 8:1 (healthy)

**Go-to-Market Strategy:**
1. **Private Beta:** 100 consultants via warm intros (months 1-2)
2. **Product Hunt Launch:** Drive 1K signups (month 3)
3. **Content Marketing:** Focus techniques, remote work productivity (months 4-6)
4. **Partnerships:** List on consultant directories, freelance platforms (months 7-12)
5. **Referral Program:** Existing users invite friends (ongoing)

---

## Appendices

### Appendix A: Browser Compatibility Matrix

| Feature | Chrome 90+ | Firefox 88+ | Safari 14+ | Edge 90+ | Mobile Safari | Mobile Chrome |
|---------|-----------|-------------|------------|----------|---------------|---------------|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Stint Tracking | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Web Workers | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Notifications | ✅ | ✅ | ⚠️ Requires permission | ✅ | ⚠️ Limited | ✅ |
| PWA Install | ✅ | ⚠️ Via browser | ✅ | ✅ | ✅ | ✅ |
| Offline Mode | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Real-time Sync | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Notes:**
- Safari notification support requires user gesture (can't request on page load)
- Firefox PWA install via "Add to Home Screen" (not automatic prompt)
- All features require JavaScript enabled

---

### Appendix B: Database Migration Strategy

**Migration Tool:** Supabase Migrations (SQL files in `/supabase/migrations`)

**Migration Process:**
1. Develop schema changes in local Supabase (Docker)
2. Generate migration file: `supabase migration new <name>`
3. Test migration in local database
4. Push to staging: `supabase db push --linked`
5. Test on staging environment
6. Push to production: `supabase db push --linked --db-url <production-url>`
7. Verify migration success (check tables, indexes, RLS policies)

**Rollback Plan:**
- Each migration includes `-- REVERT` section
- If migration fails, apply revert manually via Supabase Dashboard
- Database backups taken before each production migration

**Zero-Downtime Migrations:**
- Additive changes (new columns) deployed first
- Deploy application code that works with old & new schema
- Run data migration (if needed)
- Deploy application code that requires new schema
- Remove old columns (if applicable)

---

### Appendix C: API Rate Limiting Details

**Cloudflare Rate Limits (per IP):**
```
/api/stints/start → 60 per hour
/api/stints/*/pause → 120 per hour
/api/stints/*/resume → 120 per hour
/api/stints/*/stop → 120 per hour
/api/projects → 100 per hour (CRUD)
/api/auth/login → 10 per 15 minutes
/api/auth/register → 5 per hour
/api/auth/reset-password → 3 per hour
/api/export/csv → 20 per hour
```

**Supabase Rate Limits (per user):**
```
Database reads → 1000 per minute
Database writes → 200 per minute
Realtime connections → 10 per user
Realtime messages → 100 per second
Storage uploads → 100 per hour
```

**429 Response Format:**
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Try again in 45 seconds.",
  "retry_after": 45,
  "limit": 60,
  "remaining": 0
}
```

**Client-Side Handling:**
- Show toast notification: "Too many requests. Please wait."
- Disable action button for `retry_after` seconds
- Exponential backoff for retries (1s, 2s, 4s)

---

### Appendix D: Monitoring Alerts

**Sentry Alerts (Slack notifications):**
- >10 errors in 5 minutes → Critical
- >50 errors in 1 hour → Warning
- New error type (first occurrence) → Info
- Error rate increase >50% vs previous hour → Warning

**Uptime Alerts (BetterUptime, future):**
- API endpoint down (2 consecutive failures) → Critical
- Response time >2 seconds (p95) → Warning
- SSL certificate expiring in 30 days → Info

**Database Alerts (Supabase, built-in):**
- Connection pool >80% utilization → Warning
- Disk usage >80% → Warning
- Query time >5 seconds → Warning
- Replication lag >1 minute → Critical

**Custom Alerts (Edge Function):**
- Active stints >1 hour overdue for completion → Warning (cron may be failing)
- Daily reset not triggered for user in 25 hours → Critical
- CSV export failures >10 in 1 hour → Warning

---

### Appendix E: Data Retention Policy

**User Data:**
- Active accounts: Retained indefinitely
- Deleted accounts: 30-day soft delete, then purged
- Inactive accounts (no login >2 years): Notified at 18 months, deleted at 24 months

**Stint History:**
- Free tier: 90 days
- Pro tier: Unlimited retention
- After account deletion: Purged after 30 days

**Analytics Data:**
- Mixpanel events: 25 months retention (Mixpanel default)
- Daily summaries: Unlimited retention (small data size)

**Logs:**
- Supabase logs: 7 days (free tier), 30 days (Pro project)
- Sentry events: 90 days
- Audit logs: 90 days, then archived to S3 (future)

**Backups:**
- Daily database backups: 7 days retention
- Weekly backups: 30 days retention
- Monthly backups: 1 year retention (future)

---

### Appendix F: GDPR Compliance Checklist

✅ **User Rights:**
- Right to access: Data export via settings
- Right to rectification: Users can edit their data
- Right to erasure: Account deletion available
- Right to data portability: CSV and JSON exports
- Right to object: Opt-out of analytics/emails

✅ **Privacy by Design:**
- Minimal data collection (only email, name, timezone)
- No PII in logs
- Encryption at rest and in transit
- RLS enforces data isolation

✅ **Transparency:**
- Privacy policy clearly explains data usage
- Cookie consent banner (for analytics cookies)
- No data sold to third parties

✅ **Data Protection:**
- Supabase is GDPR-compliant (EU data centers available)
- Data Processing Agreement (DPA) with Supabase
- Regular security audits

---

### Appendix G: Glossary

**Stint:** A predetermined focused work session on a single project, typically 50 minutes.

**Active Stint:** A stint currently in progress (timer running).

**Paused Stint:** A stint temporarily paused by the user.

**Completed Stint:** A stint that finished (manually stopped or auto-completed).

**Interrupted Stint:** A stint that didn't complete normally (network issue, conflict, etc.). Doesn't count toward daily progress.

**Focus Ledger:** CSV export of stint history, formatted for professional client reporting.

**Daily Progress:** Number of completed stints today vs expected daily stints (e.g., "2 of 3").

**Streak:** Consecutive days with at least one completed stint.

**Grace Period:** 1-day allowance for streaks (can miss 1 day without breaking).

**Real-Time Sync:** Automatic synchronization of stint state across all user's connected devices.

**Optimistic Locking:** Concurrency control technique using version numbers to prevent race conditions.

**Row Level Security (RLS):** Database-level access control that enforces user data isolation.

**Edge Function:** Serverless function running on Cloudflare Workers (via Supabase).

**Service Worker:** Browser background script enabling PWA features (offline support, notifications).

**Web Worker:** Browser background thread for running computationally intensive tasks (timer) without blocking UI.

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-09-28 | Product Team | Initial draft |
| 2.0 | 2025-09-29 | Product Team | Added technical specifications, expanded roadmap |
| 2.1 | 2025-09-28 | Product Team | Refined user flows, added metrics |
| **3.0** | **2025-10-24** | **Claude (Analysis & Expansion)** | **Comprehensive rewrite: Added technical specifications section, clarified ambiguities (timezone, offline sync, conflict resolution), expanded data models with validation constraints, defined RLS policies, added CSV export format, detailed timer accuracy approach, expanded competitive analysis, added appendices, addressed all gaps from analysis** |

---

**End of Document**