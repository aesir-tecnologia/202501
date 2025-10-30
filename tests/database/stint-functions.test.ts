import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { createClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import { createTestUser } from '../setup'

/**
 * Database Function Tests for Stint Management
 *
 * Tests PostgreSQL functions:
 * - get_active_stint(user_id)
 * - validate_stint_start(user_id, project_id, version)
 * - complete_stint(stint_id, completion_type, notes)
 * - pause_stint(stint_id)
 * - resume_stint(stint_id)
 * - calculate_actual_duration(started_at, ended_at, paused_duration)
 *
 * Prerequisites:
 * - Database migration 20251029223752_stint_management_core.sql applied
 */

const _supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321'
const _supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key'

type TestClient = ReturnType<typeof createClient<Database>>

describe('Stint Database Functions', () => {
  let testUserClient: TestClient
  let testProjectId: string
  let _testUser: { id: string, email: string } | null

  beforeEach(async () => {
    const testUserData = await createTestUser()
    testUserClient = testUserData.client
    _testUser = testUserData.user

    // Create a test project
    const { data: project, error: projectError } = await testUserClient
      .from('projects')
      .insert({
        name: 'Test Project',
        expected_daily_stints: 2,
        custom_stint_duration: 50,
      })
      .select()
      .single()

    if (projectError || !project) {
      throw new Error(`Failed to create test project: ${projectError?.message}`)
    }

    testProjectId = project.id
  })

  afterEach(async () => {
    if (testUserClient) {
      await testUserClient.auth.signOut()
    }
  })

  describe('get_active_stint', () => {
    it('should return null when no active stint exists', async () => {
      const { data, error } = await testUserClient.rpc('get_active_stint', {
        p_user_id: _testUser!.id,
      })

      expect(error).toBeNull()
      expect(data).toBeNull()
    })

    it('should return active stint when one exists', async () => {
      // Create active stint
      const { data: stint, error: createError } = await testUserClient
        .from('stints')
        .insert({
          project_id: testProjectId,
          planned_duration: 50,
          status: 'active',
        })
        .select()
        .single()

      expect(createError).toBeNull()
      expect(stint).toBeTruthy()

      // Query active stint via function
      const { data, error } = await testUserClient.rpc('get_active_stint', {
        p_user_id: _testUser!.id,
      })

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBe(1)
      expect(data[0].id).toBe(stint!.id)
      expect(data[0].status).toBe('active')
    })

    it('should return paused stint when one exists', async () => {
      // Create paused stint
      const { data: stint, error: createError } = await testUserClient
        .from('stints')
        .insert({
          project_id: testProjectId,
          planned_duration: 50,
          status: 'paused',
        })
        .select()
        .single()

      expect(createError).toBeNull()
      expect(stint).toBeTruthy()

      // Query active stint via function (should return paused)
      const { data, error } = await testUserClient.rpc('get_active_stint', {
        p_user_id: _testUser!.id,
      })

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBe(1)
      expect(data[0].id).toBe(stint!.id)
      expect(data[0].status).toBe('paused')
    })

    it('should not return completed stints', async () => {
      const now = new Date()
      const later = new Date(now.getTime() + 3600000)

      // Create completed stint
      const { data: stint, error: createError } = await testUserClient
        .from('stints')
        .insert({
          project_id: testProjectId,
          planned_duration: 50,
          status: 'completed',
          started_at: now.toISOString(),
          ended_at: later.toISOString(),
        })
        .select()
        .single()

      expect(createError).toBeNull()
      expect(stint).toBeTruthy()

      // Query active stint via function (should return null)
      const { data, error } = await testUserClient.rpc('get_active_stint', {
        p_user_id: _testUser!.id,
      })

      expect(error).toBeNull()
      expect(data).toBeNull()
    })
  })

  describe('validate_stint_start', () => {
    it('should allow starting when no active stint exists', async () => {
      // Get user version
      const { data: profile } = await testUserClient
        .from('user_profiles')
        .select('version')
        .eq('id', _testUser!.id)
        .single()

      const { data, error } = await testUserClient.rpc('validate_stint_start', {
        p_user_id: _testUser!.id,
        p_project_id: testProjectId,
        p_version: profile!.version,
      })

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBe(1)
      expect(data[0].can_start).toBe(true)
      expect(data[0].existing_stint_id).toBeNull()
      expect(data[0].conflict_message).toBeNull()
    })

    it('should reject starting when active stint exists', async () => {
      // Create active stint
      const { data: existingStint, error: createError } = await testUserClient
        .from('stints')
        .insert({
          project_id: testProjectId,
          planned_duration: 50,
          status: 'active',
        })
        .select()
        .single()

      expect(createError).toBeNull()
      expect(existingStint).toBeTruthy()

      // Get user version
      const { data: profile } = await testUserClient
        .from('user_profiles')
        .select('version')
        .eq('id', _testUser!.id)
        .single()

      const { data, error } = await testUserClient.rpc('validate_stint_start', {
        p_user_id: _testUser!.id,
        p_project_id: testProjectId,
        p_version: profile!.version,
      })

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBe(1)
      expect(data[0].can_start).toBe(false)
      expect(data[0].existing_stint_id).toBe(existingStint!.id)
      expect(data[0].conflict_message).toBe('Active stint already exists')
    })

    it('should reject starting with version mismatch', async () => {
      const { data, error } = await testUserClient.rpc('validate_stint_start', {
        p_user_id: _testUser!.id,
        p_project_id: testProjectId,
        p_version: 99999, // Wrong version
      })

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBe(1)
      expect(data[0].can_start).toBe(false)
      expect(data[0].conflict_message).toContain('Version mismatch')
    })

    it('should reject starting with invalid project', async () => {
      const invalidProjectId = '00000000-0000-0000-0000-000000000000'

      // Get user version
      const { data: profile } = await testUserClient
        .from('user_profiles')
        .select('version')
        .eq('id', _testUser!.id)
        .single()

      const { data, error } = await testUserClient.rpc('validate_stint_start', {
        p_user_id: _testUser!.id,
        p_project_id: invalidProjectId,
        p_version: profile!.version,
      })

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBe(1)
      expect(data[0].can_start).toBe(false)
      expect(data[0].conflict_message).toContain('Project not found')
    })
  })

  describe('complete_stint', () => {
    it('should complete an active stint', async () => {
      const now = new Date()
      // Create active stint
      const { data: stint, error: createError } = await testUserClient
        .from('stints')
        .insert({
          project_id: testProjectId,
          planned_duration: 50,
          status: 'active',
          started_at: now.toISOString(),
        })
        .select()
        .single()

      expect(createError).toBeNull()
      expect(stint).toBeTruthy()

      // Wait a bit to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 100))

      // Complete the stint
      const { data: completed, error } = await testUserClient.rpc('complete_stint', {
        p_stint_id: stint!.id,
        p_completion_type: 'manual',
        p_notes: 'Test completion',
      })

      expect(error).toBeNull()
      expect(completed).toBeTruthy()
      expect(completed.status).toBe('completed')
      expect(completed.completion_type).toBe('manual')
      expect(completed.ended_at).toBeTruthy()
      expect(completed.actual_duration).toBeGreaterThan(0)
      expect(completed.notes).toBe('Test completion')
    })

    it('should complete a paused stint', async () => {
      const now = new Date()
      // Create paused stint
      const { data: stint, error: createError } = await testUserClient
        .from('stints')
        .insert({
          project_id: testProjectId,
          planned_duration: 50,
          status: 'paused',
          started_at: now.toISOString(),
          paused_at: now.toISOString(),
          paused_duration: 60, // 1 minute already paused
        })
        .select()
        .single()

      expect(createError).toBeNull()
      expect(stint).toBeTruthy()

      await new Promise(resolve => setTimeout(resolve, 100))

      // Complete the stint
      const { data: completed, error } = await testUserClient.rpc('complete_stint', {
        p_stint_id: stint!.id,
        p_completion_type: 'manual',
      })

      expect(error).toBeNull()
      expect(completed).toBeTruthy()
      expect(completed.status).toBe('completed')
      expect(completed.paused_duration).toBe(60) // Preserved
    })

    it('should reject completing a completed stint', async () => {
      const now = new Date()
      const later = new Date(now.getTime() + 3600000)

      // Create completed stint
      const { data: stint, error: createError } = await testUserClient
        .from('stints')
        .insert({
          project_id: testProjectId,
          planned_duration: 50,
          status: 'completed',
          started_at: now.toISOString(),
          ended_at: later.toISOString(),
        })
        .select()
        .single()

      expect(createError).toBeNull()
      expect(stint).toBeTruthy()

      // Attempt to complete again
      const { data, error } = await testUserClient.rpc('complete_stint', {
        p_stint_id: stint!.id,
        p_completion_type: 'manual',
      })

      expect(error).toBeTruthy()
      expect(error?.message).toContain('not active or paused')
      expect(data).toBeNull()
    })
  })

  describe('pause_stint', () => {
    it('should pause an active stint', async () => {
      // Create active stint
      const { data: stint, error: createError } = await testUserClient
        .from('stints')
        .insert({
          project_id: testProjectId,
          planned_duration: 50,
          status: 'active',
        })
        .select()
        .single()

      expect(createError).toBeNull()
      expect(stint).toBeTruthy()

      // Pause the stint
      const { data: paused, error } = await testUserClient.rpc('pause_stint', {
        p_stint_id: stint!.id,
      })

      expect(error).toBeNull()
      expect(paused).toBeTruthy()
      expect(paused.status).toBe('paused')
      expect(paused.paused_at).toBeTruthy()
    })

    it('should reject pausing a paused stint', async () => {
      // Create paused stint
      const { data: stint, error: createError } = await testUserClient
        .from('stints')
        .insert({
          project_id: testProjectId,
          planned_duration: 50,
          status: 'paused',
        })
        .select()
        .single()

      expect(createError).toBeNull()
      expect(stint).toBeTruthy()

      // Attempt to pause again
      const { data, error } = await testUserClient.rpc('pause_stint', {
        p_stint_id: stint!.id,
      })

      expect(error).toBeTruthy()
      expect(error?.message).toContain('not active')
      expect(data).toBeNull()
    })
  })

  describe('resume_stint', () => {
    it('should resume a paused stint and accumulate pause duration', async () => {
      const pauseStart = new Date(Date.now() - 2000) // 2 seconds ago

      // Create paused stint
      const { data: stint, error: createError } = await testUserClient
        .from('stints')
        .insert({
          project_id: testProjectId,
          planned_duration: 50,
          status: 'paused',
          paused_at: pauseStart.toISOString(),
          paused_duration: 10, // Already had 10 seconds paused
        })
        .select()
        .single()

      expect(createError).toBeNull()
      expect(stint).toBeTruthy()

      await new Promise(resolve => setTimeout(resolve, 100))

      // Resume the stint
      const { data: resumed, error } = await testUserClient.rpc('resume_stint', {
        p_stint_id: stint!.id,
      })

      expect(error).toBeNull()
      expect(resumed).toBeTruthy()
      expect(resumed.status).toBe('active')
      expect(resumed.paused_at).toBeNull()
      expect(resumed.paused_duration).toBeGreaterThan(10) // Should accumulate
    })

    it('should reject resuming an active stint', async () => {
      // Create active stint
      const { data: stint, error: createError } = await testUserClient
        .from('stints')
        .insert({
          project_id: testProjectId,
          planned_duration: 50,
          status: 'active',
        })
        .select()
        .single()

      expect(createError).toBeNull()
      expect(stint).toBeTruthy()

      // Attempt to resume
      const { data, error } = await testUserClient.rpc('resume_stint', {
        p_stint_id: stint!.id,
      })

      expect(error).toBeTruthy()
      expect(error?.message).toContain('not paused')
      expect(data).toBeNull()
    })
  })

  describe('calculate_actual_duration', () => {
    it('should calculate duration correctly without pause', async () => {
      const startedAt = new Date('2025-01-01T10:00:00Z')
      const endedAt = new Date('2025-01-01T10:50:00Z') // 50 minutes = 3000 seconds

      const { data, error } = await testUserClient.rpc('calculate_actual_duration', {
        p_started_at: startedAt.toISOString(),
        p_ended_at: endedAt.toISOString(),
        p_paused_duration: 0,
      })

      expect(error).toBeNull()
      expect(data).toBe(3000) // 50 minutes in seconds
    })

    it('should subtract paused duration from total', async () => {
      const startedAt = new Date('2025-01-01T10:00:00Z')
      const endedAt = new Date('2025-01-01T10:50:00Z') // 50 minutes = 3000 seconds
      const pausedDuration = 600 // 10 minutes = 600 seconds

      const { data, error } = await testUserClient.rpc('calculate_actual_duration', {
        p_started_at: startedAt.toISOString(),
        p_ended_at: endedAt.toISOString(),
        p_paused_duration: pausedDuration,
      })

      expect(error).toBeNull()
      expect(data).toBe(2400) // 3000 - 600 = 2400 seconds (40 minutes)
    })

    it('should handle NULL paused duration', async () => {
      const startedAt = new Date('2025-01-01T10:00:00Z')
      const endedAt = new Date('2025-01-01T10:30:00Z') // 30 minutes = 1800 seconds

      const { data, error } = await testUserClient.rpc('calculate_actual_duration', {
        p_started_at: startedAt.toISOString(),
        p_ended_at: endedAt.toISOString(),
        p_paused_duration: null,
      })

      expect(error).toBeNull()
      expect(data).toBe(1800) // Should treat NULL as 0
    })
  })
})

