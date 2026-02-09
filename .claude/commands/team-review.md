---
description: "Team-based PR review with parallel specialized agents"
argument-hint: "[review-aspects]"
---

# Team-Based PR Review

Run a comprehensive pull request review using a **team of specialized agents** working in parallel, coordinated via a shared task list and message passing.

**Review Aspects (optional):** "$ARGUMENTS"

## Workflow

### Step 1 — Determine Scope

Parse arguments to identify requested review aspects:

- **comments** — Code comment accuracy and maintainability
- **tests** — Test coverage quality and completeness
- **errors** — Error handling and silent failures
- **types** — Type design and invariants
- **code** — General code review for project guidelines
- **simplify** — Code simplification for clarity
- **all** — Run all applicable reviews (default when no arguments)

Then identify changed files:

1. Run `git diff --name-only main` to get the list of changed files
2. Optionally run `gh pr view --json title,body,number` for PR metadata
3. Store the file list and base branch (`main`) for injection into teammate prompts

### Step 2 — Determine Applicable Reviews

Based on changed files and requested aspects:

- **code**: Always applicable
- **tests**: If `.test.ts` or `.spec.ts` files are in the diff
- **comments**: If significant doc/comment changes are present
- **errors**: If try/catch blocks, error handling, or fallback logic appears in changed files
- **types**: If new types, interfaces, or schemas are added/modified
- **simplify**: Always applicable

When `all` is requested (or no arguments), include all 6 aspects. When specific aspects are listed, filter to only those.

### Step 3 — Create Team

Create the review team:

```
TeamCreate with team_name: "pr-review"
```

### Step 4 — Create Tasks

For **each applicable review aspect**, create a task using `TaskCreate`. Then immediately pre-assign ownership using `TaskUpdate` with `owner` set to the teammate name from the mapping below.

**Task subject format:** `{Aspect Name} Review`
**Task activeForm format:** `Running {aspect} review`

**Task description template** (populate per aspect):

```
## Review Scope

Base branch: main
Changed files:
{paste the file list from Step 1}

## Assignment

Perform a {aspect_name} review of the changes listed above.

## Output Format

Structure your findings using these severity levels:

### Critical (must fix before merge)
- [file:line] Description of issue

### Important (should fix)
- [file:line] Description of issue

### Suggestions (nice to have)
- [file:line] Description

### Strengths (positive observations)
- Description of what's done well

If no issues found in a category, omit that section.
```

### Step 5 — Spawn Teammates

Spawn ALL applicable teammates in a **single message** using parallel `Task` tool calls for true concurrency. Each call uses the `team_name` parameter set to `"pr-review"`.

**Teammate mapping:**

| Aspect | `subagent_type` | `name` |
|--------|-----------------|--------|
| code | `pr-review-toolkit:code-reviewer` | `code-reviewer` |
| errors | `pr-review-toolkit:silent-failure-hunter` | `error-hunter` |
| tests | `pr-review-toolkit:pr-test-analyzer` | `test-analyzer` |
| comments | `pr-review-toolkit:comment-analyzer` | `comment-analyzer` |
| types | `pr-review-toolkit:type-design-analyzer` | `type-analyzer` |
| simplify | `pr-review-toolkit:code-simplifier` | `code-simplifier` |

**Teammate prompt template** (populate per aspect):

```
You are part of a PR review team. Your name is "{name}".

## Context

You are reviewing changes on the current branch against base branch "main".

Changed files:
{paste file list}

## Instructions

1. Check TaskList and find the task assigned to you (owner: "{name}")
2. Mark your task as in_progress via TaskUpdate
3. Run `git diff main` to see the full diff, and use Read to examine individual changed files
4. Perform your specialized review following your expertise
5. Structure findings using severity levels: Critical, Important, Suggestions, Strengths
6. Mark your task as completed via TaskUpdate
7. Send your complete findings to the team lead:
   - SendMessage with type: "message", recipient: "team-lead"
   - content: Your full structured review (use the severity sections)
   - summary: "{Aspect} review complete - N issues found"

Focus only on the changed files. Be thorough but filter aggressively — report only issues that truly matter.
```

### Step 6 — Delegate Mode Handoff

After ALL teammates are spawned, tell the user:

> All {N} reviewers are now running in parallel. You can safely switch to **delegate mode** now. I'll coordinate the team and aggregate results when they finish.

Wait for teammate messages to arrive. Messages are delivered automatically.

### Step 7 — Aggregate Results

Once all teammates have sent their results (track via TaskList — all tasks should show `completed`):

1. Parse each message for findings organized by severity
2. Prefix each finding with the reviewer name: `[code-reviewer]`, `[error-hunter]`, etc.
3. Deduplicate findings referencing the same file:line with similar descriptions
4. Count totals per severity level

**Output format:**

```markdown
# Team Review Summary

## Reviewers

| Reviewer | Status | Findings |
|----------|--------|----------|
| code-reviewer | Completed | N issues |
| error-hunter | Completed | N issues |
| ... | ... | ... |

## Critical Issues (N found)
- [reviewer-name] Description [file:line]

## Important Issues (N found)
- [reviewer-name] Description [file:line]

## Suggestions (N found)
- [reviewer-name] Description [file:line]

## Strengths
- [reviewer-name] Positive observation

## Recommended Action
1. Fix critical issues first
2. Address important issues
3. Consider suggestions
4. Re-run review after fixes
```

If any tasks did not complete, note them in the Reviewers table with status "Incomplete" and include a note about missing coverage.

### Step 8 — Cleanup

1. Send `shutdown_request` via SendMessage to each teammate
2. After confirmations arrive, call `TeamDelete` to clean up team and task directories

## Usage Examples

**Full review (default):**
```
/team-review
```

**Specific aspects:**
```
/team-review code errors
/team-review tests types
/team-review simplify
```

## Notes

- Each teammate reuses the specialized expertise from the `pr-review-toolkit` plugin agents
- The team lead acts as coordinator — it does NOT perform reviews itself
- Teammates run truly in parallel, unlike the sequential default of `/review-pr`
- The delegate mode handoff at Step 6 is critical — it lets the user lock the coordinator to coordination-only work
