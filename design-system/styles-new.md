# LifeStint Design System (Web)

## Core Principles
- **Professional Credibility:** Present focused work data with the polish of client-facing reports.
- **Calm Focus:** Reduce visual noise so contributors can stay immersed in single-task sessions.
- **Data First:** Layouts prioritize clarity of productivity metrics before decorative elements.
- **Trustworthy Interaction:** Every state change should feel precise, predictable, and accessible.

## Brand Pillars
1. **Precision:** Interfaces resemble premium analytical tooling; typography and color reinforce accuracy.
2. **Empowerment:** Visual language highlights achievements and progress without overwhelming detail.
3. **Transparency:** High contrast, clear states, and exposed data sources sustain stakeholder trust.

---

## Color System
Use CSS custom properties or Tailwind theme extensions. All values meet or exceed WCAG contrast recommendations when paired as described.

### Core Palette
| Token | Hex | Recommended Usage | Contrast Notes |
| --- | --- | --- | --- |
| `--color-bg` | `#060709` | Page background, dark mode foundation | Pair with min `#F5F7FA` text (`21:1`). |
| `--color-surface` | `#11131B` | Cards, panels, modals | Primary text (`#F5F7FA`) is `12.6:1`. |
| `--color-border` | `#1F2230` | 1px separators, dividers | Maintain 3:1 against surfaces. |
| `--color-text-primary` | `#F5F7FA` | Headlines, key metrics | On `#060709` ratio `21:1`. |
| `--color-text-secondary` | `#B6BDCF` | Body copy, helper text | On `#11131B` ratio `4.8:1`. |
| `--color-text-muted` | `#6C738A` | Metadata, labels | Keep on surfaces only; ratio `3.5:1`, avoid for small text. |

### Accent & Semantic Tokens
| Token | Hex | Role | Accessibility Guidance |
| --- | --- | --- | --- |
| `--color-accent-orange` | `#F97316` | Primary CTAs, active focus stint | Ensure text over orange is `#0B0C14` (`8.1:1`). |
| `--color-accent-green` | `#34D399` | Success, completed stints | Use `#0B0C14` text (`7.3:1`). |
| `--color-accent-blue` | `#38BDF8` | Analytics, neutral data | Use `#0B0C14` text or white at 4.7:1 (button text ≥16px bold). |
| `--color-accent-purple` | `#A855F7` | Scheduled focus blocks | Avoid pairing with `#F5F7FA` for text below 18px (ratio 3.4:1). |
| `--color-accent-magenta` | `#F472B6` | Alerts, overdue attention | Use as outline/fill; overlay text must be dark neutral. |
| `--color-danger` | `#F43F5E` | Errors, destructive actions | Text `#0B0C14` or white bold ≥16px (ratio 4.5:1). |

### Elevation & States
- **Hover Surfaces:** `rgba(255, 255, 255, 0.04)` overlay on `--color-surface`.
- **Pressed Surfaces:** `rgba(0, 0, 0, 0.25)` overlay; maintain min 3:1 with surrounding elements.
- **Focus Ring:** `0 0 0 0.25rem rgba(56, 189, 248, 0.45)` or Tailwind `ring-4 ring-sky-400/45`.

---

## Typography
Base font-size `16px` (`1rem`). Use Inter for web implementation.

| Style | Tailwind Token | Font Size | Line Height | Weight | Usage |
| --- | --- | --- | --- | --- | --- |
| Display Metric | `text-5xl` | 3rem | 1 | 300 | Live timers, key KPIs. |
| H1 | `text-3xl` | 1.875rem | 2.25rem | 700 | Primary page headings. |
| H2 | `text-2xl` | 1.5rem | 2rem | 600 | Section headers, project names. |
| H3 | `text-xl` | 1.25rem | 1.75rem | 500 | Subsections, table headers. |
| Body Large | `text-base` | 1rem | 1.75rem | 400 | Narrative content, descriptions. |
| Body | `text-sm` | 0.875rem | 1.5rem | 400 | Labels, table text. |
| Body Small | `text-xs` | 0.75rem | 1.25rem | 400 | Metadata, timestamps (ensure contrast). |
| Button | `text-base` | 1rem | 1.5rem | 600 | CTA labels; uppercase optional. |
| Caption | `text-xs` | 0.75rem | 1.25rem | 500 | Microcopy, unit labels. |

Typography Guidelines:
- Maintain negative letter-spacing for display numbers (`tracking-tight` in Tailwind) to improve optical balance.
- Limit `--color-text-muted` to text sizes `≥0.875rem` to preserve readability.
- Use numeric tabular figures (`font-variant-numeric: tabular-nums;`) for timers and analytics tables.

---

## Spacing & Layout
Align layout spacing with Tailwind’s default scale (1 unit = `0.25rem`).

| Token | rem | Tailwind Utility | Sample Usage |
| --- | --- | --- | --- |
| Space-1 | 0.25 | `p-1`, `gap-1` | Icon padding, micro separations. |
| Space-2 | 0.5 | `p-2`, `gap-2` | Tight label grouping. |
| Space-3 | 0.75 | `px-3`, `gap-3` | Input padding, chip spacing. |
| Space-4 | 1 | `p-4`, `gap-4` | Default card padding, dense layouts. |
| Space-6 | 1.5 | `p-6`, `gap-6` | Section padding inside panels. |
| Space-8 | 2 | `p-8`, `gap-8` | Major layout separation. |
| Space-12 | 3 | `py-12` | Page headers, hero zones. |
| Space-16 | 4 | `py-16` | Large analytical break sections. |

