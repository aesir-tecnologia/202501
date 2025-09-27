# LifeStint

## Product Overview

LifeStint is a stint-based productivity tracker built for independent professionals who juggle multiple client projects and need credible evidence of focused work. Instead of retroactive timesheets, the app encourages intentional focus sessions that are tracked, analyzed, and packaged into professional reports.

### Key Value Propositions
- **Zero Administrative Overhead:** One-click start/stop stints with no category/tag setup.
- **Single Active Focus:** Technical safeguards prevent multitasking and context switching.
- **Professional Analytics:** Client-ready reports showcase attention without surveillance.
- **Habit Building:** Heatmaps, streaks, and progress bars reinforce consistent deep work.

### Target Audience
Freelancers, consultants, and remote specialists handling 2–6 concurrent client engagements who must defend retainers, justify premium rates, and protect deep work from interruptions.

## Core Capabilities
- **Stint Management System:** Start, track, and complete focused sessions with automatic single-session enforcement.
- **Project Organization:** Create projects with daily stint goals, custom durations, and activation controls.
- **Real-Time Dashboard:** Live project cards highlight active stints and progress across devices.
- **Progress Analytics:** Daily resets, streak counters, GitHub-style heatmaps, and comparison charts drive insights.
- **Authentication & Security:** Supabase Auth handles verification, session persistence, and recovery flows.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

### Icons

We ship the Lucide icon set locally to avoid CDN fetches and suppress Nuxt UI warnings. The required files live in the `@iconify-json/lucide` dev dependency installed via npm. If you add additional icon collections, install the matching `@iconify-json/<collection>` package so Nuxt can resolve them at build time.

### Supabase (Local by Default)

Running `npm run dev` automatically points the app at the Supabase CLI stack (`http://127.0.0.1:54321`) and the bundled anon key. The config falls back to these local values whenever `.env` still contains the scaffold placeholders, so auth and API testing Just Work against the local services described in `.env.local`. If you need to hit a remote project, override `SUPABASE_URL` / `SUPABASE_ANON_KEY` (or their `NUXT_PUBLIC_` variants) before starting the dev server.

### Theming Guidelines

- Tailwind is configured with `darkMode: 'class'`; Nuxt UI’s color mode module toggles the `dark` class on `<html>`. Use `dark:` variants (e.g. `dark:bg-gray-900`) alongside light defaults for any new surfaces.
- Prefer translucent cards (`bg-white/80` + `backdrop-blur`) with `dark:bg-gray-900/70` and `dark:border-gray-800` to keep parity with existing pages.
- Set copy colors with paired tokens (`text-gray-600 dark:text-gray-300`, `text-primary-600 dark:text-primary-400`) so links remain accessible in both schemes.
- When building new pages, include a quick dark-mode review (toggle the `dark` class in DevTools or via Nuxt color-mode) before shipping.

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
