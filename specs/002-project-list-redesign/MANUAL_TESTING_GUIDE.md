# Manual Testing Guide: Project List Redesign

**Feature**: 002-project-list-redesign
**Date**: January 2025
**Status**: Ready for Manual Validation

---

## Prerequisites

1. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Navigate to `http://localhost:3000`

2. **Create Test Data** (if needed):
   - Create at least 5 active projects with varying configurations
   - Create 2-3 inactive projects
   - Complete varying numbers of stints on different projects today
   - Ensure at least one project has an active stint running

3. **Test Browsers**:
   - Chrome (latest)
   - Firefox (latest)
   - Safari (latest, macOS only)

4. **Test Viewports**:
   - Desktop: 1920×1080
   - Tablet: 768×1024
   - Mobile: 375×667 (iPhone SE size)

---

## Desktop Testing Checklist

### ✅ Visual Verification

- [ ] **Project Cards Display Correctly**
  - Each project shows as a card with proper spacing
  - Project name is clearly visible and truncates if too long
  - Color tag appears as left border accent (4px wide)
  - Cards have subtle hover effect on border color

- [ ] **Progress Indicators Visible**
  - "X/Y stints" text displays for active projects
  - Progress bar shows below text with correct percentage
  - Progress bar is green when goal met, blue otherwise
  - Over-achievement shows "X/Y 🔥" with fire emoji
  - Celebration checkmark badge appears when daily goal met

- [ ] **Icon Updates Applied**
  - Expected daily stints uses `repeat` icon (not target)
  - Edit button uses `settings` icon (not pencil)
  - Drag handle shows `grip-vertical` icon

### ✅ Drag-and-Drop Functionality

- [ ] **Drag Handle Behavior**
  - Drag handle (⋮⋮ icon) only visible on active projects
  - Cursor changes to `move` when hovering over drag handle
  - Drag handle has hover background effect

- [ ] **Reordering Projects**
  - Click and hold drag handle to start dragging
  - Visual feedback during drag (card follows cursor)
  - Drop project in new position
  - Order persists after page refresh
  - Animation is smooth (150ms transition)

- [ ] **Inactive Projects Non-Draggable**
  - Inactive projects do NOT show drag handle
  - Cannot drag inactive projects

### ✅ Stint Management

- [ ] **Start Stint Button**
  - "Start Stint" button is green with play icon
  - Button is prominent and centered below project info
  - Clicking starts a stint and shows timer
  - Other projects' Start buttons become disabled
  - Disabled buttons show tooltip: "Stop current stint to start new one"

- [ ] **Active Stint Visualization**
  - Project with active stint has:
    - Green border (success-500)
    - Ring effect (2px success-500/50)
    - Light green background tint
    - Pulsing animation (if motion not reduced)
  - Timer displays prominently
  - Pause/Stop controls visible

- [ ] **Pulsing Animation**
  - Active stint card has subtle pulsing border
  - Animation duration: 300ms
  - Animation respects `prefers-reduced-motion` setting

### ✅ Project Controls

- [ ] **Toggle Active/Inactive**
  - Toggle switch in upper right of each card
  - Clicking switch toggles project active status
  - Success toast notification appears
  - Project moves to inactive section when deactivated
  - Project returns to active section when reactivated
  - Loading state shown during toggle operation

- [ ] **Edit Button**
  - Settings icon button in upper right (next to toggle)
  - Button has ghost variant (subtle appearance)
  - Hover effect with slight scale (1.05×)
  - Tooltip shows "Edit project" on hover
  - Clicking opens edit modal with pre-filled values

### ✅ Inactive Projects Section

- [ ] **Section Display**
  - Section appears below active projects when inactive exist
  - Header shows "Inactive Projects (N)" with count
  - Chevron icon indicates collapsed/expanded state
  - Section is collapsed by default

- [ ] **Expand/Collapse Behavior**
  - Clicking header toggles section visibility
  - Chevron rotates from right (►) to down (▼)
  - Smooth transition when expanding/collapsing

- [ ] **Inactive Project Cards**
  - Show "Inactive" badge in neutral color
  - NO drag handle visible
  - NO progress indicators shown
  - Toggle switch and edit button still functional
  - Start stint button disabled with tooltip

### ✅ Empty States

- [ ] **Zero Projects Empty State**
  - Folder icon displayed
  - "No projects yet" heading
  - "Get started by creating your first project" message
  - Centered layout

- [ ] **All Projects Inactive Empty State**
  - Pause icon displayed
  - "All projects are inactive" heading
  - "Activate a project below to start tracking stints" message
  - Inactive projects list shown expanded below
  - Centered layout

### ✅ Dark Mode

