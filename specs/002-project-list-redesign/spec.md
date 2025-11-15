# Feature Specification: Project List Redesign

**Feature Branch**: `002-project-list-redesign`
**Created**: November 14, 2025
**Status**: Draft
**Input**: User description: "Redesign the ProjectList component"
**Visual Reference**: See [img.png](./img.png) for target design mockup

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Rapid Stint Initiation (Priority: P1)

Users need to start a stint on any project with minimal cognitive load and maximum speed. The primary use case is a consultant switching between 3-6 active client projects throughout the day, needing to begin focused work within 2-3 seconds of opening the dashboard.

**Why this priority**: This is the most frequent action in the entire application (multiple times daily). Any friction here directly impacts user productivity and product stickiness.

**Independent Test**: Can be fully tested by creating multiple projects and measuring time-to-stint-start from dashboard load. Success criteria: 90% of users start stints in under 3 seconds.

**Acceptance Scenarios**:

1. **Given** user has 5 active projects and no active stint, **When** user opens dashboard, **Then** all project Start buttons are immediately visible and actionable
2. **Given** user has one active stint running, **When** user views dashboard, **Then** the active project is visually distinct with timer prominently displayed and all other projects show disabled state with clear explanation
3. **Given** user wants to start a stint on Project A, **When** user clicks Start, **Then** stint begins immediately with visible confirmation and timer countdown
4. **Given** user has reordered projects to prioritize frequently-used ones, **When** user opens dashboard, **Then** projects appear in the user's chosen order and persist across sessions

---

### User Story 2 - Progress Monitoring at a Glance (Priority: P2)

Users need to instantly assess their daily progress across all projects without clicking. This supports the core value proposition of demonstrating consistent work patterns to clients.

**Why this priority**: Progress visibility is a key motivation mechanism and supports the "demonstrate work quality" value proposition. Users check this multiple times per day.

**Independent Test**: Can be tested by completing various numbers of stints and verifying that progress indicators are visible. Success criteria: Users can identify their progress on all active projects within 2 seconds.

**Acceptance Scenarios**:

1. **Given** user has completed 1 of 2 expected daily stints on Project A, **When** user views dashboard, **Then** progress indicator shows "1/2 stints" with visual progress bar at 50%
2. **Given** user has met daily goal on Project B (2/2 stints), **When** user views project, **Then** visual celebration indicator appears (checkmark, color change, or badge)
3. **Given** user has 4 active projects with different progress levels, **When** user views dashboard, **Then** all progress indicators are visible

---

### User Story 3 - Efficient Project Management (Priority: P3)

Users need to organize, activate/deactivate, and edit projects without leaving the main dashboard view or opening multiple modals.

**Why this priority**: Consultants frequently shift project priorities as client needs change. Quick reorganization reduces administrative overhead.

**Independent Test**: Can be tested by performing common management tasks (reorder, toggle active, edit) and measuring clicks required. Success criteria: All common tasks completable in 2 clicks or less.

**Acceptance Scenarios**:

1. **Given** user wants to reorder Project A above Project B, **When** user drags Project A card, **Then** projects reorder with visual feedback and persist across sessions
2. **Given** user completes a client project and wants to deactivate it, **When** user toggles the active switch, **Then** project moves to "Inactive Projects" section with visual transition
3. **Given** user has 8 inactive projects, **When** user views dashboard, **Then** inactive projects are collapsed by default with count visible (e.g., "Inactive Projects (8)")
4. **Given** user wants to edit project details, **When** user clicks edit button, **Then** edit modal opens with all current values pre-filled and saves with one click

---

### User Story 4 - Visual Clarity and Focus (Priority: P4)

Users need clear visual hierarchy that guides attention to actionable items (Start buttons, active timers) and de-emphasizes secondary information during active work sessions.

**Why this priority**: Reduces cognitive load and helps users maintain focus, supporting the core "single active stint enforcement" feature. Important for user experience but not blocking MVP functionality.

**Independent Test**: Can be tested through eye-tracking studies or user interviews asking "what catches your attention first?" Success criteria: 80% of users correctly identify active stint status within 1 second of viewing dashboard.

**Acceptance Scenarios**:

1. **Given** user has an active stint on Project A, **When** user views dashboard, **Then** active project has distinct visual treatment (border color, background, size) that draws immediate attention
2. **Given** user has no active stints, **When** user views dashboard, **Then** Start buttons are the most prominent interactive elements on each card
3. **Given** user has both active and inactive projects, **When** user views dashboard, **Then** inactive projects do not have reduced visual weight (opacity, size, or grayscale) compared to active projects
4. **Given** user is working on a stint, **When** user glances at dashboard, **Then** remaining time is displayed in large, high-contrast typography

---

### Edge Cases

