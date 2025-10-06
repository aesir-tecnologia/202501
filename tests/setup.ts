import { vi } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'

// Mock environment variables for tests
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321'
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'test-anon-key'

// Global test setup
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks()
})

// Mock File constructor for Node.js environment
global.File = class MockFile {
  public name: string
  public type: string
  public size: number
  public lastModified: number

  constructor(bits: BlobPart[], filename: string, options: FilePropertyBag = {}) {
    this.name = filename
    this.type = options.type || ''
    this.size = bits.reduce((size, bit) => {
      if (typeof bit === 'string') return size + bit.length
      if (bit instanceof ArrayBuffer) return size + bit.byteLength
      return size + (bit as ArrayLike<unknown>).length || 0
    }, 0)
    this.lastModified = options.lastModified || Date.now()
  }
} as typeof globalThis.File

/**
 * Helper function to create a test user with auth and user_profile
 * This is required because user_profiles must be manually created after signup
 */
export async function createTestUser() {
  const testEmail = `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`
  const testPassword = 'testPassword123!'

  const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321'
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

  // Sign up the user
  const { data: userData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  })

  if (signUpError || !userData.user) {
    throw new Error(`Failed to create test user: ${signUpError?.message}`)
  }

  // Create a new client for this user
  const userClient = createClient<Database>(supabaseUrl, supabaseAnonKey)

  // Sign in
  await userClient.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  })

  // Create user_profile (required for foreign key constraint)
  await userClient
    .from('user_profiles')
    .insert({
      id: userData.user.id,
      email: testEmail,
    })

  return {
    client: userClient,
    user: userData.user,
    email: testEmail,
  }
}
