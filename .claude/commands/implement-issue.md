---
description: Fetch a GitHub issue by number, analyze requirements, ask clarifying questions, and create an implementation plan following project guidelines
---

## User Input

```text
$ARGUMENTS
```

## Overview

This command fetches a GitHub issue, analyzes its requirements against the current codebase, asks clarifying questions when needed, and produces a detailed implementation plan including branch creation and testing strategy.

## Instructions

### 1. Parse Input & Fetch Issue

Extract the issue number from user input. If no number provided, ask for it.

```bash
# Fetch issue details
gh issue view {NUMBER} --json number,title,body,type,labels,state

# Also fetch comments for additional context
gh api repos/aesir-tecnologia/202501/issues/{NUMBER}/comments --jq '.[].body'
```

**Output summary:**
- Issue number and title
- Issue type (Bug/Feature/Task)
- Current state (open/closed)
- Labels (especially `blocked`, `docs-sync-required`)

If the issue is closed, warn the user and ask if they want to proceed anyway.

### 2. Analyze Issue Requirements

Parse the issue body following the standard structure:

| Section | Extract |
|---------|---------|
| **Problem** | The core problem to solve (the "why") |
| **Approach** | Proposed solution (may be "TBD") |
| **Acceptance Criteria** | Checklist of testable conditions |
| **Tasks** | Sub-tasks already identified |
| **Notes** | Constraints, links, context |

**Identify:**
1. **Scope boundaries** — What's explicitly in/out of scope
2. **Unknowns** — Areas marked "TBD" or lacking detail
3. **Dependencies** — External factors or blocked items
4. **Documentation flags** — If `docs-sync-required` label exists, note which docs need updating

### 3. Codebase Analysis

Based on the issue requirements, analyze relevant parts of the codebase:

#### For Feature/Enhancement:
- Search for existing related functionality
- Identify files that will need modification
- Check for existing patterns to follow
- Review related tests

#### For Bug:
- Locate the affected code paths
- Identify potential root cause locations
- Check for related error handling
- Find relevant test files

#### For Task/Refactor:
- Map the affected code surface area
- Identify dependencies on the code being changed
- Check for existing tests that verify current behavior

**Key areas to check (as relevant):**
- `app/lib/supabase/` — Database layer
- `app/schemas/` — Validation schemas
- `app/composables/` — TanStack Query hooks
- `app/components/` — UI components
- `app/pages/` — Route pages
- `docs/` — Documentation (if `docs-sync-required`)

### 4. Clarification Questions

If analysis reveals ambiguities, ask the user BEFORE creating the plan.

**Ask about:**
- Undefined acceptance criteria
- Approach choices when multiple valid options exist
- Scope boundaries that seem unclear
- Missing technical constraints
- Testing requirements beyond obvious cases

**Format questions clearly:**
```
Before I create the implementation plan, I need clarification on:

1. [Specific question about approach/scope]
2. [Question about edge case handling]
3. [Question about testing requirements]
```

**Do NOT ask about:**
- Things already clear in the issue
- Standard patterns documented in CLAUDE.md
- Obvious implementation details

### 5. Create Implementation Plan

Once requirements are clear, generate a structured plan.

#### 5.1 Branch Creation

Following project conventions from `docs/ISSUE_WORKFLOW.md`:

```bash
# Branch naming: issue/{NUMBER}-{short-description}
git checkout -b issue/{NUMBER}-{short-kebab-case-description}
```

**Examples:**
- Issue #42 "Dashboard: Add empty states" → `issue/42-dashboard-empty-states`
- Issue #15 "Fix timer drift on pause" → `issue/15-fix-timer-drift`

#### 5.2 Implementation Steps

Structure the plan following the project's data layer architecture:

```markdown
## Implementation Plan for #{NUMBER}: {Title}

### Branch
`issue/{NUMBER}-{description}`

### Phase 1: Database Layer (if applicable)
- [ ] Migration file: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
- [ ] Update `app/lib/supabase/{resource}.ts`
- [ ] Regenerate types: `npm run supabase:types`

### Phase 2: Schema Layer (if applicable)
- [ ] Update/create `app/schemas/{resource}.ts`
- [ ] Add validation rules per requirements
- [ ] Export TypeScript types

### Phase 3: Composable Layer (if applicable)
- [ ] Update/create `app/composables/use{Resource}.ts`
- [ ] Implement TanStack Query hooks
- [ ] Add optimistic updates with rollback

### Phase 4: Component Layer
- [ ] Create/update components in `app/components/`
- [ ] Update pages in `app/pages/` if needed
- [ ] Follow existing UI patterns (check Nuxt UI 4 docs)

### Phase 5: Testing
- [ ] Database layer tests: `app/lib/supabase/{resource}.test.ts`
- [ ] Schema tests: `app/schemas/{resource}.test.ts`
- [ ] Composable tests: `app/composables/use{Resource}.test.ts`
- [ ] Run full test suite: `npm run test:run`

### Phase 6: Documentation (if docs-sync-required)
- [ ] Update relevant docs in `docs/`
- [ ] Ensure changes match documentation

### Phase 7: Verification
- [ ] Lint: `npm run lint`
- [ ] Typecheck: `npx nuxt typecheck`
- [ ] Tests: `npm run test:run`
- [ ] Manual testing if UI changes

### Acceptance Criteria Verification
[Copy from issue with implementation notes]
```

#### 5.3 Testing Strategy

Based on issue type, define testing approach:

| Type | Testing Focus |
|------|---------------|
| **Feature** | New functionality tests, integration with existing features |
| **Bug** | Regression test for the bug, verify fix doesn't break related code |
| **Task** | Existing tests should still pass, add tests if behavior changes |

**Always include:**
- Unit tests for new functions
- Schema validation tests for new/changed schemas
- Integration tests for cross-layer changes
- Edge case coverage based on acceptance criteria

### 6. Report Plan

Present the complete plan to the user:

```markdown
## Issue #{NUMBER}: {Title}

**Type:** {Bug|Feature|Task}
**Branch:** `issue/{NUMBER}-{description}`

### Summary
[Brief description of what will be implemented]

### Files to Create/Modify
- `path/to/file1.ts` — Description of changes
- `path/to/file2.ts` — Description of changes

### Implementation Steps
[Numbered list of concrete steps]

### Testing Plan
[What will be tested and how]

### Documentation Updates
[If applicable]

### Estimated Complexity
[Low/Medium/High based on scope]
```

### 7. Await Approval

After presenting the plan, wait for user confirmation before proceeding.

**Ask:**
> Ready to start implementation? I'll begin by creating the branch and working through the plan.

If user wants changes to the plan, revise it. Do not start implementation without explicit approval.

---

## Example Execution

**User input:** `42`

**Fetched issue #42:** "Dashboard: Add motivational empty states"

**Analysis output:**
```
## Issue #42: Dashboard: Add motivational empty states

**Type:** Feature
**State:** Open
**Labels:** none

### Problem
Dashboard shows blank space when user has no stints today. Should show encouraging message.

### Acceptance Criteria
- [ ] Empty state shows when no stints for today
- [ ] Message is contextual (morning vs afternoon)
- [ ] Links to start first stint

### Unknowns Identified
- What messages should display? (Not specified)
- Should there be an illustration/icon?
```

**Clarification questions:**
```
Before creating the implementation plan, I need clarification:

1. What tone should the empty state messages have? (Playful, professional, minimal?)
2. Should different messages appear for morning vs afternoon vs evening?
3. Is an illustration/icon desired, or text-only?
```

**After clarification → Full implementation plan generated**

---

Now execute this workflow for issue: $ARGUMENTS
