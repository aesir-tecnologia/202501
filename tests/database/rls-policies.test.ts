import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '~/types/supabase'

// Test configuration - requires test database
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key'

type TestClient = ReturnType<typeof createClient<Database>>

describe('Row Level Security Policies', () => {
  let supabase: TestClient
  let testUser1: { id: string, email: string } | null
  let testUser2: { id: string, email: string } | null
  let testUser1Client: TestClient
  let testUser2Client: TestClient

  beforeEach(async () => {
    // Initialize admin client for setup
    supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

    // Create test users
    const testEmail1 = `test1-${Date.now()}@example.com`
    const testEmail2 = `test2-${Date.now()}@example.com`
    const testPassword = 'testPassword123!'

    // Create first test user
    const { data: userData1, error: userError1 } = await supabase.auth.signUp({
      email: testEmail1,
      password: testPassword,
    })

    if (userError1) throw userError1
    testUser1 = userData1.user

    // Create second test user
    const { data: userData2, error: userError2 } = await supabase.auth.signUp({
      email: testEmail2,
      password: testPassword,
    })

    if (userError2) throw userError2
    testUser2 = userData2.user

    // Create authenticated clients for each user
    testUser1Client = createClient<Database>(supabaseUrl, supabaseAnonKey)
    testUser2Client = createClient<Database>(supabaseUrl, supabaseAnonKey)

    // Sign in both users
    await testUser1Client.auth.signInWithPassword({
      email: testEmail1,
      password: testPassword,
    })

    await testUser2Client.auth.signInWithPassword({
      email: testEmail2,
      password: testPassword,
    })

    // Insert users into the users table (required for foreign key constraints)
    if (testUser1) {
      await testUser1Client.from('users').insert({
        id: testUser1.id,
        email: testUser1.email,
      })
    }

    if (testUser2) {
      await testUser2Client.from('users').insert({
        id: testUser2.id,
        email: testUser2.email,
      })
    }
  })

  afterEach(async () => {
    // Clean up: sign out and remove test users
    if (testUser1Client) {
      await testUser1Client.auth.signOut()
    }
    if (testUser2Client) {
      await testUser2Client.auth.signOut()
    }

    // Note: In a real test environment, you'd also clean up the test users
    // This requires admin privileges to delete auth users
  })

  describe('Users table RLS policies', () => {
    it('should allow users to read their own profile', async () => {
      if (!testUser1) throw new Error('Test user 1 not created')

      const { data, error } = await testUser1Client
        .from('users')
        .select('*')
        .eq('id', testUser1.id)
        .single()

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(data?.id).toBe(testUser1.id)
      expect(data?.email).toBe(testUser1.email)
    })

    it('should prevent users from reading other users profiles', async () => {
      if (!testUser1 || !testUser2) throw new Error('Test users not created')

      // User 1 tries to read User 2's profile
      const { data } = await testUser1Client
        .from('users')
        .select('*')
        .eq('id', testUser2.id)
        .single()

      // Should return no data due to RLS
      expect(data).toBeNull()
    })

    it('should allow users to update their own profile', async () => {
      if (!testUser1) throw new Error('Test user 1 not created')

      const { data, error } = await testUser1Client
        .from('users')
        .update({ email: testUser1.email }) // Update with same email
        .eq('id', testUser1.id)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.id).toBe(testUser1.id)
    })

    it('should prevent users from updating other users profiles', async () => {
      if (!testUser1 || !testUser2) throw new Error('Test users not created')

      // User 1 tries to update User 2's profile
      const { data, error } = await testUser1Client
        .from('users')
        .update({ email: 'malicious@example.com' })
        .eq('id', testUser2.id)
        .select()

      // Should either fail with an error OR return no rows (RLS silently filters)
      // Both indicate RLS is working correctly
      expect(error === null && (data === null || data.length === 0)).toBe(true)
    })
  })

  describe('Projects table RLS policies', () => {
    let testProject1Id: string
    let testProject2Id: string

    beforeEach(async () => {
      if (!testUser1 || !testUser2) throw new Error('Test users not created')

      // Create test projects for each user
      const { data: project1, error: projectError1 } = await testUser1Client
        .from('projects')
        .insert({
          user_id: testUser1.id,
          name: 'Test Project 1',
          expected_daily_stints: 2,
        })
        .select()
        .single()

      if (projectError1) throw projectError1
      testProject1Id = project1.id

      const { data: project2, error: projectError2 } = await testUser2Client
        .from('projects')
        .insert({
          user_id: testUser2.id,
          name: 'Test Project 2',
          expected_daily_stints: 3,
        })
        .select()
        .single()

      if (projectError2) throw projectError2
      testProject2Id = project2.id
    })

    it('should allow users to read their own projects', async () => {
      const { data, error } = await testUser1Client
        .from('projects')
        .select('*')
        .eq('id', testProject1Id)
        .single()

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(data?.id).toBe(testProject1Id)
      expect(data?.user_id).toBe(testUser1?.id)
    })

    it('should prevent users from reading other users projects', async () => {
      // User 1 tries to read User 2's project
      const { data } = await testUser1Client
        .from('projects')
        .select('*')
        .eq('id', testProject2Id)
        .single()

      // Should return no data due to RLS
      expect(data).toBeNull()
    })

    it('should allow users to update their own projects', async () => {
      const newName = 'Updated Project Name'

      const { data, error } = await testUser1Client
        .from('projects')
        .update({ name: newName })
        .eq('id', testProject1Id)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.name).toBe(newName)
    })

    it('should prevent users from updating other users projects', async () => {
      // User 1 tries to update User 2's project
      const { data, error } = await testUser1Client
        .from('projects')
        .update({ name: 'Malicious Update' })
        .eq('id', testProject2Id)
        .select()

      // Should either fail with an error OR return no rows (RLS silently filters)
      expect(error === null && (data === null || data.length === 0)).toBe(true)
    })

    it('should allow users to delete their own projects', async () => {
      const { error } = await testUser1Client
        .from('projects')
        .delete()
        .eq('id', testProject1Id)

      expect(error).toBeNull()

      // Verify project is deleted
      const { data } = await testUser1Client
        .from('projects')
        .select('*')
        .eq('id', testProject1Id)
        .single()

      expect(data).toBeNull()
    })

    it('should prevent users from deleting other users projects', async () => {
      // User 1 tries to delete User 2's project
      const { data, error } = await testUser1Client
        .from('projects')
        .delete()
        .eq('id', testProject2Id)
        .select()

      // Should either fail with an error OR return no rows (RLS silently filters)
      expect(error === null && (data === null || data.length === 0)).toBe(true)
    })
  })

  describe('Stints table RLS policies', () => {
    let testProject1Id: string
    let testProject2Id: string
    let testStint1Id: string
    let testStint2Id: string

    beforeEach(async () => {
      if (!testUser1 || !testUser2) throw new Error('Test users not created')

      // Create test projects
      const { data: project1 } = await testUser1Client
        .from('projects')
        .insert({
          user_id: testUser1.id,
          name: 'Stint Test Project 1',
        })
        .select()
        .single()
      testProject1Id = project1!.id

      const { data: project2 } = await testUser2Client
        .from('projects')
        .insert({
          user_id: testUser2.id,
          name: 'Stint Test Project 2',
        })
        .select()
        .single()
      testProject2Id = project2!.id

      // Create test stints
      const { data: stint1 } = await testUser1Client
        .from('stints')
        .insert({
          project_id: testProject1Id,
          user_id: testUser1.id,
          started_at: new Date().toISOString(),
          duration_minutes: 25,
        })
        .select()
        .single()
      testStint1Id = stint1!.id

      const { data: stint2 } = await testUser2Client
        .from('stints')
        .insert({
          project_id: testProject2Id,
          user_id: testUser2.id,
          started_at: new Date().toISOString(),
          duration_minutes: 30,
        })
        .select()
        .single()
      testStint2Id = stint2!.id
    })

    it('should allow users to read their own stints', async () => {
      const { data, error } = await testUser1Client
        .from('stints')
        .select('*')
        .eq('id', testStint1Id)
        .single()

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(data?.id).toBe(testStint1Id)
      expect(data?.user_id).toBe(testUser1?.id)
    })

    it('should prevent users from reading other users stints', async () => {
      // User 1 tries to read User 2's stint
      const { data } = await testUser1Client
        .from('stints')
        .select('*')
        .eq('id', testStint2Id)
        .single()

      // Should return no data due to RLS
      expect(data).toBeNull()
    })

    it('should allow users to update their own stints', async () => {
      const newDuration = 45

      const { data, error } = await testUser1Client
        .from('stints')
        .update({ duration_minutes: newDuration })
        .eq('id', testStint1Id)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.duration_minutes).toBe(newDuration)
    })

    it('should prevent users from updating other users stints', async () => {
      // User 1 tries to update User 2's stint
      const { data, error } = await testUser1Client
        .from('stints')
        .update({ duration_minutes: 999 })
        .eq('id', testStint2Id)
        .select()

      // Should either fail with an error OR return no rows (RLS silently filters)
      expect(error === null && (data === null || data.length === 0)).toBe(true)
    })

    it('should enforce cross-table RLS through project relationship', async () => {
      if (!testUser1) throw new Error('Test user 1 not created')

      // User 1 tries to create a stint for User 2's project
      const { error } = await testUser1Client
        .from('stints')
        .insert({
          project_id: testProject2Id, // User 2's project
          user_id: testUser1.id, // User 1's ID
          started_at: new Date().toISOString(),
          duration_minutes: 25,
        })

      // Should fail due to RLS policies preventing access to other users' projects
      expect(error).toBeTruthy()
    })
  })

  describe('Policy performance optimization', () => {
    it('should efficiently query user-specific data with indexes', async () => {
      if (!testUser1) throw new Error('Test user 1 not created')

      // Create multiple projects to test index performance
      const projects = Array.from({ length: 10 }, (_, i) => ({
        user_id: testUser1.id,
        name: `Performance Test Project ${i}`,
        is_active: i % 2 === 0, // Mix of active/inactive
      }))

      await testUser1Client.from('projects').insert(projects)

      // Query with index-optimized filters
      const start = Date.now()
      const { data, error } = await testUser1Client
        .from('projects')
        .select('*')
        .eq('user_id', testUser1.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      const duration = Date.now() - start

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(data?.length).toBeGreaterThan(0)
      // Performance assertion - should be fast with proper indexing
      expect(duration).toBeLessThan(1000) // Less than 1 second
    })

    it('should efficiently query stints with composite indexes', async () => {
      if (!testUser1) throw new Error('Test user 1 not created')

      // Create a project first
      const { data: project } = await testUser1Client
        .from('projects')
        .insert({
          user_id: testUser1.id,
          name: 'Index Test Project',
        })
        .select()
        .single()

      // Create multiple stints to test index performance
      const baseDate = new Date()
      const stints = Array.from({ length: 20 }, (_, i) => {
        const stintDate = new Date(baseDate)
        stintDate.setDate(baseDate.getDate() - i) // Spread over 20 days

        return {
          project_id: project!.id,
          user_id: testUser1.id,
          started_at: stintDate.toISOString(),
          duration_minutes: 25 + (i % 10), // Varied durations
        }
      })

      await testUser1Client.from('stints').insert(stints)

      // Query with composite index optimization
      const start = Date.now()
      const { data, error } = await testUser1Client
        .from('stints')
        .select('*')
        .eq('user_id', testUser1.id)
        .gte('started_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
        .order('started_at', { ascending: false })

      const duration = Date.now() - start

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      // Performance assertion - should be fast with composite indexing
      expect(duration).toBeLessThan(1000) // Less than 1 second
    })
  })
})
