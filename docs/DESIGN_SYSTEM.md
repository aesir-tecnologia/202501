# LifeStint Design System

## Overview

LifeStint uses a modern, component-based design system built on **Nuxt UI v4** with **Tailwind CSS v4**, featuring semantic color aliases, typography system, and comprehensive dark mode support. The color system uses Tailwind's default palettes mapped to semantic aliases in `app.config.ts` for Nuxt UI components.

---

## Framework & Tools

- **UI Framework**: Nuxt UI v4 (`@nuxt/ui`)
- **CSS Framework**: Tailwind CSS v4 (via `@theme` directive)
- **Color System**: Nuxt UI semantic colors (configured in `app.config.ts`)
- **Icons**: Lucide Icons
- **Build Tool**: Nuxt 4.1.2
- **Styling Approach**: Utility-first CSS with semantic color aliases

### Tailwind CSS v4 Configuration

This project uses **Tailwind CSS v4**, which introduces a new configuration approach:

- **No `tailwind.config.ts` file** - Tailwind v4 eliminates the traditional config file
- **Inline `@theme` directive** - All customization is done directly in CSS using `@theme` blocks
- **Location:** All design tokens and theme customization are in `app/assets/css/main.css`
- **CSS-first approach** - CSS variables and `@theme` blocks replace JavaScript configuration

**Example from `main.css`:**
```css
@import "tailwindcss";
@import "@nuxt/ui";

@theme {
  --font-sans: 'Public Sans', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  /* Custom colors can be defined here if needed */
  /* --color-custom-500: #hexvalue; */
}
```

**Note:**
- Custom colors can be defined in `@theme` and used with Tailwind utilities (e.g., `bg-custom-500`)
- For Nuxt UI components to use colors via semantic aliases (e.g., `color="primary"`), they must be mapped in `app.config.ts`
- This project uses Tailwind's default color palettes without custom `@theme` definitions

This modern approach provides better type safety, improved performance, and tighter integration with CSS tooling.

### Nuxt UI Color Configuration

Nuxt UI components require semantic color mapping in `app/app.config.ts`:

```typescript
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'violet',    // Maps to Tailwind's violet palette
      secondary: 'sky',     // Maps to Tailwind's sky palette
    },
  },
})
```

**How it works:**
- **Tailwind colors**: Can be Tailwind defaults (violet, sky, green) or custom colors defined in `@theme`
- **Nuxt UI mapping**: Maps Tailwind colors to semantic aliases for use in Nuxt UI components
- **Pure Tailwind utilities**: Work with any color from `@theme` without mapping (e.g., `bg-violet-500`, `text-sky-600`)
- **Nuxt UI components**: Require mapping to use semantic aliases (e.g., `<UButton color="primary" />`)

**Benefits:**
- **Runtime configuration**: Change colors without rebuilding
- **Semantic naming**: Use `color="primary"` instead of `color="violet"` in components
- **Consistency**: Standardized color usage across all Nuxt UI components
- **Flexibility**: Easily swap color palettes by updating one file

---

## Nuxt UI Semantic Color System

### Overview

Nuxt UI provides **semantic color aliases** that describe the purpose of colors rather than their appearance. This allows for consistent theming and easier maintenance across the application.

**Two-layer color system:**
1. **Tailwind layer**: Colors defined in Tailwind (defaults or custom `@theme` definitions) — usable with utility classes
2. **Nuxt UI layer**: Tailwind colors mapped to semantic aliases in `app.config.ts` — usable with component `color` props

### Semantic Color Mapping

The following semantic colors are configured in `app/app.config.ts`:

| Semantic Alias | Tailwind Color | Purpose |
|----------------|----------------|---------|
| `primary` | `violet` | Main CTAs, active navigation, brand elements, important links |
| `secondary` | `sky` | Secondary buttons, alternative actions, complementary UI elements |
| `success` | `green` | Success messages, completed states, positive confirmations |
| `info` | `blue` | Info alerts, tooltips, help text, neutral notifications |
| `warning` | `yellow` | Warning messages, pending states, attention-needed items |
| `error` | `red` | Error messages, validation errors, destructive actions |
| `neutral` | `slate` | Text, borders, backgrounds, disabled states |

### Using Semantic Colors

All Nuxt UI components accept a `color` prop with semantic aliases:

```vue
<!-- Nuxt UI components: Use semantic aliases -->
<UButton color="primary">Create Project</UButton>
<UButton color="secondary">Learn More</UButton>
<UAlert color="success" title="Operation successful!" />
<UAlert color="error" title="Something went wrong" />

<!-- Pure Tailwind utilities: Use color names directly -->
<div class="bg-violet-500 text-white">Direct Tailwind usage</div>
<p class="text-sky-600">Sky colored text</p>
```

**Benefits:**
- **Consistency**: Semantic naming ensures consistent use across Nuxt UI components
- **Flexibility**: Change the entire theme by updating `app.config.ts`
- **Maintainability**: Purpose-driven naming makes component code more readable
- **Runtime Configuration**: Update colors without rebuilding the app
- **Hybrid approach**: Use semantic colors in components, direct colors in utilities

---

