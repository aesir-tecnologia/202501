<!--
Sync Impact Report:
Version Change: 1.2.0 → 1.2.1 (PATCH - clarification to testing principles)
Modified Principles:
  - Principle II (Test-Driven Development) - Clarified database mocking policy for rate-limit scenarios
Added Sections: None
Removed Sections: None
Templates Requiring Updates:
  ✅ plan-template.md - No changes required (testing section references constitution)
  ✅ spec-template.md - No changes required
  ✅ tasks-template.md - No changes required (testing section references constitution)
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
   - Mutation hooks with optimistic updates
   - Automatic validation with Zod schemas
   - Automatic rollback on failure
   - Transform camelCase → snake_case via toDbPayload()

**Rationale**: This separation ensures type safety, consistent error handling, automatic caching, and optimal user experience with optimistic updates.

### II. Test-Driven Development

Testing is mandatory for all critical features:

- **Unit Tests** for pure logic (lib/, composables/)
- **Component Tests** using @nuxt/test-utils
- Tests MUST be written alongside implementation
- Run `npm test` during development
- Verify with `npm run test:run` before committing

**Minimal Mocking Philosophy**:
- Tests should NOT be overly mocked just to pass
- Mock ONLY what is completely out of scope for the test
- Prefer real implementations and integration tests over heavily mocked unit tests
- If you find yourself mocking extensively, consider if you're testing the right thing
- Real database interactions, real composables, and real components are preferred when feasible

**Database Mocking Exception**:
- Database connections MAY be mocked when necessary to avoid external service rate-limits (e.g., Supabase API limits during CI/CD or high-frequency test runs)
- Use mocked Supabase client for unit tests that validate logic without requiring actual database state
- Maintain dedicated integration tests with real database connections to validate full data flow
- Mock implementations MUST match the contract/interface of real implementations
- Balance: Unit tests with mocks for speed and isolation, integration tests with real DB for confidence

**Rationale**: Maintains code quality, prevents regressions, ensures reliability in production, and tests actual behavior rather than implementation details. Over-mocking creates brittle tests that pass but don't catch real bugs. Strategic database mocking enables faster test execution while maintaining test coverage and avoiding service rate-limits.

### III. Static Site Generation (SSG) + Client-Side Auth

Architecture pattern that MUST be followed:

- Public routes (`/home`, `/auth/*`) are pre-rendered at build time
- Protected routes (`/`, `/analytics`, `/reports`, `/settings`) use `ssr: false`
- Client-side auth middleware only (skips on server)
- Supabase credentials embedded at build time (only anon keys!)
- Never commit service role keys

**Rationale**: Provides fast loading times, good SEO for public pages, and secure client-side authentication.

### IV. Type Safety & Code Generation

Type safety is enforced at all levels:

- **Generated Types**: `app/types/database.types.ts` auto-generated from Supabase schema
- **TypedSupabaseClient**: Custom type wrapper for all database operations
- **Zod Schemas**: Runtime validation with TypeScript type inference
- **Type Exports**: Each layer exports its own types (Row, Insert, Update)
- Run `npm run supabase:types` after schema changes

**Rationale**: Prevents runtime errors, improves developer experience, and catches issues at compile time.

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

**Rationale**: Ensures users always understand what went wrong and how to fix it, improving UX and reducing support burden.

### VI. Optimistic Updates with Automatic Rollback

All mutations MUST implement optimistic updates:

- **onMutate**: Snapshot current cache state, apply optimistic update
- **onError**: Restore snapshot if mutation fails
- **onSuccess**: Invalidate affected queries for refetch
- Never leave cache in inconsistent state

**Rationale**: Provides instant UI feedback while maintaining data consistency, delivering the best possible user experience.

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
- Targeted: `invalidateQueries({ queryKey: entityKeys.detail(id) })` after updates
- Multiple: Update both list and detail caches when needed

**Rationale**: Ensures consistent cache management, prevents stale data, and enables precise cache invalidation.

## Technical Architecture Principles

### State Management

- **TanStack Query Only**: No Pinia/Vuex stores for server state
- All server state managed through TanStack Query cache
- **Singleton Pattern**: Use for global state (e.g., useStintTimer Web Worker)
- Local component state with ref/reactive as needed

**Rationale**: Simplifies architecture, leverages TanStack Query's powerful caching, reduces boilerplate.

### Component Library & Styling

- **Nuxt UI 4**: Primary component library
- **Tailwind CSS v4**: Styling via `@theme` directive in `app/assets/css/main.css`
- **Lucide Icons**: Bundled locally, used with `i-lucide-*` prefix
- **Dark Mode**: Always provide dark mode variants (`dark:*` classes)
- **No tailwind.config.ts**: All configuration in CSS via `@theme`
- **Design System Compliance**: ALL styling MUST follow `docs/DESIGN_SYSTEM.md`
  - Use documented color tokens (brand, ink, mint, amberx)
  - Follow typography scale and font families
  - Use Nuxt UI components with documented patterns
  - Apply spacing, layout, and animation guidelines
  - Reference design system for component usage examples
  - No custom styling that deviates from the design system without justification

**Rationale**: Modern approach with better type safety, improved performance, and consistent design system. Strict adherence to design system ensures visual consistency, accessibility, and maintainability across the entire application.

### Database Operations

- **Local Supabase**: Docker-based development environment
- **RLS (Row Level Security)**: Enforced on all tables
- **Migrations**: Created in `supabase/migrations/`, applied to local database
- **Type Generation**: `npm run supabase:types` after schema changes
- **Functions**: PostgreSQL functions for complex operations

**Rationale**: Ensures data security, maintains schema consistency, provides type safety.

### Code Quality

- **ESLint**: Configured via `@nuxt/eslint` with stylistic rules
- **Auto-fix**: Run `npm run lint:fix` before committing
- **Exception**: Single-word component names allowed for pages only
- **Naming**: camelCase for API, snake_case for database
- **No Comments**: Unless logic is too complex or explicitly requested

**Rationale**: Maintains consistent code style, prevents common errors, improves readability.

## Development Workflow

### Feature Development Process

1. **Database Changes**:
   - Create migration in `supabase/migrations/`
   - Apply to local database: `supabase db reset`
   - Regenerate types: `npm run supabase:types`

2. **Implementation**:
   - Update database layer (`app/lib/supabase/`)
   - Add/update Zod schema (`app/schemas/`)
   - Create/update composable with optimistic updates (`app/composables/`)
   - Write tests in corresponding `tests/` subdirectory

3. **Testing**:
   - Write tests alongside implementation
   - Run `npm test` during development
   - Verify with `npm run test:run` before committing

4. **Deployment**:
   - Test SSG build: `npm run generate && npm run serve`
   - Verify auth flows work on static preview
   - Deploy to Vercel

### Git Workflow

- **Never Auto-Commit**: Only commit when explicitly requested by user
- **Clear Messages**: Describe what and why, not how
- **Atomic Commits**: Each commit should be a logical unit
- **Verify Before Push**: Run tests and linting before pushing

### Environment Management

- **`.env` Required**: SUPABASE_URL and SUPABASE_ANON_KEY
- **Public Keys Only**: Never commit service role keys
- **Multiple Environments**: Development (remote), Staging, Production
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

This constitution supersedes all other practices and conventions. When in doubt, refer to these principles. All team members and AI assistants MUST follow these guidelines.

**Version**: 1.2.1 | **Ratified**: 2025-11-12 | **Last Amended**: 2025-11-14
