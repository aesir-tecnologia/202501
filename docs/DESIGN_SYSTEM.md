# LifeStint Design System

## Overview

LifeStint uses the **"Focused Warmth + Deep Focus Hybrid"** design system—a modern, component-based system built on **Nuxt UI v4** with **Tailwind CSS v4**. The design evokes warmth, focus, and natural productivity through terracotta/orange primaries, forest green accents, and warm stone neutrals.

**Design Philosophy:** Warm, natural tones that reinforce the "focused work" metaphor. The palette draws from earth tones—terracotta, forest greens, and warm cream backgrounds—creating an environment that feels grounded and conducive to deep work.

---

## Framework & Tools

- **UI Framework**: Nuxt UI v4 (`@nuxt/ui`) built on Reka UI primitives
- **CSS Framework**: Tailwind CSS v4 (via `@theme` directive)
- **Design Tokens**: CSS custom properties in `app/assets/css/tokens.css`
- **Icons**: Lucide Icons (`@iconify-json/lucide`, bundled locally)
- **Build Tool**: Nuxt 4.2.1
- **Styling Approach**: Utility-first CSS with semantic CSS variables

### Tailwind CSS v4 Configuration

This project uses **Tailwind CSS v4** with the new CSS-first approach:

- **No `tailwind.config.ts` file** - Tailwind v4 eliminates the traditional config file
- **Inline `@theme` directive** - All customization is done directly in CSS
- **Location:** Custom tokens in `app/assets/css/tokens.css`, main styles in `app/assets/css/main.css`

**Example from `main.css`:**
```css
@import "tailwindcss";
@import "@nuxt/ui";
@import "./tokens.css";

@theme {
  --font-serif: 'Fraunces', Georgia, serif;
  --font-sans: 'Instrument Sans', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

### Nuxt UI Color Configuration

Nuxt UI components use semantic color mapping in `app/app.config.ts`:

```typescript
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'orange',     // Terracotta/orange for primary actions
      secondary: 'green',    // Forest green for secondary elements
      neutral: 'stone',      // Warm stone for backgrounds/text
      success: 'green',      // Positive confirmations
      warning: 'amber',      // Warnings and attention
      error: 'red',          // Errors and destructive actions
    },
  },
})
```

---

## CSS Design Tokens

All design tokens are defined in `app/assets/css/tokens.css` with semantic CSS variables that adapt to light and dark modes.

### Token Reference

#### Typography Tokens
```css
--font-serif: 'Fraunces', Georgia, serif;      /* Headings */
--font-sans: 'Instrument Sans', system-ui, sans-serif;  /* Body */
--font-mono: 'JetBrains Mono', monospace;      /* Timers, code */
```

#### Radius Tokens
```css
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 20px;
--radius-xl: 28px;
--radius-full: 100px;
```

#### Transition Tokens
```css
--transition-fast: 0.15s ease;
--transition-medium: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 0.6s cubic-bezier(0.16, 1, 0.3, 1);
```

#### Light Mode Colors
```css
/* Backgrounds */
--bg-primary: #fffbf5;        /* Warm cream - main background */
--bg-secondary: #fef7ed;      /* Warm linen - sections */
--bg-tertiary: #fdf4e7;       /* Warm buff - subtle backgrounds */
--bg-card: #ffffff;           /* Pure white - cards */

/* Text */
--text-primary: #292524;      /* Stone-800 equivalent */
--text-secondary: #57534e;    /* Stone-600 equivalent */
--text-muted: #a8a29e;        /* Stone-400 equivalent */

/* Accents */
--accent-primary: #c2410c;    /* Terracotta - main accent */
--accent-primary-hover: #9a3412;  /* Darker terracotta */
--accent-secondary: #166534;  /* Forest green */
--accent-tertiary: #84cc16;   /* Lime/sage */
--accent-amber: #d97706;      /* Amber for warnings */
--accent-danger: #dc2626;     /* Red for errors */

/* Borders */
--border-light: #e7e5e4;      /* Stone-200 */
--border-medium: #d6d3d1;     /* Stone-300 */

