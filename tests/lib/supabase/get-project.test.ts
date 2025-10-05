import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import { getProjectById, createProject } from '~/lib/supabase/projects'
import { createTestUser } from '../../setup'

/**
 * Contract Test: getProject
 *
 * Verifies the getProject function meets its contract:
 * - Returns project by ID if owned by user
 * - Returns null if project not found
 * - Returns null if project owned by different user
 *
 * Prerequisites:
 * - getProjectById function implemented in app/lib/supabase/projects.ts
 * - RLS policies configured
 */

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key'

type TestClient = ReturnType<typeof createClient<Database>>

describe('getProject Contract', () => {
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

  it('should return project by ID if owned by user', async () => {
    // Create project for user 1
    const { data: created } = await createProject(testUser1Client, {
      name: 'My Project',
      expected_daily_stints: 3,
    })

    const projectId = created!.id

    // Get project by ID
    const { data, error } = await getProjectById(testUser1Client, projectId)

    expect(error).toBeNull()
    expect(data).toBeTruthy()
    expect(data!.id).toBe(projectId)
    expect(data!.name).toBe('My Project')
    expect(data!.user_id).toBe(testUser1!.id)
  })

  it('should return null if project not found', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000'

    const { data, error } = await getProjectById(testUser1Client, nonExistentId)

    expect(error).toBeNull()
    expect(data).toBeNull()
  })

  it('should return null if project owned by different user', async () => {
    // User 2 creates a project
    const { data: user2Project } = await createProject(testUser2Client, {
      name: 'User 2 Project',
      expected_daily_stints: 3,
    })

    const user2ProjectId = user2Project!.id

    // User 1 tries to get User 2's project
    const { data, error } = await getProjectById(testUser1Client, user2ProjectId)

    // Should return null due to RLS
    expect(error).toBeNull()
    expect(data).toBeNull()
  })

  it('should return error if user not authenticated', async () => {
    const unauthClient = createClient<Database>(supabaseUrl, supabaseAnonKey)

    const { data, error } = await getProjectById(unauthClient, '00000000-0000-0000-0000-000000000000')

    expect(data).toBeNull()
    expect(error).toBeTruthy()
  })
})
