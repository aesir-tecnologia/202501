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
npm run supabase:types   # Generate TypeScript types from Supabase schema
                         # Outputs to app/types/database.types.ts
```

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
Optimistic UI mutations with automatic rollback on failure. Bridges camelCase schemas to snake_case database.

**Pattern:**
- Accept optional client/state overrides for testability
- Validate with Zod schemas before mutations
- Apply optimistic updates immediately to local state
- Roll back on error, replace with server response on success
- Return `OptimisticResult<T>` with data/error pattern

**Key Function:**
- `toDbPayload()` - Transforms camelCase → snake_case for database operations

**Files:**
- `app/composables/useProjectMutations.ts` - Project mutations with optimistic updates

**Usage Example:**
```ts
// In a Vue component
const client = useSupabaseClient<TypedSupabaseClient>()
const { createProject, updateProject, deleteProject } = useProjectMutations()

// Optimistic create
const { data, error } = await createProject({
  name: 'Client Project',
  expectedDailyStints: 3,
  customStintDuration: 45,
})

// Optimistic update
await updateProject(projectId, { name: 'Updated Name' })

// Optimistic delete
await deleteProject(projectId)
```

### File Organization

```
app/
├── components/          # Vue components
├── composables/         # Vue composables (mutations layer)
├── layouts/            # Layout components
├── lib/
│   └── supabase/       # Database access layer
├── middleware/         # Route middleware (auth, guest)
├── pages/              # File-based routing
├── schemas/            # Zod validation schemas
├── types/              # TypeScript types
│   └── database.types.ts  # Generated from Supabase
└── utils/              # Utility functions

supabase/
└── migrations/         # SQL migration files

tests/
├── composables/        # Composable unit tests
├── database/           # RLS policy tests
└── lib/supabase/       # Database layer tests
```

### Type Safety

- **Generated Types:** `app/types/database.types.ts` auto-generated from Supabase schema
- **TypedSupabaseClient:** Custom type wrapper in `app/utils/supabase.ts`
- **Schema Validation:** Zod schemas validate at runtime and infer TypeScript types
- **Type Exports:** Each data layer exports its own types (Row, Insert, Update)

### Middleware

- `auth.ts` - Protects authenticated routes, client-side only
- `guest.ts` - Redirects authenticated users away from auth pages

Apply in page `definePageMeta()`:
```ts
definePageMeta({
  middleware: 'auth',  // or 'guest'
})
```

### Styling

- **Nuxt UI 4** component library with Tailwind CSS
- **Icons:** Lucide and Heroicons bundled locally (no CDN)
- **Dark Mode:** Via Tailwind `dark:` variants, theme toggle uses `UColorModeButton`
- **Config:** `colorMode` settings in `nuxt.config.ts` and `app.config.ts`

## Testing Guidelines

### Running Tests

- Run during development: `npm test` (watch mode)
- Run once: `npm run test:run` (for CI)
- Visual UI: `npm run test:ui`

### Test Categories

1. **Unit Tests** (`tests/lib/`, `tests/composables/`) - Pure logic, no DOM
2. **Database Tests** (`tests/database/`) - RLS policies, migrations
3. **Component Tests** - Use `@nuxt/test-utils` for Vue component testing

### Test Setup

- Configuration: `vitest.config.ts`
- Global setup: `tests/setup.ts`
- Path aliases match Nuxt's `~` and `@` conventions

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

### Naming
- Database columns: `snake_case` (enforced by Supabase/PostgreSQL)
- TypeScript/Vue: `camelCase` for API surface (schemas, composables)
- Components: `PascalCase` (Vue standard)
- Composables: `use*` prefix (Vue standard)

### Import Aliases
- `~/` - Resolves to `app/` directory
- `@/` - Resolves to project root
- Configured in `nuxt.config.ts` and `vitest.config.ts`

### Code Style
- **ESLint:** Configured via `@nuxt/eslint` with stylistic rules
- **Exceptions:** Single-word component names allowed for pages (routes, not reusable components)
- **Auto-fix:** Run `npm run lint:fix` before committing

## Development Workflow

1. **Database Changes:**
   - Create migration in `supabase/migrations/`
   - Apply locally or push to Supabase
   - Regenerate types: `npm run supabase:types`

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
