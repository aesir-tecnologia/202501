# Design System Migration Plan: Focused Warmth + Deep Focus Hybrid

## Overview

Migrate LifeStint from the current violet/sky dark-mode-centric design to the "Focused Warmth + Deep Focus Hybrid" design system documented in `NEW-DESIGN.md`.

**Key Changes:**
- Color palette: violet/sky → terracotta/forest/sage (warm, natural tones)
- Typography: Public Sans → Fraunces (headings) + Instrument Sans (body)
- Light mode: Fix broken light mode with warm cream backgrounds
- Dark mode: Use warm browns/charcoals instead of cold grays
- Visual style: Larger radius, warm shadows, ambient glows

**Final Completion Criteria:**
When ALL phases complete, output `<promise>COMPLETE</promise>` only if:
- [ ] `npm run dev` starts without errors
- [ ] Landing page renders correctly in both light/dark modes
- [ ] Dashboard components use new color system
- [ ] No violet/sky/cyan color remnants in codebase
- [ ] Mockup files deleted from `/public/mockups/`

---

## Phase 1: Foundation (CSS & Configuration)

### Tasks

**1.1 Update `app/assets/css/main.css`**
- Add Google Fonts imports: Fraunces (serif), Instrument Sans (sans)
- Define CSS custom properties for design tokens (both light/dark)
- Update font-family definitions in @theme

**1.2 Update `app/app.config.ts`**
- Change primary color from `violet` to `orange` (closest Tailwind match to terracotta)
- Change secondary color from `sky` to `green` (forest green)

**1.3 Create Design Token Reference**
- Add `app/assets/css/tokens.css` with semantic CSS variables
- Import tokens.css in main.css

### Phase 1 Verification

```bash
npm run dev
```

**Phase 1 Complete When:**
- [ ] Dev server starts without CSS errors
- [ ] Browser DevTools shows new CSS variables loaded (check `:root`)
- [ ] Fraunces and Instrument Sans fonts load (check Network tab)
- [ ] `app.config.ts` shows `primary: 'orange'` and `secondary: 'green'`

**Self-Correction:**
1. If fonts don't load → Check Google Fonts import URL syntax
2. If CSS variables missing → Verify tokens.css is imported in main.css
3. If dev server errors → Run `npm run lint:fix` and check syntax

---

## Phase 2: Landing Page Overhaul

### Tasks

**2.1 Update `app/pages/index.vue`**
- Replace `ink-900` backgrounds with warm cream (`#fffbf5` / `bg-[#fffbf5]`) for light mode
- Update dark mode to use warm charcoal (`stone-900`) instead of cold black
- Change text colors from `ink-*` to `stone-*` palette
- Update gradients from violet/cyan to terracotta/forest/sage
- Replace button colors with new primary/secondary
- Update hero section with proper light mode support
- Add ambient glow effects to timer preview

**2.2 Update Landing Page Typography**
- Add `font-serif` class (Fraunces) to headings
- Ensure body text uses Instrument Sans (default sans)

### Phase 2 Verification

```bash
npm run dev
# Navigate to http://localhost:3005/
# Toggle between light/dark mode
```

**Phase 2 Complete When:**
- [ ] Landing page hero has warm cream background in light mode
- [ ] Landing page has warm charcoal background in dark mode
- [ ] Headings use Fraunces serif font
- [ ] No violet/cyan/sky colors visible on landing page
- [ ] Color mode toggle works smoothly
- [ ] Buttons use orange (primary) color scheme

**Self-Correction:**
1. If colors don't change → Search for hardcoded `violet`, `sky`, `cyan` in index.vue
2. If light mode looks wrong → Check `dark:` prefixes are applied correctly
3. If fonts wrong → Verify `font-serif` class maps to Fraunces in CSS

---

## Phase 3: Dashboard & Components

### Tasks

**3.1 Update `app/layouts/default.vue`**
- Update header/nav colors for both modes
- Change active states from violet to terracotta (orange)
- Update background colors for warm cream/charcoal

