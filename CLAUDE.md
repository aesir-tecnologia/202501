# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

## Key Commands

### Development
```bash
npm run dev              # Start dev server (localhost:3000)
npm run generate         # Generate static site (SSG)
npm run serve            # Preview generated static site locally
```

### Code Quality
```bash
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors automatically
```

### Testing
```bash
npm test                 # Run tests in watch mode
npm run test:ui          # Run tests with Vitest UI
npm run test:run         # Run tests once (CI mode)
```

### Database
```bash
npm run supabase:types   # Generate TypeScript types from remote Supabase schema
                         # Outputs to app/types/database.types.ts
                         # Connects to linked remote database (not local)
```

**Note:** This project uses a remote Supabase database. All database operations (migrations, type generation, etc.) are performed against the remote linked instance.

## Architecture

### SSG + Client-Side Auth Pattern

**Critical:** This is a **static site** with client-side authentication:
- Public routes (`/home`, `/auth/*`) are pre-rendered at build time
- Protected routes (`/`, `/analytics`, `/reports`, `/settings`) use `ssr: false` and client-side auth middleware
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

**Files:**
- `app/lib/supabase/projects.ts` - Project CRUD operations
- `app/lib/supabase/stints.ts` - Stint CRUD operations

#### 2. Schema Layer (`app/schemas/`)
Zod schemas for validation and type inference. Use camelCase for API surface.

**Pattern:**
- Define constants for limits (exported as `*_SCHEMA_LIMITS`)
- Base schemas with common validations
- Separate create/update schemas with appropriate defaults
- Export inferred TypeScript types

**Files:**
- `app/schemas/projects.ts` - Project validation rules
- `app/schemas/stints.ts` - Stint validation rules

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

**Files:**
- `app/composables/useProjects.ts` - Project queries and mutations

**Usage:**
```ts
const { data: projects, isLoading } = useProjectsQuery()
const { mutateAsync: createProject } = useCreateProject()
await createProject({ name: 'Client Project', expectedDailyStints: 3 })
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
All mutations implement optimistic updates with automatic cache rollback on error:
- `onMutate`: Snapshots current cache state, applies optimistic update
- `onError`: Restores snapshot if mutation fails
- `onSuccess`: Invalidates affected queries for refetch

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

**Timer Singleton:**
`useStintTimer()` maintains a global singleton Web Worker for accurate time tracking, shared across all component instances.

### Type Safety

- **Generated Types:** `app/types/database.types.ts` auto-generated from Supabase schema
- **TypedSupabaseClient:** Custom type wrapper in `app/utils/supabase.ts`
- **Schema Validation:** Zod schemas validate at runtime and infer TypeScript types
- **Type Exports:** Each data layer exports its own types (Row, Insert, Update)

### Middleware

- `auth.ts` - Protects authenticated routes (client-side only, skips on server)
- `guest.ts` - Redirects authenticated users away from auth pages

### Styling

- **Nuxt UI 4** component library with Tailwind CSS
- **Icons:** Lucide icons bundled locally (no CDN)
- **Dark Mode:** Via Tailwind `dark:` variants, theme toggle uses `UColorModeButton`
- **Config:** `colorMode` settings in `nuxt.config.ts` and `app.config.ts`

## Testing

**Dual-Mode Testing Infrastructure:**
Tests run against a **mocked Supabase client by default** to avoid API rate limits and provide fast feedback. Integration tests can optionally run against a real Supabase instance.

### Test Modes

**1. Unit Tests (Mocked - Default)**
```bash
npm test                 # Run in watch mode (mocked)
npm run test:ui          # Run with Vitest UI (mocked)
npm run test:run         # Run once in CI mode (mocked)
```
- **Speed:** ~1 second for full suite
- **API Calls:** Zero external calls
- **Rate Limiting:** None
- **Use Case:** Local development, CI/CD, rapid iteration

**2. Integration Tests (Real Supabase)**
```bash
USE_MOCK_SUPABASE=false npm run test:run
```
- **Speed:** ~7-10 seconds (network dependent)
- **API Calls:** Real Supabase API
- **Rate Limiting:** Subject to Supabase limits
- **Use Case:** Pre-deployment validation, RLS testing

### Mock Implementation

**Location:** `tests/mocks/supabase.ts`

**Features:**
- In-memory storage for projects and stints
- Client-isolated auth state (per-client user sessions)
- Query builder API matching Supabase PostgREST
- Automatic cleanup between tests via `resetMockStore()`

**Supported Operations:**
- Query: `.select()`, `.eq()`, `.neq()`, `.in()`, `.is()`, `.filter()`, `.order()`, `.limit()`, `.single()`, `.maybeSingle()`
- Mutations: `.insert()`, `.update()`, `.delete()`
- Auth: `client.auth.getUser()`, `client.auth.signOut()`

**Mock Limitations:**
- Complex RLS policies (basic user_id filtering only)
- Database triggers (e.g., `updated_at` auto-update)
- PostgreSQL-specific functions
- Real-time subscriptions

### Test Helpers

**`getTestUser(userNumber: 1 | 2)`**
- Returns mocked client by default
- Returns real authenticated client when `USE_MOCK_SUPABASE=false`
- Each user has isolated session and data

**`cleanupTestData(client)`**
- Resets mock store when using mocks
- Deletes database rows when using real Supabase

### Test Organization

```
tests/
├── mocks/
│   └── supabase.ts       # Mock Supabase client implementation
├── lib/                  # Unit tests for database layer (mocked by default)
├── composables/          # Unit tests for composables (mocked by default)
├── schemas/              # Schema validation tests (no DB needed)
├── setup.ts              # Global test setup with dual-mode support
├── globalSetup.ts        # Real Supabase setup (only when USE_MOCK_SUPABASE=false)
└── README.md             # Detailed testing documentation
```

**See `tests/README.md` for comprehensive testing guide, mock architecture details, and examples.**

## Environment Variables

Required in `.env` (see `.env.example`):

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Security Note:** Never commit service role keys. Only use public anon keys in `.env` since values are embedded in static build.

## Deployment

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
   - Apply to remote database via Supabase CLI or dashboard
   - Regenerate types from remote: `npm run supabase:types`

2. **Adding Features:**
   - Update database layer (`app/lib/supabase/`)
   - Add/update Zod schema (`app/schemas/`)
   - Create/update composable with optimistic updates (`app/composables/`)
   - Write tests in corresponding `tests/` subdirectory

3. **Testing:**
   - Write tests alongside implementation
   - Run `npm test` during development (uses mocked Supabase)
   - Verify with `npm run test:run` before committing
   - Optional: Run integration tests with `USE_MOCK_SUPABASE=false npm run test:run` before major releases

4. **Deployment:**
   - Test SSG build: `npm run generate && npm run serve`
   - Verify auth flows work on static preview
   - Deploy to Vercel

## Active Technologies
- TypeScript 5.x with Vue 3 Composition API + Nuxt 4 (SSG), Nuxt UI v4, Tailwind CSS v4, Lucide Icons (001-design-system-enforcement)
- N/A (UI/styling changes only, no data layer modifications) (001-design-system-enforcement)

## Recent Changes
- 001-design-system-enforcement: Added TypeScript 5.x with Vue 3 Composition API + Nuxt 4 (SSG), Nuxt UI v4, Tailwind CSS v4, Lucide Icons
- Testing Infrastructure: Implemented dual-mode testing with mocked Supabase client (default) for fast unit tests (~1s) and optional real Supabase integration tests. Eliminates API rate limiting during development and CI/CD. See `tests/README.md` for details.
