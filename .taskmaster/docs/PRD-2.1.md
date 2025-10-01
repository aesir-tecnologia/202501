# LifeStint - Product Requirements Document

**Product Name:** LifeStint  
**Tagline:** Small sprints. Big results.  
**Document Version:** 2.1  
**Date:** September 28, 2025  

---

# Overview

LifeStint is a productivity tracking application designed specifically for busy professionals who need to maintain focus across multiple projects while providing credible evidence of their productive work. Unlike traditional time tracking tools that focus on retroactive logging, LifeStint uses a "stint-based" approach — predetermined focused work sessions that users commit to completing.

The product solves the critical problem of focus fragmentation among knowledge workers, particularly independent professionals managing multiple client projects. Users struggle with context switching, lack visibility into their actual productive time, and need professional ways to demonstrate their work quality to clients and stakeholders.

**Key Value Propositions:**
- **Zero Administrative Overhead:** One-click start/stop without categories, tags, or detailed setup  
- **Single Active Focus:** Technical enforcement prevents multitasking and context switching  
- **Professional Analytics:** Client-ready reports that demonstrate focus quality without surveillance  
- **Habit Building:** Progress visualization and streak tracking motivate consistent productive work  

**Target Audience:**  
Independent professionals — freelancers, consultants, and remote workers managing 2–6 active projects who need to justify billing rates and demonstrate productivity to clients.

---

# Core Features

## Project Organization (Dashboard-Only)
**What it does:** Create and manage projects directly from the dashboard via modals.  
**Why it's important:** Keeps administration frictionless and aligned with "zero overhead."  
**How it works:**  
- **Create Project:** “+ New Project” button → modal for name, expected daily stints, optional custom duration  
- **Edit Project:** Edit option on project card → modal with editable fields  
- **Activate/Deactivate:** Toggle switch on project card  
- **Delete Project:** Confirmation inside edit modal  

## Stint Management System
**What it does:** Start, track, pause/resume, and complete focused work sessions with precise timing and single-session enforcement.  
**Why it's important:** Provides structured focus time while preventing multitasking.  
**How it works:**  
- Start/stop buttons on project cards  
- Only one active stint per user  
- Pause/resume available in MVP  
- Countdown timer visible in real time  
- Manual stop or auto-completion  

## Real-Time Dashboard
**What it does:** Displays all projects with live progress and active session highlighting.  
**Why it's important:** Eliminates friction between deciding to focus and starting work.  
**How it works:**  
- Grid layout with project cards  
- Progress badges (e.g., “1 of 3 stints today”)  
- Highlight active project card  
- Syncs across devices in real time  

## Progress Analytics (Lightweight in MVP)
**What it does:** Tracks consistency and totals with minimal reporting.  
**Why it's important:** Provides motivation and basic professional evidence.  
**How it works:**  
- Daily/weekly totals  
- Simple streak counter  
- CSV export of stint history (“Focus Ledger”)  

## User Authentication & Security
- Email/password registration through Supabase Auth  
- Mandatory verification, secure session persistence, password recovery  
- Row Level Security to isolate user data  

---

# User Experience

## Primary Persona: Sarah the Client-Billable Consultant
- **Demographics:** Independent software/tech consultant, 28–35 years old, remote/hybrid  
- **Context:** 3–6 concurrent projects, billing by retainer or time-and-materials  
- **Goals:** Show consistent focus to clients, defend rates with credible evidence, reduce context switching  
- **Pain Points:** Clients equate “few meetings” with “no work,” timesheets feel accusatory, context switching kills momentum  

## Key User Flows

### Onboarding Flow
1. Register with email/password  
2. Verify email  
3. Welcome screen explaining stints with quick demo  
4. Create first project via modal  
5. Complete guided first stint with celebration  
6. Dashboard tour  

### Daily Usage Flow
1. Open dashboard  
2. Review project progress  
3. Start stint from project card  
4. Work with timer running (pause/resume available)  
5. Stop stint manually or auto-complete  
6. Optional notes  
7. Progress updates on dashboard  

