# Implementation Plan: Migrate Supabase Edge Functions to Nuxt Client

**Branch**: `001-migrate-edge-functions` | **Date**: 2025-11-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-migrate-edge-functions/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Migrate all seven Supabase Edge Functions for stint operations to client-side Nuxt composables following the existing three-layer data access architecture. The migration moves business logic from server-side Edge Functions to client-side validation and operations while maintaining identical behavior, preserving existing PostgreSQL RPC functions for complex operations, and using server-side cron for auto-completion. This simplifies the architecture by eliminating the edge function layer and leveraging TanStack Query for optimistic updates and automatic rollback.

## Technical Context

**Language/Version**: TypeScript 5.9.3 with Vue 3.5.24 Composition API
**Primary Dependencies**: Nuxt 4.2.1 (SSG), @nuxtjs/supabase 1.6.2, @supabase/supabase-js 2.57.4, @tanstack/vue-query 5.90.6, Zod (via schemas)
**Storage**: PostgreSQL via Supabase with Row Level Security (RLS), local development via Docker
**Testing**: Vitest 3.2.4 with @nuxt/test-utils 3.19.2 and Happy DOM 18.0.1, tests run against local Supabase instance
**Target Platform**: Static site (SSG) deployed to Vercel with client-side auth
**Project Type**: Web application (single Nuxt project with SSG mode)
**Performance Goals**: <1s stint start operation, <100ms validation, instant optimistic UI updates
**Constraints**: Client-side only (no SSR for protected routes), must maintain exact same user-facing behavior as edge functions, auto-completion via server-side cron every 2 minutes
**Scale/Scope**: 7 edge functions to migrate, ~15-20 files to modify/create across database/schema/composable layers, existing PostgreSQL RPC functions unchanged

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Three-Layer Data Access Architecture ✅ COMPLIANT
- Migration follows existing three-layer pattern
- Database Layer: Update `app/lib/supabase/stints.ts` with edge function logic
- Schema Layer: Use existing `app/schemas/stints.ts`, add validation for new operations
- Composable Layer: Update `app/composables/useStints.ts` with TanStack Query mutations
- **Status**: No violations

### Principle II: Test-Driven Development ✅ COMPLIANT
- Tests will be written alongside migration for each layer
- Existing tests in `tests/lib/supabase/stints.test.ts` and `tests/composables/useStints.test.ts` will be updated
- Integration tests with real local Supabase database
- **Status**: No violations

### Principle III: SSG + Client-Side Auth ✅ COMPLIANT
- Migration moves edge functions to client-side, aligning with SSG architecture
- All operations use client-side Supabase client with RLS enforcement
- No SSR required for stint operations
- **Status**: No violations

### Principle IV: Type Safety & Code Generation ✅ COMPLIANT
- Using existing `app/types/database.types.ts` generated from Supabase schema
- TypedSupabaseClient for all database operations
- Zod schemas for runtime validation
- **Status**: No violations

### Principle V: User-Friendly Error Handling ✅ COMPLIANT
- Three-layer error propagation: Database → Composable → Component
- PostgreSQL errors translated to user-friendly messages
- Toast notifications for all operations
- **Status**: No violations

### Principle VI: Optimistic Updates with Automatic Rollback ✅ COMPLIANT
- All mutations implement onMutate/onError/onSuccess pattern
- Cache snapshots and automatic rollback on failure
- **Status**: No violations

### Principle VII: Query Key Factory Pattern ✅ COMPLIANT
- Using existing `stintKeys` factory for cache management
- Targeted cache invalidation after mutations
- **Status**: No violations

### Design System Compliance ✅ COMPLIANT
- No UI changes required (data layer only)
- **Status**: Not applicable

**GATE RESULT**: ✅ PASS - No constitution violations. Proceed to Phase 0.

---

## Constitution Check (Post-Design Re-evaluation)

*Re-evaluated after Phase 1 design artifacts complete*

