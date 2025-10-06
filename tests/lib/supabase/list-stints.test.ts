import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import { listStints } from '~/lib/supabase/stints'
import { createTestUser } from '../../setup'

/**
 * Contract Test: listStints
 *
 * Verifies the listStints function meets its contract:
 * - Returns empty array if no stints
 * - Returns user's stints ordered by started_at DESC
 * - Filters by projectId option
 * - Filters by activeOnly option
 * - Does not return other users' stints
 *
 * Prerequisites:
 * - listStints function implemented in app/lib/supabase/stints.ts
 * - Stints table with proper RLS policies
 * - Projects table for foreign key relationships
 */

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key'

type TestClient = ReturnType<typeof createClient<Database>>

describe('listStints Contract', () => {
  let testUser1Client: TestClient
  let testUser2Client: TestClient
  let testUser1: { id: string, email: string } | null
  let testUser2: { id: string, email: string } | null
  let project1Id: string
  let project2Id: string

  beforeEach(async () => {
    const testUser1Data = await createTestUser()
    testUser1Client = testUser1Data.client
    testUser1 = testUser1Data.user

    const testUser2Data = await createTestUser()
    testUser2Client = testUser2Data.client
    testUser2 = testUser2Data.user

    // Create test projects for user 1
    const { data: project1 } = await testUser1Client
      .from('projects')
      .insert({ name: 'Project 1', expected_daily_stints: 3, user_id: testUser1!.id })
      .select()
      .single()

    const { data: project2 } = await testUser1Client
      .from('projects')
      .insert({ name: 'Project 2', expected_daily_stints: 3, user_id: testUser1!.id })
      .select()
      .single()

    project1Id = project1!.id
    project2Id = project2!.id
  })

  afterEach(async () => {
    if (testUser1Client) await testUser1Client.auth.signOut()
    if (testUser2Client) await testUser2Client.auth.signOut()
  })

  it('should return empty array if no stints exist', async () => {
    const { data, error } = await listStints(testUser1Client)

    expect(error).toBeNull()
    expect(data).toEqual([])
  })

  it('should return user\'s stints ordered by started_at DESC', async () => {
    // Create stints with specific timestamps
    const now = new Date()
    await testUser1Client
      .from('stints')
      .insert([
        {
          project_id: project1Id,
          started_at: new Date(now.getTime() - 3600000).toISOString(), // 1 hour ago
          user_id: testUser1!.id,
        },
        {
          project_id: project1Id,
          started_at: new Date(now.getTime() - 7200000).toISOString(), // 2 hours ago
          user_id: testUser1!.id,
        },
        {
          project_id: project1Id,
          started_at: now.toISOString(), // Most recent
          user_id: testUser1!.id,
        },
      ])

    const { data, error } = await listStints(testUser1Client)

    expect(error).toBeNull()
    expect(data).toHaveLength(3)
    // Should be ordered from most recent to oldest
    expect(new Date(data![0].started_at).getTime()).toBeGreaterThan(new Date(data![1].started_at).getTime())
    expect(new Date(data![1].started_at).getTime()).toBeGreaterThan(new Date(data![2].started_at).getTime())
  })

  it('should filter by projectId option', async () => {
    // Create stints for different projects
    await testUser1Client
      .from('stints')
      .insert([
        { project_id: project1Id, started_at: new Date().toISOString(), user_id: testUser1!.id },
        { project_id: project1Id, started_at: new Date().toISOString(), user_id: testUser1!.id },
        { project_id: project2Id, started_at: new Date().toISOString(), user_id: testUser1!.id },
      ])

    const { data, error } = await listStints(testUser1Client, { projectId: project1Id })

    expect(error).toBeNull()
    expect(data).toHaveLength(2)
    expect(data![0].project_id).toBe(project1Id)
    expect(data![1].project_id).toBe(project1Id)
  })

  it('should filter by activeOnly option', async () => {
    const now = new Date()
    // Create mix of active and completed stints
    await testUser1Client
      .from('stints')
      .insert([
        {
          project_id: project1Id,
          started_at: now.toISOString(),
          ended_at: null, // Active
          is_completed: false,
          user_id: testUser1!.id,
        },
        {
          project_id: project1Id,
          started_at: new Date(now.getTime() - 3600000).toISOString(),
          ended_at: now.toISOString(), // Completed
          is_completed: true,
          user_id: testUser1!.id,
        },
        {
          project_id: project1Id,
          started_at: new Date(now.getTime() - 7200000).toISOString(),
          ended_at: new Date(now.getTime() - 5400000).toISOString(), // Completed
          is_completed: true,
          user_id: testUser1!.id,
        },
      ])

    const { data, error } = await listStints(testUser1Client, { activeOnly: true })

    expect(error).toBeNull()
    expect(data).toHaveLength(1)
    expect(data![0].is_completed).toBe(false)
    expect(data![0].ended_at).toBeNull()
  })

  it('should not return other users\' stints', async () => {
    // User 2 creates a project
    const { data: user2Project } = await testUser2Client
      .from('projects')
      .insert({ name: 'User 2 Project', expected_daily_stints: 3, user_id: testUser2!.id })
      .select()
      .single()

    // User 1 creates stints
    await testUser1Client
      .from('stints')
      .insert([
        { project_id: project1Id, started_at: new Date().toISOString(), user_id: testUser1!.id },
        { project_id: project1Id, started_at: new Date().toISOString(), user_id: testUser1!.id },
      ])

    // User 2 creates stints
    await testUser2Client
      .from('stints')
      .insert([
        { project_id: user2Project!.id, started_at: new Date().toISOString(), user_id: testUser2!.id },
      ])

    // User 1 should see only their stints
    const { data: user1Stints } = await listStints(testUser1Client)
    expect(user1Stints).toHaveLength(2)
    expect(user1Stints![0].user_id).toBe(testUser1!.id)
    expect(user1Stints![1].user_id).toBe(testUser1!.id)

    // User 2 should see only their stints
    const { data: user2Stints } = await listStints(testUser2Client)
    expect(user2Stints).toHaveLength(1)
    expect(user2Stints![0].user_id).toBe(testUser2!.id)
  })

  it('should return all stint fields', async () => {
    await testUser1Client
      .from('stints')
      .insert({
        project_id: project1Id,
        started_at: new Date().toISOString(),
        notes: 'Test notes',
        user_id: testUser1!.id,
      })

    const { data } = await listStints(testUser1Client)

    expect(data).toHaveLength(1)
    expect(data![0]).toHaveProperty('id')
    expect(data![0]).toHaveProperty('user_id')
    expect(data![0]).toHaveProperty('project_id')
    expect(data![0]).toHaveProperty('started_at')
    expect(data![0]).toHaveProperty('ended_at')
    expect(data![0]).toHaveProperty('duration_minutes')
    expect(data![0]).toHaveProperty('is_completed')
    expect(data![0]).toHaveProperty('notes')
    expect(data![0]).toHaveProperty('created_at')
    expect(data![0]).toHaveProperty('updated_at')
  })

  it('should return error if user not authenticated', async () => {
    const unauthClient = createClient<Database>(supabaseUrl, supabaseAnonKey)

    const { data, error } = await listStints(unauthClient)

    expect(data).toBeNull()
    expect(error).toBeTruthy()
  })
})
