# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LifeStint is a Nuxt 4 SSG application with Supabase authentication and database. It tracks focused work sessions (stints) for independent professionals across multiple client projects.

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
- Public routes (`/`, `/auth/*`) are pre-rendered at build time
- Protected routes (`/dashboard/**`) use `ssr: false` and client-side auth middleware
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

**Conflict Detection:**
`startStint()` detects concurrent operations and returns `ConflictError` type with existing stint data. Components display conflict resolution modal for user action.

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

**Real-time Sync:**
`useStintRealtime()` subscribes to Supabase real-time changes and directly updates TanStack Query cache via `setQueryData()` for cross-device synchronization.

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
- **Icons:** Lucide and Heroicons bundled locally (no CDN)
- **Dark Mode:** Via Tailwind `dark:` variants, theme toggle uses `UColorModeButton`
- **Config:** `colorMode` settings in `nuxt.config.ts` and `app.config.ts`

## Testing

**Test Categories:**
1. **Unit Tests** (`tests/lib/`, `tests/composables/`) - Pure logic, no DOM
2. **Database Tests** (`tests/database/`) - RLS policies, migrations
3. **Component Tests** - Use `@nuxt/test-utils` for Vue component testing

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

See `DEPLOYMENT.md` for detailed instructions.

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
   - Run `npm test` during development
   - Verify with `npm run test:run` before committing

4. **Deployment:**
   - Test SSG build: `npm run generate && npm run serve`
   - Verify auth flows work on static preview
   - Deploy to Vercel
