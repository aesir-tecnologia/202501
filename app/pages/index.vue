<template>
  <div class="bg-ink-900 text-white antialiased">
    <!-- Header -->
    <header class="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-ink-900/70 border-b border-white/10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="h-8 w-8 rounded-lg bg-gradient-to-tr from-brand-500 to-mint-500 grid place-items-center font-extrabold">
            L
          </div>
          <span class="font-semibold tracking-tight">LifeStint</span>
        </div>
        <nav class="hidden md:flex items-center gap-7 text-sm text-ink-200">
          <a
            href="#how"
            class="hover:text-white"
          >How it works</a>
          <a
            href="#analytics"
            class="hover:text-white"
          >Analytics</a>
          <a
            href="#pricing"
            class="hover:text-white"
          >Pricing</a>
          <a
            href="#faq"
            class="hover:text-white"
          >FAQ</a>
        </nav>
        <div class="flex items-center gap-3">
          <UColorModeButton />
          <template v-if="user">
            <a
              href="/dashboard"
              class="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-sm font-semibold shadow-focus"
            >Dashboard</a>
          </template>
          <template v-else>
            <a
              href="/auth/login"
              class="hidden sm:inline-block px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm"
            >Sign in</a>
            <a
              href="/auth/register"
              class="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-sm font-semibold shadow-focus"
            >Start free</a>
          </template>
        </div>
      </div>
    </header>

    <!-- Hero -->
    <section class="hero noise relative overflow-hidden">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <div class="grid lg:grid-cols-12 gap-10 items-center">
          <div class="lg:col-span-6">
            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 badge text-sm text-ink-200 fade-up stagger-1">
              Built for freelancers, consultants, and independents
            </div>
            <h1 class="mt-5 text-4xl sm:text-5xl xl:text-6xl font-semibold leading-tight fade-up stagger-2">
              One stint at a time.<br>Zero context switching.
            </h1>
            <p class="mt-5 text-ink-200 text-lg max-w-2xl fade-up stagger-3">
              <strong class="text-white">Defend your premium rates with credible focus evidence.</strong> 
              LifeStint combines project-level tracking with professional reporting—no surveillance, 
              no administrative overhead, just demonstrable work quality.
            </p>

            <div class="mt-8 flex flex-col sm:flex-row gap-3 fade-up stagger-4">
              <a
                href="#cta"
                class="inline-flex items-center justify-center rounded-xl bg-mint-500 hover:bg-mint-600 text-ink-900 font-semibold px-6 py-3"
              >
                Start your first stint
                <svg
                  class="ml-2 h-5 w-5"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M17 8l4 4-4 4M3 12h18"
                  />
                </svg>
              </a>
              <a
                href="#how"
                class="inline-flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 px-6 py-3 font-medium"
              >
                Watch the 30s tour
              </a>
            </div>

            <div class="mt-8 grid grid-cols-3 gap-4 text-sm text-ink-200">
              <div class="rounded-lg bg-white/5 p-3 text-center hover-lift fade-up stagger-5">
                <div class="text-2xl font-semibold text-white number-roll">
                  1
                </div>
                <div class="mt-1">
                  Active session
                </div>
              </div>
              <div class="rounded-lg bg-white/5 p-3 text-center hover-lift fade-up stagger-6">
                <div class="text-2xl font-semibold text-white number-roll">
                  0
                </div>
                <div class="mt-1">
                  Admin overhead
                </div>
              </div>
              <div class="rounded-lg bg-white/5 p-3 text-center hover-lift fade-up stagger-6">
                <div class="text-2xl font-semibold text-white number-roll">
                  ∞
                </div>
                <div class="mt-1">
                  Client credibility
                </div>
              </div>
            </div>
          </div>

          <!-- Product mock stack -->
          <div class="lg:col-span-6">
            <div class="relative floating">
              <div
                class="absolute -inset-6 blur-3xl opacity-40 pulse-slow"
                style="background: radial-gradient(400px 160px at 60% 40%, rgba(43,134,255,.35), transparent 60%);"
              />
              <div class="relative rounded-2xl bg-ink-800/70 ring-1 ring-white/10 shadow-card p-4 scale-in shimmer">
                <div class="flex items-center justify-between">
                  <div class="text-sm text-ink-300">
                    Dashboard — Today
                  </div>
                  <div class="text-xs text-ink-300">
                    Synced
                  </div>
                </div>
                <div class="mt-4 grid sm:grid-cols-2 gap-4">
                  <!-- Card 1 -->
                  <div class="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
                    <div class="flex items-center justify-between">
                      <div class="font-medium">
                        Client Atlas
                      </div>
                      <span class="text-xs px-2 py-1 rounded-full bg-mint-500/15 text-mint-300">Active</span>
                    </div>
                    <div class="mt-3">
                      <div class="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          class="h-2 rounded-full bg-mint-400 progress-animate"
                          style="--progress-width: 72%; width: 72%;"
                        />
                      </div>
                      <div class="mt-2 text-xs text-ink-300">
                        2 of 3 stints • 28:12 remaining
                      </div>
                    </div>
                    <button class="mt-3 w-full rounded-lg bg-mint-500 hover:bg-mint-600 text-ink-900 font-semibold py-2 glow-on-hover pulse-slow">
                      Resume
                    </button>
                  </div>
                  <!-- Card 2 -->
                  <div class="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
                    <div class="flex items-center justify-between">
                      <div class="font-medium">
                        Orion Migrations
                      </div>
                      <span class="text-xs px-2 py-1 rounded-full bg-white/10">Idle</span>
                    </div>
                    <div class="mt-3">
                      <div class="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          class="h-2 rounded-full bg-brand-500 progress-animate"
                          style="--progress-width: 33%; width: 33%;"
                        />
                      </div>
                      <div class="mt-2 text-xs text-ink-300">
                        1 of 3 stints
                      </div>
                    </div>
                    <button class="mt-3 w-full rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-medium py-2">
                      Start stint
                    </button>
                  </div>
                  <!-- Heatmap -->
                  <div class="sm:col-span-2 rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
                    <div class="flex items-center justify-between">
                      <div class="font-medium">
                        Consistency heatmap
                      </div>
                      <div class="text-xs text-ink-300">
                        Last 10 weeks
                      </div>
                    </div>
                    <div class="mt-3 grid grid-cols-14 gap-1">
                      <!-- simple faux map -->
                      <div class="h-3 w-3 rounded bg-ink-700" />
                      <div class="h-3 w-3 rounded bg-brand-900" />
                      <div class="h-3 w-3 rounded bg-brand-700" />
                      <div class="h-3 w-3 rounded bg-brand-600" />
                      <div class="h-3 w-3 rounded bg-brand-500" />
                      <div class="h-3 w-3 rounded bg-brand-700" />
                      <div class="h-3 w-3 rounded bg-brand-800" />
                      <div class="h-3 w-3 rounded bg-ink-700" />
                      <div class="h-3 w-3 rounded bg-brand-600" />
                      <div class="h-3 w-3 rounded bg-brand-500" />
                      <div class="h-3 w-3 rounded bg-brand-700" />
                      <div class="h-3 w-3 rounded bg-brand-900" />
                      <div class="h-3 w-3 rounded bg-ink-700" />
                      <div class="h-3 w-3 rounded bg-brand-700" />
                    </div>
                    <div class="mt-3 text-xs text-ink-300">
                      Streak 14 days • Completion 90%
                    </div>
                  </div>
                </div>
              </div>
              <p class="mt-3 text-center text-xs text-ink-300">
                Mock preview — not actual UI
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section
      id="how"
      class="relative"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div class="text-center max-w-3xl mx-auto mb-10">
          <h2 class="text-3xl sm:text-4xl font-semibold">
            Run your day in stints
          </h2>
          <p class="mt-3 text-ink-200 text-lg">
            Predetermined focused work sessions that prevent multitasking and demonstrate consistent productivity to your clients.
          </p>
        </div>
        
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div class="rounded-2xl bg-white/5 ring-1 ring-white/10 p-6 hover:bg-white/[0.07] transition-colors fade-up stagger-1 hover-lift">
            <div class="h-10 w-10 rounded-lg bg-mint-500/10 ring-1 ring-mint-500/20 grid place-items-center text-mint-400 rotate-in">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="mt-4 font-semibold text-white">
              Single Active Stint Enforcement
            </div>
            <p class="mt-2 text-sm text-ink-200">
              Only one active stint at a time across all devices. No multitasking, no context switching—just focused work.
            </p>
          </div>
          
          <div class="rounded-2xl bg-white/5 ring-1 ring-white/10 p-6 hover:bg-white/[0.07] transition-colors fade-up stagger-2 hover-lift">
            <div class="h-10 w-10 rounded-lg bg-brand-500/10 ring-1 ring-brand-500/20 grid place-items-center text-brand-400 rotate-in">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div class="mt-4 font-semibold text-white">
              Project-Level Goals
            </div>
            <p class="mt-2 text-sm text-ink-200">
              Set expected daily stints (1-8 per day) for each project. Track "2 of 3 stints today" with visual progress bars.
            </p>
          </div>
          
          <div class="rounded-2xl bg-white/5 ring-1 ring-white/10 p-6 hover:bg-white/[0.07] transition-colors fade-up stagger-3 hover-lift">
            <div class="h-10 w-10 rounded-lg bg-purple-500/10 ring-1 ring-purple-500/20 grid place-items-center text-purple-400 rotate-in">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div class="mt-4 font-semibold text-white">
              Real-Time Cross-Device Sync
            </div>
            <p class="mt-2 text-sm text-ink-200">
              Start on desktop, continue on mobile. Active stints sync instantly across all devices with conflict resolution.
            </p>
          </div>
          
          <div class="rounded-2xl bg-white/5 ring-1 ring-white/10 p-6 hover:bg-white/[0.07] transition-colors fade-up stagger-4 hover-lift">
            <div class="h-10 w-10 rounded-lg bg-amberx-500/10 ring-1 ring-amberx-500/20 grid place-items-center text-amberx-400 rotate-in">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div class="mt-4 font-semibold text-white">
              Professional Focus Ledger
            </div>
            <p class="mt-2 text-sm text-ink-200">
              Export CSV reports showing focus consistency per project—client-ready evidence without surveillance metrics.
            </p>
          </div>
          
          <div class="rounded-2xl bg-white/5 ring-1 ring-white/10 p-6 hover:bg-white/[0.07] transition-colors fade-up stagger-5 hover-lift">
            <div class="h-10 w-10 rounded-lg bg-red-500/10 ring-1 ring-red-500/20 grid place-items-center text-red-400 rotate-in">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              </svg>
            </div>
            <div class="mt-4 font-semibold text-white">
              Streak Tracking & Habit Building
            </div>
            <p class="mt-2 text-sm text-ink-200">
              Maintain daily streaks with visual heatmaps. 1-day grace period keeps you motivated without harsh penalties.
            </p>
          </div>
          
          <div class="rounded-2xl bg-white/5 ring-1 ring-white/10 p-6 hover:bg-white/[0.07] transition-colors fade-up stagger-6 hover-lift">
            <div class="h-10 w-10 rounded-lg bg-cyan-500/10 ring-1 ring-cyan-500/20 grid place-items-center text-cyan-400 rotate-in">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div class="mt-4 font-semibold text-white">
              Zero Administrative Overhead
            </div>
            <p class="mt-2 text-sm text-ink-200">
              No categories, tags, or pre-work required. Start tracking in under 60 seconds with one-click project creation.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Competitive differentiation -->
    <section class="relative bg-gradient-to-b from-transparent to-ink-800/50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div class="text-center max-w-3xl mx-auto mb-10 fade-up">
          <h2 class="text-3xl sm:text-4xl font-semibold">
            Why not just use a time tracker?
          </h2>
          <p class="mt-3 text-ink-200 text-lg">
            Traditional time trackers optimize for billing compliance. LifeStint optimizes for demonstrable focus quality.
          </p>
        </div>
        
        <div class="overflow-x-auto rounded-2xl bg-white/5 ring-1 ring-white/10 scale-in">
          <table class="w-full text-sm border-collapse min-w-[600px]">
            <thead>
              <tr class="border-b border-white/10">
                <th class="text-left p-4 font-medium text-ink-300 bg-ink-900/50">Feature</th>
                <th class="p-4 text-center bg-ink-900/50">
                  <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-500/10 ring-1 ring-brand-500/20">
                    <span class="font-semibold text-brand-300">LifeStint</span>
                  </div>
                </th>
                <th class="p-4 text-center font-medium text-ink-300 bg-ink-900/50">Toggl / Harvest</th>
                <th class="p-4 text-center font-medium text-ink-300 bg-ink-900/50">Forest / Pomodoro</th>
              </tr>
            </thead>
            <tbody class="text-ink-200">
              <tr class="border-b border-white/10">
                <td class="p-4 font-medium text-white">Single active session enforcement</td>
                <td class="p-4 text-center">
                  <svg class="h-5 w-5 text-mint-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </td>
                <td class="p-4 text-center">
                  <svg class="h-5 w-5 text-red-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </td>
                <td class="p-4 text-center">
                  <svg class="h-5 w-5 text-red-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </td>
              </tr>
              <tr class="border-b border-white/10">
                <td class="p-4 font-medium text-white">Project-level focus tracking</td>
                <td class="p-4 text-center">
                  <svg class="h-5 w-5 text-mint-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </td>
                <td class="p-4 text-center">
                  <svg class="h-5 w-5 text-red-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </td>
                <td class="p-4 text-center">
                  <svg class="h-5 w-5 text-red-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </td>
              </tr>
              <tr class="border-b border-white/10">
                <td class="p-4 font-medium text-white">Professional client reports</td>
                <td class="p-4 text-center">
                  <svg class="h-5 w-5 text-mint-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </td>
                <td class="p-4 text-center text-xs">Timesheets</td>
                <td class="p-4 text-center">
                  <svg class="h-5 w-5 text-red-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </td>
              </tr>
              <tr class="border-b border-white/10">
                <td class="p-4 font-medium text-white">Zero administrative overhead</td>
                <td class="p-4 text-center">
                  <svg class="h-5 w-5 text-mint-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </td>
                <td class="p-4 text-center text-xs">Categories required</td>
                <td class="p-4 text-center">
                  <svg class="h-5 w-5 text-mint-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </td>
              </tr>
              <tr class="border-b border-white/10">
                <td class="p-4 font-medium text-white">No surveillance metrics</td>
                <td class="p-4 text-center">
                  <svg class="h-5 w-5 text-mint-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </td>
                <td class="p-4 text-center text-xs">Productivity scores</td>
                <td class="p-4 text-center">
                  <svg class="h-5 w-5 text-mint-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </td>
              </tr>
              <tr>
                <td class="p-4 font-medium text-white">Real-time cross-device sync</td>
                <td class="p-4 text-center">
                  <svg class="h-5 w-5 text-mint-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </td>
                <td class="p-4 text-center">
                  <svg class="h-5 w-5 text-mint-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </td>
                <td class="p-4 text-center text-xs">Mobile only</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- Analytics deep dive -->
    <section
      id="analytics"
      class="relative"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div class="rounded-3xl bg-gradient-to-br from-ink-800 to-ink-700 ring-1 ring-white/10 p-6 sm:p-10">
          <div class="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h3 class="text-3xl font-semibold">
                Focus evidence clients respect
              </h3>
              <p class="mt-3 text-ink-200 text-lg">
                Unlike traditional time trackers that feel like surveillance, LifeStint generates 
                professional Focus Ledgers that demonstrate work quality and consistency—the credible 
                evidence clients need without the Big Brother feeling.
              </p>
              <ul class="mt-6 space-y-3 text-ink-200">
                <li class="flex gap-3">
                  <svg class="mt-0.5 h-5 w-5 text-mint-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>CSV export with stint history, dates, durations, and completion types</span>
                </li>
                <li class="flex gap-3">
                  <svg class="mt-0.5 h-5 w-5 text-brand-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Weekly summaries showing total stints, focus time, and project breakdown</span>
                </li>
                <li class="flex gap-3">
                  <svg class="mt-0.5 h-5 w-5 text-purple-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Streak tracking and completion rates to prove consistent work habits</span>
                </li>
                <li class="flex gap-3">
                  <svg class="mt-0.5 h-5 w-5 text-amberx-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>No surveillance metrics—just focus sessions and work quality data</span>
                </li>
              </ul>
            </div>
            <!-- Ledger mock -->
            <div>
              <div class="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 shadow-card">
                <div class="flex items-center justify-between">
                  <div class="font-medium">
                    Focus Ledger — Week 32
                  </div>
                  <div class="flex gap-2">
                    <span class="px-2 py-1 rounded bg-white/10 text-xs">PDF</span>
                    <span class="px-2 py-1 rounded bg-white/10 text-xs">Share</span>
                  </div>
                </div>
                <div class="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <div class="rounded-lg bg-ink-900/60 p-3">
                    <div class="text-ink-300">
                      Total stints
                    </div>
                    <div class="text-2xl font-semibold mt-1">
                      22
                    </div>
                  </div>
                  <div class="rounded-lg bg-ink-900/60 p-3">
                    <div class="text-ink-300">
                      Focused hours
                    </div>
                    <div class="text-2xl font-semibold mt-1">
                      15.6
                    </div>
                  </div>
                  <div class="rounded-lg bg-ink-900/60 p-3">
                    <div class="text-ink-300">
                      Completion
                    </div>
                    <div class="text-2xl font-semibold mt-1">
                      87%
                    </div>
                  </div>
                </div>
                <div class="mt-4">
                  <div class="text-xs text-ink-300">
                    Distribution
                  </div>
                  <div class="mt-2 w-full h-2 rounded-full bg-white/10 grid grid-cols-12 overflow-hidden">
                    <div class="bg-brand-500 col-span-5" />
                    <div class="bg-mint-500 col-span-4" />
                    <div class="bg-amberx-500 col-span-3" />
                  </div>
                  <div class="mt-2 grid grid-cols-3 text-xs text-ink-300">
                    <div class="flex items-center gap-2">
                      <span class="h-2.5 w-2.5 rounded-full bg-brand-500" /> Client A 42%
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="h-2.5 w-2.5 rounded-full bg-mint-500" /> Client B 33%
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="h-2.5 w-2.5 rounded-full bg-amberx-500" /> Client C 25%
                    </div>
                  </div>
                </div>
                <div class="mt-5 rounded-xl bg-white/5 p-4 text-sm">
                  “We defend retainers with a transparent focus ledger, not a timesheet. Clients love
                  the clarity.”
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Use case examples -->
        <div class="mt-14 grid md:grid-cols-2 gap-6">
          <div class="rounded-2xl bg-gradient-to-br from-mint-500/10 to-brand-500/10 ring-1 ring-mint-500/20 p-6 slide-in-left hover-lift">
            <div class="flex gap-4">
              <div class="h-12 w-12 rounded-full bg-mint-500/20 ring-2 ring-mint-500/30 flex-shrink-0 grid place-items-center text-2xl bounce-subtle">
                👩‍💻
              </div>
              <div>
                <div class="font-semibold text-lg text-white">
                  "I used to lose 2 hours daily to context switching"
                </div>
                <p class="mt-2 text-sm text-ink-200">
                  "Now I complete 14 stints per week with 87% consistency. My clients see the ledger and trust I'm focused on their work—no questions asked."
                </p>
                <div class="mt-3 text-xs text-ink-300">
                  — Sarah, Independent Software Consultant
                </div>
              </div>
            </div>
          </div>
          
          <div class="rounded-2xl bg-gradient-to-br from-purple-500/10 to-brand-500/10 ring-1 ring-purple-500/20 p-6 slide-in-right hover-lift">
            <div class="flex gap-4">
              <div class="h-12 w-12 rounded-full bg-purple-500/20 ring-2 ring-purple-500/30 flex-shrink-0 grid place-items-center text-2xl bounce-subtle">
                🎯
              </div>
              <div>
                <div class="font-semibold text-lg text-white">
                  "Finally, evidence that doesn't feel like surveillance"
                </div>
                <p class="mt-2 text-sm text-ink-200">
                  "I send weekly Focus Ledgers to my retainer clients. They appreciate the transparency without feeling like I'm being monitored. It's helped me justify my rates."
                </p>
                <div class="mt-3 text-xs text-ink-300">
                  — Marcus, Design Agency Remote Worker
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- CTA banner -->
        <div
          id="cta"
          class="mt-10 rounded-2xl bg-gradient-to-r from-brand-500 to-mint-500 p-8 sm:p-10 text-center scale-in animate-gradient glow-on-hover"
        >
          <h3 class="text-3xl font-bold text-white">
            Start demonstrating your focus quality
          </h3>
          <p class="mt-3 text-white/90 text-lg max-w-2xl mx-auto">
            Join consultants and freelancers who defend their premium rates with credible focus evidence—not surveillance.
          </p>
          <div class="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/auth/register"
              class="inline-flex items-center justify-center rounded-xl bg-white text-ink-900 hover:bg-white/90 font-semibold px-8 py-3.5 shadow-lg transition-all"
            >
              Start your first stint — Free
            </a>
            <a
              href="#how"
              class="inline-flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium px-8 py-3.5 backdrop-blur-sm transition-all"
            >
              See how it works
            </a>
          </div>
          <p class="mt-4 text-sm text-white/70">
            Free forever for 2 projects • No credit card required • Takes 60 seconds to start
          </p>
        </div>
      </div>
    </section>

    <!-- Pricing -->
    <section
      id="pricing"
      class="relative"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div class="text-center">
          <h3 class="text-3xl sm:text-4xl font-semibold">
            Simple pricing for serious focus
          </h3>
          <p class="mt-3 text-ink-200 text-lg">
            Generous free tier to get started. Upgrade when you need unlimited projects and professional exports.
          </p>
        </div>

        <div class="mt-10 grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <!-- Free -->
          <div class="rounded-2xl bg-white/5 ring-1 ring-white/10 p-7 fade-up stagger-1 hover-lift">
            <div class="text-sm font-medium text-ink-300 uppercase tracking-wide">
              Free
            </div>
            <div class="mt-3 flex items-baseline gap-2">
              <span class="text-4xl font-bold">$0</span>
              <span class="text-ink-300">forever</span>
            </div>
            <p class="mt-3 text-sm text-ink-200">
              Perfect for trying out LifeStint and managing a couple of key projects.
            </p>
            <ul class="mt-6 space-y-3 text-sm text-ink-200">
              <li class="flex gap-3">
                <svg class="h-5 w-5 text-mint-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span><strong class="text-white">2 active projects</strong></span>
              </li>
              <li class="flex gap-3">
                <svg class="h-5 w-5 text-mint-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Unlimited stints per day</span>
              </li>
              <li class="flex gap-3">
                <svg class="h-5 w-5 text-mint-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Real-time sync across all devices</span>
              </li>
              <li class="flex gap-3">
                <svg class="h-5 w-5 text-mint-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Basic analytics (90 days)</span>
              </li>
              <li class="flex gap-3">
                <svg class="h-5 w-5 text-mint-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Streak tracking & heatmaps</span>
              </li>
            </ul>
            <a
              href="/auth/register"
              class="mt-6 block w-full text-center rounded-xl bg-white text-ink-900 hover:bg-white/90 py-3 font-semibold transition-colors"
            >
              Get started free
            </a>
          </div>
          <!-- Pro -->
          <div class="rounded-2xl bg-gradient-to-br from-brand-500/20 to-mint-500/20 ring-2 ring-brand-400/30 p-7 relative fade-up stagger-2 hover-lift shimmer">
            <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brand-500 text-white text-xs font-semibold">
              MOST POPULAR
            </div>
            <div class="text-sm font-medium text-brand-300 uppercase tracking-wide">
              Pro
            </div>
            <div class="mt-3 flex items-baseline gap-2">
              <span class="text-4xl font-bold text-white">$12</span>
              <span class="text-ink-300">/month</span>
            </div>
            <p class="mt-3 text-sm text-ink-200">
              For consultants who need to manage multiple clients and demonstrate consistent work quality.
            </p>
            <ul class="mt-6 space-y-3 text-sm text-ink-200">
              <li class="flex gap-3">
                <svg class="h-5 w-5 text-mint-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span><strong class="text-white">Unlimited active projects</strong></span>
              </li>
              <li class="flex gap-3">
                <svg class="h-5 w-5 text-mint-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span><strong class="text-white">Unlimited Focus Ledger CSV exports</strong></span>
              </li>
              <li class="flex gap-3">
                <svg class="h-5 w-5 text-mint-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Unlimited analytics history</span>
              </li>
              <li class="flex gap-3">
                <svg class="h-5 w-5 text-mint-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Advanced analytics & charts</span>
              </li>
              <li class="flex gap-3">
                <svg class="h-5 w-5 text-mint-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Custom branding on exports</span>
              </li>
              <li class="flex gap-3">
                <svg class="h-5 w-5 text-mint-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Priority email support</span>
              </li>
            </ul>
            <a
              href="/auth/register"
              class="mt-6 block w-full text-center rounded-xl bg-brand-500 hover:bg-brand-600 py-3 font-semibold shadow-focus transition-colors text-white"
            >
              Start Pro trial
            </a>
            <p class="mt-3 text-center text-xs text-ink-300">
              14-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section
      id="faq"
      class="relative"
    >
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <h3 class="text-3xl sm:text-4xl font-semibold text-center">
          Frequently asked questions
        </h3>
        <div class="mt-10 grid md:grid-cols-2 gap-6">
          <div class="rounded-xl bg-white/5 ring-1 ring-white/10 p-6 hover:bg-white/[0.07] transition-colors fade-up stagger-1 hover-lift">
            <div class="font-semibold text-lg text-white">
              What makes LifeStint different from Toggl or Harvest?
            </div>
            <p class="mt-3 text-sm text-ink-200 leading-relaxed">
              Unlike traditional time trackers that require categories and tags, LifeStint focuses on <strong class="text-white">focus quality, not billing hours</strong>. 
              We technically enforce single active sessions to prevent multitasking and provide professional reports that demonstrate work consistency—not surveillance data.
            </p>
          </div>
          <div class="rounded-xl bg-white/5 ring-1 ring-white/10 p-6 hover:bg-white/[0.07] transition-colors fade-up stagger-2 hover-lift">
            <div class="font-semibold text-lg text-white">
              Do clients see my screen or keystrokes?
            </div>
            <p class="mt-3 text-sm text-ink-200 leading-relaxed">
              <strong class="text-white">Absolutely not.</strong> No surveillance, no screenshots, no keystroke logging. Focus Ledger exports show only stint dates, 
              durations, project names, and optional notes—clean, professional evidence of consistent work habits.
            </p>
          </div>
          <div class="rounded-xl bg-white/5 ring-1 ring-white/10 p-6 hover:bg-white/[0.07] transition-colors fade-up stagger-3 hover-lift">
            <div class="font-semibold text-lg text-white">
              How does the single active stint enforcement work?
            </div>
            <p class="mt-3 text-sm text-ink-200 leading-relaxed">
              You can only have one active stint at a time across all your devices. Starting a new stint requires ending the current one. This <strong class="text-white">technical guardrail prevents context switching</strong> 
              and ensures genuine focused work—something Pomodoro apps and time trackers don't enforce.
            </p>
          </div>
          <div class="rounded-xl bg-white/5 ring-1 ring-white/10 p-6 hover:bg-white/[0.07] transition-colors fade-up stagger-4 hover-lift">
            <div class="font-semibold text-lg text-white">
              What happens if I need to pause or stop early?
            </div>
            <p class="mt-3 text-sm text-ink-200 leading-relaxed">
              Pause anytime for breaks—pause time is tracked separately. Stop manually if you finish early and optionally add notes. 
              Auto-completion happens after 4 hours max (prevents accidental overnight runs). Interrupted stints are preserved for analytics but don't count toward daily goals.
            </p>
          </div>
          <div class="rounded-xl bg-white/5 ring-1 ring-white/10 p-6 hover:bg-white/[0.07] transition-colors fade-up stagger-5 hover-lift">
            <div class="font-semibold text-lg text-white">
              How do daily targets and streaks work?
            </div>
            <p class="mt-3 text-sm text-ink-200 leading-relaxed">
              Set expected daily stints (1-8) per project. Track "2 of 3 stints today" with visual progress. Progress resets at midnight in your timezone. 
              <strong class="text-white">Streaks track consecutive days</strong> with at least one completed stint, with a 1-day grace period.
            </p>
          </div>
          <div class="rounded-xl bg-white/5 ring-1 ring-white/10 p-6 hover:bg-white/[0.07] transition-colors fade-up stagger-6 hover-lift">
            <div class="font-semibold text-lg text-white">
              Does it work offline and across devices?
            </div>
            <p class="mt-3 text-sm text-ink-200 leading-relaxed">
              Yes! Start on desktop, continue on mobile—real-time sync keeps everything in sync. Offline stint tracking works with smart conflict resolution. 
              Timer runs in background tabs using Web Workers for accuracy, and server-side auto-completion ensures stints complete even if your browser closes.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-white/10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-ink-300">
          <div>© {{ new Date().getFullYear() }} LifeStint</div>
          <nav class="flex items-center gap-5">
            <a
              href="#"
              class="hover:text-white"
            >Privacy</a>
            <a
              href="#"
              class="hover:text-white"
            >Terms</a>
            <a
              href="#"
              class="hover:text-white"
            >Security</a>
            <a
              href="#"
              class="hover:text-white"
            >Contact</a>
          </nav>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: false,
})

