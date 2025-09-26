# Design System Style Guide

## Philosophy

### The Dark Luxury Design Paradigm

Our design system embodies a "dark luxury" philosophy that positions our health tracking application as a premium, clinical-grade instrument rather than a casual consumer product. This approach is built on four foundational pillars:

**1. Clinical Precision**
We treat health data with the reverence it deserves. Every visual element should feel as precise and trustworthy as medical equipment. Users should feel confident that they're interacting with professional-grade monitoring tools that respect the critical nature of their health information.

**2. Empowering Sophistication**
Our design empowers users through sophisticated simplicity. Complex biometric data becomes approachable without being dumbed down. We respect our users' intelligence while making advanced health insights accessible to everyone.

**3. Calm Focus**
The dark-first approach isn't just aesthetic—it's functional. By reducing visual noise and eye strain, we create a calm environment where users can focus on their health journey without distraction. This is particularly important for evening use and extended monitoring sessions.

**4. Trust Through Transparency**
Every design decision should build trust. High contrast ensures readability, consistent patterns create predictability, and thoughtful data visualization makes complex information clear and actionable.

## How To Leverage This Design System

### Design Principles in Practice

**Start with Data, Not Decoration**
- Always prioritize the clarity of health information over visual flourishes
- Use color and typography to create hierarchy that guides attention to the most important metrics
- Remember that users often check their health data quickly—design for glanceable information

**Embrace the Dark Foundation**
- Use true black (`#000000`) for primary backgrounds to maximize OLED efficiency and create dramatic contrast
- Layer grays (`#1A1A1A`, `#2A2A2A`, `#3A3A3A`) to create depth without relying on shadows
- Reserve white (`#FFFFFF`) for the most critical text and information

**Color as Communication**
- Use accent colors systematically: Green for positive/success states, Orange for energy/attention, Purple for sleep/circadian, Blue for temperature/neutral metrics, Pink/Magenta for heart rate/active states
- Never use color alone to convey information—always pair with text, icons, or other visual indicators
- Maintain consistent color associations across all features (e.g., green always means positive/optimal)

**Typography for Health Data**
- Use larger, lighter weights for display numbers that need to be read at a glance
- Employ consistent letter spacing to improve readability on dark backgrounds
- Maintain clear visual hierarchy with our defined type scale
- Never compromise readability for style

---

## Color Palette

### Primary Colors

* **Primary Black** - `#000000` (Deep black backgrounds for maximum contrast)
* **Primary Charcoal** - `#1A1A1A` (Main dark background for content areas)

### Secondary Colors

* **Secondary Dark Gray** - `#2A2A2A` (Card backgrounds and elevated surfaces)
* **Secondary Medium Gray** - `#3A3A3A` (Secondary card backgrounds)

### Accent Colors

* **Accent Green Primary** - `#00E676` (Success states, positive metrics, active indicators)
* **Accent Green Secondary** - `#4CAF50` (Secondary green for progress and status)
* **Accent Purple** - `#7C4DFF` (Circadian rhythm, sleep data, phase indicators)
* **Accent Blue** - `#2196F3` (Temperature, HRV, and secondary metrics)
* **Accent Orange** - `#FF9800` (Timers, workout modes, energy states)
* **Accent Pink/Magenta** - `#E91E63` (Heart rate, active workout states)

### Functional Colors

* **Success Green** - `#00E676` (Completed goals, optimal ranges)
* **Warning Orange** - `#FF9800` (Attention states, energy usage)
* **Info Blue** - `#2196F3` (Temperature, neutral metrics)
* **Text Primary** - `#FFFFFF` (Primary white text on dark backgrounds)
* **Text Secondary** - `#B0BEC5` (Secondary gray text, metadata)
* **Text Muted** - `#607D8B` (Tertiary text, disabled states)

### Background Colors

* **Background Primary** - `#000000` (Main app background)
* **Background Secondary** - `#1A1A1A` (Content area backgrounds)
* **Background Elevated** - `#2A2A2A` (Card and modal backgrounds)
* **Background Gradient Start** - `#1A1A1A` (For subtle gradients)
* **Background Gradient End** - `#0F0F0F` (Gradient endpoints)

### Philosophy: Color Strategy

Our color strategy is rooted in clinical precision and emotional intelligence. Dark backgrounds create focus and reduce cognitive load, while our carefully selected accent colors serve as a visual language for different types of health data. Each color carries semantic meaning that users will learn and depend on for quick information processing.

### How To Leverage: Color Implementation

**Primary Usage:**
- Use Primary Black for main app backgrounds and critical focus areas
- Layer Secondary grays to create cards and elevated surfaces without harsh borders
- Apply accent colors consistently according to data type, never arbitrarily

