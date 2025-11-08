# LifeStint Design System

## Overview

LifeStint uses a modern, component-based design system built on **Nuxt UI v4** with **Tailwind CSS v4**, featuring a custom color palette, typography system, and comprehensive dark mode support.

---

## Framework & Tools

- **UI Framework**: Nuxt UI v4 (`@nuxt/ui`)
- **CSS Framework**: Tailwind CSS v4 (via `@theme` directive)
- **Icons**: Lucide Icons
- **Build Tool**: Nuxt 4.1.2
- **Styling Approach**: Utility-first CSS with custom CSS variables

---

## Color System

### Custom Brand Colors

The design system defines three custom color palettes:

#### Brand Colors (Blue Palette)
Primary brand color used for main actions and branding.

```css
--color-brand-50:  #eef7ff  /* Lightest */
--color-brand-100: #d9edff
--color-brand-200: #b8dcff
--color-brand-300: #8ec6ff
--color-brand-400: #5ea8ff
--color-brand-500: #2b86ff  /* Primary */
--color-brand-600: #196af0
--color-brand-700: #1656c7
--color-brand-800: #153f8f
--color-brand-900: #132e67  /* Darkest */
```

#### Ink Colors (Gray Palette)
Neutral colors for text, backgrounds, and UI elements.

```css
--color-ink-50:  #f5f7fb  /* Lightest */
--color-ink-100: #e7eaf2
--color-ink-200: #c5cbda
--color-ink-300: #98a0b5
--color-ink-400: #6b7490
--color-ink-500: #3b4667
--color-ink-600: #2b3552
--color-ink-700: #1e2740
--color-ink-800: #141b2f
--color-ink-900: #0b1020  /* Darkest */
```

#### Mint Colors (Green Palette)
Success states, positive actions, and accent elements.

```css
--color-mint-50:  #ecfff7  /* Lightest */
--color-mint-100: #ccfee9
--color-mint-200: #97f7d1
--color-mint-300: #5eeab5
--color-mint-400: #2fd89a
--color-mint-500: #15bf83  /* Primary Mint */
--color-mint-600: #0da36f
--color-mint-700: #0a855c
--color-mint-800: #0a684b
--color-mint-900: #0a523d  /* Darkest */
```

#### Amberx Colors (Orange/Amber Palette)
Warning states, pause actions, and attention elements.

```css
--color-amberx-50:  #fff7eb  /* Lightest */
--color-amberx-100: #ffedcc
--color-amberx-200: #ffd99a
--color-amberx-300: #ffc166
--color-amberx-400: #ffa234
--color-amberx-500: #ff8714  /* Primary */
--color-amberx-600: #e36f06
--color-amberx-700: #bb5907
--color-amberx-800: #90440a
--color-amberx-900: #6f350c  /* Darkest */
```

### Standard Color Palette

In addition to custom colors, the system uses standard Tailwind colors:
- **Red**: Error states, destructive actions
- **Green**: Success states, positive actions
- **Orange**: Warning states, pause actions
- **Blue**: Information states
- **Gray/Neutral**: Neutral UI elements, text, borders

### Color Usage Patterns

- **Primary Actions**: Brand colors (blue)
- **Success States**: Mint colors (green) or standard green
- **Error States**: Red
- **Warning/Pause**: Amberx colors (orange) or standard orange
- **Neutral Elements**: Ink colors (gray) or standard gray
- **Project Color Tags**: Red, Orange, Amber, Green, Teal, Blue, Purple, Pink

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
- `primary` / `brand` - Main actions
- `success` / `green` - Positive actions
- `error` / `red` - Destructive actions
- `warning` / `orange` - Warning actions
- `neutral` / `gray` - Neutral actions

**Sizes:**
- `xs` - Extra small
- `sm` - Small
- `md` - Medium (default)
- `lg` - Large

**Common Props:**
- `icon` - Icon name (e.g., `"lucide:plus"`, `"lucide:pause"`)
- `loading` - Shows loading spinner
- `disabled` - Disables interaction
- `block` - Full width button

**Example:**
```vue
<UButton
  icon="lucide:plus"
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
- Border: `border-2` with `border-gray-200 dark:border-gray-800`
- Background: `bg-white dark:bg-gray-900`
- Hover effects: `hover:border-gray-300 dark:hover:border-gray-700`

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

Hover tooltips for additional context.

**Props:**
- `text` - Tooltip text content

**Example:**
```vue
<UTooltip text="Edit project">
  <UButton icon="lucide:pencil" />
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
  icon="lucide:triangle-alert"
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
<UCard class="bg-white/80 shadow-sm backdrop-blur dark:bg-gray-900/70">
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
   - Usage: `icon="lucide:icon-name"`
   - Examples: `lucide:plus`, `lucide:pencil`, `lucide:archive`

