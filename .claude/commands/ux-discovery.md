# UX Discovery Audit

You are a senior UX consultant performing a systematic discovery audit on this codebase. Your goal is to understand the product deeply enough to identify UX opportunities, even when documentation is sparse or missing.

## Execution Architecture

This audit uses a **three-stage pipeline** to minimize context usage and maximize parallel execution:

| Stage | Model | Agent Type | Parallelization | Purpose |
|-------|-------|------------|-----------------|---------|
| 1. Discovery | Haiku | Explore | 4 concurrent agents | Fast file discovery & extraction |
| 2. Analysis | Sonnet | general-purpose | 1 agent | Heuristic evaluation & pattern matching |
| 3. Synthesis | Opus | (main context) | Sequential | Strategic recommendations & report writing |

---

## Stage 1: Parallel Discovery

Launch **all four agents simultaneously** using a single message with multiple Task tool calls. Each agent returns structured findings that feed into Stage 2.

### Agent 1: Documentation Discovery

```
Task(subagent_type: "Explore", model: "haiku")
```

**Prompt:**
```
You are analyzing a codebase for UX discovery. Find all existing documentation.

SEARCH FOR:
1. Root documentation: README.md, CLAUDE.md, CONTRIBUTING.md, ARCHITECTURE.md
2. Documentation directories: docs/, documentation/, wiki/
3. GitHub config: .github/ (templates, workflows, issue templates)
4. Design artifacts: Any files mentioning "persona", "user flow", "PRD", "requirements", "design system"

FOR EACH FILE FOUND, EXTRACT:
- Product vision/mission statements
- Target user descriptions
- Feature requirements or specifications
- Success metrics or KPIs
- Design guidelines or brand voice

RETURN FORMAT:
## Documentation Inventory
| File | Type | Key Content |
|------|------|-------------|
| path/to/file | [type] | [one-line summary] |

## Extracted Insights
- **Product Name:** [if found]
- **Target Users:** [if described]
- **Core Value Proposition:** [if stated]
- **Key Features:** [list if enumerated]

## Documentation Gaps
[List what's missing that a UX audit would typically need]
```

### Agent 2: Application Structure Mapping

```
Task(subagent_type: "Explore", model: "haiku")
```

**Prompt:**
```
You are mapping application structure for UX analysis. Analyze the codebase to understand user-facing screens and navigation.

ANALYZE:
1. Pages/Routes: Look in app/pages/, src/pages/, pages/, routes/, or router config
2. Layouts: Look in app/layouts/, layouts/, or similar
3. Navigation: Find nav components, menus, sidebars, headers
4. Auth flows: Identify login, register, forgot-password, logout patterns

FOR EACH SCREEN, NOTE:
- Route path
- Purpose (what user accomplishes here)
- Key components used
- Whether it's public or protected

ALSO IDENTIFY:
- Empty states (how does the app handle "no data yet"?)
- Loading states (spinners, skeletons, progress indicators)
- Error boundaries (how are errors displayed?)

RETURN FORMAT:
## Screen Inventory
| Route | Purpose | Protection | Key Components |
|-------|---------|------------|----------------|
| /path | [purpose] | public/auth | [components] |

## Navigation Structure
[Describe how users move between screens - hierarchy, patterns]

## State Handling
- **Empty states found:** [yes/no, examples]
- **Loading patterns:** [describe]
- **Error handling:** [describe]

## Auth Flow Summary
[Describe the authentication journey from signup to first value]
```

### Agent 3: Data Model Analysis

```
Task(subagent_type: "Explore", model: "haiku")
```

**Prompt:**
```
You are analyzing the data model to understand the user's mental model of this product.

SEARCH FOR:
1. Database schemas: supabase/migrations/, prisma/schema.prisma, *.sql files
2. TypeScript types: types/, *.types.ts, interfaces, type definitions
3. API contracts: api/, endpoints, GraphQL schemas
4. Zod/validation schemas: schemas/, *.schema.ts

FOR EACH ENTITY, IDENTIFY:
- Name and purpose
- Key fields (especially user-facing ones)
- Relationships (1:many, many:many)
- Status/state fields (draft, active, archived, etc.)
- Constraints (required fields, limits, validations)

RETURN FORMAT:
## Entity Inventory
| Entity | Purpose | Key Fields | States |
|--------|---------|------------|--------|
| [name] | [what it represents] | [important fields] | [if any] |

## Relationships
[Describe key relationships in plain language]

## Mental Model Requirements
[List concepts users must understand to use this product effectively]

## Constraints & Limits
[Note any limits users will encounter: max items, character limits, etc.]
```

### Agent 4: Copy & Microcopy Extraction

```
Task(subagent_type: "Explore", model: "haiku")
```

