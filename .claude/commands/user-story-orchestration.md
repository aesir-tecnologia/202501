# User Story Development Orchestration Prompt

This prompt orchestrates four sub-agents (Senior Backend Engineer, Senior Frontend Engineer, Security Analyst, and QA Test Engineer) to develop a single user story following flexible workflow patterns with validation gates.

## Quick Start

**Available Presets:**
- `full-stack` - Complete workflow (Backend → Frontend → Security → QA)
- `api-only` - Backend → Security → QA (skip Frontend)
- `ui-only` - Frontend → QA (skip Backend and Security)
- `bug-fix` - Lightweight implementation → QA validation
- `parallel` - Parallel execution where dependencies permit

## Execution Modes

### Sequential Mode (Default)
Executes phases in strict order: Backend → Frontend → Security → QA

### Parallel Mode (Optimized)
Allows concurrent execution where dependencies permit:
- **Phase 1**: Backend Development
- **Phase 2a-c (Parallel)**: Frontend Development + Security Analysis (Backend) + QA Test Planning
- **Phase 3a-c (Parallel)**: Frontend Validation + Extended Security Analysis + UI Test Planning
- **Phase 4**: Final QA Execution and Validation

## Core Instructions

**CRITICAL RULES:**
- Build ONLY ONE user story at a time
- Execute agents following chosen workflow preset and execution mode
- Each agent MUST pass validation before dependent agents can start
- Use TodoWrite tool to track progress throughout the entire workflow
- Reference product requirements from $ARGUMENTS or discover in project structure
- Adapt workflow based on project type and requirements complexity

## Workflow Presets

### Full Stack (Default)
Complete four-phase workflow for comprehensive user stories requiring backend, frontend, security, and QA validation.
- **Use Case**: New features, complex integrations, data-driven features
- **Phases**: Backend → Frontend → Security → QA

### API-Only
Backend-focused workflow for API endpoints, data processing, and server-side functionality.
- **Use Case**: REST API development, data migrations, backend services
- **Phases**: Backend → Security → QA (API Testing)

### UI-Only  
Frontend-focused workflow for UI changes, styling, and client-side functionality.
- **Use Case**: UI improvements, styling updates, client-side features
- **Phases**: Frontend → QA (UI Testing)

### Bug Fix (Lightweight)
Streamlined workflow for bug fixes and minor improvements.
- **Use Case**: Bug fixes, small improvements, hotfixes
- **Phases**: Implementation (appropriate agent) → QA Validation

### Security-Critical
Extended workflow with comprehensive security analysis for sensitive features.
- **Use Case**: Authentication, payment processing, data handling
- **Phases**: Backend → Frontend → Extended Security (Penetration Testing) → QA

### Performance-Critical
Enhanced workflow including performance testing and optimization.
- **Use Case**: High-traffic features, performance-sensitive operations
- **Phases**: Backend → Frontend → Security → QA → Performance Testing

## Workflow Selection Guide

**Choose workflow preset based on:**

| Story Type | Complexity | Recommended Preset | Execution Mode |
|------------|------------|-------------------|----------------|
| New Feature | High | Full Stack | Parallel |
| API Endpoint | Medium | API-Only | Sequential |
| UI Update | Low-Medium | UI-Only | Sequential |
| Bug Fix | Low | Bug Fix | Sequential |
| Auth/Payment | High | Security-Critical | Sequential |
| High Traffic | High | Performance-Critical | Parallel |

## Workflow Overview

### Phase 1: User Story Analysis & Setup
1. Parse user story from $ARGUMENTS or discover in project requirements
2. Load relevant design documentation and technical specifications
3. Select appropriate workflow preset based on story analysis
4. Create initial todo list with selected workflow phases
5. Extract acceptance criteria and technical requirements

### Phase 2: Agent Execution (Sequential or Parallel)
Execute agents following selected preset with validation gates:
- **Sequential**: Each agent completes before next begins
- **Parallel**: Independent agents run concurrently where dependencies permit

## Automated Validation Tools

### Backend Validation Automation
- **API Testing**: Postman/Newman, Jest/Supertest, pytest, FastAPI TestClient
- **Database Validation**: Migration validators, schema diff tools, database seeders
- **Code Quality**: ESLint, Pylint, RuboCop, SonarQube, CodeClimate
- **Performance**: Artillery, k6, Apache Bench for load testing
- **Sample Command**: `npm run test:api && npm run lint:backend`

