# LifeStint - Operations, Security & Compliance

**Product Name:** LifeStint  
**Document Version:** 3.0  
**Date:** October 24, 2025

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

## Monitoring Alerts

### Sentry Alerts (Slack notifications)

- **>10 errors in 5 minutes** → Critical
- **>50 errors in 1 hour** → Warning
- **New error type (first occurrence)** → Info
- **Error rate increase >50% vs previous hour** → Warning

### Uptime Alerts (BetterUptime, future)

- **API endpoint down (2 consecutive failures)** → Critical
- **Response time >2 seconds (p95)** → Warning
- **SSL certificate expiring in 30 days** → Info

### Database Alerts (Supabase, built-in)

- **Connection pool >80% utilization** → Warning
- **Disk usage >80%** → Warning
- **Query time >5 seconds** → Warning
- **Replication lag >1 minute** → Critical

### Custom Alerts (Edge Function)

- **Active stints >1 hour overdue for completion** → Warning (cron may be failing)
- **Daily reset not triggered for user in 25 hours** → Critical
- **CSV export failures >10 in 1 hour** → Warning

---

## Data Retention Policy

### User Data

- **Active accounts:** Retained indefinitely
- **Deleted accounts:** 30-day soft delete, then purged
- **Inactive accounts (no login >2 years):** Notified at 18 months, deleted at 24 months

### Stint History

- **Free tier:** 90 days
- **Pro tier:** Unlimited retention
- **After account deletion:** Purged after 30 days

### Analytics Data

- **Mixpanel events:** 25 months retention (Mixpanel default)
- **Daily summaries:** Unlimited retention (small data size)

### Logs

- **Supabase logs:** 7 days (free tier), 30 days (Pro project)
- **Sentry events:** 90 days
- **Audit logs:** 90 days, then archived to S3 (future)

### Backups

- **Daily database backups:** 7 days retention
- **Weekly backups:** 30 days retention
- **Monthly backups:** 1 year retention (future)

---

## GDPR Compliance Checklist

### User Rights

✅ **Right to access:** Data export via settings  
✅ **Right to rectification:** Users can edit their data  
✅ **Right to erasure:** Account deletion available  
✅ **Right to data portability:** CSV and JSON exports  
✅ **Right to object:** Opt-out of analytics/emails

### Privacy by Design

✅ **Minimal data collection:** Only email, name, timezone  
✅ **No PII in logs:** Logs sanitized before storage  
✅ **Encryption at rest and in transit:** AWS KMS + TLS 1.3  
✅ **RLS enforces data isolation:** Database-level security

### Transparency

✅ **Privacy policy:** Clearly explains data usage  
✅ **Cookie consent banner:** For analytics cookies  
✅ **No data sold to third parties:** Explicitly stated

### Data Protection

✅ **Supabase GDPR-compliant:** EU data centers available  
✅ **Data Processing Agreement (DPA):** With Supabase  
✅ **Regular security audits:** Annual review

---

## Browser Compatibility Matrix

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

## API Rate Limiting Details

### Cloudflare Rate Limits (per IP)

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

### Supabase Rate Limits (per user)

```
Database reads → 1000 per minute
Database writes → 200 per minute
Realtime connections → 10 per user
Realtime messages → 100 per second
Storage uploads → 100 per hour
```

### 429 Response Format

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Try again in 45 seconds.",
  "retry_after": 45,
  "limit": 60,
  "remaining": 0
}
```

### Client-Side Handling

- Show toast notification: "Too many requests. Please wait."
- Disable action button for `retry_after` seconds
- Exponential backoff for retries (1s, 2s, 4s)

---

## Database Migration Strategy

### Migration Tool

**Supabase Migrations** (SQL files in `/supabase/migrations`)

### Migration Process

1. Develop schema changes in migration files
2. Generate migration file: `supabase migration new <name>`
3. Test migration in local database: `supabase db reset`
4. Verify migration success (check tables, indexes, RLS policies)
5. Regenerate TypeScript types: `npm run supabase:types`

### Rollback Plan

- Each migration includes `-- REVERT` section
- For local development: `supabase db reset` restores to clean state
- Migration files versioned in Git for rollback history

### Zero-Downtime Migrations

- Additive changes (new columns) deployed first
- Deploy application code that works with old & new schema
- Run data migration (if needed)
- Deploy application code that requires new schema
- Remove old columns (if applicable)

---

## Glossary

**Stint:** A predetermined focused work session on a single project, typically 120 minutes.

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

**Related Documents:**
- [04-technical-architecture.md](./04-technical-architecture.md) - Infrastructure details
- [05-database-schema.md](./05-database-schema.md) - Database structure
- [08-success-metrics.md](./08-success-metrics.md) - Success metrics and monitoring