## Color System

### Semantic Color Palette

The design system uses a semantic color naming system with six core color categories:

#### Primary Colors (Violet Palette)
Main brand color for primary actions, CTAs, and brand identity. Maps to Tailwind's `violet` palette.

```css
violet-50:  #faf5ff  /* Lightest */
violet-100: #f3e8ff
violet-200: #e9d5ff
violet-300: #d8b4fe
violet-400: #c084fc
violet-500: #a855f7  /* Primary */
violet-600: #9333ea
violet-700: #7e22ce
violet-800: #6b21a8
violet-900: #581c87
violet-950: #3b0764  /* Darkest */
```

#### Secondary Colors (Sky Palette)
Secondary actions and complementary UI elements. Maps to Tailwind's `sky` palette.

```css
sky-50:  #f0f9ff  /* Lightest */
sky-100: #e0f2fe
sky-200: #bae6fd
sky-300: #7dd3fc
sky-400: #38bdf8
sky-500: #0ea5e9  /* Secondary */
sky-600: #0284c7
sky-700: #0369a1
sky-800: #075985
sky-900: #0c4a6e
sky-950: #082f49  /* Darkest */
```

#### Success Colors (Green Palette)
Success states, positive actions, and confirmations. Maps to Tailwind's `green` palette.

```css
green-50:  #f0fdf4  /* Lightest */
green-100: #dcfce7
green-200: #bbf7d0
green-300: #86efac
green-400: #4ade80
green-500: #22c55e  /* Success */
green-600: #16a34a
green-700: #15803d
green-800: #166534
green-900: #14532d
green-950: #052e16  /* Darkest */
```

#### Warning Colors (Yellow Palette)
Warning states, pause actions, and attention elements. Maps to Tailwind's `yellow` palette.

```css
yellow-50:  #fefce8  /* Lightest */
yellow-100: #fef9c3
yellow-200: #fef08a
yellow-300: #fde047
yellow-400: #facc15
yellow-500: #eab308  /* Warning */
yellow-600: #ca8a04
yellow-700: #a16207
yellow-800: #854d0e
yellow-900: #713f12
yellow-950: #422006  /* Darkest */
```

#### Error Colors (Red Palette)
Error states, destructive actions, and critical alerts. Maps to Tailwind's `red` palette.

```css
red-50:  #fef2f2  /* Lightest */
red-100: #fee2e2
red-200: #fecaca
red-300: #fca5a5
red-400: #f87171
red-500: #ef4444  /* Error */
red-600: #dc2626
red-700: #b91c1c
red-800: #991b1b
red-900: #7f1d1d
red-950: #450a0a  /* Darkest */
```

#### Neutral Colors (Slate Palette)
Neutral UI elements, text, backgrounds, and borders. Maps to Tailwind's `slate` palette.

```css
slate-50:  #f8fafc  /* Lightest */
slate-100: #f1f5f9
slate-200: #e2e8f0
slate-300: #cbd5e1
slate-400: #94a3b8
slate-500: #64748b  /* Neutral */
slate-600: #475569
slate-700: #334155
slate-800: #1e293b
slate-900: #0f172a
slate-950: #020617  /* Darkest */
```

### Color Usage Guidelines

- **Primary Actions**: Primary colors (violet) - main CTAs, active states, links
- **Secondary Actions**: Secondary colors (sky) - less prominent actions, supporting UI
- **Success States**: Success colors (green) - confirmations, completed actions, positive feedback
- **Warning States**: Warning colors (yellow) - cautions, pause actions, attention needed
- **Error States**: Error colors (red) - errors, destructive actions, critical alerts
- **Neutral Elements**: Neutral colors (slate) - text, backgrounds, borders, disabled states
- **Info States**: Info colors (blue) - informational messages, help text, neutral notifications
- **Project Color Tags**: Red, Orange, Amber, Green, Teal, Blue, Purple, Pink (independent tag system)

**Usage with Nuxt UI Components:**
Use semantic color props in components instead of specific color names:

```vue
<!-- Good: Semantic colors -->
<UButton color="primary">Create</UButton>
<UButton color="secondary">Learn More</UButton>
<UAlert color="success" title="Success!" />

<!-- Avoid: Specific colors (unless needed for project tags) -->
<UButton color="violet">Create</UButton>
```

---

## Typography

### Font Families

```css
--font-sans: 'Public Sans', system-ui, sans-serif  /* Primary UI font */
--font-mono: 'JetBrains Mono', monospace           /* Code & timers */
```

### Typography Scale

The system uses Tailwind's default typography scale:

- **Heading 1**: `text-3xl` (30px) - Page titles
- **Heading 2**: `text-2xl` (24px) - Section titles
- **Heading 3**: `text-xl` (20px) - Subsection titles
- **Heading 4**: `text-lg` (18px) - Card titles
- **Body Large**: `text-base` (16px) - Default body text
- **Body Small**: `text-sm` (14px) - Secondary text, captions
- **Body Extra Small**: `text-xs` (12px) - Fine print, labels

### Font Weights

