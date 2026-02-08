import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { useTypedSupabaseClient } from '~/utils/supabase';
import { getDeletionStatus, requestAccountDeletion, cancelAccountDeletion } from '~/lib/supabase/account-deletion';
import type { DeletionStatus, RequestDeletionPayload } from '~/schemas/account-deletion';
import { requestDeletionSchema } from '~/schemas/account-deletion';

export const accountDeletionKeys = {
  all: ['account-deletion'] as const,
  status: () => [...accountDeletionKeys.all, 'status'] as const,
};

export function useDeletionStatusQuery() {
  const client = useTypedSupabaseClient();

  return useQuery({
    queryKey: accountDeletionKeys.status(),
    queryFn: async () => {
      const { data, error } = await getDeletionStatus(client);
      if (error) throw error;
      return data!;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useRequestDeletion() {
  const client = useTypedSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: RequestDeletionPayload) => {
      const validation = requestDeletionSchema.safeParse(payload);
      if (!validation.success) {
        throw new Error(validation.error.issues[0]?.message || 'Validation failed');
      }

      const { data: userData } = await client.auth.getUser();
      if (!userData?.user?.email || userData.user.email !== validation.data.email) {
        throw new Error('The email address does not match your account');
      }

      // signInWithPassword replaces the current session — revisit if MFA is added
      const { error: authError } = await client.auth.signInWithPassword({
        email: validation.data.email,
        password: validation.data.password,
      });
      if (authError) {
        throw new Error('Incorrect password');
      }

      const { data, error } = await requestAccountDeletion(client);
      if (error || !data) {
        throw error || new Error('Failed to request account deletion');
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<DeletionStatus>(accountDeletionKeys.status(), data);
      queryClient.invalidateQueries({ queryKey: accountDeletionKeys.status() });
    },
  });
}

export function useCancelDeletion() {
  const client = useTypedSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await cancelAccountDeletion(client);
      if (error || !data) {
        throw error || new Error('Failed to cancel account deletion');
      }
      return data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: accountDeletionKeys.status() });
      const previous = queryClient.getQueryData<DeletionStatus>(accountDeletionKeys.status());
      queryClient.setQueryData<DeletionStatus>(accountDeletionKeys.status(), {
        isPending: false,
        requestedAt: null,
        expiresAt: null,
        daysRemaining: null,
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(accountDeletionKeys.status(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: accountDeletionKeys.status() });
    },
  });
}
