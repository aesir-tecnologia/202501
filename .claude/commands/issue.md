---
description: Create a GitHub issue following the project's issue workflow (proper type, structure, and body format)
---

## User Input

```text
$ARGUMENTS
```

## Issue Workflow Reference

This command creates issues following the workflow defined in `docs/ISSUE_WORKFLOW.md`.

## Instructions

### 1. Parse User Input

If user provided arguments, extract:
- Issue description/title
- Any mentioned type (bug, feature, task)
- Any specific details about the problem

If no arguments or insufficient detail, ask the user for:
- What needs to be done (the problem)
- Issue type preference (or infer from context)

### 2. Determine Issue Type

| Type | When to Use |
|------|-------------|
| **Task** | Technical work, refactors, maintenance, infrastructure |
| **Bug** | Something is broken or not working as expected |
| **Feature** | New functionality or enhancement |

Infer from context if not explicitly stated:
- "fix", "broken", "error", "not working" → Bug
- "add", "implement", "new", "create feature" → Feature
- "refactor", "update", "remove", "clean up", "improve" → Task

### 3. Craft Issue Title

Follow the convention: `{Area}: {Clear, actionable description}`

Examples:
- ✅ "Dashboard: Add empty states for no-data scenarios"
- ✅ "Auth: Handle expired sessions gracefully"
- ❌ "Fix the thing"
- ❌ "Improvements"

### 4. Craft Issue Body

Use this exact structure:

```markdown
## Problem

[What's broken, missing, or needs improvement - the "why"]

## Approach

[How to solve it, or "TBD" if undecided]

## Acceptance Criteria

- [ ] Criterion 1: [Specific, testable condition]
- [ ] Criterion 2: [Another verifiable outcome]

## Tasks

- [ ] Sub-task 1
- [ ] Sub-task 2

## Notes

[Relevant links, constraints, context - or omit if none]
```

**Guidelines:**
- Keep Problem concise but with enough context
- Approach can be "TBD" if implementation is unclear
- Acceptance criteria must be testable/verifiable
- Tasks should be checkboxes for tracking
- Omit Notes section if nothing relevant

### 5. Create Issue via API

**IMPORTANT**: Use the GitHub API (not `gh issue create`) to set the issue type:

```bash
gh api repos/aesir-tecnologia/202501/issues -X POST \
  -f title="Issue title" \
  -f body="Issue body with proper structure" \
  -f type="Task|Bug|Feature"
```

### 6. Report Result

After creating the issue, output:
- Issue URL
- Issue number
- Assigned type
- Brief confirmation

## Example Execution

**User input**: "remove success toasts from stint operations"

**Inferred type**: Task (cleanup/removal work)

**Generated title**: "Stints: Remove success toasts from stint operations"

**Generated body**:
```markdown
## Problem

Success toast notifications on stint operations create unnecessary UI noise. These are frequent actions where success feedback is already provided through timer state changes.

## Approach

Remove `toast.add()` calls with `color: 'success'` for stint start, pause, resume, and complete operations. Keep error toasts.

## Acceptance Criteria

- [ ] No success toast on stint start
- [ ] No success toast on stint pause
- [ ] No success toast on stint resume
- [ ] No success toast on stint complete
- [ ] Error toasts remain functional

## Tasks

- [ ] Identify toast calls in stint composables/components
- [ ] Remove success toasts for the four operations
- [ ] Verify error toasts still work
```

**API call**: `gh api ... -f type="Task"`

---

Now execute this workflow for: $ARGUMENTS