**Prompt:**
```
You are extracting user-facing text to analyze the product's voice and tone.

SEARCH FOR:
1. Error messages: grep for "error", "failed", "invalid", "unable", "couldn't"
2. Success messages: grep for "success", "created", "saved", "updated", "deleted"
3. Button labels: look in components for button text, CTAs
4. Form helpers: placeholders, labels, help text, tooltips
5. Empty states: messages shown when no data exists
6. Confirmation dialogs: "Are you sure?", destructive action warnings

COLLECT 3-5 EXAMPLES OF EACH CATEGORY.

ASSESS VOICE & TONE on these dimensions (rate 1-5):
| Dimension | 1 | 5 | Rating |
|-----------|---|---|--------|
| Formality | Formal, corporate | Casual, conversational | [?] |
| Technicality | Jargon-heavy | Plain language | [?] |
| Directiveness | Commands ("Do X") | Collaborative ("Let's X") | [?] |
| Verbosity | Minimal, terse | Explanatory, detailed | [?] |

RETURN FORMAT:
## Copy Samples

### Error Messages
- "[example 1]"
- "[example 2]"
- "[example 3]"

### Success Messages
- "[example 1]"
- "[example 2]"

### Button Labels & CTAs
- "[example 1]"
- "[example 2]"

### Empty States
- "[example 1]"

### Confirmation Dialogs
- "[example 1]"

## Voice & Tone Assessment
| Dimension | Rating | Evidence |
|-----------|--------|----------|
| Formality | [1-5] | [why] |
| Technicality | [1-5] | [why] |
| Directiveness | [1-5] | [why] |
| Verbosity | [1-5] | [why] |

## Consistency Observations
[Note any inconsistencies in voice/tone across the product]
```

---

## Stage 2: Heuristic Analysis

After Stage 1 completes, launch **one Sonnet agent** to perform structured analysis:

```
Task(subagent_type: "general-purpose", model: "sonnet")
```

**Prompt:**
```
You are a UX analyst applying heuristic evaluation to discovery findings.

STAGE 1 FINDINGS:
[Paste the outputs from all four Stage 1 agents here]

---

TASK 1: NIELSEN'S 10 USABILITY HEURISTICS

For each heuristic, rate the current implementation (1-5) based on the findings above:

| # | Heuristic | What to Evaluate | Rating | Evidence | Violations |
|---|-----------|------------------|--------|----------|------------|
| 1 | Visibility of system status | Loading states, progress indicators, notifications | [1-5] | [specific evidence] | [if any] |
| 2 | Match between system and real world | Domain language, familiar patterns | [1-5] | [evidence] | [if any] |
| 3 | User control and freedom | Undo, cancel, back navigation, drafts | [1-5] | [evidence] | [if any] |
| 4 | Consistency and standards | Component reuse, naming, patterns | [1-5] | [evidence] | [if any] |
| 5 | Error prevention | Validation, confirmations, disabled states | [1-5] | [evidence] | [if any] |
| 6 | Recognition over recall | Autocomplete, recent items, contextual help | [1-5] | [evidence] | [if any] |
| 7 | Flexibility and efficiency | Shortcuts, bulk actions, customization | [1-5] | [evidence] | [if any] |
| 8 | Aesthetic and minimalist design | Information density, component complexity | [1-5] | [evidence] | [if any] |
| 9 | Error recovery | Error boundaries, retry mechanisms, helpful messages | [1-5] | [evidence] | [if any] |
| 10 | Help and documentation | Tooltips, onboarding, help pages | [1-5] | [evidence] | [if any] |

TASK 2: EMOTIONAL JOURNEY MAPPING

Based on the screens and flows identified, map emotional touchpoints:

### Potential Delight Moments
[Where might users feel positive emotions? Are these moments amplified?]
- Trigger: [what happens]
- Current handling: [how the app responds]
- Opportunity: [how to enhance]

### Potential Frustration Points
[Where might users feel negative emotions? Are these moments softened?]
- Trigger: [what happens]
- Current handling: [how the app responds]
- Risk level: [High/Med/Low]
- Mitigation: [suggestion]

### Potential Anxiety Moments
[Destructive actions, data loss risks, irreversible choices]
- Trigger: [what action]
- Current safeguards: [what exists]
- Adequacy: [sufficient/needs improvement]

TASK 3: VOICE/TONE FIT ANALYSIS

Given the target users (from documentation) and the voice/tone assessment:
- Does the current voice match the target persona?
- Are there mismatches to flag? (e.g., enterprise tool with casual copy)
- Recommendations for alignment?

RETURN FORMAT:
## Heuristic Scorecard
[The table from Task 1]

### Critical Violations (Severity: High)
| Issue | Heuristic | Impact | Recommendation |
|-------|-----------|--------|----------------|

### Moderate Issues (Severity: Medium)
| Issue | Heuristic | Impact | Recommendation |
|-------|-----------|--------|----------------|

### Minor Issues (Severity: Low)
| Issue | Heuristic | Impact | Recommendation |
|-------|-----------|--------|----------------|

## Emotional Journey Map
[Findings from Task 2, organized by journey phase]

## Voice/Tone Fit Analysis
[Findings from Task 3]
```

---

## Stage 3: Synthesis & Report Writing

