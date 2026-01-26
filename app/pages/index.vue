<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

const ANIMATION_CONFIG = {
  OBSERVER_THRESHOLD: 0.1, // Trigger when 10% of element is visible
  OBSERVER_ROOT_MARGIN: '0px 0px -50px 0px', // Trigger 50px before entering viewport
  ANIMATED_SELECTORS: '.fade-up, .fade-in, .scale-in, .slide-in-left, .slide-in-right',
  FLOATING_SELECTOR: '.floating',
  TRIGGER_CLASS: 'animate-in',
  FLOAT_CLASS: 'animate-float',
} as const;

definePageMeta({
  layout: false,
});

useSeoMeta({
  title: 'LifeStint - One Stint at a Time. Zero Context Switching.',
  description: 'Defend your premium rates with credible focus evidence. Project-level tracking with professional reporting—no surveillance, no administrative overhead, just demonstrable work quality for consultants and freelancers.',
  ogTitle: 'LifeStint - Professional Focus Tracking for Consultants',
  ogDescription: 'Single active stint enforcement prevents multitasking. Export professional Focus Ledgers that demonstrate work quality without surveillance metrics.',
  twitterCard: 'summary_large_image',
});

// Auth user - only check on client to avoid hydration mismatch
const user = import.meta.client ? useAuthUser() : null;

let observer: IntersectionObserver | null = null;

onMounted(() => {
  const observerOptions: IntersectionObserverInit = {
    threshold: ANIMATION_CONFIG.OBSERVER_THRESHOLD,
    rootMargin: ANIMATION_CONFIG.OBSERVER_ROOT_MARGIN,
  };

  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add(ANIMATION_CONFIG.TRIGGER_CLASS);
        // Optionally unobserve after animation triggers (performance optimization)
        // observer?.unobserve(entry.target)
      }
    });
  }, observerOptions);

  const animatedElements = document.querySelectorAll(ANIMATION_CONFIG.ANIMATED_SELECTORS);
  animatedElements.forEach((el) => {
    observer?.observe(el);
  });

  const floatingElements = document.querySelectorAll(ANIMATION_CONFIG.FLOATING_SELECTOR);
  floatingElements.forEach((el) => {
    el.classList.add(ANIMATION_CONFIG.FLOAT_CLASS);
  });
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
});
</script>

