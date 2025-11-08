# General guidelines

* Always include dark mode variants using `dark:` prefix for colors, backgrounds, borders, and text
* Use utility classes with responsive breakpoints (`sm:`, `md:`, `lg:`) rather than absolute positioning or fixed widths
* Prefer flexbox and grid layouts by default for responsive design
* Keep code clean and refactor as you go - extract reusable logic into helper functions and utilities
* Keep file sizes manageable - split complex components into smaller, focused components
* Use semantic color names (success, error, warning) over specific color values when possible
* Always show loading states for async operations using loading props or loading indicators
* Use toast notifications for user feedback on actions
* Include ARIA labels on icon-only buttons and interactive elements for accessibility
* Timer displays must use monospace font with tabular numbers for consistent width

---

# Design system guidelines

## Icons

* Use Lucide Icons with format `icon="lucide:icon-name"` (e.g., `lucide:plus`, `lucide:pencil`)

## Styling Approach

* Utility-first CSS with custom CSS variables
* Use CSS custom properties for color tokens

---

## Color System

### Primary Colors

* **Primary Actions**: Brand blue (`--color-brand-500`: `#2b86ff`)
* **Success States**: Mint green (`--color-mint-500`: `#15bf83`)
* **Warning/Pause**: Amberx orange (`--color-amberx-500`: `#ff8714`)
* **Neutral Elements**: Ink gray (`--color-ink-500`: `#3b4667`)
* **Error States**: Red (standard red palette)

### Color Usage Rules

* Primary buttons and main actions: Brand blue (`primary` or `brand`)
* Success messages and positive actions: Mint green (`success` or `green`)
* Error messages and destructive actions: Red (`error` or `red`)
* Warning messages and pause actions: Amberx orange (`warning` or `orange`)
* Neutral UI elements and secondary actions: Ink gray (`neutral` or `gray`)
* Project color tags: Red, Orange, Amber, Green, Teal, Blue, Purple, Pink

### Custom Color Palettes

The system uses custom color scales (50-900) for brand, ink, mint, and amberx colors:
- Brand: `--color-brand-50` through `--color-brand-900` (blue palette)
- Ink: `--color-ink-50` through `--color-ink-900` (gray palette)
- Mint: `--color-mint-50` through `--color-mint-900` (green palette)
- Amberx: `--color-amberx-50` through `--color-amberx-900` (orange palette)

---

## Typography

### Font Families

* **Primary UI Font**: Public Sans (`--font-sans`) - Use for all UI text
* **Monospace Font**: JetBrains Mono (`--font-mono`) - Use for timers, code, and technical content

### Typography Scale

* **Heading 1**: `text-3xl` (30px) - Page titles only
* **Heading 2**: `text-2xl` (24px) - Section titles
* **Heading 3**: `text-xl` (20px) - Subsection titles
* **Heading 4**: `text-lg` (18px) - Card titles
* **Body Large**: `text-base` (16px) - Default body text
* **Body Small**: `text-sm` (14px) - Secondary text, captions
* **Body Extra Small**: `text-xs` (12px) - Fine print, labels

### Font Weights

* Use `font-light` (300) sparingly
* Use `font-normal` (400) for body text
* Use `font-medium` (500) for emphasized text
* Use `font-semibold` (600) for headings and important labels
* Use `font-bold` (700) sparingly for strong emphasis

### Typography Rules

* Timer displays must use `font-mono` with `tabular-nums` class
* Code blocks must use `font-mono`
* Never use more than one heading level 1 (`text-3xl`) per page

---

## Spacing & Layout

### Spacing Scale

Base unit is 4px. Common spacing values:
* `space-y-2` - 8px vertical spacing (tight)
* `space-y-4` - 16px vertical spacing (standard)
* `space-y-6` - 24px vertical spacing (comfortable)
* `space-y-8` - 32px vertical spacing (loose)
* `gap-2` - 8px gap
* `gap-3` - 12px gap
* `gap-4` - 16px gap (standard)

### Layout Patterns

* Use container components for responsive constrained layouts
* Card padding: `p-4` (16px) for standard cards, `p-8` (32px) for large cards
* Page layouts should use `space-y-6` between major sections
* List items should use `space-y-2` for compact lists, `space-y-4` for standard lists

---

## Icon Sizes

* `h-4 w-4` (16px) - Small icons, inline with small text
* `h-5 w-5` (20px) - Medium icons (default)
* `h-6 w-6` (24px) - Large icons
* `h-8 w-8` (32px) - Extra large icons
* `h-12 w-12` (48px) - Hero/feature icons

---

## Border Radius

* `rounded` (4px) - Small radius for small elements
* `rounded-lg` (8px) - Medium radius for cards, buttons (default)
* `rounded-xl` (12px) - Large radius for prominent elements
* Cards should always use `rounded-lg`

---

## Dark Mode

* Always include dark mode variants for all colors, backgrounds, borders, and text
* Light mode backgrounds: `bg-white`, `bg-gray-50`
* Dark mode backgrounds: `dark:bg-gray-900`, `dark:bg-gray-800`
* Light mode text: `text-gray-900`, `text-gray-700`
* Dark mode text: `dark:text-gray-100`, `dark:text-gray-300`
* Borders: `border-gray-200 dark:border-gray-800`
* Always pair color classes with their dark mode equivalents

---

## Animations & Transitions