- **Light**: `font-light` (300)
- **Normal**: `font-normal` (400)
- **Medium**: `font-medium` (500)
- **Semibold**: `font-semibold` (600)
- **Bold**: `font-bold` (700)

### Special Typography

- **Timer Display**: `font-mono` with `tabular-nums` for consistent width
- **Code**: `font-mono` for code blocks and technical content

### Typography Usage Guidelines

#### Scale Usage

**Heading 1 (`text-3xl` / 30px)**
- **Use for**: Main page titles, hero headings
- **Weight**: `font-bold` (700) or `font-semibold` (600)
- **Examples**: "Dashboard", "Analytics", "Welcome to LifeStint"
- **Line height**: `leading-tight` or `leading-9`

**Heading 2 (`text-2xl` / 24px)**
- **Use for**: Section titles, major content divisions
- **Weight**: `font-semibold` (600) or `font-bold` (700)
- **Examples**: "Active Projects", "Recent Activity", "Account Settings"
- **Line height**: `leading-tight` or `leading-8`

**Heading 3 (`text-xl` / 20px)**
- **Use for**: Subsection titles, card headers, modal titles
- **Weight**: `font-semibold` (600) or `font-medium` (500)
- **Examples**: "Project Details", "Confirm Action", "Weekly Summary"
- **Line height**: `leading-snug` or `leading-7`

**Heading 4 (`text-lg` / 18px)**
- **Use for**: Small card titles, list item headers, emphasized text
- **Weight**: `font-medium` (500) or `font-semibold` (600)
- **Examples**: Card titles, list headers, prominent labels
- **Line height**: `leading-normal` or `leading-7`

**Body Large (`text-base` / 16px)**
- **Use for**: Primary body text, form inputs, button labels, default text
- **Weight**: `font-normal` (400) for body, `font-medium` (500) for emphasis
- **Examples**: Paragraph text, form fields, navigation items, button text
- **Line height**: `leading-normal` or `leading-6`

**Body Small (`text-sm` / 14px)**
- **Use for**: Secondary text, captions, helper text, metadata
- **Weight**: `font-normal` (400) or `font-medium` (500) for slight emphasis
- **Examples**: Timestamps, descriptions, helper text, form field hints
- **Line height**: `leading-normal` or `leading-5`

**Body Extra Small (`text-xs` / 12px)**
- **Use for**: Fine print, badges, labels, tertiary information
- **Weight**: `font-normal` (400) or `font-medium` (500) for badges
- **Examples**: Legal text, badge labels, tiny timestamps, status indicators
- **Line height**: `leading-tight` or `leading-4`

#### Weight Usage

**Light (`font-light` / 300)**
- **Use for**: Large display text when you want an airy feel
- **Best with**: `text-3xl` or larger
- **Avoid**: Small text (below `text-base`), body copy

**Normal (`font-normal` / 400)**
- **Use for**: All body text, default paragraph text, descriptions
- **Best with**: `text-base`, `text-sm`, `text-xs`
- **Primary use case**: Maximum readability for long-form content

**Medium (`font-medium` / 500)**
- **Use for**: Subtle emphasis, button text, navigation items, form labels
- **Best with**: Any size, but especially `text-base` and `text-sm`
- **Primary use case**: Differentiate without being too bold

**Semibold (`font-semibold` / 600)**
- **Use for**: Headings, section titles, important UI elements
- **Best with**: `text-lg` and larger, but works at all sizes
- **Primary use case**: Clear visual hierarchy for headings

**Bold (`font-bold` / 700)**
- **Use for**: Major headings, strong emphasis, critical information
- **Best with**: `text-xl` and larger
- **Primary use case**: Maximum emphasis and attention

#### Common Typography Combinations

**Page Title**
```vue
<h1 class="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
  Dashboard
</h1>
```

**Section Header**
```vue
<h2 class="text-2xl font-semibold text-neutral-800 dark:text-neutral-100">
  Active Projects
</h2>
```

**Card Title**
```vue
<h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
  Project Details
</h3>
```

**Body Text**
```vue
<p class="text-base font-normal text-neutral-700 dark:text-neutral-300">
  Your primary content goes here with comfortable reading size.
</p>
```

**Secondary Text**
```vue
<p class="text-sm font-normal text-neutral-600 dark:text-neutral-400">
  Additional context or helper text at a smaller size.
</p>
```

**Label**
```vue
<label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
  Email Address
</label>
```

**Badge/Tag**
```vue
<span class="text-xs font-medium text-neutral-600 dark:text-neutral-400">
  ACTIVE
</span>
```

**Button Text**
```vue
<span class="text-base font-medium">
  Create Project
</span>
```

**Timer Display (Monospace)**
```vue
<div class="font-mono text-2xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
  02:34:18
</div>
```

---

## Component Library (Nuxt UI)

### Core Components

#### Buttons (`UButton`)

**Variants:**
- `solid` (default) - Primary actions
- `outline` - Secondary actions
- `ghost` - Tertiary actions, icon buttons
- `soft` - Subtle actions with background tint

**Colors:**
- `primary` - Main actions
- `secondary` - Secondary actions
- `success` - Positive actions
- `error` - Destructive actions
- `warning` - Warning actions
- `neutral` - Neutral actions