Layout Rules:
- Maintain `max-width: 72rem` (`max-w-6xl`) for primary content to keep metrics legible.
- Use 12-column CSS grid or Tailwind `grid-cols-12` for dashboards; allocate 3-4 columns per metrics card.
- Keep vertical rhythm consistent by aligning sections to multiples of Space-4.

---

## Component Patterns

### Project Card
- **Base:** `bg-[--color-surface]`, `rounded-2xl`, `p-6`, subtle border `border border-[rgba(255,255,255,0.04)]`.
- **Hover:** Overlay `after:content-[''] after:absolute after:inset-0 after:bg-white/5` or `hover:bg-white/5`.
- **Active/Pressed:** `ring-2 ring-sky-400/40`, `bg-white/10` short-lived.
- **Focus:** Apply focus ring and elevate with `shadow-lg shadow-sky-900/40`.
- **Empty State:** Placeholder message with dashed border `border-dashed border-[--color-border] bg-[#0C0E14]`.

### Buttons
| State | Primary (Orange) | Secondary (Outline) | Tertiary (Ghost) |
| --- | --- | --- | --- |
| Default | `bg-[--color-accent-orange] text-[#0B0C14] rounded-full px-6 py-3` | `border border-[--color-accent-green] text-[--color-accent-green] bg-white/5` | `text-[--color-text-secondary] px-4 py-2` |
| Hover | `hover:bg-[#FB8A36] shadow-inner` | `hover:bg-[--color-accent-green]/10` | `hover:bg-white/5` |
| Active | `active:bg-[#DB650F] translate-y-[1px]` | `active:bg-[--color-accent-green]/20` | `active:text-[--color-text-primary]` |
| Focus | `focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-300/50` | same ring | same ring |
| Disabled | `bg-[#2D2F3A] text-[#6C738A] cursor-not-allowed opacity-70` | `border-[#2D2F3A] text-[#6C738A]` | `text-[#3C4152]` |

### Inputs (Text, Select)
- **Default:** `bg-[#121420] border border-[--color-border] rounded-lg px-4 py-3 text-[--color-text-primary]`.
- **Hover:** `hover:border-[#2E3346]`.
- **Focus:** `focus:border-[--color-accent-blue] focus:ring-4 focus:ring-sky-400/25`.
- **Invalid:** `border-[--color-danger] text-[--color-text-primary]` plus helper text `text-[--color-danger]`.
- **Disabled:** `bg-[#0D0F18] border-[#1A1D27] text-[#6C738A] cursor-not-allowed`.
- Provide inline validation icons with `text-[--color-danger]` or `text-[--color-accent-green]` and aria-live regions for messages.

### Navigation Tabs
- Use flex container with `gap-2`.
- **Default:** `text-[--color-text-secondary] px-4 py-2 rounded-lg`.
- **Active:** `bg-white/10 text-[--color-text-primary] font-semibold border border-white/10`.
- **Focus:** `focus-visible:ring-4 ring-sky-400/40`.

### Progress Indicators
- **Radial:** `stroke-dasharray` animations with `transition-[stroke-dashoffset] duration-500 ease-out`.
- **Linear:** `bg-white/10` track, `bg-[--color-accent-green]` fill; add `animate-[progress-fill_0.6s_ease-in-out]` for updates.

### Data Visualization
- Favor `stroke-[1.5]` lines with `stroke-[--color-accent-blue]`.
- Use gradient fills from `--color-accent-blue` at 35% to transparent.
- Gridlines: `stroke-white/10` with `stroke-dasharray: 2 6` for minimal noise.
- Tooltips: `bg-[#11131B] text-[--color-text-primary] px-3 py-2 rounded-lg shadow-lg` with `border border-white/10` and arrow caret.

---

## State & Variant Guidance
- **Loading:** Employ skeletons using `bg-white/5 animate-pulse` rather than spinners for primary cards.
- **Success:** After actions, replace CTA with success badge `bg-[--color-accent-green]/20 text-[--color-accent-green]` for 3 seconds.
- **Error:** Display inline message aligned to input baseline with `role="alert"`; add icon `text-[--color-danger]`.
- **Empty:** Provide actionable text plus tertiary button; avoid leaving panels blank.
- **Dense Mode:** Reduce vertical padding by one step (Space-6 → Space-4) while maintaining minimum 0.75rem row height.

---

## Interaction & Motion
- Micro interactions: `duration-150 ease-out` for button hover/press.
- Component transitions: `duration-250 cubic-bezier(0.2, 0.8, 0.2, 1)` for modals, drawers.
- Data refresh: `duration-500 ease-out` with `transition-[transform,opacity]` for cards entering/exiting.
- Respect `prefers-reduced-motion`: disable non-essential transitions, swap progress animations for instant updates.

---

## Accessibility Checklist
- Maintain contrast ratios ≥4.5:1 for body text and ≥3:1 for large text/UI icons.
- Provide focus-visible styles distinct from hover states; ensure keyboard navigability for all interactive elements.
- Support `prefers-reduced-motion` and `prefers-contrast` media queries.
- Ensure interactive targets ≥44px (`2.75rem`) wide where possible (`min-h-[2.75rem] px-4`).
- Announce dynamic content changes with ARIA live regions or role-based alerts.
- Validate color usage with automated tooling (axe, Lighthouse) and document results alongside component specs.

---

## Voice & Tone Alignment
- Visuals should communicate **precision**, **empowerment**, and **focus**.
- Use concise copy and consistent metric labeling (e.g., “Focus Stint”, “Billable Hours”) to reinforce professionalism.
- Highlight achievements with subtle tonal shifts rather than dramatic color changes to maintain calm confidence.
