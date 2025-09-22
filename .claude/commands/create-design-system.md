## Create Design System

Prepares project context and launches the design-system-architect subagent with proper input. Handles requirements discovery and existing style audit automatically.

### 1. **Parse Arguments**
Check `$ARGUMENTS` for:
- **Design requirements file** (optional): Specific design goals or brand guidelines
- **Additional context files** (optional): Product requirements, architecture, existing style guides

**Argument Examples:**
```markdown
# Manual mode with design requirements
create-design-system design-documentation/brand-guidelines.md

# Manual mode with supporting context
create-design-system project-documentation/product-requirements.md project-documentation/frontend-architecture.md

# Auto-scan mode
create-design-system
```

### 2. **Requirements & Context Discovery**

**If files provided in $ARGUMENTS:**
- **First argument**: Treated as primary design requirements or brand guidelines
- **Additional arguments**: Treated as supporting context (product requirements, architecture, etc.)
- Validate all files exist and are readable
- Skip auto-discovery for specified files

**If no files in $ARGUMENTS:**
- Scan for **design requirements** (optional):
    - `design-documentation/` directory: `brand-guidelines.*`, `design-requirements.*`
    - `project-documentation/` directory: `*.md`, `requirements.*`, `product-*`
    - `docs/` directory: `design.*`, `requirements.*`, `product-*`
- Scan for **supporting context** (optional):
    - Architecture: `project-documentation/frontend-architecture.*`, `docs/architecture.*`
    - Existing design system: `design-system/`, `design-documentation/`

### 3. **Existing Style Audit & Discovery**
Scan project for current styling patterns and inconsistencies:

**CSS & Styling Files:**
- CSS/SCSS files: `**/*.css`, `**/*.scss`, `**/*.sass`
- CSS-in-JS: `**/*.styled.*`, styled-components usage
- Tailwind config: `tailwind.config.*`
- CSS custom properties: `--*` variable usage

**Component Libraries & Frameworks:**
- Package.json dependencies: UI libraries (MUI, Ant Design, Chakra UI, etc.)
- Component directories: `components/`, `src/components/`, `lib/components/`
- Existing design tokens: `tokens/`, token files, variable files

**Current Patterns Discovery:**
- Color usage: hex codes, RGB values, CSS variables
- Typography: font families, sizes, weights
- Spacing: padding/margin patterns, grid systems
- Component styles: button variants, form styles, layout patterns

### 4. **Context Preparation**
Structure context package with comprehensive project understanding:

**Primary Context (Design Foundation):**
- Design requirements/brand guidelines (if available)
- Current style audit results and identified inconsistencies
- Existing design patterns and component conventions

**Supplementary Context (Implementation Details):**
- Product requirements and user needs
- Frontend architecture and technical constraints
- Current framework/library choices and styling approach
- Existing design system documentation (if any)
- Project directory structure

### 5. **Subagent Invocation**
Launch design-system-architect with prepared context:

```
@design-system-architect

**FAST-TRACK MODE ENABLED** - Skip discovery, use provided comprehensive context directly

**PRIMARY CONTEXT - Style Audit & Requirements:**
Source: [file paths OR "auto-discovered from comprehensive style audit"]

**EXISTING STYLE AUDIT RESULTS:**
[Detailed findings of current styling patterns, inconsistencies, and gaps]

**DESIGN REQUIREMENTS:**
[Include design/brand guidelines if found, otherwise state "None provided - create comprehensive foundation"]

**SUPPLEMENTARY CONTEXT:**
- **Product Requirements:** [Include if found, otherwise state "None provided"]
- **Architecture Guidelines:** [Include if found, otherwise state "None provided"]
- **Technical Constraints:** [Framework, styling approach, performance requirements]
- **Current Styling Approach:** [CSS-in-JS, Tailwind, SCSS, etc.]

**PROJECT STRUCTURE:**
[Current directory structure for implementation context]

**INSTRUCTION:** Create comprehensive design system documentation using your systematic approach. Start with the style audit findings to identify what needs to be systematized. Use supplementary context to inform decisions but focus on creating a complete, scalable design foundation.
```

### 6. **Post-Completion Validation Gates**
After subagent completes design system documentation, run these validation checkpoints:

#### **Checkpoint 1: Design System Completeness**
- **Question**: "Are all core design system components documented with proper specifications?"
- **Validation**: Verify color system, typography, spacing, and motion documentation are complete with tokens
- **Action**: If incomplete, request missing design system sections from subagent

#### **Checkpoint 2: Token Specification Quality**
- **Question**: "Are design tokens properly specified and implementation-ready?"
- **Validation**: Check token naming conventions, value specifications, CSS/JSON export formats
- **Action**: If inadequate, request token refinement and proper formatting

#### **Checkpoint 3: Accessibility Compliance**
- **Question**: "Does the design system meet WCAG AA standards and inclusive design principles?"
- **Validation**: Verify contrast ratios, color-blind friendly palettes, typography accessibility
- **Action**: If non-compliant, request accessibility improvements and compliance documentation

#### **Checkpoint 4: Implementation Readiness**
- **Question**: "Is the design system documentation sufficient for developer implementation?"
- **Validation**: Check code examples, integration guidelines, tooling recommendations
- **Action**: If insufficient, request implementation guides and developer documentation

#### **Final Checkpoint: System Consistency**
- **Question**: "Does the design system create a cohesive, scalable foundation for the project?"
- **Validation**: Confirm systematic thinking, pattern consistency, and evolutionary design principles
- **Action**: If gaps exist, iterate with subagent to address system-wide consistency issues
