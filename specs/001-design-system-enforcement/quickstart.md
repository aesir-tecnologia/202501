# Quickstart Guide: Design System Token Enforcement

**Feature**: Design System Token Enforcement
**Branch**: `001-design-system-enforcement`
**Last Updated**: 2025-11-14

## Overview

This guide provides step-by-step instructions for enforcing design system tokens across all Vue components in the LifeStint application. Follow this guide to ensure all components use standardized colors, typography, spacing, icons, and dark mode tokens.

---

## Prerequisites

Before starting:

1. **Read the design system documentation**:
   - `docs/DESIGN_SYSTEM.md` - Complete design system reference
   - `app/assets/css/main.css` - Token definitions in `@theme` blocks

2. **Understand the component structure**:
   - `app/components/` - Reusable Vue components
   - `app/pages/` - Page components (routes)
   - `app/layouts/` - Layout components

3. **Set up your environment**:
   ```bash
   npm install
   npm run dev  # Start dev server at localhost:3005
   ```

4. **Run tests to establish baseline**:
   ```bash
   npm run test:run  # Run all tests to ensure starting point is green
   ```

---

## Implementation Workflow

### Step 1: Identify Components to Update

**Find components with potential violations:**

```bash
# Find hex color codes
grep -r "#[0-9a-fA-F]\{3,6\}" app/components app/pages app/layouts --include="*.vue"

# Find inline styles
grep -r 'style="' app/components app/pages app/layouts --include="*.vue"

# Find icons without i-lucide- prefix
grep -r 'icon=' app/components app/pages app/layouts --include="*.vue" | grep -v 'i-lucide-'

# Find potential custom colors (not brand/ink/mint/amberx)
grep -r -E "bg-(blue|red|green|orange|purple|pink|teal)-[0-9]" app/components app/pages app/layouts --include="*.vue"
```

**Create a checklist** of all components that need updating based on search results.

---

### Step 2: Component Update Process

For each component identified, follow this systematic approach:

#### 2.1 Take Before Screenshot
- Open the component in browser (both light and dark mode)
- Screenshot for visual comparison later

#### 2.2 Read Component File
- Open the `.vue` file in your editor
- Identify all visual styling (classes, props, inline styles)

#### 2.3 Update Colors

**Replace custom hex/RGB colors with design tokens:**

| Before | After | Usage Context |
|--------|-------|---------------|
| `#2b86ff` or `blue-500` | `brand-500` | Primary actions, branding |
| `#15bf83` or `green-500` | `mint-500` | Success states |
| `#ff8714` or `orange-500` | `amberx-500` | Warning states |
| Custom grays | `ink-*` or `gray-*` | Neutral UI |
| `#ff0000` or `red-500` | `red-500` | Error states |

**Add dark mode variants if missing:**

```vue
<!-- Before -->
<div class="bg-white text-gray-900 border-gray-200">

<!-- After -->
<div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-800">
```

#### 2.4 Update Typography

**Apply typography scale:**

```vue
<!-- Before -->
<h1 class="text-2xl">Page Title</h1>
<p class="text-md">Body text</p>

<!-- After -->
<h1 class="text-3xl font-semibold">Page Title</h1>
<p class="text-base">Body text</p>
```

**Font families:**
- UI text: `font-sans` (default, can be omitted)
- Timers/code: `font-mono tabular-nums`

#### 2.5 Update Spacing

**Use Tailwind spacing scale (4px base unit):**

```vue
<!-- Before -->
<div class="space-y-3">
<div class="gap-5">

<!-- After -->
<div class="space-y-4">  <!-- 16px -->
<div class="gap-4">      <!-- 16px -->
```

Common values: `2` (8px), `4` (16px), `6` (24px), `8` (32px)

#### 2.6 Update Icons

**Add i-lucide- prefix and size classes:**

```vue
<!-- Before -->
<UButton icon="plus" />
<Icon name="pencil" />

<!-- After -->
<UButton icon="i-lucide-plus" />
<Icon name="i-lucide-pencil" class="h-5 w-5" />
```

**Icon sizes:**
- Small: `h-4 w-4` (16px)
- Medium: `h-5 w-5` (20px)
- Large: `h-6 w-6` (24px)
- Hero: `h-12 w-12` (48px)

