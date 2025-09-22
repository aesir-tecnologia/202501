## Create Component Documentation

Discovers existing components and launches the frontend-component-documenter subagent with proper context. Handles component discovery, design system integration, and automated documentation generation.

### 1. **Parse Arguments**
Check `$ARGUMENTS` for:
- **Product requirements file** (optional): Primary requirements document
- **Frontend architecture file** (optional): Architecture documentation
- **Component name(s)** (optional): Specific component(s) to document
- **Component directory** (optional): Custom path to components
- **Design system context** (optional): Path to design system documentation

**Argument Examples:**
```markdown
# Requirements-driven mode (recommended)
create-component-docs project-documentation/product-requirements.md

# Requirements + architecture context
create-component-docs project-documentation/product-requirements.md project-documentation/frontend-architecture.md

# Requirements + specific components
create-component-docs project-documentation/product-requirements.md Button FormField

# Document specific component only
create-component-docs Button

# Auto-discover all components (legacy mode)
create-component-docs
```

### 2. **Primary Documentation Discovery & Requirements Analysis**

**Product Requirements Discovery:**
**If requirements file provided in $ARGUMENTS:**
- Use specified product requirements file as primary source
- Validate file exists and is readable

**If no requirements file specified, auto-discover:**
- Scan for **product requirements** (highest priority):
  - `project-documentation/` directory: `*.md`, `requirements.*`, `product-*`, `PRD.*`
  - `docs/` directory: `requirements.*`, `product-*`, `PRD.*`, `features.*`
  - Root-level: `README.md`, `requirements.md`, `REQUIREMENTS.txt`

**Frontend Architecture Discovery:**
**If architecture file provided in $ARGUMENTS:**
- Use specified architecture file as secondary source
- Validate file exists and is readable

**If no architecture file specified, auto-discover:**
- Scan for **frontend architecture** (secondary priority):
  - `project-documentation/` directory: `frontend-architecture.*`, `architecture.*`, `tech-stack.*`
  - `docs/` directory: `architecture.*`, `frontend.*`, `technical.*`
  - Root-level: `ARCHITECTURE.md`, `TECH-STACK.md`

**Requirements Processing:**
- **Component Extraction**: Identify components mentioned in user stories and acceptance criteria
- **Feature Mapping**: Map components to specific product features and use cases  
- **Priority Assessment**: Determine component importance based on feature criticality
- **Dependency Analysis**: Understand component relationships from requirements context

### 3. **Component Discovery & Analysis**

**Requirements-Driven Component Discovery (Primary Path):**
- **Target Components**: Focus on components identified in requirements first
- **Feature Components**: Components supporting critical user flows
- **Validation**: Verify required components exist in codebase
- **Gap Analysis**: Identify missing components needed for requirements

**Traditional Component Discovery (Fallback Path):**
**If component names provided in $ARGUMENTS or no requirements found:**
- **Target Components**: Focus on specified component(s)
- **Auto-Discovery**: Scan common component locations:
  - `src/components/`, `components/`, `lib/components/`
  - `src/ui/`, `ui/`, `lib/ui/`
  - `src/shared/components/`, `shared/components/`
- **Framework Detection**: Identify React, Vue, Angular, Svelte components
- **Naming Patterns**: Detect component naming conventions
- **Priority Sorting**: Order by usage frequency and importance

**Component Pattern Analysis:**
- **File Structure**: Component organization patterns
- **Naming Conventions**: Component, prop, and file naming
- **Props Patterns**: Common prop structures and types
- **State Management**: useState, useReducer, external state patterns
- **Styling Approach**: CSS-in-JS, modules, Tailwind, styled-components

### 4. **Design System Context Discovery**

**If design system path provided:**
- Use specified design system documentation as primary context
- Validate design system files exist and are readable

**If no design system specified, auto-discover:**
- Scan for existing design system documentation:
  - `design-documentation/design-system/`
  - `docs/design-system/`, `design-system/`
  - `style-guide/`, `design-guide/`