- [ ] **All Elements Render Correctly in Dark Mode**
  - Toggle dark mode using theme switcher
  - Card backgrounds: white → dark neutral-900
  - Card borders: neutral-200 → neutral-800
  - Text colors: neutral-900 → neutral-50 (headings)
  - Secondary text: neutral-500 → neutral-400
  - Active stint: Success colors adapt appropriately
  - Icons remain visible with proper contrast
  - Progress bars maintain visibility

---

## Mobile Testing Checklist (375px viewport)

### ✅ Responsive Layout

- [ ] **Vertical Card Stacking**
  - Cards stack vertically (flex-col)
  - Full width of viewport (no horizontal scroll)
  - Proper spacing between cards (gap-2)

- [ ] **Touch Targets**
  - All buttons minimum 44×44px tap area
  - Toggle switch easily tappable
  - Drag handle (if shown) tappable for touch drag
  - Edit button has sufficient tap area

- [ ] **Text Readability**
  - Project names don't overflow or truncate incorrectly
  - Metadata (stints/day, duration) wraps properly
  - Progress text remains readable
  - No text overlaps interactive elements

- [ ] **Touch-Based Drag-and-Drop**
  - Long-press drag handle to start drag
  - Visual feedback during drag
  - Drop works accurately
  - Smooth animation

- [ ] **No Horizontal Scrolling**
  - All content fits within viewport width
  - No elements cause horizontal overflow
  - Proper padding on container

---

## Accessibility Testing Checklist

### ✅ Keyboard Navigation

**Test using only keyboard (no mouse):**

- [ ] **Tab Navigation**
  - Press Tab to navigate through interactive elements
  - Focus order is logical: drag handle → toggle → edit → start button
  - Focus indicator is clearly visible on all elements
  - Tab cycles through all cards in order

- [ ] **Activation**
  - Press Enter or Space on Start button → starts stint
  - Press Space on toggle switch → toggles active status
  - Press Enter on edit button → opens edit modal
  - Press Enter on inactive section header → expands/collapses

- [ ] **Keyboard-Only Workflow**
  - Can start a stint using only keyboard ✓
  - Can toggle project active status using only keyboard ✓
  - Can navigate to edit modal using only keyboard ✓

### ✅ Screen Reader Testing

**Test with VoiceOver (macOS) or NVDA (Windows):**

- [ ] **ARIA Labels Present**
  - Drag handle announces: "Reorder project"
  - Toggle announces: "Toggle project active status"
  - Edit button announces: "Edit project"
  - Progress text announces: "Daily progress: X of Y stints completed"

- [ ] **Tooltips Accessible**
  - All icon-only buttons have tooltip text
  - Tooltips are announced by screen reader
  - Disabled Start button announces reason

- [ ] **State Change Announcements**
  - Starting stint announces: "Started working on [Project Name]"
  - Toggling active announces: "[Project Name] is now active/inactive"
  - Announcements use ARIA live region (polite)

- [ ] **Semantic Structure**
  - Project name uses proper heading (h3)
  - Lists use semantic `<ul>` and `<li>` elements
  - Buttons use `<button>` elements (not divs)

### ✅ Color Contrast

**Use browser DevTools Accessibility panel:**

- [ ] **WCAG AA Compliance**
  - Normal text: minimum 4.5:1 contrast ratio
  - Large text: minimum 3:1 contrast ratio
  - Interactive elements: minimum 3:1 against background

- [ ] **Check All Text**
  - Project name (neutral-900 / neutral-50)
  - Metadata text (neutral-500 / neutral-400)
  - Progress text when goal met (success-600 / success-400)
  - Progress text when not met (neutral-700 / neutral-300)
  - Button text on all variants

### ✅ Focus Indicators

- [ ] **All Interactive Elements Have Focus**
  - Drag handle shows focus ring
  - Toggle switch shows focus ring
  - Edit button shows focus ring
  - Start button shows focus ring
  - Inactive section header shows focus

- [ ] **Focus Visible on All Elements**
  - Focus indicator has sufficient contrast
  - Focus outline is not removed by CSS
  - Focus state distinguishable from hover state

---

## Performance Testing Checklist

### ✅ Create Test Environment

**Setup:**
```bash
# In browser console, create 25 test projects
for (let i = 1; i <= 25; i++) {
  // Use your app's create project functionality
  // Or create via Supabase dashboard
}
```

### ✅ Scrolling Performance

- [ ] **Smooth Scrolling**
  - Open browser DevTools → Performance tab
  - Record while scrolling through all 25 projects
  - Check FPS counter: should maintain 60fps
  - No janky animations or stuttering
  - Scroll should be buttery smooth

### ✅ Drag Performance

- [ ] **Drag-and-Drop Responsiveness**
  - Record performance while dragging projects
  - Check for frame drops during drag
  - Animation should remain smooth (150ms)
  - No lag when releasing/dropping

### ✅ Re-render Performance

**v-memo should prevent unnecessary re-renders:**

- [ ] **Verify v-memo Working**
  - Open Vue DevTools → Timeline
  - Start stint on one project
  - Check that other project cards don't re-render
  - Only the affected card should update