/* Shadows */
--shadow-soft: 0 4px 20px rgba(120, 113, 108, 0.08);
--shadow-medium: 0 8px 30px rgba(120, 113, 108, 0.12);
--shadow-glow: 0 0 40px rgba(194, 65, 12, 0.15);
--shadow-card: 0 1px 3px rgba(120, 113, 108, 0.06), 0 8px 24px rgba(120, 113, 108, 0.08);
```

#### Dark Mode Colors
```css
/* Backgrounds */
--bg-primary: #1c1917;        /* Warm charcoal */
--bg-secondary: #1f1b18;      /* Warm dark */
--bg-tertiary: #231f1b;       /* Elevated dark */
--bg-card: #292524;           /* Card surface */

/* Text */
--text-primary: #fafaf9;      /* Stone-50 */
--text-secondary: #d6d3d1;    /* Stone-300 */
--text-muted: #78716c;        /* Stone-500 */

/* Accents */
--accent-primary: #ea580c;    /* Brighter orange for dark mode */
--accent-primary-hover: #f97316;  /* Orange-500 */
--accent-secondary: #22c55e;  /* Brighter green */
--accent-tertiary: #a3e635;   /* Lime-400 */
--accent-amber: #fbbf24;      /* Amber-400 */
--accent-danger: #f87171;     /* Red-400 for visibility */

/* Borders */
--border-light: #3d3835;
--border-medium: #4a4543;

/* Shadows */
--shadow-soft: 0 4px 20px rgba(0, 0, 0, 0.3);
--shadow-medium: 0 8px 30px rgba(0, 0, 0, 0.4);
--shadow-glow: 0 0 60px rgba(234, 88, 12, 0.2);
--shadow-card: 0 1px 3px rgba(0, 0, 0, 0.2), 0 8px 24px rgba(0, 0, 0, 0.25);
```

### Using CSS Tokens

```vue
<!-- Using tokens in components -->
<div class="bg-[var(--bg-primary)] text-[var(--text-primary)]">
  <h1 style="color: var(--accent-primary)">Welcome</h1>
</div>

<!-- Utility classes from tokens.css -->
<div class="bg-warm-cream font-serif timer-glow shadow-warm">
  Content with warm styling
</div>
```

---

## Color System

### Semantic Color Palette

The design system uses warm, earthy tones mapped to semantic purposes:

| Semantic Role | Light Mode | Dark Mode | Tailwind Class | Purpose |
|---------------|------------|-----------|----------------|---------|
| **Primary** | Terracotta `#c2410c` | Orange `#ea580c` | `orange-700/600` | Main CTAs, active states, brand |
| **Secondary** | Forest `#166534` | Green `#22c55e` | `green-800/500` | Secondary actions, success states |
| **Tertiary** | Sage `#84cc16` | Lime `#a3e635` | `lime-500/400` | Accents, highlights |
| **Background** | Warm Cream `#fffbf5` | Stone-900 `#1c1917` | Custom | Page backgrounds |
| **Card** | White `#ffffff` | Stone-800 `#292524` | Custom | Card surfaces |
| **Text Primary** | Stone-800 `#292524` | Stone-50 `#fafaf9` | `stone-800/50` | Main text |
| **Text Secondary** | Stone-600 `#57534e` | Stone-300 `#d6d3d1` | `stone-600/300` | Secondary text |
| **Text Muted** | Stone-400 `#a8a29e` | Stone-500 `#78716c` | `stone-400/500` | Muted text |
| **Warning** | Amber `#d97706` | Amber `#fbbf24` | `amber-600/400` | Warnings, pause states |
| **Error/Danger** | Red `#dc2626` | Red `#f87171` | `red-600/400` | Errors, destructive actions |
| **Border Light** | Stone-200 `#e7e5e4` | Custom `#3d3835` | `stone-200` | Light borders |
| **Border Medium** | Stone-300 `#d6d3d1` | Custom `#4a4543` | `stone-300` | Medium borders |

### Color Usage in Components