// SEO
useSeoMeta({
  title: 'LifeStint - One Stint at a Time. Zero Context Switching.',
  description: 'Defend your premium rates with credible focus evidence. Project-level tracking with professional reporting—no surveillance, no administrative overhead, just demonstrable work quality for consultants and freelancers.',
  ogTitle: 'LifeStint - Professional Focus Tracking for Consultants',
  ogDescription: 'Single active stint enforcement prevents multitasking. Export professional Focus Ledgers that demonstrate work quality without surveillance metrics.',
  twitterCard: 'summary_large_image',
})

const user = useAuthUser()

// Intersection Observer for scroll animations
const isVisible = ref(false)

onMounted(() => {
  // Add scroll animation observers
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in')
      }
    })
  }, observerOptions)

  // Observe all animated elements
  document.querySelectorAll('.fade-up, .fade-in, .scale-in, .slide-in-left, .slide-in-right').forEach(el => {
    observer.observe(el)
  })

  // Floating animation for hero product mock
  const floatingElements = document.querySelectorAll('.floating')
  floatingElements.forEach(el => {
    el.classList.add('animate-float')
  })
})
</script>

<style>
/* Hero background with animation */
.hero {
    background: radial-gradient(1000px 340px at 20% -10%, rgba(43, 134, 255, .25), transparent 60%),
    radial-gradient(800px 280px at 80% -20%, rgba(21, 63, 143, .25), transparent 60%),
    linear-gradient(180deg, #0b1020 0%, #141b2f 100%);
    animation: subtle-pulse 8s ease-in-out infinite;
}

@keyframes subtle-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.95; }
}

