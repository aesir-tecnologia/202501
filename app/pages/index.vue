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
            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 badge text-sm text-ink-200">
              Built for freelancers, consultants, and independents
            </div>
            <h1 class="mt-5 text-4xl sm:text-5xl xl:text-6xl font-semibold leading-tight">
              One stint at a time. Zero context switching.
            </h1>
            <p class="mt-5 text-ink-200 text-lg max-w-2xl">
              Commit to focused sessions with technical guardrails. LifeStint tracks your progress and
              turns it into client‑ready evidence—without surveillance.
            </p>

            <div class="mt-8 flex flex-col sm:flex-row gap-3">
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
              <div class="rounded-lg bg-white/5 p-3 text-center">
                <div class="text-2xl font-semibold text-white">
                  1
                </div>
                <div class="mt-1">
                  Active session
                </div>
              </div>
              <div class="rounded-lg bg-white/5 p-3 text-center">
                <div class="text-2xl font-semibold text-white">
                  0
                </div>
                <div class="mt-1">
                  Admin overhead
                </div>
              </div>
              <div class="rounded-lg bg-white/5 p-3 text-center">
                <div class="text-2xl font-semibold text-white">
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
            <div class="relative">
              <div
                class="absolute -inset-6 blur-3xl opacity-40"
                style="background: radial-gradient(400px 160px at 60% 40%, rgba(43,134,255,.35), transparent 60%);"
              />
              <div class="relative rounded-2xl bg-ink-800/70 ring-1 ring-white/10 shadow-card p-4">
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
                      <div class="w-full h-2 rounded-full bg-white/10">
                        <div
                          class="h-2 rounded-full bg-mint-400"
                          style="width:72%"
                        />
                      </div>
                      <div class="mt-2 text-xs text-ink-300">
                        2 of 3 stints • 28:12 remaining
                      </div>
                    </div>
                    <button class="mt-3 w-full rounded-lg bg-mint-500 hover:bg-mint-600 text-ink-900 font-semibold py-2">
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
                      <div class="w-full h-2 rounded-full bg-white/10">
                        <div
                          class="h-2 rounded-full bg-brand-500"
                          style="width:33%"
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
        <div class="grid lg:grid-cols-3 gap-6">
          <div class="lg:col-span-1">
            <h2 class="text-3xl font-semibold">
              Run your day in stints
            </h2>
            <p class="mt-2 text-ink-200">
              Single active focus, clear goals per project, and progress that resets daily to keep
              momentum.
            </p>
          </div>
          <div class="lg:col-span-2 grid sm:grid-cols-2 gap-5">
            <div class="rounded-2xl bg-white/5 ring-1 ring-white/10 p-5">
              <div class="text-mint-300 font-semibold">
                Stint Management
              </div>
              <p class="mt-2 text-sm text-ink-200">
                Start/stop with one click. Switching projects auto-stops the current stint. Set default
                durations with 5‑minute warnings.
              </p>
            </div>
            <div class="rounded-2xl bg-white/5 ring-1 ring-white/10 p-5">
              <div class="text-brand-300 font-semibold">
                Project Goals
              </div>
              <p class="mt-2 text-sm text-ink-200">
                Create projects with “X of Y stints/day” targets and track progress live across devices.
              </p>
            </div>
            <div class="rounded-2xl bg-white/5 ring-1 ring-white/10 p-5">
              <div class="text-amberx-300 font-semibold">
                Professional Analytics
              </div>
              <p class="mt-2 text-sm text-ink-200">
                GitHub‑style heatmaps, completion rates, and comparison charts for clear weekly reviews.
              </p>
            </div>
            <div class="rounded-2xl bg-white/5 ring-1 ring-white/10 p-5">
              <div class="text-ink-200 font-semibold">
                Privacy & Security
              </div>
              <p class="mt-2 text-sm text-ink-200">
                Supabase Auth with email verification, secure session persistence, and respectful data
                handling.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Social proof strip -->
    <section class="relative">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-2">
        <div class="grid sm:grid-cols-3 gap-4">
          <div class="rounded-xl bg-ink-800 ring-1 ring-white/10 p-5 text-center">
            <div class="text-3xl font-semibold">
              95%
            </div>
            <div class="text-sm text-ink-300 mt-1">
              say it reduced context switching
            </div>
          </div>
          <div class="rounded-xl bg-ink-800 ring-1 ring-white/10 p-5 text-center">
            <div class="text-3xl font-semibold">
              +38%
            </div>
            <div class="text-sm text-ink-300 mt-1">
              avg. weekly completion rate
            </div>
          </div>
          <div class="rounded-xl bg-ink-800 ring-1 ring-white/10 p-5 text-center">
            <div class="text-3xl font-semibold">
              4.9/5
            </div>
            <div class="text-sm text-ink-300 mt-1">
              client confidence on reports
            </div>
          </div>
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
              <p class="mt-3 text-ink-200">
                The Focus Ledger summarizes your weekly stints per client with completion rates and
                distribution—no screenshots, no keystroke logging.
              </p>
              <ul class="mt-5 space-y-3 text-ink-200 text-sm">
                <li class="flex gap-3">
                  <span class="mt-1 h-2.5 w-2.5 rounded-full bg-mint-400" /> Export PDF or share a
                  secure link
                </li>
                <li class="flex gap-3">
                  <span class="mt-1 h-2.5 w-2.5 rounded-full bg-brand-400" /> Consistency heatmap over
                  selectable ranges
                </li>
                <li class="flex gap-3">
                  <span class="mt-1 h-2.5 w-2.5 rounded-full bg-amberx-400" /> Project comparison
                  charts and daily reset
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

        <!-- CTA banner -->
        <div
          id="cta"
          class="mt-8 rounded-2xl bg-brand-500/10 ring-1 ring-brand-400/20 p-6 sm:p-8"
        >
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div class="text-xl font-semibold text-brand-200">
                Hit your target: X of Y stints/day
              </div>
              <div class="text-ink-200 text-sm">
                Set goals per project and watch your completion rate rise.
              </div>
            </div>
            <div class="flex gap-3">
              <a
                href="#"
                class="rounded-lg bg-brand-500 hover:bg-brand-600 px-5 py-2.5 font-semibold shadow-focus"
              >Create account</a>
              <a
                href="#"
                class="rounded-lg bg-white/10 hover:bg-white/20 px-5 py-2.5 font-medium"
              >See report sample</a>
            </div>
          </div>
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
          <h3 class="text-3xl font-semibold">
            Simple pricing for serious focus
          </h3>
          <p class="mt-2 text-ink-200">
            Start for free. Upgrade when you’re ready to ship more deep work.
          </p>
        </div>

        <div class="mt-8 grid md:grid-cols-3 gap-5">
          <!-- Free -->
          <div class="rounded-2xl bg-white/5 ring-1 ring-white/10 p-6">
            <div class="text-sm text-ink-300">
              Starter
            </div>
            <div class="mt-2 text-3xl font-semibold">
              $0
            </div>
            <ul class="mt-4 space-y-2 text-sm text-ink-200">
              <li>• 2 projects</li>
              <li>• Daily targets</li>
              <li>• Sync across devices</li>
            </ul>
            <button class="mt-5 w-full rounded-xl bg-white/90 text-ink-900 hover:bg-white py-2 font-semibold">
              Get started
            </button>
          </div>
          <!-- Pro -->
          <div class="rounded-2xl bg-brand-500/10 ring-1 ring-brand-400/20 p-6 relative overflow-hidden">
            <span class="absolute top-4 right-4 text-xs px-2 py-1 rounded bg-brand-500 text-white">Popular</span>
            <div class="text-sm text-brand-300">
              Professional
            </div>
            <div class="mt-2 text-3xl font-semibold text-white">
              $12<span class="text-base font-normal text-ink-300">/mo</span>
            </div>
            <ul class="mt-4 space-y-2 text-sm text-ink-200">
              <li>• Unlimited projects</li>
              <li>• Focus Ledger exports</li>
              <li>• Priority support</li>
            </ul>
            <button class="mt-5 w-full rounded-xl bg-brand-500 hover:bg-brand-600 py-2 font-semibold shadow-focus">
              Upgrade
            </button>
          </div>
          <!-- Team -->
          <div class="rounded-2xl bg-white/5 ring-1 ring-white/10 p-6">
            <div class="text-sm text-ink-300">
              Team
            </div>
            <div class="mt-2 text-3xl font-semibold">
              $29
            </div>
            <ul class="mt-4 space-y-2 text-sm text-ink-200">
              <li>• Shared reports</li>
              <li>• Roles & permissions</li>
              <li>• SSO (coming soon)</li>
            </ul>
            <button class="mt-5 w-full rounded-xl bg-white/10 hover:bg-white/20 py-2 font-semibold">
              Contact sales
            </button>
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
        <h3 class="text-3xl font-semibold text-center">
          Frequently asked
        </h3>
        <div class="mt-8 grid md:grid-cols-2 gap-5">
          <div class="rounded-xl bg-white/5 ring-1 ring-white/10 p-5">
            <div class="font-medium">
              What makes LifeStint different from time trackers?
            </div>
            <p class="mt-2 text-sm text-ink-200">
              Stints are proactive and enforced. You commit to a focused session; the app prevents
              parallel timers and encourages intentional work.
            </p>
          </div>
          <div class="rounded-xl bg-white/5 ring-1 ring-white/10 p-5">
            <div class="font-medium">
              Do clients see my screen or keystrokes?
            </div>
            <p class="mt-2 text-sm text-ink-200">
              No surveillance. Reports summarize focused sessions per project with optional notes only.
            </p>
          </div>
          <div class="rounded-xl bg-white/5 ring-1 ring-white/10 p-5">
            <div class="font-medium">
              How do daily targets work?
            </div>
            <p class="mt-2 text-sm text-ink-200">
              Set “X of Y stints/day” for each project. Progress resets at midnight to reinforce
              consistent habits.
            </p>
          </div>
          <div class="rounded-xl bg-white/5 ring-1 ring-white/10 p-5">
            <div class="font-medium">
              Is my data secure?
            </div>
            <p class="mt-2 text-sm text-ink-200">
              Supabase Auth with email verification, password recovery, and session persistence. Data is
              isolated per account.
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
definePageMeta({
  layout: false,
})

// SEO
useSeoMeta({
  title: 'LifeStint - Focus Tracking Made Simple',
  description: 'Track your focus sessions and boost productivity with LifeStint.',
})

const user = useSupabaseUser()

const runtimeConfig = useRuntimeConfig()
const appConfig = useAppConfig()

if (import.meta.dev) {
  console.log('runtimeConfig', runtimeConfig)
  console.log('appConfig', appConfig)
}
</script>

<style>
.hero {
    background: radial-gradient(1000px 340px at 20% -10%, rgba(43, 134, 255, .25), transparent 60%),
    radial-gradient(800px 280px at 80% -20%, rgba(21, 63, 143, .25), transparent 60%),
    linear-gradient(180deg, #0b1020 0%, #141b2f 100%);
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
}
</style>