- Look for design tokens:
  - `tokens/`, `design-tokens/`
  - CSS custom properties in stylesheets
  - JSON/JS token files
- Component library detection:
  - Storybook configuration (`.storybook/`)
  - Figma tokens, Style Dictionary configs

### 5. **Existing Component Documentation Audit**

**Current Documentation Assessment:**
- **Existing Docs**: Scan for current component documentation
  - README files in component directories
  - JSDoc comments in component files
  - Storybook stories and documentation
  - Type definitions and interfaces

**Documentation Gaps Analysis:**
- **Missing Documentation**: Components without adequate docs
- **Outdated Information**: Documentation that doesn't match current implementation
- **Inconsistent Patterns**: Varying documentation styles and completeness
- **Accessibility Gaps**: Missing or incomplete accessibility documentation

**Implementation Analysis:**
- **Component Complexity**: Simple, moderate, or complex components
- **API Surface**: Number of props, events, and methods
- **State Management**: Internal state patterns and external dependencies
- **Composition Patterns**: How components work together

### 6. **Technical Context Preparation**

**Framework & Tooling Context:**
- **Framework**: React, Vue, Angular, Svelte detection
- **TypeScript**: Interface definitions and type patterns
- **Testing Setup**: Jest, Vitest, Testing Library configuration
- **Build System**: Webpack, Vite, Next.js, Nuxt, SvelteKit
- **Styling Solution**: CSS-in-JS, CSS Modules, Tailwind, SCSS

**Development Environment:**
- **Package Dependencies**: UI libraries, utility libraries
- **Linting Rules**: ESLint, Stylelint configurations
- **Accessibility Tools**: axe-core, jest-axe setup
- **Performance Tools**: Bundle analyzer, lighthouse configuration

### 7. **Context Package Preparation**

Structure comprehensive context for the documenter agent with clear priority hierarchy:

**Primary Context (Requirements & Architecture - Highest Priority):**
- Product requirements content and component specifications extracted
- Frontend architecture guidelines and technical constraints
- Component priority ranking based on feature importance
- User stories and acceptance criteria that components must support

**Secondary Context (Component Implementation):**
- Target component(s) analysis and current implementation
- Component API surface and complexity assessment
- Existing documentation gaps and improvement opportunities
- Usage patterns and integration points

**Supplementary Context (Design & Technical Details):**
- Design system tokens and specifications (if available)
- Component library patterns and conventions
- Framework patterns and development conventions
- Testing patterns and accessibility requirements

### 8. **Component Documentation Planning & Todo List Creation**

**Create Comprehensive Todo List:**
Use TodoWrite tool to create todo list with all components to be documented, in priority order:

```
TodoWrite: [
  {"content": "Document [Priority-1-Component] - [brief description of requirements context]", "status": "pending", "activeForm": "Documenting [Priority-1-Component]"},
  {"content": "Document [Priority-2-Component] - [brief description of requirements context]", "status": "pending", "activeForm": "Documenting [Priority-2-Component]"},
  ...additional components in priority order
]
```

**Todo List Organization:**
- **Requirements-Driven Components (Priority 1)**: Components extracted from requirements, ordered by feature criticality
- **Architecture-Defined Components (Priority 2)**: Components identified from architecture patterns  
- **Existing Components (Priority 3)**: Discovered components not covered in requirements

**Progress Tracking Strategy:**
- Each component gets its own todo item with clear description
- Mark components as "in_progress" when starting documentation
- Mark components as "completed" only after passing all validation gates
- Track overall progress through the component documentation process

### 9. **Component-by-Component Documentation Loop**

**For Each Component in Todo List (Process Individually):**

#### 9.1. **Start Component Documentation**
- Update todo list: Mark current component as "in_progress" 
- Focus context on single component to optimize context window usage
- Prepare component-specific context package

