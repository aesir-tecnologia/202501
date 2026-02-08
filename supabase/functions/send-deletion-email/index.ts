import { createClient } from 'npm:@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const FROM_EMAIL = Deno.env.get('DELETION_EMAIL_FROM') ?? 'LifeStint <no-reply@lifestint.com>';
const APP_NAME = 'LifeStint';

type EmailType = 'deletion_confirmation' | 'deletion_reminder';

interface SendEmailPayload {
  type: EmailType
  userId: string
}

function createServiceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

async function getUserEmail(userId: string): Promise<string> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error || !data?.user?.email) {
    throw new Error(`Failed to fetch user email: ${error?.message ?? 'email not found'}`);
  }
  return data.user.email;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function buildConfirmationEmail(userId: string, requestedAt: Date, scheduledDeletionDate: Date): { subject: string, html: string } {
  const subject = `${APP_NAME} — Account deletion scheduled`;
  const html = `
    <h2>Account Deletion Confirmation</h2>
    <p>Your ${APP_NAME} account deletion has been scheduled.</p>
    <table style="border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Account ID</td><td style="padding:4px 0">${userId}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Requested on</td><td style="padding:4px 0">${formatDate(requestedAt)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Permanent deletion</td><td style="padding:4px 0">${formatDate(scheduledDeletionDate)}</td></tr>
    </table>
    <p>You can use the Account ID above to verify your deletion history via support.</p>
    <h3>Changed your mind?</h3>
    <p>You can cancel this deletion at any time before ${formatDate(scheduledDeletionDate)} by visiting <strong>Settings</strong> in your ${APP_NAME} dashboard and selecting <strong>Cancel Deletion</strong>.</p>
    <p>After the scheduled date, your account and all associated data will be permanently removed and cannot be recovered.</p>
  `.trim();

  return { subject, html };
}

function buildReminderEmail(scheduledDeletionDate: Date): { subject: string, html: string } {
  const subject = `${APP_NAME} — Your account will be permanently deleted in 7 days`;
  const html = `
    <h2>Account Deletion Reminder</h2>
    <p>Your ${APP_NAME} account is scheduled for <strong>permanent deletion on ${formatDate(scheduledDeletionDate)}</strong>.</p>
    <p>After this date, all your data — including projects, stints, and preferences — will be permanently removed and <strong>cannot be recovered</strong>.</p>
    <h3>Want to keep your account?</h3>
    <p>Cancel the deletion by visiting <strong>Settings</strong> in your ${APP_NAME} dashboard and selecting <strong>Cancel Deletion</strong>.</p>
  `.trim();

  return { subject, html };
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend API error (${res.status}): ${body}`);
  }
}

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

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ message: 'RESEND_API_KEY not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let payload: SendEmailPayload;
  try {
    payload = await req.json();
  }
  catch {
    return new Response(JSON.stringify({ message: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!payload.type || !payload.userId) {
    return new Response(
      JSON.stringify({ message: 'Missing required fields: type, userId' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  if (!['deletion_confirmation', 'deletion_reminder'].includes(payload.type)) {
    return new Response(
      JSON.stringify({ message: `Invalid email type: ${payload.type}` }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const email = await getUserEmail(payload.userId);

    const supabase = createServiceClient();
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('deletion_requested_at')
      .eq('id', payload.userId)
      .single();

    const requestedAt = profile?.deletion_requested_at
      ? new Date(profile.deletion_requested_at)
      : new Date();
    const scheduledDeletionDate = new Date(requestedAt.getTime() + 30 * 24 * 60 * 60 * 1000);

    let emailContent: { subject: string, html: string };
    if (payload.type === 'deletion_confirmation') {
      emailContent = buildConfirmationEmail(payload.userId, requestedAt, scheduledDeletionDate);
    }
    else {
      emailContent = buildReminderEmail(scheduledDeletionDate);
    }

    await sendEmail(email, emailContent.subject, emailContent.html);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`send-deletion-email failed: ${message}`);
    return new Response(JSON.stringify({ message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
