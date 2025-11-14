import { vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '~/types/database.types';
import { createMockSupabaseClient, resetMockStore } from './mocks/supabase';
import type { TypedSupabaseClient } from '~/utils/supabase';

const USE_MOCK = process.env.USE_MOCK_SUPABASE !== 'false';

// Validate required environment variables only if using real Supabase
if (!USE_MOCK && (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY)) {
  throw new Error(
    'Missing required environment variables: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env file',
  );
}

// Global test setup
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();

  // Reset mock store if using mocked Supabase
  if (USE_MOCK) {
    resetMockStore();
  }
});

// Mock File constructor for Node.js environment
global.File = class MockFile {
  public name: string;
  public type: string;
  public size: number;
  public lastModified: number;

  constructor(bits: BlobPart[], filename: string, options: FilePropertyBag = {}) {
    this.name = filename;
    this.type = options.type || '';
    this.size = bits.reduce((size, bit) => {
      if (typeof bit === 'string') return size + bit.length;
      if (bit instanceof ArrayBuffer) return size + bit.byteLength;
      return size + (bit as ArrayLike<unknown>).length || 0;
    }, 0);
    this.lastModified = options.lastModified || Date.now();
  }
} as typeof globalThis.File;

/**
 * Get one of the global test users (1 or 2)
 * Returns a mocked client by default (unless USE_MOCK_SUPABASE=false)
 * For integration tests with real Supabase, set USE_MOCK_SUPABASE=false
 */
export async function getTestUser(userNumber: 1 | 2 = 1) {
  const envPrefix = `TEST_USER_${userNumber}`;
  const email = `test-user-${userNumber}@lifestint.test`;
  const userId = `mock-user-${userNumber}-id`;

  if (USE_MOCK) {
    const client = createMockSupabaseClient(userId, email);
    return {
      client: client as TypedSupabaseClient,
      user: { id: userId, email },
      email,
    };
  }

  const realEmail = process.env[`${envPrefix}_EMAIL`];
  const password = process.env[`${envPrefix}_PASSWORD`];
  const realUserId = process.env[`${envPrefix}_ID`];

  if (!realEmail || !password || !realUserId) {
    throw new Error(`Global test user ${userNumber} not initialized. Check globalSetup.ts`);
  }

  const client = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
  );

  const { data, error } = await client.auth.signInWithPassword({
    email: realEmail,
    password,
  });

  if (error || !data.user) {
    throw new Error(`Failed to sign in test user ${userNumber}: ${error?.message}`);
  }

  return {
    client,
    user: data.user,
    email: realEmail,
  };
}

/**
 * Clean up test data for a specific user
 * Deletes all projects and stints but preserves the user account
 * For mocked clients, this resets the mock store
 */
export async function cleanupTestData(client: TypedSupabaseClient) {
  if (USE_MOCK) {
    resetMockStore();
    return;
  }

  await client.from('stints').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await client.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
}
