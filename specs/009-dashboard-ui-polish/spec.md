# Feature Specification: Dashboard UI Polish

**Feature Branch**: `009-dashboard-ui-polish`
**Created**: 2026-02-24
**Status**: Draft
**Input**: User description: "Gemini UI Review (issue #104) — visual hierarchy, typography, color/contrast, and spacing refinements for the dashboard"

## Clarifications

### Session 2026-02-24

- Q: What scope should the serif-to-sans-serif change have? → A: All non-branding text across the app. Serif (Fraunces) reserved only for the LifeStint logo. All headings, titles, and labels switch to sans-serif (Instrument Sans). DESIGN_SYSTEM.md must be updated accordingly.
- Q: How should the WCAG AA muted text contrast failure be fixed? → A: Make `--text-muted` AA-compliant by adjusting the token values in both light and dark modes to meet 4.5:1 contrast ratio.
- Q: Should `--bg-active-row` apply to running and paused rows, or running only? → A: Running only. Paused rows keep their current amber treatment. The active row background distinguishes "working now" from "paused."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Clear Visual Hierarchy on Dashboard (Priority: P1)

A user opens the dashboard and can immediately identify which project is actively running a stint. The active project row stands out clearly from inactive projects, and the user's eye is guided naturally from the active project to the timer display without competing visual distractions.

**Why this priority**: The dashboard's primary purpose is to show the user what they're currently working on. If multiple elements compete for attention (segmented control, timer pill, play buttons, active row), the user wastes cognitive effort parsing the screen instead of focusing on their work.

**Independent Test**: Can be tested by viewing the dashboard with one active stint and verifying that a new user can identify the running project within 3 seconds without prior training.

**Acceptance Scenarios**:

1. **Given** a user has one project with an active stint, **When** they open the dashboard, **Then** the active project row is visually distinct from all other project rows through a differentiated background or prominent accent indicator.
2. **Given** a user views the dashboard, **When** they scan the project list, **Then** the Active/Inactive tab control does not visually overpower the project list content beneath it.
3. **Given** a user has an active stint, **When** they look at the project list row for that project, **Then** the row's visual treatment (background, border, or accent) clearly communicates "this is running" without requiring the user to read button labels.

---

### User Story 2 - Readable and Consistent Typography (Priority: P2)

A user views the dashboard and all text elements use a consistent, readable type system. Timer digits read as a cohesive unit, secondary labels are legible, and font families are used consistently across all UI data components.

**Why this priority**: Inconsistent typography (mixed serif/sans-serif in data displays, overly-spaced timer digits, too-small labels) creates a disjointed experience that undermines perceived quality and can cause readability issues.

**Independent Test**: Can be tested by verifying that all data-display text uses the same font family, timer digits are visually cohesive, and secondary labels meet minimum size requirements.

**Acceptance Scenarios**:

1. **Given** a user views the timer card, **When** they read the project name and timer digits, **Then** all text within the timer card uses a consistent sans-serif font family (serif reserved only for branding/logo).
2. **Given** a user views the large timer display, **When** they read the elapsed time, **Then** the digits and colons appear as a single cohesive unit without excessive spacing between characters.
3. **Given** a user views secondary labels (e.g., "Started", "Duration", "Ends"), **When** they read these labels, **Then** the text is legible at normal viewing distance without straining.

---

### User Story 3 - Accessible Color Contrast and Intentional Color Usage (Priority: P2)

A user can comfortably read all text on the dashboard regardless of the color theme. Secondary/muted text meets accessibility contrast requirements, project color indicators are clearly decorative (not interactive-looking), and accent colors are used intentionally to convey meaning.

**Why this priority**: Poor contrast on secondary text creates accessibility barriers. Hollow color rings that look like interactive radio buttons cause confusion. Competing accent colors (green play buttons vs. orange brand color) create visual noise.

**Independent Test**: Can be tested by running a contrast checker on all text/background color combinations and verifying they meet WCAG AA standards, and by confirming project color indicators don't resemble interactive controls.

