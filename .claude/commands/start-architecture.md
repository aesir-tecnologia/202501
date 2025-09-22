# Start Architecture Command

## Purpose
Prepares project context and launches the system-architect subagent with proper input. Handles requirements discovery and mode detection automatically.

## Process

### 1. **Parse Arguments**
Check `$ARGUMENTS` for:
- **File path**: If provided, use this file as requirements source
- **#comprehensive flag**: If present, enable comprehensive mode
- **No arguments**: Fall back to directory scanning

**Argument Examples:**
```bash
start-architecture requirements.md                    # Use specific file, lightweight mode
start-architecture requirements.md #comprehensive     # Use specific file, comprehensive mode  
start-architecture #comprehensive                     # Auto-scan, comprehensive mode
start-architecture                                    # Auto-scan, lightweight mode
```

### 2. **Requirements Source Selection**

**If file provided in $ARGUMENTS:**
- Use specified file as primary requirements source
- Validate file exists and is readable
- Skip directory scanning

**If no file in $ARGUMENTS:**
- Scan directories for requirements:
    - `project-documentation/` directory
    - `docs/` directory
    - Root-level files: `README.md`, `requirements.md`, `REQUIREMENTS.txt`

### 3. **Mode Detection**
- **From $ARGUMENTS**: Check for `#comprehensive` flag
- **Never scan file contents** for mode detection - only use arguments

### 4. **Context Preparation**
Create a summary package containing:
- Requirements content (from specified file OR discovered files)
- Mode selection (from $ARGUMENTS only)
- Project constraints and technology preferences
- Current directory structure
- Any existing architecture documentation

### 5. **Subagent Invocation**
Launch system-architect with prepared context:

```
@system-architect

**PROJECT CONTEXT PREPARED:**

**Mode:** [Lightweight/Comprehensive] - [detected from arguments]
**Requirements Source:** [file path OR "auto-discovered"]

**Requirements Content:**
[Paste relevant requirements content]

**Project Constraints:**
[Any technology, timeline, or team constraints found]

**Current State:**
- Working directory: [path]
- Existing docs: [list found documentation]
- Git status: [repo status]

**INSTRUCTION:** Begin immediate architecture analysis using provided context. Skip requirements gathering - proceed directly to Phase 1 analysis.
```

### 6. **Post-Completion Validation Gates**
After subagent completes architecture analysis, run these validation checkpoints:

#### **Checkpoint 1: Requirements Clarity**
- **Question**: "Can I explain the core problem?"
- **Validation**: Verify architecture clearly addresses the original requirements
- **Action**: If unclear, request clarification or refinement from subagent

#### **Checkpoint 2: Technology Feasibility** 
- **Question**: "Can I justify each tech choice?"
- **Validation**: Ensure all technology selections have clear rationale
- **Action**: If unjustified, request detailed technology justification

#### **Checkpoint 3: Implementation Readiness**
- **Question**: "Could devs build this without questions?"
- **Validation**: Check for missing implementation details or ambiguous specifications
- **Action**: If incomplete, request additional technical specifications

#### **Final Checkpoint: Solution Completeness**
- **Question**: "Does this solve the original problem?"
- **Validation**: Confirm architecture fully addresses initial requirements
- **Action**: If gaps exist, iterate with subagent to fill missing pieces

**Validation Process:**
1. Run each checkpoint sequentially
2. Document any issues found
3. Request clarification/refinement if needed
4. Only mark complete when all checkpoints pass
5. Provide final validation summary to user

## Command Output Format

**Success with Provided File:**
```
📄 **Using Provided Requirements**

**File:** requirements.md
**Mode:** Comprehensive (#comprehensive flag detected)
**Project:** [Detected from file content]

**Launching System Architect...**

[Invoke subagent with prepared context]
```

**Success with Auto-Discovery:**
```
🔍 **Requirements Discovery Complete**

**Found:** 3 requirement documents in project-documentation/
**Mode:** Lightweight (no #comprehensive flag in arguments)
**Project:** [Detected project name]

**Launching System Architect...**

[Invoke subagent with prepared context]
```

**No Requirements Found:**
```
❌ **No Requirements Found**

**Arguments:** [none provided]
**Searched:** project-documentation/, docs/, root directory

**Next Steps:**
1. Create requirements: @product-manager
2. Or provide file: start-architecture path/to/requirements.md
3. Or specify different location: start-architecture custom-file.md
```

**File Not Found:**
```
❌ **File Not Found**

**Specified:** requirements.md
**Searched:** Current directory and common subdirectories

**Check:** File path and try again
```

## Usage Examples

```bash
# Use specific requirements file
start-architecture product-spec.md

# Use specific file with comprehensive analysis
start-architecture product-spec.md #comprehensive

# Auto-discover requirements, lightweight mode
start-architecture

# Auto-discover requirements, comprehensive mode  
start-architecture #comprehensive

# Mixed arguments (order doesn't matter)
start-architecture #comprehensive requirements.md
```