After Stage 2 completes, synthesize all findings in the main Opus context. This stage requires Opus for:
- Cross-referencing findings across all agents
- Identifying patterns and contradictions
- Prioritizing recommendations strategically
- Crafting a cohesive, actionable narrative

### Synthesis Checklist

Before writing the report, verify you can answer:

**About Users:**
- [ ] Who is the primary user? (role, context, goals)
- [ ] What problem does this solve for them?
- [ ] What's their current alternative? (competitor or manual process)
- [ ] What emotional state are they in when using this?

**About the Product:**
- [ ] What is the ONE core action users take? (the "aha moment")
- [ ] What's the happy path from signup to value?
- [ ] What are the 3-5 key screens?
- [ ] What data do users provide? What do they get back?

**About UX Quality:**
- [ ] Are loading and error states handled consistently?
- [ ] Is accessibility considered? (ARIA, keyboard nav, contrast)
- [ ] Is mobile experience considered?
- [ ] Are empty states helpful or just empty?

### Report Template

Write the final report to `docs/UX_DISCOVERY.md`:

```markdown
# UX Discovery Report: [Project Name]

## Executive Summary
[2-3 sentences: What is this product and who is it for?]

## Product Understanding

### Core Value Proposition
[What problem does this solve? What's the key benefit?]

### Target Users
[Who uses this? What are their goals and pain points?]
- **Primary persona:** [description]
- **Secondary persona:** [if applicable]

### Key User Journeys
1. [Journey 1: e.g., "New user signup to first value"]
2. [Journey 2: e.g., "Daily usage pattern"]
3. [Journey 3: e.g., "Weekly review/reporting"]

## Current State Assessment

### Heuristic Scorecard
| Heuristic | Score | Key Finding |
|-----------|-------|-------------|
| 1. Visibility of system status | [1-5] | [summary] |
| 2. Match system/real world | [1-5] | [summary] |
| 3. User control and freedom | [1-5] | [summary] |
| 4. Consistency and standards | [1-5] | [summary] |
| 5. Error prevention | [1-5] | [summary] |
| 6. Recognition over recall | [1-5] | [summary] |
| 7. Flexibility and efficiency | [1-5] | [summary] |
| 8. Aesthetic/minimalist design | [1-5] | [summary] |
| 9. Error recovery | [1-5] | [summary] |
| 10. Help and documentation | [1-5] | [summary] |

**Overall Score: [X/50]**

### Strengths
- [What's working well UX-wise?]

### Opportunities
| Issue | Heuristic | Severity | Recommendation |
|-------|-----------|----------|----------------|
| [issue] | [#] | High/Med/Low | [suggestion] |

### Voice & Tone Assessment
| Dimension | Current | Target | Gap |
|-----------|---------|--------|-----|
| Formality | [1-5] | [1-5] | [if any] |
| Technicality | [1-5] | [1-5] | [if any] |
| Directiveness | [1-5] | [1-5] | [if any] |
| Verbosity | [1-5] | [1-5] | [if any] |

### Missing/Unclear (Requires Stakeholder Input)
- [Questions that code analysis couldn't answer]

## Emotional Journey Analysis

### Delight Opportunities
[Where and how to amplify positive moments]

### Frustration Risks
[Where users might struggle and how to mitigate]

### Trust & Safety
[How the product builds confidence during risky operations]

## Recommendations

### Quick Wins (Low effort, high impact)
1. [recommendation]
2. [recommendation]
3. [recommendation]

### Strategic Improvements (Higher effort)
1. [recommendation]
2. [recommendation]

### Future Considerations
1. [recommendation]

## Appendix

### Screen Inventory
| Screen | Purpose | Protection | Key Components |
|--------|---------|------------|----------------|
| /path | [purpose] | public/auth | [components] |

### Entity Model
| Entity | Purpose | User-Facing Fields |
|--------|---------|-------------------|
| [name] | [purpose] | [fields] |

### Design System Summary
- **Component library:** [library name]
- **Color approach:** [description]
- **Typography:** [fonts/approach]
```

---

## Execution Instructions

1. **Launch Stage 1 agents in parallel** - Use a single message with 4 Task tool calls
2. **Wait for all Stage 1 agents to complete** - Do not proceed until all return
3. **Launch Stage 2 agent** - Pass all Stage 1 outputs in the prompt
4. **Wait for Stage 2 to complete**
5. **Synthesize in main context** - Review all outputs, identify patterns
6. **Write the report** - Create `docs/UX_DISCOVERY.md`

### Quality Guidelines

- **Start broad, then narrow:** Understand big picture before component details
- **Assume nothing:** Verify meaning of domain terms from code
- **Be actionable:** Every observation connects to a "so what?"
- **Distinguish fact from inference:** Mark what you observed vs. inferred
- **Always deliver the artifact:** Audit is not complete until `docs/UX_DISCOVERY.md` exists

---

## Begin Execution

Start Stage 1 now. Launch all four discovery agents in parallel using a single message with multiple Task tool calls.
