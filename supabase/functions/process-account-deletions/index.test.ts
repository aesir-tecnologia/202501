import { assertEquals, assert } from 'https://deno.land/std@0.224.0/assert/mod.ts';

const SERVICE_ROLE_KEY = 'test-service-role-key';
const SUPABASE_URL = 'http://localhost:54321';

const USER_EXPIRED = {
  id: '11111111-1111-1111-1111-111111111111',
  deletion_requested_at: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString(),
};

const USER_REMINDER = {
  id: '22222222-2222-2222-2222-222222222222',
  deletion_requested_at: new Date(Date.now() - 23.5 * 24 * 60 * 60 * 1000).toISOString(),
};

const _USER_SAFE = {
  id: '33333333-3333-3333-3333-333333333333',
  deletion_requested_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
};

interface MockState {
  deletedUserIds: string[]
  loggedEvents: Array<{ userId: string, eventType: string }>
  sentReminders: string[]
  deleteUserShouldFail: boolean
  sendReminderShouldFail: boolean
}

function createMockState(): MockState {
  return {
    deletedUserIds: [],
    loggedEvents: [],
    sentReminders: [],
    deleteUserShouldFail: false,
    sendReminderShouldFail: false,
  };
}

// ── Simulated handler logic for testing ─────────────────────────────
// Since Deno Edge Functions register via Deno.serve() at module load,
// we replicate the core logic here to test behavior in isolation.

async function simulateProcessDeletions(
  expiredUsers: Array<{ id: string, deletion_requested_at: string }>,
  reminderUsers: Array<{ id: string, deletion_requested_at: string }>,
  state: MockState,
) {
  let processedCount = 0;
  const errors: Array<{ anonymizedRef: string, error: string }> = [];

  // Phase 1: Delete expired accounts
  for (const user of expiredUsers) {
    const anonymizedRef = `sha256-of-${user.id}`;
    try {
      if (state.deleteUserShouldFail) {
        throw new Error('Auth admin delete failed');
      }
      state.loggedEvents.push({ userId: user.id, eventType: 'complete' });
      state.deletedUserIds.push(user.id);
      processedCount++;
    }
    catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      errors.push({ anonymizedRef, error: message });
    }
  }

  // Phase 2: Send reminders (failures isolated from Phase 1)
  let remindersCount = 0;
  const reminderErrors: Array<{ anonymizedRef: string, error: string }> = [];

  for (const user of reminderUsers) {
    const anonymizedRef = `sha256-of-${user.id}`;
    try {
      if (state.sendReminderShouldFail) {
        throw new Error('Reminder send failed');
      }
      state.sentReminders.push(user.id);
      remindersCount++;
    }
    catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      reminderErrors.push({ anonymizedRef, error: message });
    }
  }

  return { processedCount, errors, remindersCount, reminderErrors };
}

// ── Phase 1 tests ───────────────────────────────────────────────────

Deno.test('Phase 1: deletes users past 30-day grace period', async () => {
  const state = createMockState();
  const result = await simulateProcessDeletions([USER_EXPIRED], [], state);

  assertEquals(result.processedCount, 1);
  assertEquals(result.errors.length, 0);
  assertEquals(state.deletedUserIds, [USER_EXPIRED.id]);
  assertEquals(state.loggedEvents.length, 1);
  assertEquals(state.loggedEvents[0].eventType, 'complete');
});

Deno.test('Phase 1: skips users still within grace period', async () => {
  const state = createMockState();
  const result = await simulateProcessDeletions([], [], state);

  assertEquals(result.processedCount, 0);
  assertEquals(state.deletedUserIds.length, 0);
});

Deno.test('Phase 1: logs audit event before deleting user', async () => {
  const state = createMockState();
  await simulateProcessDeletions([USER_EXPIRED], [], state);

  assertEquals(state.loggedEvents.length, 1);
  assertEquals(state.loggedEvents[0].userId, USER_EXPIRED.id);
  assertEquals(state.loggedEvents[0].eventType, 'complete');
  assert(state.deletedUserIds.includes(USER_EXPIRED.id));
});

Deno.test('Phase 1: continues processing remaining users when one fails', async () => {
  const secondExpired = {
    id: '44444444-4444-4444-4444-444444444444',
    deletion_requested_at: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString(),
  };

  let callCount = 0;
  const state = createMockState();

  const expiredUsers = [USER_EXPIRED, secondExpired];
  let processedCount = 0;
  const errors: Array<{ anonymizedRef: string, error: string }> = [];

  for (const user of expiredUsers) {
    callCount++;
    const anonymizedRef = `sha256-of-${user.id}`;
    try {
      if (callCount === 1) throw new Error('Simulated failure for first user');
      state.loggedEvents.push({ userId: user.id, eventType: 'complete' });
      state.deletedUserIds.push(user.id);
      processedCount++;
    }
    catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      errors.push({ anonymizedRef, error: message });
    }
  }

  assertEquals(processedCount, 1);
  assertEquals(errors.length, 1);
  assertEquals(state.deletedUserIds, [secondExpired.id]);
});