<template>
  <div class="bg-[#fffbf5] dark:bg-stone-900 text-stone-800 dark:text-stone-50 antialiased">
    <!-- Skip to content link for accessibility -->
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-500 focus:text-white focus:rounded-lg focus:shadow-lg"
    >
      Skip to main content
    </a>

    <!-- Header -->
    <header class="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-[#fffbf5]/80 dark:supports-[backdrop-filter]:bg-stone-900/80 border-b border-stone-200 dark:border-stone-700/50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center">
          <span class="text-xl font-semibold tracking-tight font-serif">
            <span class="text-stone-900 dark:text-white">Life</span><span class="text-orange-600 dark:text-orange-500 italic">Stint</span>
          </span>
        </div>
        <nav
          class="hidden md:flex items-center gap-7 text-sm text-stone-600 dark:text-stone-300"
          aria-label="Main navigation"
        >
          <a
            href="#how"
            class="hover:text-stone-900 dark:hover:text-white transition-colors"
          >How it works</a>
          <a
            href="#analytics"
            class="hover:text-stone-900 dark:hover:text-white transition-colors"
          >Analytics</a>
          <a
            href="#pricing"
            class="hover:text-stone-900 dark:hover:text-white transition-colors"
          >Pricing</a>
          <a
            href="#faq"
            class="hover:text-stone-900 dark:hover:text-white transition-colors"
          >FAQ</a>
        </nav>
        <div class="flex items-center gap-3">
          <UColorModeButton aria-label="Toggle color mode" />
          <ClientOnly>
            <template #default>
              <template v-if="user">
                <NuxtLink
                  to="/dashboard"
                  class="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold shadow-md"
                >Dashboard</NuxtLink>
              </template>
              <template v-else>
                <NuxtLink
                  to="/auth/login"
                  class="hidden sm:inline-block px-3 py-2 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-sm"
                >Sign in</NuxtLink>
                <NuxtLink
                  to="/auth/register"
                  class="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold shadow-md"
                >Start free</NuxtLink>
              </template>
            </template>
            <template #fallback>
              <NuxtLink
                to="/auth/login"
                class="hidden sm:inline-block px-3 py-2 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-sm"
              >Sign in</NuxtLink>
              <NuxtLink
                to="/auth/register"
                class="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold shadow-md"
              >Start free</NuxtLink>
            </template>
          </ClientOnly>
        </div>
      </div>
    </header>

    <!-- Hero -->
    <main id="main-content">
      <section
        class="hero-warm relative overflow-hidden"
        aria-label="Hero section"
      >
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div class="grid lg:grid-cols-12 gap-10 items-center">
            <div class="lg:col-span-6">
              <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700/50 text-sm text-orange-800 dark:text-orange-200 fade-up stagger-1">
                Built for freelancers, consultants, and independents
              </div>
              <h1 class="mt-5 text-4xl sm:text-5xl xl:text-6xl font-semibold leading-tight fade-up stagger-2 font-serif text-stone-900 dark:text-stone-50">
                One stint at a time.<br>Zero context switching.
              </h1>
              <p class="mt-5 text-stone-600 dark:text-stone-300 text-lg max-w-2xl fade-up stagger-3">
                <strong class="text-stone-900 dark:text-white">Defend your premium rates with credible focus
                  evidence.</strong>
                LifeStint combines project-level tracking with professional reporting—no surveillance,
                no administrative overhead, just demonstrable work quality.
              </p>

              <div class="mt-8 fade-up stagger-4">
                <NuxtLink
                  to="/auth/register"
                  class="inline-flex items-center justify-center rounded-xl bg-green-700 hover:bg-green-800 text-white font-semibold px-6 py-3 shadow-md"
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
                </NuxtLink>
              </div>
            </div>

            <!-- Focus Timer Visualization -->
            <div class="lg:col-span-6">
              <div class="relative flex items-center justify-center">
                <!-- Ambient glow -->
                <div
                  class="absolute w-80 h-80 blur-3xl opacity-20 dark:opacity-30 pulse-slow timer-ambient-glow"
                />

                <!-- Timer ring -->
                <div class="relative scale-in">
                  <svg
                    class="w-64 h-64 sm:w-80 sm:h-80 transform -rotate-90"
                    viewBox="0 0 200 200"
                  >
                    <!-- Background ring -->
                    <circle
                      cx="100"
                      cy="100"
                      r="90"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="8"
                      class="text-stone-200 dark:text-stone-700"
                    />
                    <!-- Progress ring -->
                    <circle
                      cx="100"
                      cy="100"
                      r="90"
                      fill="none"
                      stroke="url(#timer-gradient)"
                      stroke-width="8"
                      stroke-linecap="round"
                      stroke-dasharray="565.48"
                      stroke-dashoffset="141.37"
                      class="timer-progress"
                    />
                    <defs>
                      <linearGradient
                        id="timer-gradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop
                          offset="0%"
                          stop-color="#ea580c"
                        />
                        <stop
                          offset="100%"
                          stop-color="#16a34a"
                        />
                      </linearGradient>
                    </defs>
                  </svg>

                  <!-- Center content -->
                  <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <div class="text-5xl sm:text-6xl font-mono font-bold text-stone-900 dark:text-white tabular-nums">
                      28:12
                    </div>
                    <div class="mt-2 text-sm text-stone-500 dark:text-stone-400">
                      Focus time remaining
                    </div>
                    <div class="mt-4 flex items-center gap-2">
                      <span class="relative flex h-3 w-3">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                      </span>
                      <span class="text-sm font-medium text-green-600 dark:text-green-400">In focus</span>
                    </div>
                  </div>
                </div>

                <!-- Floating benefit badges -->
                <div class="absolute -top-2 -right-4 sm:top-4 sm:right-0 floating-badge-1">
                  <div class="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-stone-800 shadow-lg ring-1 ring-stone-200 dark:ring-stone-700">
                    <div class="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/30 grid place-items-center">
                      <svg
                        class="h-4 w-4 text-green-600 dark:text-green-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div class="text-left">
                      <div class="text-xs text-stone-500 dark:text-stone-400">
                        Today
                      </div>
                      <div class="text-sm font-semibold text-stone-900 dark:text-white">
                        2 of 3 stints
                      </div>
                    </div>
                  </div>
                </div>

                <div class="absolute -bottom-2 -left-4 sm:bottom-8 sm:-left-8 floating-badge-2">
                  <div class="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-stone-800 shadow-lg ring-1 ring-stone-200 dark:ring-stone-700">
                    <div class="h-8 w-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 grid place-items-center">
                      <svg
                        class="h-4 w-4 text-orange-600 dark:text-orange-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
                        />
                      </svg>
                    </div>
                    <div class="text-left">
                      <div class="text-xs text-stone-500 dark:text-stone-400">
                        Streak
                      </div>
                      <div class="text-sm font-semibold text-stone-900 dark:text-white">
                        14 days
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- How it works -->
    <section
      id="how"
      class="relative bg-[#fef7ed] dark:bg-stone-800/50"
      aria-labelledby="how-it-works-title"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div class="text-center max-w-3xl mx-auto mb-10">
          <h2
            id="how-it-works-title"
            class="text-3xl sm:text-4xl font-semibold font-serif text-stone-900 dark:text-stone-50"
          >
            Run your day in stints
          </h2>
          <p class="mt-3 text-stone-600 dark:text-stone-300 text-lg">
            Predetermined focused work sessions that prevent multitasking and demonstrate consistent
            productivity to your clients.
          </p>
        </div>

        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div class="rounded-2xl bg-white dark:bg-stone-800 ring-1 ring-stone-200 dark:ring-stone-700 p-6 hover:ring-stone-300 dark:hover:ring-stone-600 transition-colors fade-up stagger-1 hover-lift shadow-sm">
            <div class="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 ring-1 ring-green-200 dark:ring-green-700/50 grid place-items-center text-green-700 dark:text-green-400 rotate-in">
              <svg
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div class="mt-4 font-semibold text-stone-900 dark:text-stone-50">
              Single Active Stint Enforcement
            </div>
            <p class="mt-2 text-sm text-stone-600 dark:text-stone-300">
              Only one active stint at a time across all devices. No multitasking, no context
              switching—just focused work.
            </p>
          </div>

          <div class="rounded-2xl bg-white dark:bg-stone-800 ring-1 ring-stone-200 dark:ring-stone-700 p-6 hover:ring-stone-300 dark:hover:ring-stone-600 transition-colors fade-up stagger-2 hover-lift shadow-sm">
            <div class="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 ring-1 ring-orange-200 dark:ring-orange-700/50 grid place-items-center text-orange-700 dark:text-orange-400 rotate-in">
              <svg
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
            <div class="mt-4 font-semibold text-stone-900 dark:text-stone-50">
              Project-Level Goals
            </div>
            <p class="mt-2 text-sm text-stone-600 dark:text-stone-300">
              Set expected daily stints (1-8 per day) for each project. Track "2 of 3 stints today" with
              visual progress bars.
            </p>
          </div>

          <div class="rounded-2xl bg-white dark:bg-stone-800 ring-1 ring-stone-200 dark:ring-stone-700 p-6 hover:ring-stone-300 dark:hover:ring-stone-600 transition-colors fade-up stagger-3 hover-lift shadow-sm">
            <div class="h-10 w-10 rounded-lg bg-lime-100 dark:bg-lime-900/30 ring-1 ring-lime-200 dark:ring-lime-700/50 grid place-items-center text-lime-700 dark:text-lime-400 rotate-in">
              <svg
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <div class="mt-4 font-semibold text-stone-900 dark:text-stone-50">
              Real-Time Cross-Device Sync
            </div>
            <p class="mt-2 text-sm text-stone-600 dark:text-stone-300">
              Start on desktop, continue on mobile. Active stints sync instantly across all devices with
              conflict resolution.
            </p>
          </div>

          <div class="rounded-2xl bg-white dark:bg-stone-800 ring-1 ring-stone-200 dark:ring-stone-700 p-6 hover:ring-stone-300 dark:hover:ring-stone-600 transition-colors fade-up stagger-4 hover-lift shadow-sm">
            <div class="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 ring-1 ring-amber-200 dark:ring-amber-700/50 grid place-items-center text-amber-700 dark:text-amber-400 rotate-in">
              <svg
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div class="mt-4 font-semibold text-stone-900 dark:text-stone-50">
              Professional Focus Ledger
            </div>
            <p class="mt-2 text-sm text-stone-600 dark:text-stone-300">
              Export CSV reports showing focus consistency per project—client-ready evidence without
              surveillance metrics.
            </p>
          </div>

          <div class="rounded-2xl bg-white dark:bg-stone-800 ring-1 ring-stone-200 dark:ring-stone-700 p-6 hover:ring-stone-300 dark:hover:ring-stone-600 transition-colors fade-up stagger-5 hover-lift shadow-sm">
            <div class="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/30 ring-1 ring-red-200 dark:ring-red-700/50 grid place-items-center text-red-700 dark:text-red-400 rotate-in">
              <svg
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
                />
              </svg>
            </div>
            <div class="mt-4 font-semibold text-stone-900 dark:text-stone-50">
              Streak Tracking & Habit Building
            </div>
            <p class="mt-2 text-sm text-stone-600 dark:text-stone-300">
              Maintain daily streaks with visual heatmaps. 1-day grace period keeps you motivated without
              harsh penalties.
            </p>
          </div>

          <div class="rounded-2xl bg-white dark:bg-stone-800 ring-1 ring-stone-200 dark:ring-stone-700 p-6 hover:ring-stone-300 dark:hover:ring-stone-600 transition-colors fade-up stagger-6 hover-lift shadow-sm">
            <div class="h-10 w-10 rounded-lg bg-stone-100 dark:bg-stone-700 ring-1 ring-stone-200 dark:ring-stone-600 grid place-items-center text-stone-700 dark:text-stone-300 rotate-in">
              <svg
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <div class="mt-4 font-semibold text-stone-900 dark:text-stone-50">
              Zero Administrative Overhead
            </div>
            <p class="mt-2 text-sm text-stone-600 dark:text-stone-300">
              No categories, tags, or pre-work required. Start tracking in under 60 seconds with one-click
              project creation.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Competitive differentiation -->
    <section class="relative">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div class="text-center max-w-3xl mx-auto mb-10 fade-up">
          <h2 class="text-3xl sm:text-4xl font-semibold font-serif text-stone-900 dark:text-stone-50">
            Why not just use a time tracker?
          </h2>
          <p class="mt-3 text-stone-600 dark:text-stone-300 text-lg">
            Traditional time trackers optimize for billing compliance. LifeStint optimizes for demonstrable
            focus quality.
          </p>
        </div>

        <div class="overflow-x-auto rounded-2xl bg-white dark:bg-stone-800 ring-1 ring-stone-200 dark:ring-stone-700 scale-in shadow-sm">
          <table class="w-full text-sm border-collapse min-w-[600px]">
            <thead>
              <tr class="border-b border-stone-200 dark:border-stone-700">
                <th class="text-left p-4 font-medium text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-900/50">
                  Feature
                </th>
                <th class="p-4 text-center bg-stone-50 dark:bg-stone-900/50">
                  <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/30 ring-1 ring-orange-200 dark:ring-orange-700/50">
                    <span class="font-semibold text-orange-700 dark:text-orange-300">LifeStint</span>
                  </div>
                </th>
                <th class="p-4 text-center font-medium text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-900/50">
                  Toggl / Harvest
                </th>
                <th class="p-4 text-center font-medium text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-900/50">
                  Forest / Pomodoro
                </th>
              </tr>
            </thead>
            <tbody class="text-stone-600 dark:text-stone-300">
              <tr class="border-b border-stone-200 dark:border-stone-700">
                <td class="p-4 font-medium text-stone-900 dark:text-stone-50">
                  Single active session enforcement
                </td>
                <td class="p-4 text-center">
                  <svg
                    class="h-5 w-5 text-green-600 dark:text-green-400 mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </td>
                <td class="p-4 text-center">
                  <svg
                    class="h-5 w-5 text-red-500 dark:text-red-400 mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </td>
                <td class="p-4 text-center">
                  <svg
                    class="h-5 w-5 text-red-500 dark:text-red-400 mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </td>
              </tr>
              <tr class="border-b border-stone-200 dark:border-stone-700">
                <td class="p-4 font-medium text-stone-900 dark:text-stone-50">
                  Project-level focus tracking
                </td>
                <td class="p-4 text-center">
                  <svg
                    class="h-5 w-5 text-green-600 dark:text-green-400 mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </td>
                <td class="p-4 text-center">
                  <svg
                    class="h-5 w-5 text-red-500 dark:text-red-400 mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </td>
                <td class="p-4 text-center">
                  <svg
                    class="h-5 w-5 text-red-500 dark:text-red-400 mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </td>
              </tr>
              <tr class="border-b border-stone-200 dark:border-stone-700">
                <td class="p-4 font-medium text-stone-900 dark:text-stone-50">
                  Professional client reports
                </td>
                <td class="p-4 text-center">
                  <svg
                    class="h-5 w-5 text-green-600 dark:text-green-400 mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </td>
                <td class="p-4 text-center text-xs">
                  Timesheets
                </td>
                <td class="p-4 text-center">
                  <svg
                    class="h-5 w-5 text-red-500 dark:text-red-400 mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </td>
              </tr>
              <tr class="border-b border-stone-200 dark:border-stone-700">
                <td class="p-4 font-medium text-stone-900 dark:text-stone-50">
                  Zero administrative overhead
                </td>
                <td class="p-4 text-center">
                  <svg
                    class="h-5 w-5 text-green-600 dark:text-green-400 mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </td>
                <td class="p-4 text-center text-xs">
                  Categories required
                </td>
                <td class="p-4 text-center">
                  <svg
                    class="h-5 w-5 text-green-600 dark:text-green-400 mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </td>
              </tr>
              <tr class="border-b border-stone-200 dark:border-stone-700">
                <td class="p-4 font-medium text-stone-900 dark:text-stone-50">
                  No surveillance metrics
                </td>
                <td class="p-4 text-center">
                  <svg
                    class="h-5 w-5 text-green-600 dark:text-green-400 mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </td>
                <td class="p-4 text-center text-xs">
                  Productivity scores
                </td>
                <td class="p-4 text-center">
                  <svg
                    class="h-5 w-5 text-green-600 dark:text-green-400 mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </td>
              </tr>
              <tr>
                <td class="p-4 font-medium text-stone-900 dark:text-stone-50">
                  Real-time cross-device sync
                </td>
                <td class="p-4 text-center">
                  <svg
                    class="h-5 w-5 text-green-600 dark:text-green-400 mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </td>
                <td class="p-4 text-center">
                  <svg
                    class="h-5 w-5 text-green-600 dark:text-green-400 mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </td>
                <td class="p-4 text-center text-xs">
                  Mobile only
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- Analytics deep dive -->
    <section
      id="analytics"
      class="relative bg-[#fef7ed] dark:bg-stone-800/50"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div class="rounded-3xl bg-white dark:bg-stone-800 ring-1 ring-stone-200 dark:ring-stone-700 p-6 sm:p-10 shadow-lg">
          <div class="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h3 class="text-3xl font-semibold font-serif text-stone-900 dark:text-stone-50">
                Focus evidence clients respect
              </h3>
              <p class="mt-3 text-stone-600 dark:text-stone-300 text-lg">
                Unlike traditional time trackers that feel like surveillance, LifeStint generates
                professional Focus Ledgers that demonstrate work quality and consistency—the credible
                evidence clients need without the Big Brother feeling.
              </p>
              <ul class="mt-6 space-y-3 text-stone-600 dark:text-stone-300">
                <li class="flex gap-3">
                  <svg
                    class="mt-0.5 h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>CSV export with stint history, dates, durations, and completion types</span>
                </li>
                <li class="flex gap-3">
                  <svg
                    class="mt-0.5 h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Weekly summaries showing total stints, focus time, and project breakdown</span>
                </li>
                <li class="flex gap-3">
                  <svg
                    class="mt-0.5 h-5 w-5 text-lime-600 dark:text-lime-400 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Streak tracking and completion rates to prove consistent work habits</span>
                </li>
                <li class="flex gap-3">
                  <svg
                    class="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>No surveillance metrics—just focus sessions and work quality data</span>
                </li>
              </ul>
            </div>
            <!-- Ledger mock -->
            <div>
              <div class="rounded-2xl bg-stone-50 dark:bg-stone-900 p-5 ring-1 ring-stone-200 dark:ring-stone-700 shadow-sm">
                <div class="flex items-center justify-between">
                  <div class="font-medium text-stone-900 dark:text-stone-50">
                    Focus Ledger — Week 32
                  </div>
                  <div class="flex gap-2">
                    <span class="px-2 py-1 rounded bg-stone-200 dark:bg-stone-700 text-xs text-stone-700 dark:text-stone-300">PDF</span>
                    <span class="px-2 py-1 rounded bg-stone-200 dark:bg-stone-700 text-xs text-stone-700 dark:text-stone-300">Share</span>
                  </div>
                </div>
                <div class="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <div class="rounded-lg bg-white dark:bg-stone-800 p-3 ring-1 ring-stone-200 dark:ring-stone-700">
                    <div class="text-stone-500 dark:text-stone-400">
                      Total stints
                    </div>
                    <div class="text-2xl font-semibold mt-1 text-stone-900 dark:text-stone-50">
                      22
                    </div>
                  </div>
                  <div class="rounded-lg bg-white dark:bg-stone-800 p-3 ring-1 ring-stone-200 dark:ring-stone-700">
                    <div class="text-stone-500 dark:text-stone-400">
                      Focused hours
                    </div>
                    <div class="text-2xl font-semibold mt-1 text-stone-900 dark:text-stone-50">
                      15.6
                    </div>
                  </div>
                  <div class="rounded-lg bg-white dark:bg-stone-800 p-3 ring-1 ring-stone-200 dark:ring-stone-700">
                    <div class="text-stone-500 dark:text-stone-400">
                      Completion
                    </div>
                    <div class="text-2xl font-semibold mt-1 text-stone-900 dark:text-stone-50">
                      87%
                    </div>
                  </div>
                </div>
                <div class="mt-4">
                  <div class="text-xs text-stone-500 dark:text-stone-400">
                    Distribution
                  </div>
                  <div class="mt-2 w-full h-2 rounded-full bg-stone-200 dark:bg-stone-700 grid grid-cols-12 overflow-hidden">
                    <div class="bg-orange-500 col-span-5" />
                    <div class="bg-green-500 col-span-4" />
                    <div class="bg-amber-500 col-span-3" />
                  </div>
                  <div class="mt-2 grid grid-cols-3 text-xs text-stone-500 dark:text-stone-400">
                    <div class="flex items-center gap-2">
                      <span class="h-2.5 w-2.5 rounded-full bg-orange-500" /> Client A 42%
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="h-2.5 w-2.5 rounded-full bg-green-500" /> Client B 33%
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="h-2.5 w-2.5 rounded-full bg-amber-500" /> Client C 25%
                    </div>
                  </div>
                </div>
                <div class="mt-5 rounded-xl bg-orange-50 dark:bg-orange-900/20 p-4 text-sm text-stone-700 dark:text-stone-300 ring-1 ring-orange-200 dark:ring-orange-800/50">
                  "We defend retainers with a transparent focus ledger, not a timesheet. Clients love
                  the clarity."
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Use case examples -->
        <div class="mt-14 grid md:grid-cols-2 gap-6">
          <div class="rounded-2xl bg-gradient-to-br from-green-100 dark:from-green-900/20 to-orange-100 dark:to-orange-900/20 ring-1 ring-green-200 dark:ring-green-800/50 p-6 slide-in-left hover-lift">
            <div class="flex gap-4">
              <div class="h-12 w-12 rounded-full bg-green-200 dark:bg-green-900/50 ring-2 ring-green-300 dark:ring-green-700 flex-shrink-0 grid place-items-center text-2xl bounce-subtle">
                👩‍💻
              </div>
              <div>
                <div class="font-semibold text-lg text-stone-900 dark:text-stone-50">
                  "I used to lose 2 hours daily to context switching"
                </div>
                <p class="mt-2 text-sm text-stone-600 dark:text-stone-300">
                  "Now I complete 14 stints per week with 87% consistency. My clients see the ledger
                  and trust I'm focused on their work—no questions asked."
                </p>
                <div class="mt-3 text-xs text-stone-500 dark:text-stone-400">
                  — Sarah, Independent Software Consultant
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-2xl bg-gradient-to-br from-orange-100 dark:from-orange-900/20 to-amber-100 dark:to-amber-900/20 ring-1 ring-orange-200 dark:ring-orange-800/50 p-6 slide-in-right hover-lift">
            <div class="flex gap-4">
              <div class="h-12 w-12 rounded-full bg-orange-200 dark:bg-orange-900/50 ring-2 ring-orange-300 dark:ring-orange-700 flex-shrink-0 grid place-items-center text-2xl bounce-subtle">
                🎯
              </div>
              <div>
                <div class="font-semibold text-lg text-stone-900 dark:text-stone-50">
                  "Finally, evidence that doesn't feel like surveillance"
                </div>
                <p class="mt-2 text-sm text-stone-600 dark:text-stone-300">
                  "I send weekly Focus Ledgers to my retainer clients. They appreciate the
                  transparency without feeling like I'm being monitored. It's helped me justify my
                  rates."
                </p>
                <div class="mt-3 text-xs text-stone-500 dark:text-stone-400">
                  — Marcus, Design Agency Remote Worker
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- CTA banner -->
        <div
          id="cta"
          class="mt-10 rounded-2xl bg-[#fffbf5] dark:bg-stone-800 border-3 border-orange-500 dark:border-orange-600 p-8 sm:p-10 text-center scale-in"
        >
          <h3 class="text-3xl font-bold text-stone-900 dark:text-stone-50 font-serif">
            Start demonstrating your focus quality
          </h3>
          <p class="mt-3 text-stone-600 dark:text-stone-300 text-lg max-w-2xl mx-auto">
            Join consultants and freelancers who defend their premium rates with credible focus evidence—not
            surveillance.
          </p>
          <div class="mt-6">
            <NuxtLink
              to="/auth/register"
              class="inline-flex items-center justify-center rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold px-8 py-3.5 shadow-lg transition-all"
            >
              Start your first stint — Free
            </NuxtLink>
          </div>
          <p class="mt-4 text-sm text-stone-500 dark:text-stone-400">
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
          <h3 class="text-3xl sm:text-4xl font-semibold font-serif text-stone-900 dark:text-stone-50">
            Simple pricing for serious focus
          </h3>
          <p class="mt-3 text-stone-600 dark:text-stone-300 text-lg">
            Generous free tier to get started. Upgrade when you need unlimited projects and professional
            exports.
          </p>
        </div>

        <div class="mt-10 pt-4 grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <!-- Free -->
          <div class="rounded-2xl bg-white dark:bg-stone-800 ring-1 ring-stone-200 dark:ring-stone-700 p-7 fade-up stagger-1 hover-lift shadow-sm">
            <div class="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
              Free
            </div>
            <div class="mt-3 flex items-baseline gap-2">
              <span class="text-4xl font-bold text-stone-900 dark:text-stone-50">$0</span>
              <span class="text-stone-500 dark:text-stone-400">forever</span>
            </div>
            <p class="mt-3 text-sm text-stone-600 dark:text-stone-300">
              Perfect for trying out LifeStint and managing a couple of key projects.
            </p>
            <ul class="mt-6 space-y-3 text-sm text-stone-600 dark:text-stone-300">
              <li class="flex gap-3">
                <svg
                  class="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span><strong class="text-stone-900 dark:text-stone-50">2 active projects</strong></span>
              </li>
              <li class="flex gap-3">
                <svg
                  class="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Unlimited stints per day</span>
              </li>
              <li class="flex gap-3">
                <svg
                  class="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Real-time sync across all devices</span>
              </li>
              <li class="flex gap-3">
                <svg
                  class="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Basic analytics (90 days)</span>
              </li>
              <li class="flex gap-3">
                <svg
                  class="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Streak tracking & heatmaps</span>
              </li>
            </ul>
            <NuxtLink
              to="/auth/register"
              class="mt-6 block w-full text-center rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-100 py-3 font-semibold transition-colors"
            >
              Get started free
            </NuxtLink>
          </div>
          <!-- Pro -->
          <div class="rounded-2xl bg-gradient-to-br from-orange-100 dark:from-orange-900/30 to-green-100 dark:to-green-900/30 ring-2 ring-orange-300 dark:ring-orange-700/50 p-7 relative fade-up stagger-2 hover-lift">
            <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-orange-600 text-white text-xs font-semibold">
              MOST POPULAR
            </div>
            <div class="text-sm font-medium text-orange-700 dark:text-orange-300 uppercase tracking-wide">
              Pro
            </div>
            <div class="mt-3 flex items-baseline gap-2">
              <span class="text-4xl font-bold text-stone-900 dark:text-stone-50">$12</span>
              <span class="text-stone-500 dark:text-stone-400">/month</span>
            </div>
            <p class="mt-3 text-sm text-stone-600 dark:text-stone-300">
              For consultants who need to manage multiple clients and demonstrate consistent work quality.
            </p>
            <ul class="mt-6 space-y-3 text-sm text-stone-600 dark:text-stone-300">
              <li class="flex gap-3">
                <svg
                  class="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span><strong class="text-stone-900 dark:text-stone-50">Unlimited active projects</strong></span>
              </li>
              <li class="flex gap-3">
                <svg
                  class="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span><strong class="text-stone-900 dark:text-stone-50">Unlimited Focus Ledger CSV exports</strong></span>
              </li>
              <li class="flex gap-3">
                <svg
                  class="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Unlimited analytics history</span>
              </li>
              <li class="flex gap-3">
                <svg
                  class="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Advanced analytics & charts</span>
              </li>
              <li class="flex gap-3">
                <svg
                  class="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Custom branding on exports</span>
              </li>
              <li class="flex gap-3">
                <svg
                  class="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Priority email support</span>
              </li>
            </ul>
            <NuxtLink
              to="/auth/register"
              class="mt-6 block w-full text-center rounded-xl bg-orange-600 hover:bg-orange-700 py-3 font-semibold shadow-md transition-colors text-white"
            >
              Start Pro trial
            </NuxtLink>
            <p class="mt-3 text-center text-xs text-stone-500 dark:text-stone-400">
              14-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section
      id="faq"
      class="relative bg-[#fef7ed] dark:bg-stone-800/50"
    >
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <h3 class="text-3xl sm:text-4xl font-semibold text-center font-serif text-stone-900 dark:text-stone-50">
          Frequently asked questions
        </h3>
        <div class="mt-10 grid md:grid-cols-2 gap-6">
          <div class="rounded-xl bg-white dark:bg-stone-800 ring-1 ring-stone-200 dark:ring-stone-700 p-6 hover:ring-stone-300 dark:hover:ring-stone-600 transition-colors fade-up stagger-1 hover-lift shadow-sm">
            <div class="font-semibold text-lg text-stone-900 dark:text-stone-50">
              What makes LifeStint different from Toggl or Harvest?
            </div>
            <p class="mt-3 text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              Unlike traditional time trackers that require categories and tags, LifeStint focuses on
              <strong class="text-stone-900 dark:text-stone-50">focus quality, not billing hours</strong>.
              We technically enforce single active sessions to prevent multitasking and provide
              professional reports that demonstrate work consistency—not surveillance data.
            </p>
          </div>
          <div class="rounded-xl bg-white dark:bg-stone-800 ring-1 ring-stone-200 dark:ring-stone-700 p-6 hover:ring-stone-300 dark:hover:ring-stone-600 transition-colors fade-up stagger-2 hover-lift shadow-sm">
            <div class="font-semibold text-lg text-stone-900 dark:text-stone-50">
              Do clients see my screen or keystrokes?
            </div>
            <p class="mt-3 text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              <strong class="text-stone-900 dark:text-stone-50">Absolutely not.</strong> No surveillance, no screenshots, no
              keystroke logging. Focus Ledger exports show only stint dates,
              durations, project names, and optional notes—clean, professional evidence of consistent work
              habits.
            </p>
          </div>
          <div class="rounded-xl bg-white dark:bg-stone-800 ring-1 ring-stone-200 dark:ring-stone-700 p-6 hover:ring-stone-300 dark:hover:ring-stone-600 transition-colors fade-up stagger-3 hover-lift shadow-sm">
            <div class="font-semibold text-lg text-stone-900 dark:text-stone-50">
              How does the single active stint enforcement work?
            </div>
            <p class="mt-3 text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              You can only have one active stint at a time across all your devices. Starting a new stint
              requires ending the current one. This <strong class="text-stone-900 dark:text-stone-50">technical guardrail
                prevents context switching</strong>
              and ensures genuine focused work—something Pomodoro apps and time trackers don't enforce.
            </p>
          </div>
          <div class="rounded-xl bg-white dark:bg-stone-800 ring-1 ring-stone-200 dark:ring-stone-700 p-6 hover:ring-stone-300 dark:hover:ring-stone-600 transition-colors fade-up stagger-4 hover-lift shadow-sm">
            <div class="font-semibold text-lg text-stone-900 dark:text-stone-50">
              What happens if I need to pause or stop early?
            </div>
            <p class="mt-3 text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              Pause anytime for breaks—pause time is tracked separately. Stop manually if you finish early
              and optionally add notes.
              Auto-completion happens after 4 hours max (prevents accidental overnight runs). Interrupted
              stints are preserved for analytics but don't count toward daily goals.
            </p>
          </div>
          <div class="rounded-xl bg-white dark:bg-stone-800 ring-1 ring-stone-200 dark:ring-stone-700 p-6 hover:ring-stone-300 dark:hover:ring-stone-600 transition-colors fade-up stagger-5 hover-lift shadow-sm">
            <div class="font-semibold text-lg text-stone-900 dark:text-stone-50">
              How do daily targets and streaks work?
            </div>
            <p class="mt-3 text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              Set expected daily stints (1-8) per project. Track "2 of 3 stints today" with visual
              progress. Progress resets at midnight in your timezone.
              <strong class="text-stone-900 dark:text-stone-50">Streaks track consecutive days</strong> with at least one
              completed stint, with a 1-day grace period.
            </p>
          </div>
          <div class="rounded-xl bg-white dark:bg-stone-800 ring-1 ring-stone-200 dark:ring-stone-700 p-6 hover:ring-stone-300 dark:hover:ring-stone-600 transition-colors fade-up stagger-6 hover-lift shadow-sm">
            <div class="font-semibold text-lg text-stone-900 dark:text-stone-50">
              Does it work offline and across devices?
            </div>
            <p class="mt-3 text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              Yes! Start on desktop, continue on mobile—real-time sync keeps everything in sync. Offline
              stint tracking works with smart conflict resolution.
              Timer runs in background tabs using Web Workers for accuracy, and server-side
              auto-completion ensures stints complete even if your browser closes.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-stone-200 dark:border-stone-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-stone-500 dark:text-stone-400">
          <div class="flex items-center gap-2">
            <span class="font-semibold tracking-tight font-serif">
              <span class="text-stone-900 dark:text-white">Life</span><span class="text-orange-600 dark:text-orange-500 italic">Stint</span>
            </span>
            <span>© {{ new Date().getFullYear() }}</span>
          </div>
          <nav class="flex items-center gap-5">
            <NuxtLink
              to="/legal/privacy"
              class="hover:text-stone-900 dark:hover:text-white"
            >
              Privacy
            </NuxtLink>
            <NuxtLink
              to="/legal/terms"
              class="hover:text-stone-900 dark:hover:text-white"
            >
              Terms
            </NuxtLink>
            <a
              href="mailto:hello@lifestint.com"
              class="hover:text-stone-900 dark:hover:text-white"
            >
              Contact
            </a>
          </nav>
        </div>
      </div>
    </footer>
  </div>
