# Research: Dashboard UI Polish

**Feature Branch**: `009-dashboard-ui-polish`
**Date**: 2026-02-24

## Architectural Fit

### Existing Patterns to Follow

1. **CSS Token System** (`app/assets/css/tokens.css`): All color values use CSS custom properties with light/dark mode variants via `:root` and `:root.dark` selectors. New tokens (`--bg-active-row`) must follow this pattern.

2. **Tailwind v4 `@theme` Directive** (`app/assets/css/main.css`): Font families are registered in both the `@theme` block (for Tailwind utilities) and `tokens.css` `:root` (for `var()` usage). The `@theme` block is the single source for Tailwind config — no `tailwind.config.ts` exists.

3. **Scoped Component Styles**: Dashboard components (`ProjectListCard.vue`, `DashboardTimerHero.vue`) use `<style scoped>` with CSS custom properties from `tokens.css`. State variants are applied via conditional `:class` bindings and scoped CSS selectors (`.card-v27.state-running`, `.timer-display.is-paused`).

4. **Nuxt UI `:ui` Prop Pattern**: Components like `UNavigationMenu` in `default.vue` already use the `:ui` prop for deep style customization. The same pattern applies to `UTabs`.

### New Patterns Needed

None. All changes fit within existing patterns: token value adjustments, class removals, and Nuxt UI prop changes.

## Decision Log

### D-001: WCAG AA Compliant `--text-muted` Values

**Decision**: Adjust `--text-muted` to warm stone tones that meet 4.5:1 minimum contrast.

**Current values and failures**:
| Mode | Background | Current Muted | Contrast | Status |
|------|-----------|--------------|----------|--------|
| Light | `#fffbf5` (L=0.969) | `#a8a29e` (L=0.370) | ~2.4:1 | FAIL |
| Dark | `#1c1917` (L=0.010) | `#78716c` (L=0.171) | ~3.7:1 | FAIL |

**Recommended values** (verify with contrast checker during implementation):
| Mode | Recommended Muted | Expected Contrast | Notes |
|------|------------------|-------------------|-------|
| Light | `#736b66` (darker stone) | ~5.0:1 | Warm tone, matches design palette |
| Dark | `#908984` (lighter stone) | ~5.2:1 | Warm tone, sufficient headroom above 4.5:1 |

**Rationale**: Values chosen with ~0.5:1 headroom above minimum to account for sub-pixel rendering variations across browsers and displays. Both values maintain the warm stone palette established in the design system.

**Alternatives considered**:
- Using Tailwind's standard Stone scale values directly → Rejected because Stone-500 (#78716c) fails in dark mode and Stone-400 (#a8a29e) fails in light mode
- Per-component overrides instead of token change → Rejected because the token is used consistently and a single change is cleaner

### D-002: Active Row Background Token

**Decision**: Create `--bg-active-row` using green-tinted translucent backgrounds.

**Recommended values**:
| Mode | Value | Visual Effect |
|------|-------|--------------|
| Light | `rgba(22, 163, 74, 0.05)` | Very subtle green wash |
| Dark | `rgba(34, 197, 94, 0.08)` | Subtle green wash on dark card surface |

**Rationale**: Green aligns with the existing running-stint visual language (green text, green shadow). The opacity is kept very low to avoid overwhelming the row content — it should be a subtle background shift, not a strong highlight. Paused stints retain their amber treatment unchanged.

**Alternatives considered**:
- Terracotta/brand accent tint → Rejected because running stints already use green throughout the UI (text color, header pill, shadow)
- Solid background color → Rejected because translucent values work better with the existing `backdrop-filter: blur()` card aesthetic
- Left border accent only → Considered viable but less discoverable than background; could be added as enhancement

### D-003: Tab Control Variant

**Decision**: Switch `UTabs` from default `variant="pill"` to `variant="link"` with `color="neutral"`.

**Rationale**: Nuxt UI 4's "link" variant renders tab triggers as plain text with an underline indicator, which is visually lightweight. The "neutral" color prevents the accent color from competing with the project list. This matches FR-001's requirement exactly.

**Alternatives considered**:
- Custom `:ui` prop on the default pill variant → More complex, harder to maintain
- Replacing UTabs with custom tab component → Over-engineering; the built-in variant solves the problem

### D-004: Typography System-Wide Change

**Decision**: Remove `font-serif` class from all non-logo elements. Keep serif exclusively on 9 logo instances across 7 files.