**Best Practices:**
- Always test color combinations for WCAG AA contrast compliance
- Use color gradients sparingly and only for data visualization or subtle surface elevation
- Remember that accent colors should feel energizing but not aggressive—they represent health data

**Common Mistakes to Avoid:**
- Don't use accent colors for large surface areas
- Never use low-contrast color combinations for critical health information
- Avoid using warm colors (reds, oranges) for positive health metrics

---

## Typography

### Font Family

* **Primary Font:** SF Pro Display (iOS native)
* **Alternative Font:** SF Pro Text (for body content)
* **Fallback Font:** -apple-system, BlinkMacSystemFont

### Font Weights

* **Light:** 300 (Large display numbers)
* **Regular:** 400 (Body text)
* **Medium:** 500 (Subheadings)
* **Semibold:** 600 (Important metrics)
* **Bold:** 700 (Headers and emphasis)

### Text Styles

#### Display Numbers

* **Timer Display:** 48px/52px, Light, Letter spacing -1px
    * Used for large timer displays and primary metrics
* **Metric Large:** 36px/40px, Semibold, Letter spacing -0.5px
    * Used for key health metrics and scores

#### Headings

* **H1:** 28px/32px, Bold, Letter spacing -0.3px
    * Used for screen titles and major headers
* **H2:** 22px/26px, Semibold, Letter spacing -0.2px
    * Used for card titles and section headers
* **H3:** 18px/22px, Medium, Letter spacing -0.1px
    * Used for subsection headers

#### Body Text

* **Body Large:** 16px/22px, Regular, Letter spacing 0px
    * Primary reading text and descriptions
* **Body:** 14px/20px, Regular, Letter spacing 0.1px
    * Standard UI text and labels
* **Body Small:** 12px/16px, Regular, Letter spacing 0.2px
    * Supporting text and metadata

#### Special Text

* **Caption:** 11px/14px, Medium, Letter spacing 0.3px
    * Timestamps, units, and micro-labels
* **Button Text:** 16px/24px, Semibold, Letter spacing 0.1px
    * Button labels and CTAs
* **Status Text:** 13px/18px, Medium, Letter spacing 0.2px
    * Status indicators and notifications

### Philosophy: Typography for Health

Typography in health applications must prioritize instant comprehension and accuracy. Our type system is designed for users who may be checking critical health metrics in various lighting conditions, stress levels, and attention states. Every font choice supports the goal of clear, immediate understanding.

### How To Leverage: Typography Implementation

**Display Numbers:**
- Use Timer Display (48px, Light) for primary metrics that users need to read at a glance
- Apply negative letter spacing to large numbers to maintain optical balance on dark backgrounds
- Always include units in smaller, lighter text alongside display numbers

**Hierarchy Building:**
- Establish clear information priority using our defined heading scales
- Use font weight strategically—heavier weights for more important information
- Maintain consistent line height ratios for comfortable reading

**Body Text Strategy:**
- Choose font sizes based on content importance and reading context
- Use letter spacing adjustments to improve readability on dark backgrounds
- Ensure sufficient contrast between text levels in your hierarchy

**Best Practices:**
- Test all text sizes on actual devices in various lighting conditions
- Use semibold weights for numbers and metrics that require quick scanning
- Implement responsive typography that adapts to user accessibility settings

---

## Component Styling

### Cards

* **Background:** `#2A2A2A` with subtle gradient to `#1F1F1F`
* **Border:** None (relies on background contrast)
* **Corner Radius:** 16dp
* **Padding:** 20dp
* **Shadow:** Inner glow effect with `rgba(255,255,255,0.05)`

### Primary Buttons

* **Background:** Linear gradient from Accent Green Primary to slightly darker variant
* **Text:** `#000000` (Black text on bright green)
* **Height:** 56dp
* **Corner Radius:** 28dp (fully rounded)
* **Padding:** 24dp horizontal

### Secondary Buttons

* **Border:** 2dp Accent Green Primary
* **Text:** Accent Green Primary
* **Background:** `rgba(0,230,118,0.1)` (subtle green tint)
* **Height:** 48dp
* **Corner Radius:** 24dp

### Input Fields

* **Background:** `#3A3A3A`
* **Border:** 1dp `#4A4A4A`, 2dp Accent Green Primary when active
* **Corner Radius:** 12dp
* **Height:** 52dp
* **Text Color:** `#FFFFFF`
* **Placeholder:** `#607D8B`

### Progress Rings/Circles