### Principle I: Three-Layer Data Access Architecture ✅ COMPLIANT
- **Design Review**: All operations follow strict three-layer pattern
- Database Layer: Functions in `app/lib/supabase/stints.ts` handle all RPC calls and direct queries
- Schema Layer: Zod schemas in `app/schemas/stints.ts` with STINT_SCHEMA_LIMITS constants
- Composable Layer: TanStack Query hooks in `app/composables/useStints.ts` with optimistic updates
- **Status**: Fully compliant, design reinforces existing architecture

### Principle II: Test-Driven Development ✅ COMPLIANT
- **Design Review**: Comprehensive test strategy documented in quickstart.md
- Tests planned for all three layers (schemas, database, composables)
- Integration tests for full lifecycle (start → pause → resume → complete)
- Real database integration tests with local Supabase
- **Status**: Fully compliant, test coverage planned for all new code

### Principle III: SSG + Client-Side Auth ✅ COMPLIANT
- **Design Review**: Migration eliminates edge function layer, strengthens SSG pattern
- All operations use client-side Supabase client
- RLS policies enforce security at database level
- No SSR required for stint operations
- **Status**: Fully compliant, improves alignment with SSG architecture

### Principle IV: Type Safety & Code Generation ✅ COMPLIANT
- **Design Review**: Complete TypeScript contract definitions in contracts/stint-operations.ts
- Uses existing generated database types
- Zod schemas provide runtime validation with type inference
- All functions properly typed with Result<T> and ConflictError types
- **Status**: Fully compliant, enhanced type safety with contracts

### Principle V: User-Friendly Error Handling ✅ COMPLIANT
- **Design Review**: Three-layer error propagation documented in data-model.md
- Database layer translates PostgreSQL errors (23505 → "A stint is already active")
- Composable layer validates with Zod and throws clear errors
- Component layer shows toast notifications with detailed messages
- **Status**: Fully compliant, maintains user-friendly error messages

### Principle VI: Optimistic Updates with Automatic Rollback ✅ COMPLIANT
- **Design Review**: All mutations implement onMutate/onError/onSuccess pattern
- Snapshot/restore pattern for cache rollback
- Conflict errors handled specially (no optimistic update for start stint)
- Query invalidation after successful mutations
- **Status**: Fully compliant, follows established pattern

### Principle VII: Query Key Factory Pattern ✅ COMPLIANT
- **Design Review**: stintKeys factory defined in contracts
- Cache invalidation strategies documented (broad vs targeted)
- Proper key hierarchy: all → lists → list(filters) → detail(id) → active
- **Status**: Fully compliant, consistent with project patterns

### Design System Compliance ✅ COMPLIANT
- **Design Review**: No UI changes in this migration (data layer only)
- Components that consume new composables already follow design system
- **Status**: Not applicable (no UI changes)

**POST-DESIGN GATE RESULT**: ✅ PASS - All principles satisfied. Design is complete and ready for implementation (/speckit.tasks).

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
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
├── lib/supabase/
│   └── stints.ts                    # Database layer - Update with edge function logic
├── schemas/
│   └── stints.ts                    # Schema layer - Add/update validation schemas
├── composables/
│   ├── useStints.ts                 # Composable layer - Update with new mutations
│   └── useStintTimer.ts             # Timer singleton (no changes needed)
└── types/
    └── database.types.ts            # Generated from Supabase schema (no changes)

tests/
├── lib/supabase/
│   └── stints.test.ts               # Database layer tests - Update
└── composables/
    └── useStints.test.ts            # Composable tests - Update

supabase/
├── functions/                        # TO BE REMOVED after migration
│   ├── stints-start/
│   ├── stints-stop/
│   ├── stints-pause/
│   ├── stints-resume/
│   ├── stints-active/
│   ├── stint-auto-complete/         # Move to cron job
│   └── stint-sync-check/
└── migrations/
    └── [timestamp]_add_cron_auto_complete.sql    # New migration for cron job
```

**Structure Decision**: Nuxt 4 SSG single project structure. All source code lives in `app/` directory following three-layer architecture. Edge functions in `supabase/functions/` will be completely removed after migration is verified. Auto-completion logic will move to a PostgreSQL cron job triggered every 2 minutes. Tests mirror the source structure in `tests/` directory.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No complexity violations detected.** This migration simplifies the architecture by removing the edge function layer and consolidating logic into the existing three-layer pattern.
