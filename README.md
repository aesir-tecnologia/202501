# LifeStint

Stint-based productivity tracker for independent professionals. Track focused work sessions, manage multiple client projects, and generate professional progress reports—without surveillance or timesheets.

## Features

- **Single Active Focus:** Technical safeguards prevent multitasking
- **Project Organization:** Daily stint goals with custom durations
- **Real-Time Dashboard:** Live progress tracking across devices
- **Analytics:** Heatmaps, streaks, and completion rates
- **Supabase Auth:** Email verification, password reset, session persistence

## Setup

Install dependencies:

```bash
npm install
```

Start local Supabase (requires Supabase CLI installed):

```bash
supabase start
```

Create `.env` with your local Supabase credentials:

```env
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=your_local_anon_key_from_supabase_status
```

Get the anon key from `supabase status` output after running `supabase start`.

## Development

Start the Nuxt development server:

```bash
npm run dev
```

Access the application at `http://localhost:3005`

### Development Services

- **Application**: http://localhost:3005
- **Supabase Studio**: http://127.0.0.1:54323
- **API**: http://127.0.0.1:54321

## Database Management

### Apply Schema Changes

```bash
# Create new migration
supabase migration new migration_name

# Apply migrations to local database
supabase db reset

# Generate types from local schema
npm run supabase:types
```

### View Database

Access Supabase Studio at http://127.0.0.1:54323 to:
- Use the SQL Editor for queries
- Browse tables with the Table Editor
- Inspect database schema

### Current Schema

- **users**: User profiles linked to auth.users
- **projects**: Time tracking projects per user
- **stints**: Individual work sessions

## Testing

Run tests (uses local Supabase):

```bash
npm test                 # Watch mode
npm run test:ui          # Vitest UI
npm run test:run         # CI mode (run once)
```

## Production

Build static site:

```bash
npm run generate
```

Preview locally:

```bash
npm run serve
```

### Deploy to Vercel

#### Environment Variables

Set these in Vercel project settings:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Note:** Only use the public anon key, never the service role key.

#### Option 1: Git Integration (Recommended)

1. Push your code to GitHub/GitLab/Bitbucket
2. Import project in Vercel dashboard
3. Add environment variables in project settings
4. Deploy

**Build Settings:**
- Framework Preset: Nuxt.js
- Build Command: `npm run generate`
- Output Directory: `.output/public`

#### Option 2: CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Add environment variables in dashboard
# Then deploy to production
vercel --prod
```

#### Verify Deployment

After deploying, test:

1. Landing page loads (`/home`)
2. Auth flows work (`/auth/login`, `/auth/register`)
3. Protected routes redirect (`/` → `/auth/login` if not authenticated)
4. Dashboard loads after login at `/`
5. Theme toggle works

### Cron Job Scheduling (Production)

The auto-completion feature requires a cron job to run `auto_complete_expired_stints()` every 2 minutes to automatically complete expired stints.

**Local Development:** Already configured via pg_cron extension (see `supabase/migrations/20251120011135_schedule_auto_complete_cron.sql`)

**Production:** Choose one of the following options:

#### Option 1: GitHub Actions (Recommended for SSG Apps)

Create `.github/workflows/auto-complete-stints.yml`:

```yaml
name: Auto-Complete Expired Stints
on:
  schedule:
    - cron: '*/2 * * * *'  # Every 2 minutes

jobs:
  auto-complete:
    runs-on: ubuntu-latest
    steps:
      - name: Call Auto-Complete Function
        run: |
          curl -X POST "${{ secrets.SUPABASE_URL }}/rest/v1/rpc/auto_complete_expired_stints" \
               -H "apikey: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
               -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
               -H "Content-Type: application/json"
```

**Required GitHub Secrets:**
- `SUPABASE_URL`: Your production Supabase URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (NOT anon key)

**Important:** The service role key bypasses RLS. Store it securely in GitHub Secrets, never commit it to the repository.

#### Option 2: Supabase Platform Cron (If Available)

If using Supabase Cloud with pg_cron support, the migration will automatically schedule the job. Verify it's running:

```sql
SELECT jobname, schedule, active
FROM cron.job
WHERE jobname = 'auto-complete-stints';
```

#### Option 3: External Cron Service

Use services like [cron-job.org](https://cron-job.org), [EasyCron](https://www.easycron.com), or a server crontab:

```bash
*/2 * * * * curl -X POST https://your-project.supabase.co/rest/v1/rpc/auto_complete_expired_stints \
                 -H "apikey: YOUR_SERVICE_ROLE_KEY" \
                 -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
                 -H "Content-Type: application/json"
```

**Monitoring:** See `docs/09-operations-compliance.md` for monitoring queries and alerts.

## Troubleshooting

### Local Development Issues

**"Connection refused" or authentication errors**
- Ensure `supabase start` has been run
- Verify `.env` file contains correct `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Check that local Supabase is running: `supabase status`

**Schema out of sync**
- Apply migrations: `supabase db reset`
- Check migration files are present in `supabase/migrations/`

**Type errors after schema changes**
- Regenerate types: `npm run supabase:types`
- Restart your IDE/TypeScript server

### Production Deployment Issues

**Build fails**
- Check that `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set in Vercel environment variables

**Auth not working**
- Verify Supabase email templates and auth providers are configured

**Routes 404**
- Vercel should auto-configure SPA routing. Check build logs

## Tech Stack

- **Nuxt 4** - SSG with client-side auth
- **Supabase** - Authentication & database (local development)
- **Nuxt UI 4** - Component library
- **Tailwind CSS** - Styling with dark mode support

## Notes

- **Icons:** Lucide icon set bundled locally via `@iconify-json/lucide`
- **Theming:** Dark mode via Tailwind's `dark:` variants
- **SSG:** All public routes pre-rendered, protected routes client-side only
