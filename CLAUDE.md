# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LifeStint is a stint-based productivity tracker built with Nuxt 4, Vue 3, Supabase, and Nuxt UI 4. The app tracks focused work sessions ("stints") for independent professionals managing multiple client projects.

## Common Development Commands

```bash
# Development
npm run dev              # Start dev server (auto-connects to local Supabase)
npm run build            # Production build
npm run preview          # Preview production build

# Testing
npm test                 # Run tests in watch mode
npm run test:ui          # Run tests with Vitest UI
npm run test:run         # Run tests once (CI mode)

# Linting
npm run lint             # Check for linting issues
npm run lint:fix         # Auto-fix linting issues

# Supabase
npm run supabase:types   # Generate TypeScript types from local database schema
```

## Architecture

### State Management Pattern

The app uses a **centralized state + composables** pattern instead of Pinia/Vuex:

- **`useProjects`** - Centralized project state with real-time sync (`app/composables/useProjects.ts:1`)
- **`useStints`** - Centralized stint state with timer integration (`app/composables/useStints.ts:1`)
- **`useProjectMutations`** - Optimistic updates for projects (`app/composables/useProjectMutations.ts:1`)
- **`useStintLifecycle`** - Optimistic updates for stint lifecycle (`app/composables/useStintLifecycle.ts:1`)

State is stored in `useState()` for global reactivity across components. Real-time updates from Supabase are handled via WebSocket subscriptions.

### Offline-First Architecture

The app implements **optimistic UI with offline queue**:

1. **Optimistic updates** - UI updates instantly before server confirmation
2. **Offline queue** - Failed mutations are queued in localStorage (`app/composables/useOfflineQueue.ts:1`)
3. **Auto-retry** - Queue processes automatically on reconnection
4. **Conflict resolution** - Merge strategy for concurrent edits (`app/composables/useConflictResolution.ts:1`)

### Timer System

Stints use a **Web Worker-based timer** for accuracy and background operation:

- Worker lives at `public/workers/timer-worker.js`
- Managed by `useStints` composable (`app/composables/useStints.ts:72-136`)
- Survives tab backgrounding and provides completion warnings

### Database Layer

Database operations are isolated in `app/lib/supabase/`:

- **`projects.ts`** - Project CRUD operations
- **`stints.ts`** - Stint lifecycle operations (start, stop, pause, resume)

These functions accept a Supabase client and return `{ data, error }` tuples.

### Supabase Configuration

The app defaults to **local Supabase** (`http://127.0.0.1:54321`) unless explicit environment variables are set. This is handled by `nuxt.config.ts:7-23` which falls back to local credentials when placeholders are detected.

To use remote Supabase, set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env`.

## Testing Strategy

### Test Setup

- **Framework**: Vitest with happy-dom
- **Setup file**: `tests/setup.ts`
- **Path aliases**: Configured in `vitest.config.ts:13-19` (matches Nuxt aliases)

### Testing Composables

When testing composables that use `useState()`, you need to mock the Nuxt environment:

```ts
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

mockNuxtImport('useState', () => (key: string, init: () => any) => ref(init()))
```

See existing composable tests for patterns.

## Theming & UI

### Nuxt UI 4

- Uses **Nuxt UI 4** component library
- Icons from `@iconify-json/lucide` (shipped locally, no CDN)
- Color mode via `dark` class on `<html>` (configured in `nuxt.config.ts:56-61`)

### Dark Mode Guidelines

- Tailwind uses `darkMode: 'class'`
- Always provide both light and dark variants:
  - Surfaces: `bg-white/80 dark:bg-gray-900/70`
  - Borders: `border-gray-200 dark:border-gray-800`
  - Text: `text-gray-600 dark:text-gray-300`
- Use translucent cards with `backdrop-blur` for depth

### Component Patterns

- **Modal components** live in `app/components/Modal/`
- **Page layouts** use `app/layouts/default.vue`
- **Protected pages** use `middleware: 'auth'` (Supabase auto-redirect)

## Security

### CSP & Headers

Security headers configured in `nuxt.config.ts:36-86`:

- Content Security Policy allows local and Supabase origins
- X-Frame-Options, X-Content-Type-Options, etc. set via Nitro route rules

### Authentication

- Supabase Auth handles login, registration, email verification, password reset
- Auth pages in `app/pages/auth/`
- Redirect config in `nuxt.config.ts:93-99`
- Protected routes use `middleware: 'auth'`
- Guest-only routes use `middleware: 'guest'` (`app/middleware/guest.ts:1`)

## Implementation Standards

### Minimal Implementation Principle
- Implement **only** what's required to meet acceptance criteria
- No speculative features or "nice-to-haves"
- No premature optimization or over-engineering
- Use the simplest solution that works

### Testing Requirements
- **Happy path only** plus most evident error cases
- Focus on core functionality verification
- Skip edge cases unless explicitly in acceptance criteria
- No exhaustive test coverage unless specified

### Code Coverage Philosophy
- Quality over quantity
- Tests should validate requirements, not achieve coverage metrics
- One clear test per acceptance criterion
- Add error handling tests only for obvious failure modes (null checks, type errors, network failures)

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md

You MUST use the local `npx task-master` command when running the Task Master AI.
