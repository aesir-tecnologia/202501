/**
 * Singleton composable for Supabase Realtime subscriptions
 * Subscribes to stints and daily_summaries tables for the current user
 * Automatically manages subscription lifecycle based on auth state
 */

import { ref, readonly, watch, onUnmounted } from 'vue';
import type { RealtimeChannel, RealtimePostgresChangesPayload, SupabaseClient } from '@supabase/supabase-js';
import type { QueryClient } from '@tanstack/vue-query';
import { useQueryClient } from '@tanstack/vue-query';
import type { Database } from '~/types/database.types';
import { stintKeys } from '~/composables/useStints';
import { dailySummaryKeys } from '~/composables/useDailySummaries';

type StintRow = Database['public']['Tables']['stints']['Row'];
type DailySummaryRow = Database['public']['Tables']['daily_summaries']['Row'];

const CHANNEL_NAME = 'user-data-changes';
const DEBOUNCE_MS = 100;
const MAX_SUBSCRIPTION_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

const globalRealtimeState = {
  channel: null as RealtimeChannel | null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: null as SupabaseClient<any> | null,
  isSubscribed: ref(false),
  subscriptionError: ref<string | null>(null),
  isInitialized: false,
  userId: null as string | null,
  queryClient: null as QueryClient | null,
  stopUserWatch: null as (() => void) | null,
  debounceTimers: new Map<string, ReturnType<typeof setTimeout>>(),
  toast: null as ReturnType<typeof useToast> | null,
  retryCount: 0,
  retryTimeoutId: null as ReturnType<typeof setTimeout> | null,
};

export function useRealtimeSubscriptions() {
  const client = useSupabaseClient();
  const user = useSupabaseUser();
  const queryClient = useQueryClient();
  const toast = useToast();

  globalRealtimeState.client = client;
  globalRealtimeState.queryClient = queryClient;
  globalRealtimeState.toast = toast;

  if (!globalRealtimeState.isInitialized && import.meta.client) {
    globalRealtimeState.stopUserWatch = watch(
      user,
      (newUser, oldUser) => {
        handleUserChange(newUser?.id ?? null, oldUser?.id ?? null);
      },
      { immediate: true },
    );

    globalRealtimeState.isInitialized = true;

    window.addEventListener('beforeunload', cleanup);
  }

  onUnmounted(() => {
    // Intentionally empty - singleton resources persist across navigation
  });

  return {
    isSubscribed: readonly(globalRealtimeState.isSubscribed),
    subscriptionError: readonly(globalRealtimeState.subscriptionError),
  };
}

function handleUserChange(
  newUserId: string | null,
  oldUserId: string | null,
): void {
  if (!newUserId && oldUserId) {
    unsubscribeFromUserData();
    return;
  }

  if (newUserId && newUserId !== globalRealtimeState.userId) {
    if (globalRealtimeState.userId) {
      unsubscribeFromUserData();
    }
    subscribeToUserData(newUserId);
  }
}

function subscribeToUserData(userId: string): void {
  const client = globalRealtimeState.client;
  if (!client) return;
  if (globalRealtimeState.channel) return;

  globalRealtimeState.userId = userId;
  globalRealtimeState.subscriptionError.value = null;
  globalRealtimeState.retryCount = 0;

  const channel = client.channel(CHANNEL_NAME);

  channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'stints',
      filter: `user_id=eq.${userId}`,
    },
    payload => handleStintChange(payload as RealtimePostgresChangesPayload<StintRow>),
  );

  channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'daily_summaries',
      filter: `user_id=eq.${userId}`,
    },
    payload => handleDailySummaryChange(payload as RealtimePostgresChangesPayload<DailySummaryRow>),
  );

  channel.subscribe((status, err) => {
    if (status === 'SUBSCRIBED') {
      globalRealtimeState.isSubscribed.value = true;
      globalRealtimeState.subscriptionError.value = null;
      globalRealtimeState.retryCount = 0;
    }
    else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      globalRealtimeState.isSubscribed.value = false;
      globalRealtimeState.subscriptionError.value = err?.message || status;
      handleSubscriptionError(userId);
    }
    else if (status === 'CLOSED') {
      globalRealtimeState.isSubscribed.value = false;
    }
  });

  globalRealtimeState.channel = channel;
}