### Frontend Validation Automation  
- **UI Testing**: Playwright, Cypress, Selenium WebDriver, Testing Library
- **Visual Regression**: Percy, Chromatic, BackstopJS, Applitools
- **Accessibility**: axe-core, WAVE, Lighthouse accessibility audits
- **Bundle Analysis**: webpack-bundle-analyzer, Bundle Analyzer
- **Sample Command**: `npm run test:ui && npm run test:a11y && npm run build:analyze`

### Security Validation Automation
- **Static Analysis (SAST)**: SonarQube, Semgrep, CodeQL, Bandit (Python), ESLint Security
- **Dependency Scanning**: npm audit, Snyk, OWASP Dependency Check, Safety (Python)
- **Secret Scanning**: TruffleHog, GitGuardian, detect-secrets
- **Dynamic Analysis**: OWASP ZAP, Burp Suite (automated scans)
- **Sample Command**: `npm audit --audit-level high && snyk test && trufflehog --regex --entropy=False .`

### QA Testing Automation
- **Unit Testing**: Jest, Vitest, pytest, JUnit, Mocha
- **Integration Testing**: Supertest, TestContainers, Spring Boot Test
- **E2E Testing**: Playwright, Cypress, Selenium Grid
- **Coverage Tools**: Istanbul, Coverage.py, JaCoCo, SimpleCov
- **Performance Testing**: Lighthouse CI, WebPageTest, k6
- **Sample Command**: `npm run test:unit && npm run test:integration && npm run test:e2e`

## Project Configuration

### Tech Stack from Documentation
The orchestration workflow will read your project's technology stack exclusively from user-provided project documentation files:
- `project-documentation/architecture-overview.md` (Technology Stack Selection section)
- `project-documentation/frontend-architecture.md` (Frontend Technology Stack section)  
- Other user-provided documentation files containing stack specifications
- Design documents and technical specifications provided by the user

## Agent Orchestration Script

I need to develop user story: [USER_STORY_ID] using [WORKFLOW_PRESET] workflow.

## Step 1: Requirements Discovery
First, I'll check for user story details using this fallback strategy:

### Priority 1: Direct Arguments
```markdown
# Check if user story passed directly
if $ARGUMENTS contains user story details:
    parse_user_story_from_arguments()
    extract_acceptance_criteria()
    identify_story_type_and_complexity()
```

### Priority 2: Project Requirements Discovery
```markdown
# Search common requirement file patterns
search_patterns = [
    "requirements.md", "product-requirements.md", "user-stories.md",
    "docs/requirements/", "docs/specs/", "specs/", "user-stories/",
    "README.md" (sections), "wiki/", ".github/ISSUE_TEMPLATE/",
    "backlog.md", "features.md", "stories/"
]

for pattern in search_patterns:
    if file_exists(pattern):
        search_for_user_story_id(pattern)
        if found:
            parse_requirements_from_file(pattern)
            break
```

### Priority 3: Interactive Discovery
```markdown
# If no requirements found automatically
if not found:
    prompt_user("Please provide:")
    - User story ID or description
    - Requirements file location
    - Inline story details
    
    # Accept formats:
    - "US-001: As a user, I want to..."
    - "/path/to/requirements.md#US-001"
    - Direct story text with acceptance criteria
```

### Requirements Parsing Logic
```markdown
# Once requirements source is identified:
parse_user_story():
    extract_story_id()
    extract_story_title()
    extract_user_persona()
    extract_acceptance_criteria()
    extract_technical_requirements()
    identify_dependencies()
    assess_story_complexity()
    recommend_workflow_preset()
```

## Step 2: Project Analysis
- Read technology stack from project documentation files
- Load relevant documentation (design specs, API docs, architecture)
- Select appropriate workflow preset based on story complexity
- Configure automation tools based on documented tech stack

## Step 3: Workflow Execution
I will follow the [WORKFLOW_PRESET] workflow:

1. **SETUP PHASE**
   - Parse user story details from discovered requirements source
   - Load relevant project documentation and architectural context
   - Create deliverables directory structure: `deliverables/[USER_STORY_ID]/`
   - Create todo list to track selected workflow phases  
   - Mark setup as in_progress

2. **BACKEND DEVELOPMENT PHASE**
   - Launch senior-backend-engineer agent
   - Provide user story, acceptance criteria, and technical architecture
   - Agent must deliver: API endpoints, database schemas, business logic
   - Agent must save deliverables to `deliverables/[USER_STORY_ID]/01-backend/`
   - Mark backend phase as completed ONLY after validation passes

