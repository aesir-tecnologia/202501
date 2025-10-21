# Feature Specification: Dashboard Project Management

**Feature Branch**: `001-create-and-manage`
**Created**: 2025-10-04
**Status**: Draft
**Input**: User description: "Create and manage projects directly from the dashboard via modals. Keeps administration frictionless and aligned with 'zero overhead.'"

## Execution Flow (main)
```
1. Parse user description from Input
   → ✅ Description provided: Dashboard project management via modals
2. Extract key concepts from description
   → Actors: Independent professionals (existing users)
   → Actions: Create, read, update, delete projects
   → Data: Project information (name, settings)
   → Constraints: Modal-based (no separate pages), frictionless UX
3. For each unclear aspect:
   → ✅ RESOLVED via clarification session
4. Fill User Scenarios & Testing section
   → ✅ User flows defined for CRUD operations
5. Generate Functional Requirements
   → ✅ Requirements defined and testable
6. Identify Key Entities (if data involved)
   → ✅ Project entity already exists
7. Run Review Checklist
   → ✅ All clarifications resolved
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## Clarifications

### Session 2025-10-04
- Q: What happens to historical stint data when a project is deleted? → A: Cascade delete - All associated stint records are permanently deleted
- Q: Can users delete projects with active stints running? → A: Block deletion - Show error message requiring user to stop stint first
- Q: Are duplicate project names allowed within a user's project list? → A: Prevent duplicates - Show validation error if project name already exists
- Q: How should projects be displayed in the dashboard list? → A: User-defined - Allow manual reordering (drag and drop)
- Q: Is there a maximum number of projects per user? → A: Soft limit of 20 - Recommend maximum of 20 projects but don't enforce technically

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As an independent professional managing multiple client projects, I want to create and manage my projects directly from the dashboard without navigating to separate pages, so I can quickly set up new projects and adjust existing ones without interrupting my workflow.

### Acceptance Scenarios

1. **Given** I am viewing my dashboard, **When** I click a "Create Project" action, **Then** a modal appears with a project creation form

2. **Given** I am in the project creation modal, **When** I enter a valid project name and settings (daily stint goal, custom duration), **Then** the project is created and appears in my project list immediately

3. **Given** I have existing projects on my dashboard, **When** I click "Edit" on a project, **Then** a modal appears pre-filled with that project's current details

4. **Given** I am in the project edit modal, **When** I update project details and save, **Then** the project list reflects the changes immediately without page refresh

5. **Given** I have a project I no longer need, **When** I click "Delete" on a project, **Then** I see a confirmation modal before the project is permanently removed

6. **Given** I have an active stint running for a project, **When** I attempt to delete that project, **Then** the system blocks deletion and displays an error message instructing me to stop the active stint first

7. **Given** I am creating or editing a project, **When** I enter a project name that already exists in my project list, **Then** the system shows an inline validation error and prevents saving

8. **Given** I have multiple projects on my dashboard, **When** I drag a project to a new position in the list, **Then** the project order is updated and persisted immediately

9. **Given** I have 20 or more projects, **When** I attempt to create a new project, **Then** the system shows a warning message recommending I review my project list but allows creation to proceed

### Edge Cases

- What happens when a user tries to create a project with a duplicate name? **Validation error is shown; save is prevented.**
- What happens when a user tries to create a project with an empty name? **Validation error is shown; save is prevented.**
- What happens when a user closes a modal without saving?
- What happens when a network error occurs during project creation/update/deletion?
- What happens to historical stint data when a project is deleted? **All stint records are permanently deleted (cascade delete).**
- What happens when a user has reached the maximum number of projects (if limit exists)? **Soft limit of 20 - warning shown but creation allowed.**
- What happens when a user tries to delete a project with an active stint? **Deletion is blocked with error message.**
- What happens when a newly created project is added to the list? **It appears at the bottom (end) of the current list.**

## Requirements *(mandatory)*

### Functional Requirements

**Project Creation**
- **FR-001**: System MUST provide a "Create Project" action visible from the dashboard
- **FR-002**: System MUST display a modal dialog when user initiates project creation
- **FR-003**: System MUST require a project name (non-empty string)
- **FR-004**: System MUST allow users to set expected daily stint goal (positive integer)
- **FR-005**: System MUST allow users to set custom stint duration in minutes (positive integer)
- **FR-006**: System MUST validate project name is not empty before allowing save
- **FR-007**: System MUST validate expected daily stints is a positive number
- **FR-008**: System MUST validate custom stint duration is a positive number
- **FR-009**: System MUST show validation errors inline on the form without closing the modal
- **FR-010**: System MUST close the modal and show the new project in the list upon successful creation
- **FR-011**: System MUST prevent creation of projects with duplicate names (case-insensitive uniqueness within user's projects)
- **FR-012**: System MUST display validation error message when user attempts to create a project with a name that already exists
- **FR-013**: System MUST add newly created projects at the end (bottom) of the current project list
- **FR-014**: System MUST show a warning message when user creates a project and already has 20 or more projects
- **FR-015**: Warning message SHOULD recommend reviewing and consolidating projects but MUST NOT block creation

**Project Viewing**
- **FR-016**: System MUST display all user's projects on the dashboard
- **FR-017**: System MUST show project name, daily stint goal, and custom duration for each project
- **FR-018**: System MUST display projects in user-defined order (manually sortable)
- **FR-019**: System MUST persist project list order across sessions

**Project Reordering**
- **FR-020**: System MUST allow users to drag and drop projects to reorder the list
- **FR-021**: System MUST update the project list order immediately when user drops a project in a new position
- **FR-022**: System MUST persist the new order to the database
- **FR-023**: System MUST provide visual feedback during drag operation (e.g., visual indicator of dragged item)

**Project Editing**
- **FR-024**: System MUST provide an "Edit" action for each project
- **FR-025**: System MUST display a modal dialog pre-filled with current project details when user initiates edit
- **FR-026**: System MUST allow users to modify project name, daily stint goal, and custom duration
- **FR-027**: System MUST apply the same validation rules as project creation (including uniqueness check)
- **FR-028**: System MUST allow user to keep current project name when editing (not treated as duplicate)
- **FR-029**: System MUST prevent renaming a project to a name that matches another existing project
- **FR-030**: System MUST update the project in the list immediately upon successful save
- **FR-031**: System MUST preserve project position in list when edited
- **FR-032**: System MUST allow users to cancel editing without saving changes

**Project Deletion**
- **FR-033**: System MUST provide a "Delete" action for each project
- **FR-034**: System MUST display a confirmation modal before deleting a project
- **FR-035**: System MUST remove the project from the database upon confirmation
- **FR-036**: System MUST remove the project from the visible list immediately after deletion
- **FR-037**: System MUST block deletion of projects with active stints and display an error message
- **FR-038**: Error message MUST instruct user to stop the active stint before deleting the project
- **FR-039**: System MUST cascade delete all associated stint records when a project is deleted (permanent data loss)
- **FR-040**: Confirmation modal MUST warn users that deleting a project will permanently delete all associated stint history

**User Experience**
- **FR-041**: System MUST close modals when user clicks outside the modal or presses Escape key
- **FR-042**: System MUST show loading indicators during save/update/delete operations
- **FR-043**: System MUST display user-friendly error messages when operations fail
- **FR-044**: System MUST update the project list optimistically (show changes immediately) while persisting to database
- **FR-045**: System MUST rollback optimistic updates if database operation fails

**Performance & Scale**
- **FR-046**: System MUST load and display projects list in under 1 second on 3G connection
- **FR-047**: System SHOULD recommend (soft limit) users maintain no more than 20 projects for optimal experience
- **FR-048**: System MUST support users with more than 20 projects without technical failure

### Key Entities *(include if feature involves data)*

- **Project**: Represents a client project or work area. Attributes include name (string, unique per user, case-insensitive), expected daily stints (integer), custom stint duration in minutes (integer), sort order (integer for user-defined positioning), user ownership (relationship to user). Projects have a one-to-many relationship with stints (historical work sessions). **Uniqueness constraint: name must be unique within a user's projects (case-insensitive). Deletion behavior: cascade delete (stints deleted when project deleted). Cannot be deleted while an active stint is running. Display order: user-defined via drag-and-drop reordering. Soft limit: 20 projects recommended but not enforced.**

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded (dashboard CRUD only, no separate pages)
- [x] Dependencies and assumptions identified (existing auth, existing database schema)

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked and resolved (5 questions answered)
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---

## Scope Summary

**In Scope:**
- Create, read, update, delete projects via dashboard modals
- User-defined project ordering via drag-and-drop
- Inline form validation with duplicate name prevention
- Optimistic UI updates with error rollback
- Active stint deletion protection
- Cascade deletion of historical stints
- Soft limit warning at 20+ projects
- Performance target: <1s load on 3G

**Out of Scope (for this feature):**
- Project archival/soft delete (only hard delete supported)
- Search/filter functionality for project list
- Project colors or visual identifiers
- Bulk project operations
- Project templates or duplication
- Project sharing or collaboration