**Sizes:**
- `xs` - Extra small
- `sm` - Small
- `md` - Medium (default)
- `lg` - Large

**Common Props:**
- `icon` - Icon name (e.g., `"i-lucide-plus"`, `"i-lucide-pause"`)
- `loading` - Shows loading spinner
- `disabled` - Disables interaction
- `block` - Full width button

**Example:**
```vue
<UButton
  icon="i-lucide-plus"
  color="primary"
  variant="solid"
  size="lg"
  :loading="isPending"
>
  Create Project
</UButton>
```

#### Cards (`UCard`)

Container component for grouping related content.

**Slots:**
- `header` - Card header section
- `default` - Card body content
- `footer` - Card footer section

**Styling:**
- Rounded corners: `rounded-lg`
- Border: `border-2` with `border-neutral-200 dark:border-neutral-800`
- Background: `bg-white dark:bg-neutral-900`
- Hover effects: `hover:border-neutral-300 dark:hover:border-neutral-700`

**Example:**
```vue
<UCard>
  <template #header>
    <h3 class="text-lg font-semibold">Card Title</h3>
  </template>
  <p>Card content</p>
  <template #footer>
    <UButton>Action</UButton>
  </template>
</UCard>
```

#### Modals (`UModal`)

Modal dialogs for user interactions.

**Props:**
- `v-model:open` - Controls modal visibility
- `title` - Modal title
- `description` - Modal description
- `prevent-close` - Prevents closing during operations

**Slots:**
- `content` - Main modal content (typically contains UCard)

**Example:**
```vue
<UModal v-model:open="isOpen" title="Confirm Action">
  <template #content>
    <UCard>
      <p>Modal content</p>
    </UCard>
  </template>
</UModal>
```

#### Forms (`UForm`, `UFormField`, `UInput`)

Form components with validation support.

**UForm Props:**
- `schema` - Zod validation schema
- `state` - Reactive form state
- `@submit` - Submit handler

**UFormField Props:**
- `label` - Field label
- `name` - Field name (for validation)
- `required` - Marks field as required

**UInput Props:**
- `v-model` - Input value
- `type` - Input type (text, email, password, etc.)
- `placeholder` - Placeholder text
- `disabled` - Disables input
- `size` - Size variant (sm, md, lg)

**Example:**
```vue
<UForm :schema="schema" :state="state" @submit="handleSubmit">
  <UFormField label="Email" name="email" required>
    <UInput
      v-model="state.email"
      type="email"
      placeholder="Enter your email"
    />
  </UFormField>
</UForm>
```

#### Badges (`UBadge`)

Status indicators and labels.

**Variants:**
- `solid` (default)
- `subtle` - Subtle background tint
- `outline` - Outlined border

**Colors:**
- `primary`, `success`, `error`, `warning`, `neutral`

**Sizes:**
- `xs`, `sm`, `md`, `lg`

**Example:**
```vue
<UBadge color="neutral" variant="subtle" size="sm">
  Inactive
</UBadge>
```

#### Switches (`USwitch`)

Toggle switches for boolean values.

**Props:**
- `v-model` - Boolean value
- `loading` - Shows loading state
- `disabled` - Disables toggle

**Example:**
```vue
<USwitch
  v-model="isActive"
  :loading="isLoading"
/>
```

#### Tooltips (`UTooltip`)

Hover tooltips for additional context. **Required for all icon-only buttons.**

**Props:**
- `text` - Tooltip text content

**Example:**
```vue
<UTooltip text="Edit project">
  <UButton icon="i-lucide-pencil" variant="ghost" />
</UTooltip>
```

#### Alerts (`UAlert`)

Notification banners for messages.

**Props:**
- `icon` - Icon name
- `color` - Alert color (error, success, warning, info)
- `variant` - `soft` or `solid`
- `title` - Alert title

**Example:**
```vue
<UAlert
  icon="i-lucide-triangle-alert"
  color="error"
  variant="soft"
  title="Error message"
/>
```

#### Layout Components

- **UHeader** - Application header with navigation
- **UMain** - Main content container
- **UContainer** - Responsive container wrapper
- **UNavigationMenu** - Navigation menu component

---

## Spacing & Layout

### Spacing Scale

Uses Tailwind's default spacing scale (4px base unit):

- `space-y-2` - 8px vertical spacing
- `space-y-4` - 16px vertical spacing
- `space-y-6` - 24px vertical spacing
- `space-y-8` - 32px vertical spacing
- `gap-1` - 4px gap
- `gap-2` - 8px gap
- `gap-3` - 12px gap
- `gap-4` - 16px gap

### Container Patterns

- **Full Width**: No container wrapper
- **Constrained**: `UContainer` component (responsive max-width)
- **Card Layout**: `UCard` with padding `p-4` or `p-8`

### Common Layout Patterns

**Page Layout:**
```vue
<UContainer>
  <div class="space-y-6">
    <!-- Content sections -->
  </div>
</UContainer>
```

**Card Layout:**
```vue
<UCard class="bg-white/80 shadow-sm backdrop-blur dark:bg-neutral-900/70">
  <div class="space-y-4">
    <!-- Card content -->
  </div>
</UCard>
```

