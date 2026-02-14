<!--
Sync Impact Report:
Version Change: 1.2.2 → 1.3.0 (MINOR - new principles + material expansions)
Modified Principles:
  - II. Testing → Expanded with three-layer testing architecture
  - III. SSG routes → Fixed: `/home` → `/`, protected `/` → `/dashboard`
  - VI. Optimistic Updates → Rewritten as "Cache Update Strategies"
    with two patterns: optimistic update + seed-and-revalidate
Added Sections:
  - VIII. Observability & Logging (new Core Principle)
  - Edge Functions (new Technical Architecture section)
  - CI/CD Pipeline (new Development Workflow section)
Removed Sections: None
Modified (non-principle):
  - Environment Management → Fixed: "Development (remote)" → "Local Supabase"
Templates Requiring Updates:
  ✅ plan-template.md - No changes required (generic templates)
  ✅ spec-template.md - No changes required
  ✅ tasks-template.md - No changes required (generic templates)
Follow-up TODOs: None
-->

# LifeStint Project Constitution

## Core Principles

### I. Three-Layer Data Access Architecture (NON-NEGOTIABLE)

All data access MUST follow the strict three-layer pattern:

1. **Database Layer** (`app/lib/supabase/`): Direct Supabase queries with type safety
   - Export typed helpers (Row, Insert, Update)
   - Require TypedSupabaseClient parameter
   - Enforce user authentication and RLS
   - Return Result<T> = { data, error } with user-friendly error messages

2. **Schema Layer** (`app/schemas/`): Zod schemas for validation and type inference
   - Use camelCase for API surface
   - Export schema limits as constants (*_SCHEMA_LIMITS)
   - Separate create/update schemas with appropriate defaults
   - Export inferred TypeScript types

3. **Composable Layer** (`app/composables/`): TanStack Query hooks
   - Query hooks for data fetching
   - Mutation hooks with cache update strategies (see Principle VI)
   - Automatic validation with Zod schemas
   - Transform camelCase → snake_case via toDbPayload()

**Rationale**: This separation ensures type safety, consistent error handling,
automatic caching, and optimal user experience.

### II. Three-Layer Testing Architecture

Testing follows a strict layered approach: "Test the unique logic, not the
framework wiring."

**Layer 1 — Schema Tests** (`app/schemas/*.test.ts`):
- Zod validation rules, transformations, boundary conditions
- Unit tests using `schema.safeParse()`
- Valid/invalid payloads, min/max lengths, null handling, error messages

**Layer 2 — Database Tests** (`app/lib/supabase/*.test.ts`):
- Business logic, CRUD operations, auth/RLS enforcement
- Integration tests against local Supabase database
- Test with three client types (authenticated, unauthenticated, service)

**Layer 3 — Composable Tests** (`app/composables/*.test.ts`):
- Query key factory structure and consistency ONLY
- TanStack Query hooks (useQuery, useMutation) are NOT tested directly
- Composables are thin glue code — business logic is tested in Layers 1–2

**What this means**:
- ✅ Query key factories → Test structure and consistency
- ✅ Business logic → Test in database layer with real Supabase
- ✅ Validation → Test in schema layer with Zod
- ❌ TanStack Query hooks → Do not mock/test at composable level
- ❌ Cache operations → Verified through E2E tests, not unit tests

**Minimal Mocking Philosophy**:
- Mock ONLY what is completely out of scope for the test
- Prefer real implementations and integration tests over heavily mocked units
- Database connections MAY be mocked to avoid rate-limits in CI/CD
- Mock implementations MUST match the contract of real implementations

**Co-located tests**: Tests live alongside source files with `.test.ts` suffix.

**Rationale**: Tests actual behavior rather than implementation details.
Over-mocking creates brittle tests that pass but don't catch real bugs. The
three-layer approach ensures complete coverage while keeping tests focused,
maintainable, and fast.

### III. Static Site Generation (SSG) + Client-Side Auth

Architecture pattern that MUST be followed:

- Public routes (`/`, `/auth/*`) are pre-rendered at build time
- Protected routes (`/dashboard`, `/analytics`, `/reports`, `/settings`)
  use `ssr: false` and client-side auth middleware
- Auth middleware in `app/middleware/auth.ts` only runs on client
  (`if (import.meta.server) return`)
- Supabase credentials embedded at build time (only anon keys!)
- Never commit service role keys

**Rationale**: Provides fast loading times, good SEO for public pages, and
secure client-side authentication.

### IV. Type Safety & Code Generation

Type safety is enforced at all levels:

- **Generated Types**: `app/types/database.types.ts` auto-generated from
  Supabase schema
- **TypedSupabaseClient**: Custom type wrapper for all database operations
  (use `useTypedSupabaseClient()` instead of `useSupabaseClient()`)