function handleSubscriptionError(userId: string): void {
  globalRealtimeState.retryCount++;

  if (globalRealtimeState.retryCount <= MAX_SUBSCRIPTION_RETRIES) {
    globalRealtimeState.retryTimeoutId = setTimeout(() => {
      unsubscribeFromUserData();
      subscribeToUserData(userId);
    }, RETRY_DELAY_MS * globalRealtimeState.retryCount);
  }
  else {
    globalRealtimeState.toast?.add({
      title: 'Real-time Updates Unavailable',
      description: 'Unable to establish real-time connection. Updates may be delayed.',
      color: 'warning',
      icon: 'i-lucide-wifi-off',
    });
  }
}

function unsubscribeFromUserData(): void {
  if (globalRealtimeState.retryTimeoutId) {
    clearTimeout(globalRealtimeState.retryTimeoutId);
    globalRealtimeState.retryTimeoutId = null;
  }

  if (globalRealtimeState.channel && globalRealtimeState.client) {
    globalRealtimeState.channel.unsubscribe();
    globalRealtimeState.client.removeChannel(globalRealtimeState.channel);
    globalRealtimeState.channel = null;
  }

  globalRealtimeState.userId = null;
  globalRealtimeState.isSubscribed.value = false;
  globalRealtimeState.subscriptionError.value = null;

  for (const timer of globalRealtimeState.debounceTimers.values()) {
    clearTimeout(timer);
  }
  globalRealtimeState.debounceTimers.clear();
}

function handleStintChange(
  _payload: RealtimePostgresChangesPayload<StintRow>,
): void {
  debouncedInvalidate('stints', stintKeys.all);
}

function handleDailySummaryChange(
  _payload: RealtimePostgresChangesPayload<DailySummaryRow>,
): void {
  debouncedInvalidate('daily-summaries', dailySummaryKeys.all);
}

function debouncedInvalidate(
  keyPrefix: string,
  queryKey: readonly unknown[],
): void {
  const existingTimer = globalRealtimeState.debounceTimers.get(keyPrefix);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  const timer = setTimeout(() => {
    globalRealtimeState.queryClient?.invalidateQueries({ queryKey });
    globalRealtimeState.debounceTimers.delete(keyPrefix);
  }, DEBOUNCE_MS);

  globalRealtimeState.debounceTimers.set(keyPrefix, timer);
}

function cleanup(): void {
  if (globalRealtimeState.stopUserWatch) {
    globalRealtimeState.stopUserWatch();
    globalRealtimeState.stopUserWatch = null;
  }

  if (globalRealtimeState.retryTimeoutId) {
    clearTimeout(globalRealtimeState.retryTimeoutId);
    globalRealtimeState.retryTimeoutId = null;
  }

  if (globalRealtimeState.channel && globalRealtimeState.client) {
    globalRealtimeState.channel.unsubscribe();
    globalRealtimeState.client.removeChannel(globalRealtimeState.channel);
    globalRealtimeState.channel = null;
  }

  for (const timer of globalRealtimeState.debounceTimers.values()) {
    clearTimeout(timer);
  }
  globalRealtimeState.debounceTimers.clear();

  globalRealtimeState.userId = null;
  globalRealtimeState.isSubscribed.value = false;
  globalRealtimeState.subscriptionError.value = null;
  globalRealtimeState.isInitialized = false;
  globalRealtimeState.queryClient = null;
  globalRealtimeState.toast = null;
  globalRealtimeState.client = null;
  globalRealtimeState.retryCount = 0;
}

export const _testHelpers = {
  getGlobalState: () => globalRealtimeState,
  resetState: cleanup,
};
