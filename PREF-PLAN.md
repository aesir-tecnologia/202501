# Implementation Plan: User Preferences (Extend user_profiles)

## Summary
Add preference columns directly to `user_profiles` table to persist user settings across devices. This replaces the current localStorage-based storage in the settings page.

## Design Decisions
- **No separate table**: With only 3 preference fields, extending `user_profiles` is simpler (no JOINs, existing RLS/triggers)
- **Theme**: Keep browser-local (Nuxt color-mode) — NOT stored in database
- **Duration**: Optional (nullable), uses 5-480 range to match project duration constraints
- **Only documented features**: Removed fields without implementation plans (celebration_sound, weekly_email_digest, analytics_opt_out)

---

## Implementation Steps

### 1. Database Migration
**Create:** `supabase/migrations/20260109XXXXXX_add_user_preferences_columns.sql`

**Add columns to user_profiles:**
```sql
-- Add preference columns to user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS default_stint_duration INTEGER
    CHECK (default_stint_duration IS NULL OR (default_stint_duration >= 5 AND default_stint_duration <= 480)),
  ADD COLUMN IF NOT EXISTS celebration_animation BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS desktop_notifications BOOLEAN NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.user_profiles.default_stint_duration IS 'Default stint duration in minutes (5-480). NULL means use system default (120 min).';
COMMENT ON COLUMN public.user_profiles.celebration_animation IS 'Show confetti animation when daily goal is reached.';
COMMENT ON COLUMN public.user_profiles.desktop_notifications IS 'Enable browser notifications for stint completion.';
```

**Update handle_new_user() trigger** to include defaults:
```sql
-- Update the handle_new_user function to set preference defaults
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, timezone, default_stint_duration, celebration_animation, desktop_notifications)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC'),
    NULL,  -- Use system default (120 min)
    true,  -- Celebration animation enabled
    false  -- Desktop notifications disabled by default (requires permission)
  )
  ON CONFLICT (id) DO NOTHING;

  -- Also create user_streaks entry
  INSERT INTO public.user_streaks (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;
```

---

### 2. Regenerate Types
```bash
npm run supabase:types
```
**Modifies:** `app/types/database.types.ts`

---

### 3. Database Layer
**Create:** `app/lib/supabase/preferences.ts`

Functions:
- `getPreferences(client)` → `Result<PreferencesData | null>`
- `updatePreferences(client, updates)` → `Result<PreferencesData>`

```typescript
import type { TypedSupabaseClient } from '~/utils/supabase'
import { requireUserId, wrapError, wrapSuccess } from '~/lib/supabase/utils'

export interface PreferencesData {
  defaultStintDuration: number | null
  celebrationAnimation: boolean
  desktopNotifications: boolean
}

export async function getPreferences(client: TypedSupabaseClient) {
  const userId = await requireUserId(client)

  const { data, error } = await client
    .from('user_profiles')
    .select('default_stint_duration, celebration_animation, desktop_notifications')
    .eq('id', userId)
    .single()

  if (error) return wrapError(error.message)
  if (!data) return wrapError('Profile not found')

  return wrapSuccess({
    defaultStintDuration: data.default_stint_duration,
    celebrationAnimation: data.celebration_animation,
    desktopNotifications: data.desktop_notifications,
  })
}

export async function updatePreferences(
  client: TypedSupabaseClient,
  updates: Partial<PreferencesData>
) {
  const userId = await requireUserId(client)

  const dbUpdates: Record<string, unknown> = {}
  if ('defaultStintDuration' in updates) {
    dbUpdates.default_stint_duration = updates.defaultStintDuration
  }
  if ('celebrationAnimation' in updates) {
    dbUpdates.celebration_animation = updates.celebrationAnimation
  }
  if ('desktopNotifications' in updates) {
    dbUpdates.desktop_notifications = updates.desktopNotifications
  }

  const { data, error } = await client
    .from('user_profiles')
    .update(dbUpdates)
    .eq('id', userId)
    .select('default_stint_duration, celebration_animation, desktop_notifications')
    .single()

  if (error) return wrapError(error.message)

  return wrapSuccess({
    defaultStintDuration: data.default_stint_duration,
    celebrationAnimation: data.celebration_animation,
    desktopNotifications: data.desktop_notifications,
  })
}
```

---

### 4. Schema Layer
**Create:** `app/schemas/preferences.ts`

