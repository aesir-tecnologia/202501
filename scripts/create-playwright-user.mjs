#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const PLAYWRIGHT_USER = {
  email: 'playwright-test@lifestint.test',
  password: 'PlaywrightTest2025!',
};

async function createPlaywrightUser() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env file');
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
  );

  console.log('🔍 Checking if Playwright test user exists...');

  // Try to sign in first
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: PLAYWRIGHT_USER.email,
    password: PLAYWRIGHT_USER.password,
  });

  if (!signInError && signInData.user) {
    console.log('✅ Playwright test user already exists');
    console.log(`   Email: ${PLAYWRIGHT_USER.email}`);
    console.log(`   User ID: ${signInData.user.id}`);
    return;
  }

  console.log('📝 Creating new Playwright test user...');

  // Create new user
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: PLAYWRIGHT_USER.email,
    password: PLAYWRIGHT_USER.password,
  });

  if (signUpError || !signUpData.user) {
    throw new Error(`Failed to create Playwright test user: ${signUpError?.message}`);
  }

  console.log('✅ Playwright test user created successfully');
  console.log(`   Email: ${PLAYWRIGHT_USER.email}`);
  console.log(`   Password: ${PLAYWRIGHT_USER.password}`);
  console.log(`   User ID: ${signUpData.user.id}`);
  console.log('\n💡 Add these credentials to CLAUDE.md for future reference');
}

createPlaywrightUser().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
