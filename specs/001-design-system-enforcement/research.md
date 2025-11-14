# Research: Design System Token Enforcement

**Feature**: Design System Token Enforcement
**Branch**: `001-design-system-enforcement`
**Date**: 2025-11-14

## Purpose

This document consolidates research findings and decisions made to resolve unknowns identified in the Technical Context phase. All "NEEDS CLARIFICATION" items from the planning phase have been investigated and resolved.

---

## Research Areas

### 1. Component Audit Methodology

**Decision**: Manual file-by-file audit combined with automated pattern searches

**Rationale**:
- Grep/search tools can identify obvious violations (hex codes, undocumented classes)
- Manual review required for semantic correctness (e.g., is `blue-500` being used for brand actions or incorrectly?)
- Visual testing in browser needed to verify dark mode and contrast
- This hybrid approach balances thoroughness with efficiency

**Alternatives Considered**:
- Fully automated linting approach: Rejected because it cannot verify semantic token usage or visual correctness
- Pure manual audit: Rejected because it's inefficient for finding simple pattern violations (hex codes, icon prefixes)

**Implementation Approach**:
1. Use Grep to identify files with potential violations (hex codes, custom colors, missing `i-lucide-` prefix)
2. Manual review of flagged files to determine correct token mappings
3. Visual testing in browser (light/dark mode) after each component update
4. Run existing component tests to ensure no behavioral regressions

---

### 2. Custom Color Value Mapping Strategy

**Decision**: Map custom colors to semantically appropriate design tokens based on usage context

**Rationale**:
- Design system provides sufficient color palette coverage (brand, ink, mint, amberx, standard colors)
- Custom colors typically used for semantic purposes (primary actions, errors, success, warnings, neutral UI)
- Mapping based on *intent* rather than exact hex match ensures visual consistency

**Mapping Guidelines**:
| Custom Color Usage | Design Token |
|-------------------|--------------|
| Primary actions, branding | `brand-500` or appropriate shade |
| Success states, positive actions | `mint-500`, `green-500` |
| Error states, destructive actions | `red-500` |
| Warning states, pause actions | `amberx-500`, `orange-500` |
| Neutral UI, text, borders | `ink-*`, `gray-*` |
| Background surfaces | `white`, `gray-50/100/900` with dark variants |

**Alternatives Considered**:
- Creating new tokens for every custom color: Rejected because it defeats the purpose of standardization
- Using closest visual match regardless of semantic meaning: Rejected because it can create confusion (e.g., using green for warnings)

---

### 3. Dark Mode Token Addition Strategy

**Decision**: Add dark mode variants immediately using documented patterns when missing

**Rationale**:
- Dark mode is already implemented and working in the application
- Missing dark variants create visual inconsistencies and accessibility issues
- Design system provides clear patterns: `dark:bg-gray-900`, `dark:text-gray-100`, `dark:border-gray-800`
- Adding immediately ensures comprehensive dark mode support

**Standard Dark Mode Patterns**:
```vue
<!-- Backgrounds -->
<div class="bg-white dark:bg-gray-900">

<!-- Text -->
<p class="text-gray-900 dark:text-gray-100">

<!-- Borders -->
<div class="border-gray-200 dark:border-gray-800">

<!-- Hover states -->
<button class="hover:bg-gray-100 dark:hover:bg-gray-800">
```

**Alternatives Considered**:
- Deferring dark mode to separate task: Rejected because it would require re-auditing all components later
- Using different dark mode token patterns: Rejected to maintain consistency with existing patterns

---

### 4. Icon Standardization Approach

**Decision**: Enforce `i-lucide-` prefix and standardized size classes for all icons

**Rationale**:
- Nuxt UI icon system requires `i-` prefix for Lucide icons
- Consistent sizing ensures visual hierarchy and alignment
- Lucide icons already available and working in the codebase

**Size Standards**:
- Small icons: `h-4 w-4` (16px) - UI elements, inline icons
- Medium icons: `h-5 w-5` (20px) - Default buttons
- Large icons: `h-6 w-6` (24px) - Featured actions
- Extra large: `h-8 w-8` (32px) - Headers
- Hero icons: `h-12 w-12` (48px) - Empty states

**Implementation**:
- Convert `icon="icon-name"` → `icon="i-lucide-icon-name"`
- Convert `<Icon name="icon-name">` → `<Icon name="i-lucide-icon-name">`
- Add/correct size classes on standalone icons

**Alternatives Considered**:
- Mixed icon libraries: Rejected for consistency and bundle size
- Custom icon sizes: Rejected to maintain design system scale

---

### 5. Inline Style Conversion Strategy

**Decision**: Convert all inline styles to Tailwind CSS classes with design tokens

**Rationale**:
- Inline styles cannot be themed (light/dark mode)
- Inline styles bypass design system constraints
- Tailwind classes provide better maintainability and IDE support
- Current codebase primarily uses Tailwind classes

**Conversion Examples**:
```vue
<!-- Before -->
<div style="color: #2b86ff; margin-top: 16px;">

<!-- After -->
<div class="text-brand-500 mt-4">
```

**Alternatives Considered**:
- Keeping inline styles for "unique" values: Rejected because it creates maintenance debt and bypasses theming

---

### 6. Multi-Color Effects (Gradients, Shadows)

**Decision**: Apply design tokens to each color in multi-color effects

**Rationale**:
- Gradients and colored shadows enhance visual richness
- Design system tokens can be applied to each color component
- Tailwind CSS v4 supports complex color effects

**Patterns**:
```vue
<!-- Gradients -->
<div class="bg-gradient-to-r from-brand-500 to-brand-700">

<!-- Colored shadows -->
<div class="shadow-lg shadow-brand-500/20">

<!-- Overlays -->
<div class="bg-gradient-to-t from-gray-900/90 to-transparent">
```

