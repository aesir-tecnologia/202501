# GitHub Issues Workflow

**Purpose:** A lightweight issue tracking system for solo developers that maximizes value while minimizing overhead.

**Philosophy:** Issues exist to track work, not to create work. If maintaining your issue tracker takes more than 5 minutes per week, you're doing it wrong.

---

## Core Principles

### 1. Issues Track Work, Roadmaps Track Strategy

| Document | Purpose | Updates |
|----------|---------|---------|
| **Roadmap** | Phase overview, dependencies, decision context, historical record | When strategy changes |
| **Issues** | Actionable work items, bugs, decisions to make | As work happens |

**Don't** duplicate information. If your roadmap says "Phase 5: Dashboard Polish" with 8 sub-items, you don't need 8 issues. Create one issue with a checklist.

**Don't** track completion status in both places. Issues close when done — that's your status.

### 2. Right-Size Your Issues

Issues should represent a logical chunk of work, not atomic tasks.

**Too granular:**
```
#38: Add empty state for 'no stints today'
#39: Add empty state for 'all projects inactive'
#40: Add network offline banner
```

**Right-sized:**
```
#38: Dashboard polish - empty states & error handling

- [ ] No stints today motivational message
- [ ] All projects inactive reminder
- [ ] Network offline banner
- [ ] Server error retry button
```

Benefits:
- Fewer issues to manage
- Related work stays together
- Checklist progress visible in the issue
- One PR can close the whole thing

### 3. Minimal Labels

Labels should only exist for states that cross-cut issue types. Categorization (bug vs feature) is handled by issue types, not labels.

| Label | Purpose | Worth it? |
|-------|---------|-----------|
| `blocked` | Can't proceed, waiting on something | ✅ Yes — surfaces stuck work |
| `docs-sync-required` | Docs need updating when resolved | ✅ Yes — prevents drift |
| `stale` | Auto-applied by zombie detection workflow | ✅ Yes — managed by automation |
| `pinned` | Exempt from stale detection | ✅ Yes — protects long-term issues |
| `bug` | Broken functionality | ❌ No — use Bug issue type |
| `enhancement` | New features | ❌ No — use Feature issue type |
| `help wanted` | Asking for help | ❌ No — just ask directly |
| `priority-high/low` | Urgency levels | ❌ No — you know what's urgent |
| `next` | What you're working on | ❌ No — you already know |

**Recommended set:** `blocked`, `docs-sync-required`, `stale`, `pinned`

Note: `stale` is managed automatically — you don't apply it manually.

### 4. Skip Milestones

Milestones add overhead without value when you have a roadmap document and already know what phase you're in. Your roadmap is your milestone.

### 5. Issues Are Not Tasks

Create issues for work worth tracking. Not every to-do needs an issue.

**Create issues for:**
- Bugs that need investigation
- Features requiring design decisions
- Work spanning multiple sessions
- Things you might forget
- Discussions needing resolution

**Don't create issues for:**
- Sub-tasks (use checklists instead)
- Work you'll do in the next hour
- Future phases you won't touch for months
- Things already completed

---

## Issue Types

GitHub Issue Types is a feature (public preview as of January 2025) that allows classifying issues beyond labels. Issue types are defined at the **organization level** and shared across all repositories.

### Available Types

| Type | ID | When to Use | Example |
|------|-----|-------------|---------|
| **Task** | 14889028 | Technical work, refactors, maintenance | "Refactor Result<T> error handling pattern" |
| **Bug** | 14889031 | Something is broken | "Race condition in auto-completion causes console errors" |
| **Feature** | 14889034 | New functionality | "Allow unlimited paused stints per user" |

### Setting Issue Types via CLI

