# LifeStint - CI/CD Pipeline

**Product Name:** LifeStint
**Document Version:** 1.0
**Date:** January 23, 2026

---

## Overview

LifeStint uses GitHub Actions for continuous integration and deployment. The pipeline runs tests against a local Supabase instance, then deploys both database migrations and the frontend application to production.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        GitHub Actions CI/CD                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  PR to main                    Push to main                          │
│      │                              │                                │
│      ▼                              ▼                                │
│  ┌───────┐    ┌────────────┐    ┌───────┐                           │
│  │ Lint  │    │ Type Check │    │ Test  │  (parallel)               │
│  └───┬───┘    └─────┬──────┘    └───┬───┘                           │
│      │              │               │                                │
│      └──────────────┴───────────────┘                                │
│                     │                                                │
│                     ▼                                                │
│              ┌─────────────┐                                         │
│              │    Test     │  (Supabase local)                       │
│              └──────┬──────┘                                         │
│                     │                                                │
│          ┌─────────┴─────────┐                                       │
│          │                   │                                       │
│          ▼                   ▼                                       │
│   ┌─────────────┐    ┌─────────────────┐                            │
│   │   Deploy    │    │     Deploy      │                            │
│   │   Preview   │    │   Production    │                            │
│   │  (PR only)  │    │  (main only)    │                            │
│   └─────────────┘    └────────┬────────┘                            │
│                               │                                      │
│                    ┌──────────┴──────────┐                          │
│                    │                     │                           │
│                    ▼                     ▼                           │
│            ┌──────────────┐     ┌────────────────┐                  │
│            │   Supabase   │     │     Vercel     │                  │
│            │  Migrations  │     │    Frontend    │                  │
│            └──────────────┘     └────────────────┘                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Workflow File

**Location:** `.github/workflows/ci.yml`

### Jobs

| Job | Trigger | Purpose |
|-----|---------|---------|
| `lint` | All PRs and pushes to main | ESLint code quality checks |
| `type-check` | All PRs and pushes to main | TypeScript compilation checks |
| `test` | After lint + type-check pass | Runs tests against local Supabase |
| `deploy-preview` | PRs only | Deploys preview to Vercel |
| `deploy-production` | Push to main only | Deploys migrations + frontend to production |

---

## Required GitHub Secrets

Configure these in **Repository Settings → Secrets and variables → Actions**:

### Supabase Secrets