**Acceptance Scenarios**:

1. **Given** a user views the dashboard in dark mode, **When** they read secondary/muted text (timestamps, stint metadata, inactive icons), **Then** all text meets WCAG AA contrast ratio (minimum 4.5:1 for normal text, 3:1 for large text) against its background.
2. **Given** a user views the project list, **When** they see the project color indicators, **Then** the indicators appear as solid decorative dots rather than hollow rings that resemble interactive controls.
3. **Given** a user views multiple interactive elements, **When** they scan the dashboard, **Then** accent colors are used consistently: the brand color for primary actions and active states, with minimal competing color usage for secondary actions.

---

### User Story 4 - Balanced Spacing and Aligned Layout (Priority: P3)

A user views the dashboard and all elements feel properly aligned, evenly spaced, and visually grouped. Navigation items form a cohesive cluster, action buttons within project rows have consistent gaps, and the timer card content is well-proportioned.

**Why this priority**: Spacing inconsistencies are subtle but cumulatively make a UI feel unpolished. Fixing alignment and spacing improves perceived quality and professionalism.

**Independent Test**: Can be tested by verifying consistent gap sizes between action buttons in project rows, proper visual grouping in the header navigation, and proportional spacing within the timer card.

**Acceptance Scenarios**:

1. **Given** a user views a project list row, **When** they look at the action buttons (progress indicator, edit, play/pause), **Then** all buttons have equal spacing between them.
2. **Given** a user views the header/navigation, **When** they scan the navigation items, **Then** the items appear as a cohesive group rather than loosely floating elements.
3. **Given** a user views the timer card, **When** they look at the stats section (Started/Duration/Ends) and the large timer below, **Then** the vertical spacing creates a clear visual connection between the stats and the timer rather than excessive separation.
4. **Given** a user views the stats panel with placeholder/empty values, **When** data is not yet available, **Then** the placeholder values are visually subdued and the layout remains stable (no shifting when real data populates).

---

### Edge Cases

- What happens when project names are very long — does the active row treatment still look correct with text wrapping?
- How do the visual refinements behave in light mode vs. dark mode? Contrast adjustments must work for both themes.
- How do the spacing changes affect the dashboard on small screens / narrow viewports?
- What happens when no stint is active — does the project list still look well-structured without an active row highlight?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The active/inactive tab control MUST use a visually lightweight treatment (e.g., text color change, subtle underline) rather than a heavy filled background that competes with the project list.
- **FR-002**: The project row with a running stint (not paused) MUST be visually distinguished from all other project rows through a background change, accent border, or elevation treatment. Paused stints retain their existing amber visual treatment and do not receive the active row background.
- **FR-003**: All text across the application MUST use the sans-serif font family (Instrument Sans); the serif font (Fraunces) MUST be reserved exclusively for the LifeStint logo. This is a system-wide change that requires updating DESIGN_SYSTEM.md typography guidelines.
- **FR-004**: Timer digits MUST use tabular/monospaced figures and display as a single cohesive unit without excessive character spacing around colons.
- **FR-005**: All secondary/muted text MUST meet WCAG AA contrast requirements (4.5:1 for normal text, 3:1 for large text) against its background in both light and dark modes. The `--text-muted` token values MUST be adjusted in both modes to achieve compliance (current values fail: dark mode ~3.7:1, light mode ~2.4:1).
- **FR-006**: Project color indicators MUST be displayed as solid filled dots rather than hollow rings.
- **FR-007**: Action button spacing within project list rows MUST be consistent and equal across all action items.
- **FR-008**: The header navigation items MUST be visually grouped as a cohesive navigation cluster.
- **FR-009**: Secondary labels (e.g., "Started", "Duration", "Ends") MUST be at least 11px equivalent in rendered size for readability.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can identify the currently active project on the dashboard within 3 seconds of first viewing, without prior training or guidance.
- **SC-002**: 100% of text elements on the dashboard meet WCAG AA contrast ratio requirements in both light and dark modes.
- **SC-003**: No user confuses a project color indicator with an interactive control (validated via visual inspection — indicators are clearly decorative).
- **SC-004**: The application typography uses exactly 3 font families with clear roles: serif (Fraunces) exclusively for the LifeStint logo, sans-serif (Instrument Sans) for all UI text and headings, and monospace (JetBrains Mono) for timer digits and numerical displays.
- **SC-005**: Action button gaps within project list rows are uniform to within 1px tolerance across all project cards.
- **SC-006**: The dashboard visual refinements render correctly across viewport widths from 768px (tablet) to 1920px (desktop).

