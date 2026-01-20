import confetti from 'canvas-confetti';
import { startOfDay, addDays } from 'date-fns';
import { useQueryClient } from '@tanstack/vue-query';
import { parseSafeDate } from '~/utils/date-helpers';
import { projectKeys } from '~/composables/useProjects';
import { stintKeys } from '~/composables/useStints';
import { preferencesKeys } from '~/composables/usePreferences';
import type { ProjectRow } from '~/lib/supabase/projects';
import type { StintRow } from '~/lib/supabase/stints';
import type { PreferencesData } from '~/lib/supabase/preferences';
import { DEFAULT_PREFERENCES } from '~/schemas/preferences';

const ENCOURAGING_MESSAGES = [
  'Daily goal crushed! 🎯',
  'You\'re on fire today! 🔥',
  'Amazing focus session! ✨',
  'Goal achieved! Time to celebrate! 🎉',
  'Incredible work! Keep it up! 💪',
  'You did it! Pat yourself on the back! 👏',
  'Today\'s goals: conquered! 🏆',
  'Focus champion! Well done! 🌟',
  'Your dedication is inspiring! 💫',
  'That\'s the way! Goal complete! 🚀',
];

function getRandomMessage(): string {
  const index = Math.floor(Math.random() * ENCOURAGING_MESSAGES.length);
  const message = ENCOURAGING_MESSAGES[index];
  return message !== undefined ? message : 'Daily goal achieved! 🎉';
}

function fireCelebrationConfetti(): void {
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  function randomInRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    const particleCount = 50 * (timeLeft / duration);

    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
    });
  }, 250);
}

interface DailyProgress {
  completed: number
  expected: number
}

function calculateDailyProgress(
  projects: ProjectRow[] | undefined,
  stints: StintRow[] | undefined,
): DailyProgress {
  const todayStart = startOfDay(new Date());
  const tomorrow = addDays(todayStart, 1);

  let completed = 0;
  let expected = 0;

  const activeProjects = projects?.filter(p => p.is_active && !p.archived_at) ?? [];
  for (const project of activeProjects) {
    expected += project.expected_daily_stints ?? 0;
  }

  if (stints) {
    for (const stint of stints) {
      if (stint.status !== 'completed' || !stint.ended_at) continue;
      const endedAt = parseSafeDate(stint.ended_at);
      if (endedAt && endedAt >= todayStart && endedAt < tomorrow) {
        completed++;
      }
    }
  }

  return { completed, expected };
}

export function useCelebration() {
  const queryClient = useQueryClient();
  const toast = useToast();

  function checkAndCelebrate(): void {
    const preferences = queryClient.getQueryData<PreferencesData>(preferencesKeys.current());
    const celebrationEnabled = preferences?.celebrationAnimation ?? DEFAULT_PREFERENCES.celebrationAnimation;

    if (!celebrationEnabled) return;

    // Try to get projects from cache - dashboard uses { includeInactive: true }
    let projects = queryClient.getQueryData<ProjectRow[]>(projectKeys.list({ includeInactive: true }));
    if (!projects) {
      projects = queryClient.getQueryData<ProjectRow[]>(projectKeys.list(undefined));
    }
    const stints = queryClient.getQueryData<StintRow[]>(stintKeys.list(undefined));

    const { completed, expected } = calculateDailyProgress(projects, stints);
    const justAchievedGoal = completed >= expected && (completed - 1) < expected && expected > 0;

    if (justAchievedGoal) {
      fireCelebrationConfetti();

      toast.add({
        title: getRandomMessage(),
        description: `You completed ${completed} of ${expected} stints today!`,
        color: 'success',
        icon: 'i-lucide-party-popper',
      });
    }
  }

  return {
    checkAndCelebrate,
    fireCelebrationConfetti,
  };
}
