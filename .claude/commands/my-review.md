---
description: Review PR with smart detection, parallel data gathering, and comment resolution
---

## User Input

```text
$ARGUMENTS
```

## Instructions

Review a pull request with automatic PR detection, parallel data gathering, and intelligent handling of review comments.

### 1. Determine PR Number

**If arguments provided**: Extract PR number from `$ARGUMENTS`
**If no arguments**: Detect PR for current branch

```bash
gh pr view --json number,url -q '.number'
```

If this fails with "no pull requests found", inform the user:
- No PR is associated with the current branch
- They can specify a PR number: `/my-review 73`
- Or list open PRs: `gh pr list`

**Stop here if no PR can be determined.**

### 2. Gather PR Context (Parallel)

Run these commands **in parallel** (single tool call with multiple commands):

```bash
gh pr view <number>           # PR title, body, metadata
gh pr diff <number>           # Full code diff
gh pr checks <number>         # CI status
```

### 3. Fetch Unresolved Review Comments

Query review threads using GraphQL:

```bash
gh api graphql -f query='
query {
  repository(owner: "<owner>", name: "<repo>") {
    pullRequest(number: <number>) {
      reviewThreads(first: 50) {
        nodes {
          id
          isResolved
          path
          line
          comments(first: 5) {
            nodes {
              author { login }
              body
              createdAt
            }
          }
        }
      }
    }
  }
}'
```

Extract **unresolved** threads (where `isResolved: false`).

### 4. Analyze and Address Review Comments

For each unresolved comment, categorize and handle:

| Author Type | Action |
|-------------|--------|
| **AI Reviewer** (Copilot, coderabbitai, etc.) | **Verify before accepting** - AI reviewers may have outdated API knowledge. Check actual code/docs. |
| **Human Reviewer** | Present feedback for user decision |

**For each unresolved comment, determine:**

1. **Valid fix needed** → Fix the code, add explanatory comment, then resolve the thread
2. **Incorrect feedback** → Reply with explanation, then resolve
3. **Needs discussion** → Present to user with your analysis

**AI Reviewer Verification Process:**
- If suggestion references an API/method, verify it exists in the codebase or docs
- If suggestion contradicts existing working code, flag as likely incorrect
- Cross-reference with actual implementation before accepting

#### Resolving Threads with Explanatory Comments

**IMPORTANT:** Always add an explanatory comment before resolving a thread. This creates an audit trail and helps future reviewers understand why feedback was addressed or dismissed.

**Step 1: Add explanatory comment to the thread**

```bash
gh api graphql -f query='
mutation {
  addPullRequestReviewThreadReply(input: {
    pullRequestReviewThreadId: "<thread_id>",
    body: "<explanation>"
  }) {
    comment { id }
  }
}'
```

**Step 2: Resolve the thread**

```bash
gh api graphql -f query='
mutation {
  resolveReviewThread(input: {
    threadId: "<thread_id>"
  }) {
    thread { isResolved }
  }
}'
```

**Comment Templates by Resolution Type:**

| Type | Prefix | When to Use |
|------|--------|-------------|
| **Fixed** | `✅ Fixed.` | Code was changed to address the feedback |
| **Deferred** | `📋 Deferred to Issue #N.` | Valid concern, but out of scope—create tracking issue first |
| **Already implemented** | `✅ Already implemented.` | The requested change already exists in the code |
| **Dismissed** | `🚫 Dismissed as <reason>.` | Feedback is incorrect, subjective, or not applicable |

**Creating Issues for Deferred Items:**

When deferring feedback to a new issue, follow the project's issue workflow (`.claude/commands/issue.md`):

1. **Determine type**: Task (refactor/cleanup), Bug (broken behavior), or Feature (new functionality)
2. **Craft title**: `{Area}: {Clear, actionable description}`
3. **Structure body**: Problem → Approach → Acceptance Criteria → Tasks
4. **Create via API** (to set issue type):
   ```bash
   gh api repos/aesir-tecnologia/202501/issues -X POST \
     -f title="Area: Description from review feedback" \
     -f body="## Problem\n\n[Context from review comment]\n\n## Approach\n\nTBD\n\n## Acceptance Criteria\n\n- [ ] [Criteria based on feedback]" \
     -f type="Task|Bug|Feature"
   ```
5. **Reference issue number** in the thread reply comment

**Examples:**

```
✅ Fixed. Added validation to complete_stint() that ensures p_attributed_date
is either the start date or end date of the stint (calculated in user's timezone).
Invalid dates now raise an exception.
```

```
📋 Deferred to Issue #77. Valid security concern about cross-tenant data exposure.
This requires careful consideration of the authorization check placement and impact
on cron jobs. Created a separate high-priority issue.
```

```
✅ Already implemented. The midnight detection integration was already added to
ProjectList.vue (lines 154-175 for computed properties, lines 650-660 for modal props).
Resolving.
```

```
🚫 Dismissed as subjective UX preference. The "Always" prefix provides clarity
that this is a persistent setting, not a one-time choice. The current wording
is intentional.
```

### 5. Present Review

Output a structured review:

#### PR Overview
- Title and purpose (1-2 sentences)

#### CI Status

| Check | Status |
|-------|--------|
| Lint | ✅/❌ |
| Type Check | ✅/❌ |
| Tests | ✅/❌ |
| Deploy Preview | ✅/❌/⏳ |

#### Code Analysis
- Overview of changes
- Code quality observations
- Potential issues or risks
- Suggestions for improvement

#### Review Comments Status

| File | Line | Author | Status | Recommendation |
|------|------|--------|--------|----------------|
| path/to/file.ts | 42 | Copilot | ❌ Unresolved | [Your recommendation] |

**For each unresolved comment:**
- Quote the feedback
- Provide your analysis (valid/incorrect/needs discussion)
- If incorrect: Explain why
- If valid: Describe the fix needed

#### Action Items
- [ ] List of recommended actions
- [ ] Fixes to apply
- [ ] Comments to resolve

## Example Execution

**User runs**: `/my-review`

**Step 1**: Detects PR #73 for current branch

**Step 2**: Parallel fetch returns:
- PR: "feat(logging): add consola-based logging abstraction"
- Diff: 146 additions, 31 deletions
- Checks: All passing

**Step 3**: Finds 4 unresolved comments from Copilot

**Step 4**: Analyzes and resolves comments:
- 2 comments about terminology inconsistency → Valid, fix applied
  - Adds comment: `✅ Fixed. Updated references from "integration" to "reporter" to match consola's actual API terminology.`
  - Resolves thread
- 1 comment about missing error handling → Already exists
  - Adds comment: `✅ Already implemented. Error handling exists in the parent try-catch at logger.ts:45-52.`
  - Resolves thread
- 1 comment claiming API doesn't exist → Incorrect (verified in docs)
  - Adds comment: `🚫 Dismissed as incorrect. The createConsolaReporter() API exists - verified in consola v3 documentation and our codebase.`
  - Resolves thread

**Step 5**: Outputs structured review with recommendations

---

Now execute this workflow. PR number hint: $ARGUMENTS
