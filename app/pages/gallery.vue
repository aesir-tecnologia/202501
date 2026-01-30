<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import type { ProjectRow } from '~/lib/supabase/projects';
import type { StintRow } from '~/lib/supabase/stints';
import type { DailyProgress } from '~/types/progress';

definePageMeta({
  layout: 'component-gallery',
  ssr: false,
});

useSeoMeta({
  title: 'Component Gallery - LifeStint',
  description: 'Visual showcase of all LifeStint Vue components',
});

const mockProjects: ProjectRow[] = [
  {
    id: '1',
    user_id: 'demo-user',
    name: 'Client Alpha',
    expected_daily_stints: 3,
    custom_stint_duration: 45,
    is_active: true,
    sort_order: 0,
    color_tag: 'orange',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    archived_at: null,
  },
  {
    id: '2',
    user_id: 'demo-user',
    name: 'Project Beta',
    expected_daily_stints: 2,
    custom_stint_duration: 30,
    is_active: true,
    sort_order: 1,
    color_tag: 'green',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    archived_at: null,
  },
  {
    id: '3',
    user_id: 'demo-user',
    name: 'Internal Tasks',
    expected_daily_stints: 1,
    custom_stint_duration: null,
    is_active: false,
    sort_order: 2,
    color_tag: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    archived_at: null,
  },
];

