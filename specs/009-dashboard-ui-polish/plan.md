# Implementation Plan: Dashboard UI Polish

**Branch**: `009-dashboard-ui-polish` | **Date**: 2026-02-24 | **Spec**: `specs/009-dashboard-ui-polish/spec.md`
**Input**: Feature specification from `/specs/009-dashboard-ui-polish/spec.md`

## Summary

Visual hierarchy, typography, color/contrast, and spacing refinements for the LifeStint dashboard. This is a pure visual polish pass: no new functionality, no database changes, no API changes. The work involves CSS token adjustments, Nuxt UI prop changes, class removals/additions across ~15 files, and design system documentation updates to achieve WCAG AA compliance and improved visual clarity.

## Technical Context

**Language/Version**: TypeScript 5 / Vue 3 / Nuxt 4
**Primary Dependencies**: Nuxt UI 4 (Reka UI), Tailwind CSS v4, Google Fonts (Fraunces, Instrument Sans)
**Storage**: N/A — no database changes
**Testing**: Vitest (lint, type-check, existing tests); visual inspection for CSS changes
**Target Platform**: Web (SSG), tablet+ viewports (768px–1920px per SC-006)
**Project Type**: Web (Nuxt SSG)
**Performance Goals**: N/A — visual-only changes, no runtime impact
**Constraints**: WCAG AA contrast (4.5:1 normal text, 3:1 large text), both light and dark modes
**Scale/Scope**: ~15 files modified, ~30 `font-serif` class removals, 2 token value changes, 1 new token, ~8 component CSS adjustments

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Applicable? | Status | Notes |
|-----------|------------|--------|-------|
| I. Three-Layer Data Access | No | PASS | No data layer changes |
| II. Three-Layer Testing | Minimal | PASS | No new business logic; existing tests run for regression |
| III. SSG + Client-Side Auth | No | PASS | No route or auth changes |
| IV. Type Safety & Code Generation | No | PASS | No type changes |
| V. User-Friendly Error Handling | No | PASS | No error handling changes |
| VI. Cache Update Strategies | No | PASS | No mutation changes |
| VII. Query Key Factory Pattern | No | PASS | No cache key changes |
| VIII. Observability & Logging | No | PASS | No logging changes |
| Component Library & Styling | **Yes** | PASS | All changes follow design system; tokens.css pattern followed; dark mode variants provided; Nuxt UI docs checked for UTabs API |
| Code Quality | **Yes** | PASS | Will lint before commit; no comments added |
| Design System Compliance | **Yes** | PASS | DESIGN_SYSTEM.md updated to reflect new typography rules |

**Post-Phase 1 Re-check**: All principles still pass. No architectural deviations introduced. The UTabs variant change uses the built-in Nuxt UI API (`variant="link"`, `color="neutral"`), no custom workarounds.

## Project Structure

### Documentation (this feature)

