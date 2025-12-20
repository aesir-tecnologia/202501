# Research: Project List Redesign

**Feature**: 002-project-list-redesign
**Date**: November 14, 2025
**Status**: Complete

---

## Overview

This document consolidates research findings for implementing the Project List redesign. The primary technical challenge is mapping the reference mockup to Nuxt UI 4 components while maintaining strict adherence to the design system.

---

## 1. Design System Component Mapping

### Decision: Use Existing Nuxt UI 4 Components with Custom Layout

**Rationale**: The mockup shows a horizontal card layout that doesn't perfectly match any single Nuxt UI component. We'll compose a custom layout using Nuxt UI primitives (UButton, USwitch, UTooltip, UBadge) combined with Tailwind utility classes.

**Component Breakdown (Mockup → Implementation)**:

| Mockup Element | Implementation | Nuxt UI Component | Notes |
|---|---|---|---|
| 6-dot drag handle | `<Icon name="i-lucide-grip-vertical">` | UIcon | Already implemented correctly |
| Project name | `<h3>` with typography classes | Native HTML + Tailwind | Use `text-base font-medium` |
| Metadata line (stints/day, duration) | `<div>` with icons + text | UIcon + Native | Already implemented with `i-lucide-target` and `i-lucide-timer` |
| Toggle switch | `<USwitch>` | USwitch | Already implemented, uses primary color by default |
| Settings icon | `<UButton icon="i-lucide-settings">` | UButton | Change from `i-lucide-pencil` to `i-lucide-settings` |
| Play button | `<UButton icon="i-lucide-play">` | UButton | Already implemented with success color |
| Pause + Stop buttons | `<UButton>` group | UButton | Replace with separate pause/stop buttons (warning + error colors) |
| "Inactive" badge | `<UBadge>` | UBadge | Already implemented correctly |
| Collapsible section | Native details/summary or button | Native HTML | Already implemented with chevron icon |

**Alternatives Considered**:
- **UCard component**: Rejected because it adds unnecessary semantic structure (header/body/footer slots) when we need a flat horizontal layout
- **Custom styled divs**: Rejected to maintain design system compliance; using semantic Nuxt UI components where possible

---

## 2. Drag-and-Drop Library Integration

### Decision: @vueuse/integrations/useSortable (Already Integrated)

**Rationale**: The current implementation already uses `useSortable` from @vueuse/integrations with SortableJS under the hood. This provides:
- Touch device support (required per spec edge case)
- Visual feedback during drag (animation: 150ms)
- Handle-based dragging (only drag via grip icon)
- Accessibility (keyboard navigation via SortableJS built-in support)

**Current Implementation Review**:
```typescript
useSortable(activeListRef, activeProjects, {
  animation: 150,
  handle: '.drag-handle',
  onStart: () => { isDragging.value = true },
  onEnd: (evt) => { /* reorder logic */ }
})
```

**✅ No changes needed** - Current implementation meets all requirements:
- Drag handle targeting with `.drag-handle` class ✅
- Visual feedback with 150ms animation ✅
- Touch support via SortableJS ✅
- Debounced backend updates (500ms) ✅

**Alternatives Considered**:
- **vue-draggable-next**: Rejected due to larger bundle size and redundant features
- **Custom drag-and-drop**: Rejected due to complexity and accessibility challenges (screen reader support, keyboard navigation)

---

## 3. Progress Monitoring Implementation

### Decision: New Computed Property for Daily Progress (Requires Data Layer Addition)

**Rationale**: The spec requires displaying "X/Y stints" with progress bar for each project. Current implementation has no daily progress tracking.

**Required Changes**:
1. **No database changes** (per constitution check - UI-only redesign)
2. **Computed in component** from stint history:
   ```typescript
   async function getDailyProgress(projectId: string): Promise<{ completed: number, expected: number }> {
     const today = startOfDay(new Date())
     const completedStints = await countStintsForProject(projectId, today)
     const expectedStints = project.expected_daily_stints
     return { completed: completedStints, expected: expectedStints }
   }
   ```

**⚠️ CLARIFICATION NEEDED**: The feature spec requires progress indicators, but there's no existing composable for "count stints by project and date". Two options:

**Option A**: Create new query hook in `useStints.ts`:
```typescript
export function useProjectDailyProgress(projectId: string, date: Date)
```
- Pros: Follows architecture, reusable, cacheable
- Cons: Requires modifying data layer (violates "UI-only" constraint)

**Option B**: Fetch all stints and filter client-side:
```typescript
const allStints = useStintsQuery({ filters: { date: today } })
const progress = computed(() => allStints.value.filter(s => s.project_id === projectId).length)
```
- Pros: No data layer changes, pure UI logic
- Cons: Inefficient for users with many stints, may hit performance budget

**Decision**: **Option B for MVP** (client-side filtering) with migration path to Option A if performance becomes issue. Rationale: Maintains "UI-only" redesign scope, meets performance budget for 2-25 projects with typical daily stint counts (2-10 stints/day = max 250 stints to filter).