```vue
<!-- Nuxt UI components: Use semantic colors -->
<UButton color="primary">Start Stint</UButton>
<UButton color="secondary">View Analytics</UButton>
<UButton color="error">Delete Project</UButton>
<UAlert color="warning" title="Stint paused" />

<!-- Custom styling with tokens -->
<div class="bg-[var(--bg-primary)] border-[var(--border-light)]">
  <h2 class="text-[var(--accent-primary)] font-serif">Project Name</h2>
</div>

<!-- Direct Tailwind with stone palette -->
<p class="text-stone-700 dark:text-stone-300">Secondary text</p>
```

### Background Guidelines

**Light Mode:**
- **Page Background**: `bg-[#fffbf5]` or `bg-warm-cream` - warm cream
- **Section Background**: `bg-[#fef7ed]` or `bg-warm-linen` - warm linen
- **Card Background**: `bg-white` - pure white for contrast

**Dark Mode:**
- **Page Background**: `bg-stone-900` or `bg-[#1c1917]` - warm charcoal
- **Section Background**: `bg-stone-800/50` - subtle elevation
- **Card Background**: `bg-stone-800` or `bg-[#292524]` - elevated surface

```vue
<!-- Page background pattern -->
<div class="min-h-screen bg-[#fffbf5] dark:bg-stone-900">
  <!-- Content -->
</div>

<!-- Card pattern -->
<div class="bg-white dark:bg-stone-800 rounded-xl shadow-warm">
  <!-- Card content -->
</div>
```

---

## Typography

### Font Families

The design system uses a distinctive typographic hierarchy with three font families:

| Font | Variable | Usage | Characteristics |
|------|----------|-------|-----------------|
| **Fraunces** | `--font-serif` | Headings, display text | Warm, friendly serif with optical sizing |
| **Instrument Sans** | `--font-sans` | Body text, UI elements | Clean, modern sans-serif |
| **JetBrains Mono** | `--font-mono` | Timers, code, numbers | Monospace with ligatures |

```css
--font-serif: 'Fraunces', Georgia, serif;
--font-sans: 'Instrument Sans', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

### Typography Scale

| Level | Size | Class | Usage |
|-------|------|-------|-------|
| **Display** | 48-72px | `text-5xl`–`text-7xl` | Hero text, large timers |
| **Heading 1** | 30px | `text-3xl` | Page titles |
| **Heading 2** | 24px | `text-2xl` | Section titles |
| **Heading 3** | 20px | `text-xl` | Subsection titles |
| **Heading 4** | 18px | `text-lg` | Card titles |
| **Body Large** | 16px | `text-base` | Default body text |
| **Body Small** | 14px | `text-sm` | Secondary text, captions |
| **Caption** | 12px | `text-xs` | Labels, fine print |

### Font Weights

- **Normal**: `font-normal` (400) - Body text
- **Medium**: `font-medium` (500) - Labels, emphasis
- **Semibold**: `font-semibold` (600) - Headings, buttons
- **Bold**: `font-bold` (700) - Strong emphasis

### Typography Patterns

**Page Title (Fraunces Serif):**
```vue
<h1 class="font-serif text-3xl font-bold text-stone-800 dark:text-stone-50">
  Dashboard
</h1>
```

**Section Header:**
```vue
<h2 class="font-serif text-2xl font-semibold text-stone-800 dark:text-stone-100">
  Active Projects
</h2>
```

**Card Title:**
```vue
<h3 class="text-lg font-semibold text-stone-900 dark:text-stone-50">
  Project Details
</h3>
```

**Body Text:**
```vue
<p class="text-base text-stone-700 dark:text-stone-300">
  Your primary content with comfortable reading size.
</p>
```

**Secondary Text:**
```vue
<p class="text-sm text-stone-600 dark:text-stone-400">
  Additional context or helper text.
</p>
```

**Timer Display (Monospace):**
```vue
<!-- Under 1 hour: MM:SS -->
<div class="font-mono text-5xl font-semibold tabular-nums text-stone-900 dark:text-stone-50">
  25:00
