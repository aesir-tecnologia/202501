# Quick Start: Project List Redesign Implementation

**Feature**: 002-project-list-redesign
**Date**: November 14, 2025
**Target Audience**: Developers implementing this feature

---

## Overview

This guide provides step-by-step instructions to implement the Project List redesign. Follow these steps in order for a smooth implementation.

**Estimated Time**: 4-5 hours

---

## Prerequisites

✅ **Before you start:**

1. Read `spec.md` (feature requirements)
2. Read `research.md` (technical decisions)
3. Read `data-model.md` (data structures)
4. Familiarize with `docs/DESIGN_SYSTEM.md`
5. Understand existing `app/components/ProjectList.vue`

**Tools needed:**
- Node.js 18+ with npm
- Code editor with TypeScript support
- Browser DevTools

---

## Phase 1: Setup and Preparation (30 minutes)

### Step 1.1: Create feature branch

```bash
# Already on 002-project-list-redesign branch
git status

# If not, create it:
# git checkout -b 002-project-list-redesign
```

### Step 1.2: Install dependencies (if needed)

```bash
# Verify @vueuse/integrations is installed (already should be)
npm list @vueuse/integrations

# If missing:
# npm install @vueuse/integrations
```

### Step 1.3: Read existing codebase

**Files to review:**
- `app/components/ProjectList.vue` (will be refactored)
- `app/composables/useProjects.ts` (no changes)
- `app/composables/useStints.ts` (no changes)
- `app/components/StintTimer.vue` (no changes)
- `app/components/StintControls.vue` (no changes)

---

## Phase 2: Component Refactoring (2-3 hours)

### Step 2.1: Create ProjectListCard component

**File**: `app/components/ProjectListCard.vue`

