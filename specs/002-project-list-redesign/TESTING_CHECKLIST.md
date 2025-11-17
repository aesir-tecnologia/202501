# Testing Checklist: Project List Redesign

**Feature**: 002-project-list-redesign
**Tester**: _______________
**Date**: _______________
**Browser**: _______________
**Device**: _______________

---

## Setup

- [ ] Dev server running (`npm run dev`)
- [ ] At least 5 active projects created
- [ ] At least 2 inactive projects created
- [ ] Varying stints completed today across projects
- [ ] One project with active stint running

---

## Desktop Tests (Chrome/Firefox/Safari)

### Visual Verification

- [ ] Project cards display correctly with proper spacing
- [ ] Color tags appear as left border (4px wide)
- [ ] "X/Y stints" progress text visible on active projects
- [ ] Progress bars show below text with correct fill
- [ ] Progress bar is green when goal met, blue otherwise
- [ ] Fire emoji (🔥) shows when over-achieving (e.g., 5/2)
- [ ] Checkmark badge appears when daily goal met
- [ ] Icons updated: repeat (stints/day), settings (edit button)

### Drag and Drop

- [ ] Drag handle (⋮⋮) visible only on active projects
- [ ] Cursor changes to "move" on hover over drag handle
- [ ] Can drag project to new position
- [ ] Order persists after page refresh
- [ ] Smooth animation (no jank)
- [ ] Inactive projects cannot be dragged

### Stint Management

- [ ] Start button is green with play icon
- [ ] Clicking Start begins stint and shows timer
- [ ] Other projects' Start buttons become disabled
- [ ] Disabled buttons show tooltip on hover
- [ ] Active stint has green border + ring + pulsing
- [ ] Pulsing animation is smooth (if motion not reduced)
- [ ] Timer displays correctly
- [ ] Pause/Stop controls visible on active stint

### Project Controls

- [ ] Toggle switch in upper right works
- [ ] Toggling shows success toast
- [ ] Project moves to correct section when toggled
- [ ] Loading state shown during toggle
- [ ] Edit button opens modal with pre-filled data
- [ ] Edit button has hover effect (slight scale)

### Inactive Section

- [ ] "Inactive Projects (N)" header shows count
- [ ] Section collapsed by default
- [ ] Clicking header expands/collapses section
- [ ] Chevron rotates (► to ▼)
- [ ] Inactive badge shows on inactive project cards
- [ ] No drag handle on inactive projects
- [ ] No progress indicators on inactive projects

### Empty States

- [ ] Zero projects: Shows folder icon + message
- [ ] All inactive: Shows pause icon + activation message
- [ ] All inactive: Shows inactive projects list expanded

### Dark Mode

- [ ] Toggle to dark mode works
- [ ] All text readable (good contrast)
- [ ] Card backgrounds change appropriately
- [ ] Borders visible in dark mode
- [ ] Icons maintain visibility
- [ ] Progress bars visible
- [ ] Active stint colors work in dark mode

---

## Mobile Tests (375px viewport)

- [ ] Cards stack vertically (no horizontal layout)
- [ ] No horizontal scrolling
- [ ] All buttons minimum 44×44px (easy to tap)
- [ ] Text doesn't overflow or truncate incorrectly
- [ ] Touch-based drag works (long-press to drag)
- [ ] Toggle switch easily tappable
- [ ] Edit button has sufficient tap area

---

## Accessibility Tests

### Keyboard Navigation

- [ ] Tab navigates through all interactive elements
- [ ] Tab order is logical (handle → toggle → edit → start)
- [ ] Focus indicator clearly visible on all elements
- [ ] Enter/Space activates Start button
- [ ] Space toggles switch
- [ ] Enter activates edit button
- [ ] Enter expands/collapses inactive section

### Screen Reader (VoiceOver/NVDA)

- [ ] Drag handle announces "Reorder project"
- [ ] Toggle announces "Toggle project active status"
- [ ] Edit button announces "Edit project"
- [ ] Progress announces "Daily progress: X of Y stints completed"
- [ ] Starting stint announces "Started working on [Project]"
- [ ] Toggling announces "[Project] is now active/inactive"
- [ ] All tooltips announced by screen reader

### Color Contrast (DevTools)

- [ ] Project name: 4.5:1 minimum
- [ ] Metadata text: 4.5:1 minimum
- [ ] Progress text: 4.5:1 minimum
- [ ] Button text: 4.5:1 minimum
- [ ] All interactive elements: 3:1 minimum

---

## Performance Tests

### Scrolling (25 projects)

- [ ] Open DevTools → Performance tab
- [ ] Record while scrolling through projects
- [ ] FPS stays at 60 (smooth, no drops)
- [ ] No stuttering or jank

### Drag Performance

- [ ] Record performance while dragging
- [ ] Animation stays smooth (no lag)
- [ ] No frame drops during drag/drop

### Lighthouse Audit

- [ ] Open DevTools → Lighthouse
- [ ] Run audit (Performance + Accessibility)
- [ ] Performance score: _____ (target: > 90)
- [ ] Accessibility score: _____ (target: 100)

---

## User Story Validation

### US1: Rapid Stint Initiation

- [ ] Load dashboard → start stint in < 3 seconds
- [ ] Start button immediately visible
- [ ] One click to start (no extra steps)

### US2: Progress at a Glance

- [ ] Can assess all projects' progress in < 2 seconds
- [ ] No clicking/hovering required
- [ ] Color coding helps quick understanding

### US3: Efficient Management

- [ ] Reorder project: 1 drag action
- [ ] Toggle active: 1 click
- [ ] Edit project: 1 click (opens modal)
- [ ] Order persists after refresh

### US4: Visual Clarity

- [ ] Active stint identifiable in < 1 second
- [ ] Visual hierarchy clear and helpful
- [ ] Attention drawn to actionable items

---

## Edge Cases

- [ ] Project with 0 expected stints: Shows "0 stints/day"
- [ ] Over-achievement (5/2): Shows "5/2 🔥"
- [ ] Very long project name: Truncates with ellipsis
- [ ] Failed stint start: Shows error toast
- [ ] Failed toggle: Shows error, reverts state
- [ ] Failed reorder: Shows error, reverts order

---

## Test Results

**Total Tests**: _____
**Passed**: _____
**Failed**: _____
**Skipped**: _____

### Issues Found

```
Issue #1:
  Description:
  Severity: [ ] Critical  [ ] Major  [ ] Minor
  Steps to reproduce:

Issue #2:
  Description:
  Severity: [ ] Critical  [ ] Major  [ ] Minor
  Steps to reproduce:

Issue #3:
  Description:
  Severity: [ ] Critical  [ ] Major  [ ] Minor
  Steps to reproduce:
```

---

## Overall Status

- [ ] ✅ **PASSED** - Ready for deployment
- [ ] ⚠️ **PASSED WITH MINOR ISSUES** - Document above
- [ ] ❌ **FAILED** - Critical issues found, needs fixes

**Tester Signature**: _______________
**Date Completed**: _______________

**Notes**:

```




```

---

## Next Actions

- [ ] Fix critical issues (if any)
- [ ] Address major issues (if any)
- [ ] Create issue tickets for minor items
- [ ] Update tasks.md with test results
- [ ] Proceed to deployment or next phase