</div>
<!-- 1 hour or more: H:MM:SS -->
<div class="font-mono text-5xl font-semibold tabular-nums text-stone-900 dark:text-stone-50">
  1:30:00
</div>
```

**Label:**
```vue
<label class="text-sm font-medium text-stone-700 dark:text-stone-300">
  Project Name
</label>
```

---

## Time & Duration Formatting

Consistent time display across the application follows these human-readable patterns:

### Countdown Timer (Active Session)

| Condition | Format | Example |
|-----------|--------|---------|
| Under 1 hour | `MM:SS` | `45:23`, `25:00` |
| 1 hour or more | `H:MM:SS` | `1:29:59`, `2:00:00` |

**Rationale:** Hiding hours when under 1 hour reduces visual clutter for the common case (focus sessions are typically under 60 minutes), while still providing precise time awareness when needed for longer sessions.

### Duration Display (Metadata Labels)

| Condition | Format | Example |
|-----------|--------|---------|
| Under 1 hour | `Xm` | `45m` |
| 1 hour or more | `Xh Ym` | `1h 30m` |

**Rationale:** Human-readable format with explicit units is more scannable than colon-separated values for static duration labels.

### Clock Times

Clock times (start time, end time) use the browser's locale formatting:

```typescript
date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
// Example: "10:30 AM" or "14:30" depending on locale
```

### Implementation Reference

See `app/utils/stint-time.ts` (`formatStintTime`) for the canonical implementation of timer formatting; UI usage examples can be found in `DashboardTimerHero.vue`.

---

## Component Library (Nuxt UI v4)

### Important: Nuxt UI v4 API

Nuxt UI v4 is built on **Reka UI** primitives. Always check the official documentation before using components, as the API differs significantly from Nuxt UI 2/3.

**Common API differences:**
- Menu items: `click` → `onSelect` (DropdownMenu, CommandPalette, NavigationMenu)
- Form inputs: different prop names and event handlers
- Modal/Dialog: different slot and prop structure

### Core Components

#### Buttons (`UButton`)

**Variants:**
- `solid` (default) - Primary actions with filled background
- `outline` - Secondary actions with border
- `ghost` - Tertiary actions, icon buttons
- `soft` - Subtle actions with tinted background

**Colors:**
- `primary` - Orange/terracotta - main actions
- `secondary` - Green - secondary actions
- `neutral` - Stone - neutral actions
- `success` - Green - positive confirmations
- `warning` - Amber - warnings
- `error` - Red - destructive actions

**Sizes:** `xs`, `sm`, `md` (default), `lg`

**Example:**
```vue
<UButton
  icon="i-lucide-play"
  color="primary"
  variant="solid"
  size="lg"
  :loading="isPending"
>
  Start Stint
</UButton>

<UButton color="error" variant="ghost">
  <Icon name="i-lucide-trash-2" class="h-4 w-4" />
</UButton>
```

#### Cards (`UCard`)

Container component for grouping related content with warm shadows.

**Slots:** `header`, `default`, `footer`

**Styling Pattern:**
```vue
<UCard class="bg-white dark:bg-stone-800 shadow-warm">
  <template #header>
    <h3 class="font-serif text-lg font-semibold">Card Title</h3>
  </template>
  <p class="text-stone-700 dark:text-stone-300">Card content</p>
  <template #footer>
    <UButton color="primary">Action</UButton>
  </template>
</UCard>
```

#### Modals (`UModal`)

Modal dialogs for user interactions.

**Props:**
- `v-model:open` - Controls visibility
- `title` - Modal title
- `description` - Modal description
- `:ui="{ footer: 'justify-end' }"` - Footer alignment

**Slots:** `body`, `footer`

**Example:**
```vue
<UModal
  v-model:open="isOpen"
  title="Confirm Action"
  description="Please confirm your selection"
  :ui="{ footer: 'justify-end' }"