**3.2 Update `app/components/ProjectListCard.vue`**
- Replace gradient backgrounds with warm tones
- Update progress bar colors (sage/terracotta instead of violet/indigo)
- Update status pill colors
- Increase border radius to match new design

**3.3 Update `app/components/StintTimer.vue`**
- Add ambient glow effect around timer
- Update active/paused colors (terracotta for active, amber for paused)
- Ensure monospace font styling preserved

**3.4 Update `app/components/StreakBanner.vue`**
- Replace violet-emerald gradient with terracotta-forest gradient

**3.5 Update Other Components (as needed)**
- `ProjectForm.vue` - Update color picker styling
- `StintConflictDialog.vue` - Update status colors
- `ProjectCardToolbar.vue` - Update glass effects with warm tones
- `ArchivedProjectsList.vue` - Update accent colors

### Phase 3 Verification

```bash
npm run dev
# Log in and navigate to /dashboard
# Test project cards, timer, streak banner
```

**Phase 3 Complete When:**
- [ ] Dashboard background uses warm cream/charcoal
- [ ] Project cards have updated gradients (no violet)
- [ ] Progress bars use sage/terracotta colors
- [ ] Timer has visible ambient glow effect
- [ ] Streak banner uses terracotta-forest gradient
- [ ] All interactive states use orange (primary) color

**Self-Correction:**
1. If components still violet → Run: `grep -r "violet\|sky\|cyan" app/components/`
2. If glow not visible → Check `shadow-glow` CSS variable is defined
3. If layout broken → Check Tailwind classes are valid (no typos)

---

## Phase 4: Utilities & Constants

### Tasks

**4.1 `app/constants/index.ts`**
- **Keep as-is** - Project tag colors (red, orange, amber, green, teal, blue, purple, pink) remain unchanged

**4.2 `app/utils/project-colors.ts`**
- **Keep as-is** - COLOR_CLASSES and COLOR_PILL_CLASSES remain unchanged

### Phase 4 Verification

**Phase 4 Complete When:**
- [ ] Confirmed: No changes needed to constants/utils
- [ ] Project color picker still works with existing tag colors

---

## Phase 5: Codebase Audit & Cleanup

### Tasks

**5.1 Search for remaining old color references**
```bash
grep -rn "violet\|sky\|cyan" app/ --include="*.vue" --include="*.ts" --include="*.css"
```

**5.2 Fix any remaining instances**
- Replace violet → orange
- Replace sky/cyan → green or stone

**5.3 Remove mockup files**
- Delete `/public/mockups/index.html`
- Delete `/public/mockups/focused-warmth-hybrid.html`
- Remove `/public/mockups/` directory

### Phase 5 Verification

```bash
# Should return NO results (or only intentional uses in comments)
grep -rn "violet\|sky\|cyan" app/ --include="*.vue" --include="*.ts" --include="*.css"

# Verify mockups deleted
ls public/mockups/  # Should error: directory not found
```

**Phase 5 Complete When:**
- [ ] No violet/sky/cyan references in app/ (except constants for tag colors)
- [ ] `/public/mockups/` directory deleted
- [ ] `npm run lint` passes

**Self-Correction:**
1. If grep finds matches → Update each file to use new colors
2. If lint fails → Run `npm run lint:fix`

---

## Phase 6: Final Verification & Documentation

### Tasks

**6.1 Full Application Test**
```bash
npm run dev
# Test all routes: /, /dashboard, /analytics, /reports, /settings
# Toggle light/dark mode on each page
```

**6.2 Build Test**
```bash
npm run generate
npm run serve
# Test static build at http://localhost:3000
```

**6.3 Update Documentation**
- Update `NEW-DESIGN.md` - Mark implementation as complete
- Update `CLAUDE.md` - Document new color system in Styling section

### Phase 6 Verification

