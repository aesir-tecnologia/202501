# LifeStint - Remaining Development Tasks

> **Source of Truth:** [docs/07-development-roadmap.md](docs/07-development-roadmap.md)
>
> **⚠️ IMPORTANT:** When completing any task below, update the status in `docs/07-development-roadmap.md` to reflect the change. Mark completed items as `COMPLETED` and update partial items accordingly.

---

## Phase 1: Foundation — Complete ✓

- [x] Add preference columns to `user_profiles` table (default_stint_duration, celebration_animation, desktop_notifications)
- [x] Configure Sentry error tracking (`@sentry/nuxt` module + DSN setup)

---

## Phase 3: Stint Management Core — Complete ✓

- [x] Add Supabase Realtime subscriptions for stint events (currently uses 60-second polling) ✅ COMPLETED

<details>
<summary><strong>📋 Implementation Plan: Supabase Realtime Subscriptions</strong></summary>

### Scope
- **App-wide** subscriptions (all authenticated pages)
- **Complement** existing 60-second timer sync (keep as fallback)
- **Tables**: `stints` + `daily_summaries`

### Files to Create/Modify

| File | Action |
|------|--------|
| `app/composables/useRealtimeSubscriptions.ts` | **CREATE** — Singleton composable |
| `app/layouts/default.vue` | **MODIFY** — Add composable call at ~line 100 |
| `app/composables/useRealtimeSubscriptions.test.ts` | **CREATE** — Unit tests |

### Implementation Details

**Step 1: Create `useRealtimeSubscriptions.ts`**

Singleton composable following `useStintTimer.ts` pattern:
- Global state object outside function (single subscription per user)
- `watch()` on user for login/logout handling
- Subscribe to `postgres_changes` for both tables with `user_id=eq.${userId}` filter
- Cache invalidation via `queryClient.invalidateQueries(stintKeys.all)` / `dailySummaryKeys.all`
- Debounced invalidation (100ms) to prevent rapid re-renders
- Retry logic (3 attempts with exponential backoff) on subscription failure
- Cleanup via `beforeunload` event

**Step 2: Integrate in `default.vue`**

Add after `useStintTimer()` call (line ~99):
```typescript
if (import.meta.client) {
  useRealtimeSubscriptions();
}
```

### Cache Invalidation Strategy

| Event | Query Keys Invalidated |
|-------|------------------------|
| Any stint change | `stintKeys.all` (covers active, paused, lists, details) |
| Any daily_summary change | `dailySummaryKeys.all` (covers lists, detail, weekly) |

### Error Handling

| Scenario | Handling |
|----------|----------|
| Subscription fails | Retry 3× with exponential backoff |
| Max retries exceeded | Show warning toast, rely on polling fallback |
| User logs out | Unsubscribe immediately |
| Network disconnect | Supabase auto-reconnects |

### Verification

1. `supabase start` → `npm run dev`
2. Open two browser tabs logged in as same user
3. Start/pause/complete stint in tab A → verify tab B updates instantly
4. Check console for `[Realtime]` logs
5. Run tests: `npm test -- useRealtimeSubscriptions`

</details>

---

## Phase 5: Dashboard Experience & Daily Reset — 5 tasks remaining

> ✅ **Daily reset is IMPLEMENTED.** Database functions, pg_cron job, composables, and dashboard UI are all complete.
> Only missing: Realtime broadcast on reset (clients must refresh to see updates from other devices).

### Streak Display
- [ ] Implement real-time streak updates when stint completes (push-based, not cache invalidation)

### Celebration Features
- [x] Integrate confetti animation library (e.g., `canvas-confetti`) for daily goal completion ✅ COMPLETED
- [x] Create encouraging messages rotation system for goal achievement ✅ COMPLETED

### Empty States
- [ ] Design "no stints today" state with motivational quote rotation
- [ ] Add "all projects inactive" reminder banner with reactivation CTA

### Error Handling Polish
- [ ] Replace sync failure toast with persistent network offline banner
- [ ] Add manual "Retry" button for failed server operations