>
  <template #body>
    <p class="text-stone-700 dark:text-stone-300">Modal content</p>
  </template>
  <template #footer>
    <UButton color="neutral" variant="ghost" @click="isOpen = false">
      Cancel
    </UButton>
    <UButton color="primary" @click="confirm">
      Confirm
    </UButton>
  </template>
</UModal>
```

#### Forms (`UForm`, `UFormField`, `UInput`)

Form components with Zod validation support.

**Example:**
```vue
<UForm :schema="schema" :state="state" @submit="handleSubmit">
  <UFormField label="Project Name" name="name" required>
    <UInput
      v-model="state.name"
      placeholder="Enter project name"
    />
  </UFormField>
  <UButton type="submit" color="primary" :loading="isPending">
    Create Project
  </UButton>
</UForm>
```

#### Badges (`UBadge`)

Status indicators and labels.

**Variants:** `solid`, `subtle`, `outline`
**Colors:** `primary`, `secondary`, `success`, `warning`, `error`, `neutral`

```vue
<UBadge color="success" variant="subtle" size="sm">Active</UBadge>
<UBadge color="warning" variant="subtle">Paused</UBadge>
<UBadge color="neutral" variant="outline">Archived</UBadge>
```

#### Tooltips (`UTooltip`)

**Required for all icon-only buttons** for accessibility.

```vue
<UTooltip text="Edit project">
  <UButton icon="i-lucide-pencil" variant="ghost" />
</UTooltip>
```

#### Alerts (`UAlert`)

Notification banners for messages.

```vue
<UAlert
  icon="i-lucide-info"
  color="warning"
  variant="soft"
  title="Stint paused"
  description="Resume when ready to continue working."
/>
```

---

## Spacing & Layout

### Spacing Scale

Uses Tailwind's default 4px base unit:

| Token | Value | Usage |
|-------|-------|-------|
| `gap-1` | 4px | Tight inline spacing |
| `gap-2` | 8px | Default inline spacing |
| `gap-3` | 12px | Component spacing |
| `gap-4` | 16px | Section spacing |
| `gap-6` | 24px | Large section spacing |
| `gap-8` | 32px | Page section spacing |

### Border Radius

From tokens.css:

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 8px | Small elements, inputs |
| `--radius-md` | 12px | Cards, modals |
| `--radius-lg` | 20px | Large cards, sections |
| `--radius-xl` | 28px | Hero elements |
| `--radius-full` | 100px | Pills, circular buttons |

```vue
<!-- Using radius tokens -->
<div class="rounded-[var(--radius-md)] bg-white">Card</div>

<!-- Or Tailwind equivalents -->
<div class="rounded-lg">Default card</div>
<div class="rounded-xl">Large card</div>
<div class="rounded-full">Pill button</div>
```

### Layout Patterns

**Page Layout:**
```vue
<div class="min-h-screen bg-[#fffbf5] dark:bg-stone-900">
  <UContainer>
    <div class="space-y-8 py-8">
      <!-- Page content -->
    </div>
  </UContainer>
</div>
```

**Card Grid:**
```vue
<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
  <UCard v-for="item in items" :key="item.id" class="shadow-warm">
    <!-- Card content -->
  </UCard>
</div>
```

**List Layout:**
```vue
<ul class="space-y-3">
  <li
    v-for="item in items"
    :key="item.id"
    class="flex items-center gap-4 p-4 rounded-lg bg-white dark:bg-stone-800 shadow-warm"
  >
    <!-- List item -->
  </li>
</ul>
```

---

## Icon System

### Lucide Icons

All icons use Lucide via `@iconify-json/lucide`, bundled locally (no CDN).

**Usage:** `icon="i-lucide-icon-name"` or `name="i-lucide-icon-name"`

### Icon Sizes

| Size | Class | Usage |
|------|-------|-------|
| 16px | `h-4 w-4` | Small inline icons |
| 20px | `h-5 w-5` | Medium icons |
| 24px | `h-6 w-6` | Large icons |
| 32px | `h-8 w-8` | Extra large icons |
| 48px | `h-12 w-12` | Hero/feature icons |

### Icon Patterns

**Button with Icon:**
```vue
<UButton icon="i-lucide-plus" color="primary">
  Add Project