const mockActiveStint: StintRow = {
  id: 'stint-1',
  project_id: '1',
  user_id: 'demo-user',
  status: 'active',
  started_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  paused_at: null,
  ended_at: null,
  planned_duration: 45,
  paused_duration: 0,
  actual_duration: null,
  completion_type: null,
  notes: null,
  attributed_date: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockPausedStint: StintRow = {
  id: 'stint-2',
  project_id: '2',
  user_id: 'demo-user',
  status: 'paused',
  started_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  paused_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  ended_at: null,
  planned_duration: 30,
  paused_duration: 120,
  actual_duration: null,
  completion_type: null,
  notes: null,
  attributed_date: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockDailyProgress: Map<string, DailyProgress> = new Map([
  ['1', { projectId: '1', expected: 3, completed: 2, percentage: 66, isOverAchieving: false, isMet: false }],
  ['2', { projectId: '2', expected: 2, completed: 2, percentage: 100, isOverAchieving: false, isMet: true }],
  ['3', { projectId: '3', expected: 1, completed: 0, percentage: 0, isOverAchieving: false, isMet: false }],
]);

const projectAlpha = computed(() => mockProjects[0]!);
const projectBeta = computed(() => mockProjects[1]!);
const projectInternal = computed(() => mockProjects[2]!);
const progressAlpha = computed(() => mockDailyProgress.get('1')!);
const progressBeta = computed(() => mockDailyProgress.get('2')!);
const progressInternal = computed(() => mockDailyProgress.get('3')!);

const showCreateModal = ref(false);
const showEditModal = ref(false);
const showArchiveModal = ref(false);
const showCompletionModal = ref(false);
const showConflictDialog = ref(false);

const activeSection = ref<string | null>('project-list-card');

const sections = [
  { id: 'project-list-card', label: 'ProjectListCard', icon: 'i-lucide-layout-list' },
  { id: 'streak-banner', label: 'StreakBanner', icon: 'i-lucide-flame' },
  { id: 'stint-timer', label: 'StintTimer', icon: 'i-lucide-clock' },
  { id: 'project-form', label: 'ProjectForm', icon: 'i-lucide-file-edit' },
  { id: 'modals', label: 'Modals & Dialogs', icon: 'i-lucide-panel-top' },
];

function scrollToSection(id: string) {
  activeSection.value = id;
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function noop() {}

const mockExistingStint = {
  id: 'stint-1',
  projectName: 'Client Alpha',
  remainingSeconds: 1800,
};
</script>

<template>
  <ClientOnly>
    <div class="max-w-7xl mx-auto px-6 py-8">
      <div class="grid lg:grid-cols-[240px_1fr] gap-8">
        <!-- Sidebar Navigation -->
        <aside class="hidden lg:block">
          <nav class="sticky top-24 space-y-1">
            <button
              v-for="section in sections"
              :key="section.id"
              class="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-sm font-medium transition-all"
              :class="activeSection === section.id
                ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-white'"
              @click="scrollToSection(section.id)"
            >
              <UIcon
                :name="section.icon"
                class="w-4 h-4"
              />
              {{ section.label }}
            </button>
          </nav>
        </aside>

        <!-- Main Content -->
        <main class="space-y-12">
          <!-- ProjectListCard Section -->
          <section
            id="project-list-card"
            class="scroll-mt-24"
          >
            <div class="mb-6">
              <h2 class="text-2xl font-bold font-serif text-stone-900 dark:text-white mb-2">
                ProjectListCard
              </h2>
              <p class="text-stone-600 dark:text-stone-400">
                The main project card component showing project details, daily progress, and stint controls.
              </p>
            </div>

            <div class="space-y-6">
              <!-- Active project with running stint -->
              <div class="space-y-2">
                <div class="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  Active project with running stint
                </div>
                <ul class="space-y-4">
                  <ProjectListCard
                    :project="projectAlpha"
                    :active-stint="mockActiveStint"
                    :paused-stint="null"
                    :daily-progress="progressAlpha"
                    :is-draggable="true"
                    @edit="noop"
                    @toggle-active="noop"
                    @start-stint="noop"
                    @pause-stint="noop"
                    @resume-stint="noop"
                    @complete-stint="noop"
                  />
                </ul>
              </div>

              <!-- Project with paused stint -->
              <div class="space-y-2">
                <div class="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  Project with paused stint
                </div>
                <ul class="space-y-4">
                  <ProjectListCard
                    :project="projectBeta"
                    :active-stint="null"
                    :paused-stint="mockPausedStint"
                    :daily-progress="progressBeta"
                    :is-draggable="true"
                    @edit="noop"
                    @toggle-active="noop"
                    @start-stint="noop"
                    @pause-stint="noop"
                    @resume-stint="noop"
                    @complete-stint="noop"
                  />
                </ul>
              </div>

              <!-- Inactive project -->
              <div class="space-y-2">
                <div class="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  Inactive project
                </div>
                <ul class="space-y-4">
                  <ProjectListCard
                    :project="projectInternal"
                    :active-stint="null"
                    :paused-stint="null"
                    :daily-progress="progressInternal"
                    :is-draggable="false"
                    @edit="noop"
                    @toggle-active="noop"
                    @start-stint="noop"
                    @pause-stint="noop"
                    @resume-stint="noop"
                    @complete-stint="noop"
                  />
                </ul>
              </div>
            </div>
          </section>

          <!-- StreakBanner Section -->
          <section
            id="streak-banner"
            class="scroll-mt-24"
          >
            <div class="mb-6">
              <h2 class="text-2xl font-bold font-serif text-stone-900 dark:text-white mb-2">
                StreakBanner
              </h2>
              <p class="text-stone-600 dark:text-stone-400">
                Displays the user's current streak and longest streak. Note: This component fetches live data,
                so the demo shows a static mockup.
              </p>
            </div>

            <div class="space-y-4">
              <!-- Static mockup of StreakBanner -->
              <div class="rounded-2xl bg-gradient-to-br from-orange-600 to-green-600 text-white shadow-lg p-6">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="p-2 rounded-lg bg-white/20">
                      <UIcon
                        name="i-lucide-flame"
                        class="h-8 w-8"
                      />
                    </div>
                    <div>
                      <div class="text-3xl font-bold">
                        14
                      </div>
                      <div class="text-sm opacity-90">
                        days streak
                      </div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm opacity-75">
                      Longest
                    </div>
                    <div class="text-xl font-semibold">
                      21 days
                    </div>
                  </div>
                </div>
              </div>

              <!-- At-risk variant -->
              <div class="rounded-2xl bg-gradient-to-br from-orange-600 to-green-600 text-white shadow-lg ring-2 ring-yellow-400 p-6">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="p-2 rounded-lg bg-white/20">
                      <UIcon
                        name="i-lucide-flame"
                        class="h-8 w-8"
                      />
                    </div>
                    <div>
                      <div class="text-3xl font-bold">
                        7
                      </div>
                      <div class="text-sm opacity-90">
                        days streak
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 text-yellow-200">
                    <UIcon
                      name="i-lucide-alert-triangle"
                      class="h-5 w-5"
                    />
                    <span class="text-sm font-medium">At risk - complete a stint today!</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- StintTimer Section -->
          <section
            id="stint-timer"
            class="scroll-mt-24"
          >
            <div class="mb-6">
              <h2 class="text-2xl font-bold font-serif text-stone-900 dark:text-white mb-2">
                StintTimer
              </h2>
              <p class="text-stone-600 dark:text-stone-400">
                Timer display component showing active, paused, and completed states.
                Note: Timer state is managed globally, so this shows static mockups.
              </p>
            </div>

            <div class="grid md:grid-cols-3 gap-6">
              <!-- Active state mockup -->
              <div class="rounded-2xl bg-white dark:bg-stone-800 ring-1 ring-stone-200 dark:ring-stone-700 p-8 text-center">
                <div class="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-4">
                  Active State
                </div>
                <div class="flex flex-col items-center gap-2">
                  <div class="text-sm font-medium text-green-600 dark:text-green-400">
                    Active
                  </div>
                  <div class="font-mono text-4xl font-bold tabular-nums text-stone-900 dark:text-white">
                    28:45
                  </div>
                </div>
              </div>

              <!-- Paused state mockup -->
              <div class="rounded-2xl bg-white dark:bg-stone-800 ring-1 ring-stone-200 dark:ring-stone-700 p-8 text-center">
                <div class="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-4">
                  Paused State
                </div>
                <div class="flex flex-col items-center gap-2">
                  <div class="text-sm font-medium text-amber-600 dark:text-amber-400">
                    Paused
                  </div>
                  <div class="font-mono text-2xl font-bold tabular-nums text-stone-900 dark:text-white">
                    15:30
                  </div>
                  <div class="text-xs text-stone-500 dark:text-stone-400">
                    Paused for 2m 15s
                  </div>
                </div>
              </div>

              <!-- Completed state mockup -->
              <div class="rounded-2xl bg-white dark:bg-stone-800 ring-1 ring-stone-200 dark:ring-stone-700 p-8 text-center">
                <div class="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-4">
                  Completed Animation
                </div>
                <div class="bg-green-50 dark:bg-green-950 rounded-lg p-4">
                  <div class="text-4xl mb-2">
                    🎉
                  </div>
                  <div class="text-lg font-semibold text-green-700 dark:text-green-300">
                    Stint Complete!
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- ProjectForm Section -->
          <section
            id="project-form"
            class="scroll-mt-24"
          >
            <div class="mb-6">
              <h2 class="text-2xl font-bold font-serif text-stone-900 dark:text-white mb-2">
                ProjectForm
              </h2>
              <p class="text-stone-600 dark:text-stone-400">
                Form component for creating and editing projects with validation.
              </p>
            </div>

            <div class="grid md:grid-cols-2 gap-6">
              <div class="rounded-2xl bg-white dark:bg-stone-800 ring-1 ring-stone-200 dark:ring-stone-700 p-6">
                <div class="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-4">
                  Create Mode
                </div>
                <ProjectForm
                  mode="create"
                  @submit="noop"
                  @cancel="noop"
                />
              </div>

              <div class="rounded-2xl bg-white dark:bg-stone-800 ring-1 ring-stone-200 dark:ring-stone-700 p-6">
                <div class="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-4">
                  Edit Mode
                </div>
                <ProjectForm
                  :project="projectAlpha"
                  mode="edit"
                  @submit="noop"
                  @cancel="noop"
                />
              </div>
            </div>
          </section>

          <!-- Modals & Dialogs Section -->
          <section
            id="modals"
            class="scroll-mt-24"
          >
            <div class="mb-6">
              <h2 class="text-2xl font-bold font-serif text-stone-900 dark:text-white mb-2">
                Modals & Dialogs
              </h2>
              <p class="text-stone-600 dark:text-stone-400">
                Modal components for various actions like creating, editing, archiving projects and handling conflicts.
              </p>
            </div>

            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                class="rounded-2xl bg-white dark:bg-stone-800 ring-1 ring-stone-200 dark:ring-stone-700 p-6 text-left hover:ring-orange-300 dark:hover:ring-orange-500/50 transition-all group"
                @click="showCreateModal = true"
              >
                <div class="flex items-center gap-3 mb-2">
                  <div class="p-2 rounded-lg bg-green-100 dark:bg-green-500/20">
                    <UIcon
                      name="i-lucide-plus"
                      class="w-5 h-5 text-green-600 dark:text-green-400"
                    />
                  </div>
                  <span class="font-semibold text-stone-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    ProjectCreateModal
                  </span>
                </div>
                <p class="text-sm text-stone-500 dark:text-stone-400">
                  Modal for creating new projects
                </p>
              </button>

              <button
                class="rounded-2xl bg-white dark:bg-stone-800 ring-1 ring-stone-200 dark:ring-stone-700 p-6 text-left hover:ring-orange-300 dark:hover:ring-orange-500/50 transition-all group"
                @click="showEditModal = true"
              >
                <div class="flex items-center gap-3 mb-2">
                  <div class="p-2 rounded-lg bg-orange-100 dark:bg-orange-500/20">
                    <UIcon
                      name="i-lucide-pencil"
                      class="w-5 h-5 text-orange-600 dark:text-orange-400"
                    />
                  </div>
                  <span class="font-semibold text-stone-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    ProjectEditModal
                  </span>
                </div>
                <p class="text-sm text-stone-500 dark:text-stone-400">
                  Modal for editing existing projects
                </p>
              </button>

              <button
                class="rounded-2xl bg-white dark:bg-stone-800 ring-1 ring-stone-200 dark:ring-stone-700 p-6 text-left hover:ring-orange-300 dark:hover:ring-orange-500/50 transition-all group"
                @click="showArchiveModal = true"
              >
                <div class="flex items-center gap-3 mb-2">
                  <div class="p-2 rounded-lg bg-amber-100 dark:bg-amber-500/20">
                    <UIcon
                      name="i-lucide-archive"
                      class="w-5 h-5 text-amber-600 dark:text-amber-400"
                    />
                  </div>
                  <span class="font-semibold text-stone-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    ProjectArchiveModal
                  </span>
                </div>
                <p class="text-sm text-stone-500 dark:text-stone-400">
                  Modal for archiving projects
                </p>
              </button>

              <button
                class="rounded-2xl bg-white dark:bg-stone-800 ring-1 ring-stone-200 dark:ring-stone-700 p-6 text-left hover:ring-orange-300 dark:hover:ring-orange-500/50 transition-all group"
                @click="showCompletionModal = true"
              >
                <div class="flex items-center gap-3 mb-2">
                  <div class="p-2 rounded-lg bg-green-100 dark:bg-green-500/20">
                    <UIcon
                      name="i-lucide-check-circle"
                      class="w-5 h-5 text-green-600 dark:text-green-400"
                    />
                  </div>
                  <span class="font-semibold text-stone-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    StintCompletionModal
                  </span>
                </div>
                <p class="text-sm text-stone-500 dark:text-stone-400">
                  Modal for completing stints with notes
                </p>
              </button>

              <button
                class="rounded-2xl bg-white dark:bg-stone-800 ring-1 ring-stone-200 dark:ring-stone-700 p-6 text-left hover:ring-orange-300 dark:hover:ring-orange-500/50 transition-all group"
                @click="showConflictDialog = true"
              >
                <div class="flex items-center gap-3 mb-2">
                  <div class="p-2 rounded-lg bg-orange-100 dark:bg-orange-500/20">
                    <UIcon
                      name="i-lucide-git-branch"
                      class="w-5 h-5 text-orange-600 dark:text-orange-400"
                    />
                  </div>
                  <span class="font-semibold text-stone-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    StintConflictDialog
                  </span>
                </div>
                <p class="text-sm text-stone-500 dark:text-stone-400">
                  Dialog for handling stint conflicts
                </p>
              </button>
            </div>

            <!-- Modal instances (hidden until triggered) -->
            <ProjectCreateModal
              v-model:open="showCreateModal"
              @created="noop"
            />

            <ProjectEditModal
              v-if="showEditModal"
              v-model:open="showEditModal"
              :project="projectAlpha"
              @updated="noop"
              @archive="noop"
            />

            <ProjectArchiveModal
              v-if="showArchiveModal"
              v-model:open="showArchiveModal"
              :project="projectAlpha"
              @archived="noop"
            />

            <StintCompletionModal
              v-model:open="showCompletionModal"
              stint-id="mock-stint-id"
              @cancel="noop"
              @confirm="noop"
            />

            <StintConflictDialog
              v-model:open="showConflictDialog"
              :existing-stint="mockExistingStint"
              new-project-name="Project Beta"
              @resolve="noop"
            />
          </section>
        </main>
      </div>
    </div>

    <template #fallback>
      <div class="max-w-7xl mx-auto px-6 py-8">
        <div class="flex items-center justify-center min-h-[400px]">
          <div class="text-center">
            <UIcon
              name="i-lucide-loader-2"
              class="w-8 h-8 animate-spin text-orange-500 mx-auto mb-4"
            />
            <p class="text-stone-500 dark:text-stone-400">
              Loading component gallery...
            </p>
          </div>
        </div>
      </div>
    </template>
  </ClientOnly>
</template>

<style scoped>
.tabular-nums {
  font-variant-numeric: tabular-nums;
}
</style>