- What happens when user has 25 active projects (free tier limit)? Project list should remain scannable with virtual scrolling or pagination
- How does the interface handle projects with very long names (80+ characters)? Text should truncate with ellipsis and show full name on hover
- What happens when user has 0 active projects but 15 inactive projects? Interface should encourage activating projects rather than showing empty state
- How does layout adapt on narrow mobile devices (320px width)? Cards should stack vertically with critical information (name, progress, Start button) always visible
- What happens when user has completed more stints than expected (e.g., 5/2)? Progress indicator should show over-achievement positively (e.g., "5/2 🔥" or "150%")
- How does drag-and-drop reordering work on touch devices? Should support touch-hold-drag with visual lift effect

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display all active projects in a single scrollable view without pagination
- **FR-002**: System MUST visually distinguish the project with active stint from all other projects with high-contrast visual treatment
- **FR-003**: System MUST show daily progress (completed vs. expected stints) for each active project without requiring hover or click
- **FR-004**: System MUST allow users to start a stint on any active project (when no stint is currently running) within 2 clicks maximum
- **FR-005**: System MUST disable stint initiation on all projects when a stint is already running
- **FR-006**: System MUST display remaining time for active stint in MM:SS format with update frequency of 1 second
- **FR-007**: System MUST allow users to reorder active projects via drag-and-drop with visual feedback during drag operation
- **FR-008**: System MUST persist project order across browser sessions and sync across devices
- **FR-009**: System MUST collapse inactive projects by default with visible count and expand-on-click functionality
- **FR-010**: System MUST display project color tags as visual identifiers without relying solely on color for information
- **FR-011**: System MUST provide quick access to edit project details from project card (1-click to modal)
- **FR-012**: System MUST show active/inactive toggle switch on each project card with loading state during toggle
- **FR-013**: System MUST prevent stint initiation on inactive projects (only active projects can have stints started)
- **FR-014**: System MUST prevent drag-and-drop reordering of inactive projects (only active projects reorderable)
- **FR-015**: System MUST display celebration indicator when user completes daily stint goal for a project
- **FR-016**: System MUST show empty state with actionable CTA when user has zero projects
- **FR-017**: System MUST adapt layout for mobile viewports (≤768px) with vertically stacked cards
- **FR-018**: System MUST provide keyboard navigation for all interactive elements (Tab, Enter, Space)
- **FR-019**: System MUST announce project status changes to screen readers (e.g., "Stint started on Project A")
- **FR-020**: System MUST show loading states during network operations (start stint, toggle active, reorder)
- **FR-021**: System MUST handle network errors gracefully with user-friendly error messages and retry options

### Key Entities

- **Project**: Represents a client project or work focus area with attributes like name, color tag, expected daily stints, custom stint duration, active status, and display order
- **Active Stint**: Represents the currently running work session with attributes like project reference, start time, planned duration, pause duration, and status
- **Daily Progress**: Represents completion status for each project on current day with attributes like completed stint count, expected stint count, and achievement percentage
- **Project Order**: Represents user's preferred sequence of active projects for display with position index and last updated timestamp

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can identify their current progress on all active projects within 2 seconds of viewing dashboard (measured via user testing or eye-tracking)
- **SC-002**: 90% of users successfully start a stint within 3 seconds of dashboard load (measured via user testing with stopwatch)
- **SC-003**: Users complete common management tasks (reorder, toggle active, edit) in 2 clicks or fewer (verified through manual testing and interaction flow analysis)
- **SC-004**: Active stint project is identifiable within 1 second by 80% of users (measured via user testing)
- **SC-005**: Mobile users can view all critical project information (name, progress, actions) without horizontal scrolling on 375px viewport
- **SC-006**: Project list remains performant (60fps scrolling) with up to 25 active projects
- **SC-007**: Keyboard-only users can navigate entire project list and perform all actions without mouse input
- **SC-008**: Screen reader users receive clear announcements for all state changes (tested via accessibility audit)
- **SC-009**: Users report reduced cognitive load when managing multiple projects compared to current design (measured via user satisfaction survey)

## Assumptions

- Users primarily access dashboard from desktop browsers (60%) with mobile as secondary device (40%)
- Most users manage 2-5 active projects concurrently, with power users reaching 10-25
- Users check dashboard 5-10 times per day (morning planning, between stints, evening review)
- Drag-and-drop reordering is discoverable through common UI patterns (grip handle icon) without explicit tutorial
- Users are familiar with standard productivity app conventions (progress bars, toggle switches, card layouts)
- Project color tags are primarily used for quick visual identification, not as critical information
- Users prefer collapsed inactive projects by default to reduce visual clutter
- Network conditions are generally stable; offline support is nice-to-have but not critical for this redesign
- Users understand that only one stint can be active at a time (enforced by existing business logic)

## Dependencies

