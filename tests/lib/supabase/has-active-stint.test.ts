import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import { createProject, hasActiveStint } from '~/lib/supabase/projects'
import { createTestUser } from '../../setup'

/**
 * Contract Test: hasActiveStint
 *
 * Verifies the hasActiveStint function meets its contract:
 * - Returns true if active stint exists (ended_at IS NULL)
 * - Returns false if no stints exist
 * - Returns false if only completed stints exist
 */

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key'

type TestClient = ReturnType<typeof createClient<Database>>

describe('hasActiveStint Contract', () => {
  let testUserClient: TestClient
  let testUser: { id: string, email: string } | null

  beforeEach(async () => {
    const testUserData = await createTestUser()
    testUserClient = testUserData.client
    testUser = testUserData.user
  })

  afterEach(async () => {
    if (testUserClient) await testUserClient.auth.signOut()
  })

  it('should return true if active stint exists', async () => {
    const { data: project } = await createProject(testUserClient, {
      name: 'Project with Active Stint',
    })

    // Create active stint
    await testUserClient
      .from('stints')
      .insert({
        project_id: project!.id,
        user_id: testUser!.id,
        started_at: new Date().toISOString(),
        ended_at: null, // Active
      })

    const { data: result, error } = await hasActiveStint(testUserClient, project!.id)

    expect(error).toBeNull()
    expect(result).toBe(true)
  })

  it('should return false if no stints exist', async () => {
    const { data: project } = await createProject(testUserClient, {
      name: 'Project without Stints',
    })

    const { data: result, error } = await hasActiveStint(testUserClient, project!.id)

    expect(error).toBeNull()
    expect(result).toBe(false)
  })

  it('should return false if only completed stints exist', async () => {
    const { data: project } = await createProject(testUserClient, {
      name: 'Project with Completed Stints',
    })

    // Create completed stints
    await testUserClient
      .from('stints')
      .insert([
        {
          project_id: project!.id,
          user_id: testUser!.id,
          started_at: new Date(Date.now() - 3600000).toISOString(),
          ended_at: new Date().toISOString(),
        },
        {
          project_id: project!.id,
          user_id: testUser!.id,
          started_at: new Date(Date.now() - 7200000).toISOString(),
          ended_at: new Date(Date.now() - 5400000).toISOString(),
        },
      ])

    const { data: result, error } = await hasActiveStint(testUserClient, project!.id)

    expect(error).toBeNull()
    expect(result).toBe(false)
  })
})
