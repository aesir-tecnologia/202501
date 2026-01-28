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

1. **Valid fix needed** → Fix the code, then resolve the thread
2. **Incorrect feedback** → Reply with explanation, then resolve
3. **Needs discussion** → Present to user with your analysis

**AI Reviewer Verification Process:**
- If suggestion references an API/method, verify it exists in the codebase or docs
- If suggestion contradicts existing working code, flag as likely incorrect
- Cross-reference with actual implementation before accepting

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

**Step 4**: Analyzes comments:
- 2 comments about terminology inconsistency → Valid, fix needed
- 2 comments claiming API doesn't exist → Incorrect (API does exist)

**Step 5**: Outputs structured review with recommendations

---

Now execute this workflow. PR number hint: $ARGUMENTS