**List Layout:**
```vue
<ul class="space-y-2">
  <li class="flex items-center gap-3 p-4 rounded-lg border-2">
    <!-- List item -->
  </li>
</ul>
```

---

## Icon System

### Icon Libraries

**Lucide Icons**
   - Usage: `icon="i-lucide-icon-name"` or `name="i-lucide-icon-name"`
   - Examples: `i-lucide-plus`, `i-lucide-pencil`, `i-lucide-archive`
   - Note: The `i-` prefix is required by Nuxt UI's icon system

### Icon Sizes

- `h-4 w-4` - Small icons (16px)
- `h-5 w-5` - Medium icons (20px)
- `h-6 w-6` - Large icons (24px)
- `h-8 w-8` - Extra large icons (32px)
- `h-12 w-12` - Hero icons (48px)

### Icon Usage Patterns

**Button with Label (Preferred):**
```vue
<UButton icon="i-lucide-plus">Add Project</UButton>
```

**Icon-Only Button (Must Include Tooltip):**
```vue
<UTooltip text="Edit project">
  <UButton icon="i-lucide-pencil" variant="ghost" />
</UTooltip>
```

**Icon-Only Button in Button Group:**
```vue
<div class="flex gap-2">
  <UTooltip text="Archive">
    <UButton icon="i-lucide-archive" variant="ghost" />
  </UTooltip>
  <UTooltip text="Delete">
    <UButton icon="i-lucide-trash-2" color="error" variant="ghost" />
  </UTooltip>
</div>
```

**Standalone Decorative Icon:**
```vue
<UIcon name="i-lucide-target" class="h-4 w-4" />
```

**Standalone Icon with Color:**
```vue
<UIcon name="i-lucide-alert-triangle" class="size-6 text-warning-500" />
```

---

## Dark Mode

### Configuration

- **Preference**: System preference (follows OS setting)
- **Fallback**: Light mode
- **Implementation**: Nuxt UI color mode with CSS variables
- **Automatic Adaptation**: All semantic colors automatically adapt to dark mode with appropriate contrast

### Semantic Colors in Dark Mode

**Automatic Dark Mode Support:**

Semantic colors (primary, secondary, success, warning, error, neutral) automatically provide optimal contrast in both light and dark modes. You typically don't need to specify dark mode variants for semantic colors used in components.

```vue
<!-- Primary color automatically adapts -->
<UButton color="primary">Submit</UButton>

<!-- Success color automatically adapts -->
<UAlert color="success" title="Success!" />

<!-- Error color automatically adapts -->
<UButton color="error">Delete</UButton>
```

### Neutral Colors for Backgrounds and Text

When using neutral colors for custom layouts, always specify dark mode variants:

**Background Colors:**
```vue
<!-- Page background -->
<div class="bg-white dark:bg-neutral-900">

<!-- Card/section background -->
<div class="bg-neutral-50 dark:bg-neutral-800">

<!-- Subtle background -->
<div class="bg-neutral-100 dark:bg-neutral-800">
```

**Text Colors:**
```vue
<!-- Primary text -->
<p class="text-neutral-900 dark:text-neutral-50">

<!-- Secondary text -->
<p class="text-neutral-700 dark:text-neutral-300">

<!-- Muted text -->
<p class="text-neutral-500 dark:text-neutral-400">
```

**Border Colors:**
```vue
<!-- Standard border -->
<div class="border border-neutral-200 dark:border-neutral-800">

<!-- Subtle border -->
<div class="border border-neutral-100 dark:border-neutral-900">
```

### Dark Mode Patterns

**Card with Semantic Colors:**
```vue
<UCard>
  <div class="space-y-4">
    <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
      Project Status
    </h3>
    <p class="text-sm text-neutral-600 dark:text-neutral-400">
      Your current progress
    </p>
    <UButton color="primary" block>Continue</UButton>
  </div>
</UCard>
```

**Alert with Dark Mode Text:**
```vue
<UAlert color="warning" variant="soft">
  <template #title>
    <span class="text-neutral-900 dark:text-neutral-50">Warning</span>
  </template>
  <template #description>
    <span class="text-neutral-700 dark:text-neutral-300">
      Please review your settings
    </span>
  </template>
</UAlert>
```

**Form with Dark Mode Support:**
```vue
<div class="space-y-4">
  <label class="block text-sm font-medium text-neutral-900 dark:text-neutral-50">
    Project Name
  </label>
  <UInput
    placeholder="Enter project name"
    class="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50"
  />
  <p class="text-xs text-neutral-500 dark:text-neutral-400">
    Choose a unique name for your project
  </p>
</div>
```

### Dark Mode Best Practices

1. **Use Semantic Colors for Actions**: Buttons, alerts, and interactive elements using semantic colors (`primary`, `success`, `error`, etc.) automatically adapt to dark mode
2. **Always Specify Dark Variants for Neutral Colors**: When using neutral colors for backgrounds, text, or borders, always include `dark:` variants
3. **Test Contrast**: Ensure sufficient contrast in both modes (WCAG AA: 4.5:1 for normal text, 3:1 for large text)
4. **Avoid Pure Black/White**: Use `neutral-900` instead of `black`, and `neutral-50` instead of `white` for better readability
5. **Consistent Hover States**: Include dark mode hover states when customizing interactions:
   ```vue
   <div class="hover:bg-neutral-100 dark:hover:bg-neutral-800">
   ```

