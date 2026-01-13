import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { useTypedSupabaseClient } from '~/utils/supabase';
import {
  getPreferences,
  updatePreferences as updatePreferencesDb,
  type PreferencesData,
} from '~/lib/supabase/preferences';
import { preferencesUpdateSchema, DEFAULT_PREFERENCES } from '~/schemas/preferences';
import type { PreferencesUpdatePayload } from '~/schemas/preferences';

// ============================================================================
// Query Key Factory
// ============================================================================

export const preferencesKeys = {
  all: ['preferences'] as const,
  current: () => [...preferencesKeys.all, 'current'] as const,
};

// ============================================================================
// Query Hook
// ============================================================================

export function usePreferencesQuery() {
  const client = useTypedSupabaseClient();

  return useQuery({
    queryKey: preferencesKeys.current(),
    queryFn: async () => {
      const { data, error } = await getPreferences(client);
      if (error) throw error;
      return data ?? DEFAULT_PREFERENCES;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============================================================================
// Mutation Hook
// ============================================================================

export function useUpdatePreferences() {
  const client = useTypedSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: PreferencesUpdatePayload) => {
      const validation = preferencesUpdateSchema.safeParse(payload);
      if (!validation.success) {
        throw new Error(validation.error.issues[0]?.message || 'Validation failed');
      }

      const { data, error } = await updatePreferencesDb(client, validation.data);
      if (error || !data) {
        throw error || new Error('Failed to update preferences');
      }

      return data;
    },
    onMutate: async (newPrefs) => {
      await queryClient.cancelQueries({ queryKey: preferencesKeys.current() });

      const previous = queryClient.getQueryData<PreferencesData>(preferencesKeys.current());

      queryClient.setQueryData<PreferencesData>(preferencesKeys.current(), old => ({
        ...(old ?? DEFAULT_PREFERENCES),
        ...newPrefs,
      }));

      return { previous };
    },
    onError: (_err, _newPrefs, context) => {
      if (context?.previous) {
        queryClient.setQueryData(preferencesKeys.current(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: preferencesKeys.current() });
    },
  });
}