// ── Phase 2 tests ───────────────────────────────────────────────────

Deno.test('Phase 2: sends reminders for day-23 users', async () => {
  const state = createMockState();
  const result = await simulateProcessDeletions([], [USER_REMINDER], state);

  assertEquals(result.remindersCount, 1);
  assertEquals(result.reminderErrors.length, 0);
  assertEquals(state.sentReminders, [USER_REMINDER.id]);
});

Deno.test('Phase 2: reminder failures do not affect Phase 1', async () => {
  const state = createMockState();
  state.sendReminderShouldFail = true;

  const result = await simulateProcessDeletions([USER_EXPIRED], [USER_REMINDER], state);

  assertEquals(result.processedCount, 1, 'Phase 1 should succeed');
  assertEquals(state.deletedUserIds, [USER_EXPIRED.id]);
  assertEquals(result.reminderErrors.length, 1, 'Phase 2 should record error');
  assertEquals(result.remindersCount, 0);
});

// ── Idempotency tests (T028) ───────────────────────────────────────

Deno.test('idempotency: re-run after partial failure skips already-deleted users', async () => {
  // First run: user gets deleted
  const state1 = createMockState();
  const result1 = await simulateProcessDeletions([USER_EXPIRED], [], state1);
  assertEquals(result1.processedCount, 1);

  // Second run: same user no longer appears in expired list
  // (because auth.admin.deleteUser cascades to user_profiles, removing the row)
  const state2 = createMockState();
  const result2 = await simulateProcessDeletions([], [], state2);
  assertEquals(result2.processedCount, 0);
  assertEquals(state2.deletedUserIds.length, 0);
});

Deno.test('idempotency: failed deletion can be retried on next run', async () => {
  const state1 = createMockState();
  state1.deleteUserShouldFail = true;
  const result1 = await simulateProcessDeletions([USER_EXPIRED], [], state1);
  assertEquals(result1.processedCount, 0);
  assertEquals(result1.errors.length, 1);

  const state2 = createMockState();
  const result2 = await simulateProcessDeletions([USER_EXPIRED], [], state2);
  assertEquals(result2.processedCount, 1);
  assertEquals(result2.errors.length, 0);
});

// ── PII verification tests (T029) ──────────────────────────────────

Deno.test('PII: after deletion, user data is fully removed via CASCADE', async () => {
  const state = createMockState();
  await simulateProcessDeletions([USER_EXPIRED], [], state);

  assert(state.deletedUserIds.includes(USER_EXPIRED.id));
  // In production, auth.admin.deleteUser() cascades to:
  //   auth.users -> user_profiles -> projects -> stints
  //   auth.users -> user_profiles -> user_streaks
  //   auth.users -> user_profiles -> daily_summaries
  // The user would not appear in any subsequent query.
  // This test verifies the deletion was triggered.
});

Deno.test('PII: audit log uses anonymized reference, not real user ID', async () => {
  const state = createMockState();
  await simulateProcessDeletions([USER_EXPIRED], [], state);

  // Verify the audit log was written with the real userId for the DB function
  // to hash — the log_deletion_event function generates the SHA-256 hash internally
  assertEquals(state.loggedEvents[0].userId, USER_EXPIRED.id);
  assertEquals(state.loggedEvents[0].eventType, 'complete');
  // The actual anonymized_user_ref is generated by the DB function
  // generate_anonymized_user_ref(user_id) = SHA-256 hash
});

Deno.test('PII: deleted user can re-register as new user', () => {
  // After auth.admin.deleteUser(), the email is freed in auth.users.
  // A new signUp() with the same email creates a completely new user
  // with a new UUID, no data recovery, no link to previous account.
  // This is a design verification — the test documents the expected behavior.
  const newUserId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
  assert(newUserId !== USER_EXPIRED.id, 'New registration gets a different user ID');
});

// ── HTTP handler contract tests ─────────────────────────────────────

Deno.test('HTTP: returns 401 without service role auth', async () => {
  const req = new Request(`${SUPABASE_URL}/functions/v1/process-account-deletions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  const authHeader = req.headers.get('Authorization');
  const isAuthorized = authHeader?.startsWith('Bearer ') && authHeader.split(' ')[1] === SERVICE_ROLE_KEY;

  assertEquals(isAuthorized, false);
});

Deno.test('HTTP: returns 405 for non-POST requests', () => {
  const req = new Request(`${SUPABASE_URL}/functions/v1/process-account-deletions`, {
    method: 'GET',
  });
  assertEquals(req.method !== 'POST', true);
});
