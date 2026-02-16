# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## ⛔ CRITICAL: No Assumptions Policy

**DO NOT MAKE ASSUMPTIONS. EVER.**

When given instructions, execute them EXACTLY as stated. If the instruction is ambiguous or could be interpreted multiple ways:

1. **ASK for clarification** - Do not guess what the user meant
2. **Do not selectively interpret** - "commit all changes" means ALL changes, not "the changes I think are relevant"
3. **Do not filter or scope down** - If told to do X, do X completely, not a subset you deem appropriate
4. **When in doubt, ask** - A clarifying question takes 5 seconds; redoing work takes minutes

**Examples of assumption failures to avoid:**
- ❌ "Commit all changes" → Only committing files I just edited
- ❌ "Fix all errors" → Only fixing errors I think are important
- ❌ "Update the tests" → Only updating tests for code I modified
- ✅ "Commit all changes" → Commit ALL uncommitted changes, ask how to group them if unclear

**If you catch yourself thinking "the user probably means..." — STOP and ASK.**

---

## Project Overview

LifeStint is a Nuxt 4 SSG application with Supabase authentication and database. It tracks focused work sessions (stints) for independent professionals across multiple client projects.

## Documentation

Project documentation is available in the `docs/` folder, including:
- Product overview and strategy
- User personas and flows
- Feature requirements
- Technical architecture
- Database schema
- Implementation guide
- Development roadmap
- Success metrics
- Operations and compliance

## Implementation Tracking

**Use GitHub Issues for tracking implementation status** — not manual updates to `docs/07-development-roadmap.md`. Link PRs to issues using `Closes #123` in the PR description.

For issue workflow details, CLI commands, and best practices, see **`docs/ISSUE_WORKFLOW.md`**.

## Key Commands

### Development
```bash
npm run dev              # Start dev server (localhost:3005)
npm run generate         # Generate static site (SSG)
npm run serve            # Preview generated static site locally (localhost:3000)
```

### Code Quality
```bash
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors automatically
npm run type-check       # Run TypeScript type checking
```

### Testing
```bash
npm run test:run         # Run tests once (CI mode) — PREFERRED
npm run test:ui          # Run tests with Vitest UI
npm test                 # Run tests in watch mode (⚠️ never use from Claude)
npm test -- path/to/file.test.ts  # Run single test file
```

### Database
```bash
npm run supabase:types   # Generate TypeScript types from local Supabase schema
                         # Outputs to app/types/database.types.ts
                         # Connects to local Supabase instance
```

**Note:** This project uses a local Supabase database for development. Run `supabase start` before development.

## Architecture

### SSG + Client-Side Auth Pattern

**Critical:** This is a **static site** with client-side authentication:
- Public routes (`/`, `/auth/*`) are pre-rendered at build time
- Protected routes (`/dashboard`, `/analytics`, `/reports`, `/settings`) use `ssr: false` and client-side auth middleware
- Auth middleware in `app/middleware/auth.ts` only runs on client (`if (import.meta.server) return`)
- Supabase credentials are embedded at build time from `.env` (only use anon keys!)

### Data Layer Architecture

The codebase follows a strict three-layer data access pattern:

#### 1. Database Layer (`app/lib/supabase/`)
Direct Supabase queries with type safety. Functions enforce user authentication and RLS.

**Pattern:**
- Export typed helpers: `ProjectRow`, `ProjectInsert`, `ProjectUpdate`
- All functions require `TypedSupabaseClient` parameter
- User ID automatically injected via `requireUserId()`
- Examples: `listProjects()`, `createProject()`, `updateProject()`

#### 2. Schema Layer (`app/schemas/`)
Zod schemas for validation and type inference. Use camelCase for API surface.

**Pattern:**
- Define constants for limits (exported as `*_SCHEMA_LIMITS`)
- Base schemas with common validations
- Separate create/update schemas with appropriate defaults
- Export inferred TypeScript types

#### 3. Composable Layer (`app/composables/`)
TanStack Query (Vue Query) hooks for data fetching and mutations. Provides automatic caching, optimistic updates, and automatic rollback on failure. Bridges camelCase schemas to snake_case database.