#### 2.7 Update Nuxt UI Component Props

**Validate color/variant/size props:**

```vue
<!-- Before -->
<UButton color="blue" variant="primary" />
<UBadge color="mint" variant="soft" />

<!-- After -->
<UButton color="primary" variant="solid" />
<UBadge color="success" variant="subtle" />
```

**Valid UButton colors**: `primary`, `success`, `error`, `warning`, `neutral`
**Valid UButton variants**: `solid`, `outline`, `ghost`, `soft`
**Valid UButton sizes**: `xs`, `sm`, `md`, `lg`

#### 2.8 Convert Inline Styles

**Replace all inline styles with Tailwind classes:**

```vue
<!-- Before -->
<div style="color: #2b86ff; margin-top: 16px; padding: 12px;">

<!-- After -->
<div class="text-brand-500 mt-4 p-3">
```

#### 2.9 Standardize Border Radius

**Use consistent border radius:**

```vue
<!-- Before -->
<div class="rounded-md">  <!-- Non-standard -->

<!-- After -->
<div class="rounded-lg">  <!-- Standard for cards -->
```

- Cards: `rounded-lg`
- Buttons: `rounded` (Nuxt UI default)
- Badges: `rounded-full` or `rounded`

#### 2.10 Verify Changes

1. **Visual Testing**:
   - View component in browser (light mode)
   - Toggle to dark mode and verify readability
   - Test all interactive states (hover, focus, active, disabled)
   - Compare with before screenshot

2. **Contrast Checking**:
   - Use browser devtools to verify WCAG AA contrast ratios
   - Text on backgrounds: minimum 4.5:1 ratio
   - Large text (18px+): minimum 3:1 ratio

3. **Functional Testing**:
   ```bash
   npm test  # Run component tests
   ```
   - Verify no behavioral regressions
   - All existing tests should still pass

---

### Step 3: Component-Specific Guidance

#### Buttons (UButton)
```vue
<UButton
  icon="i-lucide-plus"
  color="primary"      <!-- Use semantic names -->
  variant="solid"      <!-- solid | outline | ghost | soft -->
  size="md"            <!-- xs | sm | md | lg -->
  :loading="isPending"
>
  Button Text
</UButton>
```

#### Cards (UCard)
```vue
<UCard class="bg-white/80 dark:bg-gray-900/70 shadow-sm backdrop-blur">
  <template #header>
    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
      Card Title
    </h3>
  </template>
  <div class="space-y-4">
    <!-- Card content -->
  </div>
</UCard>
```

#### Badges (UBadge)
```vue
<UBadge
  color="success"      <!-- primary | success | error | warning | neutral -->
  variant="subtle"     <!-- solid | subtle | outline -->
  size="sm"           <!-- xs | sm | md | lg -->
>
  Active
</UBadge>
```

#### Forms (UForm + UInput)
```vue
<UForm :schema="schema" :state="state" @submit="onSubmit">
  <UFormField label="Email" name="email" required>
    <UInput
      v-model="state.email"
      type="email"
      placeholder="your@email.com"
      class="text-base"
    />
  </UFormField>
</UForm>
```

#### Empty States
```vue
<div class="text-center py-12">
  <Icon
    name="i-lucide-folder-open"
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

#### Loading States
```vue
<div class="text-center py-8">
  <Icon
    name="i-lucide-loader-2"
    class="h-8 w-8 mx-auto animate-spin text-gray-400"
  />
  <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
    Loading...
  </p>
</div>
```

---

## Common Patterns

### Dark Mode Pattern
Always provide dark mode variants for visual elements:

```vue
<div class="
  bg-white dark:bg-gray-900
  text-gray-900 dark:text-gray-100
  border-gray-200 dark:border-gray-800
">
  Content
</div>
```

### Hover Effects Pattern
```vue
<button class="
  transition-colors
  hover:bg-gray-100 dark:hover:bg-gray-800
  hover:scale-105
">
  Hover me
</button>
```

### Gradient Pattern (with tokens)
```vue
<div class="bg-gradient-to-r from-brand-500 to-brand-700">
  Gradient background