```text
specs/009-dashboard-ui-polish/
├── plan.md              # This file
├── research.md          # Phase 0 output — decisions, risks, contrast calculations
├── data-model.md        # Phase 1 output — token changes, component style map
├── quickstart.md        # Phase 1 output — 9-step implementation guide
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (files to modify)

```text
app/
├── assets/css/
│   └── tokens.css                    # Token value changes (--text-muted, --bg-active-row)
├── components/
│   ├── ProjectListCard.vue           # Active row bg, solid dots, card gap, button spacing
│   ├── DashboardTimerHero.vue        # Timer letter-spacing, label size, font-serif removal
│   ├── ProjectList.vue               # font-serif removal (empty states)
│   └── ArchivedProjectsList.vue      # font-serif removal (empty state)
├── pages/
│   ├── dashboard.vue                 # UTabs variant, font-serif removal
│   ├── index.vue                     # font-serif removal (7 headings)
│   ├── gallery.vue                   # font-serif removal (5 headings, dev tool)
│   ├── auth/
│   │   ├── login.vue                 # font-serif removal
│   │   ├── register.vue              # font-serif removal
│   │   ├── callback.vue              # font-serif removal (3 headings)
│   │   ├── verify-email.vue          # font-serif removal
│   │   ├── forgot-password.vue       # font-serif removal
│   │   └── reset-password.vue        # font-serif removal
│   └── legal/
│       ├── terms.vue                 # font-serif removal
│       └── privacy.vue               # font-serif removal
├── layouts/
│   └── component-gallery.vue         # font-serif removal (dev tool)
docs/
└── DESIGN_SYSTEM.md                  # Typography rules update
```

**Structure Decision**: No new files or directories created (aside from spec artifacts). All changes are modifications to existing files.

## Complexity Tracking

No constitution violations. All changes use existing patterns:
- Token system for colors
- Nuxt UI props for component variants
- Tailwind utility classes for styling
- Scoped CSS for component-specific overrides

## Critical Path

**Longest Chain**: 2 steps (Step 1 → any of Steps 3–9)

| Step | Description | Blocks |
|------|-------------|--------|
| 1 | Token updates (`--text-muted` values, `--bg-active-row`) | Steps 5 (active row bg depends on new token) |
| 2 | Design system docs | Nothing (independent) |
| 3 | Typography: remove `font-serif` from non-logo elements | Nothing |
| 4 | UTabs lightweight variant | Nothing |
| 5 | Active row background | Nothing |
| 6 | Timer digit cohesion | Nothing |
| 7 | Solid project color dots | Nothing |
| 8 | Button spacing & card gap | Nothing |
| 9 | Label size & navigation verification | Nothing |

**Bottleneck Steps** (blocks 3+ downstream steps):
- Step 1 is the only bottleneck — it provides the token values consumed by Step 5 (directly) and improves muted text rendering for all visual steps. However, the dependency is soft for most steps (Steps 3, 4, 6–9 don't strictly require Step 1 to be complete first).

**Conclusion**: This is a shallow-dependency feature. After Step 1, all remaining steps can be executed in any order or in parallel.

## Testing Approach

| Component | Verification Method | Success Criteria |
|-----------|-------------------|------------------|
| `--text-muted` contrast (FR-005) | Browser contrast checker tool | ≥4.5:1 ratio against all bg tokens in both modes |
| Active row background (FR-002) | Visual inspection with active stint | Running row visually distinct; paused row unchanged |
| Typography system (FR-003) | `grep -r "font-serif" app/` | Only 9 logo instances remain |
| UTabs variant (FR-001) | Visual inspection | Lightweight text/underline treatment, no heavy pill |
| Timer digits (FR-004) | Visual inspection | Digits + colons as single cohesive unit |
| Color indicators (FR-006) | Visual inspection | Solid dots, not hollow rings |
| Button spacing (FR-007) | DevTools measurement | Uniform gaps across all project rows |
| Navigation grouping (FR-008) | Visual inspection | Items appear as cohesive group |
| Label size (FR-009) | DevTools computed styles | ≥11px on mobile |
| Regression | `npm run lint && npm run type-check && npm run test:run` | All pass |
| Cross-mode | Browse all pages in light + dark mode | No visual regressions |
| Viewport range (SC-006) | Test at 768px, 1024px, 1440px, 1920px | Layout and spacing correct at all widths |

**Testing strategy is primarily visual** — this is a CSS/template polish feature. Automated tests catch regressions in lint, types, and existing business logic, but the success criteria (SC-001 through SC-006) are visual and measured by inspection.

## Delivery Strategy

**MVP Boundary**: N/A — atomic feature. All 9 requirements work together to create a cohesive visual improvement. Delivering a subset (e.g., only typography without contrast fixes) would create an inconsistent intermediate state.

**However**, if incremental delivery is preferred, the natural slices are:

1. **Slice 1 — Foundations**: Steps 1–2 (tokens + docs) — lays groundwork, no visual regressions
2. **Slice 2 — High-Impact Visual**: Steps 3–5 (typography, tabs, active row) — addresses P1 + P2 requirements
3. **Slice 3 — Polish Details**: Steps 6–9 (timer, dots, spacing, labels) — addresses P2 + P3 requirements

**Recommended**: Deliver as a single PR since all changes are low-risk, non-breaking CSS/template modifications with no data or API implications.