### Dark Mode Toggle

Uses `UColorModeButton` component:
```vue
<UColorModeButton />
```

---

## Animation & Transitions

### Transition Properties

**When to use specific transition types:**

- **`transition-colors`** - Use for color changes only (most performant)
  - Background color changes
  - Text color changes
  - Border color changes
  - Best for: Buttons, links, alerts

- **`transition-opacity`** - Use for fade in/out effects
  - Modal overlays
  - Tooltips appearing/disappearing
  - Loading states
  - Best for: Overlays, notifications

- **`transition-transform`** - Use for movement and scaling
  - Hover scale effects
  - Slide animations
  - Best for: Interactive elements, cards

- **`transition-all`** - Use sparingly (affects performance)
  - Only when multiple properties change simultaneously
  - Avoid on frequently updated elements
  - Best for: Simple components with few properties changing

### Duration Guidelines

**Standard Durations:**

- **`duration-100` (100ms)** - Instant feedback
  - Button hover states
  - Link color changes
  - Quick UI responses

- **`duration-200` (200ms)** - Default for most transitions
  - Button interactions
  - Form input focus states
  - Color changes
  - Small scale effects

- **`duration-300` (300ms)** - Noticeable but smooth
  - Modal/dialog appearances
  - Dropdown menus
  - Card hover effects
  - Accordion expansions

- **`duration-500` (500ms)** - Deliberate, attention-drawing
  - Page transitions
  - Large modal overlays
  - Success animations
  - Use sparingly

### Easing Functions

**Standard Easing:**

- **`ease-in-out`** - Default, smooth acceleration and deceleration
  - Use for most transitions
  - Natural feeling motion

- **`ease-out`** - Fast start, slow end
  - Elements appearing (modals, dropdowns)
  - Feels responsive

- **`ease-in`** - Slow start, fast end
  - Elements disappearing
  - Less common

- **`ease-linear`** - Constant speed
  - Loading spinners
  - Progress indicators
  - Continuous animations

### Common Animation Patterns

#### Button Interactions

**Standard Button Hover:**
```vue
<UButton
  color="primary"
  class="transition-colors duration-200 ease-in-out"
>
  Click Me
</UButton>
```

**Button with Scale Effect:**
```vue
<UButton
  variant="ghost"
  class="transition-transform duration-200 ease-out hover:scale-105"
>
  Scale on Hover
</UButton>
```

**Button with Multiple Effects:**
```vue
<button
  class="px-4 py-2 rounded-lg bg-primary-500 text-white
         transition-all duration-200 ease-in-out
         hover:bg-primary-600 hover:shadow-lg hover:scale-105
         active:scale-95"
>
  Interactive Button
</button>
```

#### Card Interactions

**Card with Hover Lift:**
```vue
<UCard class="transition-all duration-300 ease-out hover:shadow-xl hover:-translate-y-1">
  <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
    Project Card
  </h3>
  <p class="text-sm text-neutral-600 dark:text-neutral-400">
    Hover to see the lift effect
  </p>
</UCard>
```

**Card with Border Highlight:**
```vue
<UCard
  class="border-2 border-neutral-200 dark:border-neutral-800
         transition-colors duration-200 ease-in-out
         hover:border-primary-500 dark:hover:border-primary-400"
>
  <div class="p-4">Card content</div>
</UCard>
```

#### Modal/Dialog Transitions

**Modal Overlay Fade:**
```vue
<Transition
  enter-active-class="transition-opacity duration-300 ease-out"
  enter-from-class="opacity-0"
  enter-to-class="opacity-100"
  leave-active-class="transition-opacity duration-200 ease-in"
  leave-from-class="opacity-100"
  leave-to-class="opacity-0"
>
  <div v-if="isOpen" class="fixed inset-0 bg-black/50" />
</Transition>
```

**Modal Content Slide-in:**
```vue
<Transition
  enter-active-class="transition-all duration-300 ease-out"
  enter-from-class="opacity-0 translate-y-4"
  enter-to-class="opacity-100 translate-y-0"
  leave-active-class="transition-all duration-200 ease-in"
  leave-from-class="opacity-100 translate-y-0"
  leave-to-class="opacity-0 translate-y-4"
>
  <UModal v-if="isOpen">
    <div class="p-6">Modal content</div>
  </UModal>
</Transition>
```

#### Loading States

**Spinning Loader:**
```vue
<UIcon
  name="i-lucide-loader-2"
  class="h-6 w-6 animate-spin text-primary-500"
/>
```

**Pulsing Skeleton:**
```vue
<div class="space-y-3">
  <div class="h-4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
  <div class="h-4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse w-5/6" />
  <div class="h-4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse w-4/6" />
</div>
```

