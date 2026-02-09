import type { TypedSupabaseClient } from '~/utils/supabase';
import type { DeletionStatus } from '~/schemas/account-deletion';
import { requireUserId, type Result } from './auth';
import { logger } from '~/utils/logger';

export type { DeletionStatus };

const GRACE_PERIOD_DAYS = 30;

export async function hasActiveStint(
  client: TypedSupabaseClient,
): Promise<Result<boolean>> {
  const userResult = await requireUserId(client, 'check active stints');
  if (userResult.error || !userResult.data) {
    return { data: null, error: userResult.error || new Error('User ID unavailable') };
  }
  const userId = userResult.data;

  const { data, error } = await client
    .from('stints')
    .select('id')
    .eq('user_id', userId)
    .is('ended_at', null)
    .limit(1);

  if (error) return { data: null, error };
  return { data: Boolean(data && data.length > 0), error: null };
}

export async function getDeletionStatus(
  client: TypedSupabaseClient,
): Promise<Result<DeletionStatus>> {
  const userResult = await requireUserId(client, 'check deletion status');
  if (userResult.error || !userResult.data) {
    return { data: null, error: userResult.error || new Error('User ID unavailable') };
  }
  const userId = userResult.data;

  const { data, error } = await client
    .from('user_profiles')
    .select('deletion_requested_at')
    .eq('id', userId)
    .single();

  if (error) return { data: null, error };

  if (!data.deletion_requested_at) {
    return {
      data: { isPending: false, requestedAt: null, expiresAt: null, daysRemaining: null },
      error: null,
    };
  }

  const requestedAt = new Date(data.deletion_requested_at);
  const expiresAt = new Date(requestedAt.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
  const now = new Date();
  const msRemaining = expiresAt.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));

  return {
    data: {
      isPending: true,
      requestedAt: data.deletion_requested_at,
      expiresAt: expiresAt.toISOString(),
      daysRemaining,
    },
    error: null,
  };
}

export async function requestAccountDeletion(
  client: TypedSupabaseClient,
): Promise<Result<DeletionStatus>> {
  const userResult = await requireUserId(client, 'request account deletion');
  if (userResult.error || !userResult.data) {
    return { data: null, error: userResult.error || new Error('User ID unavailable') };
  }
  const userId = userResult.data;

  const activeResult = await hasActiveStint(client);
  if (activeResult.error) return { data: null, error: activeResult.error };
  if (activeResult.data) {
    return { data: null, error: new Error('Please end your active stint before requesting account deletion') };
  }

  const statusResult = await getDeletionStatus(client);
  if (statusResult.error) return { data: null, error: statusResult.error };
  if (statusResult.data?.isPending) {
    return { data: null, error: new Error('Account deletion is already scheduled. You can cancel it from Settings.') };
  }

  const { error: updateError } = await client
    .from('user_profiles')
    .update({ deletion_requested_at: new Date().toISOString() })
    .eq('id', userId);

  if (updateError) return { data: null, error: updateError };

  // Best-effort audit logging - don't fail the operation if logging fails
  const { error: rpcError } = await client.rpc('log_deletion_event', {
    p_user_id: userId,
    p_event_type: 'request',
  });

  if (rpcError) {
    // Log for monitoring but don't block the user's request
    logger.error('Failed to log deletion request event', rpcError);
  }

  return getDeletionStatus(client);
}

export async function cancelAccountDeletion(
  client: TypedSupabaseClient,
): Promise<Result<DeletionStatus>> {
  const userResult = await requireUserId(client, 'cancel account deletion');
  if (userResult.error || !userResult.data) {
    return { data: null, error: userResult.error || new Error('User ID unavailable') };
  }
  const userId = userResult.data;

  const statusResult = await getDeletionStatus(client);
  if (statusResult.error) return { data: null, error: statusResult.error };
  if (!statusResult.data?.isPending) {
    return { data: null, error: new Error('No pending deletion request to cancel') };
  }

  const { error: updateError } = await client
    .from('user_profiles')
    .update({ deletion_requested_at: null })
    .eq('id', userId);

  if (updateError) return { data: null, error: updateError };

  // Best-effort audit logging - don't fail the operation if logging fails
  const { error: rpcError } = await client.rpc('log_deletion_event', {
    p_user_id: userId,
    p_event_type: 'cancel',
  });

  if (rpcError) {
    // Log for monitoring but don't block the user's request
    logger.error('Failed to log deletion cancellation event', rpcError);
  }

  return getDeletionStatus(client);
}