.noise::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: .08;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Ccircle cx='2' cy='2' r='1' fill='white'/%3E%3C/svg%3E");
    background-size: 12px 12px;
    mix-blend-mode: soft-light;
}

.badge {
    border: 1px solid rgba(255, 255, 255, .14);
    animation: badge-glow 3s ease-in-out infinite;
}

@keyframes badge-glow {
    0%, 100% { box-shadow: 0 0 0 rgba(43, 134, 255, 0); }
    50% { box-shadow: 0 0 20px rgba(43, 134, 255, 0.3); }
}

/* Scroll-triggered animations */
.fade-up, .fade-in, .scale-in, .slide-in-left, .slide-in-right {
    opacity: 0;
    transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-up {
    transform: translateY(30px);
}

.fade-up.animate-in {
    opacity: 1;
    transform: translateY(0);
}

.fade-in.animate-in {
    opacity: 1;
}

.scale-in {
    transform: scale(0.95);
}

.scale-in.animate-in {
    opacity: 1;
    transform: scale(1);
}

.slide-in-left {
    transform: translateX(-30px);
}

.slide-in-left.animate-in {
    opacity: 1;
    transform: translateX(0);
}

.slide-in-right {
    transform: translateX(30px);
}

.slide-in-right.animate-in {
    opacity: 1;
    transform: translateX(0);
}

/* Stagger animation delays */
.stagger-1 { transition-delay: 0.1s; }
.stagger-2 { transition-delay: 0.2s; }
.stagger-3 { transition-delay: 0.3s; }
.stagger-4 { transition-delay: 0.4s; }
.stagger-5 { transition-delay: 0.5s; }
.stagger-6 { transition-delay: 0.6s; }

/* Floating animation */
.floating {
    animation: float 6s ease-in-out infinite;
}

@keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
}