3. **BACKEND VALIDATION GATE**
   - Verify API endpoints are implemented correctly
   - Check database schemas match data model requirements
   - Confirm business logic handles all edge cases from acceptance criteria
   - Run backend tests if available
   - Document validation results
   - If validation fails: retry with same agent or halt for user intervention

4. **FRONTEND DEVELOPMENT PHASE**
   - Launch senior-frontend-engineer agent
   - Provide user story, design specs, and backend API contracts
   - Agent must deliver: UI components, state management, API integration
   - Agent must save deliverables to `deliverables/[USER_STORY_ID]/02-frontend/`
   - Mark frontend phase as completed ONLY after validation passes

5. **FRONTEND VALIDATION GATE**
   - Verify UI components match design specifications
   - Check API integration works with backend endpoints
   - Confirm user experience meets acceptance criteria
   - Test responsive design and accessibility
   - Document validation results
   - If validation fails: retry with same agent or halt for user intervention

6. **SECURITY ANALYSIS PHASE**
   - Launch security-analyst agent
   - Provide complete implementation details from backend and frontend
   - Agent must deliver: Security assessment, vulnerability analysis, compliance check
   - Agent must save deliverables to `deliverables/[USER_STORY_ID]/03-security/`
   - Mark security phase as completed ONLY after validation passes

7. **SECURITY VALIDATION GATE**
   - Review security assessment findings
   - Verify no critical vulnerabilities exist
   - Check authentication and authorization implementation
   - Confirm data protection measures are in place
   - Document security validation results
   - If validation fails: retry with remediation or halt for user intervention

8. **QA TESTING PHASE**
   - Launch qa-test-automation-engineer agent
   - Provide complete implementation and all acceptance criteria
   - Agent must deliver: Test plans, automated tests, coverage reports
   - Agent must save deliverables to `deliverables/[USER_STORY_ID]/04-qa/`
   - Mark QA phase as completed ONLY after validation passes

9. **FINAL VALIDATION GATE**
   - Execute all automated tests
   - Verify end-to-end user workflow works
   - Check all acceptance criteria are satisfied
   - Confirm integration between all components
   - Generate final implementation report in `deliverables/[USER_STORY_ID]/final-report/`
   - Mark entire user story as completed

## Todo List Management

Use TodoWrite tool to maintain this structure:

```
[
  {"content": "Parse user story [ID] and load documentation", "status": "pending", "activeForm": "Parsing user story [ID] and loading documentation"},
  {"content": "Create deliverables directory structure for [ID]", "status": "pending", "activeForm": "Creating deliverables directory structure for [ID]"},
  {"content": "Execute backend development phase", "status": "pending", "activeForm": "Executing backend development phase"},
  {"content": "Validate backend implementation", "status": "pending", "activeForm": "Validating backend implementation"},
  {"content": "Execute frontend development phase", "status": "pending", "activeForm": "Executing frontend development phase"},
  {"content": "Validate frontend implementation", "status": "pending", "activeForm": "Validating frontend implementation"},
  {"content": "Execute security analysis phase", "status": "pending", "activeForm": "Executing security analysis phase"},
  {"content": "Validate security implementation", "status": "pending", "activeForm": "Validating security implementation"},
  {"content": "Execute QA testing phase", "status": "pending", "activeForm": "Executing QA testing phase"},
  {"content": "Generate final deliverables and reports", "status": "pending", "activeForm": "Generating final deliverables and reports"}
]
```

**Todo Management Rules:**
- Mark each phase as "in_progress" when starting
- Mark as "completed" ONLY after validation passes
- Never mark multiple phases as "in_progress" simultaneously
- Add sub-tasks if validation fails and remediation is needed

## Context Sharing Between Agents

### Backend Agent Context:
- User story details and acceptance criteria
- Technical architecture from architecture-overview.md
- Database schema from data-model.md
- API specifications from api-specification.md

### Frontend Agent Context:
- User story details and acceptance criteria
- Backend API contracts and endpoints (from backend agent output)
- Design specifications from @design-documentation/
- Frontend architecture from frontend-architecture.md

### Security Agent Context:
- User story details and acceptance criteria
- Complete backend implementation details
- Complete frontend implementation details
- System architecture overview

### QA Agent Context:
- User story details and acceptance criteria
- All implementation details from previous agents
- All validation results from previous phases
- Complete system architecture

## Validation Gate Criteria