**Alternatives Considered**:
- Removing complex effects: Rejected because it would reduce visual quality
- Using fixed hex colors: Rejected because it bypasses theme system

---

### 7. Component Props Validation

**Decision**: Audit all Nuxt UI component color/variant/size props against design system documentation

**Rationale**:
- Nuxt UI components have specific prop values that are documented
- Using undocumented values may cause rendering issues or inconsistencies
- Design system explicitly lists valid options

**Key Components to Validate**:
- `UButton`: `color`, `variant`, `size` props
- `UBadge`: `color`, `variant`, `size` props
- `UAlert`: `color`, `variant` props
- `UCard`: styling classes

**Validation Approach**:
1. Read component template
2. Check all prop values against DESIGN_SYSTEM.md component documentation
3. Replace undocumented values with correct alternatives

**Alternatives Considered**:
- Trust existing prop usage: Rejected because inconsistencies likely exist
- Add type checking: Deferred to future task (would require TypeScript changes)

---

### 8. Visual Regression Testing Strategy

**Decision**: Manual before/after visual testing in browser (light + dark mode)

**Rationale**:
- Automated visual regression testing not currently set up in the project
- Manual testing is sufficient for this focused design system enforcement task
- Visual changes should be minimal if components already follow most patterns
- Critical to verify no accessibility regressions (contrast, readability)

**Testing Process**:
1. Before starting: Screenshot each page in light and dark mode
2. After each component update: Verify in browser (both modes)
3. Check all interactive states: hover, focus, active, disabled
4. Verify WCAG AA contrast ratios using browser devtools
5. Run existing component tests: `npm test`

**Alternatives Considered**:
- Automated visual regression testing: Deferred to future task (requires Percy/Chromatic setup)
- No visual testing: Rejected due to high risk of breaking user experience

---

### 9. Typography Token Application

**Decision**: Apply documented typography scale and font families to all text elements

**Rationale**:
- Typography directly affects readability and content hierarchy
- Design system provides complete scale: `text-3xl` through `text-xs`
- Font families clearly defined: `font-sans` (UI), `font-mono` (code/timers)

**Typography Mapping**:
| Element Type | Class |
|--------------|-------|
| Page titles (H1) | `text-3xl font-semibold` |
| Section titles (H2) | `text-2xl font-semibold` |
| Subsection titles (H3) | `text-xl font-medium` |
| Card titles (H4) | `text-lg font-medium` |
| Body text | `text-base` |
| Secondary text | `text-sm` |
| Fine print | `text-xs` |
| Timer displays | `font-mono tabular-nums` |
| Code elements | `font-mono` |

**Alternatives Considered**:
- Custom font sizes: Rejected to maintain design system scale
- Skipping font family enforcement: Rejected because it's critical for brand consistency

---

### 10. Border Radius Standardization

**Decision**: Use documented border radius values consistently across similar components

**Rationale**:
- Consistent border radius creates visual cohesion
- Design system specifies: `rounded` (4px), `rounded-lg` (8px), `rounded-xl` (12px)
- Cards and buttons should have consistent corner styles

**Standard Usage**:
- Cards: `rounded-lg`
- Buttons: `rounded` (Nuxt UI default)
- Modals: `rounded-lg`
- Badges: `rounded-full` or `rounded`
- Images: `rounded-lg` or `rounded-full` (avatars)

**Alternatives Considered**:
- Varied border radii for visual interest: Rejected because it creates inconsistency

---

## Implementation Priorities

Based on research, the implementation will follow this priority order:

1. **P1: Visual Consistency** - Core colors, spacing, typography (foundation)
2. **P2: Icon Standardization** - Icon prefixes and sizing (clarity)
3. **P3: Component Props** - Nuxt UI component prop standardization (predictability)
4. **P4: Typography Refinement** - Fine-tuning typography scale application (readability)
5. **P5: Dark Mode Compliance** - Complete dark mode token coverage (accessibility)

Each priority builds on the previous one, ensuring a logical progression from foundation to refinement.

---

## Technical Dependencies Confirmed

- **Nuxt UI v4**: Component library is installed and configured ✅
- **Tailwind CSS v4**: Using `@theme` directive in `app/assets/css/main.css` ✅
- **Lucide Icons**: Available through Nuxt UI icon system ✅
- **Design System Documentation**: `docs/DESIGN_SYSTEM.md` is complete ✅
- **Design Tokens**: Defined in `app/assets/css/main.css` ✅

---

## Risk Mitigations

### Visual Regressions
- **Mitigation**: Manual visual testing after each component update in both light and dark modes
- **Verification**: Browser devtools for contrast checking, existing tests for functionality

### Incomplete Token Coverage
- **Mitigation**: Use semantic mapping (usage context) rather than exact hex matching
- **Documentation**: Note any true gaps found for potential design system enhancements

### Breaking Component Behavior
- **Mitigation**: Focus only on visual token changes, not structural changes
- **Verification**: Run existing component tests (`npm test`) after updates

### Dark Mode Inconsistencies
- **Mitigation**: Add dark mode tokens immediately when missing, following documented patterns
- **Verification**: Test every component in dark mode, verify text readability

---

## Next Steps

With all research completed, proceed to **Phase 1: Design & Contracts**:

1. ~~Generate data-model.md~~ (N/A - no data model changes)
2. ~~Generate contracts/~~ (N/A - no API changes)
3. Generate quickstart.md with implementation guidance
4. Update agent context with any new technology/patterns identified

Phase 0 research is **COMPLETE** ✅
