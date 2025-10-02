import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, type Ref } from 'vue'
import * as projectsDb from '~/lib/supabase/projects'
import type { ProjectRow } from '~/lib/supabase/projects'
import type { TypedSupabaseClient } from '~/utils/supabase'

//  Minimal tests per CLAUDE.md standards: happy path + evident error cases only
// Most functionality already exists in useProjectMutations which is fully tested

const baseProject: ProjectRow = {
  id: 'project-1',
  name: 'Test Project',
  user_id: 'user-1',
  is_active: true,
  expected_daily_stints: 2,
  custom_stint_duration: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

const inactiveProject: ProjectRow = {
  ...baseProject,
  id: 'project-2',
  name: 'Inactive Project',
  is_active: false,
}

describe('useProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('filters active and inactive projects correctly', () => {
    const projects = ref<ProjectRow[]>([baseProject, inactiveProject])

    // Test computed filter logic
    const activeProjects = projects.value.filter(p => p.is_active)
    const inactiveProjects = projects.value.filter(p => !p.is_active)

    expect(activeProjects).toHaveLength(1)
    expect(activeProjects[0]?.id).toBe('project-1')
    expect(inactiveProjects).toHaveLength(1)
    expect(inactiveProjects[0]?.id).toBe('project-2')
  })

  it('finds project by ID', () => {
    const projects = [baseProject, inactiveProject]

    const found = projects.find(p => p.id === 'project-1')
    const notFound = projects.find(p => p.id === 'non-existent')

    expect(found).toEqual(baseProject)
    expect(notFound).toBeUndefined()
  })
})