### Timezone
- [x] Persist timezone selection to `user_profiles.timezone` column on save ~~(UI exists but doesn't save; daily reset already uses this column)~~ COMPLETED

---

## Phase 6: Offline Support — 7 tasks remaining (entire phase)

### PWA Infrastructure
- [ ] Add `@vite-pwa/nuxt` module and configure PWA manifest (icons, splash screens, theme)
- [ ] Implement Service Worker with cache-first strategy for static assets
- [ ] Configure network-first strategy for API calls

### Offline Data Layer
- [ ] Install Dexie.js and create `offline_queue` IndexedDB table
- [ ] Implement `navigator.onLine` detection with offline banner UI
- [ ] Build sync manager to process queue on reconnect (prioritize active stint)

### Conflict Resolution
- [ ] Create conflict resolution modal for offline data divergence

---

## Phase 7: Analytics & Export — 1 task remaining

- [ ] Verify and document grace period logic (1-day window) in streak calculation

---

## Phase 8: Settings & Preferences — 4 tasks remaining

### Database Persistence
- [x] Add preference columns to `user_profiles` (migration in Phase 1)
- [x] Replace localStorage reads/writes with Supabase queries in settings page
- [x] Add TanStack Query composable for preferences (`usePreferences`)

### Security
- [ ] Implement password change flow (current password verification + new password with confirmation)

### Privacy & GDPR
- [ ] Build data export feature (export all user data as JSON: projects, stints, preferences)

### Account Management
- [ ] Implement account soft-delete with confirmation modal and email notification
- [ ] Add scheduled cleanup job for soft-deleted accounts (30-day retention)

---

## Phase 9: Polish & Launch Prep — 16 tasks remaining (entire phase)

### Performance
- [ ] Implement route-based code splitting (lazy load analytics, reports, settings)
- [ ] Optimize images with `@nuxt/image` module
- [ ] Add database indexes and analyze slow queries
- [ ] Reduce bundle size (analyze with `npx nuxi analyze`)
- [ ] Run Lighthouse audit and fix issues (target >90 all metrics)

### Accessibility
- [ ] Conduct WCAG 2.1 Level AA compliance audit
- [ ] Test keyboard navigation on all interactive elements
- [ ] Test with screen readers (VoiceOver on macOS)
- [ ] Verify color contrast ratios meet standards
- [ ] Add visible focus indicators to all interactive elements

### Browser Testing
- [ ] Test on Chrome, Firefox, Safari, Edge (latest versions)
- [ ] Test on Mobile Safari and Mobile Chrome
- [ ] Test responsive layouts from 320px to 2560px

### Security
- [ ] Verify all RLS policies with penetration testing
- [ ] Add rate limiting to auth endpoints
- [ ] Verify XSS prevention in user-generated content (notes)

---

## Phase 10: Beta Launch & Iteration — 5 tasks remaining (entire phase)

- [ ] Set up Mixpanel/analytics events for key user actions
- [ ] Create user onboarding email sequence
- [ ] Build feedback collection mechanism (email + Discord/Slack)
- [ ] Prepare rollback plan documentation
- [ ] Set up uptime monitoring (BetterUptime or similar)

---

## Testing Gaps — 6 tasks remaining

- [ ] Add E2E tests for project modal workflows (create, edit, archive)
- [ ] Add E2E tests for complete stint workflow (start → pause → resume → complete)
- [ ] Add load testing for race conditions (simultaneous stint starts)
- [ ] Add tests for daily reset across timezones
- [ ] Add tests for streak calculations across date ranges
- [ ] Add tests for CSV export with various date ranges and timezones

---

## Summary by Priority

### 🔴 High Priority (Blocking Production)
1. ~~Sentry error tracking~~ ✅ COMPLETED
2. ~~User preferences columns in `user_profiles`~~ ✅ COMPLETED

### 🟡 Medium Priority (Feature Completeness)
3. ~~Celebration animations (settings UI exists, no implementation)~~ ✅ COMPLETED
4. Offline support (Phase 6) — entire phase
5. ~~Supabase Realtime subscriptions (enables multi-device sync)~~ ✅ COMPLETED

### 🟢 Low Priority (Polish)
6. Empty state improvements (motivational quotes, inactive reminders)
7. Network offline banner (currently uses toast)
8. E2E test coverage

---

**Last Validated:** January 10, 2026
**Total Remaining Tasks:** 44