</template>

<style>
/* ============================================================================
   Animation Configuration & Timing
   ============================================================================
   Standard durations for consistency:
   - Fast: 0.3s (hover effects)
   - Normal: 0.8s (scroll animations, standard)
   - Slow: 3s (ambient loops like pulse/shimmer)
   - Very Slow: 6s (floating, gradient shifts)
   ============================================================================ */

/* Hero background with warm theme */
.hero-warm {
    background: radial-gradient(1000px 340px at 20% -10%, rgba(194, 65, 12, 0.1), transparent 60%),
    radial-gradient(800px 280px at 80% -20%, rgba(22, 101, 52, 0.08), transparent 60%);
    animation: subtle-pulse 6s ease-in-out infinite;
}

:root.dark .hero-warm {
    background: radial-gradient(1000px 340px at 20% -10%, rgba(234, 88, 12, 0.2), transparent 60%),
    radial-gradient(800px 280px at 80% -20%, rgba(34, 197, 94, 0.1), transparent 60%);
}

/* Timer visualization ambient glow - uses design system tokens */
.timer-ambient-glow {
    background: radial-gradient(circle, var(--accent-primary-glow), transparent 70%);
}

@keyframes subtle-pulse {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.95;
    }
}

@keyframes badge-glow {
    0%, 100% {
        box-shadow: 0 0 0 rgb(var(--color-primary-500) / 0);
    }
    50% {
        box-shadow: 0 0 20px rgb(var(--color-primary-500) / 0.3);
    }
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
.stagger-1 {
    transition-delay: 0.1s;
}

.stagger-2 {
    transition-delay: 0.2s;
}

.stagger-3 {
    transition-delay: 0.3s;
}

.stagger-4 {
    transition-delay: 0.4s;
}

.stagger-5 {
    transition-delay: 0.5s;
}

.stagger-6 {
    transition-delay: 0.6s;
}

/* Floating animation */
.floating {
    animation: float 6s ease-in-out infinite;
}

@keyframes float {
    0%, 100% {
        transform: translateY(0px);
    }
    50% {
        transform: translateY(-20px);
    }
}

/* Floating badge animations */
.floating-badge-1 {
    animation: float-badge-1 4s ease-in-out infinite;
}

.floating-badge-2 {
    animation: float-badge-2 5s ease-in-out infinite;
}

@keyframes float-badge-1 {
    0%, 100% {
        transform: translate(0, 0);
    }
    50% {
        transform: translate(-8px, -12px);
    }
}

@keyframes float-badge-2 {
    0%, 100% {
        transform: translate(0, 0);
    }
    50% {
        transform: translate(8px, -10px);
    }
}

/* Timer progress animation */
.timer-progress {
    animation: timer-fill 1.5s ease-out forwards;
}

@keyframes timer-fill {
    from {
        stroke-dashoffset: 565.48;
    }
    to {
        stroke-dashoffset: 141.37;
    }
}

/* Pulse animation for active elements */
.pulse-slow {
    animation: pulse-glow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse-glow {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: .7;
    }
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
    0% {
        left: -100%;
    }
    100% {
        left: 100%;
    }
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
    animation: gradient-shift 6s ease infinite;
}

@keyframes gradient-shift {
    0%, 100% {
        background-position: 0% 50%;
    }
    50% {
        background-position: 100% 50%;
    }
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
    animation: progress-fill 0.8s ease-out forwards;
}

@keyframes progress-fill {
    from {
        width: 0;
    }
    to {
        width: var(--progress-width, 100%);
    }
}

/* Bounce attention animation */
.bounce-subtle {
    animation: bounce-subtle 3s infinite;
}

@keyframes bounce-subtle {
    0%, 100% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(-5px);
    }
}

/* Glow effect on hover */
.glow-on-hover {
    position: relative;
    transition: all 0.3s ease;
}

.glow-on-hover:hover {
    box-shadow: 0 0 20px rgb(var(--color-primary-500) / 0.4),
    0 0 40px rgb(var(--color-primary-500) / 0.2);
}

/* ============================================================================
   Utility: Screen reader only
   ============================================================================ */
.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
}

.sr-only.focus\:not-sr-only:focus {
    position: static;
    width: auto;
    height: auto;
    padding: inherit;
    margin: inherit;
    overflow: visible;
    clip: auto;
    white-space: normal;
}
</style>