**Progress Bar:**
```vue
<div class="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2">
  <div
    class="bg-primary-500 h-2 rounded-full transition-all duration-300 ease-out"
    :style="{ width: `${progress}%` }"
  />
</div>
```

#### List Transitions

**Staggered List Appearance:**
```vue
<TransitionGroup
  enter-active-class="transition-all duration-300 ease-out"
  enter-from-class="opacity-0 translate-x-4"
  enter-to-class="opacity-100 translate-x-0"
  leave-active-class="transition-all duration-200 ease-in"
  leave-from-class="opacity-100"
  leave-to-class="opacity-0"
>
  <div
    v-for="(item, index) in items"
    :key="item.id"
    :style="{ transitionDelay: `${index * 50}ms` }"
    class="p-4 bg-white dark:bg-neutral-900 rounded-lg"
  >
    {{ item.name }}
  </div>
</TransitionGroup>
```

#### Focus States

**Input Focus Highlight:**
```vue
<UInput
  placeholder="Email"
  class="transition-all duration-200 ease-in-out
         focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
/>
```

**Card Focus Within:**
```vue
<UCard
  class="transition-all duration-200 ease-in-out
         focus-within:ring-2 focus-within:ring-primary-500"
>
  <input type="text" class="w-full" />
</UCard>
```

### Performance Best Practices

1. **Prefer `transform` and `opacity`**: These properties are GPU-accelerated
   ```vue
   <!-- Good: GPU-accelerated -->
   <div class="transition-transform duration-200 hover:scale-105" />

   <!-- Avoid: Causes layout recalculation -->
   <div class="transition-all duration-200 hover:w-full" />
   ```

2. **Use specific transition properties**: More performant than `transition-all`
   ```vue
   <!-- Good: Specific property -->
   <div class="transition-colors duration-200" />

   <!-- Less optimal: Transitions everything -->
   <div class="transition-all duration-200" />
   ```

3. **Avoid animating layout properties**: `width`, `height`, `margin`, `padding` cause reflows
   ```vue
   <!-- Good: Use transform instead -->
   <div class="transition-transform hover:scale-110" />

   <!-- Avoid: Triggers layout recalculation -->
   <div class="transition-all hover:w-[200px]" />
   ```

4. **Limit animations on long lists**: Use `v-if` instead of transitions for large datasets

### Accessibility Considerations

1. **Respect `prefers-reduced-motion`**: Disable animations for users who prefer reduced motion
   ```vue
   <div class="motion-safe:transition-all motion-safe:duration-200">
     Content
   </div>
   ```

2. **Keep animations short**: Maximum 500ms for most interactions

3. **Avoid auto-playing animations**: Only animate in response to user actions

4. **Don't rely solely on animation**: Provide alternative indicators (color, text, icons)

### Animation Best Practices

1. **Consistency**: Use the same duration and easing for similar interactions across the app
2. **Subtlety**: Animations should enhance, not distract (prefer `scale-105` over `scale-150`)
3. **Purpose**: Every animation should have a clear purpose (feedback, attention, transition)
4. **Performance**: Test animations on lower-end devices
5. **Reduced Motion**: Always provide `prefers-reduced-motion` alternatives for accessibility

### Quick Reference

**Most Common Combinations:**

- **Button hover**: `transition-colors duration-200 ease-in-out`
- **Card hover**: `transition-all duration-300 ease-out hover:shadow-xl hover:-translate-y-1`
- **Modal overlay**: `transition-opacity duration-300 ease-out`
- **Focus state**: `transition-all duration-200 ease-in-out focus:ring-2`
- **Loading spinner**: `animate-spin`
- **Skeleton loader**: `animate-pulse`

---

## Component Patterns

### Empty States

```vue
<div class="text-center py-12">
  <UIcon
    name="i-lucide-folder-open"
    class="h-12 w-12 mx-auto text-neutral-400 dark:text-neutral-600"
  />
  <h3 class="mt-4 text-lg font-medium text-neutral-900 dark:text-neutral-100">
    No items yet
  </h3>
  <p class="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
    Get started by creating your first item
  </p>
</div>
```

### Loading States

```vue
<div class="text-center py-8">
  <UIcon
    name="i-lucide-loader-2"
    class="h-8 w-8 mx-auto animate-spin text-neutral-400"
  />
  <p class="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
    Loading...
  </p>
</div>
```

### Form Patterns

**Standard Form:**
```vue
<UForm :schema="schema" :state="state" @submit="handleSubmit">
  <UFormField label="Field Name" name="field" required>
    <UInput v-model="state.field" placeholder="Enter value" />
  </UFormField>
  
  <UButton type="submit" :loading="isPending">
    Submit
  </UButton>
</UForm>
```

### Toast Notifications

Uses `useToast()` composable:

```typescript
const toast = useToast()

toast.add({
  title: 'Success',
  description: 'Operation completed successfully',
  color: 'success',
  icon: 'i-lucide-check-circle',
  timeout: 5000,
})
```

**Toast Colors:**
- `success` - Green (positive actions)
- `error` - Red (errors)
- `warning` - Orange (warnings)
- `info` - Blue (information)
- `neutral` - Neutral

---

## Design Tokens Summary

