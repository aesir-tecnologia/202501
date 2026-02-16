import type { Ref, ComputedRef } from 'vue';
import type { StintRow } from '~/lib/supabase/stints';
import type { PreferencesData } from '~/lib/supabase/preferences';
import { detectMidnightSpan, formatAttributionDates } from '~/utils/midnight-detection';

export function useMidnightAttribution(
  stintToComplete: Ref<StintRow | null>,
  timezone: ComputedRef<string>,
  preferencesData: Ref<PreferencesData | undefined>,
) {
  const midnightSpanInfo = computed(() => {
    if (!stintToComplete.value) return null;
    return detectMidnightSpan(stintToComplete.value, timezone.value);
  });

  const midnightSpanLabels = computed(() => {
    if (!midnightSpanInfo.value) return null;
    return formatAttributionDates(midnightSpanInfo.value, timezone.value);
  });

  const shouldShowDayAttribution = computed(() => {
    if (!midnightSpanInfo.value?.spansMidnight) return false;
    return preferencesData.value?.stintDayAttribution === 'ask';
  });

  const presetAttributedDate = computed(() => {
    if (!midnightSpanInfo.value?.spansMidnight) return undefined;
    const preference = preferencesData.value?.stintDayAttribution;
    if (preference === 'start_date') return midnightSpanInfo.value.startDate;
    if (preference === 'end_date') return midnightSpanInfo.value.endDate;
    return undefined;
  });

  return { midnightSpanInfo, midnightSpanLabels, shouldShowDayAttribution, presetAttributedDate };
}