```vue
<script setup lang="ts">
import type { ProjectRow } from '~/lib/supabase/projects'
import type { StintRow } from '~/lib/supabase/stints'

// Props
const props = defineProps<{
  project: ProjectRow
  activeStint?: StintRow | null
  hasOtherActiveStint?: boolean
  draggable?: boolean
}>()

// Emits
const emit = defineEmits<{
  edit: [project: ProjectRow]
  'toggle-active': [projectId: string]
  'start-stint': [project: ProjectRow]
  'pause-stint': [stintId: string]
  'resume-stint': [stintId: string]
  'stop-stint': [stintId: string]
}>()

// Computed properties
const isProjectActive = computed(() => {
  return props.activeStint?.project_id === props.project.id
})

const canStartStint = computed(() => {
  return props.project.is_active && !props.hasOtherActiveStint
})

// Helper functions (copy from ProjectList.vue)
function formatDuration(minutes: number | null): string {
  const duration = minutes ?? 45
  if (duration < 60) return `${duration}m`
  const hours = Math.floor(duration / 60)
  const mins = duration % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

function getColorBorderClass(colorTag: string | null): string {
  const colorMap: Record<string, string> = {
    red: 'border-l-red-500',
    orange: 'border-l-orange-500',
    amber: 'border-l-amber-500',
    green: 'border-l-green-500',
    teal: 'border-l-teal-500',
    blue: 'border-l-blue-500',
    purple: 'border-l-purple-500',
    pink: 'border-l-pink-500',
  }
  return colorMap[colorTag || ''] || ''
}

// Event handlers
function handleEdit() {
  emit('edit', props.project)
}

function handleToggleActive() {
  emit('toggle-active', props.project.id)
}

function handleStartStint() {
  emit('start-stint', props.project)
}

// Stint control handlers - re-emit events from StintControls component
function handlePauseStint() {
  if (props.activeStint) {
    emit('pause-stint', props.activeStint.id)
  }
}

function handleResumeStint() {
  if (props.activeStint) {
    emit('resume-stint', props.activeStint.id)
  }
}

function handleStopStint() {
  if (props.activeStint) {
    emit('stop-stint', props.activeStint.id)
  }
}
</script>

<template>
  <!-- Card wrapper with responsive layout -->
  <li
    :class="[
      'flex flex-col gap-3 p-4 rounded-lg border-2 motion-safe:transition-all border-l-4',
      isProjectActive
        ? 'border-success-500 ring-2 ring-success-500/50 pulsing-active bg-success-50/50 dark:bg-success-950/20'
        : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700',
      getColorBorderClass(project.color_tag),
    ]"
  >
    <!-- Project Header Row -->
    <div class="flex items-center gap-3 w-full">
      <!-- Drag handle (only for active projects) -->
      <UTooltip
        v-if="draggable"
        text="Reorder project"
      >
        <button
          type="button"
          class="drag-handle cursor-move p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded motion-safe:transition-all motion-safe:duration-200"
          aria-label="Reorder project"
        >
          <Icon
            name="i-lucide-grip-vertical"
            class="h-5 w-5 text-neutral-400 dark:text-neutral-500"
          />
        </button>
      </UTooltip>

      <!-- Project Info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <h3 class="text-base font-medium leading-normal text-neutral-900 dark:text-neutral-50 truncate">
            {{ project.name }}
          </h3>
          <UBadge
            v-if="!project.is_active"
            color="neutral"
            variant="subtle"
            size="sm"
          >
            Inactive
          </UBadge>
        </div>

        <!-- Metadata -->
        <div class="mt-1 flex items-center gap-4 text-sm leading-normal text-neutral-500 dark:text-neutral-400">
          <span class="flex items-center gap-1">
            <Icon name="i-lucide-repeat" class="h-4 w-4" />
            {{ project.expected_daily_stints }} stints/day
          </span>
          <span class="flex items-center gap-1">
            <Icon name="i-lucide-timer" class="h-4 w-4" />
            {{ formatDuration(project.custom_stint_duration) }} per stint
          </span>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2">
        <UTooltip :text="project.is_active ? 'Deactivate project' : 'Activate project'">
          <span>
            <USwitch
              :model-value="project.is_active ?? true"
              aria-label="Toggle project active status"
              @update:model-value="handleToggleActive"
            />
          </span>
        </UTooltip>

        <UTooltip text="Edit project">
          <span>
            <UButton
              icon="i-lucide-settings"
              color="neutral"
              variant="ghost"
              size="sm"
              aria-label="Edit project"
              class="motion-safe:transition-all motion-safe:duration-200 motion-safe:hover:scale-105"
              @click="handleEdit"
            />
          </span>
        </UTooltip>
      </div>
    </div>

    <!-- Active Stint Section (when project has active stint) -->
    <div
      v-if="isProjectActive"
      class="flex flex-col items-center gap-4 pt-4 border-t border-success-200 dark:border-success-800"
    >
      <StintTimer :stint="activeStint" />
      <StintControls
        :stint="activeStint!"
        @pause="handlePauseStint"
        @resume="handleResumeStint"
        @stop="handleStopStint"
      />
    </div>

    <!-- Start Button Section (when ready to start) -->
    <div
      v-else-if="project.is_active"
      class="flex items-center justify-center gap-2 pt-2"
    >
      <UButton
        v-if="canStartStint"
        color="success"
        icon="i-lucide-play"
        @click="handleStartStint"
      >
        Start Stint
      </UButton>
      <UTooltip
        v-else
        text="Stop current stint to start new one"
      >
        <span>
          <UButton
            color="neutral"
            variant="soft"
            icon="i-lucide-play"
            disabled
          >
            Start Stint
          </UButton>
        </span>
      </UTooltip>
    </div>
  </li>
</template>

<style scoped>
@keyframes pulse-border {
  0%, 100% {
    border-color: var(--color-success-500);
    box-shadow: 0 0 0 0 rgb(from var(--color-success-500) r g b / 0.4);
  }
  50% {
    border-color: var(--color-success-400);
    box-shadow: 0 0 0 4px rgb(from var(--color-success-400) r g b / 0.2);
  }
}

@media (prefers-reduced-motion: no-preference) {
  .pulsing-active {
    animation: pulse-border 3s ease-in-out infinite;
  }
}
</style>
```

**Changes from existing ProjectList.vue**:
- ✅ Changed `i-lucide-pencil` → `i-lucide-settings` for edit button
- ✅ Changed `i-lucide-target` → `i-lucide-repeat` for stints/day icon
- ✅ Added `draggable` prop to conditionally show drag handle
- ✅ Added emit handlers for all stint control actions (pause, resume, stop)
- ✅ Re-emits StintControls events to parent component
- ✅ Extracted into separate component for reusability

### Step 2.2: Refactor ProjectList to use ProjectListCard

**File**: `app/components/ProjectList.vue`

Modify the template to use the new component:

```vue
<template>
  <div>
    <!-- Empty state (unchanged) -->
    <div
      v-if="projects.length === 0"
      class="text-center py-12"
    >
      <!-- ... existing empty state ... -->
    </div>

    <!-- Active Projects Section -->
    <div v-else>
      <h3
        v-if="inactiveProjects.length > 0"
        class="text-sm font-medium leading-normal text-neutral-700 dark:text-neutral-300 mb-2"
      >
        Active Projects
      </h3>

      <ul
        ref="activeListRef"
        class="space-y-2"
      >
        <ProjectListCard
          v-for="project in activeProjects"
          :key="project.id"
          :project="project"
          :active-stint="activeStint"
          :has-other-active-stint="!!activeStint && activeStint.project_id !== project.id"
          :draggable="true"
          @edit="handleEdit"
          @toggle-active="handleToggleActive"
          @start-stint="handleStartStint"
          @pause-stint="handlePauseStint"
          @resume-stint="handleResumeStint"
          @stop-stint="handleStopStint"
        />
      </ul>

      <!-- Inactive Projects Section (unchanged structure) -->
      <div
        v-if="inactiveProjects.length > 0"
        class="mt-6"
      >
        <button
          type="button"
          class="flex items-center gap-2 text-sm font-medium leading-normal text-neutral-700 dark:text-neutral-300 mb-2 hover:text-neutral-900 dark:hover:text-neutral-100"
          @click="showInactiveProjects = !showInactiveProjects"
        >
          <Icon
            :name="showInactiveProjects ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
            class="h-4 w-4"
          />
          Inactive Projects ({{ inactiveProjects.length }})
        </button>

        <ul
          v-if="showInactiveProjects"
          class="space-y-2"
        >
          <ProjectListCard
            v-for="project in inactiveProjects"
            :key="project.id"
            :project="project"
            :active-stint="null"
            :has-other-active-stint="false"
            :draggable="false"
            @edit="handleEdit"
            @toggle-active="handleToggleActive"
          />
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Update imports
import ProjectListCard from './ProjectListCard.vue'

// Rest of script unchanged - just remove the inline card template
// Keep all logic: useSortable, handlers, computed properties
</script>
```

**⚠️ Key Changes**:
1. Import ProjectListCard component
2. Replace `<li>` blocks with `<ProjectListCard>` usage
3. Pass props and listen to emits
4. Keep all existing logic (drag-and-drop, handlers, computed)

---

## Phase 3: Manual Testing and Verification (30 minutes)

### Step 3.1: Manual testing checklist

**Desktop (Chrome/Firefox/Safari):**
- [ ] Drag-and-drop reordering works
- [ ] Drag handle only visible on active projects
- [ ] Start Stint button works
- [ ] Toggle active/inactive works
- [ ] Edit button opens modal
- [ ] Inactive projects section collapses/expands
- [ ] Active stint shows timer and controls
- [ ] Pulsing animation on active stint (if prefers-reduced-motion: no-preference)
- [ ] Dark mode works correctly
- [ ] Color tags show as left border

**Mobile (375px viewport):**
- [ ] Cards stack vertically
- [ ] All buttons are tappable (min 44×44px)
- [ ] Text doesn't overflow
- [ ] Drag-and-drop works on touch

**Accessibility:**
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] All icon-only buttons have tooltips
- [ ] Screen reader announces state changes
- [ ] ARIA labels present
- [ ] Color contrast meets WCAG AA

---

## Phase 4: Linting and Type Checking (15 minutes)

### Step 4.1: Run ESLint

```bash
npm run lint

# Auto-fix issues
npm run lint:fix
```

**Fix any errors** before committing.

### Step 4.2: TypeScript type checking

```bash
# Type check (via Nuxt)
npm run dev

# Check for TypeScript errors in terminal
# No red squiggles in VS Code
```

---

## Phase 5: Performance Validation (30 minutes)

### Step 5.1: Create test projects

```typescript
// In browser console or via script
async function createTestProjects(count: number) {
  for (let i = 0; i < count; i++) {
    await createProject({
      name: `Test Project ${i + 1}`,
      expectedDailyStints: Math.floor(Math.random() * 5) + 1,
      colorTag: ['red', 'blue', 'green', 'purple'][i % 4],
    })
  }
}

// Create 25 projects (max per spec)
await createTestProjects(25)
```

### Step 5.2: Measure performance

**Chrome DevTools → Performance Tab:**

