# Test Infrastructure

This directory contains the test suite for LifeStint, implementing a dual-mode testing approach with mocked and real Supabase clients.

## Overview

Tests run against a **mocked Supabase client by default** to avoid API rate limits and provide fast, reliable test execution. Integration tests can optionally run against a real Supabase instance.

### Test Modes

#### 1. Unit Tests (Mocked - Default)
- **Speed**: ~1 second for all tests
- **API Calls**: Zero external calls
- **Rate Limiting**: None
- **Use Case**: Local development, CI/CD, rapid iteration

```bash
npm test                    # Run in watch mode
npm run test:run            # Run once
npm run test:ui             # Run with UI
```

#### 2. Integration Tests (Real Supabase)
- **Speed**: ~7-10 seconds (depends on network)
- **API Calls**: Real Supabase API
- **Rate Limiting**: Subject to Supabase limits
- **Use Case**: Pre-deployment validation, RLS testing

```bash
USE_MOCK_SUPABASE=false npm run test:run
```

## Architecture

### Mock Implementation (`tests/mocks/supabase.ts`)

The mock Supabase client provides:
- **In-memory storage** for projects and stints
- **Client-isolated auth** state (per-client user session)
- **Query builder API** matching Supabase PostgREST
- **Automatic cleanup** between tests via `resetMockStore()`

#### Supported Operations

**Query Methods:**
- `.select()`, `.eq()`, `.neq()`, `.in()`, `.is()`, `.filter()`
- `.order()`, `.limit()`, `.single()`, `.maybeSingle()`

**Mutation Methods:**
- `.insert().select().single()` - Create with return
- `.update().eq()` - Update with filters
- `.delete().eq()` - Delete with filters

**Auth Methods:**
- `client.auth.getUser()` - Returns client-specific user
- `client.auth.signOut()` - Clears client session

### Test Setup (`tests/setup.ts`)

#### Environment Detection
```typescript
const USE_MOCK = process.env.USE_MOCK_SUPABASE !== 'false'
```

#### Helper Functions

**`getTestUser(userNumber: 1 | 2)`**
- Returns mocked client by default
- Returns real authenticated client when `USE_MOCK_SUPABASE=false`
- Each user has isolated session and data

**`cleanupTestData(client)`**
- Resets mock store when using mocks
- Deletes database rows when using real Supabase

### Test Lifecycle

```typescript
beforeEach(() => {
  vi.clearAllMocks()
  if (USE_MOCK) resetMockStore()
})

// In test file
beforeEach(async () => {
  const { client, user } = await getTestUser()
  await cleanupTestData(client)
})
```

## Writing Tests

### Unit Test Pattern
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
      name: 'Test Project'
    })

    expect(error).toBeNull()
    expect(data?.name).toBe('Test Project')
  })
})
```

### Multi-User Tests
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
})
```

## Mock Limitations

The mock implementation prioritizes speed and simplicity over complete Supabase parity:

### Not Implemented
- [ ] Complex RLS policies (partially mocked via user_id checks)
- [ ] Database triggers (e.g., `updated_at` auto-update)
- [ ] Foreign key cascade behaviors
- [ ] PostgreSQL-specific functions (e.g., `gen_random_uuid()`)
- [ ] Real-time subscriptions
- [ ] Storage operations

### Workarounds
- **RLS**: Mock enforces basic `user_id` filtering in insert/update/delete
- **Triggers**: Tests should not rely on automatic timestamp updates
- **Defaults**: Mock applies schema defaults manually in insert handlers
- **Cascades**: Implemented manually in delete handlers where critical

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run Unit Tests
  run: npm run test:run
  # Uses mocked Supabase by default

- name: Run Integration Tests
  env:
    USE_MOCK_SUPABASE: false
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
  run: npm run test:run
```

### Vercel Build
Vercel builds run unit tests (mocked) by default - no Supabase credentials needed during build.

## Extending the Mock

### Adding New Table Support

1. **Add type to store** (`tests/mocks/supabase.ts`):
```typescript
interface InMemoryStore {
  projects: Map<string, ProjectRow>
  stints: Map<string, StintRow>
  newTable: Map<string, NewTableRow>  // Add here
}
```

2. **Implement handlers**:
```typescript
function handleNewTableInsert(payload, getCurrentUser) { /* ... */ }
function handleNewTableUpdate(filters, payload) { /* ... */ }
function handleNewTableDelete(filters) { /* ... */ }
```

3. **Add to query builder**:
```typescript
if (state.table === 'new_table') {
  return executeNewTableQuery(state)
}
```

### Adding New Query Methods

Add to `createQueryBuilder` function:
```typescript
const builder = {
  // ...existing methods
  gte: (field: string, value: unknown) => {
    state.filters.push({ field, op: 'gte', value })
    return builder
  }
}
```

Update `matchesFilters`:
```typescript
case 'gte':
  return fieldValue >= value
```

## Troubleshooting

### Tests Fail with "User not authenticated"
- Ensure `getTestUser()` is called in `beforeEach`
- Check that cleanup doesn't clear user session prematurely

### Tests Fail with "Request rate limit reached"
- Set `USE_MOCK_SUPABASE=true` (or omit, it's the default)
- Check that globalSetup isn't running unnecessarily

### Mock Behavior Doesn't Match Real Supabase
- Run with `USE_MOCK_SUPABASE=false` to test against real DB
- Update mock implementation to match observed behavior
- Consider if the behavior is critical for unit tests

### Performance Degradation
- Mocked tests should run in <2 seconds
- Check for accidental real Supabase calls
- Ensure `resetMockStore()` is called in `beforeEach`

## Metrics

### Test Suite Performance
- **Unit Tests (Mocked)**: ~1s for 112 tests
- **Integration Tests (Real DB)**: ~7-10s for 112 tests
- **Speedup**: ~7-10x faster with mocks

### Coverage
- **Passing Tests**: 66/112 (59%)
- **Database Layer**: Well covered with mocks
- **Schema Layer**: Full coverage (pure validation)
- **Composable Layer**: Partial coverage (requires component context)
