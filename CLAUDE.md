# Claude Code Instructions

## Implementation Standards

### Minimal Implementation Principle
- Implement **only** what's required to meet acceptance criteria
- No speculative features or "nice-to-haves"
- No premature optimization or over-engineering
- Use the simplest solution that works

### Testing Requirements
- **Happy path only** plus most evident error cases
- Focus on core functionality verification
- Skip edge cases unless explicitly in acceptance criteria
- No exhaustive test coverage unless specified

### Code Coverage Philosophy
- Quality over quantity
- Tests should validate requirements, not achieve coverage metrics
- One clear test per acceptance criterion
- Add error handling tests only for obvious failure modes (null checks, type errors, network failures)

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md

You MUST use the local `npx task-master` command when running the Task Master AI.