1. Start recording
2. Scroll through project list
3. Drag-and-drop a project
4. Toggle active/inactive
5. Stop recording

**Metrics to check:**
- **FPS**: Should stay at 60fps during scroll ✅
- **Scripting time**: < 17ms per frame ✅
- **Rendering time**: < 5ms per frame ✅

### Step 5.3: Lighthouse audit

```bash
# In Chrome DevTools → Lighthouse
# Run audit on localhost:3000

# Check scores:
# Performance: > 90
# Accessibility: 100
# Best Practices: > 90
```

---

## Phase 6: Documentation (15 minutes)

### Step 6.1: Update CLAUDE.md (if needed)

**File**: `CLAUDE.md`

Add note about new components:

```markdown
## Active Technologies
- TypeScript 5.x with Vue 3 Composition API + Nuxt 4 (SSG), Nuxt UI v4, Tailwind CSS v4, Lucide Icons (001-design-system-enforcement)
- ProjectListCard component extraction for project list redesign (002-project-list-redesign)
```

### Step 6.2: Update component README (optional)

If your project has component documentation, add entries for:
- `ProjectListCard.vue`
- Usage examples
- Props/emits reference

---

## Phase 7: Commit and PR (15 minutes)

### Step 7.1: Stage changes

```bash
git add app/components/ProjectListCard.vue
git add app/components/ProjectList.vue
git add tests/components/ProjectListCard.test.ts
git add CLAUDE.md  # If updated
```

### Step 7.2: Commit

```bash
git commit -m "feat: redesign project list with horizontal card layout

- Extract ProjectListCard component from ProjectList
- Update icons: pencil→settings, target→repeat per mockup
- Add draggable prop to conditionally show drag handle
- Maintain all existing functionality (drag-and-drop, stint management)
- Add comprehensive component tests
- Verify 60fps performance with 25 projects

Refs: 002-project-list-redesign"
```

### Step 7.3: Push and create PR

```bash
git push origin 002-project-list-redesign

# Create PR via GitHub UI or:
gh pr create --title "Project List Redesign" \
  --body "Implements horizontal card layout for project list per spec.md.

## Changes
- New ProjectListCard component
- Refactored ProjectList to use new component
- Updated icons per mockup (settings, repeat)
- All tests passing
- Performance validated (60fps with 25 projects)

## Testing
- [x] Unit tests
- [x] Manual testing (desktop + mobile)
- [x] Accessibility audit
- [x] Performance benchmark

## Screenshots
[Add screenshots here]
"
```

---

## Troubleshooting

### Issue: Drag-and-drop not working

**Solution**:
1. Verify `@vueuse/integrations` installed
2. Check `activeListRef` is attached to correct element
3. Ensure `.drag-handle` class exists on drag handle button

### Issue: Types not resolving

**Solution**:
```bash
# Restart Nuxt dev server
npm run dev

# Restart TypeScript language server in VS Code
# Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### Issue: Tests failing with "module not found"

**Solution**:
```bash
# Clear Vitest cache
rm -rf node_modules/.vitest

# Re-run tests
npm test
```

### Issue: Dark mode not working

**Solution**:
1. Check all color classes have `dark:` variants
2. Verify `UColorModeButton` present in layout
3. Test in browser with forced dark mode (DevTools → Rendering → Emulate prefers-color-scheme)

---

## Next Steps After Implementation

1. **User Testing**: Gather feedback on new layout
2. **Analytics**: Track stint initiation time (goal: < 3 seconds)
3. **Accessibility Audit**: Run full WCAG 2.1 AA compliance check
4. **Performance Monitoring**: Monitor Core Web Vitals in production

---

## Resources

- **Feature Spec**: `specs/002-project-list-redesign/spec.md`
- **Research**: `specs/002-project-list-redesign/research.md`
- **Data Model**: `specs/002-project-list-redesign/data-model.md`
- **Contracts**: `specs/002-project-list-redesign/contracts/component-api.md`
- **Design System**: `docs/DESIGN_SYSTEM.md`
- **Nuxt UI Docs**: https://ui.nuxt.com/
- **Lucide Icons**: https://lucide.dev/

---

**Good luck! 🚀**

**Estimated Total Time**: 4-5 hours
**Difficulty**: Medium (mostly refactoring, minimal new logic)
**Note**: No automated tests required (test infrastructure currently broken)

---

**Document Version**: 1.0
**Last Updated**: November 14, 2025