/* Pulse animation for active elements */
.pulse-slow {
    animation: pulse-glow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse-glow {
    0%, 100% { opacity: 1; }
    50% { opacity: .7; }
}

/* Shimmer effect */
.shimmer {
    position: relative;
    overflow: hidden;
}

.shimmer::after {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.1),
        transparent
    );
    animation: shimmer 3s infinite;
}

@keyframes shimmer {
    0% { left: -100%; }
    100% { left: 100%; }
}

/* Hover effects with smooth transitions */
.hover-lift {
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), 
                box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.hover-lift:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

/* Gradient animation */
.animate-gradient {
    background-size: 200% 200%;
    animation: gradient-shift 8s ease infinite;
}

@keyframes gradient-shift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
}

/* Rotate animation for icons */
.rotate-in {
    animation: rotate-scale 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes rotate-scale {
    0% {
        transform: rotate(-180deg) scale(0);
        opacity: 0;
    }
    100% {
        transform: rotate(0deg) scale(1);
        opacity: 1;
    }
}

/* Progress bar animation */
.progress-animate {
    animation: progress-fill 2s ease-out forwards;
}

@keyframes progress-fill {
    from { width: 0; }
    to { width: var(--progress-width, 100%); }
}

/* Typing animation for text */
@keyframes typing {
    from { width: 0; }
    to { width: 100%; }
}

@keyframes blink-caret {
    from, to { border-color: transparent; }
    50% { border-color: currentColor; }
}

/* Bounce attention animation */
.bounce-subtle {
    animation: bounce-subtle 2s infinite;
}

@keyframes bounce-subtle {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
}

/* Glow effect on hover */
.glow-on-hover {
    position: relative;
    transition: all 0.3s ease;
}

.glow-on-hover:hover {
    box-shadow: 0 0 20px rgba(43, 134, 255, 0.4),
                0 0 40px rgba(43, 134, 255, 0.2);
}

/* Blur reveal animation */
.blur-reveal {
    filter: blur(10px);
    opacity: 0;
    transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);
}

.blur-reveal.animate-in {
    filter: blur(0);
    opacity: 1;
}

/* Number counter animation */
@keyframes number-roll {
    0% { transform: translateY(100%); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
}

.number-roll {
    animation: number-roll 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
