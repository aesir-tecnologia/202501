---
description: Create or update the project constitution from interactive or provided principle inputs, ensuring all dependent templates stay in sync
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

You are updating the project constitution at `.specify/memory/constitution.md`. This file is a TEMPLATE containing placeholder tokens in square brackets (e.g. `[PROJECT_NAME]`, `[PRINCIPLE_1_NAME]`). Your job is to (a) collect/derive concrete values, (b) fill the template precisely, and (c) propagate any amendments across dependent artifacts.

Follow this execution flow:

1. Load the existing constitution template at `.specify/memory/constitution.md`.
   - Identify every placeholder token of the form `[ALL_CAPS_IDENTIFIER]`.
   **IMPORTANT**: The user might require less or more principles than the ones used in the template. If a number is specified, respect that - follow the general template. You will update the doc accordingly.

2. Collect/derive values for placeholders:
   - If user input (conversation) supplies a value, use it.
   - Otherwise infer from existing repo context (README, docs, prior constitution versions if embedded).
   - For governance dates: `RATIFICATION_DATE` is the original adoption date (if unknown ask or mark TODO), `LAST_AMENDED_DATE` is today if changes are made, otherwise keep previous.
   - `CONSTITUTION_VERSION` must increment according to semantic versioning rules:
     - MAJOR: Backward incompatible governance/principle removals or redefinitions.
     - MINOR: New principle/section added or materially expanded guidance.
     - PATCH: Clarifications, wording, typo fixes, non-semantic refinements.
   - If version bump type ambiguous, propose reasoning before finalizing.

3. Draft the updated constitution content:
   - Replace every placeholder with concrete text (no bracketed tokens left except intentionally retained template slots that the project has chosen not to define yet—explicitly justify any left).
   - Preserve heading hierarchy and comments can be removed once replaced unless they still add clarifying guidance.
   - Ensure each Principle section: succinct name line, paragraph (or bullet list) capturing non‑negotiable rules, explicit rationale if not obvious.
   - Ensure Governance section lists amendment procedure, versioning policy, and compliance review expectations.

4. Consistency propagation via subagent delegation:

   **RECOMMENDED APPROACH:** Use the Task tool with `subagent_type: "general-purpose"` to analyze all files in parallel. This saves ~30k tokens and executes 3-5x faster than reading files directly.

   Invoke the Task tool with this prompt structure:

   ```
   Analyze cross-file consistency between the updated constitution principles
   and existing project artifacts.

   CONSTITUTION PRINCIPLES TO CHECK:
   [Insert the finalized principles from step 3 draft here]

   FILES TO ANALYZE (read all in parallel):
   - .specify/templates/plan-template.md
   - .specify/templates/spec-template.md
   - .specify/templates/tasks-template.md
   - All files matching .specify/templates/commands/*.md
   - README.md
   - docs/quickstart.md (if exists)
   - Any other agent-specific guidance files found

   ANALYSIS TASKS:
   1. Identify outdated references to old principle names/requirements
   2. Find missing sections that new principles require
   3. Detect contradictions with updated governance rules
   4. Flag agent-specific names (e.g., "CLAUDE only") where generic guidance needed
   5. Note any "Constitution Check" sections that need alignment

   RETURN FORMAT:
   Provide a structured report with this format for each file:
   {
     "file_path": {
       "status": "✅ aligned" | "⚠ needs update",
       "issues": ["specific issue description", ...],
       "suggested_changes": ["specific change needed", ...]
     }
   }
   ```

   - Wait for the subagent to return the structured consistency report.
   - Parse the report and update all files flagged with "⚠ needs update" status.
   - Apply suggested changes or make appropriate updates based on identified issues.

   **FALLBACK APPROACH:** If Task tool unavailable, read files directly:
   - Read `.specify/templates/plan-template.md` and ensure any "Constitution Check" or rules align with updated principles.
   - Read `.specify/templates/spec-template.md` for scope/requirements alignment—update if constitution adds/removes mandatory sections or constraints.
   - Read `.specify/templates/tasks-template.md` and ensure task categorization reflects new or removed principle-driven task types.
   - Read each command file in `.specify/templates/commands/*.md` to verify no outdated references remain.
   - Read any runtime guidance docs and update references to principles changed.

5. Produce a Sync Impact Report (prepend as an HTML comment at top of the constitution file after update):
   - Version change: old → new
   - List of modified principles (old title → new title if renamed)
   - Added sections
   - Removed sections
   - Templates requiring updates (✅ updated / ⚠ pending) with file paths
   - Follow-up TODOs if any placeholders intentionally deferred.

6. Validation before final output:
   - No remaining unexplained bracket tokens.
   - Version line matches report.
   - Dates ISO format YYYY-MM-DD.
   - Principles are declarative, testable, and free of vague language ("should" → replace with MUST/SHOULD rationale where appropriate).
   - Subagent consistency report was generated and all "⚠ needs update" flagged files have been addressed.

7. Write the completed constitution back to `.specify/memory/constitution.md` (overwrite).

8. Output a final summary to the user with:
   - New version and bump rationale.
   - Any files flagged for manual follow-up.
   - Suggested commit message (e.g., `docs: amend constitution to vX.Y.Z (principle additions + governance update)`).

## Subagent Usage

When executing step 4 (consistency propagation), you **MUST** use the Task tool with the general-purpose subagent unless it is unavailable:

- **subagent_type**: `"general-purpose"`
- **description**: `"Check constitution consistency"`
- **prompt**: Must include:
  1. The finalized constitution principles from step 3
  2. Complete list of files to analyze
  3. Specific analysis tasks (outdated references, missing sections, contradictions, etc.)
  4. Clear structured return format specification

**Benefits:**
- Reads 10+ files in parallel, reducing execution time by 3-5x
- Saves ~30k tokens in main conversation context
- Provides structured, comprehensive consistency analysis

**Execution Flow:**
1. Main conversation completes steps 1-3 (load, collect values, draft constitution)
2. Main conversation invokes Task tool with general-purpose subagent
3. Subagent reads all template/doc files in parallel and analyzes
4. Subagent returns structured consistency report
5. Main conversation processes report and updates flagged files
6. Main conversation continues with steps 5-8 (sync report, validation, write, summary)

**Important:** Do NOT attempt to read all template/docs files directly in the main conversation during step 4. Always delegate file analysis to the general-purpose subagent unless the Task tool is unavailable, in which case use the fallback approach.

Formatting & Style Requirements:

- Use Markdown headings exactly as in the template (do not demote/promote levels).
- Wrap long rationale lines to keep readability (<100 chars ideally) but do not hard enforce with awkward breaks.
- Keep a single blank line between sections.
- Avoid trailing whitespace.

If the user supplies partial updates (e.g., only one principle revision), still perform validation and version decision steps.

If critical info missing (e.g., ratification date truly unknown), insert `TODO(<FIELD_NAME>): explanation` and include in the Sync Impact Report under deferred items.

Do not create a new template; always operate on the existing `.specify/memory/constitution.md` file.