| Secret | Description | Where to Find |
|--------|-------------|---------------|
| `SUPABASE_ACCESS_TOKEN` | Personal access token for CLI authentication | [Supabase Dashboard → Account → Access Tokens](https://supabase.com/dashboard/account/tokens) |
| `SUPABASE_PROJECT_ID` | Production project reference ID | Project Settings → General → Reference ID |
| `SUPABASE_DB_PASSWORD` | Database password set during project creation | Project Settings → Database → Connection string (password portion) |

### Vercel Secrets

| Secret | Description | Where to Find |
|--------|-------------|---------------|
| `VERCEL_TOKEN` | Personal access token | [Vercel Dashboard → Settings → Tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Organization/account ID | `.vercel/project.json` after `vercel link` |
| `VERCEL_PROJECT_ID` | Project ID | `.vercel/project.json` after `vercel link` |

---

## Database Migration Workflow

### How It Works

1. **CI tests run migrations locally** - The `test` job starts a local Supabase instance and applies all migrations from `supabase/migrations/`
2. **Tests validate the schema** - Tests run against the migrated local database
3. **Production deployment applies migrations** - On push to main, `supabase db push` applies any pending migrations to production

### Migration Order

Migrations run **before** frontend deployment to ensure:
- Database schema is ready before new code deploys
- Frontend code can rely on new columns/tables existing
- Rollback is possible (revert migration, then code if needed)

### Safety Guarantees

| Protection | How It Works |
|------------|--------------|
| **Transactional migrations** | PostgreSQL rolls back entire migration if any statement fails |
| **Local testing first** | CI runs migrations against local Supabase before production |
| **Type safety** | Generated types (`npm run supabase:types`) catch schema mismatches |
| **Automatic backups** | Supabase creates daily backups; trigger manual backup before risky migrations |

---

## Writing Safe Migrations

### Do

```sql
-- Add column with default (no table lock)
ALTER TABLE projects ADD COLUMN archived_at timestamptz;

-- Add index concurrently (no table lock)
CREATE INDEX CONCURRENTLY idx_stints_user_date ON stints (user_id, started_at);

-- Add constraint with NOT VALID (validates new rows only)
ALTER TABLE stints ADD CONSTRAINT positive_duration
  CHECK (duration_minutes > 0) NOT VALID;
```

### Don't

```sql
-- AVOID: Dropping columns without verification
ALTER TABLE projects DROP COLUMN old_field;

-- AVOID: Renaming columns (breaks existing code)
ALTER TABLE stints RENAME COLUMN started_at TO begin_time;

-- AVOID: Adding NOT NULL without default to existing table
ALTER TABLE projects ADD COLUMN required_field text NOT NULL;
```

### Rollback Scripts

Include rollback SQL as comments in migration files:

```sql
-- Migration: Add project_notes column
ALTER TABLE projects ADD COLUMN notes text;

-- ROLLBACK:
-- ALTER TABLE projects DROP COLUMN notes;
```

---

## Monitoring Migration Runs

### Check CI Logs

1. Go to **Actions** tab in GitHub
2. Click on the workflow run
3. Expand **deploy-production** → **Push database migrations to production**
4. Review output for success/failure

### Check Migration Status

```bash
# Link to production project
supabase link --project-ref <your-project-id>

# List applied migrations
supabase migration list --linked
```

### Verify in Supabase Dashboard

1. Go to **Database → Migrations** in Supabase Dashboard
2. Verify latest migration appears with correct timestamp
3. Check **Database → Tables** for expected schema changes

---

## Troubleshooting

### Migration Failed in CI

**Symptoms:** `deploy-production` job fails at "Push database migrations"

**Common Causes:**
1. **Invalid SQL syntax** - Check migration file for typos
2. **Missing dependency** - Migration references table/column that doesn't exist
3. **Constraint violation** - New constraint fails against existing data
4. **Permission issue** - RLS policy blocking schema change

**Resolution:**
1. Check CI logs for specific PostgreSQL error
2. Fix the migration file locally
3. Test with `supabase db reset` locally
4. Push fix and re-run CI

### Migration Applied But Tests Fail

**Symptoms:** Migration succeeds but tests fail against new schema

**Likely Cause:** Code changes not compatible with schema changes

**Resolution:**
1. Ensure migration and code changes are in same commit
2. Regenerate types: `npm run supabase:types`
3. Update tests to use new schema

### Secrets Not Found

**Symptoms:** `Error: Input required and not supplied: SUPABASE_ACCESS_TOKEN`

**Resolution:**
1. Verify secrets are configured in repository settings
2. Check secret names match exactly (case-sensitive)
3. Ensure secrets are available to the workflow (not restricted to specific environments)

---

## Future Workflow Enhancements

### 1. Manual Approval Gate (Recommended for Teams)

Add a manual approval step before production migrations:

```yaml
  approve-production:
    name: Approve Production Deploy
    needs: [test]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production  # Requires approval in GitHub settings
    steps:
      - run: echo "Production deployment approved"

  deploy-production:
    needs: [approve-production]
    # ... rest of job
```

**Setup:**
1. Go to **Settings → Environments → New environment**
2. Name it `production`
3. Enable **Required reviewers** and add approvers
4. Optionally add **Wait timer** (e.g., 5 minutes for last-minute cancellation)

### 2. Staging Environment

Add a staging deployment for pre-production testing:

```yaml
  deploy-staging:
    name: Deploy Staging
    needs: [test]
    if: github.event_name == 'push' && github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - name: Push migrations to staging
        run: supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.STAGING_DB_PASSWORD }}
          SUPABASE_PROJECT_ID: ${{ secrets.STAGING_PROJECT_ID }}
```

**Requirements:**
- Separate Supabase project for staging
- Additional secrets: `STAGING_PROJECT_ID`, `STAGING_DB_PASSWORD`
- Branch protection on `develop` branch

### 3. Pre-Migration Backup

Trigger a backup before applying migrations (Pro plan required):

```yaml
      - name: Trigger pre-migration backup
        run: |
          curl -X POST "https://api.supabase.com/v1/projects/${{ secrets.SUPABASE_PROJECT_ID }}/database/backups" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ACCESS_TOKEN }}" \
            -H "Content-Type: application/json"
          echo "Backup triggered. Waiting 60s for completion..."
          sleep 60
```

### 4. Slack Notifications

Add deployment notifications:

```yaml
      - name: Notify Slack on success
        if: success()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "✅ Production deployed: ${{ github.sha }}"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}

      - name: Notify Slack on failure
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "❌ Production deployment failed: ${{ github.sha }}"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### 5. Database Branching (Supabase Preview Branches)

For larger teams, use Supabase's branching feature:

```yaml
  preview-branch:
    name: Create Preview Branch
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - name: Create Supabase preview branch
        run: |
          supabase branches create ${{ github.head_ref }} \
            --project-ref ${{ secrets.SUPABASE_PROJECT_ID }}
```

**Note:** Requires Supabase Pro plan and GitHub integration enabled.

### 6. Migration Dry Run

Add a dry-run step to preview changes without applying:

```yaml
      - name: Preview migration changes
        run: |
          supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_ID }}
          supabase db diff --linked
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

---

## Security Considerations

### Secrets Management

- **Never commit secrets** - Use GitHub Secrets exclusively
- **Rotate tokens regularly** - Regenerate access tokens every 90 days
- **Use minimum permissions** - Supabase tokens should only have necessary scopes
- **Audit access** - Review who has access to repository secrets

### Network Security

- **Supabase API is HTTPS-only** - All CLI commands use encrypted connections
- **IP restrictions** - Consider enabling Supabase network restrictions for production
- **Audit logs** - Enable Supabase audit logs to track schema changes

### RLS Verification

Always verify RLS policies after migrations:

```sql
-- Check RLS is enabled on all user tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('projects', 'stints', 'user_preferences', 'daily_summaries');
```

---

## Related Documents

- [04-technical-architecture.md](./04-technical-architecture.md) - Infrastructure overview
- [05-database-schema.md](./05-database-schema.md) - Database structure
- [09-operations-compliance.md](./09-operations-compliance.md) - Migration strategy details
- [ISSUE_WORKFLOW.md](./ISSUE_WORKFLOW.md) - Development workflow

---

**Last Updated:** January 23, 2026
**Document Version:** 1.0