### Backend Validation Checklist:
- [ ] All API endpoints respond correctly
- [ ] Database schemas created and migrations successful
- [ ] Business logic handles all acceptance criteria
- [ ] Error handling implemented properly
- [ ] Backend tests passing (if test framework exists)
- [ ] Code follows project conventions
- [ ] No security vulnerabilities in backend code

### Frontend Validation Checklist:
- [ ] UI components render correctly
- [ ] Design matches specifications
- [ ] API integration functional
- [ ] User interactions work as expected
- [ ] Responsive design implemented
- [ ] Accessibility requirements met
- [ ] Frontend tests passing (if test framework exists)
- [ ] Code follows project conventions

### Security Validation Checklist:
- [ ] No critical security vulnerabilities
- [ ] Authentication properly implemented
- [ ] Authorization controls in place
- [ ] Data validation and sanitization
- [ ] Secure communication protocols
- [ ] Sensitive data protection
- [ ] Compliance with security standards

### QA Validation Checklist:
- [ ] All acceptance criteria covered by tests
- [ ] Automated tests written and passing
- [ ] End-to-end user workflows tested
- [ ] Integration between components verified
- [ ] Performance requirements met
- [ ] Error scenarios handled gracefully
- [ ] Test coverage meets project standards

## Error Handling Procedures

### Validation Failure Response:
1. Document specific failure points
2. Create remediation todo items
3. Decide: Retry with same agent OR halt for user intervention
4. If retrying: Provide failure details to agent for focused fix
5. If halting: Request user guidance on how to proceed

### Agent Failure Response:
1. Document agent failure details
2. Mark current phase todo as "blocked"
3. Request user intervention
4. Do not proceed to next agent until issue resolved

## Example Usage

### User Input:
```
Please develop user story US-005: Start Focused Work Session
```

### Agent Response:
```
I'll develop user story US-005: "Start Focused Work Session" following our orchestration workflow.

Let me begin by setting up the workflow and creating the todo list...

[TodoWrite tool creates initial todo list]

Now parsing US-005 from the product requirements document...

[Read tool loads product-requirements.md section for US-005]

Loading relevant design documentation...

[Read tool loads stint-management design docs]

Launching senior-backend-engineer agent for backend implementation...

[Task tool with senior-backend-engineer agent]

Backend agent has completed implementation. Now validating...

[Validation checks against backend criteria]

Backend validation passed! Moving to frontend phase...

[Process continues through all phases]
```

## Technology Stack Context

Ensure all agents are aware of the documented project tech stack:
- **Frontend**: [FROM PROJECT DOCUMENTATION]
- **Backend**: [FROM PROJECT DOCUMENTATION]  
- **Database**: [FROM PROJECT DOCUMENTATION]
- **State Management**: [FROM PROJECT DOCUMENTATION]
- **Styling**: [FROM PROJECT DOCUMENTATION]
- **Testing**: [FROM PROJECT DOCUMENTATION]
- **Architecture**: [FROM PROJECT DOCUMENTATION]

**Stack will be read from project documentation files provided by the user.**

## Deliverables Organization Structure

### Directory Structure Setup

Each user story's deliverables will be organized in a dedicated directory structure:

```
deliverables/
└── [USER_STORY_ID]/
    ├── 01-backend/
    │   ├── implementation-summary.md
    │   ├── api-contracts.json
    │   ├── database-schemas.sql
    │   ├── code-changes.md
    │   └── validation-results.md
    ├── 02-frontend/
    │   ├── implementation-summary.md
    │   ├── components-created.md
    │   ├── ui-integration.md
    │   ├── code-changes.md
    │   └── validation-results.md
    ├── 03-security/
    │   ├── security-assessment.md
    │   ├── vulnerability-report.md
    │   ├── compliance-checklist.md
    │   └── remediation-plan.md
    ├── 04-qa/
    │   ├── test-plan.md
    │   ├── test-results.md
    │   ├── coverage-report.html
    │   └── automated-tests.md
    └── final-report/
        ├── implementation-summary.md
        ├── deployment-checklist.md
        ├── documentation-updates.md
        └── integration-verification.md
```

### Agent Output Requirements

Each agent must create their deliverables in their designated subdirectory:

#### Backend Agent Deliverables (`01-backend/`):
- **implementation-summary.md**: Overview of backend implementation
- **api-contracts.json**: Complete API endpoint specifications
- **database-schemas.sql**: All database schema changes and migrations
- **code-changes.md**: List of all files created/modified with descriptions
- **validation-results.md**: Results of backend validation checks

