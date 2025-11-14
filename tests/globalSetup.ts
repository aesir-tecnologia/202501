import { createClient } from '@supabase/supabase-js';
import { loadEnv } from 'vite';
import type { Database } from '~/types/database.types';

const GLOBAL_USERS = [
  {
    email: 'global-test-user-1@lifestint.test',
    password: 'TestPassword123!SecureGlobal1',
    envPrefix: 'TEST_USER_1',
  },
  {
    email: 'global-test-user-2@lifestint.test',
    password: 'TestPassword123!SecureGlobal2',
    envPrefix: 'TEST_USER_2',
  },
];

export async function setup() {
  const env = loadEnv('test', process.cwd(), '');
  Object.assign(process.env, env);

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env file');
  }

  const supabase = createClient<Database>(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  for (const user of GLOBAL_USERS) {
    const { email, password, envPrefix } = user;

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!signInError && signInData.user && signInData.session) {
      console.log(`✓ Global test user ${envPrefix} already exists, reusing`);
      process.env[`${envPrefix}_ID`] = signInData.user.id;
      process.env[`${envPrefix}_EMAIL`] = email;
      process.env[`${envPrefix}_PASSWORD`] = password;
      process.env[`${envPrefix}_ACCESS_TOKEN`] = signInData.session.access_token;
      process.env[`${envPrefix}_REFRESH_TOKEN`] = signInData.session.refresh_token;
      continue;
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError || !signUpData.user || !signUpData.session) {
      throw new Error(`Failed to create global test user ${envPrefix}: ${signUpError?.message}`);
    }

    console.log(`✓ Created global test user ${envPrefix}`);
    process.env[`${envPrefix}_ID`] = signUpData.user.id;
    process.env[`${envPrefix}_EMAIL`] = email;
    process.env[`${envPrefix}_PASSWORD`] = password;
    process.env[`${envPrefix}_ACCESS_TOKEN`] = signUpData.session.access_token;
    process.env[`${envPrefix}_REFRESH_TOKEN`] = signUpData.session.refresh_token;
  }

  console.log('🧹 Cleaning up test data from previous runs...');
  for (const user of GLOBAL_USERS) {
    const envPrefix = user.envPrefix;
    const userId = process.env[`${envPrefix}_ID`];
    if (userId) {
      await supabase.from('stints').delete().eq('user_id', userId);
      await supabase.from('projects').delete().eq('user_id', userId);
    }
  }
  console.log('✓ Global test data cleanup complete');
}

export async function teardown() {
  console.log('✓ Global test teardown complete');
}
