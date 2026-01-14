# Contributing to LifeStint

Guidelines for contributing to this project.

## Development Setup

1. Follow the setup instructions in [README.md](README.md)
2. Ensure local Supabase is running: `supabase start`
3. Run tests before submitting: `npm run test:run`

## Branching Strategy

We use **GitHub Flow** — a simplified branch-based workflow with direct PRs to `main`.

```
feature-branch ────┐
                   │ PR (with CI checks)
main ──────────────┴─────────────────────→
```

### Rules

- **Branch from `main`**, PR back to `main`
- **CI must pass** before merge (tests + lint)
- **One feature per branch** — keep PRs focused
- Delete branches after merge (GitHub auto-deletes)

### Branch Naming

Use conventional prefixes with optional issue numbers:

```
<type>/<issue-number>-<short-description>
```

| Type | Purpose | Example |
|------|---------|---------|
| `feat/` | New features | `feat/46-unlimited-paused-stints` |
| `fix/` | Bug fixes | `fix/52-timer-sync-race` |
| `refactor/` | Code improvements | `refactor/extract-timer-composable` |
| `docs/` | Documentation only | `docs/add-api-reference` |
| `chore/` | Maintenance tasks | `chore/update-dependencies` |
| `test/` | Test additions/fixes | `test/add-streak-edge-cases` |

**Issue number is optional** but recommended for traceability:
- ✅ `feat/46-unlimited-paused-stints` (linked to issue #46)
- ✅ `refactor/cleanup-stint-mutations` (no issue, self-contained)

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <description>

[optional body]
```

### Types

| Type | When to use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or correcting tests |
| `chore` | Maintenance (deps, config, CI) |
| `style` | Formatting, whitespace (no code change) |
| `perf` | Performance improvement |

### Scope (optional)

Indicates the area affected:
- `ui` — Components, styling
- `api` — Supabase queries, database layer
- `auth` — Authentication
- `timer` — Stint timer functionality
- `analytics` — Stats, summaries, streaks

### Examples

```bash
feat(ui): add confetti animation on daily goal completion
fix(timer): prevent race condition in stint sync
refactor(api): extract useTypedSupabaseClient helper
docs: update branching strategy in CONTRIBUTING.md
chore: upgrade @tanstack/vue-query to 5.91
```

## Pull Request Process

### Creating a PR

1. **Create a focused branch** from `main`
2. **Make your changes** with clear commits
3. **Run tests locally**: `npm run test:run`
4. **Run linter**: `npm run lint:fix`
5. **Push and create PR** via GitHub or CLI:
   ```bash
   gh pr create --title "feat(scope): description" --body "Closes #123"
   ```

### PR Description

Include:
- **Summary**: What changed and why (2-3 sentences)
- **Issue link**: `Closes #123` or `Fixes #123` (auto-closes on merge)
- **Test plan**: How to verify the change works

### Review Checklist

Before requesting review, verify:
- [ ] Tests pass (`npm run test:run`)
- [ ] No lint errors (`npm run lint`)
- [ ] Types check (`npm run typecheck` if available)
- [ ] No console errors in browser
- [ ] Changes work in both light and dark mode (if UI)

## Code Standards

Detailed coding standards are in [CLAUDE.md](CLAUDE.md). Key points:

- **TypeScript**: Strict mode, no `any` unless justified
- **Vue**: Composition API with `<script setup>`
- **Data Layer**: Follow the 3-layer pattern (Database → Schema → Composable)
- **Error Handling**: Propagate errors through `Result<T>` pattern
- **Testing**: Co-located tests (`*.test.ts` next to source files)

## Issue Workflow

See [.claude/GITHUB.md](.claude/GITHUB.md) for detailed GitHub CLI commands.

### Issue Types

| Type | Use for |
|------|---------|
| Bug | Unexpected behavior, errors |
| Feature | New functionality |
| Task | Refactoring, docs, maintenance |

### Linking PRs to Issues

Always link PRs to issues when applicable:
- Use `Closes #123` in PR description (auto-closes on merge)
- Or `Relates to #123` if PR partially addresses the issue

## Questions?

- Check existing issues and PRs for context
- Open a discussion or issue if unsure about approach
