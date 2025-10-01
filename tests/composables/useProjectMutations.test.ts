import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useProjectMutations } from '~/composables/useProjectMutations'
import * as projectsDb from '~/lib/supabase/projects'
import type { ProjectRow } from '~/lib/supabase/projects'
import type { TypedSupabaseClient } from '~/utils/supabase'
import { ref, type Ref } from 'vue'

const mockClient = {} as TypedSupabaseClient

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

describe('useProjectMutations', () => {
  let mockProjects: Ref<ProjectRow[]>

  beforeEach(() => {
    vi.clearAllMocks()
    mockProjects = ref([])
  })

  describe('createProject', () => {
    it('creates project with optimistic update and replaces with server data', async () => {
      const { createProject } = useProjectMutations(mockClient, mockProjects)

      vi.spyOn(projectsDb, 'createProject').mockResolvedValue({
        data: baseProject,
        error: null,
      })

      const result = await createProject({ name: 'Test Project' })

      expect(result.data).toEqual(baseProject)
      expect(result.error).toBeNull()
      expect(mockProjects.value).toHaveLength(1)
      expect(mockProjects.value[0]).toEqual(baseProject)
    })

    it('rolls back optimistic update on database error', async () => {
      const { createProject } = useProjectMutations(mockClient, mockProjects)

      vi.spyOn(projectsDb, 'createProject').mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      })

      const result = await createProject({ name: 'Test Project' })

      expect(result.data).toBeNull()
      expect(result.error).toBeInstanceOf(Error)
      expect(mockProjects.value).toHaveLength(0)
    })

    it('returns validation error for invalid input', async () => {
      const { createProject } = useProjectMutations(mockClient, mockProjects)

      const result = await createProject({ name: 'A' })

      expect(result.data).toBeNull()
      expect(result.error?.message).toContain('at least 2 characters')
      expect(mockProjects.value).toHaveLength(0)
    })
  })

  describe('updateProject', () => {
    beforeEach(() => {
      mockProjects.value = [baseProject]
    })

    it('updates project with optimistic update and replaces with server data', async () => {
      const { updateProject } = useProjectMutations(mockClient, mockProjects)
      const updated = { ...baseProject, name: 'Updated' }

      vi.spyOn(projectsDb, 'updateProject').mockResolvedValue({
        data: updated,
        error: null,
      })

      const result = await updateProject(baseProject.id, { name: 'Updated' })

      expect(result.data).toEqual(updated)
      expect(result.error).toBeNull()
      expect(mockProjects.value[0]?.name).toBe('Updated')
    })

    it('rolls back optimistic update on database error', async () => {
      const { updateProject } = useProjectMutations(mockClient, mockProjects)

      vi.spyOn(projectsDb, 'updateProject').mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      })

      const result = await updateProject(baseProject.id, { name: 'Updated' })

      expect(result.data).toBeNull()
      expect(result.error).toBeInstanceOf(Error)
      expect(mockProjects.value[0]?.name).toBe('Test Project')
    })

    it('returns error when project not found', async () => {
      const { updateProject } = useProjectMutations(mockClient, mockProjects)

      const result = await updateProject('non-existent', { name: 'Updated' })

      expect(result.data).toBeNull()
      expect(result.error?.message).toContain('not found')
    })
  })

  describe('toggleActive', () => {
    beforeEach(() => {
      mockProjects.value = [baseProject]
    })

    it('toggles project active status', async () => {
      const { toggleActive } = useProjectMutations(mockClient, mockProjects)
      const updated = { ...baseProject, is_active: false }

      vi.spyOn(projectsDb, 'updateProject').mockResolvedValue({
        data: updated,
        error: null,
      })

      const result = await toggleActive(baseProject.id)

      expect(result.data).toEqual(updated)
      expect(result.error).toBeNull()
      expect(mockProjects.value[0]?.is_active).toBe(false)
    })
  })

  describe('deleteProject', () => {
    beforeEach(() => {
      mockProjects.value = [baseProject]
    })

    it('deletes project with optimistic update', async () => {
      const { deleteProject } = useProjectMutations(mockClient, mockProjects)

      vi.spyOn(projectsDb, 'deleteProject').mockResolvedValue({
        data: baseProject,
        error: null,
      })

      const result = await deleteProject(baseProject.id)

      expect(result.data).toEqual(baseProject)
      expect(result.error).toBeNull()
      expect(mockProjects.value).toHaveLength(0)
    })

    it('rolls back optimistic update on database error', async () => {
      const { deleteProject } = useProjectMutations(mockClient, mockProjects)

      vi.spyOn(projectsDb, 'deleteProject').mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      })

      const result = await deleteProject(baseProject.id)

      expect(result.data).toBeNull()
      expect(result.error).toBeInstanceOf(Error)
      expect(mockProjects.value).toHaveLength(1)
      expect(mockProjects.value[0]).toEqual(baseProject)
    })
  })
})