### ✅ Bundle Size (Automated - Already Checked)

✅ **Component Source**: 24 KB combined (ProjectList + ProjectListCard)
✅ **Total Build**: 2.3 MB public folder, 1.4 MB assets
✅ **Largest Chunk**: 512 KB (169 KB gzipped) - main bundle
✅ **Build Time**: ~5.6 seconds

**Status**: ✅ Well within acceptable limits

### ✅ Lighthouse Audit

- [ ] **Run Lighthouse in Chrome DevTools**
  - Open DevTools → Lighthouse tab
  - Select categories: Performance, Accessibility
  - Run audit in incognito mode
  - **Target Scores**:
    - Performance: > 90
    - Accessibility: = 100

---

## User Story Validation

### ✅ User Story 1: Rapid Stint Initiation

**Goal**: Start stints within 2-3 seconds with minimal cognitive load

- [ ] **Time from Dashboard Load to Stint Start**
  - Load dashboard
  - Start timer
  - Click Start button on a project
  - Stop timer when stint begins
  - **Target**: < 3 seconds ✓

- [ ] **Visual Clarity**
  - Start buttons immediately visible ✓
  - One-click to start (no confirmation modal) ✓
  - Clear disabled states when stint running ✓

### ✅ User Story 2: Progress Monitoring at a Glance

**Goal**: Assess progress across all projects within 2 seconds

- [ ] **Glanceability Test**
  - Complete varying stints on different projects
  - Load dashboard
  - Time how long to identify all progress
  - **Target**: < 2 seconds ✓

- [ ] **Progress Visible Without Interaction**
  - All progress indicators visible on cards ✓
  - No need to click or hover ✓
  - Color coding aids quick assessment ✓

### ✅ User Story 3: Efficient Project Management

**Goal**: Reorder, toggle, edit within 2 clicks without leaving dashboard

- [ ] **Two-Click Operations**
  - Reorder: 1 click-drag = 1 action ✓
  - Toggle: 1 click on switch = 1 action ✓
  - Edit: 1 click on edit button = 1 action (opens modal) ✓

- [ ] **Changes Persist**
  - Refresh page after reordering → order maintained ✓
  - Refresh after toggling → status maintained ✓

### ✅ User Story 4: Visual Clarity and Focus

**Goal**: Identify active stint within 1 second

- [ ] **Active Stint Identification**
  - Start stint on one project
  - Look at dashboard
  - Time how long to identify active project
  - **Target**: < 1 second (80% of users) ✓

- [ ] **Visual Hierarchy**
  - Active stint has highest visual prominence ✓
  - Start buttons draw attention ✓
  - Secondary info appropriately de-emphasized ✓

---

## Edge Cases & Error Scenarios

### ✅ Data Edge Cases

- [ ] **Project with 0 Expected Daily Stints**
  - Shows "0 stints/day" instead of "0/0"
  - No progress bar shown
  - No visual errors

- [ ] **Over-Achievement (5/2 stints)**
  - Shows "5/2 🔥" with fire emoji
  - Progress bar at 100% (capped)
  - Success color applied

- [ ] **Midnight-Spanning Stint**
  - Start stint at 11:50 PM
  - Complete at 12:10 AM (next day)
  - Counts toward the day it was completed (today)

- [ ] **Very Long Project Name**
  - Name truncates with ellipsis (...)
  - Doesn't break layout
  - Tooltip shows full name on hover

### ✅ Error Handling

- [ ] **Failed Stint Start**
  - Simulate error (e.g., network offline)
  - Error toast appears with message
  - Screen reader announces error
  - Button returns to enabled state

- [ ] **Failed Toggle**
  - Simulate toggle error
  - Error toast appears
  - Project remains in original state
  - Loading spinner disappears

- [ ] **Failed Reorder**
  - Drag project to new position
  - Simulate server error
  - Error toast appears
  - Projects return to original order (automatic rollback)

---

## Final Validation Steps

1. [ ] **All Desktop Tests Passed**
2. [ ] **All Mobile Tests Passed**
3. [ ] **All Accessibility Tests Passed**
4. [ ] **All Performance Tests Passed**
5. [ ] **All User Story Goals Met**
6. [ ] **All Edge Cases Handled**

---

## Test Results Summary

**Date Tested**: _______________
**Tested By**: _______________
**Browsers Tested**: _______________

**Overall Status**:
- [ ] ✅ PASSED - Ready for deployment
- [ ] ⚠️ PASSED WITH MINOR ISSUES - Document issues below
- [ ] ❌ FAILED - Critical issues found

**Issues Found** (if any):

```
1.
2.
3.
```

**Notes**:

```


```

---

**Next Steps After Testing**:
1. Document any issues found
2. Fix critical issues if any
3. Mark tasks T053 and T054 as complete in tasks.md
4. Proceed to deployment or next feature
