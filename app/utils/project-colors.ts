import type { ProjectColor } from '~/constants';

export interface ColorClasses {
  bg: string
  ring: string
  border: string
}

export interface ColorPillClasses {
  bg: string
  border: string
  text: string
}

export const COLOR_CLASSES: Record<ProjectColor, ColorClasses> = {
  red: { bg: 'bg-red-500', ring: 'ring-red-500', border: 'border-red-500' },
  orange: { bg: 'bg-orange-500', ring: 'ring-orange-500', border: 'border-orange-500' },
  amber: { bg: 'bg-amber-500', ring: 'ring-amber-500', border: 'border-amber-500' },
  green: { bg: 'bg-green-500', ring: 'ring-green-500', border: 'border-green-500' },
  teal: { bg: 'bg-teal-500', ring: 'ring-teal-500', border: 'border-teal-500' },
  blue: { bg: 'bg-blue-500', ring: 'ring-blue-500', border: 'border-blue-500' },
  purple: { bg: 'bg-purple-500', ring: 'ring-purple-500', border: 'border-purple-500' },
  pink: { bg: 'bg-pink-500', ring: 'ring-pink-500', border: 'border-pink-500' },
};

export const COLOR_PILL_CLASSES: Record<ProjectColor, ColorPillClasses> = {
  red: { bg: 'bg-red-50 dark:bg-red-500/10', border: 'border-red-200 dark:border-red-500/20', text: 'text-red-800 dark:text-red-200' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-200 dark:border-orange-500/20', text: 'text-orange-800 dark:text-orange-200' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20', text: 'text-amber-800 dark:text-amber-200' },
  green: { bg: 'bg-green-50 dark:bg-green-500/10', border: 'border-green-200 dark:border-green-500/20', text: 'text-green-800 dark:text-green-200' },
  teal: { bg: 'bg-teal-50 dark:bg-teal-500/10', border: 'border-teal-200 dark:border-teal-500/20', text: 'text-teal-800 dark:text-teal-200' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20', text: 'text-blue-800 dark:text-blue-200' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-500/10', border: 'border-purple-200 dark:border-purple-500/20', text: 'text-purple-800 dark:text-purple-200' },
  pink: { bg: 'bg-pink-50 dark:bg-pink-500/10', border: 'border-pink-200 dark:border-pink-500/20', text: 'text-pink-800 dark:text-pink-200' },
};

export function getColorClasses(color: ProjectColor): ColorClasses {
  return COLOR_CLASSES[color];
}

export function getColorPillClasses(color: ProjectColor): ColorPillClasses {
  return COLOR_PILL_CLASSES[color];
}
