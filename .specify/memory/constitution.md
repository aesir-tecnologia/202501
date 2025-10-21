# LifeStint Constitution

<!--
SYNC IMPACT REPORT
Version: 0.0.0 → 1.0.0 (Initial constitution creation)
Modified principles: N/A (new constitution)
Added sections: All sections (initial creation)
Removed sections: None

Templates requiring updates:
✅ .specify/templates/spec-template.md - validated (no changes needed)
✅ .specify/templates/plan-template.md - updated with detailed Constitution Check section
✅ .specify/templates/tasks-template.md - validated (no changes needed)
⚠ .claude/commands/*.md - pending review for consistency

Follow-up TODOs:
- Review command files in .claude/commands/ for alignment with new principles
- Consider documenting RATIFICATION_DATE in project history
-->

## Core Principles

### I. Three-Layer Architecture (NON-NEGOTIABLE)

The codebase MUST maintain strict separation between database, schema, and composable layers:

- **Database Layer** (`app/lib/supabase/`): Direct Supabase queries with TypeScript type safety. All functions MUST require `TypedSupabaseClient` parameter and enforce user authentication via `requireUserId()`.
- **Schema Layer** (`app/schemas/`): Zod schemas MUST use camelCase for API surface. All validation constants MUST be exported as `*_SCHEMA_LIMITS`.
- **Composable Layer** (`app/composables/`): MUST implement optimistic updates with automatic rollback on failure. All mutations MUST validate via Zod schemas before database operations.

**Rationale**: This architecture ensures testability, type safety, and clear separation of concerns. Breaking this pattern creates technical debt and makes the codebase harder to maintain and test.

### II. Test-First Development (NON-NEGOTIABLE)

All new features and bug fixes MUST follow TDD:

- Tests MUST be written before implementation
- Tests MUST fail initially (red phase)
- Implementation MUST make tests pass (green phase)
- Code MUST be refactored for quality (refactor phase)
- Three test categories are mandatory: Unit tests (pure logic), Database tests (RLS policies), Component tests (Vue components)

**Rationale**: TDD ensures code correctness, improves design, provides living documentation, and prevents regressions. This is especially critical for the three-layer architecture where each layer requires specific testing strategies.

### III. Type Safety Across All Layers

TypeScript strict mode MUST be enabled. All data transformations MUST preserve type safety:

- Database types MUST be auto-generated via `npm run supabase:types`
- Schema validation MUST use Zod with TypeScript inference
- Composables MUST correctly transform camelCase ↔ snake_case via `toDbPayload()`
- No `any` types without explicit justification in code comments
- All exported functions MUST have explicit return types

**Rationale**: Type safety prevents runtime errors, improves developer experience, and serves as compiler-verified documentation. The three-layer architecture relies on type safety to prevent data transformation bugs.

### IV. User Experience Consistency

UI/UX MUST maintain consistency across all features:

- All components MUST use Nuxt UI 4 component library (no custom components that duplicate library functionality)
- Icons MUST use bundled Lucide or Heroicons sets (no CDN dependencies)
- Dark mode MUST work via Tailwind `dark:` variants on all UI elements
- Loading states MUST be shown for all async operations
- Error messages MUST be user-friendly, specific, and actionable
- Forms MUST provide immediate validation feedback

**Rationale**: Consistency reduces cognitive load, improves usability, and maintains professional appearance. The SSG architecture requires special attention to client-side state management and loading states.

### V. Performance Budgets

The following performance requirements are NON-NEGOTIABLE:

- SSG build MUST complete in under 60 seconds for standard features
- Initial page load (FCP) MUST be under 1.5 seconds on 3G connection
- Time to Interactive (TTI) MUST be under 3 seconds on 3G connection
- Client-side route transitions MUST complete in under 200ms
- Database queries MUST use indexes and complete in under 100ms (p95)
- Bundle size increases MUST be justified (max +50KB per feature)

**Rationale**: LifeStint targets independent professionals who may work in varied network conditions. Performance directly impacts user satisfaction and professional credibility.

### VI. Security and Privacy by Default

Security MUST be baked in, not bolted on:

- RLS policies MUST be tested in `tests/database/` before deployment
- Only `SUPABASE_ANON_KEY` MUST be used in `.env` (never service role keys)
- All protected routes MUST use `auth.ts` middleware with client-side checks
- User data MUST be scoped to authenticated user via `requireUserId()`
- Authentication state MUST be validated before any data operation
- No sensitive data (tokens, keys, emails) in client-side state or logs

**Rationale**: LifeStint handles professional work data. Security breaches would destroy user trust. The SSG architecture requires careful handling of authentication state and API keys.

### VII. Code Quality Standards

All code MUST pass automated quality gates:

- ESLint MUST pass with zero warnings (`npm run lint`)
- All tests MUST pass (`npm run test:run`)
- Code coverage MUST be ≥80% for new features (measured per-layer)
- Complexity: Functions >20 lines MUST be refactored or justified
- DRY: Duplicated logic (3+ occurrences) MUST be extracted
- Naming: MUST follow conventions (camelCase TS/Vue, snake_case DB, PascalCase components)

**Rationale**: Consistent code quality improves maintainability, reduces bugs, and enables confident refactoring. The three-layer architecture requires discipline to prevent logic leakage across boundaries.

## Development Workflow

### Feature Development Process

All new features MUST follow this workflow:

1. **Specification**: Create feature spec using `/specify` command
2. **Planning**: Generate implementation plan using `/plan` command
3. **Tasks**: Break down into tasks using `/tasks` command
4. **TDD Cycle**: Write tests → Verify failure → Implement → Verify pass → Refactor
5. **Quality Gates**: Run lint, tests, and build checks
6. **Review**: Self-review against constitution principles
7. **Integration**: Verify auth flows on static preview (`npm run generate && npm run serve`)

### Database Changes

Database schema changes MUST follow this procedure:

1. Create migration in `supabase/migrations/[timestamp]_[description].sql`
2. Apply migration locally or via Supabase dashboard
3. Regenerate types: `npm run supabase:types`
4. Update affected schemas in `app/schemas/`
5. Update affected database layer functions in `app/lib/supabase/`
6. Write/update RLS tests in `tests/database/`
7. Update affected composables if data shape changed

### Git and Version Control

Commits MUST be atomic and follow conventions:

- Conventional commits format: `type(scope): description`
- Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `style`
- Each commit MUST represent a single logical change
- WIP commits are forbidden in main branch
- All commits MUST pass quality gates before push

## Quality Gates

### Pre-Commit Gates

Before committing, the following MUST pass:

- [ ] `npm run lint` completes with zero errors/warnings
- [ ] `npm run test:run` passes all tests
- [ ] No `console.log` statements in committed code (use proper logging)
- [ ] No commented-out code blocks
- [ ] All TODO comments have issue numbers or dates

### Pre-Deployment Gates

Before deployment, the following MUST pass:

- [ ] `npm run generate` completes successfully
- [ ] `npm run serve` preview shows no console errors
- [ ] Authentication flows work on static preview
- [ ] All protected routes redirect properly when not authenticated
- [ ] Dark mode toggle works on all pages
- [ ] Forms submit successfully and show proper validation
- [ ] Performance: Lighthouse score ≥90 for Performance, Accessibility, Best Practices

## Governance

### Amendment Process

Constitution amendments MUST follow this procedure:

1. Propose amendment with rationale in project discussion
2. Document impact on existing code and templates
3. Update constitution version following semantic versioning
4. Propagate changes to dependent templates and command files
5. Update `LAST_AMENDED_DATE` to current date
6. Create migration plan if changes affect existing code
7. Commit with message: `docs: amend constitution to vX.Y.Z (summary)`

### Version Increment Rules

- **MAJOR**: Backward-incompatible changes (principle removals, redefinitions)
- **MINOR**: New principles added or material expansions to guidance
- **PATCH**: Clarifications, wording improvements, typo fixes

### Compliance Review

All code reviews MUST verify:

- Adherence to three-layer architecture pattern
- Test-first development (tests exist and pass)
- Type safety maintained across all changes
- Performance budgets respected
- Security best practices followed
- Code quality standards met

### Exception Handling

Deviations from constitutional principles MUST be:

1. Documented in implementation plan's "Complexity Tracking" section
2. Justified with specific rationale
3. Accompanied by proof that simpler alternatives were considered
4. Approved before implementation begins
5. Time-boxed with plan to remove deviation in future

**Version**: 1.0.0 | **Ratified**: 2025-10-04 | **Last Amended**: 2025-10-04
