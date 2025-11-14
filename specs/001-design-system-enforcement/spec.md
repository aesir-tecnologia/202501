# Feature Specification: Design System Token Enforcement

**Feature Branch**: `001-design-system-enforcement`
**Created**: 2025-11-14
**Status**: Draft
**Input**: User description: "enforce design system tokens by updating components with @docs/DESIGN_SYSTEM.md"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visual Consistency Verification (Priority: P1)

As a developer or designer reviewing the application interface, I need all components to use standardized design tokens for colors, typography, spacing, and other visual elements, so that the interface maintains consistent branding and user experience across all pages and components.

**Why this priority**: Visual consistency is the foundation of a professional user interface. Without standardized design tokens, the application presents an inconsistent brand identity that can confuse users and reduce trust. This is the core requirement that enables all other improvements.

**Independent Test**: Can be fully tested by performing a visual audit of all pages and components against the design system documentation, verifying that each visual element uses the correct design token (e.g., brand colors instead of arbitrary values, standard spacing instead of custom values). Delivers immediate value by ensuring brand consistency.

**Acceptance Scenarios**:

1. **Given** a page with buttons, **When** inspecting the button colors, **Then** all primary buttons use `brand-500` color, success buttons use `mint-500` or standard green, error buttons use standard red, and warning buttons use `amberx-500` or standard orange
2. **Given** a page with text elements, **When** inspecting font styles, **Then** all text uses either `font-sans` (Public Sans) for UI or `font-mono` (JetBrains Mono) for code/timers, with proper text size classes from the typography scale
3. **Given** a component with spacing between elements, **When** measuring the gaps, **Then** all spacing uses Tailwind's standard spacing scale values (4px base unit: space-y-2, gap-4, etc.) instead of custom values
4. **Given** a component with color values, **When** inspecting in both light and dark modes, **Then** all custom colors use the defined palette (brand, ink, mint, amberx) with proper dark mode variants

---

### User Story 2 - Icon Standardization (Priority: P2)

As a developer working with icons throughout the application, I need all icon references to use the standardized Lucide icon syntax with proper sizing, so that icon display is consistent and maintainable across the codebase.

**Why this priority**: Icon consistency directly impacts visual clarity and user comprehension. Standardized icons ensure users can quickly recognize common actions and navigate the interface efficiently. This builds on the visual consistency foundation from P1.

**Independent Test**: Can be fully tested by searching all component files for icon usage and verifying that each icon uses the `i-lucide-` prefix pattern with proper size classes (h-4 w-4, h-5 w-5, etc.). Delivers value by ensuring recognizable, accessible interface elements.

**Acceptance Scenarios**:

1. **Given** a component with icons, **When** reviewing icon declarations, **Then** all icons use the `icon="i-lucide-icon-name"` or `name="i-lucide-icon-name"` syntax with the required `i-` prefix
2. **Given** icons in different contexts, **When** inspecting their sizes, **Then** small icons use `h-4 w-4`, medium icons use `h-5 w-5`, large icons use `h-6 w-6`, and hero icons use `h-12 w-12` according to the design system
3. **Given** standalone icon components, **When** reviewing their implementation, **Then** they use either `<Icon>` or `<UIcon>` components with proper class attributes

---

### User Story 3 - Component Props Standardization (Priority: P3)

As a developer implementing user interactions, I need all Nuxt UI component usage to follow the documented patterns for props like colors, variants, and sizes, so that components behave predictably and maintain visual consistency.

**Why this priority**: Standardized component props ensure that components respond to user interactions in expected ways. This completes the consistency layer by ensuring not just visual appearance but also behavioral patterns are uniform.

**Independent Test**: Can be fully tested by auditing all Nuxt UI component usage (UButton, UCard, UBadge, etc.) and verifying that color, variant, and size props match the documented options in the design system. Delivers value by ensuring predictable component behavior.

**Acceptance Scenarios**:

1. **Given** UButton components throughout the application, **When** reviewing their color props, **Then** they use only documented color values (primary/brand, success/green, error/red, warning/orange, neutral/gray)
2. **Given** UButton components with variant props, **When** reviewing their usage, **Then** they use only documented variants (solid, outline, ghost, soft)
3. **Given** UBadge components throughout the application, **When** reviewing their variant props, **Then** they use only documented variants (solid, subtle, outline) with appropriate semantic colors

