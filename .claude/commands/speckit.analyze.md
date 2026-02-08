---
description: Perform a non-destructive cross-artifact consistency and quality analysis across spec.md, plan.md, and tasks.md after task generation.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Goal

Identify inconsistencies, duplications, ambiguities, and underspecified items across the three core artifacts (`spec.md`, `plan.md`, `tasks.md`) before implementation. This command MUST run only after `/speckit.tasks` has successfully produced a complete `tasks.md`.

## Operating Constraints

**SPEC ARTIFACTS READ-ONLY**: Do **not** modify spec artifacts (`spec.md`, `plan.md`, `tasks.md`, `constitution.md`). The analysis digest (`analysis-digest.json`) is a derived working artifact and may be written/overwritten. Output a structured analysis report. Offer an optional remediation plan (user must explicitly approve before any follow-up editing commands would be invoked manually).

**Constitution Authority**: The project constitution (`.specify/memory/constitution.md`) is **non-negotiable** within this analysis scope. Constitution conflicts are automatically CRITICAL and require adjustment of the spec, plan, or tasks—not dilution, reinterpretation, or silent ignoring of the principle. If a principle itself needs to change, that must occur in a separate, explicit constitution update outside `/speckit.analyze`.

**Ship It Bias**: This analysis prevents critical errors, NOT stylistic perfection. Only report issues with **practical implementation impact**. When in doubt, recommend proceeding. Specs evolve through building, not pre-emptive polish.

**Token-Efficient Output**: Limit findings to 10 total; summarize overflow. Focus on actionable findings, not exhaustive documentation or stylistic polish.

**Deterministic Results**: Rerunning without changes should produce consistent IDs and counts.

**Analysis Integrity**: NEVER hallucinate missing sections (report accurately if absent). Prioritize constitution violations (always CRITICAL). Use specific examples over generic patterns. Report zero issues gracefully with coverage statistics.

## Execution Steps

### 1. Initialize Analysis Context

Run `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` once from repo root and parse JSON for FEATURE_DIR and AVAILABLE_DOCS. Derive absolute paths:

- SPEC = FEATURE_DIR/spec.md
- PLAN = FEATURE_DIR/plan.md
- TASKS = FEATURE_DIR/tasks.md
- CONSTITUTION = .specify/memory/constitution.md
- DIGEST = FEATURE_DIR/analysis-digest.json

Abort with an error message if any required file is missing (instruct the user to run missing prerequisite command).
For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

### 2. Digest Artifacts

**Delegate to `Explore` agent** — Launch a single Explore agent to read all 4 files, build a structured JSON digest, and **write it to disk** at `{DIGEST}`. The main conversation never sees raw file contents or digest payload.

Prompt the agent with:
```
Read and digest these speckit artifacts:
- SPEC: {SPEC}
- PLAN: {PLAN}
- TASKS: {TASKS}
- CONSTITUTION: {CONSTITUTION}

Build semantic models matching this JSON structure:

{
  "requirements": [
    {
      "slug": "user-can-upload-file",
      "type": "functional|non-functional",
      "text": "<imperative phrase, max 120 chars>",
      "location": "spec.md:§<section>",
      "measurable": true|false,
      "relatedStories": ["US1", "US3"]
    }
  ],
  "userStories": [
    {
      "id": "US1",
      "title": "<story title>",
      "priority": "P0|P1|P2|P3",
      "scenarioCount": 3,
      "hasAcceptanceCriteria": true|false,
      "mappedRequirements": ["user-can-upload-file"]
    }
  ],
  "tasks": [
    {
      "id": "T1.1",
      "phase": "Setup|Tests|Core|Integration|Polish",
      "storyLabel": "US1|null",
      "description": "<max 100 chars>",
      "files": ["app/lib/supabase/foo.ts"],
      "isParallel": false,
      "inferredRequirements": ["user-can-upload-file"]
    }
  ],
  "architecture": {
    "stack": ["Nuxt 4", "Supabase", "..."],
    "patterns": ["Three-Layer Data Access", "..."],
    "entities": ["Project", "Stint", "..."],
    "constraints": ["SSG with client-side auth", "..."]
  },
  "constitutionRules": [
    {
      "principle": "Three-Layer Data Access Architecture",
      "normative": "MUST|SHOULD",
      "summary": "<max 120 chars>",
      "checkpoints": ["Export typed helpers", "Require TypedSupabaseClient"]
    }
  ],
  "terminology": [
    {
      "term": "stint",
      "usageLocations": ["spec.md", "plan.md", "tasks.md"],
      "variants": ["stint", "session", "work block"]
    }
  ],
  "metrics": {
    "totalRequirements": 0,
    "totalStories": 0,
    "totalTasks": 0,
    "totalPhases": 0,
    "totalEdgeCases": 0,
    "totalPrinciples": 0
  }
}

Rules:
- Derive requirement slugs from imperative phrases (e.g., "User can upload file" → "user-can-upload-file")
- Map tasks to requirements by keyword matching and explicit ID references ([US{N}])
- Extract ALL constitution principles with their MUST/SHOULD normative level
- Track terminology variants across all 4 files

**Output instructions:**
1. Write the JSON digest to: {DIGEST} using the Write tool
2. Return ONLY a confirmation message with the file path — do NOT return the digest contents
```

