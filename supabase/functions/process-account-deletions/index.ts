import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured',
  );
}

interface ProcessDeletionsResult {
  processedCount: number
  errors: Array<{ anonymizedRef: string, error: string }>
  remindersCount: number
  reminderErrors: Array<{ anonymizedRef: string, error: string }>
}

interface PendingDeletionUser {
  id: string
  deletion_requested_at: string
}

function createServiceClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

async function generateAnonymizedRef(supabase: SupabaseClient, userId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_anonymized_user_ref', { user_id: userId });
  if (error) throw new Error(`Failed to generate anonymized ref: ${error.message}`);
  return data as string;
}

async function logDeletionEvent(
  supabase: SupabaseClient,
  userId: string,
  eventType: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase.rpc('log_deletion_event', {
    p_user_id: userId,
    p_event_type: eventType,
    p_metadata: metadata ?? null,
  });
  if (error) throw new Error(`Failed to log deletion event: ${error.message}`);
}

// ── Phase 1: Process expired deletions ──────────────────────────────

async function processExpiredDeletions(supabase: SupabaseClient): Promise<{
  processedCount: number
  errors: Array<{ anonymizedRef: string, error: string }>
}> {
  const { data: expiredUsers, error: queryError } = await supabase
    .from('user_profiles')
    .select('id, deletion_requested_at')
    .not('deletion_requested_at', 'is', null)
    .lte('deletion_requested_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  if (queryError) {
    throw new Error(`Failed to query expired deletions: ${queryError.message}`);
  }

  const users = (expiredUsers ?? []) as PendingDeletionUser[];
  let processedCount = 0;
  const errors: Array<{ anonymizedRef: string, error: string }> = [];

  for (const user of users) {
    let anonymizedRef = 'unknown';
    try {
      anonymizedRef = await generateAnonymizedRef(supabase, user.id);
      const metadata = {
        scheduled_deletion_at: new Date(
          new Date(user.deletion_requested_at).getTime() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        processed_at: new Date().toISOString(),
      };

      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
      if (deleteError) throw deleteError;

      await logDeletionEvent(supabase, user.id, 'complete', metadata);

      processedCount++;
    }
    catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Failed to delete user (ref: ${anonymizedRef}): ${message}`);
      errors.push({ anonymizedRef, error: message });
    }
  }

  return { processedCount, errors };
}

// ── Phase 2: Send 7-day reminder emails ─────────────────────────────

async function sendReminderEmails(supabase: SupabaseClient): Promise<{
  remindersCount: number
  reminderErrors: Array<{ anonymizedRef: string, error: string }>
}> {
  const now = Date.now();
  const day23Ago = new Date(now - 23 * 24 * 60 * 60 * 1000).toISOString();
  const day24Ago = new Date(now - 24 * 24 * 60 * 60 * 1000).toISOString();

  const { data: reminderUsers, error: queryError } = await supabase
    .from('user_profiles')
    .select('id, deletion_requested_at')
    .not('deletion_requested_at', 'is', null)
    .lte('deletion_requested_at', day23Ago)
    .gt('deletion_requested_at', day24Ago);

  if (queryError) {
    console.error(`Failed to query reminder-eligible users: ${queryError.message}`);
    return { remindersCount: 0, reminderErrors: [{ anonymizedRef: 'query', error: queryError.message }] };
  }

  const users = (reminderUsers ?? []) as PendingDeletionUser[];
  let remindersCount = 0;
  const reminderErrors: Array<{ anonymizedRef: string, error: string }> = [];

  for (const user of users) {
    let anonymizedRef = 'unknown';
    try {
      anonymizedRef = await generateAnonymizedRef(supabase, user.id);

      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-deletion-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ type: 'deletion_reminder', userId: user.id }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`send-deletion-email returned ${res.status}: ${body}`);
      }

      remindersCount++;
    }
    catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Failed to send reminder (ref: ${anonymizedRef}): ${message}`);
      reminderErrors.push({ anonymizedRef, error: message });
    }
  }

  return { remindersCount, reminderErrors };
}

// ── Handler ─────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ message: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ') || authHeader.split(' ')[1] !== SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = createServiceClient();

    // Phase 1: Delete expired accounts (critical — must run first)
    const { processedCount, errors } = await processExpiredDeletions(supabase);

    // Phase 2: Send reminders (non-critical — failures don't affect Phase 1)
    const { remindersCount, reminderErrors } = await sendReminderEmails(supabase);

    const result: ProcessDeletionsResult = {
      processedCount,
      errors,
      remindersCount,
      reminderErrors,
    };

    console.log(
      `process-account-deletions: deleted=${processedCount} errors=${errors.length} reminders=${remindersCount} reminderErrors=${reminderErrors.length}`,
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`process-account-deletions failed: ${message}`);
    return new Response(JSON.stringify({ message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
