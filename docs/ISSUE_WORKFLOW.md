# GitHub Issues Workflow

**Purpose:** A lightweight issue tracking system for solo developers and small teams (2-4 people) that maximizes value while minimizing overhead.

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
| `bug` | Broken functionality | ❌ No — use Bug issue type |
| `enhancement` | New features | ❌ No — use Feature issue type |
| `good first issue` | Onboarding newcomers | ❌ No — not for teams < 5 |
| `help wanted` | Asking for help | ❌ No — just ask directly |
| `priority-high/low` | Urgency levels | ❌ No — you know what's urgent |
| `next` | What you're working on | ❌ No — you already know |

**Recommended set:** `blocked`, `docs-sync-required` — that's it

### 4. Skip Milestones (For Small Teams)

Milestones add overhead without value when:
- Team is ≤ 4 people
- You have a roadmap document
- Everyone knows what phase you're in

Use milestones when:
- Multiple teams need to coordinate
- External stakeholders need progress visibility
- You're doing formal sprint planning

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

Use GitHub's issue types (not labels) for categorization:

| Type | When to Use | Example |
|------|-------------|---------|
| **Bug** | Something is broken | "Race condition in auto-completion causes console errors" |
| **Feature** | New functionality | "Allow unlimited paused stints per user" |
| **Task** | Technical work, refactors, maintenance | "Refactor Result<T> error handling pattern" |

Setting issue types via CLI:
```bash
gh api repos/{owner}/{repo}/issues/{number} -X PATCH -f type="Bug"
```

---

## Workflow

### Daily Flow (Solo or Pair Programming)

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

### When Work Gets Blocked

1. Add `blocked` label
2. Comment explaining what you're waiting on
3. Move to something else
4. Check blocked issues weekly

### Zombie Review (Monthly)

Zombie issues are open issues that haven't progressed in 30+ days. They clutter your backlog and create false sense of "planned work."

**Schedule:** First Monday of each month, 15 minutes max.

**The Review:**

```bash
# Find zombies: open issues with no activity in 30 days
gh issue list --state open --json number,title,updatedAt \
  --jq '.[] | select(.updatedAt < (now - 2592000 | todate)) | "#\(.number) \(.title)"'
```

**For each zombie, pick ONE action:**

| Action | When | How |
|--------|------|-----|
| **Close** | Won't do, no longer relevant, or duplicated elsewhere | `gh issue close {N} -c "Closing: no longer relevant"` |
| **Rescope** | Still valuable but too big/vague | Edit to make it concrete and achievable |
| **Unblock** | Waiting on something that's now resolved | Remove blocker, add next step as comment |
| **Defer** | Valid but not now | Close with `gh issue close {N} -c "Deferring to post-MVP"` — reopen if it becomes relevant |

**Rules:**
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

**Fix:** Review open issues monthly. Close or re-scope anything stale.

---

## For Teams > 2 People

When you grow beyond solo/pair, add these incrementally:

### Add When Team = 3-4:
- **Assignees:** Who owns each issue
- **Weekly sync:** 15-min review of blocked items

### Add When Team = 5+:
- **Milestones:** For coordinating across sub-teams
- **Project boards:** Visual workflow (Kanban)
- **Issue templates:** Consistent format

### Add When External Stakeholders:
- **Labels for visibility:** `stakeholder-visible`, `release-blocker`
- **Milestones:** For deadline tracking

---

## Quick Reference

### Essential Commands

```bash
# List open issues
gh issue list

# View specific issue
gh issue view 42

# Create issue with type
gh api repos/{owner}/{repo}/issues -X POST \
  -f title="Title" \
  -f body="Description" \
  -f type="Bug"

# Add label
gh issue edit 42 --add-label "blocked"

# Close with comment
gh issue close 42 --comment "Resolved in PR #45"

# List by label
gh issue list --label "blocked"
```

### Checklist Syntax (in issue body)

```markdown
- [ ] Uncompleted task
- [x] Completed task
```

GitHub tracks completion percentage automatically.

### Linking PRs to Issues

In PR description:
```
Closes #42
Fixes #42
Resolves #42
```

All three work identically — issue auto-closes when PR merges.

---

## Related Documents

- [.claude/GITHUB.md](../.claude/GITHUB.md) — CLI commands and API reference
- [docs/07-development-roadmap.md](./07-development-roadmap.md) — Phase strategy and dependencies

---

**Version:** 1.0
**Last Updated:** January 2026
**Tested With:** Solo developer + AI pair programming
