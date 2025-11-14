# Component Checklist: Design System Token Enforcement

**Created**: 2025-11-14
**Feature**: Design System Token Enforcement (Branch: 001-design-system-enforcement)

## Overview

This checklist tracks all Vue components that need design system token updates. Based on automated searches, we've identified:

- **Total Components**: 26 Vue files
- **Files with hex colors**: 6 files (98 total instances)
- **Files with inline styles**: 5 files (11 total instances)
- **Files with non-lucide icons**: 0 files ✓ (already compliant)

## Priority 1: Files with Hex Colors & Inline Styles

These files need immediate attention as they use custom colors and/or inline styles that bypass the design system:

### Components
- [ ] **LoginVariation1.vue** - Has hex colors (likely to be archived/deleted per T028)
- [ ] **LoginVariation2.vue** - Has hex colors (likely to be archived/deleted per T028)
- [ ] **LoginVariation3.vue** - Has hex colors AND inline styles (likely to be archived/deleted per T028)

### Pages
- [ ] **app/pages/auth/login.vue** - Has hex colors
- [ ] **app/pages/design-showcase.vue** - Has hex colors (may be demo/development page)
- [ ] **app/pages/home.vue** - Has hex colors AND inline styles
- [ ] **app/pages/analytics.vue** - Has inline styles
- [ ] **app/pages/reports.vue** - Has inline styles
- [ ] **app/pages/settings.vue** - Has inline styles

## Priority 2: All Components Requiring General Token Updates

Even without hex colors or inline styles, these components may use undocumented Tailwind colors or need dark mode variants:

### Components (app/components/)
- [ ] **ArchivedProjectsList.vue** - Check color tokens, dark mode, typography
- [ ] **ArchivedProjectsModal.vue** - Check modal styling consistency
- [ ] **ProjectArchiveModal.vue** - Check warning colors, modal patterns
- [ ] **ProjectCreateModal.vue** - Check modal styling, button colors
- [ ] **ProjectDeleteModal.vue** - Check error colors, modal patterns
- [ ] **ProjectEditModal.vue** - Check modal styling consistency
- [ ] **ProjectForm.vue** - Check form field styling, labels, validation
- [ ] **ProjectList.vue** - Check card styling, hover states, dark mode
- [ ] **StintControls.vue** - Check button colors (start/stop/pause)
- [ ] **StintTimer.vue** - Check typography (font-mono tabular-nums), sizing

### Layout (app/layouts/)
- [ ] **default.vue** - **CRITICAL** - Update header, navigation, color mode toggle

### Pages (app/pages/)
- [ ] **index.vue** - Check page title typography, section spacing, card styling
- [ ] **analytics.vue** - Check headings, charts dark mode, spacing (already flagged for inline styles)
- [ ] **reports.vue** - Check report card styling, typography (already flagged for inline styles)
- [ ] **settings.vue** - Check form styling, section spacing (already flagged for inline styles)
- [ ] **home.vue** - Check hero section, CTA buttons (already flagged for hex colors & inline styles)

### Auth Pages (app/pages/auth/)
- [ ] **login.vue** - Check form styling, brand colors for CTA (already flagged for hex colors)
- [ ] **register.vue** - Check auth flow consistency
- [ ] **forgot-password.vue** - Check auth patterns
- [ ] **reset-password.vue** - Check password field styling
- [ ] **verify-email.vue** - Check success colors
- [ ] **callback.vue** - Check loading states

## Special Cases

### design-showcase.vue
**Status**: Has hex colors
**Decision Needed**: Is this a development/demo page? If so, should it be:
- Updated to follow design system (for reference)
- Excluded from enforcement (dev-only page)
- Deleted (no longer needed)

### LoginVariation1/2/3.vue
**Status**: All have hex colors, Variation3 has inline styles
**Action**: Per task T028, review these files to determine if they should be archived or deleted (not in active use)

## Automated Verification Commands

After updates, run these to verify compliance:

```bash
# Verify no hex colors remain (excluding design-showcase if keeping it)
grep -r "#[0-9a-fA-F]\{3,6\}" app/components app/pages app/layouts --include="*.vue" | grep -v design-showcase

# Verify no inline styles remain
grep -r 'style="' app/components app/pages app/layouts --include="*.vue"

# Verify all icons use i-lucide- prefix
grep -r 'icon=' app/components app/pages app/layouts --include="*.vue" | grep -v 'i-lucide-'
```

## Implementation Order

Based on task dependencies in tasks.md:

### Phase 2: Foundational (BLOCKING)
1. **app/layouts/default.vue** - Must be completed first (affects all pages)

### Phase 3: User Story 1 - Visual Consistency
All Priority 2 components can be updated in parallel ([P] tasks)

### Phase 8: Polish
1. Review LoginVariation1/2/3 for archival/deletion
2. Decide on design-showcase.vue handling

## Notes

- **Hex Colors**: Need mapping to design tokens (brand-500, ink-*, mint-500, amberx-500, etc.)
- **Inline Styles**: Must be converted to Tailwind classes
- **Dark Mode**: All components need dark: variants for proper theming
- **Typography**: Apply documented scale (text-3xl for H1, text-base for body, etc.)
- **Icons**: Already compliant with i-lucide- prefix ✓
- **Component Props**: Check UButton, UCard, UBadge for documented color/variant/size values

## Progress Tracking

- **Phase 1 Setup**: In Progress
- **Phase 2 Foundational**: Not Started (blocked by Phase 1)
- **Phase 3-7 User Stories**: Not Started (blocked by Phase 2)
- **Phase 8 Polish**: Not Started (blocked by user stories)

**Next Step**: Complete Phase 1 (baseline established), then proceed to Phase 2 (default.vue)