**Store the DIGEST file path** for use in Step 3. The main conversation holds only the path string, never the digest contents.

### 3. Run Detection Passes (Parallel)

Launch **3 parallel `spec-analyzer` agents** in a single message with 3 Task tool calls. Each reads the analysis digest from disk and runs a subset of detection passes.

#### Agent A: Text Quality (Duplication + Ambiguity + Underspecification)

```
Analyze this artifact digest for text quality issues. Return findings as JSON.

**Digest file:** {DIGEST}
Read this file with your Read tool before proceeding with detection.

**Detection passes:**

A. Duplication Detection
- Identify near-duplicate requirements (similar slug, overlapping text)
- Mark lower-quality phrasing for consolidation

B. Ambiguity Detection
- Flag vague adjectives (fast, scalable, secure, intuitive, robust) lacking measurable criteria
- Flag unresolved placeholders (TODO, TKTK, ???, <placeholder>, etc.)

C. Underspecification
- Requirements with verbs but missing object or measurable outcome
- User stories missing acceptance criteria alignment (hasAcceptanceCriteria: false)
- Tasks referencing files or components not defined in architecture

**Finding budget: 8 max.** Report overflow count if more exist.

Return:
{
  "findings": [
    {
      "id": "A1|B1|C1",
      "category": "Duplication|Ambiguity|Underspecification",
      "locations": ["spec.md:§Requirements", "tasks.md:T2.1"],
      "summary": "<concise description>",
      "recommendation": "<actionable fix>"
    }
  ],
  "overflowCount": 0,
  "passMetrics": {
    "duplicatesFound": 0,
    "ambiguitiesFound": 0,
    "underspecsFound": 0
  }
}

Return ONLY the JSON — no prose.
```

#### Agent B: Structural Integrity (Coverage Gaps + Inconsistency)

```
Analyze this artifact digest for structural integrity. Return findings as JSON.

**Digest file:** {DIGEST}
Read this file with your Read tool before proceeding with detection.

**Detection passes:**

E. Coverage Gaps
- Requirements with zero associated tasks (check inferredRequirements across all tasks)
- Tasks with no mapped requirement/story (storyLabel: null AND empty inferredRequirements)
- Non-functional requirements not reflected in tasks (performance, security, accessibility)

F. Inconsistency
- Terminology drift: same concept named differently across files (check terminology.variants)
- Data entities referenced in architecture but absent in requirements (or vice versa)
- Task ordering contradictions: integration tasks before foundational setup without dependency note
- Conflicting requirements: contradictory tech choices or behaviors

**Finding budget: 6 max.** Report overflow count if more exist.

Return:
{
  "findings": [
    {
      "id": "E1|F1",
      "category": "Coverage Gap|Inconsistency",
      "locations": ["spec.md:§Requirements", "tasks.md:T3.2"],
      "summary": "<concise description>",
      "recommendation": "<actionable fix>"
    }
  ],
  "overflowCount": 0,
  "passMetrics": {
    "coverageGapsFound": 0,
    "inconsistenciesFound": 0,
    "requirementCoverage": "85%"
  }
}

Return ONLY the JSON — no prose.
```