</UButton>
```

**Icon-Only Button (Must have Tooltip):**
```vue
<UTooltip text="Edit project">
  <UButton icon="i-lucide-pencil" variant="ghost" />
</UTooltip>
```

**Standalone Icon:**
```vue
<UIcon name="i-lucide-clock" class="h-5 w-5 text-stone-500" />
```

**Icon with Accent Color:**
```vue
<UIcon
  name="i-lucide-flame"
  class="h-6 w-6 text-[var(--accent-primary)]"
/>
```

---

## Dark Mode

### Configuration

- **Preference**: System preference (follows OS setting)
- **Fallback**: Light mode
- **Implementation**: Nuxt UI color mode with CSS variables
- **Toggle**: `UColorModeButton` component

### Automatic Adaptation

Semantic colors in Nuxt UI components automatically adapt to dark mode:

```vue
<!-- These automatically adapt to dark mode -->
<UButton color="primary">Submit</UButton>
<UAlert color="success" title="Success!" />
<UBadge color="warning">Paused</UBadge>
```

### Manual Dark Mode Variants

For custom styling with neutral colors, always specify dark variants:

**Backgrounds:**
```vue
<div class="bg-white dark:bg-stone-800">Card</div>
<div class="bg-stone-50 dark:bg-stone-900">Section</div>
<div class="bg-[#fffbf5] dark:bg-[#1c1917]">Page</div>
```

**Text:**
```vue
<p class="text-stone-800 dark:text-stone-50">Primary text</p>
<p class="text-stone-600 dark:text-stone-400">Secondary text</p>
<p class="text-stone-400 dark:text-stone-500">Muted text</p>
```

**Borders:**
```vue
<div class="border border-stone-200 dark:border-stone-700">Bordered</div>
<div class="border-[var(--border-light)]">Using token</div>
```

### Dark Mode Toggle

```vue
<UColorModeButton />
```

---

## Shadows & Effects

### Shadow Tokens

From tokens.css:

```css
/* Light mode */
--shadow-soft: 0 4px 20px rgba(120, 113, 108, 0.08);
--shadow-medium: 0 8px 30px rgba(120, 113, 108, 0.12);
--shadow-glow: 0 0 40px rgba(194, 65, 12, 0.15);  /* Orange glow */
--shadow-card: 0 1px 3px rgba(120, 113, 108, 0.06), 0 8px 24px rgba(120, 113, 108, 0.08);

/* Dark mode */
--shadow-soft: 0 4px 20px rgba(0, 0, 0, 0.3);
--shadow-medium: 0 8px 30px rgba(0, 0, 0, 0.4);
--shadow-glow: 0 0 60px rgba(234, 88, 12, 0.2);   /* Brighter orange glow */
--shadow-card: 0 1px 3px rgba(0, 0, 0, 0.2), 0 8px 24px rgba(0, 0, 0, 0.25);
```

### Utility Classes

```vue
<!-- Card shadow -->
<div class="shadow-warm">Uses --shadow-card</div>

<!-- Timer glow effect -->
<div class="timer-glow">Uses --shadow-glow</div>

<!-- Background utilities -->
<div class="bg-warm-cream">Uses --bg-primary</div>
<div class="bg-warm-linen">Uses --bg-secondary</div>
```

### Timer Glow Effect

The timer display uses a distinctive orange glow effect:

```vue
<div class="timer-glow rounded-2xl p-8">
  <span class="font-mono text-5xl tabular-nums">25:00</span>
</div>
```

---

## Animation & Transitions

### Transition Tokens

```css
--transition-fast: 0.15s ease;
--transition-medium: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 0.6s cubic-bezier(0.16, 1, 0.3, 1);
```

### Common Patterns

**Button Hover:**
```vue
<button class="transition-colors duration-200 ease-in-out hover:bg-orange-600">
  Button
</button>
```

**Card Hover:**
```vue
<div class="transition-all duration-300 ease-out hover:shadow-medium hover:-translate-y-1">
  Card
