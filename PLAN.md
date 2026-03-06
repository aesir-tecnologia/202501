# Dashboard Design Refinement Plan

## Context

Design audit identified hierarchy, typography, color, and interaction issues in the dashboard. The timer competes visually with the project list, typography lacks personality, orange accent is applied inconsistently, and project rows show too many controls at once. This plan implements 8 targeted refinements to elevate the dashboard from functional to bespoke.

---

## Phase 1: Global CSS Foundation ✅

All component changes depend on these global changes being applied first.

### 1.1 Google Fonts import (`app/assets/css/main.css` line 1)

Replace Instrument Sans with three new families:
- **Syne** (400–800) — display font for headings, project names, timer digits
- **DM Sans** (400–700) — body font replacing Instrument Sans
- **DM Mono** (400, 500) — monospace for machine data (timestamps, meta values, badges)
- **Fraunces** stays unchanged (logo-only)

### 1.2 `@theme` block (`main.css` lines 14–20)

```css
--font-sans: 'DM Sans', system-ui, sans-serif;
--font-serif: 'Fraunces', Georgia, serif;   /* unchanged */
--font-mono: 'DM Mono', monospace;
--font-display: 'Syne', system-ui, sans-serif;  /* NEW */
```

Side-effect: all existing `font-sans` and `font-mono` Tailwind classes app-wide switch to DM Sans / DM Mono automatically. This is desired — DM Sans has similar metrics to Instrument Sans, no layout shifts expected.

### 1.3 Font variables in `tokens.css` (lines 5–7)

Mirror the `@theme` values so scoped `var(--font-*)` references resolve correctly. Add `--font-display`.

### 1.4 New tokens in `tokens.css`

- `--shadow-progress-glow` (light/dark) — for progress bar endpoint bubble
- `.font-display` utility class — `font-family: var(--font-display)`
- `.noise-texture::before` — faint SVG `feTurbulence` noise overlay (3% light / 4% dark opacity, `pointer-events: none`, `position: fixed`, `z-index: 9999`)
- Disable noise on `prefers-reduced-motion: reduce`

### 1.5 Noise texture activation (`app/layouts/default.vue` line 62)

Add `noise-texture` class to the root `<div>`.

---

## Phase 2: Timer as Focal Point (`app/components/DashboardTimerHero.vue`)

Most complex changes. Three features: display font hierarchy, blinking colon, progress bar.

### 2.1 Script additions

- **`progressPercentage` computed**: `elapsed / planned * 100`, clamped 0–100. `elapsed = planned - secondsRemaining`. Data comes from `props.activeStint.planned_duration` (minutes) and `secondsRemaining` (from `useStintTimer()`). Overtime clamps to 100%.
- **`snapshotProgress` ref**: Same snapshot pattern as existing `snapshotTimerDisplay` — preserves value during fade animation.
- **`timerSegments` computed**: Splits `displayTimerValue` on `:` into array of digit groups. e.g. `"12:34"` → `["12", "34"]`, `"1:23:45"` → `["1", "23", "45"]`. Negative prefix (overtime) stays embedded in first segment.

### 2.2 Template changes

- **Timer digits**: Replace `{{ displayTimerValue }}` with `v-for` over `timerSegments.segments`, inserting `<span class="timer-colon">:</span>` between groups
- **Glow ring**: Add `<div class="timer-glow-ring" />` inside `.session-timer` for enhanced radial glow
- **Progress bar**: After `.timer-label`, add thin track + fill + glowing bubble endpoint
- **State classes on `.session-timer`**: Add `:class="{ 'timer-paused': displayIsPaused, 'timer-overtime': displayIsOvertime }"` for progress bar color switching

### 2.3 CSS changes

| Selector | Change |
|----------|--------|
| `.session-project` | `font-family: var(--font-display)`, weight → 600 |
| `.timer-display` | `font-family: var(--font-display)`, weight → 700, remove `font-variant-numeric: tabular-nums`, add `letter-spacing: -0.02em` |
| `.meta-value` | Keep `var(--font-mono)` (now DM Mono), weight → 500 (DM Mono max) |
| `.timer-colon` | **New**: `animation: colon-blink 1s step-end infinite` (opacity 1→0→1). Paused: no blink, amber color. Overtime: red color. |
| `.timer-glow-ring` | **New**: Centered radial gradient, 200px/320px, `blur(20px)`, `opacity: 0.6` |
| `.stint-progress` | **New**: 3px track, accent fill with `transition: width 1s linear`, 10px/12px glowing bubble at progress point |
| `.timer-paused .stint-progress-*` | Amber fill + amber glow |
| `.timer-overtime .stint-progress-*` | Red fill + red glow |