#### Frontend Agent Deliverables (`02-frontend/`):
- **implementation-summary.md**: Overview of frontend implementation
- **components-created.md**: List of UI components and their purposes
- **ui-integration.md**: How UI integrates with backend APIs
- **code-changes.md**: List of all files created/modified with descriptions
- **validation-results.md**: Results of frontend validation checks

#### Security Agent Deliverables (`03-security/`):
- **security-assessment.md**: Complete security analysis report
- **vulnerability-report.md**: Any vulnerabilities found and their severity
- **compliance-checklist.md**: Security compliance verification results
- **remediation-plan.md**: Required security improvements (if any)

#### QA Agent Deliverables (`04-qa/`):
- **test-plan.md**: Comprehensive testing strategy and coverage
- **test-results.md**: All test execution results and outcomes
- **coverage-report.html**: Test coverage metrics and reports
- **automated-tests.md**: List of automated tests created

### Deliverables Creation Process

1. **Setup Phase**: Create directory structure for the user story
2. **Each Agent Phase**: Agent saves outputs to their designated subdirectory
3. **Final Report Phase**: Consolidate all deliverables into final report

## Final Deliverables

Upon completion of all phases, the following structured deliverables will be available in `deliverables/[USER_STORY_ID]/final-report/`:

### Consolidated Reports:
1. **implementation-summary.md**: Complete overview of all implementation phases
2. **deployment-checklist.md**: Step-by-step deployment verification and requirements
3. **documentation-updates.md**: Required documentation changes and additions
4. **integration-verification.md**: End-to-end integration test results and validation

### Phase-Specific Deliverables:
- **Backend deliverables** in `01-backend/` subdirectory
- **Frontend deliverables** in `02-frontend/` subdirectory  
- **Security deliverables** in `03-security/` subdirectory
- **QA deliverables** in `04-qa/` subdirectory

### Access Instructions:
All deliverables for user story [USER_STORY_ID] can be found in:
```
deliverables/[USER_STORY_ID]/
```

Each subdirectory contains phase-specific documentation and artifacts, with the `final-report/` directory containing consolidated summaries and deployment-ready documentation.

---

**Remember:** This workflow is designed to ensure systematic, validated development of each user story with proper quality gates and progress tracking.
```

## Additional Workflow Enhancements

### Rollback Procedures
When major issues are discovered during validation:

1. **Issue Assessment**: Determine severity and impact scope
2. **Rollback Decision**: Choose appropriate rollback level:
   - **Code Rollback**: Revert specific changes while keeping structure
   - **Phase Rollback**: Return to previous phase and re-execute
   - **Full Rollback**: Start workflow from beginning with lessons learned
3. **Root Cause Analysis**: Document what caused the issue
4. **Prevention Measures**: Update validation criteria to prevent recurrence
5. **Re-execution**: Apply lessons learned in retry attempt

### Metrics and Optimization
Track these metrics to optimize workflow efficiency:

- **Phase Completion Times**: Identify bottlenecks
- **Validation Failure Rates**: Improve validation criteria
- **Parallel vs Sequential Performance**: Choose optimal execution mode
- **Automation Success Rates**: Identify manual validation needs
- **Defect Escape Rates**: Measure quality gate effectiveness

### Integration with Project Management
Optional integrations for enhanced project tracking:

- **Jira Integration**: Auto-update story status and log progress
- **GitHub Issues**: Link deliverables to issue comments
- **Slack Notifications**: Alert team of phase completions
- **Time Tracking**: Record actual vs estimated effort per phase

## Quick Start Command

### Basic Usage
```bash
# Full workflow using documented tech stack
Please develop user story [USER_STORY_ID] using the orchestration workflow.

# Specific workflow preset
Please develop user story [USER_STORY_ID] using the [api-only] orchestration workflow.

# With parallel execution
Please develop user story [USER_STORY_ID] using the [full-stack] orchestration workflow in [parallel] mode.

# With inline requirements
Please develop user story "As a user, I want to reset my password so I can regain access to my account" using the [security-critical] workflow.
```

### Advanced Usage
```bash
# Custom workflow configuration
Please develop user story [USER_STORY_ID] with:
- Workflow: [security-critical]
- Execution: [parallel]
- Automation: [enabled]
- Stack: [MERN]

# With specific requirements file
Please develop user story [USER_STORY_ID] from requirements file [./docs/user-stories.md] using [full-stack] workflow.
```

The assistant will automatically follow all phases, validation gates, and progress tracking requirements based on the chosen configuration.