**Pattern:**
- Query hooks (`useProjectsQuery`, `useProjectQuery`) for data fetching
- Mutation hooks (`useCreateProject`, `useUpdateProject`, etc.) for mutations
- Automatic validation with Zod schemas before mutations
- Optimistic updates with automatic rollback on error
- Built-in loading states and error handling via TanStack Query

**Key Function:**
- `toDbPayload()` - Transforms camelCase → snake_case for database operations

**Usage:**
```ts
const { data: projects, isLoading } = useProjectsQuery()
const { mutateAsync: createProject } = useCreateProject()
await createProject({ name: 'Client Project', expectedDailyStints: 3 })

// Preferences
const { data: preferences } = usePreferencesQuery()
const { mutateAsync: updatePreferences } = useUpdatePreferences()
await updatePreferences({ celebrationAnimation: false })
```

### Error Handling & User Feedback

**Three-Layer Error Propagation:**

1. **Database Layer** (`app/lib/supabase/`): Returns `Result<T> = { data, error }` with custom error messages
   - Translates PostgreSQL errors to user-friendly messages
   - Example: `23505` duplicate key → "A project with this name already exists"
   - Business validation errors (e.g., can't delete project with active stint)

2. **Composable Layer** (`app/composables/`): Validates with Zod, throws errors for TanStack Query
   ```ts
   const validation = schema.safeParse(payload)
   if (!validation.success) {
     throw new Error(validation.error.issues[0]?.message || 'Validation failed')
   }
   ```

3. **Component Layer**: Try-catch with toast notifications
   ```ts
   try {
     await createProject({ name: 'New Project' })
     toast.add({ title: 'Success', color: 'success' })
   } catch (error) {
     toast.add({
       title: 'Operation failed',
       description: error instanceof Error ? error.message : 'Unexpected error',
       color: 'error',
     })
   }
   ```

**Toast Notification Pattern:**
```ts
toast.add({
  title: string,          // Short summary
  description?: string,   // Detailed message or error
  color: 'success' | 'error' | 'warning' | 'info' | 'neutral',
  icon?: string,          // Lucide icon (e.g., 'i-lucide-check-circle')
})
```

**Automatic Rollback:**
Mutations use two distinct cache update patterns:

1. **Optimistic update** (for instant UX on predictable operations like cancel):
   - `onMutate`: Snapshot cache, apply optimistic update before server responds
   - `onError`: Restore snapshot if mutation fails
   - `onSettled`: Invalidate queries for background refetch

2. **Seed and revalidate** (for operations requiring server validation like password-gated requests):
   - `onSuccess`: `setQueryData()` with mutation response for instant UI, then `invalidateQueries()` for background refetch
   - No `onMutate` — cache only updates after server confirms success

**Best-Effort Operations:**
For non-critical operations (e.g., audit logging), log failures but don't block the main operation:
```typescript
if (error) {
  logger.error('Audit log failed', error);  // Log for monitoring
  // Continue - don't return error to user
}
```

### Logging

Use the `logger` utility instead of `console.*` calls. Logs are routed to console in development and Sentry in production via `createConsolaReporter()`.

**Basic Usage:**
```ts
import { logger } from '~/utils/logger'

logger.info('Operation started', { projectId })
logger.warn('Unusual condition', { details })
logger.error('Operation failed', error)
logger.debug('Verbose tracing')  // Suppressed in production
```

**Module-Specific Logger:**
```ts
import { createLogger } from '~/utils/logger'

const log = createLogger('timer')
log.error('Timer failed', { reason })  // Tagged: [lifestint] [timer]
```

**Log Levels:**
| Level | Usage | Production |
|-------|-------|------------|
| `debug` | Verbose tracing, development only | Hidden |
| `info` | Operational messages, sync status | Visible |
| `warn` | Unexpected but handled conditions | Visible + Sentry |
| `error` | Failures requiring attention | Visible + Sentry |

### State Management

**Architecture:** Pure TanStack Query - no Pinia/Vuex stores. All server state managed through TanStack Query cache.

**Query Key Factory Pattern:**
Centralized cache organization via key factories:
```ts
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters?: ProjectListFilters) => [...projectKeys.lists(), filters] as const,
  detail: (id: string) => [...projectKeys.all, 'detail', id] as const,
}
```

**Cache Invalidation Strategies:**
- **Broad:** `invalidateQueries({ queryKey: projectKeys.all })` after create/delete
- **Targeted:** `invalidateQueries({ queryKey: projectKeys.detail(id) })` after specific updates
- **Multiple:** Update both list and detail caches simultaneously when needed

**⚠️ Cache Key Matching Gotcha:**
TanStack Query uses the **full query key** for cache lookups. When reading cached data with `getQueryData()`, you must use the exact same key that was used to populate the cache:
```ts
// Dashboard populates cache with:
useProjectsQuery({ includeInactive: true })  // key: ['projects', 'list', { includeInactive: true }]

// To read that cached data, you MUST match the filter:
queryClient.getQueryData(projectKeys.list({ includeInactive: true }))  // ✅ Works
queryClient.getQueryData(projectKeys.list(undefined))                   // ❌ Returns undefined
```

**Timer Singleton:**
`useStintTimer()` maintains a global singleton Web Worker for accurate time tracking, shared across all component instances.

### Type Safety

- **Generated Types:** `app/types/database.types.ts` auto-generated from Supabase schema
- **TypedSupabaseClient:** Custom type wrapper in `app/utils/supabase.ts`
- **Schema Validation:** Zod schemas validate at runtime and infer TypeScript types
- **Type Exports:** Each data layer exports its own types (Row, Insert, Update)

**Supabase Client Typing:**
Use `useTypedSupabaseClient()` from `~/utils/supabase` instead of `useSupabaseClient()` in composables. The `@nuxtjs/supabase` module uses its own `Database` type via module augmentation, which doesn't align with our generated types. This helper encapsulates the necessary type assertion in one documented location.

### Middleware

- `auth.ts` - Protects authenticated routes (client-side only, skips on server)
- `guest.ts` - Redirects authenticated users away from auth pages

### Edge Functions

Supabase Edge Functions in `supabase/functions/`:
- `process-account-deletions` - Cron-triggered cleanup of accounts past grace period
- `send-deletion-email` - Sends account deletion confirmation and reminder emails

**Account Deletion Gotchas:**
- `deletion_audit_log` has NO `user_id` column — only `anonymized_user_ref` (SHA-256 hash). Query/cleanup by ref, not user ID.
- `hasActiveStint()` intentionally blocks on both active AND paused stints (`ended_at IS NULL`). Users must fully end stints before requesting deletion.
- Log audit events (especially `'complete'`) AFTER the destructive operation succeeds, not before.

**Logging in Edge Functions:**
- Use `console.error()` / `console.log()` (NOT the `logger` utility from main app)
- Logs appear in: Supabase Dashboard → Edge Functions → Logs, or `supabase functions logs <name>`
- Validate required env vars at startup (fail fast before first request)

### Styling

**Nuxt UI 4** with Tailwind CSS. For colors, typography, tokens, and component patterns, see **`docs/DESIGN_SYSTEM.md`**.

> ⚠️ **CRITICAL: Nuxt UI 4 Documentation Requirement**
>
> Nuxt UI 4 is built on **Reka UI** (NOT Radix Vue or Headless UI). The API has significant breaking changes from Nuxt UI 2/3. **EVERY TIME** you use, edit, or modify a Nuxt UI component, you **MUST** check the official documentation first using the Context7 MCP tool:
>
> ```
> mcp__plugin_context7_context7__query-docs with libraryId="/llmstxt/ui4_nuxt_llms_txt"
> ```
>
> **Common API changes that WILL break if not checked:**
> - Menu items: `click` → `onSelect` (DropdownMenu, CommandPalette, NavigationMenu)
> - Form inputs: different prop names and event handlers
> - Modal/Dialog: different slot and prop structure
>
> **Do NOT rely on memory or assume APIs match other UI libraries.**

## Testing

Tests are **co-located** with the files they test for better discoverability and maintainability. See [Key Commands > Testing](#testing) for how to run tests.

### Test Organization

Tests live alongside their source files with a `.test.ts` suffix (e.g., `projects.ts` → `projects.test.ts`).

### Testing Philosophy

**"Test the unique logic, not the framework wiring."**

This codebase follows a **three-layer testing architecture** where each layer is tested at the appropriate level of abstraction:

#### Layer 1: Schema Tests (`app/schemas/*.test.ts`)
- **What:** Zod schema validation rules, transformations, boundary conditions
- **How:** Unit tests using `schema.safeParse()`
- **Examples:** Valid/invalid payloads, min/max lengths, null handling, error messages

#### Layer 2: Database Tests (`app/lib/supabase/*.test.ts`)
- **What:** Business logic, CRUD operations, auth/RLS enforcement, data transformations
- **How:** Integration tests against local Supabase database
- **Pattern:** Test with three client types (authenticated, unauthenticated, service)
- **Examples:** Query correctness, business rules (active stint blocks deletion), error handling

#### Layer 3: Composable Tests (`app/composables/*.test.ts`)
- **What:** Query key factory structure and consistency
- **How:** Unit tests verifying cache key hierarchy
- **Scope:** TanStack Query hooks (`useQuery`, `useMutation`) are **NOT tested directly**
- **Rationale:**
  - Composables are thin glue code that call database layer functions
  - Business logic is already tested in Layers 1 and 2
  - Framework behavior is tested by TanStack Query's own test suite
  - Avoids complex mocking of framework internals
  - Keeps tests focused, maintainable, and fast

**Examples of Established Pattern:**
- `useProjects.test.ts` - Only tests `projectKeys` factory
- `useStints.test.ts` - Only tests `stintKeys` factory
- `usePreferences.test.ts` - Only tests `preferencesKeys` factory
- `useAccountDeletion.test.ts` - Only tests `accountDeletionKeys` factory

**What This Means:**
- ✅ Query key factories → Test structure and consistency
- ✅ Business logic → Test in database layer with real Supabase
- ✅ Validation → Test in schema layer with Zod
- ❌ TanStack Query hooks → Do not mock/test at composable level
- ❌ Cache operations → Verified through E2E tests, not unit tests

This architecture ensures complete coverage while avoiding brittle tests that break when framework APIs change.

## Schema Design Patterns

**Discriminated Unions for State:**
Use Zod discriminated unions to prevent invalid state combinations:
```typescript
z.discriminatedUnion('isPending', [
  z.object({ isPending: z.literal(false), data: z.null() }),
  z.object({ isPending: z.literal(true), data: z.string() }),
])
```
Makes states like `{ isPending: true, data: null }` unrepresentable at compile time.

## Environment Variables

Required in `.env` for local development:

```env
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=your_local_anon_key_from_supabase_status
```

Get credentials from `supabase status` after running `supabase start`.

**Security Note:** Never commit service role keys. Only use public anon keys in `.env` since values are embedded in static build.

## Deployment

### CI/CD Pipeline

The project uses GitHub Actions for automated testing and deployment. See **`docs/CI_CD.md`** for complete documentation.

**Pipeline Flow:**
1. **Lint + Type Check** - Runs on all PRs and pushes to main
2. **Test** - Runs against local Supabase instance in CI
3. **Deploy Preview** - PRs get a Vercel preview deployment
4. **Deploy Production** - Push to main triggers:
   - Database migrations via `supabase db push`
   - Frontend deployment to Vercel

**Required GitHub Secrets:**
| Secret | Purpose |
|--------|---------|
| `SUPABASE_ACCESS_TOKEN` | CLI authentication |
| `SUPABASE_PROJECT_ID` | Production project reference |
| `SUPABASE_DB_PASSWORD` | Database password |
| `VERCEL_TOKEN` | Vercel API access |
| `VERCEL_ORG_ID` | Vercel organization |
| `VERCEL_PROJECT_ID` | Vercel project |

### Manual Deployment

- **Target Platform:** Vercel (or any static hosting)
- **Build Command:** `npm run generate`
- **Output Directory:** `.output/public`
- **Environment:** Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in Vercel dashboard

See `README.md` for detailed deployment instructions.

## Important Conventions

### Code Style
- **ESLint:** Configured via `@nuxt/eslint` with stylistic rules
- **Exceptions:** Single-word component names allowed for pages (routes, not reusable components)
- **Auto-fix:** Run `npm run lint:fix` before committing

## Development Workflow

1. **Database Changes:**
   - Create migration in `supabase/migrations/`
   - Apply to local database: `supabase db reset`
   - Regenerate types from local schema: `npm run supabase:types`
   - **Production migrations are automatically applied** when merged to main (via CI/CD)

2. **Adding Features:**
   - Update database layer (`app/lib/supabase/`)
   - Add/update Zod schema (`app/schemas/`)
   - Create/update composable with optimistic updates (`app/composables/`)
   - Write co-located tests (e.g., `projects.test.ts` alongside `projects.ts`)

3. **Testing:**
   - Write tests alongside implementation
   - Run `npm test` during development (uses local Supabase)
   - Verify with `npm run test:run` before committing
   - CI runs tests against local Supabase with migrations applied

4. **Deployment:**
   - Push to main branch triggers automated deployment
   - CI pipeline: Lint → Type Check → Test → Deploy Migrations → Deploy Frontend
   - Manual verification: `npm run generate && npm run serve`

## Tech Stack

### Core Framework
- **Vue 3** - Composition API with `<script setup>` syntax
- **Nuxt 4** - SSG mode via `nitro: { preset: 'static' }`
- **TypeScript** - Full type safety with strict mode
- **Vue Router** - Client-side routing (auto-generated from pages)

### UI & Styling
- **Nuxt UI 4** - Component library built on **Reka UI** primitives (NOT Radix Vue)
- **Tailwind CSS** - Utility-first CSS (bundled with Nuxt UI)
- **Lucide Icons** - Icon library (`@iconify-json/lucide`, bundled locally)
- **Color Mode** - System-aware dark/light mode via Nuxt UI

### State & Data Management
- **TanStack Query** - Server state, caching, optimistic updates (Vue Query)
- **VueUse** - Composition utilities (`@vueuse/core`, `@vueuse/integrations`)
- **SortableJS** - Drag-and-drop via `useSortable` from VueUse

### Backend & Database
- **Supabase JS** - PostgreSQL client with auth and RLS
- **Local PostgreSQL** - Supabase local development via Docker
- **Row Level Security (RLS)** - User-scoped data access policies

### Monitoring & Error Tracking
- **Sentry** - Production error tracking via `@sentry/nuxt`
- **Consola** - Logging abstraction with Sentry integration (UnJS/Nuxt team)

**Sentry Consola Integration:**
Use `Sentry.createConsolaReporter()` (reporter pattern), not `consolaIntegration` (doesn't exist). Configure in `sentry.*.config.ts` after `Sentry.init()`.

### Testing
- **Vitest** - Unit and integration test runner
- **Happy DOM** - Lightweight DOM implementation for tests
- **Local Supabase** - Tests run against local Supabase instance
- **@nuxt/test-utils** - Nuxt-specific testing utilities

### Code Quality
- **@nuxt/eslint** - ESLint configuration with stylistic rules
- **TypeScript Strict Mode** - Type checking via `nuxt typecheck`

### Build & Deployment
- **Nitro** - Static site generation engine (Nuxt 4 built-in)
- **Vite** - Build tool and dev server (Nuxt 4 built-in)
- **Target Platform** - Vercel or any static hosting provider

## Active Technologies
- TypeScript 5 / Vue 3 / Nuxt 4 + Nuxt UI 4 (UModal, UTable, UTooltip), TanStack Query (Vue Query) (008-stint-progress-modal)
- Supabase PostgreSQL (existing `stints` table — read-only access, no migrations) (008-stint-progress-modal)

## Recent Changes
- 008-stint-progress-modal: Added TypeScript 5 / Vue 3 / Nuxt 4 + Nuxt UI 4 (UModal, UTable, UTooltip), TanStack Query (Vue Query)