---

## Phase 3: Project Row Refinements (`app/components/ProjectListCard.vue`)

### 3.1 Font: project name

`.project-name`: add `font-family: var(--font-display)`, weight → 600

### 3.2 Color dots → rings

Replace solid `bg-{color}-500` classes with `ring-{color}-500 bg-{color}-500/10` in `colorDotClass` computed. Add `ring-2` class to `.project-color` element in template.

### 3.3 Left accent stripe

`.card-v27.state-running`: add `border-left: 3px solid var(--accent-primary)` — scannable orange stripe on running row.

### 3.4 Hover-to-show actions

```css
.card-v27 .edit-btn,
.card-v27 .play-btn { opacity: 0; transition: opacity 0.15s ease; }

.card-v27:hover .edit-btn,
.card-v27:hover .play-btn,
.card-v27:focus-within .edit-btn,
.card-v27:focus-within .play-btn { opacity: 1; }

/* Running/paused: always visible */
.card-v27.state-running .edit-btn, ...
.card-v27.state-paused .edit-btn, ... { opacity: 1; }

/* Mobile: always visible (no hover) */
@media (max-width: 640px) { .card-v27 .edit-btn, .play-btn { opacity: 1; } }
```

---

## Phase 4: Stats Panel (`app/components/AchievementCard.vue`)

### 4.1 Font hierarchy

- `.hero-value`: switch to `var(--font-display)`, weight → 800
- `.date-label`: switch to `var(--font-display)`, weight → 600
- `.stat-value`: keep `var(--font-mono)` (now DM Mono) — machine data

### 4.2 Stat tiles

Give `.stat-item` a subtle `background: var(--bg-secondary)` + `border-radius: var(--radius-sm)` + padding. Replace `border-left` dividers with gap-based separation. Add `gap: 4px` to `.stats-row`.

---

## Phase 5: Section Title (`app/pages/dashboard.vue` line 227)

"Your Projects" heading: add `font-display` class, bump weight to `font-bold` (700).

---

## Files Modified (dependency order)

| # | File | Summary |
|---|------|---------|
| 1 | `app/assets/css/main.css` | Font import URL, `@theme` block |
| 2 | `app/assets/css/tokens.css` | Font vars, display utility, noise texture, progress glow |
| 3 | `app/layouts/default.vue` | Add `noise-texture` class (line 62) |
| 4 | `app/components/DashboardTimerHero.vue` | Display font, blinking colon, progress bar, glow |
| 5 | `app/components/ProjectListCard.vue` | Ring dots, hover actions, left accent, display font |
| 6 | `app/components/AchievementCard.vue` | Display font, stat tile backgrounds |
| 7 | `app/pages/dashboard.vue` | Display font on heading |

## Known Considerations

- **Syne lacks `tnum`**: Timer digits may have slight width variation between numbers. Mitigated with `letter-spacing: -0.02em`. This is a deliberate design choice — the big countdown is a display element, not machine data.
- **DM Mono max weight 500**: Update `.meta-value` from `font-weight: 600` to `500`.
- **Noise texture performance**: Uses `position: fixed` SVG data URI. Disabled on `prefers-reduced-motion`. Negligible impact on modern devices.
- **Side effects**: All `font-mono`/`font-sans` usage app-wide (navbar timer, landing page, gallery) switches to DM Mono/DM Sans automatically. All are correct behavior.

## Verification

1. `npm run dev` — visually inspect dashboard in both light and dark mode
2. Start a stint — verify timer displays with Syne font, colon blinks, progress bar fills
3. Pause stint — verify colon stops blinking (amber), progress bar turns amber
4. Let timer go overtime — verify red timer, red progress bar at 100%
5. Hover project rows — verify edit/play buttons appear on hover, always visible on running row
6. Check mobile viewport — verify buttons always visible, responsive layout intact
7. Inspect color dots — verify ring style (border + faint fill) instead of solid circles
8. Check noise texture — barely visible grain over the page background
9. `npm run lint` + `npm run type-check` — no regressions
10. `npm run test:run` — all tests pass (no test files affected by CSS changes)