### Semantic Colors

Configured in `app/app.config.ts` using Tailwind's default color palettes:

- **Primary**: Violet (`violet-500`: `#a855f7`) - Tailwind's `violet` palette
- **Secondary**: Sky (`sky-500`: `#0ea5e9`) - Tailwind's `sky` palette
- **Success**: Green (`green-500`: `#22c55e`) - Tailwind's `green` palette
- **Warning**: Yellow (`yellow-500`: `#eab308`) - Tailwind's `yellow` palette
- **Error**: Red (`red-500`: `#ef4444`) - Tailwind's `red` palette
- **Neutral**: Slate (`slate-500`: `#64748b`) - Tailwind's `slate` palette
- **Info**: Blue (Nuxt UI default) - Tailwind's `blue` palette

**Usage:** Use semantic aliases (`color="primary"`) in components, not specific colors (`color="violet"`).

### Typography
- **Primary Font**: Public Sans (sans-serif)
- **Monospace Font**: JetBrains Mono
- **Base Size**: 16px (`text-base`)
- **Scale**: `text-xs` (12px) → `text-sm` (14px) → `text-base` (16px) → `text-lg` (18px) → `text-xl` (20px) → `text-2xl` (24px) → `text-3xl` (30px)
- **Weights**: Light (300), Normal (400), Medium (500), Semibold (600), Bold (700)
- **Common Combinations**: H1 = `text-3xl` + `font-bold`, Body = `text-base` + `font-normal`, Label = `text-sm` + `font-medium`

### Spacing
- **Base Unit**: 4px
- **Common Gaps**: 8px, 12px, 16px, 24px
- **Card Padding**: 16px (`p-4`) or 32px (`p-8`)

### Border Radius
- **Small**: `rounded` (4px)
- **Medium**: `rounded-lg` (8px)
- **Large**: `rounded-xl` (12px)

### Shadows
- **Card Shadow**: `shadow-sm`
- **Button Shadow**: `shadow-lg`
- **Hover Shadow**: `hover:shadow-[color]/25`

---

## Accessibility

### Common Patterns

- **Icon-Only Buttons**: Always wrap in `UTooltip` - tooltips provide visual context and improve accessibility
- **ARIA Labels**: Use `aria-label` for icon buttons when tooltips aren't appropriate
- **Semantic HTML**: Proper heading hierarchy (`h1` → `h2` → `h3`)
- **Focus States**: Built into Nuxt UI components
- **Color Contrast**: Meets WCAG AA standards (semantic colors are contrast-tested)
- **Keyboard Navigation**: Full keyboard support via Nuxt UI

### Accessibility Examples

**Icon Button with Tooltip (Preferred):**
```vue
<UTooltip text="Delete project">
  <UButton
    icon="i-lucide-trash-2"
    color="error"
    variant="ghost"
  />
</UTooltip>
```

**Form with Proper Labels:**
```vue
<UFormField label="Project Name" name="name" required>
  <UInput
    v-model="state.name"
    placeholder="Enter project name"
  />
</UFormField>
```

**Semantic Heading Hierarchy:**
```vue
<h1 class="text-3xl font-bold">Dashboard</h1>
<section>
  <h2 class="text-2xl font-semibold">Active Projects</h2>
  <article>
    <h3 class="text-xl font-semibold">Client Website</h3>
  </article>
</section>
```

---

## File Structure

```
app/
├── assets/
│   └── css/
│       └── main.css          # Tailwind @theme (fonts only)
├── components/                # Vue components using design system
├── layouts/
│   └── default.vue           # Main layout with header/navigation
└── app.config.ts              # Nuxt UI config (semantic colors, icons)

nuxt.config.ts                 # Nuxt config (UI module, color mode)
```

---

## Best Practices

1. **Consistency**: Always use Nuxt UI components when available
2. **Dark Mode**: Always include dark mode variants for colors
3. **Spacing**: Use Tailwind spacing utilities consistently
4. **Icons**: Use Lucide icons for all icon needs - all icon-only buttons must include a `UTooltip` wrapper for accessibility
5. **Colors**: Always use semantic color names (primary, secondary, success, warning, error, neutral) - never use arbitrary color values or non-semantic names
6. **Typography Scale**: Use the defined typography scale (`text-xs` through `text-3xl`) - maintain consistent visual hierarchy across pages
7. **Typography Weights**: Match weights to purpose - `font-normal` for body, `font-medium` for labels, `font-semibold`/`font-bold` for headings
8. **Line Height**: Always specify line height with scale - use `leading-tight` for headings, `leading-normal` for body text
9. **Monospace Font**: Use `font-mono` with `tabular-nums` for all numeric displays that need alignment (timers, statistics)
10. **Accessibility**: Include ARIA labels and semantic HTML
11. **Responsive**: Use responsive utilities (`sm:`, `md:`, `lg:`) for breakpoints
12. **Loading States**: Always show loading states for async operations
13. **Error Handling**: Use toast notifications for user feedback
14. **Empty States**: Provide helpful empty states with clear CTAs

---

## Component Reference Quick Links

- [Nuxt UI Documentation](https://ui.nuxt.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)