---

### User Story 4 - Typography Token Application (Priority: P4)

As a user reading content in the application, I need all text to use the standardized typography scale and font families, so that content is readable, hierarchically clear, and visually consistent.

**Why this priority**: Typography directly affects readability and content hierarchy. Standardized typography ensures users can quickly scan and understand information. While important for user experience, it's lower priority than core visual consistency.

**Independent Test**: Can be fully tested by reviewing all text elements and headings, verifying they use the documented text size classes (text-3xl for H1, text-base for body, etc.) and font families (font-sans, font-mono). Delivers value by improving content readability.

**Acceptance Scenarios**:

1. **Given** page headings throughout the application, **When** inspecting their classes, **Then** H1 uses `text-3xl`, H2 uses `text-2xl`, H3 uses `text-xl`, and H4 uses `text-lg`
2. **Given** body text elements, **When** reviewing their implementation, **Then** default body text uses `text-base`, secondary text uses `text-sm`, and fine print uses `text-xs`
3. **Given** timer displays and code elements, **When** inspecting their font classes, **Then** they use `font-mono` with `tabular-nums` for consistent width

---

### User Story 5 - Dark Mode Token Compliance (Priority: P5)

As a user who prefers dark mode, I need all components to properly implement dark mode variants using the documented token patterns, so that the interface remains readable and visually consistent in dark mode.

**Why this priority**: Dark mode support is essential for user comfort and accessibility, especially for users who work in low-light environments. This ensures the design system works equally well in both color modes.

**Independent Test**: Can be fully tested by switching to dark mode and verifying that all components use proper dark mode classes (dark:bg-gray-900, dark:text-gray-100, etc.) according to the design system patterns. Delivers value by ensuring a comfortable viewing experience for dark mode users.

**Acceptance Scenarios**:

1. **Given** components with background colors, **When** toggling to dark mode, **Then** they use documented dark variants (dark:bg-gray-900, dark:bg-gray-800) instead of custom values
2. **Given** components with text colors, **When** toggling to dark mode, **Then** they use documented dark text colors (dark:text-gray-100, dark:text-gray-300) maintaining proper contrast
3. **Given** components with borders, **When** toggling to dark mode, **Then** they use documented border colors (dark:border-gray-800, dark:border-gray-700)

---

## Clarifications

### Session 2025-11-14

- Q: When encountering components with custom color values that don't have exact design system equivalents (e.g., hardcoded RGB values, gradients, or intermediate shades), what should be the resolution approach? → A: map to the correct semantic token based on it's usage
- Q: When a component has correct light mode tokens but is missing dark mode variants, what should be the approach? → A: Add appropriate dark mode tokens immediately using the documented dark mode patterns (dark:bg-gray-900, dark:text-gray-100, etc.), ensuring dark mode works from the start
- Q: When encountering components that use inline styles instead of Tailwind classes for visual properties, what should be the approach? → A: Convert inline styles to equivalent Tailwind CSS classes using design system tokens, removing the inline style attributes entirely
- Q: When components use multiple color tokens together (e.g., gradients, overlays, box shadows with colors), what should be the approach? → A: Apply design system tokens to each color in the effect (e.g., `from-brand-500 to-brand-700` for gradients, `shadow-brand-500/20` for colored shadows), maintaining the multi-color pattern
- Q: When a component needs a specific color shade that falls between documented token values (e.g., needs something between brand-400 and brand-500), what should be the approach? → A: Use the nearest documented shade that best matches the intended visual weight and semantic meaning, document if a true gap is identified

### Edge Cases