* **Track Background:** `#2A2A2A`
* **Progress Colors:** Dynamic based on metric (Green for positive, Orange for energy, Purple for sleep)
* **Stroke Width:** 8dp for large rings, 4dp for small indicators
* **Animation:** Smooth spring animations with 300ms duration

### Charts and Visualizations

* **Line Color:** Accent Pink/Magenta for heart rate data
* **Fill:** Linear gradient with 20% opacity
* **Grid Lines:** `rgba(255,255,255,0.1)`
* **Axis Labels:** Text Secondary color
* **Data Points:** 4dp circles with metric-appropriate accent colors

### Philosophy: Component Design

Components should feel like precision instruments—smooth, responsive, and purposeful. Each component serves the larger goal of making health data accessible and actionable. The sophisticated styling supports user confidence in the reliability of their health information.

### How To Leverage: Component Implementation

**Card Design:**
- Use cards to group related health metrics and create visual breathing room
- Apply subtle gradients to create depth without heavy shadows that can feel overwhelming
- Maintain consistent padding and corner radius for visual harmony

**Button Hierarchy:**
- Reserve primary button styling for the most important actions (starting workouts, saving critical data)
- Use secondary buttons for supportive actions and navigation
- Ensure button text clearly describes the action outcome

**Input Considerations:**
- Design input fields to feel substantial and trustworthy for entering health data
- Use clear visual feedback for active states to guide user interaction
- Maintain sufficient contrast for error states while staying within the dark luxury aesthetic

**Data Visualization:**
- Choose progress ring colors based on the type of metric being displayed
- Use animation to show data changes and progress over time
- Ensure visualizations are accessible to users with color vision differences

---

## Spacing System

* **2dp** - Micro spacing (icon to text)
* **4dp** - Minimal spacing (tight element relationships)
* **8dp** - Small spacing (related element groups)
* **12dp** - Default spacing (standard element separation)
* **16dp** - Medium spacing (component internal padding)
* **20dp** - Large spacing (card padding, major element separation)
* **24dp** - Extra large spacing (section separation)
* **32dp** - Screen padding (top/bottom margins)
* **40dp** - Major section breaks

### Philosophy: Spatial Rhythm

Consistent spacing creates a visual rhythm that helps users predict where information will be located. Our spacing system is designed to feel both generous and efficient—providing enough breathing room for complex health data while maintaining information density.

### How To Leverage: Spacing Application

**Information Grouping:**
- Use 8dp spacing to group related metrics (heart rate and variability)
- Apply 20dp spacing to separate different categories of health data
- Implement 32dp for major section breaks and screen-level padding

**Component Rhythm:**
- Maintain consistent internal padding (16dp) within components
- Use 12dp as the default spacing between UI elements
- Reserve 2dp and 4dp for tight relationships like icon-text pairs

**Best Practices:**
- Establish spacing rules early in development to maintain consistency
- Use the spacing system as a constraint to improve design decisions
- Test spacing on different screen sizes to ensure usability

---

## Motion & Animation

* **Micro Transitions:** 150ms, ease-out
* **Standard Transitions:** 250ms, cubic-bezier(0.2, 0.8, 0.2, 1)
* **Emphasis Animations:** 400ms, spring physics
* **Data Visualization:** 600ms, ease-in-out with staggered delays
* **Ring Progress:** 800ms, custom easing for smooth filling
* **Screen Transitions:** 350ms, slide with momentum

### Philosophy: Purposeful Motion

Animation in health applications should feel confident and precise. Every motion should serve a functional purpose—guiding attention, providing feedback, or communicating state changes. Gratuitous animation can undermine the clinical precision our users expect.

### How To Leverage: Animation Implementation

**Micro Interactions:**
- Use 150ms transitions for immediate feedback (button presses, toggle switches)
- Apply ease-out timing to create responsive, snappy interactions
- Ensure animations feel immediate for critical health monitoring actions

**Data Transitions:**
- Implement longer durations (600ms) for data visualizations to allow users to track changes
- Use staggered delays to reveal information progressively and reduce cognitive load
- Apply custom easing for progress rings to create satisfying completion feedback

**Screen Transitions:**
- Maintain spatial relationships between screens with slide animations
- Use momentum curves to create natural-feeling navigation
- Keep transition times short enough to maintain the perception of responsiveness

---

## Iconography

* **Primary Icons:** 24dp x 24dp
* **Navigation Icons:** 28dp x 28dp
* **Micro Icons:** 16dp x 16dp
* **System Icons:** SF Symbols with medium weight
* **Style:** Minimal, outlined style with 2dp stroke weight
* **Colors:** White for active states, `#607D8B` for inactive

### Philosophy: Clear Visual Communication