**Alternatives Considered**:
- Daily progress stored in database: Rejected (out of scope, requires background jobs)
- No progress indicator: Rejected (violates P2 user story requirement)

---

## 4. Visual Hierarchy and Active Stint Indication

### Decision: Use Semantic Color Tokens + Border + Ring for Active State

**Current Implementation Analysis**:
```vue
:class="[
  isProjectActive(project.id)
    ? 'border-success-500 ring-2 ring-success-500/50 pulsing-active bg-success-50/50 dark:bg-success-950/20'
    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900',
]"
```

**✅ No changes needed** - Current approach already uses:
- Semantic success color (`success-500` for border/ring)
- Proper dark mode variants
- Pulsing animation (accessibility-safe with `@media (prefers-reduced-motion)`)
- High contrast (border + ring + background tint)

**Mockup vs Current**:
- Mockup: Yellow accent for pause/stop buttons
- Current: Success (green) for active stint border
- **Decision**: Keep success color for active stint border (semantic), use warning (yellow) for pause button per mockup intent

**Alternatives Considered**:
- Using arbitrary colors: Rejected (violates design system)
- Using primary color for active state: Rejected (success is more semantically correct for "currently running")

---

## 5. Mobile Responsiveness and Layout Adaptation

### Decision: Stack Cards Vertically, Keep Horizontal Internal Layout

**Rationale**: The spec requires "cards stack vertically with critical info always visible" on ≤768px viewports. Current implementation doesn't have explicit mobile breakpoints.

**Required Changes**:
```vue
<!-- Card wrapper: already block-level, stacks naturally ✅ -->

<!-- Internal layout: needs mobile adaptation -->
<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
  <!-- Drag handle + Project info -->
  <div class="flex items-center gap-3 flex-1 min-w-0">
    <!-- ... -->
  </div>

  <!-- Actions: Stack on mobile, inline on desktop -->
  <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
    <!-- Toggle + Settings + Start Button -->
  </div>
</div>
```

**Breakpoint Strategy**:
- Mobile (320px - 767px): Vertical stack, full-width buttons
- Tablet/Desktop (768px+): Horizontal layout per mockup

**Alternatives Considered**:
- Horizontal scroll on mobile: Rejected (poor UX, violates spec "no horizontal scrolling")
- Hide metadata on mobile: Rejected (violates spec "critical info always visible")

---

## 6. Accessibility Compliance

### Decision: Enhance Existing Accessibility with ARIA Labels and Keyboard Nav

**Current Implementation Strengths**:
- ✅ All icon-only buttons wrapped in `<UTooltip>` (required per design system)
- ✅ `aria-label` on interactive elements
- ✅ Semantic HTML (`<h3>` for project names, `<ul>` for lists)
- ✅ Keyboard navigation via SortableJS built-in support

**Required Enhancements**:
1. **Screen reader announcements** for state changes:
   ```typescript
   // After starting stint
   announceToScreenReader(`Stint started on ${project.name}`)

   // After toggling active
   announceToScreenReader(`${project.name} is now ${newState}`)
   ```

2. **Focus management** for drag-and-drop:
   - Return focus to dragged item after drop
   - Announce new position to screen readers

3. **Progress indicator accessibility**:
   ```vue
   <div role="status" aria-label="Daily progress: 1 of 2 stints completed">
     <!-- Visual progress bar -->
   </div>
   ```

**Implementation Approach**:
- Use `aria-live="polite"` region for announcements
- Nuxt UI components already handle focus management
- Add ARIA labels to progress indicators

**Alternatives Considered**:
- No screen reader announcements: Rejected (violates WCAG 2.1 AA requirement from spec)
- Custom keyboard navigation: Rejected (SortableJS already WCAG-compliant)

---

## 7. Performance Optimization

### Decision: Virtual Scrolling NOT Required, Optimize Rendering Instead

**Rationale**: Project list should remain performant (60fps scrolling) for typical usage. This is well within Vue 3's rendering capabilities without virtualization.

**Optimization Strategy**:
1. **Lazy load inactive projects** (already collapsed by default ✅)
2. **Memoize computed properties** for progress calculations
3. **Debounce drag updates** (already implemented at 500ms ✅)
4. **Minimal re-renders** via `v-memo` for project cards

**Performance Budget Check**:
- 25 projects × ~2KB per card = ~50KB (within spec limit ✅)
- Rendering 25 cards: ~16ms on modern hardware = 60fps ✅
- Progress calculation per project: O(n) where n = daily stints (~10) = negligible

**Alternatives Considered**:
- Virtual scrolling (vue-virtual-scroller): Rejected (overkill for 25 items, adds bundle size)
- Pagination: Rejected (violates spec "all active projects in single scrollable view")

---

## 8. Icon Usage from Mockup

### Decision: Map Mockup Icons to Lucide Equivalents

**Icon Mapping Table**:

| Mockup Icon | Lucide Icon | Component Usage | Notes |
|---|---|---|---|
| 6-dot grid (2×3) | `i-lucide-grip-vertical` | Drag handle | ✅ Already correct |
| Repeat icon | `i-lucide-repeat` or `i-lucide-target` | Expected stints | Current uses `target`, consider changing to `repeat` for semantic accuracy |
| Timer icon | `i-lucide-timer` | Stint duration | ✅ Already correct |
| Gear icon | `i-lucide-settings` | Edit project | Change from `pencil` to `settings` per mockup |
| Pause icon ("||") | `i-lucide-pause` | Pause stint | New - currently shows expanded timer controls |
| Stop square | `i-lucide-square` | Stop stint | New - currently shows expanded timer controls |
| Play triangle | `i-lucide-play` | Start stint | ✅ Already correct |
| Chevron down/right | `i-lucide-chevron-down` / `i-lucide-chevron-right` | Expand inactive | ✅ Already correct |

**Decision**: Change metadata icons to better match mockup semantics:
- `i-lucide-target` → `i-lucide-repeat` for expected daily stints (shows recurrence)
- `i-lucide-pencil` → `i-lucide-settings` for edit action (matches mockup)

**Alternatives Considered**:
- Keep current icons: Rejected (mockup provides better semantic meaning)
- Custom SVG icons: Rejected (violates design system requirement)

---

## 9. Color Semantics for Actions

### Decision: Use Semantic Colors per Design System Guidelines

**Action Button Color Mapping**:

| Action | Color | Variant | Rationale |
|---|---|---|---|
| Start Stint | `success` | `solid` | Positive action, beginning work |
| Pause Stint | `warning` | `solid` | Caution action, temporary stop |
| Stop Stint | `error` | `outline` or `soft` | Destructive action (ends stint), but less severe than delete |
| Edit Project | `neutral` | `ghost` | Neutral utility action |
| Toggle Active | `primary` | N/A (USwitch) | Primary switch uses primary color by default |

**Mockup Color Intent**:
- Yellow pause/stop buttons in mockup → Map to `warning` (pause) and `error` (stop) semantic colors
- Blue toggle in mockup → Maps to `primary` semantic color (current implementation correct)
- Gray play button → Maps to `neutral` when disabled, `success` when enabled (current implementation correct)

**Decision**: Update stint controls to use:
```vue
<UButton color="warning" icon="i-lucide-pause">Pause</UButton>
<UButton color="error" variant="outline" icon="i-lucide-square">Stop</UButton>
```

**Alternatives Considered**:
- Exact hex color matching: Rejected (violates design system strict adherence requirement)
- All buttons same color: Rejected (reduces visual hierarchy and action clarity)

---

## Summary of Required Research Outcomes

### ✅ Resolved Clarifications

1. **Design System Mapping**: Use composition of Nuxt UI primitives, not custom components
2. **Drag-and-Drop**: Existing implementation meets all requirements (no changes)
3. **Progress Monitoring**: Client-side filtering from existing stint queries (no new data layer)
4. **Visual States**: Keep current implementation, add warning/error colors for stint controls
5. **Mobile Responsiveness**: Add `sm:` breakpoint utilities for vertical → horizontal adaptation
6. **Accessibility**: Enhance with aria-live announcements and progress indicator labels
7. **Performance**: No virtual scrolling needed, use v-memo for optimization
8. **Icons**: Update to `repeat` and `settings` per mockup semantics
9. **Colors**: Map mockup intent to semantic color system (warning, error, success, neutral)

### 🔧 Implementation Strategy

**No Data Layer Changes Required**:
- Progress calculated client-side from existing stint queries ✅
- All composables remain unchanged ✅
- Existing mutations (reorder, toggle, start stint) reused ✅

**Component Structure**:
- `ProjectList.vue`: Container with drag-and-drop orchestration (modify existing)
- `ProjectListCard.vue`: Individual project card (NEW - extract from ProjectList.vue)
- `ProjectListSection.vue`: Active/Inactive section wrapper (NEW - optional, improves organization)

**Migration Path**:
1. Extract card layout from ProjectList.vue → ProjectListCard.vue
2. Add responsive breakpoints (mobile-first approach)
3. Update icons per research findings
4. Add progress indicator computed property
5. Manual testing and accessibility verification

---

## Best Practices from Research

1. **Always use semantic colors** - Never arbitrary hex values
2. **Wrap all icon-only buttons in UTooltip** - Required by design system
3. **Use `motion-safe:` prefix** - Respect prefers-reduced-motion for animations
4. **Dark mode for everything** - Always include `dark:` variants for neutral colors
5. **Mobile-first responsive** - Use `sm:`, `md:`, `lg:` breakpoints, not max-width
6. **Component composition over complexity** - Prefer small, focused components
7. **Manual accessibility verification** - Test keyboard navigation and screen reader announcements

---

**Research Completed**: November 14, 2025
**Next Phase**: Phase 1 - Design & Contracts