#### 9.2. **Single Component Subagent Invocation**

Launch frontend-component-documenter with focused, single-component context:

```
@frontend-component-documenter

**SINGLE COMPONENT DOCUMENTATION REQUEST**

**TARGET COMPONENT:** [Current Component Name from Todo List]

**PRIMARY CONTEXT - PRODUCT REQUIREMENTS & ARCHITECTURE:**

**Product Requirements:**
Source: [Path to requirements file OR "Auto-discovered from: X, Y, Z" OR "None found"]
[Include relevant product requirements sections that mention this specific component]

**Frontend Architecture:**
Source: [Path to architecture file OR "Auto-discovered from: X" OR "None found"]  
[Include architecture guidelines relevant to this specific component]

**COMPONENT-SPECIFIC REQUIREMENTS:**
- **Feature Context**: [Which product features this component supports]
- **User Stories**: [Specific user stories this component addresses]
- **Acceptance Criteria**: [Relevant acceptance criteria this component must meet]
- **Priority Rationale**: [Why this component was prioritized for documentation]

**COMPONENT ANALYSIS:**
- **Framework**: [React/Vue/Angular/Svelte]
- **TypeScript**: [Yes/No with interface patterns for this component]
- **Styling**: [CSS-in-JS/Modules/Tailwind/etc. for this component]
- **Complexity**: [Simple/Moderate/Complex for this specific component]

**EXISTING IMPLEMENTATION DETAILS (Component-Specific):**
[Detailed analysis of THIS component's current implementation, props, state, events]

**DESIGN SYSTEM CONTEXT (Component-Relevant):**
Source: [Path to design system docs OR "Auto-discovered" OR "None found"]
[Include design tokens, specifications relevant to this specific component]

**COMPONENT-SPECIFIC DOCUMENTATION GAPS:**
- [Specific areas lacking documentation for this component]
- [Implementation gaps for this component vs requirements]
- [Accessibility requirements missing for this component]

**TECHNICAL REQUIREMENTS:**
- **Testing Framework**: [Jest/Vitest/etc.]
- **Accessibility Tools**: [axe-core/jest-axe/etc.]
- **Performance Targets**: [Bundle size, runtime performance goals for this component]
- **Browser Support**: [Supported browser versions]

**INSTRUCTION:** Create comprehensive documentation for ONLY the specified component. Focus on this single component's requirements, implementation, and specifications. Create the complete documentation package (specifications, API, accessibility, usage, testing) specifically for this component that aligns with the product requirements and architecture guidelines provided.

Do not document other components - focus exclusively on the current target component.
```

#### 9.3. **Per-Component Validation Gates**

After subagent completes THIS component's documentation, run these validation checkpoints before proceeding to next component:

##### **Checkpoint 1: Requirements Alignment & Coverage**
- **Question**: "Does this component's documentation align with product requirements and support identified features?"
- **Validation**: Verify this component's documentation supports specified user stories and acceptance criteria
- **Action**: If misaligned, request refocus on requirements alignment for this specific component

##### **Checkpoint 2: Component Documentation Completeness**
- **Question**: "Is this component fully documented with complete specifications?"
- **Validation**: Verify this component has all required documentation files (specs, API, states, accessibility, usage, testing)
- **Action**: If incomplete, request missing documentation sections for this component from subagent

##### **Checkpoint 3: API Documentation Quality**
- **Question**: "Are this component's APIs, props, and interfaces properly documented with examples?"
- **Validation**: Check prop definitions, event handlers, method signatures, and TypeScript interfaces for this component
- **Action**: If inadequate, request API documentation refinement and practical examples for this component

##### **Checkpoint 4: Accessibility Compliance Documentation**
- **Question**: "Does this component include comprehensive accessibility specifications?"
- **Validation**: Verify ARIA support, keyboard navigation, screen reader requirements, and WCAG compliance for this component
- **Action**: If non-compliant, request accessibility improvements and detailed compliance documentation for this component