</div>
```

**Focus States:**
```vue
<input class="transition-all duration-200 focus:ring-2 focus:ring-orange-500" />
```

### Accessibility

Always respect `prefers-reduced-motion`:

```vue
<div class="motion-safe:transition-all motion-safe:duration-200">
  Content
</div>
```

---

## Component Patterns

### Empty States

```vue
<div class="text-center py-12">
  <UIcon
    name="i-lucide-folder-open"
    class="h-12 w-12 mx-auto text-stone-400 dark:text-stone-600"
  />
  <h3 class="mt-4 font-serif text-lg font-medium text-stone-900 dark:text-stone-100">
    No projects yet
  </h3>
  <p class="mt-2 text-sm text-stone-500 dark:text-stone-400">
    Get started by creating your first project
  </p>
  <UButton color="primary" class="mt-4">
    Create Project
  </UButton>
</div>
```

### Loading States

```vue
<div class="text-center py-8">
  <UIcon
    name="i-lucide-loader-2"
    class="h-8 w-8 mx-auto animate-spin text-orange-500"
  />
  <p class="mt-2 text-sm text-stone-500 dark:text-stone-400">
    Loading...
  </p>
</div>
```

### Toast Notifications

```typescript
const toast = useToast()

// Success
toast.add({
  title: 'Stint completed',
  description: 'Great work! You focused for 2h 34m.',
  color: 'success',
  icon: 'i-lucide-check-circle',
})

// Error
toast.add({
  title: 'Failed to save',
  description: 'Please try again.',
  color: 'error',
  icon: 'i-lucide-alert-circle',
})

// Warning
toast.add({
  title: 'Session expiring',
  description: 'Please save your work.',
  color: 'warning',
  icon: 'i-lucide-alert-triangle',
})
```

### Info/Warning Boxes

```vue
<!-- Info box -->
<div class="rounded-lg bg-orange-50 dark:bg-orange-950 p-4">
  <div class="flex items-start gap-3">
    <UIcon name="i-lucide-info" class="h-5 w-5 text-orange-500 flex-shrink-0" />
    <div>
      <h4 class="text-sm font-medium text-orange-800 dark:text-orange-200">
        About Archiving
      </h4>
      <p class="mt-1 text-sm text-orange-700 dark:text-orange-300">
        Archived projects are hidden but all history is preserved.
      </p>
    </div>
  </div>
</div>

<!-- Warning box -->
<div class="rounded-lg bg-warning-50 dark:bg-warning-950 p-4">
  <div class="flex items-start gap-3">
    <UIcon name="i-lucide-alert-triangle" class="h-5 w-5 text-warning-500 flex-shrink-0" />
    <div>
      <h4 class="text-sm font-medium text-warning-800 dark:text-warning-200">
        Warning
      </h4>
      <p class="mt-1 text-sm text-warning-700 dark:text-warning-300">
        This action cannot be undone.
      </p>
    </div>
  </div>
</div>

<!-- Error box -->
<div class="rounded-lg bg-red-50 dark:bg-red-950 p-4">
  <div class="flex items-start gap-3">
    <UIcon name="i-lucide-alert-triangle" class="h-5 w-5 text-red-500 flex-shrink-0" />
    <div>
      <h4 class="text-sm font-medium text-red-800 dark:text-red-200">
        Cannot Delete Project
      </h4>
      <p class="mt-1 text-sm text-red-700 dark:text-red-300">
        Please stop the active stint first.
      </p>
    </div>
  </div>
