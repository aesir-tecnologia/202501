import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { createClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import { createProject, updateProject } from '~/lib/supabase/projects'
import { createTestUser } from '../../setup'

/**
 * Contract Test: updateProject
 *
 * Verifies the updateProject function meets its contract:
 * - Updates project fields successfully
 * - Throws error on duplicate name (case-insensitive)
 * - Throws error if project not owned by user
 * - Allows updating to same name (not treated as duplicate)
 */

const _supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321'
const _supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key'

type TestClient = ReturnType<typeof createClient<Database>>

describe('updateProject Contract', () => {
  let testUser1Client: TestClient
  let testUser2Client: TestClient
  let _testUser1: { id: string, email: string } | null

  beforeEach(async () => {
    const testUser1Data = await createTestUser()
    testUser1Client = testUser1Data.client
    _testUser1 = testUser1Data.user

    const testUser2Data = await createTestUser()
    testUser2Client = testUser2Data.client
  })

  afterEach(async () => {
    if (testUser1Client) await testUser1Client.auth.signOut()
    if (testUser2Client) await testUser2Client.auth.signOut()
  })

  it('should update project fields successfully', async () => {
    const { data: project } = await createProject(testUser1Client, {
      name: 'Original Name',
    })

    const { data, error } = await updateProject(testUser1Client, project!.id, {
      name: 'Updated Name',
      expected_daily_stints: 5,
    })

    expect(error).toBeNull()
    expect(data!.name).toBe('Updated Name')
    expect(data!.expected_daily_stints).toBe(5)
  })

  it('should throw error on duplicate name', async () => {
    await createProject(testUser1Client, { name: 'Project A' })
    const { data: projectB } = await createProject(testUser1Client, { name: 'Project B' })

    const { error } = await updateProject(testUser1Client, projectB!.id, {
      name: 'Project A',
    })

    expect(error).toBeTruthy()
    expect(error?.code).toBe('23505')
  })

  it('should allow updating to same name', async () => {
    const { data: project } = await createProject(testUser1Client, {
      name: 'Same Name',
    })

    const { data, error } = await updateProject(testUser1Client, project!.id, {
      name: 'Same Name',
      expected_daily_stints: 5,
    })

    expect(error).toBeNull()
    expect(data!.name).toBe('Same Name')
    expect(data!.expected_daily_stints).toBe(5)
  })

  it('should throw error if project not owned by user', async () => {
    const { data: user2Project } = await createProject(testUser2Client, {
      name: 'User 2 Project',
    })

    const { error } = await updateProject(testUser1Client, user2Project!.id, {
      name: 'Hacked Name',
    })

    expect(error).toBeTruthy()
  })
})