### Icon Sizes

- `h-4 w-4` - Small icons (16px)
- `h-5 w-5` - Medium icons (20px)
- `h-6 w-6` - Large icons (24px)
- `h-8 w-8` - Extra large icons (32px)
- `h-12 w-12` - Hero icons (48px)

### Icon Usage Patterns

**With Buttons:**
```vue
<UButton icon="lucide:plus">Add</UButton>
```

**Standalone:**
```vue
<Icon name="lucide:target" class="h-4 w-4" />
```

**With UIcon Component:**
```vue
<UIcon name="i-lucide-alert-triangle" class="size-6 text-amber-500" />
```

---

## Dark Mode

### Configuration

- **Preference**: System preference (follows OS setting)
- **Fallback**: Light mode
- **Implementation**: Nuxt UI color mode with CSS variables

### Dark Mode Patterns

**Background Colors:**
- Light: `bg-white`, `bg-gray-50`
- Dark: `dark:bg-gray-900`, `dark:bg-gray-800`

**Text Colors:**
- Light: `text-gray-900`, `text-gray-700`
- Dark: `dark:text-gray-100`, `dark:text-gray-300`

**Border Colors:**
- Light: `border-gray-200`
- Dark: `dark:border-gray-800`

**Common Pattern:**
```vue
<div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-800">
  Content
</div>
```

### Dark Mode Toggle

Uses `UColorModeButton` component:
```vue
<UColorModeButton />
```

---

## Animation & Transitions

### Transition Classes

- `transition-colors` - Color transitions
- `transition-all` - All property transitions
- `duration-200` - 200ms duration (default)
- `duration-300` - 300ms duration

### Animation Classes

- `animate-spin` - Rotating spinner
- `animate-pulse` - Pulsing animation

### Hover Effects

- `hover:scale-105` - Slight scale on hover
- `hover:bg-gray-100 dark:hover:bg-gray-800` - Background color change

---

## Component Patterns

### Empty States

```vue
<div class="text-center py-12">
  <Icon
    name="lucide:folder-open"
    class="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600"
  />
  <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
    No items yet
  </h3>
  <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
    Get started by creating your first item
  </p>
</div>
```

### Loading States

```vue
<div class="text-center py-8">
  <Icon
    name="lucide:loader-2"
    class="h-8 w-8 mx-auto animate-spin text-gray-400"
  />
  <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
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
- `gray` - Neutral

---

## Design Tokens Summary

### Colors
- **Primary**: Brand blue (`--color-brand-500`: `#2b86ff`)
- **Success**: Mint green (`--color-mint-500`: `#15bf83`)
- **Warning**: Amberx orange (`--color-amberx-500`: `#ff8714`)
- **Neutral**: Ink gray (`--color-ink-500`: `#3b4667`)

### Typography
- **Primary Font**: Public Sans (sans-serif)
- **Monospace Font**: JetBrains Mono
- **Base Size**: 16px (`text-base`)

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

- **ARIA Labels**: `aria-label` on icon buttons
- **Semantic HTML**: Proper heading hierarchy
- **Focus States**: Built into Nuxt UI components
- **Color Contrast**: Meets WCAG AA standards
- **Keyboard Navigation**: Full keyboard support via Nuxt UI

---

## File Structure

```
app/
├── assets/
│   └── css/
│       └── main.css          # Design system CSS variables
├── components/                # Vue components using design system
├── layouts/
│   └── default.vue           # Main layout with header/navigation
└── app.config.ts              # App configuration (UI icons, etc.)

nuxt.config.ts                 # Nuxt config (UI module, color mode)
```

---

## Best Practices

1. **Consistency**: Always use Nuxt UI components when available
2. **Dark Mode**: Always include dark mode variants for colors
3. **Spacing**: Use Tailwind spacing utilities consistently
4. **Icons**: Use Lucide icons for all icon needs
5. **Colors**: Use semantic color names (success, error) over specific colors
6. **Accessibility**: Include ARIA labels and semantic HTML
7. **Responsive**: Use responsive utilities (`sm:`, `md:`, `lg:`) for breakpoints
8. **Loading States**: Always show loading states for async operations
9. **Error Handling**: Use toast notifications for user feedback
10. **Empty States**: Provide helpful empty states with clear CTAs

---

## Component Reference Quick Links

- [Nuxt UI Documentation](https://ui.nuxt.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)

