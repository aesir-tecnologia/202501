# Design System Migration Plan: Focused Warmth + Deep Focus Hybrid

## Overview

Migrate LifeStint from the current design to the "Focused Warmth + Deep Focus Hybrid" design system documented in `NEW-DESIGN.md` and visualized in `/public/mockups/focused-warmth-hybrid.html`.

**Reference Mockup:** `/public/mockups/focused-warmth-hybrid.html`

---

## ✅ RESOLVED: Decision Points

**All architectural decisions have been resolved (2026-01-04):**

### Decision 1: Dashboard Layout → **Option A: Match Mockup** ✅
2-column grid layout with timer hero (2fr) + sticky sidebar (380px). Major restructure to match design vision.

### Decision 2: Timer Hero Component → **Option A: Hero Timer** ✅
New `DashboardTimerHero.vue` component with 72px monospace timer, ambient glow, centered display.

### Decision 3: Sidebar Components → **Option A: Full Sidebar** ✅
Session card + Today's Stats (4-item grid) + enhanced Streak card. Full mockup implementation.

---

## Current Status

### ✅ Phase 1: Foundation (COMPLETE)
- [x] Add Google Fonts imports (Fraunces, Instrument Sans) → `main.css:1`
- [x] Create `app/assets/css/tokens.css` with CSS variables → EXISTS with all tokens
- [x] Update `app.config.ts` to use orange/green colors → `primary: 'orange', secondary: 'green', neutral: 'stone'`

