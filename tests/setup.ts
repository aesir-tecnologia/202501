import { vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '~/types/database.types';

// Validate required environment variables are loaded
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing required environment variables: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env file',
  );
}

// Global test setup
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
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
 * Users are created once in globalSetup and reused across all tests
 */
export async function getTestUser(userNumber: 1 | 2 = 1) {
  const envPrefix = `TEST_USER_${userNumber}`;
  const email = process.env[`${envPrefix}_EMAIL`];
  const password = process.env[`${envPrefix}_PASSWORD`];
  const userId = process.env[`${envPrefix}_ID`];

  if (!email || !password || !userId) {
    throw new Error(`Global test user ${userNumber} not initialized. Check globalSetup.ts`);
  }

  const client = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
  );

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    throw new Error(`Failed to sign in test user ${userNumber}: ${error?.message}`);
  }

  return {
    client,
    user: data.user,
    email,
  };
}

/**
 * Clean up test data for a specific user
 * Deletes all projects and stints but preserves the user account
 */
export async function cleanupTestData(client: ReturnType<typeof createClient<Database>>) {
  await client.from('stints').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await client.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
}
