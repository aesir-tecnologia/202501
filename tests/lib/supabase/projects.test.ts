import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  listProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  type ProjectRow,
} from '~/lib/supabase/projects'
import type { TypedSupabaseClient } from '~/utils/supabase'

const userId = 'user-123'

const baseProject: ProjectRow = {
  id: 'project-1',
  name: 'Focus',
  user_id: userId,
  created_at: null,
  updated_at: null,
  is_active: true,
  custom_stint_duration: null,
  expected_daily_stints: null,
}

type Builder = ReturnType<typeof createQueryBuilder>
function createQueryBuilder() {
  const builder: Record<string, unknown> = {}

  builder.select = vi.fn().mockReturnValue(builder)
  builder.eq = vi.fn().mockReturnValue(builder)
  builder.order = vi.fn().mockReturnValue(builder)
  builder.insert = vi.fn().mockReturnValue(builder)
  builder.update = vi.fn().mockReturnValue(builder)
  builder.delete = vi.fn().mockReturnValue(builder)
  builder.single = vi.fn()
  builder.maybeSingle = vi.fn()
  builder.is = vi.fn().mockReturnValue(builder)
  builder.then = vi.fn()

  return builder
}

function createClient(builder: Builder, userResponse = { data: { user: { id: userId } }, error: null }) {
  const authGetUser = vi.fn().mockResolvedValue(userResponse)
  const from = vi.fn().mockReturnValue(builder)

  const client = {
    auth: { getUser: authGetUser },
    from,
  } as unknown as TypedSupabaseClient

  return { client, authGetUser, from }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('projects data helpers', () => {
  it('lists projects scoped to the authenticated user', async () => {
    const builder = createQueryBuilder()
    builder.then.mockImplementation(resolve => resolve({ data: [baseProject], error: null }))

    const { client, authGetUser, from } = createClient(builder)
    const { data, error } = await listProjects(client)

    expect(authGetUser).toHaveBeenCalled()
    expect(from).toHaveBeenCalledWith('projects')
    expect(builder.eq).toHaveBeenCalledWith('user_id', userId)
    expect(builder.then).toHaveBeenCalled()
    expect(error).toBeNull()
    expect(data).toEqual([baseProject])
  })

  it('fetches a project by id when it belongs to the user', async () => {
    const builder = createQueryBuilder()
    builder.maybeSingle.mockResolvedValue({ data: baseProject, error: null })

    const { client } = createClient(builder)
    const { data, error } = await getProjectById(client, baseProject.id)

    expect(builder.eq).toHaveBeenNthCalledWith(1, 'user_id', userId)
    expect(builder.eq).toHaveBeenNthCalledWith(2, 'id', baseProject.id)
    expect(error).toBeNull()
    expect(data).toEqual(baseProject)
  })

  it('creates a project with the current user id injected', async () => {
    const builder = createQueryBuilder()
    builder.single.mockResolvedValue({ data: baseProject, error: null })

    const { client } = createClient(builder)
    const { data, error } = await createProject(client, {
      name: 'Focus',
      is_active: true,
      custom_stint_duration: null,
      expected_daily_stints: null,
      created_at: null,
      updated_at: null,
      id: baseProject.id,
    })

    expect(builder.insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: userId }))
    expect(error).toBeNull()
    expect(data).toEqual(baseProject)
  })

  it('updates a project scoped by user id and project id', async () => {
    const builder = createQueryBuilder()
    const updatedProject = { ...baseProject, name: 'Updated' }
    builder.single.mockResolvedValue({ data: updatedProject, error: null })

    const { client } = createClient(builder)
    const { data, error } = await updateProject(client, baseProject.id, { name: 'Updated' })

    expect(builder.update).toHaveBeenCalledWith({ name: 'Updated' })
    expect(builder.eq).toHaveBeenNthCalledWith(1, 'user_id', userId)
    expect(builder.eq).toHaveBeenNthCalledWith(2, 'id', baseProject.id)
    expect(error).toBeNull()
    expect(data).toEqual(updatedProject)
  })

  it('deletes a project if it belongs to the user', async () => {
    const builder = createQueryBuilder()
    builder.maybeSingle.mockResolvedValue({ data: baseProject, error: null })

    const { client } = createClient(builder)
    const { data, error } = await deleteProject(client, baseProject.id)

    expect(builder.delete).toHaveBeenCalled()
    expect(builder.eq).toHaveBeenNthCalledWith(1, 'user_id', userId)
    expect(builder.eq).toHaveBeenNthCalledWith(2, 'id', baseProject.id)
    expect(error).toBeNull()
    expect(data).toEqual(baseProject)
  })

  it('returns an error response when no user session is available', async () => {
    const builder = createQueryBuilder()
    builder.then.mockImplementation(resolve => resolve({ data: [baseProject], error: null }))

    const { client } = createClient(builder, { data: { user: null }, error: null })

    await expect(listProjects(client)).rejects.toThrow(/authenticated/i)
  })
})