* Use `transition-colors` for color changes (default duration 200ms)
* Use `transition-all` for multi-property transitions
* Default duration: `duration-200` (200ms)
* Longer transitions: `duration-300` (300ms)
* Loading spinners: `animate-spin`
* Hover scale: `hover:scale-105` for interactive cards
* Hover backgrounds: `hover:bg-gray-100 dark:hover:bg-gray-800`

---

## Component Guidelines

### Button

The Button component is a fundamental interactive element designed to trigger actions or navigate users through the application. It provides visual feedback and clear affordances to enhance user experience.

#### Usage

Buttons should be used for important actions that users need to take, such as form submissions, confirming choices, or initiating processes. They communicate interactivity and should have clear, action-oriented labels.

#### Variants

* **Primary Button**
  * Purpose: Used for the main action in a section or page
  * Visual Style: Bold, filled with the primary brand color
  * Usage: One primary button per section to guide users toward the most important action
  * Implementation: Use `variant="solid"` with `color="primary"`

* **Secondary Button**
  * Purpose: Used for alternative or supporting actions
  * Visual Style: Outlined with the primary color, transparent background
  * Usage: Can appear alongside a primary button for less important actions
  * Implementation: Use `variant="outline"` with `color="primary"`

* **Tertiary Button**
  * Purpose: Used for the least important actions
  * Visual Style: Text-only with no border, using primary color
  * Usage: For actions that should be available but not emphasized
  * Implementation: Use `variant="ghost"` for less important actions and icon buttons

* **Subtle Button**
  * Purpose: Used for subtle background tint actions
  * Visual Style: Soft background tint
  * Implementation: Use `variant="soft"`

#### Sizes

* `sm` - Small (compact layouts)
* `md` - Medium (default, most cases)
* `lg` - Large (prominent actions)

#### Behavior Rules

* Always include icons for icon-only buttons using `icon` prop
* Show loading state with `loading` prop for async operations
* Use `block` prop for full-width buttons in forms

### Card

Container component for grouping related content.

#### Styling

* Always use `rounded-lg` for border radius
* Use `border-2` with `border-gray-200 dark:border-gray-800` for borders
* Background: `bg-white dark:bg-gray-900` or `bg-white/80 dark:bg-gray-900/70` with backdrop blur
* Card padding: `p-4` (standard) or `p-8` (large cards)
* Add hover effects: `hover:border-gray-300 dark:hover:border-gray-700`

#### Structure

* Use `header` slot for titles
* Use `default` slot for content
* Use `footer` slot for actions

### Modal

Modal dialogs for user interactions.

#### Usage Rules

* Control visibility with appropriate state management
* Always wrap modal content in Card component
* Use `title` and `description` props for clear modal purpose
* Prevent closing during async operations to avoid accidental closure
* Modal content should be in `content` slot or equivalent

### Form

Form components with validation support.

#### Structure

* Use validation schema for form validation
* Use reactive state object for form values
* Mark required fields appropriately
* Use submit handler for form submission
* Show loading state on submit button during async operations

#### Input Sizes

* `sm` - Small (compact forms)
* `md` - Medium (default)
* `lg` - Large (prominent inputs)

### Badge

Status indicators and labels.

#### Variants

* `subtle` - Subtle background tint (most badges)
* `solid` - Prominent badges
* `outline` - Outlined border

#### Colors

* `primary`, `success`, `error`, `warning`, `neutral`

#### Sizes

* `sm` or `md` (default)

### Switch

Toggle switches for boolean values.

#### Usage

* Use for boolean toggles only
* Show loading state during async operations
* Always provide clear labels or context for what the switch controls

### Alert

Notification banners for messages.

#### Variants

* `soft` - Subtle alerts
* `solid` - Prominent alerts

#### Colors

* `error` (red), `success` (green), `warning` (orange), `info` (blue)

#### Usage Rules

* Always include an appropriate `icon` prop
* Use `title` for alert heading

### Toast Notifications

Temporary user feedback on actions.

#### Usage

* Use for temporary user feedback on actions
* Default timeout: 5000ms (5 seconds)
* Colors: `success` (green), `error` (red), `warning` (orange), `info` (blue), `gray` (neutral)
* Always include a descriptive `title` and optional `description`
* Include appropriate icons

---

## Component Patterns

### Empty States

Always include:
* Large icon (h-12 w-12) centered
* Heading (text-lg font-medium)
* Description text (text-sm text-gray-500 dark:text-gray-400)
* Clear call-to-action button when applicable

### Loading States

* Use spinner icon (`lucide:loader-2`) with `animate-spin` class
* Include loading text below spinner
* Size spinner appropriately: `h-8 w-8` for page loading, smaller for inline loading

### Error States

* Use Alert component with error color
* Include clear error message
* Provide actionable next steps when possible
* Show error toasts for inline errors

---

## Accessibility

* Always include `aria-label` on icon-only buttons
* Use proper semantic HTML with heading hierarchy (h1 → h2 → h3)
* Ensure keyboard navigation works for all interactive elements
* Maintain WCAG AA color contrast standards
* Use focus-visible states for keyboard accessibility

---

## Best Practices

1. Always use component library components when available - avoid custom alternatives
2. Pair every color class with its dark mode variant
3. Use consistent spacing utilities
4. Use Lucide icons for all icon needs
5. Use semantic color names (success, error) over hex values
6. Show loading states for all async operations
7. Provide helpful empty states with clear actions
8. Use toast notifications for user feedback
9. Keep components focused and reusable
10. Extract complex logic into helper functions and utilities