## Design System Alignment

This section maps each functional requirement to existing design tokens in `app/assets/css/tokens.css` and identifies gaps requiring new tokens or value adjustments.

### Token Changes Required

**Value adjustment — `--text-muted` (both modes)**:
The current muted text color fails WCAG AA in both modes: dark mode (`#78716c` on `#1c1917`) yields ~3.7:1, and light mode (`#a8a29e` on `#fffbf5`) yields ~2.4:1. Both values MUST be adjusted to achieve at minimum 4.5:1 contrast ratio. Applies to FR-005.

**New token — `--bg-active-row`**:
No existing token provides a semantically distinct background for the "currently running stint" project row. A new token is needed to represent the subtle background elevation or accent-tinted fill for active rows, with appropriate light and dark mode values. Applies to FR-002.

### Existing Token Mapping

| Requirement | Relevant Tokens | Status |
|-------------|----------------|--------|
| FR-001 (Tab control weight) | `--accent-primary` for active tab indicator | Existing token, usage change |
| FR-002 (Active row distinction) | **`--bg-active-row`** (new) | New token needed; applies to running stints only (not paused) |
| FR-003 (Typography consistency) | `--font-sans`, `--font-serif` | System-wide change: all headings/titles switch from `--font-serif` to `--font-sans`. Serif used only for logo. Requires DESIGN_SYSTEM.md update |
| FR-004 (Timer digit cohesion) | `--font-mono` (JetBrains Mono) | Existing token, CSS adjustment: remove positive `letter-spacing` and apply `tabular-nums` |
| FR-005 (Muted text contrast) | `--text-muted` | Existing token, **value change in both light and dark modes** |
| FR-006 (Solid color dots) | Project color classes (Tailwind) | No token change, CSS change from border-only to background-fill |
| FR-007 (Button spacing) | Tailwind spacing scale (`gap-2`, `gap-3`) | No new token, standardize non-standard `14px` gap to nearest scale value |
| FR-008 (Navigation grouping) | `--bg-secondary` | Already correctly used in navigation container |
| FR-009 (Label minimum size) | No size token (uses raw px) | CSS adjustment: raise `.meta-label` mobile from 10px to 11px minimum |

### Non-Standard Values to Standardize

The project list card (`.card-v27`) currently uses `gap: 14px`, which falls outside the Tailwind 4px spacing scale. This SHOULD be standardized to either `12px` (`gap-3`) or `16px` (`gap-4`) for consistency with the design system.

## Assumptions

- The current dark mode design is the primary mode being reviewed; light mode should receive equivalent adjustments but dark mode is the design reference.
- The project color palette (blue, red, green, yellow, gray assigned to projects) remains unchanged — only the shape of the color indicator changes (hollow ring → solid dot).
- The existing component structure (ProjectListCard, DashboardTimerHero, DashboardSidebar, default layout) remains intact — this is a visual refinement, not a structural refactoring.
- Timer card pause/stop controls remain the primary control surface; project list row controls are secondary.
- No new functionality is being added — this is purely a visual polish pass.
- The serif-to-sans-serif typography change is system-wide: `docs/DESIGN_SYSTEM.md` must be updated to reflect the new typography rules (serif for logo only, sans-serif for all UI text).

## Out of Scope

- Mobile-first responsive redesign (this focuses on tablet+ viewports)
- New features, interactions, or functionality
- Changes to the color mode toggle or overall theme system
- Animation or transition changes
- Restructuring of the component hierarchy