</div>
```

### Colored Shadow Pattern (with tokens)
```vue
<div class="shadow-lg shadow-brand-500/20">
  Card with colored shadow
</div>
```

---

## Verification Checklist

After updating each component, verify:

- [ ] All colors use design system tokens (brand, ink, mint, amberx, or standard colors)
- [ ] Dark mode variants provided for all visual elements
- [ ] Typography uses documented scale (`text-3xl` through `text-xs`)
- [ ] Font families correct (`font-sans` for UI, `font-mono` for code/timers)
- [ ] Spacing uses Tailwind scale (`space-y-*`, `gap-*`, `p-*`, `m-*`)
- [ ] Icons use `i-lucide-` prefix with proper size classes
- [ ] Nuxt UI component props use documented values
- [ ] No inline styles (all converted to Tailwind classes)
- [ ] Border radius standardized (`rounded`, `rounded-lg`, `rounded-xl`)
- [ ] Visual appearance maintained (no regressions)
- [ ] Dark mode readable and visually consistent
- [ ] Interactive states work (hover, focus, active, disabled)
- [ ] WCAG AA contrast ratios met
- [ ] Existing tests pass (`npm test`)

---

## Testing Strategy

### During Development
```bash
npm run dev  # Run dev server, test in browser
```

**Manual Visual Testing**:
1. Open page in browser (light mode)
2. Toggle dark mode (UColorModeButton in header)
3. Test all interactive states
4. Verify contrast with browser devtools

**Functional Testing**:
```bash
npm test  # Run tests in watch mode
```

### Before Committing
```bash
npm run lint         # Check code style
npm run lint:fix     # Fix linting issues
npm run test:run     # Run all tests once
```

---

## Common Issues & Solutions

### Issue: Color looks different in dark mode
**Solution**: Ensure you've added `dark:` variants for text, background, and borders

### Issue: Icon not showing
**Solution**: Verify `i-lucide-` prefix is present and icon name is correct

### Issue: Spacing looks wrong
**Solution**: Use Tailwind's 4px base scale (2, 4, 6, 8 instead of 3, 5, 7)

### Issue: Button color not working
**Solution**: Use semantic color names (`primary`, `success`, `error`, `warning`, `neutral`)

### Issue: Text hard to read
**Solution**: Check contrast ratio with browser devtools, adjust color shade

### Issue: Tests failing
**Solution**: Only change visual tokens, not component logic or structure

---

## Reference Quick Links

- **Design System**: `docs/DESIGN_SYSTEM.md`
- **Token Definitions**: `app/assets/css/main.css` (`@theme` blocks)
- **Nuxt UI Docs**: https://ui.nuxt.com/
- **Tailwind Docs**: https://tailwindcss.com/
- **Lucide Icons**: https://lucide.dev/

---

## Progress Tracking

Track your progress by component category:

### Components (`app/components/`)
- [ ] Analytics components
- [ ] Auth components
- [ ] Common components
- [ ] Projects components
- [ ] Reports components
- [ ] Settings components
- [ ] Stints components

### Pages (`app/pages/`)
- [ ] Analytics pages
- [ ] Auth pages
- [ ] Reports pages
- [ ] Settings pages
- [ ] Root pages (index, home, etc.)

### Layouts (`app/layouts/`)
- [ ] Default layout
- [ ] Other layouts

---

## Success Criteria

When all components are updated:

- ✅ Zero instances of undocumented hex codes or custom colors
- ✅ All text uses documented typography scale
- ✅ All spacing uses Tailwind's standard scale
- ✅ All icons use standardized Lucide syntax
- ✅ All Nuxt UI props use documented values
- ✅ Dark mode works correctly across all components
- ✅ Visual audit confirms consistent brand presentation
- ✅ All existing tests pass

---

## Next Steps

After completing implementation:

1. **Final Visual Audit**: Review all pages in light and dark mode
2. **Run Full Test Suite**: `npm run test:run`
3. **Run Linting**: `npm run lint:fix`
4. **Build & Preview**: `npm run generate && npm run serve`
5. **Document Findings**: Note any design system gaps discovered
6. **Update Agent Context**: Run `.specify/scripts/bash/update-agent-context.sh claude`

Implementation ready to begin! 🚀