- **Existing Data Layer**: Redesign depends on current composables (`useProjects`, `useStints`) and database schema remaining stable
- **Real-time Sync**: Visual updates for active stints depend on Supabase Realtime subscription working correctly
- **Drag-and-Drop Library**: Reordering functionality depends on @vueuse/integrations/useSortable or equivalent library
- **Design System**: Visual design must use Nuxt UI 4 components, Tailwind CSS v4, and Lucide icons as defined in project design system
- **Accessibility Standards**: Implementation must meet WCAG 2.1 Level AA compliance requirements defined in user personas documentation
- **Mobile Breakpoints**: Responsive design follows project's existing breakpoint system (defined in Tailwind config)
- **Timer Accuracy**: Countdown display depends on existing StintTimer component and Web Worker implementation

## Out of Scope

- Filtering or searching projects (all projects always displayed)
- Bulk operations on multiple projects (archive multiple, toggle multiple active)
- Project grouping or categorization beyond active/inactive separation
- Timeline or calendar view of projects and stints
- Integration with external project management tools (Asana, Trello)
- Customizable card layouts or density options (single default layout)
- Project templates or duplicating projects
- Project-level analytics or statistics on project cards (limited to daily progress only)
- Collaborative features or shared projects
- Project tags or labels beyond single color tag

## Visual Design Elements

**IMPORTANT**: The reference mockup ([img.png](./img.png)) illustrates the intended user experience and visual hierarchy. However, the implementation **MUST** follow the project's established design system (Nuxt UI 4 components, Tailwind CSS v4 tokens, Lucide icons). The mockup serves as inspiration for layout and interaction patterns, but all visual styling must use the project's design system components and tokens.

Based on the reference mockup, the redesigned project list incorporates the following functional and layout patterns:

### Layout Structure
- **Horizontal card layout**: Each project displayed as a full-width horizontal card with content arranged left-to-right
- **Information hierarchy**: Grip handle → Project name → Metadata → Toggle switch → Settings → Action button
- **Compact density**: Minimal vertical spacing between projects for scannable list view
- **Collapsible sections**: "Inactive Projects (N)" section collapsed by default with expandable chevron

### Project Card Components
- **Drag handle**: 6-dot grid icon (2×3 pattern) on far left for reordering active projects
- **Project name**: Bold, prominent typography as primary identifier
- **Metadata line**: Two inline elements showing expected daily stints (with repeat icon) and stint duration (with timer icon)
- **Toggle switch**: Blue when active (ON), gray when inactive (OFF), positioned right-aligned before settings
- **Settings icon**: Gear/options icon for accessing edit modal
- **Action button**: Far-right position
  - Active stint: Yellow pause icon ("||") + red stop square
  - Ready to start: Gray play triangle icon
  - Disabled state: No button or grayed-out button when another stint is running

### Visual States
- **Active stint project**: Yellow accent color on pause/stop controls, visually distinct from other cards
- **Active projects (ready)**: Blue toggle switch, play button visible, full opacity
- **Inactive projects**: "Inactive" badge label, gray toggle switch, reduced opacity, no action button visible
- **Inactive section**: Muted heading text, chevron indicator for expand/collapse

### Color Semantics (conceptual - must use design system tokens)
- **Background**: Use appropriate background tokens from design system (neutral/surface colors)
- **Text**: Primary text and muted/secondary text tokens per design system hierarchy
- **Accent colors**: Use semantic color tokens for interactive states (primary for toggles, success/warning for stint controls, error/destructive for stop action)
- **Inactive elements**: Apply reduced opacity or disabled state styling per design system conventions

### Typography & Spacing (must use design system tokens)
- **Project names**: Use heading or title typography scale from design system with medium-bold weight
- **Metadata**: Use body-small or caption typography scale with muted color tokens
- **Consistent spacing**: Apply design system spacing tokens for padding and gaps (e.g., space-4, space-3)
- **Horizontal alignment**: All interactive elements vertically centered within card height using flexbox/grid utilities

### Interaction Patterns
- **Drag affordance**: Grip handle visible on hover or always visible for active projects
- **Toggle feedback**: Smooth transition animation when switching active/inactive
- **Button states**: Clear visual feedback for hover, active, disabled states
- **Expandable sections**: Smooth expansion animation for inactive projects reveal

## Technical Constraints

- **CRITICAL**: Must strictly adhere to project's design system - use only Nuxt UI 4 components, Tailwind CSS v4 utility classes and design tokens, and Lucide icons. No custom CSS outside the design system. No arbitrary color values or spacing.
- Must work in Nuxt 4 SSG mode with client-side rendering for protected routes
- Must use TypeScript with full type safety from database layer through UI
- Must maintain existing three-layer architecture (database → schema → composable)
- Must not introduce new external API dependencies or third-party services
- Must optimize for Core Web Vitals (LCP < 2.5s, CLS < 0.1, FID < 100ms)
- Must support browsers: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Must work on screen sizes from 320px (mobile) to 2560px (desktop)
- Must not exceed 50KB compressed bundle size for component and dependencies
- Must maintain existing accessibility features (keyboard navigation, screen reader support)
- Must use existing toast notification system for user feedback (no custom notification UI)
- Must respect design system's dark/light mode theming (automatically adapt to user's color mode preference)
