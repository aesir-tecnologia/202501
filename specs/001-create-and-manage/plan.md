
# Implementation Plan: Dashboard Project Management

**Branch**: `001-create-and-manage` | **Date**: 2025-10-04 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/Users/machado/Projects/202501/specs/001-create-and-manage/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code, or `AGENTS.md` for all other agents).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Dashboard-based CRUD operations for project management via modal dialogs. Users can create, edit, delete, and reorder projects without leaving the dashboard page. Features include duplicate name validation, active stint deletion protection, cascade deletion of historical stints, optimistic UI updates with error rollback, and drag-and-drop reordering.

## Technical Context
**Language/Version**: TypeScript 5.x (Nuxt 4 SSG)
**Primary Dependencies**: Nuxt 4, Vue 3, Nuxt UI 4, Supabase (client), Zod, VueUse (@vueuse/core for drag-and-drop)
**Storage**: Supabase PostgreSQL (projects table already exists with RLS policies)
**Testing**: Vitest, @nuxt/test-utils, @testing-library/vue
**Target Platform**: Static site (SSG) with client-side auth, deployed to Vercel
**Project Type**: SSG Web Application (Nuxt 4)
**Performance Goals**: <1s load on 3G (per spec FR-046), <200ms route transitions, optimistic UI updates
**Constraints**: Client-side only (ssr: false), RLS enforced, <50KB bundle increase, <100ms p95 database queries
**Scale/Scope**: ~10 Vue components (modals, forms, list items), 3 composables (mutations), Zod schemas, database layer functions, RLS tests

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Architecture Compliance
- [x] Follows three-layer pattern (Database → Schema → Composable)
- [x] Database layer uses TypedSupabaseClient and requireUserId()
- [x] Schema layer uses Zod with camelCase and exports SCHEMA_LIMITS
- [x] Composable layer implements optimistic updates with rollback

### Testing Strategy
- [x] TDD approach planned (tests before implementation)
- [x] Unit tests identified for pure logic (composables, validation, transform functions)
- [x] Database tests planned for RLS policies (project deletion with active stints, duplicate names, sort_order)
- [x] Component tests planned for Vue components (modals, forms, drag-and-drop)
- [x] Test coverage target ≥80% per layer

### Type Safety
- [x] Database types will be auto-generated via supabase:types
- [x] Zod schemas defined with TypeScript inference
- [x] camelCase ↔ snake_case transformation via toDbPayload()
- [x] No any types (or justified in complexity tracking)
- [x] All exported functions have explicit return types

### UX Consistency
- [x] Uses Nuxt UI 4 components (no duplicates) - UModal, UForm, UButton, UInput, UNotification
- [x] Icons from bundled Lucide/Heroicons only
- [x] Dark mode via Tailwind dark: variants
- [x] Loading states for all async operations (during create/update/delete/reorder)
- [x] User-friendly, actionable error messages (duplicate names, active stint blocking)
- [x] Immediate validation feedback on forms (inline errors)

### Performance Requirements
- [x] SSG build estimated <60s (minimal code addition)
- [x] FCP target <1.5s on 3G (dashboard already meets this)
- [x] TTI target <3s on 3G (no heavy dependencies added)
- [x] Route transitions <200ms (modal-based, no route changes)
- [x] Database queries use indexes, <100ms p95 (existing indexes on user_id, sort_order)
- [x] Bundle size increase justified (max +50KB) - estimated +15KB for drag-and-drop library

### Security & Privacy
- [x] RLS policies tested in tests/database/
- [x] Only SUPABASE_ANON_KEY used (no service role)
- [x] Protected routes use auth.ts middleware (dashboard already protected)
- [x] User data scoped via requireUserId()
- [x] Auth state validated before data ops
- [x] No sensitive data in client state/logs

### Code Quality
- [x] ESLint configuration followed
- [x] All tests pass before commit
- [x] Functions >20 lines justified or refactored
- [x] No duplication (3+ occurrences extracted)
- [x] Naming follows conventions (camelCase/snake_case/PascalCase)