- **Custom color values without exact equivalents**: Map to the correct semantic token based on the value's usage context (e.g., a custom blue used for primary actions → brand-500, a custom red for errors → red-500)
- **Missing dark mode tokens**: When light mode tokens are correct but dark mode variants are missing, add appropriate dark mode tokens immediately using documented patterns (dark:bg-gray-900, dark:text-gray-100, dark:border-gray-800, etc.) to ensure dark mode works from the start
- **Inline styles**: Convert all inline styles (style attribute) to equivalent Tailwind CSS classes using design system tokens, removing the inline style attributes entirely to enable proper theming and maintainability
- **Multi-color visual effects**: Apply design system tokens to each color in gradients, overlays, and colored shadows (e.g., `from-brand-500 to-brand-700` for gradients, `shadow-brand-500/20` for colored shadows), maintaining the visual richness while ensuring token compliance
- **Intermediate color shades**: When a component needs a shade between documented values (e.g., between brand-400 and brand-500), use the nearest documented shade that best matches the intended visual weight and semantic meaning; document any identified gaps for potential future design system enhancements
- **Legacy components**: Treat all components uniformly regardless of when they were created; apply the same token enforcement standards to ensure comprehensive design system compliance

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: All color values in components MUST use design system tokens (brand, ink, mint, amberx palettes) instead of arbitrary color values or undocumented Tailwind colors
- **FR-002**: All typography MUST use the documented font families (`font-sans` for UI, `font-mono` for code/timers) and typography scale (text-3xl through text-xs)
- **FR-003**: All spacing between elements MUST use Tailwind's standard spacing scale (space-y-2, space-y-4, gap-2, gap-4, etc.) with 4px base unit
- **FR-004**: All icons MUST use Lucide icon syntax with proper `i-lucide-` prefix and standardized size classes (h-4 w-4, h-5 w-5, h-6 w-6, h-8 w-8, h-12 w-12)
- **FR-005**: All Nuxt UI components (UButton, UBadge, UCard, etc.) MUST use only documented color, variant, and size prop values as specified in the design system
- **FR-006**: All components with visual elements MUST implement dark mode variants using documented token patterns (dark:bg-*, dark:text-*, dark:border-*); if dark mode tokens are missing, they MUST be added immediately using the documented dark mode patterns to ensure dark mode functionality
- **FR-007**: All card components MUST use documented styling patterns (rounded-lg, proper border and background colors, hover effects)
- **FR-008**: All button components MUST use semantic color naming (primary/brand, success/green, error/red, warning/orange, neutral/gray) instead of specific color names
- **FR-009**: Timer displays and code elements MUST use `font-mono` with `tabular-nums` for consistent width
- **FR-010**: All hover effects MUST use documented transition patterns (transition-colors, transition-all, hover:scale-105)
- **FR-011**: Components MUST NOT use custom color values (hex codes, rgb values) directly in classes or inline styles; custom values MUST be mapped to the semantically appropriate design system token based on the value's usage context (e.g., primary action colors → brand palette, error states → red palette, success states → green/mint palette); when an exact shade match is not available, use the nearest documented shade that best matches the visual weight and semantic intent
- **FR-012**: Border radius MUST use documented values (rounded, rounded-lg, rounded-xl) consistently across similar components
- **FR-013**: Components MUST NOT use inline styles (style attribute) for visual properties; all styling MUST use Tailwind CSS classes with design system tokens to enable proper theming and maintainability
- **FR-014**: Multi-color visual effects (gradients, overlays, colored shadows) MUST apply design system tokens to each color value (e.g., `from-brand-500 to-brand-700`, `shadow-brand-500/20`) while maintaining the intended visual richness

### Key Entities

- **Design Token**: A named value from the design system representing a color, spacing, typography, or other visual property (e.g., `brand-500`, `text-base`, `space-y-4`)
- **Component**: A Vue component file that renders UI elements and may use design tokens
- **Color Palette**: A collection of related color shades (brand, ink, mint, amberx) with variants from 50 (lightest) to 900 (darkest)
- **Typography Scale**: The standardized set of font sizes (text-3xl through text-xs) used throughout the application
- **Spacing Scale**: The standardized spacing units based on 4px increments used for gaps, padding, and margins

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All components use only documented design system color tokens, with zero instances of undocumented hex codes or arbitrary Tailwind colors
- **SC-002**: All text elements use documented typography scale classes, achieving 100% compliance with the font family and size specifications
- **SC-003**: All spacing between elements uses Tailwind's standard spacing scale, with zero instances of custom spacing values
- **SC-004**: All icons use the standardized Lucide icon syntax with proper sizing, achieving 100% icon pattern compliance
- **SC-005**: All Nuxt UI component props (color, variant, size) use only documented values from the design system
- **SC-006**: Dark mode renders correctly across all components with proper token usage, maintaining readability and visual consistency
- **SC-007**: Visual audit confirms consistent brand presentation across all pages with no visual discrepancies between components
- **SC-008**: Code reviewers can easily verify design system compliance by referencing the design system documentation
- **SC-009**: New developers can implement components following documented patterns without needing additional guidance
- **SC-010**: Component styling is maintainable through centralized design token updates rather than scattered component modifications

