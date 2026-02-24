# Quickstart: Dashboard UI Polish

**Feature Branch**: `009-dashboard-ui-polish`
**Date**: 2026-02-24

> Step-by-step implementation guide. Each step is atomic and verifiable.

## Prerequisites

- Branch `009-dashboard-ui-polish` checked out
- Local dev server available (`npm run dev` on port 3005)
- Browser with DevTools for contrast/style inspection

---

## Step 1: Update Design Tokens

**File**: `app/assets/css/tokens.css`

### 1a. Adjust `--text-muted` for WCAG AA compliance

**Light mode** (~line 33): Change `#a8a29e` → `#736b66`
**Dark mode** (~line 66): Change `#78716c` → `#908984`

### 1b. Add `--bg-active-row` token

Add to light mode block (after `--bg-card`):
```css
--bg-active-row: rgba(22, 163, 74, 0.05);
```

Add to dark mode block (after `--bg-card`):
```css
--bg-active-row: rgba(34, 197, 94, 0.08);
```

### Verification
- Open dashboard in both light and dark mode
- Muted text should be visibly more readable but still secondary
- Use browser contrast checker extension to verify ≥4.5:1 against `--bg-primary`, `--bg-secondary`, and `--bg-card`

---

## Step 2: Update Design System Documentation

**File**: `docs/DESIGN_SYSTEM.md`

Update the typography section to reflect:
- **Fraunces** (`--font-serif`): Reserved exclusively for the LifeStint logo wordmark
- **Instrument Sans** (`--font-sans`): All headings, titles, labels, body text, and UI elements
- **JetBrains Mono** (`--font-mono`): Timer displays, numerical values, code

Remove or update any references to Fraunces being used for "headings, display text."

### Verification
- Read the updated doc and confirm it matches the new typography rules
- No code changes needed for this step

---

## Step 3: System-Wide Typography — Remove `font-serif` from Non-Logo Elements

**Scope**: ~30 instances across ~15 files. Remove the `font-serif` class from all non-logo elements. Logo instances (9 total) must be preserved.

### Dashboard & Components
| File | Line | Element | Action |
|------|------|---------|--------|
| `app/pages/dashboard.vue` | ~227 | "Your Projects" h2 | Remove `font-serif` |
| `app/components/DashboardTimerHero.vue` | ~130 | `.session-project` h2 | Remove `font-serif` |
| `app/components/ProjectList.vue` | ~503, ~529, ~556 | Empty state h3 headings | Remove `font-serif` |
| `app/components/ArchivedProjectsList.vue` | ~103 | Empty state h3 | Remove `font-serif` |

### Auth Pages
| File | Line | Element | Action |
|------|------|---------|--------|
| `app/pages/auth/login.vue` | ~107 | "Welcome back" h2 | Remove `font-serif` |
| `app/pages/auth/register.vue` | ~177 | "Create your account" h2 | Remove `font-serif` |
| `app/pages/auth/callback.vue` | ~122, ~138, ~170 | Status h2 headings | Remove `font-serif` |
| `app/pages/auth/verify-email.vue` | ~16 | "Check your email" h2 | Remove `font-serif` |
| `app/pages/auth/forgot-password.vue` | ~16 | "Reset your password" h2 | Remove `font-serif` |
| `app/pages/auth/reset-password.vue` | ~16 | "Set your new password" h2 | Remove `font-serif` |

### Public Pages
| File | Line | Element | Action |
|------|------|---------|--------|
| `app/pages/index.vue` | ~156 | Hero h1 | Remove `font-serif` |
| `app/pages/index.vue` | ~336, ~504 | Section h2 headings | Remove `font-serif` |
| `app/pages/index.vue` | ~801, ~993, ~1022, ~1266 | Feature/CTA/Pricing/FAQ h3 | Remove `font-serif` |
| `app/pages/legal/terms.vue` | ~31 | Page title h1 | Remove `font-serif` |
| `app/pages/legal/privacy.vue` | ~31 | Page title h1 | Remove `font-serif` |

### Dev Tools (Gallery)
| File | Line | Element | Action |
|------|------|---------|--------|
| `app/pages/gallery.vue` | ~174, ~257, ~334, ~400, ~440 | Section headings | Remove `font-serif` |
| `app/layouts/component-gallery.vue` | ~27 | Layout title | Remove `font-serif` |

### Verification
- Run `grep -r "font-serif" app/` — only logo instances should remain (9 occurrences)
- Browse dashboard, auth pages, and marketing page — all headings should render in Instrument Sans
- Logo "LifeStint" text should still be in Fraunces

---

## Step 4: Lightweight Tab Control (FR-001)

**File**: `app/pages/dashboard.vue`

Change the `UTabs` component to use a lightweight variant:

