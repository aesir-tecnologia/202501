# Implementation Plan: Design System Token Enforcement

**Branch**: `001-design-system-enforcement` | **Date**: 2025-11-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-design-system-enforcement/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Enforce design system tokens across all Vue components by updating color, typography, spacing, and icon usage to match the documented design system in `docs/DESIGN_SYSTEM.md`. This ensures visual consistency, proper dark mode support, and maintainable styling through centralized design tokens rather than scattered component modifications.

## Technical Context

**Language/Version**: TypeScript 5.x with Vue 3 Composition API
**Primary Dependencies**: Nuxt 4 (SSG), Nuxt UI v4, Tailwind CSS v4, Lucide Icons
**Storage**: N/A (UI/styling changes only, no data layer modifications)
**Testing**: Vitest for unit/component tests, visual regression testing via manual review
**Target Platform**: Static site (SSG) deployed to Vercel, supports modern browsers
**Project Type**: Web application (Nuxt 4 SSG with client-side auth)
**Performance Goals**: No performance impact expected; may improve rendering with standardized CSS classes
**Constraints**: Must not break existing functionality or visual layouts; must maintain WCAG AA contrast in both light and dark modes
**Scale/Scope**: Updating ~15-25 Vue components across app/components/, app/pages/, and app/layouts/

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Design System Compliance (Component Library & Styling)
✅ **PASS**: This feature explicitly enforces the constitution's requirement that "ALL styling MUST follow `docs/DESIGN_SYSTEM.md`". It addresses:
- Using documented color tokens (brand, ink, mint, amberx)
- Following typography scale and font families
- Using Nuxt UI components with documented patterns
- Applying spacing, layout, and animation guidelines
- No custom styling that deviates from the design system

### Three-Layer Data Access Architecture
✅ **PASS**: Not applicable - this feature only updates UI/styling, does not modify data layer.

### Test-Driven Development
✅ **PASS**: Visual regression testing will be performed manually via before/after comparison in both light and dark modes. Component functionality tests already exist and will be run to ensure no behavioral regressions.

### SSG + Client-Side Auth
✅ **PASS**: No changes to architecture pattern - only updating CSS classes and design tokens in existing components.

### Type Safety & Code Generation
✅ **PASS**: No changes to type system - only updating template styling.

### Error Handling & User Feedback
✅ **PASS**: Not applicable - purely visual/styling changes, no error handling modifications.

### Optimistic Updates & Query Key Factory
✅ **PASS**: Not applicable - no data mutations or state management changes.

**Gate Status**: ✅ ALL GATES PASSED - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/001-design-system-enforcement/
├── spec.md              # Feature specification
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command) - N/A for this feature
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command) - N/A for this feature
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

This is a Nuxt 4 web application with the following structure:

```text
app/
├── components/          # Vue components to be updated with design tokens
│   ├── analytics/       # Analytics-specific components
│   ├── auth/            # Authentication components
│   ├── common/          # Shared/common components
│   ├── projects/        # Project management components
│   ├── reports/         # Reporting components
│   ├── settings/        # Settings components
│   └── stints/          # Stint tracking components
├── pages/               # Page components (routes) to be updated
│   ├── analytics/       # Analytics pages
│   ├── auth/            # Auth pages (login, signup, etc.)
│   ├── reports/         # Reports pages
│   └── settings/        # Settings pages
├── layouts/             # Layout components to be updated
├── assets/              # CSS and static assets
│   └── css/
│       └── main.css     # Tailwind CSS config with @theme blocks
└── ...                  # Other app directories (not affected)

docs/
└── DESIGN_SYSTEM.md     # Design system documentation (reference)

tests/
├── components/          # Component tests (run to ensure no regressions)
├── database/            # Not affected
├── lib/                 # Not affected
└── composables/         # Not affected
```

**Structure Decision**: Web application (Nuxt 4 SSG). This feature updates only UI components, pages, and layouts - no changes to data layer (lib/, composables/, schemas/). The design system is documented in `docs/DESIGN_SYSTEM.md` and tokens are defined in `app/assets/css/main.css`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected - all constitution checks passed.