##### **Checkpoint 5: Usage Guidelines & Best Practices**
- **Question**: "Are this component's usage guidelines clear with practical examples and common pitfall warnings?"
- **Validation**: Check when to use/not use, composition patterns, and best practices documentation for this component
- **Action**: If insufficient, request enhanced usage documentation with real-world examples for this component

##### **Checkpoint 6: Testing Specifications**
- **Question**: "Are testing requirements comprehensive with specific test cases for this component?"
- **Validation**: Confirm unit, integration, accessibility, and visual testing specifications are complete for this component
- **Action**: If inadequate, request detailed testing specifications and requirement clarification for this component

##### **Final Per-Component Checkpoint: Developer Readiness & Requirements Alignment**
- **Question**: "Is this component's documentation sufficient for developers to implement, test, and maintain it while supporting the identified product requirements?"
- **Validation**: Confirm implementation guidelines, performance considerations, maintenance documentation, and requirements traceability for this component
- **Action**: If gaps exist, iterate with subagent to address developer experience, implementation clarity, and requirements alignment for this component

#### 9.4. **Component Completion & Loop Continuation**
**If All Validation Gates Pass:**
- Update todo list: Mark current component as "completed"
- Move to next component in todo list
- Repeat steps 9.1-9.3 for next component

**If Validation Gates Fail:**
- Keep component as "in_progress" in todo list  
- Iterate with subagent to address validation failures
- Do not proceed to next component until current component passes all gates

**Continue Loop Until:**
- All components in todo list are marked "completed"
- All component documentation has passed individual validation gates

### 10. **Final Cross-Component Validation & Integration**

**After All Components Completed:**
Once all components in todo list are marked "completed", run final validation across all documented components:

#### **Cross-Component Consistency Check:**
- **Component Integration**: Verify components work well together based on documented APIs
- **Design System Alignment**: Confirm all components follow consistent design system patterns
- **Naming Conventions**: Ensure consistent naming across all component documentation
- **Documentation Structure**: Verify all components follow the same documentation template

#### **Requirements Traceability Validation:**
- **Feature Coverage**: Confirm all required components for product features are documented
- **User Story Support**: Verify documented components collectively support all identified user stories
- **Acceptance Criteria**: Check that component specifications meet all acceptance criteria
- **Priority Coverage**: Ensure highest priority components received most thorough documentation

#### **Cross-Reference Validation:**
- **Component Dependencies**: Document how components depend on or integrate with each other
- **Composition Patterns**: Verify documented composition patterns work across component combinations
- **Shared Interfaces**: Ensure consistent prop patterns and interfaces across related components

#### **Architecture Compliance Check:**
- **Pattern Consistency**: Verify all components follow architecture guidelines consistently
- **Technical Standards**: Confirm all components meet technical requirements and constraints
- **Performance Standards**: Check that documented performance targets are consistent across components

### 11. **Documentation Organization & Final Setup**

**File Structure Validation:**
- Ensure proper directory structure follows established conventions across all components
- Verify cross-references between all component documentation are accurate
- Check that all component documentation integrates properly with design system docs

**Cross-Component Integration:**
- Create master component index with links to all documented components
- Generate component dependency map showing relationships
- Create usage matrix showing which components work together

**Version Control Integration:**
- Set up proper versioning for all component documentation
- Establish update procedures for documentation maintenance across components
- Create change tracking system for component API evolution

**Developer Experience Optimization:**
- Validate documentation is easily searchable and navigable across all components
- Ensure examples are copy-pasteable and functional across all components
- Verify integration with existing development workflows (Storybook, etc.)
- Create component documentation index/overview page

**Final Quality Assurance:**
- Complete todo list cleanup (all items should be "completed")
- Generate final documentation coverage report
- Create component documentation maintenance guide
- Establish ongoing review process for future component documentation updates