## Scope *(mandatory)*

### In Scope

- Updating all Vue components in `app/components/` to use design system tokens
- Updating all page components to use design system tokens
- Updating all layout components to use design system tokens
- Ensuring color, typography, spacing, and icon usage matches design system documentation
- Implementing proper dark mode token usage across all components
- Standardizing Nuxt UI component prop usage (colors, variants, sizes)
- Removing hardcoded color values, custom spacing, and non-standard typography
- Ensuring consistent border radius, shadow, and transition usage

### Out of Scope

- Creating new design tokens not already documented in the design system
- Modifying the design system itself (colors, typography scale, spacing scale)
- Updating third-party component libraries or node_modules
- Changing component functionality or behavior (only visual token usage)
- Updating the Tailwind CSS configuration file (design system already defined in `app/assets/css/main.css`)
- Creating new components (only updating existing components)
- Refactoring component logic or state management
- Performance optimization beyond what token standardization naturally provides

## Assumptions *(mandatory)*

1. The design system documentation in `docs/DESIGN_SYSTEM.md` is complete and accurate
2. All necessary design tokens are already defined in `app/assets/css/main.css` via `@theme` blocks
3. Nuxt UI v4 components support all the documented color, variant, and size options
4. Lucide icons are properly configured and available through the icon system
5. Components should maintain their current functionality while updating visual tokens
6. Dark mode is already implemented and working, requiring only token standardization
7. Most components are using Tailwind CSS classes for styling; any inline styles or CSS-in-JS will be converted to Tailwind classes as part of token enforcement
8. The codebase is using Vue 3 composition API with `<script setup>` syntax
9. Changes should be backward compatible with existing component usage
10. Visual changes should be minimal if components are already following most design system patterns

## Dependencies & Constraints *(mandatory)*

### Dependencies

- Requires access to the design system documentation (`docs/DESIGN_SYSTEM.md`)
- Requires Tailwind CSS v4 with `@theme` directive configuration in `app/assets/css/main.css`
- Requires Nuxt UI v4 component library to be properly installed and configured
- Requires Lucide icons to be available through Nuxt UI's icon system
- Requires Vue 3 with composition API support

### Constraints

- Must not break existing component functionality or user interactions
- Must maintain all current accessibility features (ARIA labels, keyboard navigation, focus states)
- Must preserve all existing component props and events (public API)
- Must not introduce visual regressions that affect user workflows
- Must work within the existing Nuxt 4 SSG architecture
- Must maintain compatibility with client-side authentication patterns
- Changes must be reviewable and verifiable against the design system documentation
- Must not modify the design system color palettes, typography scale, or spacing scale

## Risks & Mitigations *(mandatory)*

### Risk 1: Visual Regressions

**Risk**: Updating color tokens may inadvertently break visual layouts or reduce contrast/readability

**Mitigation**:
- Perform visual testing in both light and dark modes after each component update
- Use browser devtools to verify color contrast ratios meet WCAG AA standards
- Test all interactive states (hover, focus, active, disabled)
- Compare before/after screenshots for each component

### Risk 2: Incomplete Token Coverage

**Risk**: Some design patterns used in components may not have documented tokens in the design system

**Mitigation**:
- Map custom color values to the semantically appropriate design system token based on usage context
- Use the nearest documented shade for intermediate color values, prioritizing visual weight and semantic meaning
- Document any true gaps found during implementation where semantic mapping is not possible
- Maintain a list of potential design system enhancements identified during token enforcement
- Consult design system documentation before making assumptions

### Risk 3: Breaking Component Behavior

**Risk**: Changing CSS classes might accidentally affect component functionality (e.g., removing classes that JavaScript depends on)

**Mitigation**:
- Focus only on visual token changes, not structural or functional changes
- Test all interactive features after updates (buttons, modals, forms, toggles)
- Review component logic to identify any CSS-dependent functionality
- Run existing tests to catch regressions

### Risk 4: Dark Mode Inconsistencies

**Risk**: Adding dark mode tokens may create new visual inconsistencies or contrast issues

**Mitigation**:
- Test all components thoroughly in dark mode after updates
- Use consistent dark mode token patterns across similar components
- Verify text remains readable against all background colors
- Check that interactive elements remain clearly visible in dark mode