### ✅ Phase 2: Landing Page (COMPLETE)
- [x] Update colors from violet/sky to orange/green/stone → No forbidden colors found
- [x] Fix light mode backgrounds (warm cream #fffbf5) → `index.vue:66`
- [x] Update dark mode to warm charcoal (stone-900) → `index.vue:66`
- [x] Apply font-serif to headings → Multiple h1/h2/h3 elements

### ⏳ Phase 3: Dashboard & Components (IN PROGRESS)
- [x] Update `StreakBanner.vue` gradient → Already uses `from-orange-600 to-green-600`
- [x] Update `ProjectListCard.vue` → **V27 rewrite complete (§3.6) — ⚠️ DO NOT MODIFY**
- [x] Delete `ProjectCardToolbar.vue` → **Deleted (§3.6.6)**
- [x] Update `ProjectEditModal.vue` → **Active toggle added (§3.6.5)**
- [x] Update `ProjectList.vue` → **Deprecated events removed (§3.6.4)**
- [ ] **Dashboard page warm backgrounds** → Missing `bg-[#fffbf5]` / `stone-900`
- [ ] **Typography (Fraunces serif for headings)** → Dashboard `<h2>` lacks `font-serif`
- [ ] **Ambient glow effects** → Not implemented
- [ ] **Dashboard 2-column layout** → Ready (Decision 1 resolved: Match Mockup)
- [ ] **DashboardTimerHero.vue** → Create new component (Decision 2 resolved: Hero Timer)
- [ ] **TodaysStats.vue** → Create new component (Decision 3 resolved: Full Sidebar)
- [ ] **DashboardSidebar.vue** → Create wrapper component for sidebar

### ❌ Phase 4: Auth Pages (NOT STARTED)
- [ ] Update auth page backgrounds
- [ ] Apply consistent styling to login/register forms

### ❌ Phase 5: Validation Script (NOT STARTED)
- [ ] Create `scripts/validate-design-system.ts`
- [ ] Add `npm run validate:design` script

### ❌ Phase 6: Cleanup (NOT STARTED)
- [ ] Delete mockup files after validation passes
- [ ] Update documentation

---

## Gap Analysis: Current vs Mockup

| Feature | Mockup | Current | Gap | Status |
|---------|--------|---------|-----|--------|
| Foundation (tokens, fonts) | CSS variables + fonts | `tokens.css` exists | None | ✅ Done |
| Landing Page | Warm cream, orange/green | Matches mockup | None | ✅ Done |
| **Project Cards (V27)** | Glass minimal + color ring | V27 horizontal compact | None | ✅ Done |
| Dashboard Layout | 2-column (timer 2fr + sidebar 1fr) | Single column with tabs | **Major** | ⏳ Ready |
| Timer Display | 72px hero with ambient glow | Small inline timer in cards | **Major** | ⏳ Ready |
| Typography | Fraunces serif for headings | Landing ✅, Dashboard ❌ | **Medium** | ⏳ Partial |
| Sidebar | Session + Stats grid + Streak card | Streak banner at top only | **Major** | ⏳ Ready |
| Page Background | Warm cream/charcoal | Landing ✅, Dashboard ❌ | **Medium** | ⏳ Partial |
| Ambient Glows | Radial glow effects on timer | Landing has glows, Dashboard none | **Medium** | ⏳ Partial |
| Stats Section | Today's Stats grid (4 items) | None | **Medium** | ⏳ Ready |

---

## Phase 3: Dashboard Implementation (After Decisions)

### 3.1 Dashboard Page Background
Update `app/pages/dashboard.vue` to use warm backgrounds:
```html
<template>
  <div class="min-h-screen bg-[#fffbf5] dark:bg-stone-900">
    <!-- content -->
  </div>
</template>
```

### 3.2 Typography - Apply Fraunces Serif
Update all dashboard headings to use `font-serif`:
- `UPageHeader` title → Add font-serif class
- Card headers (h2, h3) → Add font-serif class
- Project names in cards → Consider serif

### 3.3 Dashboard Layout (Depends on Decision 1)

**If Option A (Match Mockup):**
```html
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div class="lg:col-span-2">
    <DashboardTimerHero />
  </div>
  <div class="space-y-6">
    <ProjectsSidebar />
    <TodaysStats />
    <StreakCard />
  </div>
</div>
```

**If Option B (Enhance Current):**
- Keep existing tab-based layout
- Add warm backgrounds only
- Apply font-serif to headings

### 3.4 Ambient Glow Effects
Add to timer displays and active states:
```css
.timer-glow {
  text-shadow: 0 0 60px var(--accent-primary-glow);
}
.card-glow {
  box-shadow: var(--shadow-glow);
}
```

### 3.5 Streak Card Enhancement
Transform current `StreakBanner.vue` to match mockup's sidebar streak card style (if sidebar is chosen).

### ✅ 3.6 Project Card V27 Migration (COMPLETE)

> ⚠️ **DO NOT MODIFY `ProjectListCard.vue`** — V27 redesign is complete and tested.
> The component has been fully rewritten with glass morphism, color rings, inline timer,
> and all 5 states (ready/running/paused/exceeded/inactive). Any dashboard layout changes
> must work WITH the existing card design, not alter it.

Migrate `ProjectListCard.vue` from complex vertical layout to V27 "Glass Minimal + Color Ring" horizontal compact design. Reference: `/public/mockups/project-card-27.html`

**Key Decisions:**
- Toggle Active → Moved to Edit Modal (not on card)
- Stop for Paused → Opens completion modal (same as running)
- ProjectCardToolbar → Delete entirely (edit button inlined)

#### ✅ 3.6.1 ProjectListCard.vue Template Rewrite (COMPLETE)

New V27 horizontal layout:
```
┌─────────────────────────────────────────────────────────────────────┐
│  ⠿  ○  Project Name                    --:--   2/3   ✎    ▶       │
│     ↑  Meta text                                ↑     ↑    ↑       │
│  Drag Ring                              Badge  Edit  Action        │
└─────────────────────────────────────────────────────────────────────┘
```

- [x] Replace template with V27 horizontal structure
- [x] Drag handle (keep existing)
- [x] Color ring (18px circle outline, replaces left bar)
- [x] Project name + meta text ("30m per stint" | "Started 10:32 AM" | "Paused 5m ago")
- [x] Timer display inline (idle/running/paused states)
- [x] Progress badge (`X/Y +N` format with green extra indicator)
- [x] Edit button (inline, pencil icon)
- [x] Action buttons (Play | Pause+Stop | Resume+Stop)

#### ✅ 3.6.2 ProjectListCard.vue Script Updates (COMPLETE)

**Add computed:**
- [x] `metaText` - Duration or status text
- [x] `extraStints` - completed - expected (for +N badge)
- [x] `colorRingClass` - border-{color}-500 for ring
- [x] `timerDisplayState` - 'idle' | 'running' | 'paused'

**Modify handlers:**
- [x] `handleResumeStint()` - Handle both activeStint and pausedStint
- [x] `handleCompleteStint()` - Handle both activeStint and pausedStint

**Remove:**
- [x] `statusPill` computed
- [x] `progressSegmentsCount` / `filledSegmentsCount` computed
- [x] `dailyProgressSummary` computed
- [x] `cardStyles` object
- [x] `handleResumePausedStint()` / `handleAbandonPausedStint()`
- [x] Emits: `resumePausedStint`, `abandonPausedStint`

#### ✅ 3.6.3 ProjectListCard.vue Styles (COMPLETE)

- [x] Replace all styles with V27 CSS from mockup
- [x] `.card-v27` base with glass morphism
- [x] `.state-running` / `.state-inactive` modifiers
- [x] `.project-color` ring styles
- [x] `.timer-display` state variants (idle/running/paused)
- [x] `.progress-badge` with `.extra` for +N
- [x] `.edit-btn` / `.play-btn` / `.action-btn` styles
- [x] Responsive wrap at mobile

#### ✅ 3.6.4 ProjectList.vue Updates (COMPLETE)

- [x] Remove `@resume-paused-stint` event binding
- [x] Remove `@abandon-paused-stint` event binding
- [x] Remove `handleResumePausedStint()` handler
- [x] Remove `handleAbandonPausedStint()` handler
- [x] Ensure `handleResumeStint()` handles paused stint case

#### ✅ 3.6.5 ProjectEditModal.vue Updates (COMPLETE)

Add active toggle in footer (before Archive button):
- [x] Add emit: `toggleActive: [project: ProjectRow]`
- [x] Add prop: `isTogglingActive?: boolean`
- [x] Add USwitch for active/inactive status
- [x] Add handler calling parent toggle

#### ✅ 3.6.6 Delete ProjectCardToolbar.vue (COMPLETE)

- [x] Remove `app/components/ProjectCardToolbar.vue` file

#### 3.6.7 V27 States Reference

| State | Timer | Meta | Action Buttons |
|-------|-------|------|----------------|
| Ready | `--:--` muted | "30m per stint" | Play |
| Running | `MM:SS` green + pulse | "Started 10:32 AM" | Pause + Stop |
| Paused | `MM:SS` amber + icon | "Paused 5m ago" | Resume + Stop |
| Goal Exceeded | (any) | (any) | Badge shows `+N` |
| Inactive | `--:--` faded | "Inactive" | Play (disabled) |

#### 3.6.8 Testing Checklist

- [ ] All 5 states render correctly
- [ ] Dark mode colors adapt
- [ ] Drag-and-drop reordering works
- [ ] Timer updates in real-time
- [ ] +N extra indicator shows when exceeding goal
- [ ] Stop opens completion modal for both running and paused
- [ ] Edit button opens modal
- [ ] Toggle in modal activates/deactivates project
- [ ] Mobile layout wraps correctly

---

## Phase 5: Automated UI Validation

### 5.1 Create Validation Script
Create `scripts/validate-design-system.ts`:

```typescript
/**
 * Design System Validation Script
 * Checks that all UI elements match the mockup specification
 */

import { readFileSync, existsSync } from 'fs';
import { glob } from 'glob';

interface ValidationResult {
  passed: boolean;
  checks: { name: string; passed: boolean; details?: string }[];
}

async function validateDesignSystem(): Promise<ValidationResult> {
  const checks: { name: string; passed: boolean; details?: string }[] = [];

  // Check 1: No violet/sky/cyan colors in Vue/CSS files
  const forbiddenColors = await checkForbiddenColors();
  checks.push(forbiddenColors);

  // Check 2: Fraunces font is imported
  const fontCheck = await checkFontsImported();
  checks.push(fontCheck);

  // Check 3: CSS tokens file exists and has required variables
  const tokensCheck = await checkTokensFile();
  checks.push(tokensCheck);

  // Check 4: app.config.ts uses correct primary/secondary colors
  const configCheck = await checkAppConfig();
  checks.push(configCheck);

  // Check 5: Dashboard page has warm backgrounds
  const bgCheck = await checkWarmBackgrounds();
  checks.push(bgCheck);

  // Check 6: Typography classes are applied
  const typographyCheck = await checkTypography();
  checks.push(typographyCheck);

  // Check 7: Dark mode classes present
  const darkModeCheck = await checkDarkModeSupport();
  checks.push(darkModeCheck);

  return {
    passed: checks.every(c => c.passed),
    checks
  };
}

async function checkForbiddenColors(): Promise<{ name: string; passed: boolean; details?: string }> {
  const files = await glob('app/**/*.{vue,ts,css}', { ignore: ['**/node_modules/**'] });
  const violations: string[] = [];

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    // Skip constants file (intentionally has color names)
    if (file.includes('constants/index.ts') || file.includes('project-colors.ts')) continue;

    const lines = content.split('\n');
    lines.forEach((line, i) => {
      // Check for violet, sky, cyan as Tailwind class prefixes
      if (/\b(violet|sky|cyan)-\d+/.test(line)) {
        violations.push(`${file}:${i + 1}: ${line.trim().substring(0, 80)}`);
      }
    });
  }

  return {
    name: 'No forbidden colors (violet/sky/cyan)',
    passed: violations.length === 0,
    details: violations.length > 0 ? violations.join('\n') : undefined
  };
}

async function checkFontsImported(): Promise<{ name: string; passed: boolean; details?: string }> {
  const mainCssPath = 'app/assets/css/main.css';
  if (!existsSync(mainCssPath)) {
    return { name: 'Fonts imported', passed: false, details: 'main.css not found' };
  }

  const content = readFileSync(mainCssPath, 'utf-8');
  const hasFraunces = content.includes('Fraunces');
  const hasInstrument = content.includes('Instrument+Sans') || content.includes('Instrument Sans');

  return {
    name: 'Fonts imported (Fraunces, Instrument Sans)',
    passed: hasFraunces && hasInstrument,
    details: `Fraunces: ${hasFraunces}, Instrument Sans: ${hasInstrument}`
  };
}

async function checkTokensFile(): Promise<{ name: string; passed: boolean; details?: string }> {
  const tokensPath = 'app/assets/css/tokens.css';
  if (!existsSync(tokensPath)) {
    return { name: 'Tokens file exists', passed: false, details: 'tokens.css not found' };
  }

  const content = readFileSync(tokensPath, 'utf-8');
  const requiredVars = [
    '--bg-primary',
    '--accent-primary',
    '--accent-secondary',
    '--font-serif',
    '--font-sans'
  ];

  const missing = requiredVars.filter(v => !content.includes(v));

  return {
    name: 'CSS tokens defined',
    passed: missing.length === 0,
    details: missing.length > 0 ? `Missing: ${missing.join(', ')}` : undefined
  };
}

async function checkAppConfig(): Promise<{ name: string; passed: boolean; details?: string }> {
  const configPath = 'app/app.config.ts';
  if (!existsSync(configPath)) {
    return { name: 'App config correct', passed: false, details: 'app.config.ts not found' };
  }

  const content = readFileSync(configPath, 'utf-8');
  const hasOrangePrimary = /primary:\s*['"]orange['"]/.test(content);
  const hasGreenSecondary = /secondary:\s*['"]green['"]/.test(content);

  return {
    name: 'App config uses orange/green colors',
    passed: hasOrangePrimary && hasGreenSecondary,
    details: `Primary: ${hasOrangePrimary ? 'orange' : 'WRONG'}, Secondary: ${hasGreenSecondary ? 'green' : 'WRONG'}`
  };
}

async function checkWarmBackgrounds(): Promise<{ name: string; passed: boolean; details?: string }> {
  const files = ['app/pages/dashboard.vue', 'app/pages/index.vue'];
  const issues: string[] = [];

  for (const file of files) {
    if (!existsSync(file)) continue;
    const content = readFileSync(file, 'utf-8');

    // Check for warm cream background in light mode
    const hasWarmCream = content.includes('#fffbf5') || content.includes('bg-[#fffbf5]');
    // Check for warm charcoal in dark mode
    const hasWarmCharcoal = content.includes('stone-900') || content.includes('#1c1917');

    if (!hasWarmCream && !hasWarmCharcoal) {
      issues.push(`${file}: Missing warm backgrounds`);
    }
  }

  return {
    name: 'Warm backgrounds applied',
    passed: issues.length === 0,
    details: issues.length > 0 ? issues.join('\n') : undefined
  };
}

async function checkTypography(): Promise<{ name: string; passed: boolean; details?: string }> {
  const dashboardPath = 'app/pages/dashboard.vue';
  if (!existsSync(dashboardPath)) {
    return { name: 'Typography classes', passed: false, details: 'dashboard.vue not found' };
  }

  const content = readFileSync(dashboardPath, 'utf-8');
  const hasSerifClass = content.includes('font-serif');

  return {
    name: 'Serif typography applied to headings',
    passed: hasSerifClass,
    details: hasSerifClass ? undefined : 'No font-serif classes found in dashboard'
  };
}

async function checkDarkModeSupport(): Promise<{ name: string; passed: boolean; details?: string }> {
  const dashboardPath = 'app/pages/dashboard.vue';
  if (!existsSync(dashboardPath)) {
    return { name: 'Dark mode support', passed: false, details: 'dashboard.vue not found' };
  }

  const content = readFileSync(dashboardPath, 'utf-8');
  const hasDarkClasses = content.includes('dark:');

  return {
    name: 'Dark mode classes present',
    passed: hasDarkClasses,
    details: hasDarkClasses ? undefined : 'No dark: classes found in dashboard'
  };
}

// Run validation
validateDesignSystem().then(result => {
  console.log('\n=== Design System Validation ===\n');

  for (const check of result.checks) {
    const status = check.passed ? '✅' : '❌';
    console.log(`${status} ${check.name}`);
    if (check.details) {
      console.log(`   ${check.details}`);
    }
  }

  console.log('\n================================');
  console.log(result.passed ? '✅ ALL CHECKS PASSED' : '❌ VALIDATION FAILED');

  process.exit(result.passed ? 0 : 1);
});
```

### 5.2 Add npm Script
Add to `package.json`:
```json
{
  "scripts": {
    "validate:design": "npx tsx scripts/validate-design-system.ts"
  }
}
```

### 5.3 Visual Regression Test (Optional)
Create Playwright visual comparison test against mockup.

---

## Phase 6: Cleanup

### 6.1 Delete Mockup Files (AFTER validation passes)
```bash
rm -rf public/mockups/
```

### 6.2 Update Documentation
- Mark `NEW-DESIGN.md` as implemented
- Update `CLAUDE.md` Styling section

---

## Final Completion Criteria

**DO NOT mark complete until ALL of these pass:**

```bash
# 1. Automated validation
npm run validate:design

# 2. Lint check
npm run lint

# 3. Build check
npm run generate

# 4. Manual visual comparison
# Open mockup: public/mockups/focused-warmth-hybrid.html
# Compare with: npm run dev → localhost:3005/dashboard
```

**Checklist:**
- [x] Phase 1: Foundation complete
- [x] Phase 2: Landing page complete
- [ ] Phase 3: Dashboard & components complete
- [ ] `npm run validate:design` exits with code 0
- [ ] `npm run lint` passes
- [ ] `npm run generate` succeeds
- [ ] Dashboard visually matches mockup:
  - [ ] Warm cream background (light mode)
  - [ ] Warm charcoal background (dark mode)
  - [ ] Fraunces serif font on headings
  - [ ] Orange/green/stone color palette
  - [ ] No violet/sky/cyan colors visible
- [x] Landing page matches mockup styling
- [ ] Mockup files deleted ONLY after all above pass

---

## File Priority (Updated)

| Priority | File | Status | Remaining Work |
|----------|------|--------|----------------|
| ~~P0~~ | ~~`app/assets/css/tokens.css`~~ | ✅ Done | — |
| ~~P0~~ | ~~`app/app.config.ts`~~ | ✅ Done | — |
| P0 | `scripts/validate-design-system.ts` | ❌ Create | Full file |
| P0 | `package.json` | ❌ Update | Add validate script |
| ~~P1~~ | ~~`app/pages/index.vue`~~ | ✅ Done | — |
| P1 | `app/pages/dashboard.vue` | ⏳ Partial | Backgrounds, typography, layout (blocked) |
| ~~P1~~ | ~~`app/components/ProjectListCard.vue`~~ | ✅ Done | V27 complete — ⚠️ DO NOT MODIFY |
| ~~P1~~ | ~~`app/components/ProjectList.vue`~~ | ✅ Done | Deprecated events removed (§3.6.4) |
| ~~P1~~ | ~~`app/components/ProjectEditModal.vue`~~ | ✅ Done | Active toggle added (§3.6.5) |
| ~~P1~~ | ~~`app/components/ProjectCardToolbar.vue`~~ | ✅ Deleted | File removed (§3.6.6) |
| P2 | `app/layouts/default.vue` | ❓ Review | Check if warm backgrounds needed |
| ~~P2~~ | ~~`app/components/StreakBanner.vue`~~ | ✅ Done | Already uses orange→green gradient |
| P3 | `public/mockups/` | 📦 Keep | Delete after validation passes |

---

## Next Steps

1. ~~**Resolve the 3 blocking decisions above**~~ ✅ All decisions resolved (Match Mockup + Hero Timer + Full Sidebar)
2. **Implement Phase 3 dashboard restructure:**
   - Create `DashboardTimerHero.vue` (72px timer with glow)
   - Create `TodaysStats.vue` (4-item stats grid)
   - Create `DashboardSidebar.vue` (wrapper for sidebar components)
   - Update `dashboard.vue` to 2-column grid layout
   - Apply warm backgrounds + typography
3. Create validation script (Phase 5)
4. Run full validation
5. Cleanup (Phase 6)

> **Note:** V27 card migration (§3.6) is fully complete. All component updates finished.