Icons should communicate clearly and universally. In health applications, iconographic clarity can be critical for user understanding and quick decision-making. Our icon style prioritizes recognition over artistic expression.

### How To Leverage: Icon Implementation

**Size and Context:**
- Use 28dp icons for navigation to ensure easy touch targets
- Apply 24dp icons for primary actions and content areas
- Reserve 16dp micro icons for secondary information and status indicators

**Style Consistency:**
- Maintain 2dp stroke weight across all custom icons
- Use SF Symbols when available to ensure platform consistency
- Keep icon style minimal and outlined to work well on dark backgrounds

**Color Usage:**
- Use white icons for active/selected states
- Apply muted gray (`#607D8B`) for inactive elements
- Consider accent colors for icons that represent specific metric types

---

## Data Visualization Principles

### Circular Indicators
* **Complete Rings:** Used for daily goals and targets
* **Partial Arcs:** Used for ranges and zones
* **Multiple Rings:** Nested for complex metrics
* **Color Coding:** Consistent with metric type

### Bar Charts
* **Rounded Caps:** 2dp radius on bar ends
* **Spacing:** 4dp between bars
* **Height Variation:** Smooth scaling based on data
* **Background Bars:** Subtle track showing maximum values

### Line Charts
* **Smooth Curves:** Bezier curves for natural data flow
* **Gradient Fills:** Subtle gradients under lines
* **Interactive Points:** Highlighted on touch
* **Zero Lines:** Subtle grid reference

### Philosophy: Data as the Hero

Data visualization should make complex health information immediately understandable. Our approach treats data as the hero of every visualization, using design elements to support and enhance understanding rather than compete for attention.

### How To Leverage: Visualization Design

**Circular Progress:**
- Use complete rings for goals with clear targets (steps, calories)
- Apply partial arcs for ranges without specific endpoints (heart rate zones)
- Nest multiple rings when showing related metrics to create comprehensive dashboards

**Chart Design:**
- Choose visualization types based on the story the data needs to tell
- Use consistent color coding across all charts for the same metric types
- Implement interactive elements that provide additional detail without cluttering the default view

**Accessibility:**
- Ensure all visualizations work for users with color vision differences
- Provide alternative text descriptions for complex charts
- Use patterns or textures in addition to color for critical distinctions

---

## Dark Mode Considerations

This app is designed dark-first, but maintains accessibility through:

* **High Contrast:** Pure white text on deep black backgrounds
* **Color Blindness:** Multiple visual indicators beyond color alone
* **Readability:** Large text sizes for critical information
* **Reduced Blue Light:** Warm color temperature for evening use
* **Battery Optimization:** True black backgrounds for OLED efficiency

### Philosophy: Dark-First Design

Our dark-first approach isn't just about aesthetics—it's about creating the optimal environment for health monitoring. Dark interfaces reduce eye strain during extended use, are better for evening interactions, and can help users focus on their data rather than the interface itself.

### How To Leverage: Dark Interface Best Practices

**Contrast Management:**
- Always use pure white text (`#FFFFFF`) for critical health information
- Test all color combinations for adequate contrast ratios
- Use high contrast for elements users interact with frequently

**Progressive Enhancement:**
- Design for dark mode first, then adapt if light mode becomes necessary
- Ensure accent colors work well on dark backgrounds
- Consider how colors appear in different ambient lighting conditions

**Battery and Performance:**
- Use true black backgrounds to take advantage of OLED power savings
- Minimize bright elements that could cause battery drain
- Consider the impact of animations on battery life

---

## Voice and Tone Reflection

The visual design supports a brand voice that is:
- **Precise** (exact numbers, clinical accuracy)
- **Empowering** (you control your health data)
- **Professional** (medical-grade trustworthiness)
- **Sophisticated** (premium experience quality)
- **Calm** (dark colors reduce anxiety around health metrics)

### Philosophy: Design as Communication

Every visual choice communicates something about our values and approach to health monitoring. Our design language should make users feel confident, informed, and in control of their health journey.

### How To Leverage: Brand Expression Through Design

**Precision in Practice:**
- Use exact measurements and specific values rather than approximations
- Implement precise spacing and alignment to reflect accuracy
- Choose typography that supports clear number reading

**Empowering Users:**
- Design interfaces that give users control over their data presentation
- Provide customization options that respect individual preferences
- Make complex information accessible without oversimplifying

**Building Trust:**
- Maintain consistent patterns across all interactions
- Use professional-grade visual treatments for all health data
- Implement smooth, confident animations that feel reliable

**Sophisticated Simplicity:**
- Remove unnecessary visual elements that don't serve user goals
- Use subtle design details that reward closer inspection
- Create interfaces that feel both advanced and approachable