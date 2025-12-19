# LifeStint - Success Metrics & Analytics

**Product Name:** LifeStint  
**Document Version:** 4.1
**Date:** December 19, 2025

---

## MVP Success Criteria (First 3 Months)

### User Acquisition

- 500 registered users
- 200 weekly active users (WAU)
- 30% conversion from landing page to signup

### Engagement

- 7-day retention: >40%
- 30-day retention: >25%
- Average stints per user per week: >5
- Average session duration: >25 minutes
- Stint completion rate: >80% (not interrupted)

### Product Validation

- CSV export usage: >20% of active users monthly
- Streak maintenance: >30% of users with 5+ day streak
- Average projects per user: 3-4
- Mobile usage: >40% of sessions

### Business Metrics

- Free to Pro conversion: >5% (post-MVP with paid tier)
- Churn rate: <10% monthly
- NPS (Net Promoter Score): >40

### Technical Health

- Uptime: >99.5%
- API response time (p95): <500ms
- Dashboard load time: <2 seconds
- Error rate: <0.1% of requests

---

## Key Performance Indicators (KPIs)

### North Star Metric

**Weekly focused minutes per user**
- Target: 300+ minutes (2.5+ stints at 120 min each)
- Why: Directly measures core value proposition (focused work)
- Tracking: Sum of `actual_duration` for completed stints per user per week

### Supporting Metrics

#### Usage

- **Daily active users (DAU) / Monthly active users (MAU) ratio**
  - Target: >0.3 (30% of monthly users active daily)
  - Indicates habit formation

- **Average stints per user per day**
  - Target: >1.5 stints/day
  - Measures consistent usage

- **Stint completion rate (not interrupted)**
  - Target: >80%
  - Measures focus quality

- **Pause frequency (lower is better)**
  - Target: <20% of stints paused
  - Indicates uninterrupted focus

#### Retention

- **D1 retention (return next day)**
  - Target: >50%
  - Early indicator of product-market fit

- **D7 retention (return within 7 days)**
  - Target: >40%
  - Key milestone for habit formation

- **D30 retention (return within 30 days)**
  - Target: >25%
  - Long-term engagement indicator

- **Cohort retention curves**
  - Track retention by signup week
  - Identify trends and improvements

#### Quality

- **Average actual stint duration vs planned**
  - Target: 85-100% of planned duration
  - Measures timer accuracy and user commitment

- **Projects with daily goals met**
  - Target: >60% of active projects meet daily goals
  - Measures goal achievement

- **Streak length distribution**
  - Track: % users with 1+, 7+, 14+, 30+ day streaks
  - Measures habit strength

- **CSV export frequency**
  - Target: >20% of active users export monthly
  - Validates professional reporting value

#### Monetization (Post-MVP)

- **Free to Pro conversion rate**
  - Target: >5%
  - Measures willingness to pay

- **Monthly recurring revenue (MRR)**
  - Target: $4K MRR by month 6
  - Business sustainability metric

- **Average revenue per user (ARPU)**
  - Target: $1.20/month (40% free, 60% Pro)
  - Revenue efficiency

- **Customer lifetime value (CLV)**
  - Target: $29 (24-month avg retention)
  - Long-term value

- **Churn rate**
  - Target: <10% monthly
  - Retention indicator

---

## Analytics Events

### User Lifecycle

**user_registered**
- Properties: `email`, `registration_source`, `timezone`
- When: User completes registration form
- Purpose: Track signup funnel

**email_verified**
- Properties: `time_to_verification` (seconds)
- When: User clicks verification link
- Purpose: Measure verification friction

**onboarding_completed**
- Properties: `time_to_first_stint` (seconds), `projects_created`
- When: User completes first stint
- Purpose: Measure onboarding success

### Project Events

**project_created**
- Properties: `project_id`, `expected_daily_stints`, `custom_duration`, `has_color_tag`
- When: User creates new project
- Purpose: Track project setup patterns

**project_edited**
- Properties: `project_id`, `changed_fields` (array)
- When: User updates project
- Purpose: Measure feature usage

