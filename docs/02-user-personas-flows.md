# LifeStint - User Personas & Experience Flows

**Product Name:** LifeStint  
**Document Version:** 3.0  
**Date:** October 24, 2025

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

## Onboarding Flow

### Step 1: Registration

- Land on marketing page with "Start Free" CTA
- Registration modal: Email, password, confirm password
- Agree to Terms and Privacy Policy (checkboxes)
- Submit → Email verification notice

### Step 2: Email Verification

- Check inbox for verification email
- Click verification link → Redirects to dashboard
- Welcome modal appears

### Step 3: Welcome Modal

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

### Guided First Stint

- If user stops before 10 minutes: Tooltip "Stints work best with at least 10 minutes of focus"
- At 25 minutes: Encouraging notification "Halfway there! Keep going 💪"
- At completion: Celebration animation with confetti
- Modal: "Congrats on your first stint! 🎉"
  - Shows summary: Project, duration, time
  - "View Analytics" button → Analytics page
  - "Start Another Stint" button → Dashboard

### Dashboard Tour (Optional, Skippable)

- Tooltips highlight:
  1. Project cards: "Your projects live here"
  2. Progress badges: "Track daily goals"
  3. Active stint: "Only one stint at a time"
  4. "+ New Project" button: "Add more projects anytime"
  5. Analytics link: "View your progress and export reports"
- "Skip Tour" always visible

### Empty State After Onboarding

- If user doesn't create project during onboarding: Shows empty state with "+ New Project" CTA

---

## Daily Usage Flow

### Morning Routine

1. Open LifeStint (web app or PWA)
2. Dashboard loads with today's progress (all at 0 if new day)
3. Review project cards, decide which to work on first
4. Click "Start" on chosen project
5. Confirmation modal (if needed): "You're about to start a 50-minute stint on [Project]. Ready?"
6. Begin work with timer running in corner

### During Stint

- Timer visible in browser tab title: "(42:15) LifeStint - [Project Name]"
- Can switch browser tabs, timer continues
- If need break: Click "Pause", do break, click "Resume"
- If task completed early: Click "Stop", optionally add notes

### End of Stint

- Auto-complete: Browser notification + dashboard updates
- Manual stop: Notes modal (optional) → Dashboard updates
- Celebration if daily goal reached: Confetti animation + sound effect (can disable in settings)
- Progress badge updates: "2 of 2 stints today ✓"

### Afternoon Routine

- Switch to different project
- Repeat start → work → complete cycle
- Check progress badges throughout day

### Evening Wrap-Up

- Review dashboard to see completed stints
- Check streaks: "🔥 5 day streak maintained!"
- Optional: Export CSV for client update

---

## Weekly Review Flow

### Sunday Evening (Typical Use)

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

### Insight Gained

- Wednesday disruption identified → Schedule protected focus time
- Client B needs more attention → Adjust schedule
- Personal project making unexpected progress → Celebrate!

---

## Multi-Device Experience

### Scenario: Start on Desktop, Continue on Mobile

1. **Desktop (9 AM):** Start stint on "Client Website" project → 50-minute timer begins
2. **Leave desk (9:30 AM):** Close laptop (timer continues via server)
3. **Open phone (9:35 AM):** LifeStint PWA loads
   - Real-time sync: Dashboard shows "Client Website" stint active
   - Timer shows 15:00 remaining (accurate despite device switch)
   - Can pause/resume/stop from phone
4. **Return to desk (9:50 AM):** Open laptop
   - Real-time sync: Shows stint ended at 10:00 AM (auto-completed on server)
   - Dashboard updated with completed stint

### Conflict Resolution

- If network was offline on mobile and user started different stint locally
- On reconnect: Dialog "Conflict detected"
  - Shows: Desktop stint (Client Website, 25 min remaining) vs Mobile stint (Personal Project, 5 min elapsed)
  - Options: Keep desktop stint, Keep mobile stint, Mark both interrupted
  - User chooses → Server resolves, broadcasts to all devices

---

## Accessibility Considerations

### WCAG 2.1 Level AA Compliance

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

**Related Documents:**
- [01-product-overview-strategy.md](./01-product-overview-strategy.md) - Product context and business rationale
- [03-feature-requirements.md](./03-feature-requirements.md) - Detailed feature specifications
- [06-implementation-guide.md](./06-implementation-guide.md) - Multi-device sync implementation details