**Phase 6 Complete When:**
- [ ] `npm run dev` works without errors
- [ ] `npm run generate` builds successfully
- [ ] `npm run serve` serves static site correctly
- [ ] All pages render correctly in light mode
- [ ] All pages render correctly in dark mode
- [ ] `NEW-DESIGN.md` marked as implemented
- [ ] `CLAUDE.md` Styling section updated

**Self-Correction:**
1. If build fails → Check error output, likely missing import or syntax error
2. If pages broken → Compare against mockup in `NEW-DESIGN.md`
3. If accessibility issues → Check contrast ratios with browser DevTools

---

## Design Token Reference

### Colors - Light Mode
```css
--bg-primary: #fffbf5;      /* warm cream */
--bg-secondary: #fef7ed;    /* linen */
--bg-card: #ffffff;
--text-primary: #292524;    /* stone-800 */
--text-secondary: #57534e;  /* stone-600 */
--text-muted: #a8a29e;      /* stone-400 */
--accent-primary: #c2410c;  /* terracotta - orange-700 */
--accent-secondary: #166534; /* forest - green-700 */
--accent-tertiary: #84cc16; /* sage - lime-500 */
--border-light: #e7e5e4;    /* stone-200 */
```

### Colors - Dark Mode
```css
--bg-primary: #1c1917;      /* stone-900 */
--bg-secondary: #292524;    /* stone-800 */
--bg-card: #292524;
--text-primary: #fafaf9;    /* stone-50 */
--text-secondary: #d6d3d1;  /* stone-300 */
--accent-primary: #ea580c;  /* orange-600 */
--accent-secondary: #22c55e; /* green-500 */
```

### Typography
```css
--font-serif: 'Fraunces', Georgia, serif;
--font-sans: 'Instrument Sans', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

### Radius & Shadows
```css
--radius-lg: 20px;
--radius-xl: 28px;
--shadow-warm: 0 4px 20px rgba(120, 113, 108, 0.08);
--shadow-glow: 0 0 40px rgba(194, 65, 12, 0.15);
```

---

## Tailwind Color Mapping

| Design Token | Tailwind Equivalent |
|--------------|---------------------|
| Terracotta | `orange-700` (#c2410c) |
| Forest | `green-700` (#166534) |
| Sage | `lime-500` (#84cc16) |
| Warm Cream | Custom `bg-[#fffbf5]` or `orange-50` |
| Warm Charcoal | `stone-900` (#1c1917) |

---

## Critical Files Summary

| File | Priority | Changes |
|------|----------|---------|
| `app/assets/css/main.css` | P0 | Fonts, CSS variables, theme tokens |
| `app/assets/css/tokens.css` | P0 | New file - semantic CSS variables |
| `app/app.config.ts` | P0 | Primary/secondary colors |
| `app/pages/index.vue` | P0 | Complete landing page restyle |
| `app/layouts/default.vue` | P1 | Header/nav styling |
| `app/components/ProjectListCard.vue` | P1 | Card styling, progress bars |
| `app/components/StintTimer.vue` | P1 | Timer glow, colors |
| `app/components/StreakBanner.vue` | P2 | Gradient update |
| `NEW-DESIGN.md` | P3 | Mark complete |
| `CLAUDE.md` | P3 | Document new system |

**Files NOT being modified:**
- `app/constants/index.ts` - Project tag colors kept as-is
- `app/utils/project-colors.ts` - Color utilities kept as-is

**Files to DELETE:**
- `public/mockups/index.html`
- `public/mockups/focused-warmth-hybrid.html`
- `public/mockups/` directory

---

## Completion Protocol

After completing all phases:

1. Run final verification:
```bash
npm run lint
npm run generate
npm run serve
```

2. Confirm all checklist items from each phase

3. If ALL criteria met, output: `<promise>COMPLETE</promise>`

4. If any criteria NOT met:
   - Identify which phase failed
   - Apply self-correction steps
   - Re-verify that phase
   - Continue only when phase passes