**project_activated**
- Properties: `project_id`
- When: User activates inactive project
- Purpose: Track project lifecycle

**project_deactivated**
- Properties: `project_id`
- When: User deactivates project
- Purpose: Track project lifecycle

**project_archived**
- Properties: `project_id`, `stint_count`, `days_active`
- When: User archives project
- Purpose: Measure project completion patterns

### Stint Events

**stint_started**
- Properties: `project_id`, `planned_duration`, `device_type`, `is_custom_duration`
- When: User starts a stint
- Purpose: Core usage tracking

**stint_paused**
- Properties: `project_id`, `time_elapsed` (seconds), `pause_count`
- When: User pauses active stint
- Purpose: Measure interruption patterns

**stint_resumed**
- Properties: `project_id`, `pause_duration` (seconds)
- When: User resumes paused stint
- Purpose: Measure interruption patterns

**stint_stopped_manual**
- Properties: `project_id`, `actual_duration` (seconds), `has_notes`, `completion_percentage`
- When: User manually stops stint
- Purpose: Measure completion patterns

**stint_auto_completed**
- Properties: `project_id`, `actual_duration` (seconds)
- When: Stint auto-completes at planned end time
- Purpose: Measure completion patterns

**stint_interrupted**
- Properties: `project_id`, `reason`, `time_elapsed` (seconds)
- When: Stint marked as interrupted
- Purpose: Track failure modes

### Analytics Events

**analytics_viewed**
- Properties: `page` (daily/weekly), `date_range`
- When: User views analytics page
- Purpose: Measure feature usage

**csv_exported**
- Properties: `date_range`, `stint_count`, `projects_count`
- When: User exports CSV
- Purpose: Validate professional reporting value

**streak_reached**
- Properties: `streak_length`, `milestone` (7/14/30 days)
- When: User reaches streak milestone
- Purpose: Measure habit formation

### Settings Events

**preferences_updated**
- Properties: `changed_fields` (array)
- When: User updates preferences
- Purpose: Track customization usage

**theme_changed**
- Properties: `new_theme`
- When: User changes theme
- Purpose: Track feature usage

**password_changed**
- Properties: `success`
- When: User changes password
- Purpose: Security tracking

**account_deleted**
- Properties: `reason` (optional)
- When: User deletes account
- Purpose: Churn analysis

---

## Tracking Implementation

### Event Tracking Library

- **Mixpanel** (post-MVP)
  - User event tracking
  - Funnel analysis
  - Cohort analysis
  - A/B test tracking

### Event Structure

```typescript
interface AnalyticsEvent {
  event: string;
  properties: Record<string, any>;
  userId: string;
  timestamp: number;
  sessionId: string;
}
```

### Privacy Considerations

- No PII in event properties (use hashed IDs)
- Opt-out mechanism for analytics
- GDPR-compliant data handling
- Event data retention: 25 months (Mixpanel default)

---

## Dashboard Metrics

### Product Dashboard (Weekly Review)

**Acquisition:**
- New signups (week over week)
- Signup sources breakdown
- Conversion rate (landing → signup)

**Engagement:**
- DAU/MAU ratio
- Average stints per user
- Stint completion rate
- Streak distribution

**Retention:**
- D1, D7, D30 retention rates
- Cohort retention curves
- Churn rate

**Feature Usage:**
- CSV export frequency
- Analytics page views
- Project creation rate
- Settings customization rate

### Technical Dashboard (Daily Review)

**Performance:**
- API response time (p50, p95, p99)
- Dashboard load time
- Real-time sync latency
- Timer drift measurement

**Reliability:**
- Uptime percentage
- Error rate
- Failed API calls
- WebSocket disconnections

**Usage:**
- API calls per minute
- Database query performance
- pg_cron job execution time
- Storage usage

---

**Related Documents:**
- [01-product-overview-strategy.md](./01-product-overview-strategy.md) - Business goals and strategy
- [07-development-roadmap.md](./07-development-roadmap.md) - Phase-specific success criteria
- [09-operations-compliance.md](./09-operations-compliance.md) - Monitoring and alerting