### Weekly Review Flow
1. Open analytics view  
2. Review totals and streaks  
3. Export CSV focus ledger  
4. Adjust project expectations  

---

# Technical Architecture

## Frontend
- **Framework:** Vue.js 3 + Composition API  
- **UI Framework:** Nuxt UI 4  
- **State Management:** Pinia  
- **Styling:** Tailwind CSS (via Nuxt UI 4)  
- **Charts:** Chart.js (for later phases, not core MVP)  
- **Realtime:** Supabase Realtime  

## Backend
- **Database:** Supabase PostgreSQL with RLS  
- **Auth:** Supabase Auth  
- **Realtime Sync:** Supabase Realtime  
- **Storage:** Supabase Storage for files/exports  

## Monitoring
- **Error Tracking:** Sentry  
- **Analytics:** Mixpanel (post-MVP)  
- **Performance:** Core Web Vitals  

## Data Models

### Users
```sql
users (
  id uuid primary key,
  email text unique,
  full_name text,
  created_at timestamp,
  email_verified boolean,
  last_active timestamp
)
```

### Projects
```sql
projects (
  id uuid primary key,
  user_id uuid references users(id),
  name text,
  expected_daily_stints integer default 2,
  custom_stint_duration integer,
  is_active boolean default true,
  created_at timestamp,
  updated_at timestamp
)
```

### Stints
```sql
stints (
  id uuid primary key,
  project_id uuid references projects(id),
  started_at timestamp,
  ended_at timestamp,
  planned_duration integer,
  actual_duration integer,
  completion_type enum('manual','auto','interrupted'),
  notes text,
  created_at timestamp
)
```

---

# Development Roadmap (MVP-Focused)

## Phase 1: Foundation
- Authentication (register, login/logout, verify, recover)  
- Database schema with RLS  

## Phase 2: Projects First
- Project CRUD via dashboard modals  
- Activate/deactivate toggle  
- Daily stint expectation and custom duration  

## Phase 3: Core Stints
- Start/stop from project cards  
- Pause/resume included  
- Single active stint enforcement  
- Manual stop + auto-complete with timer  
- Real-time countdown, cross-device sync  

## Phase 4: Dashboard & Experience
- Dashboard grid with project cards  
- Daily progress badges  
- Highlight active stint  
- Simple completion celebration  
- Daily reset at midnight  
- Error handling (network drops, conflicts)  

## Phase 5: Value Layer (Stretch)
- Daily/weekly totals  
- Streak counter  
- CSV export (Focus Ledger)  

---

# Logical Dependency Chain

## Foundation Layer
1. Authentication  
2. Database schema + RLS  

## Core Project Layer
3. Project CRUD via dashboard modals  

## Core Stint Layer
4. Stint management (start/stop, pause/resume, single active)  
5. Timer system with real-time sync  

## Dashboard Experience Layer
6. Dashboard shell + project cards  
7. Visual feedback + daily reset  
8. Error handling + cross-device sync  

## Value Layer
9. Light analytics + CSV export  

---

# Risks and Mitigations

- **Real-time sync issues:** Mitigate with server-authoritative timing and fallback polling  
- **Timer accuracy in background tabs:** Use Web Workers and server-side validation  
- **Data consistency at scale:** Use PostgreSQL constraints and optimistic locking  
- **Feature creep:** Lock MVP scope, defer advanced analytics until later  
- **Market validation:** Private beta with consultants, analytics for engagement patterns  

---

# Appendix

## Competitive Gap
- Time trackers (Toggl, Harvest): micromanagement, billing focus  
- Pomodoro apps (Forest, Focus Keeper): session-based, not project-aware  
- Project management (Asana, Trello): task-based, no focus tracking  
- **Gap:** No app combines project-level focus tracking with professional reporting  

## Browser Compatibility
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+  
- Mobile Safari/Chrome 90+  
- PWA installable, offline stint completion  

## Security
- HTTPS everywhere  
- Supabase encryption at rest + transit  
- Row Level Security for user isolation  
- GDPR export & deletion support  