#### Agent C: Constitution Compliance

```
Analyze this artifact digest for constitution compliance. Return findings as JSON.

**Digest file:** {DIGEST}
Read this file with your Read tool before proceeding with detection.

**Detection pass:**

D. Constitution Alignment
- Any requirement, plan element, or task that conflicts with a MUST principle
- Missing mandated sections or quality gates from constitution checkpoints
- SHOULD principles not addressed (lower severity than MUST violations)
- Architecture choices that contradict constitution patterns

**Finding budget: 4 max.** Report overflow count if more exist.

Return:
{
  "findings": [
    {
      "id": "D1",
      "category": "Constitution Violation|Constitution Warning",
      "locations": ["plan.md:§Architecture", "constitution.md:§Principle III"],
      "principle": "<principle name>",
      "normative": "MUST|SHOULD",
      "summary": "<concise description>",
      "recommendation": "<actionable fix>"
    }
  ],
  "overflowCount": 0,
  "passMetrics": {
    "mustViolations": 0,
    "shouldWarnings": 0,
    "principlesChecked": 0
  }
}

Return ONLY the JSON — no prose.
```

**Collect all 3 agent results** before proceeding to Step 4.

### 4. Severity Assignment & Deduplication

Merge findings from all 3 agents. Assign severity using this heuristic:

- **CRITICAL**: Violates constitution MUST, missing core spec artifact, or requirement with zero coverage that blocks baseline functionality
- **HIGH**: Duplicate or conflicting requirement, ambiguous security/performance attribute, untestable acceptance criterion
- **MEDIUM**: Terminology drift, missing non-functional task coverage, underspecified edge case
- **LOW**: Style/wording improvements, minor redundancy not affecting execution order

Deduplicate cross-agent findings that reference the same location and issue. Preserve the higher severity when duplicates conflict.

### 5. Produce Compact Analysis Report

Output a Markdown report (no file writes) with the following structure:

## Specification Analysis Report

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| A1 | Duplication | HIGH | spec.md:L120-134 | Two similar requirements ... | Merge phrasing; keep clearer version |

(Add one row per finding; generate stable IDs prefixed by category initial.)

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|

**Constitution Alignment Issues:** (if any)

**Unmapped Tasks:** (if any)

**Metrics:**

- Total Requirements
- Total Tasks
- Coverage % (requirements with >=1 task)
- Ambiguity Count
- Duplication Count
- Critical Issues Count

### 6. Provide Next Actions

At end of report, output a concise Next Actions block:

- If CRITICAL issues exist: Recommend resolving before `/speckit.implement`
- If only LOW/MEDIUM: User may proceed, but provide improvement suggestions
- Provide explicit command suggestions: e.g., "Run /speckit.specify with refinement", "Run /speckit.plan to adjust architecture", "Manually edit tasks.md to add coverage for 'performance-metrics'"

### 7. Offer Remediation

Ask the user: "Would you like me to suggest concrete remediation edits for the top N issues?" (Do NOT apply them automatically.)

---

## Subagent Reference

| Step | Agent | Purpose | Context Passed |
|------|-------|---------|----------------|
| 2 | general-purpose | Artifact digestion + semantic models + write to disk | FEATURE_DIR, 4 file paths, DIGEST output path |
| 3a | spec-analyzer (parallel) | Text quality (Dup/Ambig/Underspec) | DIGEST file path |
| 3b | spec-analyzer (parallel) | Structural integrity (Coverage/Inconsistency) | DIGEST file path |
| 3c | spec-analyzer (parallel) | Constitution compliance | DIGEST file path |

**Context savings**: ~95% reduction in main context usage. The digest is written to disk by Step 2 and read from disk by Step 3 agents — the main conversation holds only file paths, never digest contents.

---

## Notes

- This command assumes a complete task breakdown exists in tasks.md
- If tasks are incomplete or missing, suggest running `/speckit.tasks` first
- Step 2 uses `general-purpose` (needs Write); Steps 3a–3c use `spec-analyzer` (Read-only). All use `model: opus` for nuanced reasoning quality
- Each subagent's working memory is discarded after returning its JSON result
- `analysis-digest.json` is overwritten on each run; previous versions can be preserved via git