```vue
<UTabs
  v-if="!isLoading"
  v-model="selectedTab"
  :items="tabItems"
  variant="link"
  color="neutral"
  class="w-full"
>
```

### Verification
- Dashboard tabs should show as text-only with an underline indicator
- No heavy filled pill background
- Active tab text should be highlighted, inactive tabs should be muted
- Tab switching should still work correctly

---

## Step 5: Active Row Background (FR-002)

**File**: `app/components/ProjectListCard.vue`

Add background to `.card-v27.state-running` CSS rule (~line 321):

```css
.card-v27.state-running {
  background: var(--bg-active-row);
  box-shadow: 0 2px 12px rgba(22, 163, 74, 0.1);
}
```

### Verification
- Start a stint on any project
- The running project's card should have a very subtle green-tinted background
- Paused projects should retain their amber treatment (no green background)
- Projects without active stints should have the default card background

---

## Step 6: Timer Digit Cohesion (FR-004)

**File**: `app/components/DashboardTimerHero.vue`

In the `.timer-display` CSS rule (~line 359):
- Remove `letter-spacing: 0.02em` (or set to `0`)
- Ensure `font-variant-numeric: tabular-nums` is set (may already be applied via Tailwind class)

```css
.timer-display {
  font-family: var(--font-mono);
  font-size: 48px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0 40px var(--accent-primary-glow);
}
```

### Verification
- Timer digits should appear as a tight, cohesive unit
- Colons should sit close to adjacent digits, not float with extra space
- Digits should not shift when values change (tabular-nums ensures fixed widths)

---

## Step 7: Solid Project Color Dots (FR-006)

**File**: `app/components/ProjectListCard.vue`

### 7a. Update CSS (~line 377)

Change from hollow ring to solid dot:
```css
.project-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}
```

Remove `background: transparent`, `border-width: 3.5px`, `border-style: solid`.

### 7b. Update template class bindings

Change the computed color classes from `border-*` to `bg-*` variants. For example:
- `border-red-500` → `bg-red-500`
- `border-green-500` → `bg-green-500`
- etc.

Update the `projectColorClass` computed (or equivalent) to use `bg-` prefixed classes instead of `border-` prefixed classes.

### Verification
- Project list should show solid filled dots instead of hollow rings
- Dots should look clearly decorative, not interactive
- All project colors should render correctly (blue, red, green, yellow, gray, etc.)

---

## Step 8: Button Spacing & Card Gap (FR-007)

**File**: `app/components/ProjectListCard.vue`

### 8a. Standardize card gap (~line 304)

Change `.card-v27` from `gap: 14px` to `gap: 12px`.

### 8b. Standardize card padding (~line 305)

Change `.card-v27` from `padding: 14px 20px` to `padding: 12px 20px` (align vertical padding with gap).

### Verification
- All project cards should have uniform spacing between elements
- Action buttons (edit, play/pause, stop) should have consistent gaps
- Compare spacing visually across multiple project rows — should be identical

---

## Step 9: Label Minimum Size & Navigation (FR-008, FR-009)

**File**: `app/components/DashboardTimerHero.vue`

### 9a. Raise meta-label minimum size (FR-009)

Change `.meta-label` mobile font-size from `10px` to `11px` (~line 336):
```css
.meta-label {
  font-size: 11px;
  /* ... rest unchanged */
}
```

### 9b. Navigation grouping verification (FR-008)

**File**: `app/layouts/default.vue`

The navigation already uses a cohesive pill container with `bg-[#fef7ed] dark:bg-[#1f1b18] p-1 rounded-full gap-1`. Verify this looks correctly grouped. **May be a no-op** — existing implementation already satisfies FR-008.

### Verification
- "Started", "Duration", "Ends" labels should be readable on mobile at 11px
- Navigation items in header should appear as a visually cohesive group
- No elements should appear to float independently

---

## Final Verification Checklist

After all steps are complete:

- [ ] **SC-001**: Active project identifiable within 3 seconds (green background + visual distinction)
- [ ] **SC-002**: All text meets WCAG AA in both modes (contrast checker on muted text)
- [ ] **SC-003**: Color indicators look decorative, not interactive (solid dots, not rings)
- [ ] **SC-004**: Exactly 3 font families with clear roles (serif=logo, sans=UI, mono=timer)
- [ ] **SC-005**: Action button gaps uniform across all project cards (visual inspection)
- [ ] **SC-006**: Renders correctly 768px–1920px (test at tablet and desktop breakpoints)
- [ ] Run `npm run lint:fix` to clean up any formatting
- [ ] Run `npm run type-check` to verify no TypeScript issues
- [ ] Run `npm run test:run` to verify no test regressions
- [ ] Visual review in both light and dark mode
