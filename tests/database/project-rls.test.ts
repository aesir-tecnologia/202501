import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { createClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import { createTestUser } from '../setup'

/**
 * RLS Policy Tests for Project Management Feature
 *
 * Tests the Row Level Security policies for the projects table.
 * These tests verify that users can only access their own projects.
 *
 * Prerequisites:
 * - Database migration applied (add sort_order column)
 * - RLS policies configured on projects table
 */

const _supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321'
const _supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key'

type TestClient = ReturnType<typeof createClient<Database>>

describe('Project RLS Policies', () => {
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
    // Sign out users
    if (testUser1Client) {
      await testUser1Client.auth.signOut()
    }
    if (testUser2Client) {
      await testUser2Client.auth.signOut()
    }
  })

  describe('SELECT policy', () => {
    it('should allow users to SELECT only their own projects', async () => {
      if (!testUser1 || !testUser2) throw new Error('Test users not created')

      // User 1 creates a project
      const { data: project1 } = await testUser1Client
        .from('projects')
        .insert({
          name: 'User 1 Project',
          expected_daily_stints: 3,
          custom_stint_duration: 45,
        })
        .select()
        .single()

      // User 2 creates a project
      const { data: project2 } = await testUser2Client
        .from('projects')
        .insert({
          name: 'User 2 Project',
          expected_daily_stints: 4,
          custom_stint_duration: 60,
        })
        .select()
        .single()

      // User 1 should see only their own project
      const { data: user1Projects } = await testUser1Client
        .from('projects')
        .select('*')

      expect(user1Projects).toBeTruthy()
      expect(user1Projects).toHaveLength(1)
      expect(user1Projects![0].id).toBe(project1!.id)
      expect(user1Projects![0].user_id).toBe(testUser1.id)

      // User 2 should see only their own project
      const { data: user2Projects } = await testUser2Client
        .from('projects')
        .select('*')

      expect(user2Projects).toBeTruthy()
      expect(user2Projects).toHaveLength(1)
      expect(user2Projects![0].id).toBe(project2!.id)
      expect(user2Projects![0].user_id).toBe(testUser2.id)
    })
  })

  describe('INSERT policy', () => {
    it('should allow users to INSERT only with their own user_id', async () => {
      if (!testUser1) throw new Error('Test user 1 not created')

      // User 1 creates a project (implicit user_id from auth)
      const { data, error } = await testUser1Client
        .from('projects')
        .insert({
          name: 'New Project',
          expected_daily_stints: 3,
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(data!.user_id).toBe(testUser1.id)
      expect(data!.name).toBe('New Project')
    })
  })

  describe('UPDATE policy', () => {
    it('should allow users to UPDATE only their own projects', async () => {
      if (!testUser1) throw new Error('Test user 1 not created')

      // User 1 creates a project
      const { data: project } = await testUser1Client
        .from('projects')
        .insert({
          name: 'Original Name',
          expected_daily_stints: 3,
        })
        .select()
        .single()

      // User 1 updates their own project
      const { data: updated, error } = await testUser1Client
        .from('projects')
        .update({ name: 'Updated Name' })
        .eq('id', project!.id)
        .select()
        .single()

      expect(error).toBeNull()
      expect(updated).toBeTruthy()
      expect(updated!.name).toBe('Updated Name')
    })

    it('should prevent users from UPDATE other users projects', async () => {
      if (!testUser1 || !testUser2) throw new Error('Test users not created')

      // User 2 creates a project
      const { data: project2 } = await testUser2Client
        .from('projects')
        .insert({
          name: 'User 2 Project',
          expected_daily_stints: 3,
        })
        .select()
        .single()

      // User 1 tries to update User 2's project
      const { data, error } = await testUser1Client
        .from('projects')
        .update({ name: 'Malicious Update' })
        .eq('id', project2!.id)
        .select()

      // Should return no data or error due to RLS
      if (error) {
        expect(error).toBeTruthy()
      }
      else {
        expect(data).toHaveLength(0)
      }
    })
  })

  describe('DELETE policy', () => {
    it('should allow users to DELETE only their own projects', async () => {
      if (!testUser1) throw new Error('Test user 1 not created')

      // User 1 creates a project
      const { data: project } = await testUser1Client
        .from('projects')
        .insert({
          name: 'Project to Delete',
          expected_daily_stints: 3,
        })
        .select()
        .single()

      // User 1 deletes their own project
      const { error } = await testUser1Client
        .from('projects')
        .delete()
        .eq('id', project!.id)

      expect(error).toBeNull()

      // Verify project is deleted
      const { data: deleted } = await testUser1Client
        .from('projects')
        .select('*')
        .eq('id', project!.id)
        .maybeSingle()

      expect(deleted).toBeNull()
    })

    it('should prevent users from DELETE other users projects', async () => {
      if (!testUser1 || !testUser2) throw new Error('Test users not created')

      // User 2 creates a project
      const { data: project2 } = await testUser2Client
        .from('projects')
        .insert({
          name: 'User 2 Project',
          expected_daily_stints: 3,
        })
        .select()
        .single()

      // User 1 tries to delete User 2's project
      const { data, error } = await testUser1Client
        .from('projects')
        .delete()
        .eq('id', project2!.id)
        .select()

      // Should return no data or error due to RLS
      if (error) {
        expect(error).toBeTruthy()
      }
      else {
        expect(data).toHaveLength(0)
      }

      // Verify User 2's project still exists
      const { data: stillExists } = await testUser2Client
        .from('projects')
        .select('*')
        .eq('id', project2!.id)
        .single()

      expect(stillExists).toBeTruthy()
    })
  })
})
