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

## GitHub Operations

For GitHub CLI commands, issue types, and API usage, see **`.claude/GITHUB.md`**.

Key commands:
```bash
# Set issue type (gh CLI doesn't support --type flag yet)
gh api repos/aesir-tecnologia/202501/issues/{NUMBER} -X PATCH -f type="Bug"
gh api repos/aesir-tecnologia/202501/issues/{NUMBER} -X PATCH -f type="Feature"
gh api repos/aesir-tecnologia/202501/issues/{NUMBER} -X PATCH -f type="Task"
```

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
```

### Testing
```bash
npm test                 # Run tests in watch mode
npm run test:ui          # Run tests with Vitest UI
npm run test:run         # Run tests once (CI mode)
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
> - Many components have different default behaviors
>
> **Do NOT rely on memory or assume APIs match other UI libraries.**

**Design System: "Focused Warmth + Deep Focus Hybrid"**

The design system uses warm, natural tones that reinforce the "focused work" metaphor:

| Role | Light Mode | Dark Mode | Tailwind |
|------|------------|-----------|----------|
| Primary | Terracotta | Orange | `orange-600/700` |
| Secondary | Forest | Green | `green-600/700` |
| Tertiary | Sage | Lime | `lime-500` |
| Background | Warm Cream `#fffbf5` | Stone-900 | `bg-[#fffbf5]` / `stone-900` |
| Text | Stone-800 | Stone-50 | `stone-800` / `stone-50` |
| Borders | Stone-200 | Stone-700 | `stone-200` / `stone-700` |

**Typography:**
- **Headings:** Fraunces (serif) via `font-serif` class
- **Body:** Instrument Sans via `font-sans` class
- **Mono:** JetBrains Mono for timers/code

**CSS Tokens:** Defined in `app/assets/css/tokens.css` with semantic CSS variables for both modes.

## Testing

Tests are **co-located** with the files they test for better discoverability and maintainability.

### Running Tests

```bash
npm test                 # Run in watch mode
npm run test:ui          # Run with Vitest UI
npm run test:run         # Run once in CI mode
```

### Test Organization

Tests live alongside their source files with a `.test.ts` suffix:

```
app/
├── lib/
│   └── supabase/
│       ├── projects.ts           # Source file
│       ├── projects.test.ts      # Test file
│       ├── stints.ts
│       └── stints.test.ts
├── composables/
│   ├── useProjects.ts
│   ├── useProjects.test.ts
│   ├── useStints.ts
│   └── useStints.test.ts
├── schemas/
│   ├── projects.ts
│   ├── projects.test.ts
│   ├── stints.ts
│   └── stints.test.ts
```

## Environment Variables

Required in `.env` for local development:

```env
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=your_local_anon_key_from_supabase_status
```

Get credentials from `supabase status` after running `supabase start`.

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
   - Apply to local database: `supabase db reset`
   - Regenerate types from local schema: `npm run supabase:types`

2. **Adding Features:**
   - Update database layer (`app/lib/supabase/`)
   - Add/update Zod schema (`app/schemas/`)
   - Create/update composable with optimistic updates (`app/composables/`)
   - Write co-located tests (e.g., `projects.test.ts` alongside `projects.ts`)

3. **Testing:**
   - Write tests alongside implementation
   - Run `npm test` during development (uses local Supabase)
   - Verify with `npm run test:run` before committing

4. **Deployment:**
   - Test SSG build: `npm run generate && npm run serve`
   - Verify auth flows work on static preview
   - Deploy to Vercel

## Tech Stack

### Core Framework
- **Vue 3.5.24** - Composition API with `<script setup>` syntax
- **Nuxt 4.2.1** - SSG mode via `nitro: { preset: 'static' }`
- **TypeScript 5.9.3** - Full type safety with strict mode
- **Vue Router 4.5.1** - Client-side routing (auto-generated from pages)

### UI & Styling
- **Nuxt UI 4.2.0** - Component library built on **Reka UI** primitives (NOT Radix Vue)
- **Tailwind CSS 4.1.17** - Utility-first CSS (bundled with Nuxt UI)
- **Lucide Icons 1.2.73** - Icon library (`@iconify-json/lucide`, bundled locally)
- **Color Mode** - System-aware dark/light mode via Nuxt UI

### State & Data Management
- **TanStack Query 5.91.2** - Server state, caching, optimistic updates (Vue Query)
- **VueUse 13.9.0** - Composition utilities (`@vueuse/core`, `@vueuse/integrations`)
- **SortableJS 1.15.6** - Drag-and-drop via `useSortable` from VueUse

### Backend & Database
- **Supabase JS 2.83.0** - PostgreSQL client with auth and RLS
- **Local PostgreSQL** - Supabase local development via Docker
- **Row Level Security (RLS)** - User-scoped data access policies

### Testing
- **Vitest 3.2.4** - Unit and integration test runner
- **Happy DOM 18.0.1** - Lightweight DOM implementation for tests
- **Local Supabase** - Tests run against local Supabase instance
- **@nuxt/test-utils 3.19.2** - Nuxt-specific testing utilities

### Code Quality
- **@nuxt/eslint 1.9.0** - ESLint configuration with stylistic rules
- **TypeScript Strict Mode** - Type checking via `nuxt typecheck`

### Build & Deployment
- **Nitro** - Static site generation engine (Nuxt 4 built-in)
- **Vite** - Build tool and dev server (Nuxt 4 built-in)
- **Target Platform** - Vercel or any static hosting provider

## Active Technologies
- TypeScript 5.9.3 with Vue 3.5.24 Composition API + Nuxt 4.2.1 (SSG), @nuxtjs/supabase 1.6.2, @supabase/supabase-js 2.57.4, @tanstack/vue-query 5.90.6, Zod (via schemas) (001-migrate-edge-functions)
- PostgreSQL via Supabase with Row Level Security (RLS), local development via Docker (001-migrate-edge-functions)
- TypeScript 5.9.3 with Vue 3.5.24 Composition API + Nuxt 4.2.1 (SSG) + @nuxtjs/supabase 1.6.2, @supabase/supabase-js 2.57.4, @tanstack/vue-query 5.90.6, Zod (005-daily-reset)
- TypeScript 5.9.3 with Vue 3.5.24 Composition API + Nuxt 4.2.1 (SSG) + @nuxtjs/supabase 1.6.2, @supabase/supabase-js 2.57.4, @tanstack/vue-query 5.90.6, Zod, Nuxt UI 4.2.0 (006-suspend-switch)

## Recent Changes
- 001-migrate-edge-functions: Added TypeScript 5.9.3 with Vue 3.5.24 Composition API + Nuxt 4.2.1 (SSG), @nuxtjs/supabase 1.6.2, @supabase/supabase-js 2.57.4, @tanstack/vue-query 5.90.6, Zod (via schemas)