- **Zod Schemas**: Runtime validation with TypeScript type inference
- **Type Exports**: Each layer exports its own types (Row, Insert, Update)
- Run `npm run supabase:types` after schema changes

**Rationale**: Prevents runtime errors, improves developer experience, and
catches issues at compile time.

### V. User-Friendly Error Handling

Three-layer error propagation pattern:

1. **Database Layer**: Translates PostgreSQL errors to user-friendly messages
   - Example: `23505` duplicate key → "A project with this name already exists"
   - Business validation errors with clear explanations

2. **Composable Layer**: Validates with Zod, throws errors for TanStack Query
   - Clear validation error messages
   - Automatic error propagation to components

3. **Component Layer**: Try-catch with toast notifications
   - `toast.add()` for all user feedback
   - Success, error, warning, and info states
   - Detailed error descriptions when available

**Best-Effort Operations**: For non-critical operations (e.g., audit logging),
log failures but do not block the main operation.

**Rationale**: Ensures users always understand what went wrong and how to fix
it, improving UX and reducing support burden.

### VI. Cache Update Strategies

Mutations MUST use one of two cache update patterns, chosen based on operation
characteristics:

**Pattern 1 — Optimistic Update** (for instant UX on predictable operations):
- `onMutate`: Snapshot cache, apply optimistic update before server responds
- `onError`: Restore snapshot if mutation fails
- `onSettled`: Invalidate queries for background refetch
- Use for: cancel, toggle, reorder — operations unlikely to fail

**Pattern 2 — Seed and Revalidate** (for server-validated operations):
- `onSuccess`: `setQueryData()` with mutation response for instant UI,
  then `invalidateQueries()` for background refetch
- No `onMutate` — cache only updates after server confirms success
- Use for: password-gated requests, operations requiring server validation

Never leave cache in inconsistent state regardless of pattern.

**Rationale**: Different operations have different reliability profiles.
Predictable operations benefit from instant feedback; server-validated
operations MUST wait for confirmation before updating the UI.

### VII. Query Key Factory Pattern

Cache organization MUST use centralized key factories:

```typescript
export const entityKeys = {
  all: ['entity'] as const,
  lists: () => [...entityKeys.all, 'list'] as const,
  list: (filters?) => [...entityKeys.lists(), filters] as const,
  detail: (id: string) => [...entityKeys.all, 'detail', id] as const,
}
```

**Cache Invalidation Strategies**:
- Broad: `invalidateQueries({ queryKey: entityKeys.all })` after create/delete
- Targeted: `invalidateQueries({ queryKey: entityKeys.detail(id) })` after
  updates
- Multiple: Update both list and detail caches when needed

**Cache Key Matching**: TanStack Query uses the full query key for lookups.
When reading cached data with `getQueryData()`, you MUST use the exact same
key that was used to populate the cache, including filter objects.

**Rationale**: Ensures consistent cache management, prevents stale data, and
enables precise cache invalidation.

### VIII. Observability & Logging

All application code MUST use the structured logging utilities instead of
raw `console.*` calls:

- **`logger`** (`~/utils/logger`): Default logger for general use
- **`createLogger(module)`** (`~/utils/logger`): Module-tagged logger for
  domain-specific tracing (e.g., `createLogger('timer')`)
- Logs route to console in development, Sentry in production via
  `createConsolaReporter()`

**Log Levels**:
| Level | Usage | Production |
|-------|-------|------------|
| `debug` | Verbose tracing, development only | Hidden |
| `info` | Operational messages, sync status | Visible |
| `warn` | Unexpected but handled conditions | Visible + Sentry |
| `error` | Failures requiring attention | Visible + Sentry |

**Edge Functions Exception**: Edge Functions use `console.error()` /
`console.log()` directly (the `logger` utility is not available in Deno).

**Rationale**: Structured logging enables production observability via Sentry,
consistent log formatting, and level-based filtering. Without it, errors in
date/timezone code or silent fallbacks become invisible.

## Technical Architecture Principles

### State Management

- **TanStack Query Only**: No Pinia/Vuex stores for server state
- All server state managed through TanStack Query cache
- **Singleton Pattern**: Use for global state (e.g., useStintTimer Web Worker)
- Local component state with ref/reactive as needed

**Rationale**: Simplifies architecture, leverages TanStack Query's powerful
caching, reduces boilerplate.

### Component Library & Styling

- **Nuxt UI 4**: Primary component library (built on **Reka UI**, NOT Radix)
- **Tailwind CSS v4**: Styling via `@theme` directive in
  `app/assets/css/main.css`
