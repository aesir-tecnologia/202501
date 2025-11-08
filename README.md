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

**Note:** This project uses a remote Supabase instance for development. Make sure your Supabase project is set up and accessible before starting the development server.

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

Deploy to Vercel: See [DEPLOYMENT.md](./DEPLOYMENT.md)

## Tech Stack

- **Nuxt 4** - SSG with client-side auth
- **Supabase** - Authentication & database
- **Nuxt UI 4** - Component library
- **Tailwind CSS** - Styling with dark mode support

## Notes

- **Icons:** Lucide icon set bundled locally via `@iconify-json/lucide`
- **Theming:** Dark mode via Tailwind's `dark:` variants
- **SSG:** All public routes pre-rendered, protected routes client-side only
