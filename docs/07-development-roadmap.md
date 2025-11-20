# LifeStint - Development Roadmap

**Product Name:** LifeStint  
**Document Version:** 3.0  
**Date:** October 24, 2025

---

## Phase 1: Foundation (Weeks 1-2)

**Goal:** Set up authentication, database, and development environment.

**Tasks:**
1. Initialize Nuxt 3 project with TypeScript
2. Configure Supabase project (production + staging)
3. Set up local Supabase development environment
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

## Phase 2: Project Management (Weeks 3-4)

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

## Phase 3: Stint Management Core (Weeks 5-7)

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

## Phase 4: Timer System & Auto-Completion (Week 8)

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

## Phase 5: Dashboard Experience & Daily Reset (Weeks 9-10)

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

## Phase 6: Offline Support (Week 11)

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

## Phase 7: Analytics & Export (Weeks 12-13)

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

## Phase 8: Settings & Preferences (Week 14)

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

## Phase 9: Polish & Launch Prep (Weeks 15-16)

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

## Phase 10: Beta Launch & Iteration (Weeks 17-20)

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

## Post-MVP Roadmap (Future Phases)

### Phase 11: Advanced Analytics
- Weekly/monthly trends
- Project comparison charts
- Time of day productivity analysis
- Export to PDF with charts

### Phase 12: Collaboration Features
- Shared projects (team stints)
- Team analytics dashboard
- Admin role for project managers

### Phase 13: Integrations
- Calendar sync (Google Calendar, Outlook)
- Slack notifications
- Zapier integration
- Time tracking tool import (Toggl, Harvest)

### Phase 14: Mobile Apps
- React Native app (iOS + Android)
- Native notifications
- Offline-first architecture
- Widget for home screen

### Phase 15: Enterprise Features
- SSO (SAML, OAuth)
- Custom branding
- Advanced permissions
- Audit logs (user-facing)
- SLA guarantees

---

**Related Documents:**
- [03-feature-requirements.md](./03-feature-requirements.md) - Feature specifications
- [04-technical-architecture.md](./04-technical-architecture.md) - Technical architecture
- [08-success-metrics.md](./08-success-metrics.md) - Success metrics for each phase

