# Implementation Plan: Pause and Switch

**Branch**: `006-suspend-switch` | **Date**: 2025-12-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-suspend-switch/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

The Pause and Switch feature enables users to start a new stint on a different project while another stint is paused, addressing the limitation where users with urgent interruptions must either end their current stint early (inflating stint counts) or remain blocked. The implementation relaxes the current database constraint to allow one active + one paused stint per user, modifies `getActiveStint()` to return only active stints, adds `getPausedStint()` for paused stint queries, and enhances the conflict resolution dialog with a "Start new stint" option.

## Technical Context

**Language/Version**: TypeScript 5.9.3 with Vue 3.5.24 Composition API + Nuxt 4.2.1 (SSG)
**Primary Dependencies**: @nuxtjs/supabase 1.6.2, @supabase/supabase-js 2.57.4, @tanstack/vue-query 5.90.6, Zod, Nuxt UI 4.2.0
**Storage**: PostgreSQL via Supabase with Row Level Security (RLS), local development via Docker
**Testing**: Vitest 3.2.4 with Happy DOM, co-located tests alongside source files
**Target Platform**: Static site (SSG) with client-side auth, deployed to Vercel
**Project Type**: Web application (Nuxt SSG)
**Performance Goals**: 3-second pause-and-switch flow (2 interactions), 2-second resume (1 interaction)
**Constraints**: Client-side only auth middleware, only anon keys embedded at build time
**Scale/Scope**: Single-user focus tracking with 1 active + 1 paused stint maximum

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Three-Layer Data Access Architecture ✅
- **Database Layer**: Modify unique constraint, update `resume_stint` and `validate_stint_start` functions
- **Schema Layer**: No changes — reuse existing `interrupted` completion type
- **Composable Layer**: Update `useStints.ts` with `getPausedStint` query and `usePausedStintQuery` hook

### II. Test-Driven Development ✅
- Will write co-located tests for database layer changes
- Will test conflict resolution flow with mocked Supabase client
- Integration tests for pause-and-switch user flow

### III. Static Site Generation (SSG) + Client-Side Auth ✅
- No server-side changes needed; all logic runs client-side
- Conflict resolution dialog is client-side UI component

### IV. Type Safety & Code Generation ✅
- Will regenerate types after migration: `npm run supabase:types`
- Zod schemas will enforce new completion type

### V. User-Friendly Error Handling ✅
- Database layer will translate constraint violations to friendly messages
- Toast notifications for abandon confirmation
- Clear dialog messaging for conflict resolution

### VI. Optimistic Updates with Automatic Rollback ✅
- Abandon mutation will implement optimistic update pattern
- Conflict resolution will use existing TanStack Query patterns

### VII. Query Key Factory Pattern ✅
- Will use existing `stintKeys` factory for cache invalidation
- No new cache keys needed

### Pre-Design Gate Status: ✅ PASSED - No violations

### Post-Design Re-Evaluation ✅

After Phase 1 design completion, all constitution principles remain satisfied:

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Three-Layer Architecture | ✅ | `data-model.md` defines DB functions, `contracts/` defines types, `quickstart.md` shows composable pattern |
| II. Test-Driven Development | ✅ | `quickstart.md` includes test examples for all new functionality |
| III. SSG + Client-Side Auth | ✅ | No server-side code; conflict dialog is pure Vue component |
| IV. Type Safety | ✅ | `contracts/stint-operations.ts` defines all TypeScript interfaces |
| V. Error Handling | ✅ | `database-functions.sql` includes user-friendly EXCEPTION messages |
| VI. Optimistic Updates | ✅ | Existing `useInterruptStint` pattern reused for stopping paused stints |
| VII. Query Key Factory | ✅ | Adds `stintKeys.paused()` for separate paused stint cache |

**Post-Design Gate Status: ✅ PASSED - Ready for task generation**

## Project Structure

### Documentation (this feature)

```text
specs/006-suspend-switch/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
app/
├── components/
│   └── StintConflictDialog.vue    # New: Conflict resolution dialog
├── composables/
│   └── useStints.ts               # Update: Add usePausedStintQuery, modify active query
├── lib/supabase/
│   └── stints.ts                  # Update: Modify getActiveStint, add getPausedStint
├── schemas/
│   └── stints.ts                  # No changes needed
└── pages/
    └── dashboard.vue              # Update: Integrate conflict dialog

supabase/migrations/
└── YYYYMMDDHHMMSS_pause_and_switch.sql  # New: Schema changes
```

**Structure Decision**: Web application with Nuxt SSG. Changes span database layer (migration), schema layer (Zod), composable layer (TanStack Query mutations), and UI components (conflict dialog). Tests co-located with source files.

## Complexity Tracking

> No violations requiring justification. Implementation follows all constitution principles.
