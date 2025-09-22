## Create Features Design

Prepares project context and launches the ux-feature-designer subagent with proper input. Handles requirements discovery and mode detection automatically.

### 1. **Parse Arguments**
Check `$ARGUMENTS` for:
- **Product requirements file** (required): Primary requirements document
- **Additional context files** (optional): Architecture, design system, or supporting docs

**Argument Examples:**
```markdown
# Manual mode with product requirements only
create-features-design project-documentation/product-requirements.md

# Manual mode with supporting context
create-features-design project-documentation/product-requirements.md project-documentation/frontend-architecture.md design-documentation/design-system.md

# Auto-scan mode
create-features-design
```

### 2. **Requirements Source Selection**

**If files provided in $ARGUMENTS:**
- **First argument**: Always treated as product requirements (required)
- **Additional arguments**: Treated as supporting context (architecture, design system, etc.)
- Validate all files exist and are readable
- Skip directory scanning

**If no files in $ARGUMENTS:**
- Scan for **product requirements** (required):
    - `project-documentation/` directory: `*.md`, `requirements.*`, `product-*`
    - `docs/` directory: `requirements.*`, `product-*`, `PRD.*`
    - Root-level: `README.md`, `requirements.md`, `REQUIREMENTS.txt`
- Scan for **supporting context** (optional):
    - Architecture: `project-documentation/frontend-architecture.*`, `docs/architecture.*`
    - Design system: `design-system/`, `design-documentation/`, `design.*`

### 3. Nothing to do

### 4. **Context Preparation**
Structure context package with clear priority:

**Primary Context (Required):**
- Product requirements content (from specified file OR discovered files)
- Feature specifications and user stories

**Supplementary Context (Optional, when available):**
- Frontend architecture guidelines
- Design system specifications
- Technical constraints and preferences
- Current directory structure

### 5. **Subagent Invocation**
Launch ux-feature-designer with prepared context:

```
@ux-feature-designer

**FAST-TRACK MODE ENABLED** - Skip discovery, use provided context directly

**PRIMARY CONTEXT - Product Requirements:**
Source: [file path OR "auto-discovered from: X, Y, Z"]

[Paste complete product requirements content here]

**SUPPLEMENTARY CONTEXT** (if available):
- **Architecture Guidelines:** [Include if found, otherwise state "None provided"]
- **Design System:** [Include if found, otherwise state "None provided - create appropriate patterns"]
- **Technical Constraints:** [List any technology, timeline, team constraints, or state "None specified"]

**PROJECT STRUCTURE:**
[Current directory structure for context]

**INSTRUCTION:** Process the primary requirements directly using your Feature-by-Feature Design Process. Use supplementary context to inform decisions but don't let missing supplementary context block progress.
```

### 6. **Post-Completion Validation Gates**
After subagent completes design documentation, run these validation checkpoints:

#### **Checkpoint 1: Design Documentation Completeness**
- **Question**: "Are all required design documents created with proper structure?"
- **Validation**: Verify README.md, user-journey.md, screen-states.md, interactions.md, accessibility.md, implementation.md are complete and well-structured
- **Action**: If incomplete, request missing documentation sections from subagent

#### **Checkpoint 2: User Experience Quality**
- **Question**: "Do the user journeys solve the stated problems logically?"
- **Validation**: Ensure user flows are intuitive, complete, address edge cases, and follow established UX patterns
- **Action**: If flawed, request user journey refinement and comprehensive edge case coverage

#### **Checkpoint 3: Design System Consistency**
- **Question**: "Does the design follow established patterns or create appropriate new ones?"
- **Validation**: Check design system compliance, visual consistency, pattern appropriateness, and rationale for any new patterns
- **Action**: If inconsistent, request design system alignment or clear rationale for pattern deviations

#### **Checkpoint 4: Accessibility Compliance**
- **Question**: "Does this design meet WCAG AA standards and inclusive design principles?"
- **Validation**: Verify accessibility considerations, keyboard navigation, screen reader support, color contrast, and touch target sizing
- **Action**: If non-compliant, request accessibility improvements and compliance documentation

#### **Final Checkpoint: Requirements Fulfillment**
- **Question**: "Does this design solution effectively address the user needs and business requirements?"
- **Validation**: Confirm design documentation fully addresses original product requirements and solves user problems
- **Action**: If gaps exist, iterate with subagent to address missing user needs and requirement gaps

