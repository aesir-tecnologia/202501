# Data Model: Dashboard UI Polish

**Feature Branch**: `009-dashboard-ui-polish`
**Date**: 2026-02-24

> This feature has no database entity changes. The "data model" for a visual polish feature is the **CSS design token system** — the tokens that components consume to render consistently.

## Token Changes

### Modified Tokens

#### `--text-muted` (value adjustment, both modes)

| Property | Light Mode | Dark Mode |
|----------|-----------|-----------|
| **Current** | `#a8a29e` (~2.4:1 vs `--bg-primary`) | `#78716c` (~3.7:1 vs `--bg-primary`) |
| **Proposed** | `#736b66` (~5.0:1 vs `--bg-primary`) | `#908984` (~5.2:1 vs `--bg-primary`) |
| **WCAG AA** | 4.5:1 minimum | 4.5:1 minimum |
| **Headroom** | ~0.5:1 buffer | ~0.7:1 buffer |

**Consumers**: Every component using `color: var(--text-muted)` or `text-[var(--text-muted)]`. Includes timestamps, metadata labels, secondary descriptions, inactive icons.

**Validation**: Run contrast checker against `--bg-primary`, `--bg-secondary`, `--bg-card` backgrounds in both modes. All combinations must meet 4.5:1.

### New Tokens

#### `--bg-active-row`

| Property | Light Mode | Dark Mode |
|----------|-----------|-----------|
| **Value** | `rgba(22, 163, 74, 0.05)` | `rgba(34, 197, 94, 0.08)` |
| **Visual** | Very subtle green wash | Subtle green wash on dark surface |
| **Contrast** | Decorative only, no text contrast requirement | Decorative only |

**Consumer**: `ProjectListCard.vue` — applied to `.card-v27.state-running` only. Paused stints (`.state-paused`) retain amber treatment.

**Relationship**: Complements existing `--accent-secondary` (green) for the running-stint visual language.

## Component-Level Style Changes

### ProjectListCard.vue

| Element | Current | Target | Requirement |
|---------|---------|--------|-------------|
| `.card-v27` gap | `14px` (non-standard) | `12px` (`gap-3`) | FR-007 |
| `.card-v27.state-running` background | None (green shadow only) | `var(--bg-active-row)` | FR-002 |
| `.project-color` shape | Hollow ring (`border: 3.5px`, `bg: transparent`) | Solid dot (`bg: color`, no border) | FR-006 |
| `.project-color` size | `18px` | `12px` (proportional to solid) | FR-006 |

### DashboardTimerHero.vue

| Element | Current | Target | Requirement |
|---------|---------|--------|-------------|
| `.session-project` font | `font-serif` (Fraunces) | Inherit sans-serif (Instrument Sans) | FR-003 |
| `.timer-display` letter-spacing | `0.02em` | `0` (remove property) | FR-004 |
| `.meta-label` font-size (mobile) | `10px` | `11px` | FR-009 |

### dashboard.vue

| Element | Current | Target | Requirement |
|---------|---------|--------|-------------|
| "Your Projects" heading font | `font-serif` (Fraunces) | Remove `font-serif` class | FR-003 |
| `UTabs` variant | Default (`pill`) | `variant="link"` `color="neutral"` | FR-001 |

### System-Wide Typography

| Scope | Current | Target | Requirement |
|-------|---------|--------|-------------|
| ~30 non-logo `font-serif` instances | Fraunces serif font | Remove class → inherit Instrument Sans | FR-003 |
| 9 logo instances | Fraunces serif font | **Keep unchanged** | FR-003 |

## State Transitions

No new state transitions. Existing project card states remain:

```
state-running  → green treatment (enhanced with --bg-active-row)
state-paused   → amber treatment (unchanged)
state-inactive → muted treatment (unchanged)
(default)      → base card style (unchanged)
```

## Validation Rules

| Rule | Source | Check |
|------|--------|-------|
| All `--text-muted` usage meets WCAG AA 4.5:1 | FR-005, SC-002 | Contrast checker against all background tokens |
| `font-serif` appears only on logo elements | FR-003, SC-004 | Grep for `font-serif` in templates, verify each is a logo |
| `--bg-active-row` applied only to running (not paused) rows | FR-002, Clarification | Check `.state-running` selector, not `.state-paused` |
| Timer digits have no positive letter-spacing | FR-004 | Inspect `.timer-display` computed styles |
| Project color indicators are solid, not hollow | FR-006, SC-003 | Visual inspection — no visible border-only rendering |
