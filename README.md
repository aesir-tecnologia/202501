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

Create `.env` with your remote Supabase development project credentials:

```env
SUPABASE_URL=https://your-dev-project-id.supabase.co
SUPABASE_ANON_KEY=your_dev_supabase_anon_key_here
```

## Development

```bash
npm run dev
```

Runs on `http://localhost:3005`

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

#### Troubleshooting

**Build fails:** Check that `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set in Vercel environment variables.

**Auth not working:** Verify Supabase email templates and auth providers are configured.

**Routes 404:** Vercel should auto-configure SPA routing. Check build logs.

## Tech Stack

- **Nuxt 4** - SSG with client-side auth
- **Supabase** - Authentication & database
- **Nuxt UI 4** - Component library
- **Tailwind CSS** - Styling with dark mode support

## Notes

- **Icons:** Lucide icon set bundled locally via `@iconify-json/lucide`
- **Theming:** Dark mode via Tailwind's `dark:` variants
- **SSG:** All public routes pre-rendered, protected routes client-side only