**Files requiring `font-serif` removal** (non-logo text):
| File | Count | Elements |
|------|-------|----------|
| `app/pages/index.vue` | 7 | Hero headline, section headings, CTA, pricing, FAQ |
| `app/pages/dashboard.vue` | 1 | "Your Projects" section title |
| `app/pages/auth/login.vue` | 1 | "Welcome back" heading |
| `app/pages/auth/register.vue` | 1 | "Create your account" heading |
| `app/pages/auth/callback.vue` | 3 | Status headings |
| `app/pages/auth/verify-email.vue` | 1 | "Check your email" heading |
| `app/pages/auth/forgot-password.vue` | 1 | "Reset your password" heading |
| `app/pages/auth/reset-password.vue` | 1 | "Set your new password" heading |
| `app/pages/legal/terms.vue` | 1 | Page title |
| `app/pages/legal/privacy.vue` | 1 | Page title |
| `app/components/DashboardTimerHero.vue` | 1 | Active session project name |
| `app/components/ProjectList.vue` | 3 | Empty state headings |
| `app/components/ArchivedProjectsList.vue` | 1 | Empty state heading |
| `app/pages/gallery.vue` | 5 | Section headings (dev tool) |
| `app/layouts/component-gallery.vue` | 1 | Layout title (dev tool) |
| **Total** | **~30** | |

**Logo instances to KEEP** (9 across 7 files):
- `app/layouts/default.vue:87` — Navbar logo
- `app/pages/index.vue:83,1345` — Marketing navbar + footer
- `app/pages/legal/terms.vue:21,133` — Navbar + footer
- `app/pages/legal/privacy.vue:21,113` — Navbar + footer
- `app/pages/auth/login.vue:102` — Auth card logo
- `app/pages/auth/register.vue:172` — Auth card logo

**Rationale**: Simpler to remove `font-serif` from the ~30 non-logo instances than to refactor all headings to use a different class. The sans-serif font (Instrument Sans) inherits naturally when `font-serif` is removed since it's the default via `@theme`.

### D-005: Timer Digit Cohesion

**Decision**: Remove positive `letter-spacing: 0.02em` from `.timer-display` and ensure `font-variant-numeric: tabular-nums` is applied.

**Current state** (`DashboardTimerHero.vue:359`):
```css
.timer-display {
  font-family: var(--font-mono);
  letter-spacing: 0.02em;  /* Remove this */
}
```

**Target**: `letter-spacing: 0` (or remove the property entirely). The monospace font (JetBrains Mono) already provides consistent character widths; adding positive spacing separates colons from digits.

### D-006: Project Color Indicators

**Decision**: Change from hollow rings to solid filled dots by swapping `background: transparent` + `border-width: 3.5px` to `background: <color>` + `border: none`.

**Current state** (`ProjectListCard.vue:377-385`):
```css
.project-color {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: transparent;    /* → change to project color */
  border-width: 3.5px;        /* → remove */
  border-style: solid;        /* → remove */
}
```

**Approach**: The border colors are already set via computed Tailwind classes (`border-red-500`, etc.). Change to use corresponding `bg-*` classes and remove the border properties. May reduce size slightly (18px ring → 12-14px solid dot) for visual proportion.

### D-007: Card Gap Standardization

**Decision**: Standardize `.card-v27` gap from `14px` to `12px` (`gap-3`).

**Rationale**: 14px falls outside the Tailwind 4px spacing scale. Chose 12px (gap-3) over 16px (gap-4) because the card already feels spacious; tightening slightly improves visual density.

## Dependencies

### Technical Dependencies
- No new library installations required
- No database changes
- No API changes
- Google Fonts CDN (Fraunces, Instrument Sans) — already loaded

### Task Dependencies
```
Step 1 (Token updates) ─┬─→ Step 5 (Active row bg)
                        └─→ All visual steps use updated muted color
Step 2 (Design system docs) → Independent
Steps 3-9 → All depend on Step 1, independent of each other
```

## Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|-----------|--------|------------|
| R-001 | Typography change breaks visual balance on marketing page | Medium | Low | Visual review of index.vue after change; sans-serif headings may need weight/size adjustments |
| R-002 | WCAG contrast values render differently across browsers | Low | Medium | Use recommended values with ~0.5:1 headroom; test in Chrome, Firefox, Safari |
| R-003 | UTabs "link" variant doesn't match desired aesthetic | Low | Low | Can customize via `:ui` prop if default link variant needs tweaking |
| R-004 | Solid color dots look too heavy for light project colors | Low | Low | Reduce dot size (18px → 12px) and adjust opacity if needed |
| R-005 | Gallery/dev pages affected by typography change | Low | Very Low | Gallery is a dev tool; update for consistency but not critical |
| R-006 | JetBrains Mono not loaded (pre-existing) | N/A | Low | Out of scope — falls back to system monospace. Pre-existing issue. |

**No CRITICAL or HIGH risks identified.** All risks are LOW with straightforward mitigations.
