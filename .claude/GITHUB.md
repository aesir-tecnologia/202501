# GITHUB.md

Reference guide for working with GitHub features via CLI and API in this repository.

## Issue Types

GitHub Issue Types is a feature (public preview as of January 2025) that allows classifying issues beyond labels. Issue types are defined at the **organization level** and shared across all repositories.

### Available Issue Types

This organization has the following issue types:

| ID | Name | Description |
|----|------|-------------|
| 14889028 | Task | General work items |
| 14889031 | Bug | An unexpected problem or behavior |
| 14889034 | Feature | New functionality requests |

### Listing Issue Types

```bash
# List all issue types for the organization
gh api orgs/aesir-tecnologia/issue-types --jq '.[] | "\(.id): \(.name) - \(.description)"'
```

### Setting Issue Type on an Issue

The `gh` CLI does not yet support issue types natively ([cli/cli#12110](https://github.com/cli/cli/issues/12110)). Use the REST API instead:

```bash
# Set issue type (use type NAME, not ID)
gh api repos/aesir-tecnologia/202501/issues/{NUMBER} -X PATCH -f type="Bug"
gh api repos/aesir-tecnologia/202501/issues/{NUMBER} -X PATCH -f type="Feature"
gh api repos/aesir-tecnologia/202501/issues/{NUMBER} -X PATCH -f type="Task"

# Remove issue type
gh api repos/aesir-tecnologia/202501/issues/{NUMBER} -X PATCH --null type
```

### Creating Issues with Type

```bash
# Create issue and set type in one API call
gh api repos/aesir-tecnologia/202501/issues -X POST \
  -f title="Issue title" \
  -f body="Issue description" \
  -f type="Bug"
```

### Viewing Issue Type

```bash
# View issue type (gh CLI doesn't support --json type yet)
gh api repos/aesir-tecnologia/202501/issues/{NUMBER} --jq '.type.name // "none"'

# View multiple issues with types
gh api repos/aesir-tecnologia/202501/issues --jq '.[] | "#\(.number) [\(.type.name // "no type")] \(.title)"'
```

## Common Issue Operations

### Creating Issues

```bash
# Basic issue creation (then set type separately)
gh issue create --title "Title" --body "Description"

# With labels and assignee
gh issue create --title "Title" --body "Description" --label "bug" --assignee "@me"

# From a file
gh issue create --title "Title" --body-file issue-body.md
```

### Editing Issues

```bash
# Edit title/body
gh issue edit {NUMBER} --title "New title" --body "New body"

# Add/remove labels
gh issue edit {NUMBER} --add-label "priority:high" --remove-label "needs-triage"

# Assign
gh issue edit {NUMBER} --add-assignee "@me"
```

### Listing and Filtering Issues

```bash
# List open issues
gh issue list

# Filter by label
gh issue list --label "bug"

# Filter by assignee
gh issue list --assignee "@me"

# Include closed issues
gh issue list --state all

# JSON output for scripting
gh issue list --json number,title,state,labels
```

## Pull Request Operations

### Creating PRs

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

### Viewing PR Details

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

### PR Review

```bash
# Approve
gh pr review {NUMBER} --approve

# Request changes
gh pr review {NUMBER} --request-changes --body "Please fix X"

# Comment
gh pr review {NUMBER} --comment --body "Looks good overall"
```

## GitHub API Tips

### Authentication

The `gh` CLI handles authentication automatically. For API calls:

```bash
# Check current auth status
gh auth status

# Refresh auth with additional scopes
gh auth refresh -s project
```

### Common API Patterns

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

### Useful API Endpoints

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
