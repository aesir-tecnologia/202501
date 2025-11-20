# Test Infrastructure

This directory contains the test suite for LifeStint, running against a local Supabase instance for reliable integration testing.

## Overview

Tests run against the **local Supabase instance** to provide realistic testing with actual database operations, RLS policies, and triggers.

### Prerequisites

Ensure local Supabase is running before executing tests:

```bash
supabase start
```

### Running Tests

```bash
npm test                    # Run in watch mode
npm run test:run            # Run once (CI mode)
npm run test:ui             # Run with Vitest UI
```

## Test Setup

### Helper Functions (`tests/setup.ts`)

**`getTestUser(userNumber: 1 | 2)`**
- Returns authenticated Supabase client for test user
- Each user has isolated session and data
- Auto-creates test users on first use

**`cleanupTestData(client)`**
- Deletes all test data (projects, stints) for the user
- Call in `beforeEach` to ensure clean test state

### Test Lifecycle

```typescript
import { beforeEach, describe, it, expect } from 'vitest'
import { getTestUser, cleanupTestData } from '../setup'

describe('Feature tests', () => {
  let client, user

  beforeEach(async () => {
    const testData = await getTestUser()
    client = testData.client
    user = testData.user
    await cleanupTestData(client)
  })

  it('should perform operation', async () => {
    // Test implementation
  })
})
```

## Writing Tests

### Basic Test Pattern

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { createProject } from '~/lib/supabase/projects'
import { getTestUser, cleanupTestData } from '../../setup'

describe('createProject', () => {
  let client, user

  beforeEach(async () => {
    const testData = await getTestUser()
    client = testData.client
    user = testData.user
    await cleanupTestData(client)
  })

  it('should create project successfully', async () => {
    const { data, error } = await createProject(client, {
      name: 'Test Project',
      expected_daily_stints: 3
    })

    expect(error).toBeNull()
    expect(data?.name).toBe('Test Project')
    expect(data?.expected_daily_stints).toBe(3)
  })
})
```

### Multi-User Tests

Test data isolation between users:

```typescript
it('should isolate data between users', async () => {
  const { client: client1 } = await getTestUser(1)
  const { client: client2 } = await getTestUser(2)

  await createProject(client1, { name: 'User 1 Project' })
  await createProject(client2, { name: 'User 2 Project' })

  const { data: user1Projects } = await listProjects(client1)
  const { data: user2Projects } = await listProjects(client2)

  expect(user1Projects).toHaveLength(1)
  expect(user2Projects).toHaveLength(1)
  expect(user1Projects[0].name).toBe('User 1 Project')
  expect(user2Projects[0].name).toBe('User 2 Project')
})
```

### Testing RLS Policies

Local Supabase allows testing actual Row Level Security policies:

```typescript
it('should enforce RLS - user cannot access other users data', async () => {
  const { client: client1 } = await getTestUser(1)
  const { client: client2 } = await getTestUser(2)

  const { data: project1 } = await createProject(client1, { name: 'Private Project' })

  // Attempt to access user1's project with user2's client
  const { data, error } = await client2
    .from('projects')
    .select('*')
    .eq('id', project1.id)
    .single()

  expect(data).toBeNull()
  expect(error).toBeTruthy()
})
```

## Test Organization

```
tests/
├── lib/                  # Database layer tests
│   ├── supabase/
│   │   ├── projects.test.ts
│   │   └── stints.test.ts
├── composables/          # Composable hook tests
│   └── useProjects.test.ts
├── schemas/              # Schema validation tests
│   ├── projects.test.ts
│   └── stints.test.ts
├── setup.ts              # Test helpers and global setup
└── README.md             # This file
```

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Start Local Supabase
  run: supabase start

- name: Run Tests
  run: npm run test:run
  env:
    SUPABASE_URL: http://127.0.0.1:54321
    SUPABASE_ANON_KEY: ${{ secrets.LOCAL_ANON_KEY }}
```

## Troubleshooting

### Tests Fail with "Connection refused"

- Ensure local Supabase is running: `supabase status`
- Verify `.env` has correct local credentials
- Check that Docker is running (required for Supabase local)

### Tests Fail with "User not authenticated"

- Ensure `getTestUser()` is called in `beforeEach`
- Check that test user exists (should auto-create on first run)
- Verify cleanup doesn't clear user session

### Schema out of sync

- Apply migrations: `supabase db reset`
- Regenerate types: `npm run supabase:types`
- Restart tests

### Performance Issues

- Local tests should complete in <10 seconds
- Check for unnecessary database queries
- Ensure `cleanupTestData()` is efficient

## Benefits of Local Supabase Testing

- **Real Database Operations**: Test actual PostgreSQL queries
- **RLS Policy Validation**: Verify security policies work correctly
- **Trigger Testing**: Test database triggers and functions
- **Type Safety**: Generated types match actual database schema
- **No Rate Limits**: Local instance has no API limits
- **Offline Development**: No internet required for testing