**Constitution Reference**: v1.0.0 (see `.specify/memory/constitution.md`)

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
app/
├── components/
│   └── project/                # Project-related components
│       ├── ProjectCreateModal.vue
│       ├── ProjectEditModal.vue
│       ├── ProjectDeleteConfirm.vue
│       ├── ProjectForm.vue     # Shared form component
│       └── ProjectListItem.vue # Draggable list item
├── composables/
│   └── useProjectMutations.ts  # Already exists, will be extended
├── lib/
│   └── supabase/
│       ├── projects.ts         # Already exists, may need extensions
│       └── stints.ts           # For active stint check
├── pages/
│   └── dashboard/
│       └── index.vue           # Will integrate project modals
├── schemas/
│   └── projects.ts             # Already exists, validate extends if needed
└── types/
    └── database.types.ts       # Auto-generated

tests/
├── composables/
│   └── useProjectMutations.test.ts
├── database/
│   ├── project-rls.test.ts     # RLS policy tests
│   └── project-constraints.test.ts
└── components/
    ├── ProjectCreateModal.test.ts
    ├── ProjectEditModal.test.ts
    └── ProjectForm.test.ts

supabase/
└── migrations/
    └── [timestamp]_add_project_sort_order.sql  # If needed
```

**Structure Decision**: Nuxt 4 SSG application with three-layer architecture. All source code in `app/` directory following Vue/Nuxt conventions. Tests mirror source structure in `tests/` directory. Database migrations in `supabase/migrations/`.

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh claude`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (data-model.md, contracts/, quickstart.md)
- Follow TDD approach: Tests → Implementation → Verification

**Task Categories**:

1. **Database Layer Tasks** (tests first):
   - Migration: Create `[timestamp]_add_project_sort_order.sql`
   - Database tests: RLS policies, constraints (duplicate names, active stint check, cascade delete)
   - Database functions: Extend `app/lib/supabase/projects.ts` with reorder and active stint check functions
   - Type regeneration: `npm run supabase:types`

2. **Schema Layer Tasks** (tests first):
   - Schema tests: Validation rules (name, daily stints, stint duration)
   - Schema updates: Verify/extend `app/schemas/projects.ts` (if needed)

3. **Composable Layer Tasks** (tests first):
   - Composable tests: Optimistic updates, rollback, reorder logic
   - Composable implementation: Extend `app/composables/useProjectMutations.ts` with reorder, duplicate check

4. **Component Layer Tasks** (tests first):
   - Component tests: ProjectCreateModal, ProjectEditModal, ProjectDeleteConfirm, ProjectForm, ProjectListItem
   - Component implementation: Vue components with Nuxt UI integration
   - Drag-and-drop integration: VueUse useSortable implementation

5. **Integration Tasks**:
   - Dashboard integration: Update `app/pages/dashboard/index.vue` to use new modals
   - State management: Connect modals to composables
   - Error handling: Transform errors to user-friendly messages

6. **Validation Tasks**:
   - Run quickstart scenarios (manual)
   - Performance validation (bundle size, load time)
   - Accessibility checks
   - End-to-end flow testing

**Ordering Strategy**:
- **TDD order**: Tests before implementation (red-green-refactor)
- **Layer order**: Database → Schema → Composable → Component (bottom-up)
- **Dependency order**: Core functions before UI, reusable components before page integration
- **Parallel markers**: [P] for tasks that can run in parallel (e.g., multiple component tests)

**Estimated Task Breakdown**:
- Database layer: 5 tasks (1 migration, 2 test files, 2 function implementations)
- Schema layer: 2 tasks (1 test, 1 validation)
- Composable layer: 3 tasks (1 test, 2 implementations)
- Component layer: 10 tasks (5 test files, 5 component implementations)
- Integration: 3 tasks (dashboard update, state wiring, error handling)
- Validation: 4 tasks (quickstart, performance, a11y, e2e)

**Total Estimated Tasks**: 27 tasks

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none)

---
*Based on Constitution v1.0.0 - See `.specify/memory/constitution.md`*