- **Lucide Icons**: Bundled locally, used with `i-lucide-*` prefix
- **Dark Mode**: Always provide dark mode variants (`dark:*` classes)
- **No tailwind.config.ts**: All configuration in CSS via `@theme`
- **Design System Compliance**: ALL styling MUST follow `docs/DESIGN_SYSTEM.md`
  - Use documented color tokens (brand, ink, mint, amberx)
  - Follow typography scale and font families
  - Use Nuxt UI components with documented patterns
  - Apply spacing, layout, and animation guidelines
  - No custom styling that deviates from the design system without
    justification

**Rationale**: Modern approach with better type safety, improved performance,
and consistent design system.

### Database Operations

- **Local Supabase**: Docker-based development environment
- **RLS (Row Level Security)**: Enforced on all tables
- **Migrations**: Created in `supabase/migrations/`, applied to local database
- **Type Generation**: `npm run supabase:types` after schema changes
- **Functions**: PostgreSQL functions for complex operations

**Rationale**: Ensures data security, maintains schema consistency, provides
type safety.

### Edge Functions

Supabase Edge Functions in `supabase/functions/`:

- **Runtime**: Deno (NOT Node.js — different APIs and module system)
- **Logging**: Use `console.error()` / `console.log()` (NOT the `logger`
  utility from main app)
- **Validation**: Validate required env vars at startup (fail fast before
  first request)
- **Logs**: Supabase Dashboard → Edge Functions → Logs, or
  `supabase functions logs <name>`

**Rationale**: Edge Functions run in a separate Deno runtime. Applying
Node.js patterns (imports, logging utilities) will fail at runtime.

### Code Quality

- **ESLint**: Configured via `@nuxt/eslint` with stylistic rules
- **Auto-fix**: Run `npm run lint:fix` before committing
- **Exception**: Single-word component names allowed for pages only
- **Naming**: camelCase for API, snake_case for database
- **No Comments**: Unless logic is too complex or explicitly requested

**Rationale**: Maintains consistent code style, prevents common errors,
improves readability.

## Development Workflow

### Feature Development Process

1. **Database Changes**:
   - Create migration in `supabase/migrations/`
   - Apply to local database: `supabase db reset`
   - Regenerate types: `npm run supabase:types`

2. **Implementation**:
   - Update database layer (`app/lib/supabase/`)
   - Add/update Zod schema (`app/schemas/`)
   - Create/update composable (`app/composables/`)
   - Write co-located tests (e.g., `projects.test.ts` alongside `projects.ts`)

3. **Testing**:
   - Write tests alongside implementation
   - Run `npx vitest run` (NEVER watch mode)
   - Verify with `npm run test:run` before committing

4. **Deployment**:
   - Test SSG build: `npm run generate && npm run serve`
   - Verify auth flows work on static preview
   - Push to main triggers automated CI/CD

### CI/CD Pipeline

Automated via GitHub Actions:

1. **Lint + Type Check** — Runs on all PRs and pushes to main
2. **Test** — Runs against local Supabase instance in CI
3. **Deploy Preview** — PRs get a Vercel preview deployment
4. **Deploy Production** — Push to main triggers:
   - Database migrations via `supabase db push`
   - Frontend deployment to Vercel

**Rationale**: Automated pipeline ensures code quality gates are enforced
before any code reaches production. Production database migrations are
applied automatically — no manual intervention required.

### Git Workflow

- **Never Auto-Commit**: Only commit when explicitly requested by user
- **Clear Messages**: Describe what and why, not how
- **Atomic Commits**: Each commit should be a logical unit
- **Verify Before Push**: Run tests and linting before pushing

### Environment Management

- **`.env` Required**: SUPABASE_URL and SUPABASE_ANON_KEY
- **Public Keys Only**: Never commit service role keys
- **Local Development**: Local Supabase via Docker (`supabase start`)
- **Vercel Deployment**: Set environment variables in dashboard

## Governance

### Amendment Process

1. **Propose Change**: Document change with rationale
2. **Impact Analysis**: Check all templates and dependent docs
3. **Version Bump**: Follow semantic versioning (MAJOR.MINOR.PATCH)
4. **Sync Templates**: Update all affected template files
5. **Update Report**: Add Sync Impact Report to constitution
6. **Commit**: Use format `docs: amend constitution to vX.Y.Z (summary)`

### Versioning Policy

- **MAJOR**: Backward incompatible governance/principle changes
- **MINOR**: New principles or materially expanded guidance
- **PATCH**: Clarifications, wording fixes, non-semantic refinements

### Compliance Review

- All PRs MUST verify compliance with these principles
- Architecture decisions MUST be justified if deviating from patterns
- Complexity MUST be justified and simpler alternatives documented
- Use CLAUDE.md for runtime development guidance

### Constitution Authority

This constitution supersedes all other practices and conventions. When in
doubt, refer to these principles. All team members and AI assistants MUST
follow these guidelines.

**Version**: 1.3.0 | **Ratified**: 2025-11-12 | **Last Amended**: 2026-02-12
