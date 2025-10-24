import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import { listProjects } from '~/lib/supabase/projects'
import { createTestUser } from '../../setup'

/**
 * Contract Test: listProjects
 *
 * Verifies the listProjects function meets its contract:
 * - Returns empty array if no projects
 * - Returns user's projects ordered by sort_order
 * - Does not return other users' projects
 *
 * Prerequisites:
 * - listProjects function implemented in app/lib/supabase/projects.ts
 * - Projects table with sort_order column
 * - RLS policies configured
 */

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key'

type TestClient = ReturnType<typeof createClient<Database>>

describe('listProjects Contract', () => {
  let testUser1Client: TestClient
  let testUser2Client: TestClient
  let testUser1: { id: string, email: string } | null
  let testUser2: { id: string, email: string } | null

  beforeEach(async () => {
    const testUser1Data = await createTestUser()
    testUser1Client = testUser1Data.client
    testUser1 = testUser1Data.user

    const testUser2Data = await createTestUser()
    testUser2Client = testUser2Data.client
    testUser2 = testUser2Data.user
  })

  afterEach(async () => {
    if (testUser1Client) await testUser1Client.auth.signOut()
    if (testUser2Client) await testUser2Client.auth.signOut()
  })

  it('should return empty array if no projects exist', async () => {
    const { data, error } = await listProjects(testUser1Client)

    expect(error).toBeNull()
    expect(data).toEqual([])
  })

  it('should return user\'s projects ordered by sort_order', async () => {
    // Create projects with specific sort_order
    await testUser1Client
      .from('projects')
      .insert([
        { name: 'Project C', sort_order: 2, expected_daily_stints: 3, user_id: testUser1!.id },
        { name: 'Project A', sort_order: 0, expected_daily_stints: 3, user_id: testUser1!.id },
        { name: 'Project B', sort_order: 1, expected_daily_stints: 3, user_id: testUser1!.id },
      ])

    const { data, error } = await listProjects(testUser1Client)

    expect(error).toBeNull()
    expect(data).toHaveLength(3)
    expect(data![0].name).toBe('Project A') // sort_order 0
    expect(data![1].name).toBe('Project B') // sort_order 1
    expect(data![2].name).toBe('Project C') // sort_order 2
    expect(data![0].sort_order).toBe(0)
    expect(data![1].sort_order).toBe(1)
    expect(data![2].sort_order).toBe(2)
  })

  it('should not return other users\' projects', async () => {
    // User 1 creates projects
    await testUser1Client
      .from('projects')
      .insert([
        { name: 'User 1 Project A', sort_order: 0, expected_daily_stints: 3, user_id: testUser1!.id },
        { name: 'User 1 Project B', sort_order: 1, expected_daily_stints: 3, user_id: testUser1!.id },
      ])

    // User 2 creates projects
    await testUser2Client
      .from('projects')
      .insert([
        { name: 'User 2 Project A', sort_order: 0, expected_daily_stints: 3, user_id: testUser2!.id },
        { name: 'User 2 Project B', sort_order: 1, expected_daily_stints: 3, user_id: testUser2!.id },
      ])

    // User 1 should see only their projects
    const { data: user1Projects } = await listProjects(testUser1Client)
    expect(user1Projects).toHaveLength(2)
    expect(user1Projects![0].name).toBe('User 1 Project A')
    expect(user1Projects![1].name).toBe('User 1 Project B')

    // User 2 should see only their projects
    const { data: user2Projects } = await listProjects(testUser2Client)
    expect(user2Projects).toHaveLength(2)
    expect(user2Projects![0].name).toBe('User 2 Project A')
    expect(user2Projects![1].name).toBe('User 2 Project B')
  })

  it('should return all project fields', async () => {
    await testUser1Client
      .from('projects')
      .insert({
        name: 'Full Project',
        expected_daily_stints: 5,
        custom_stint_duration: 60,
        sort_order: 0,
        is_active: true,
        user_id: testUser1!.id,
      })

    const { data } = await listProjects(testUser1Client)

    expect(data).toHaveLength(1)
    expect(data![0]).toHaveProperty('id')
    expect(data![0]).toHaveProperty('user_id')
    expect(data![0]).toHaveProperty('name')
    expect(data![0]).toHaveProperty('expected_daily_stints')
    expect(data![0]).toHaveProperty('custom_stint_duration')
    expect(data![0]).toHaveProperty('sort_order')
    expect(data![0]).toHaveProperty('is_active')
    expect(data![0]).toHaveProperty('created_at')
    expect(data![0]).toHaveProperty('updated_at')
  })

  it('should return error if user not authenticated', async () => {
    const unauthClient = createClient<Database>(supabaseUrl, supabaseAnonKey)

    const { data, error } = await listProjects(unauthClient)

    expect(data).toBeNull()
    expect(error).toBeTruthy()
  })

  it('should return only active projects by default', async () => {
    // Create mix of active and inactive projects
    await testUser1Client
      .from('projects')
      .insert([
        { name: 'Active Project 1', is_active: true, sort_order: 0, expected_daily_stints: 3, user_id: testUser1!.id },
        { name: 'Inactive Project 1', is_active: false, sort_order: 1, expected_daily_stints: 3, user_id: testUser1!.id },
        { name: 'Active Project 2', is_active: true, sort_order: 2, expected_daily_stints: 3, user_id: testUser1!.id },
        { name: 'Inactive Project 2', is_active: false, sort_order: 3, expected_daily_stints: 3, user_id: testUser1!.id },
      ])

    const { data, error } = await listProjects(testUser1Client)

    expect(error).toBeNull()
    expect(data).toHaveLength(2)
    expect(data![0].name).toBe('Active Project 1')
    expect(data![0].is_active).toBe(true)
    expect(data![1].name).toBe('Active Project 2')
    expect(data![1].is_active).toBe(true)
  })

  it('should return all projects when includeInactive is true', async () => {
    // Create mix of active and inactive projects
    await testUser1Client
      .from('projects')
      .insert([
        { name: 'Active Project', is_active: true, sort_order: 0, expected_daily_stints: 3, user_id: testUser1!.id },
        { name: 'Inactive Project', is_active: false, sort_order: 1, expected_daily_stints: 3, user_id: testUser1!.id },
      ])

    const { data, error } = await listProjects(testUser1Client, { includeInactive: true })

    expect(error).toBeNull()
    expect(data).toHaveLength(2)
    expect(data![0].name).toBe('Active Project')
    expect(data![0].is_active).toBe(true)
    expect(data![1].name).toBe('Inactive Project')
    expect(data![1].is_active).toBe(false)
  })

  it('should return only active projects when includeInactive is false', async () => {
    // Create mix of active and inactive projects
    await testUser1Client
      .from('projects')
      .insert([
        { name: 'Active Project', is_active: true, sort_order: 0, expected_daily_stints: 3, user_id: testUser1!.id },
        { name: 'Inactive Project', is_active: false, sort_order: 1, expected_daily_stints: 3, user_id: testUser1!.id },
      ])

    const { data, error } = await listProjects(testUser1Client, { includeInactive: false })

    expect(error).toBeNull()
    expect(data).toHaveLength(1)
    expect(data![0].name).toBe('Active Project')
    expect(data![0].is_active).toBe(true)
  })

  it('should maintain sort order when filtering by active status', async () => {
    // Create projects with different sort orders and active status
    await testUser1Client
      .from('projects')
      .insert([
        { name: 'Active C', is_active: true, sort_order: 2, expected_daily_stints: 3, user_id: testUser1!.id },
        { name: 'Inactive A', is_active: false, sort_order: 0, expected_daily_stints: 3, user_id: testUser1!.id },
        { name: 'Active A', is_active: true, sort_order: 1, expected_daily_stints: 3, user_id: testUser1!.id },
        { name: 'Active B', is_active: true, sort_order: 3, expected_daily_stints: 3, user_id: testUser1!.id },
      ])

    const { data, error } = await listProjects(testUser1Client)

    expect(error).toBeNull()
    expect(data).toHaveLength(3)
    expect(data![0].name).toBe('Active A') // sort_order 1
    expect(data![1].name).toBe('Active C') // sort_order 2
    expect(data![2].name).toBe('Active B') // sort_order 3
  })
})
