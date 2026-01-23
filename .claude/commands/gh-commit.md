---
description: Run lint, typecheck, and tests, then commit changes if all pass
---

## User Input

```text
$ARGUMENTS
```

## Instructions

Execute the pre-commit verification workflow and create a commit if all checks pass.

### 1. Run All Checks

Execute these commands **sequentially** (each must pass before proceeding):

#### Step 1: Lint
```bash
npm run lint
```
If lint fails, stop and report the errors. Do NOT proceed to typecheck.

#### Step 2: Typecheck
```bash
npx nuxt typecheck
```
If typecheck fails, stop and report the errors. Do NOT proceed to tests.

#### Step 3: Tests
```bash
npm run test:run
```
If tests fail, stop and report which tests failed. Do NOT proceed to commit.

### 2. Check for Changes

After all checks pass, verify there are changes to commit:

```bash
git status
```

If no changes (working tree clean), inform the user and stop.

### 3. Analyze Changes

Review the staged and unstaged changes:

```bash
git diff --stat
git diff
```

Understand what was changed to write an appropriate commit message.

### 4. Create Commit

Follow the project's conventional commit style: `type(scope): description`

**Types:**
- `fix` - Bug fixes
- `feat` - New features
- `refactor` - Code restructuring without behavior change
- `test` - Adding or updating tests
- `docs` - Documentation changes
- `chore` - Maintenance tasks

**Commit message guidelines:**
- First line: `type(scope): short description` (max 72 chars)
- If needed, add blank line then longer explanation
- Use imperative mood ("add" not "added")

**If user provided arguments**, use them as guidance for the commit message.
**If no arguments**, infer the appropriate message from the changes.

```bash
git add -A
git commit -m "type(scope): description"
```

### 5. Report Results

Output a summary:

| Check | Status |
|-------|--------|
| Lint | ✅/❌ |
| Typecheck | ✅/❌ |
| Tests | ✅/❌ (X passed) |
| Commit | ✅ hash / ❌ reason |

If commit succeeded, show:
- Commit hash
- Commit message
- Files changed

## Example

**User runs**: `/gh-commit fix timer drift on pause`

**Output**:
```
| Check | Status |
|-------|--------|
| Lint | ✅ Passed |
| Typecheck | ✅ Passed |
| Tests | ✅ 384 passed |
| Commit | ✅ `a1b2c3d` |

Commit: fix(timer): correct drift calculation on pause
Files: 2 changed, 15 insertions(+), 3 deletions(-)
```

---

Now execute this workflow. Commit message hint: $ARGUMENTS