</div>
```

### Stint Action Buttons

Project list cards use custom-styled action buttons for stint control:

| Button | Color | Purpose |
|--------|-------|---------|
| **Start (Play)** | Green | Begin a new stint - uses `.play-btn` class |
| **Resume** | Amber | Continue a paused stint - uses `.action-btn.resume` class |
| **Pause** | Amber | Pause running stint - uses `.action-btn.pause` class |
| **Stop** | Red | End current stint - uses `.action-btn.stop` class |

**Color Rationale (Traffic Light Convention):**
- **Green** = Go/Start (begin fresh work)
- **Amber** = Caution (paused state, resume/pause actions)
- **Red** = Stop (end session)

**Implementation:** These buttons use custom CSS classes in `ProjectListCard.vue` with hardcoded color values for precise control over the subtle backgrounds and borders.

---

## Design Tokens Summary

### Quick Reference

| Category | Light | Dark | CSS Variable |
|----------|-------|------|--------------|
| **Primary Accent** | `#c2410c` | `#ea580c` | `--accent-primary` |
| **Secondary Accent** | `#166534` | `#22c55e` | `--accent-secondary` |
| **Danger** | `#dc2626` | `#f87171` | `--accent-danger` |
| **Page Background** | `#fffbf5` | `#1c1917` | `--bg-primary` |
| **Card Background** | `#ffffff` | `#292524` | `--bg-card` |
| **Text Primary** | `#292524` | `#fafaf9` | `--text-primary` |
| **Text Secondary** | `#57534e` | `#d6d3d1` | `--text-secondary` |
| **Border Light** | `#e7e5e4` | `#3d3835` | `--border-light` |

### Typography Summary

- **Headings**: Fraunces (serif) - `font-serif`
- **Body**: Instrument Sans - `font-sans`
- **Mono**: JetBrains Mono - `font-mono`
- **Timer**: `font-mono text-5xl tabular-nums`

### Tailwind Palette Reference

| Role | Tailwind Color |
|------|----------------|
| Primary | `orange` |
| Secondary | `green` |
| Neutral | `stone` |
| Warning | `amber` |
| Error | `red` |

---

## Accessibility

### Requirements

- **Icon-Only Buttons**: Always wrap in `UTooltip`
- **Color Contrast**: WCAG AA (4.5:1 for text, 3:1 for large text)
- **Focus States**: Built into Nuxt UI components
- **Keyboard Navigation**: Full support via Nuxt UI/Reka UI
- **Semantic HTML**: Proper heading hierarchy (`h1` → `h2` → `h3`)
- **Reduced Motion**: Respect `prefers-reduced-motion`

### Examples

**Accessible Icon Button:**
```vue
<UTooltip text="Delete project">
  <UButton
    icon="i-lucide-trash-2"
    color="error"
    variant="ghost"
    aria-label="Delete project"
  />
</UTooltip>
```

**Semantic Heading Hierarchy:**
```vue
<h1 class="font-serif text-3xl font-bold">Dashboard</h1>
<section>
  <h2 class="font-serif text-2xl font-semibold">Active Projects</h2>
  <article>
    <h3 class="text-lg font-semibold">Client Website</h3>
  </article>
</section>
```

---

## File Structure

```
app/
├── assets/
│   └── css/
│       ├── main.css           # Tailwind imports, @theme
│       └── tokens.css         # Design tokens (colors, radius, shadows)
├── components/                # Vue components
├── layouts/
│   └── default.vue           # Main layout
└── app.config.ts             # Nuxt UI semantic color config

nuxt.config.ts                # Nuxt config (UI module, color mode)
```

---

## Best Practices

1. **Use CSS Tokens**: Prefer `var(--token-name)` for design system values
2. **Semantic Colors**: Use `color="primary"` not `color="orange"` in components
3. **Dark Mode**: Always include `dark:` variants for custom styling
4. **Typography**: Use `font-serif` for headings, `font-mono` for timers
5. **Icon Accessibility**: All icon-only buttons must have `UTooltip`
6. **Warm Backgrounds**: Use `bg-[#fffbf5]` not pure white for page backgrounds
7. **Consistent Spacing**: Use the spacing scale, avoid arbitrary values
8. **Loading States**: Always show loading states for async operations
9. **Toast Feedback**: Use toast notifications for user feedback
10. **Nuxt UI v4**: Always check documentation - API differs from v2/v3

---

## Component Reference Links

- [Nuxt UI v4 Documentation](https://ui.nuxt.com/)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [Reka UI (Nuxt UI primitives)](https://reka-ui.com/)