```typescript
import { z } from 'zod'

export const PREFERENCES_SCHEMA_LIMITS = {
  STINT_DURATION_MIN: 5,
  STINT_DURATION_MAX: 480,
  STINT_DURATION_DEFAULT: 120,
} as const

export const preferencesUpdateSchema = z.object({
  defaultStintDuration: z
    .number()
    .int()
    .min(PREFERENCES_SCHEMA_LIMITS.STINT_DURATION_MIN)
    .max(PREFERENCES_SCHEMA_LIMITS.STINT_DURATION_MAX)
    .nullable()
    .optional(),
  celebrationAnimation: z.boolean().optional(),
  desktopNotifications: z.boolean().optional(),
})

export type PreferencesUpdatePayload = z.infer<typeof preferencesUpdateSchema>

export const DEFAULT_PREFERENCES = {
  defaultStintDuration: null, // Uses system default (120 min)
  celebrationAnimation: true,
  desktopNotifications: false,
} as const
```

---

### 5. Composable Layer
**Create:** `app/composables/usePreferences.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { getPreferences, updatePreferences, type PreferencesData } from '~/lib/supabase/preferences'
import { preferencesUpdateSchema, DEFAULT_PREFERENCES } from '~/schemas/preferences'

export const preferencesKeys = {
  all: ['preferences'] as const,
  current: () => [...preferencesKeys.all, 'current'] as const,
}

export function usePreferencesQuery() {
  const client = useSupabaseClient()

  return useQuery({
    queryKey: preferencesKeys.current(),
    queryFn: async () => {
      const result = await getPreferences(client)
      if (result.error) throw new Error(result.error)
      return result.data ?? DEFAULT_PREFERENCES
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useUpdatePreferences() {
  const client = useSupabaseClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: Partial<PreferencesData>) => {
      const validation = preferencesUpdateSchema.safeParse(payload)
      if (!validation.success) {
        throw new Error(validation.error.issues[0]?.message || 'Validation failed')
      }

      const result = await updatePreferences(client, payload)
      if (result.error) throw new Error(result.error)
      return result.data
    },
    onMutate: async (newPrefs) => {
      await queryClient.cancelQueries({ queryKey: preferencesKeys.current() })
      const previous = queryClient.getQueryData<PreferencesData>(preferencesKeys.current())

      queryClient.setQueryData(preferencesKeys.current(), (old: PreferencesData | undefined) => ({
        ...old,
        ...newPrefs,
      }))

      return { previous }
    },
    onError: (_err, _newPrefs, context) => {
      if (context?.previous) {
        queryClient.setQueryData(preferencesKeys.current(), context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: preferencesKeys.current() })
    },
  })
}
```

---

### 6. Update Settings Page
**Modify:** `app/pages/settings.vue`

Changes:
- Import `usePreferencesQuery`, `useUpdatePreferences`
- Replace localStorage `preferences` ref with query data
- Update `savePreferences()` to use mutation
- Remove `onMounted` localStorage loading
- Keep theme handling via Nuxt color-mode (unchanged)

---

### 7. Tests
**Create:** `app/lib/supabase/preferences.test.ts`

Test cases:
- Authenticated user can read preferences
- Authenticated user can update preferences
- Unauthenticated user gets auth error
- Constraint enforcement (duration 5-480 or null)

**Modify:** `app/lib/supabase/test-utils.ts`
- No changes needed (preferences are in user_profiles, which is auto-cleaned)

---

### 8. Update Documentation
**Modify:** `docs/05-database-schema.md`
- Update user_profiles section with new columns
- Remove separate user_preferences table section

**Modify:** `docs/07-development-roadmap.md`
- Update Phase 8 to reflect extending user_profiles

**Modify:** `docs/USER_SETTINGS.md`
- Update to reflect simplified preferences in user_profiles

**Modify:** `PLAN.md`
- Update task description to reflect extending user_profiles

---

## Files to Create
| File | Purpose |
|------|---------|
| `supabase/migrations/20260109XXXXXX_add_user_preferences_columns.sql` | Add columns to user_profiles |
| `app/lib/supabase/preferences.ts` | Database layer for preferences |
| `app/schemas/preferences.ts` | Zod validation |
| `app/composables/usePreferences.ts` | TanStack Query hooks |
| `app/lib/supabase/preferences.test.ts` | Integration tests |

## Files to Modify
| File | Change |
|------|--------|
| `app/types/database.types.ts` | Regenerated (auto) |
| `app/pages/settings.vue` | Replace localStorage with composable |
| `docs/05-database-schema.md` | Update user_profiles, remove user_preferences section |
| `docs/07-development-roadmap.md` | Update Phase 8 |
| `docs/USER_SETTINGS.md` | Reflect simplified preferences |
| `PLAN.md` | Update task description |

---

## Verification Checklist
- [ ] Migration applies without errors
- [ ] Types regenerate successfully
- [ ] Tests pass: `npm run test:run`
- [ ] Settings page loads preferences from database
- [ ] Changes persist across page refresh
- [ ] New users get default preferences on signup
- [ ] Existing users have columns with defaults
