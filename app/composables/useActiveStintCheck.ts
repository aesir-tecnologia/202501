import type { Ref } from 'vue';
import { hasActiveStint } from '~/lib/supabase/projects';
import { logger } from '~/utils/logger';

interface ActiveStintCheckResult {
  hasActive: Ref<boolean>
  isCheckingActive: Ref<boolean>
}

export function useActiveStintCheck(
  projectId: Ref<string>,
  isOpen: Ref<boolean>,
): ActiveStintCheckResult {
  const toast = useToast();
  const client = useSupabaseClient();

  const hasActive = ref(false);
  const isCheckingActive = ref(false);

  watch(isOpen, async (open) => {
    if (!open) return;

    isCheckingActive.value = true;
    hasActive.value = false;

    const { data, error } = await hasActiveStint(client, projectId.value);

    if (error) {
      logger.error('Failed to check active stint:', error);
      hasActive.value = true;
      toast.add({
        title: 'Unable to verify project status',
        description: 'Please try again or refresh the page.',
        color: 'warning',
      });
    }
    else {
      hasActive.value = data ?? false;
    }

    isCheckingActive.value = false;
  }, { immediate: true });

  return {
    hasActive,
    isCheckingActive,
  };
}