The `gh` CLI does not yet support issue types natively ([cli/cli#12110](https://github.com/cli/cli/issues/12110)). Use the REST API:

```bash
# Set issue type (use type NAME, not ID)
gh api repos/aesir-tecnologia/202501/issues/{NUMBER} -X PATCH -f type="Bug"
gh api repos/aesir-tecnologia/202501/issues/{NUMBER} -X PATCH -f type="Feature"
gh api repos/aesir-tecnologia/202501/issues/{NUMBER} -X PATCH -f type="Task"

# Remove issue type
gh api repos/aesir-tecnologia/202501/issues/{NUMBER} -X PATCH --null type

# Create issue with type in one API call
gh api repos/aesir-tecnologia/202501/issues -X POST \
  -f title="Issue title" \
  -f body="Issue description" \
  -f type="Bug"

# View issue type
gh api repos/aesir-tecnologia/202501/issues/{NUMBER} --jq '.type.name // "none"'

# List all issue types for the organization
gh api orgs/aesir-tecnologia/issue-types --jq '.[] | "\(.id): \(.name) - \(.description)"'
```

---

## Issue Templates

GitHub Issue Templates (`.github/ISSUE_TEMPLATE/*.yml`) provide structured forms for creating consistent, well-documented issues. This repository uses YAML-based templates with form fields.

### Available Templates

| Template | File | Auto-Labels | When to Use |
|----------|------|-------------|-------------|
| **Bug Report** | `bug.yml` | — | Something is broken or not working as expected |
| **Feature Request** | `feature.yml` | — | New functionality or enhancement |
| **Task** | `task.yml` | — | Technical work, refactors, maintenance, infrastructure |
| **Documentation Gap** | `documentation-gap.yml` | `docs-sync-required` | Mismatch between docs and implementation |

### Template Structure

All templates follow a consistent structure aligned with the "Creating Good Issues" guidelines:

```yaml
name: Template Name
description: Brief description shown in template picker
title: "[Prefix] "  # Optional title prefix
labels: []          # Auto-applied labels
body:
  - type: textarea
    id: problem
    attributes:
      label: Problem
      description: What needs to be solved?
    validations:
      required: true
  # ... additional fields
```

### Common Fields Across Templates

| Field | Purpose | Required |
|-------|---------|----------|
| **Problem** | What's broken/missing/needed (the "why") | ✅ Yes |
| **Acceptance Criteria** | How we know it's done (checkboxes) | No |
| **Approach** | Implementation plan or "TBD" | No |
| **Tasks** | Sub-tasks with checkboxes for tracking | No |
| **Notes** | Links, constraints, context | No |

### Documentation Gap Template

The **Documentation Gap** template deserves special mention. It's designed for doc/code mismatches and includes:

- **Source Document** — Which doc file has the discrepancy
- **Specific Item** — Section, phase, or task affected
- **Gap Type** — Dropdown with common mismatch scenarios
- **Current State** — What docs say
- **Actual State** — What code does
- **Suggested Fix** — Proposed documentation update

This template auto-applies `docs-sync-required` label, ensuring the doc update isn't forgotten when the issue closes.

### Configuration

The `config.yml` file controls template behavior:

```yaml
blank_issues_enabled: true   # Allow freeform issues without template
contact_links: []            # External links (discussions, docs, etc.)
```

Setting `blank_issues_enabled: false` forces all issues through templates — useful for enforcing structure in larger teams.

---

## Branch Naming

Branches should be named to clearly identify the associated issue and work type. This enables traceability between branches, PRs, and issues.

### Convention

```
issue/{NUMBER}-{short-description}
```

**Examples:**
```
issue/42-dashboard-empty-states
issue/15-auth-session-expiry
issue/7-refactor-error-handling
```

### Rules

1. **Always include issue number** — Links branch to its tracking issue
2. **Use lowercase** — Consistent, avoids case-sensitivity issues across systems
3. **Use hyphens** — Not underscores or camelCase (`empty-states` not `empty_states`)
4. **Keep it short** — Enough to identify the work, not the full issue title
5. **No special characters** — Stick to alphanumeric and hyphens

### Why `issue/` Prefix?

A single prefix keeps things simple:

| Alternative | Problem |
|-------------|---------|
| `feat/`, `fix/`, `chore/` | Duplicates issue type information, adds cognitive load |
| `{NUMBER}-description` | No namespace, harder to filter in git tooling |
| `{username}/feature` | Irrelevant for solo development |

The issue itself already classifies work as Bug, Feature, or Task. The branch just needs to point back to it.

### Quick Commands

```bash
# Create branch from issue number
git checkout -b issue/42-dashboard-polish

# List all issue branches
git branch --list 'issue/*'

# Find branch for an issue
git branch --list 'issue/42-*'
```

---

## Workflow

### Daily Flow

```
1. Check open issues (gh issue list)
2. Pick what to work on based on priority/interest
3. Work on it, checking off sub-tasks as you go
4. Close issue when done (PR with "Closes #XX" or manual close)
5. If docs need updating, the label reminds you
```

That's it. No ceremonies, no standups, no velocity tracking.

### Creating Good Issues

**Title:** Clear, actionable, starts with what/where

```
✅ "Dashboard: Add empty states for no-data scenarios"
✅ "Auth: Handle expired sessions gracefully"
❌ "Fix the thing"
❌ "Improvements"
```

**Body:** Context for future-you

```markdown
## Problem
[What's broken or missing, with context]

## Approach
[How you plan to solve it, or "TBD" if undecided]

## Acceptance Criteria
- [ ] Criterion 1: [Specific, testable condition]
- [ ] Criterion 2: [Another verifiable outcome]

## Tasks
- [ ] Sub-task 1
- [ ] Sub-task 2
- [ ] Update docs if needed

## Notes
[Relevant links, prior discussion, constraints]
```

### Closing Issues

Issues close in two ways:

1. **Via PR:** Include `Closes #XX` or `Fixes #XX` in PR description
2. **Manual:** If resolved without code (decided not to do, duplicate, etc.)

Before closing, check:
- [ ] If `docs-sync-required` label exists, update the docs
- [ ] All checklist items completed or explicitly deferred

### Documentation-Sourced Issues

When creating an issue from a documentation gap or discrepancy (e.g., roadmap says "not implemented" but feature exists, or vice versa):

1. **Reference the source** — Include document path and specific item
   ```
   Source: docs/07-development-roadmap.md, Phase 5, Task 3
   ```

2. **Flag for doc update** — Add to issue body:
   ```
   ⚠️ Documentation update required: Update [document] when this issue is resolved.
   ```

3. **Apply label** — Add `docs-sync-required` label

4. **Close the loop** — When resolving the issue, update the referenced documentation as part of the PR. The issue isn't complete until docs are synced.

**Why this matters:** GitHub auto-closes issues on PR merge, but the documentation update can be forgotten. This workflow ensures docs stay accurate.

### When Work Gets Blocked

1. Add `blocked` label
2. Comment explaining what you're waiting on
3. Move to something else
4. Check blocked issues weekly

### Zombie Issue Management

Zombie issues are open issues that haven't progressed in 30+ days. They clutter your backlog and create a false sense of "planned work."

#### Automated Detection

A GitHub Actions workflow (`.github/workflows/stale.yml`) automatically manages zombie issues:

| Day | What Happens |
|-----|--------------|
| **Day 30** | Issue labeled `stale`, comment posted with triage options |
| **Day 44** | Issue auto-closed if no activity |

**Exempt labels:** Issues with `blocked` or `pinned` labels are never marked stale.

**Schedule:** Runs every Monday at 9am UTC. Can also be triggered manually via Actions tab.

**To prevent auto-close:**
- Comment on the issue (any activity resets the timer)
- Add the `blocked` label if waiting on something external
- Close it yourself if no longer relevant

#### Manual Review (Optional)

If you prefer a hands-on review, use this command to find stale issues:

```bash
# Find issues with no activity in 30 days
gh issue list --state open --json number,title,updatedAt \
  --jq '.[] | select(.updatedAt < (now - 2592000 | todate)) | "#\(.number) \(.title)"'

# Find issues labeled stale (pending auto-close)
gh issue list --label "stale"
```

#### Triage Actions

| Action | When | How |
|--------|------|-----|
| **Close** | Won't do, no longer relevant | `gh issue close {N} -c "Closing: no longer relevant"` |
| **Rescope** | Still valuable but too big/vague | Edit to make it concrete and achievable |
| **Unblock** | Waiting on something now resolved | Remove blocker, comment with next step |
| **Defer** | Valid but not now | Close with `gh issue close {N} -c "Deferring to post-MVP"` |

#### Guiding Principles

- Don't keep issues open "just in case" — closed issues are searchable
- If you've deferred something 3 times, it's not happening. Close it.
- An issue without a clear next action is not an issue, it's a wish

**Quick triage questions:**
1. "Would I mass-close this if I had 100 issues?" → Close it
2. "If this disappeared, would I recreate it?" → No? Close it
3. "Can I describe the next concrete step?" → No? Rescope or close

---

## Anti-Patterns

### Issue Inflation
Creating issues for everything "just in case." Result: 50+ issues, none actionable.

**Fix:** If you haven't touched an issue in 3 months, close it. If it matters, you'll remember.

### Label Obsession
Spending time categorizing issues with 8 different labels.

**Fix:** 4 labels max. If you're debating which label applies, the labels aren't useful.

### Roadmap Duplication
Maintaining identical status in roadmap doc AND issues.

**Fix:** Pick one. Issues for current work, roadmap for strategy. Don't sync between them.

### Future Issue Hoarding
Creating issues for Phase 10 when you're in Phase 5.

**Fix:** Create issues when work becomes imminent. Future plans belong in the roadmap doc.

### Zombie Issues
Issues that sit open forever, never progressing.

**Fix:** Automated — the stale workflow marks inactive issues and auto-closes after 44 days. Use `pinned` label for intentional long-term issues.

---

## CLI & API Reference

### Issue Operations

```bash
# List open issues
gh issue list

# Filter by label
gh issue list --label "blocked"

# Filter by assignee
gh issue list --assignee "@me"

# Include closed issues
gh issue list --state all

# JSON output for scripting
gh issue list --json number,title,state,labels

# View specific issue
gh issue view 42

# View multiple issues with types
gh api repos/aesir-tecnologia/202501/issues --jq '.[] | "#\(.number) [\(.type.name // "no type")] \(.title)"'
```

#### Creating Issues

```bash
# Basic issue creation (then set type separately)
gh issue create --title "Title" --body "Description"

# With labels and assignee
gh issue create --title "Title" --body "Description" --label "bug" --assignee "@me"

# From a file
gh issue create --title "Title" --body-file issue-body.md

# Create with type via API
gh api repos/aesir-tecnologia/202501/issues -X POST \
  -f title="Title" \
  -f body="Description" \
  -f type="Bug"
```

#### Editing Issues

```bash
# Edit title/body
gh issue edit {NUMBER} --title "New title" --body "New body"

# Add/remove labels
gh issue edit {NUMBER} --add-label "priority:high" --remove-label "needs-triage"

# Assign
gh issue edit {NUMBER} --add-assignee "@me"

# Close with comment
gh issue close 42 --comment "Resolved in PR #45"
```

### Pull Request Operations

#### Creating PRs

```bash
# Interactive PR creation
gh pr create

# With title and body
gh pr create --title "PR Title" --body "Description"

# Draft PR
gh pr create --draft --title "WIP: Feature"

# With reviewers
gh pr create --title "Feature" --reviewer "username"
```

#### Viewing PR Details

```bash
# View PR in terminal
gh pr view {NUMBER}

# View PR diff
gh pr diff {NUMBER}

# View PR checks status
gh pr checks {NUMBER}

# View PR comments
gh api repos/aesir-tecnologia/202501/pulls/{NUMBER}/comments
```

#### PR Review

```bash
# Approve
gh pr review {NUMBER} --approve

# Request changes
gh pr review {NUMBER} --request-changes --body "Please fix X"

# Comment
gh pr review {NUMBER} --comment --body "Looks good overall"
```

### GitHub API Tips

#### Authentication

The `gh` CLI handles authentication automatically. For API calls:

```bash
# Check current auth status
gh auth status

# Refresh auth with additional scopes
gh auth refresh -s project
```

#### Common API Patterns

```bash
# GET request (default)
gh api repos/aesir-tecnologia/202501/issues

# POST request
gh api repos/aesir-tecnologia/202501/issues -X POST -f title="New issue"

# PATCH request
gh api repos/aesir-tecnologia/202501/issues/1 -X PATCH -f state="closed"

# DELETE request
gh api repos/aesir-tecnologia/202501/issues/1/labels/bug -X DELETE

# With jq filtering
gh api repos/aesir-tecnologia/202501/issues --jq '.[].title'

# Paginated results (get all)
gh api repos/aesir-tecnologia/202501/issues --paginate
```

#### Useful API Endpoints

```bash
# Repository info
gh api repos/aesir-tecnologia/202501

# List collaborators
gh api repos/aesir-tecnologia/202501/collaborators

# List branches
gh api repos/aesir-tecnologia/202501/branches

# List releases
gh api repos/aesir-tecnologia/202501/releases

# Get specific commit
gh api repos/aesir-tecnologia/202501/commits/{SHA}
```

### Quick Reference

#### Checklist Syntax (in issue body)

```markdown
- [ ] Uncompleted task
- [x] Completed task
```

GitHub tracks completion percentage automatically.

#### Linking PRs to Issues

In PR description:
```
Closes #42
Fixes #42
Resolves #42
```

All three work identically — issue auto-closes when PR merges.

---

## References

### Official Documentation
- [GitHub CLI Manual](https://cli.github.com/manual/)
- [GitHub REST API](https://docs.github.com/en/rest)
- [GitHub Issue Types](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/managing-issue-types-in-an-organization)

### Feature Requests & Known Limitations
- [cli/cli#12110](https://github.com/cli/cli/issues/12110) - Request: `gh issue create --type`
- [cli/cli#9696](https://github.com/cli/cli/issues/9696) - Add support for issue types in gh CLI

### Changelog
- [Evolving GitHub Issues (Jan 2025)](https://github.blog/changelog/2025-01-13-evolving-github-issues-public-preview/) - Issue Types public preview announcement

---

**Version:** 2.2
**Last Updated:** January 2026
**Tested With:** Solo developer + AI pair programming
