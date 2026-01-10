<script setup lang="ts">
import { useAuthUser } from '~/composables/useAuthUser';
import { usePreferencesQuery, useUpdatePreferences } from '~/composables/usePreferences';
import { useSupabaseClient } from '#imports';
import { PREFERENCES } from '~/constants';

definePageMeta({
  title: 'Settings',
  middleware: 'auth',
});

useSeoMeta({
  title: 'Settings - LifeStint',
  description: 'Manage your account settings and preferences.',
});

const supabase = useSupabaseClient();
const user = useAuthUser();
const toast = useToast();

// Account form
const accountForm = ref({
  email: '',
  fullName: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
});

// Preferences - loaded from database
const { data: preferencesData, isPending: isLoadingPreferences } = usePreferencesQuery();
const updatePreferencesMutation = useUpdatePreferences();

// Local UI state for form controls (synced with database data)
const localDefaultStintDuration = ref<number>(PREFERENCES.STINT_DURATION.DEFAULT);
const localCelebrationAnimation = ref(true);
const localDesktopNotifications = ref(false);

// Sync local state when preferences load
watch(preferencesData, (data) => {
  if (data) {
    localDefaultStintDuration.value = data.defaultStintDuration ?? PREFERENCES.STINT_DURATION.DEFAULT;
    localCelebrationAnimation.value = data.celebrationAnimation;
    localDesktopNotifications.value = data.desktopNotifications;
  }
}, { immediate: true });

// Security
const activeSessions = ref<Array<{ id: string, device: string, location: string, lastActive: string, isCurrent: boolean }>>([]);

// Privacy
const analyticsOptOut = ref(false);

// Subscription (mock data for now)
const subscription = ref({
  plan: 'Free',
  activeProjects: 5,
  maxProjects: 25,
  dataExports: 2,
  maxExports: 5,
});

// Load user data
onMounted(async () => {
  if (user.value) {
    accountForm.value.email = user.value.email || '';

    // Load timezone from user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('timezone')
      .eq('id', user.value.id)
      .single();

    if (profile?.timezone) {
      accountForm.value.timezone = profile.timezone;
    }
  }
});

// Account actions
const isSavingAccount = ref(false);

async function saveAccountChanges() {
  isSavingAccount.value = true;
  try {
    // Update email if changed
    if (accountForm.value.email !== user.value?.email) {
      const { error } = await supabase.auth.updateUser({
        email: accountForm.value.email,
      });

      if (error) throw error;

      toast.add({
        title: 'Email update sent',
        description: 'Please check your email to confirm the new address',
        color: 'info',
        icon: 'i-lucide-mail',
      });
    }

    // Save timezone to user_profiles
    if (user.value?.id) {
      const { error: tzError } = await supabase
        .from('user_profiles')
        .update({ timezone: accountForm.value.timezone })
        .eq('id', user.value.id);

      if (tzError) throw tzError;
    }

    toast.add({
      title: 'Settings saved',
      color: 'success',
      icon: 'i-lucide-check-circle',
    });
  }
  catch (error) {
    toast.add({
      title: 'Failed to save settings',
      description: error instanceof Error ? error.message : 'An error occurred',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
  }
  finally {
    isSavingAccount.value = false;
  }
}

const showPasswordDialog = ref(false);
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

async function changePassword() {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    toast.add({
      title: 'Passwords do not match',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
    return;
  }

  try {
    const { error } = await supabase.auth.updateUser({
      password: passwordForm.value.newPassword,
    });

    if (error) throw error;

    toast.add({
      title: 'Password updated',
      color: 'success',
      icon: 'i-lucide-check-circle',
    });

    showPasswordDialog.value = false;
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };
  }
  catch (error) {
    toast.add({
      title: 'Failed to update password',
      description: error instanceof Error ? error.message : 'An error occurred',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
  }
}

// Preferences actions
const isSavingPreferences = computed(() => updatePreferencesMutation.isPending.value);

async function savePreferences() {
  try {
    await updatePreferencesMutation.mutateAsync({
      defaultStintDuration: localDefaultStintDuration.value,
      celebrationAnimation: localCelebrationAnimation.value,
      desktopNotifications: localDesktopNotifications.value,
    });

    toast.add({
      title: 'Preferences saved',
      color: 'success',
      icon: 'i-lucide-check-circle',
    });
  }
  catch (error) {
    toast.add({
      title: 'Failed to save preferences',
      description: error instanceof Error ? error.message : 'An error occurred',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
  }
}

async function requestNotificationPermission() {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      localDesktopNotifications.value = true;
      await savePreferences();
      toast.add({
        title: 'Notifications enabled',
        color: 'success',
        icon: 'i-lucide-check-circle',
      });
    }
    else {
      toast.add({
        title: 'Notification permission denied',
        color: 'warning',
        icon: 'i-lucide-alert-circle',
      });
    }
  }
}

// Security actions
async function logoutSession(_sessionId: string) {
  try {
    // In a real app, you'd call an API to invalidate the session
    // For now, we'll just show a message
    toast.add({
      title: 'Session logged out',
      color: 'success',
      icon: 'i-lucide-check-circle',
    });
  }
  catch (error) {
    toast.add({
      title: 'Failed to logout session',
      description: error instanceof Error ? error.message : 'An error occurred',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
  }
}

// Privacy actions
function exportData() {
  // Export user data as JSON
  const exportDataPayload = {
    account: {
      email: accountForm.value.email,
      fullName: accountForm.value.fullName,
    },
    preferences: {
      defaultStintDuration: localDefaultStintDuration.value,
      celebrationAnimation: localCelebrationAnimation.value,
      desktopNotifications: localDesktopNotifications.value,
    },
    exportDate: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(exportDataPayload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lifestint-export-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  toast.add({
    title: 'Data exported',
    description: 'Your data has been downloaded',
    color: 'success',
    icon: 'i-lucide-download',
  });
}

const showDeleteAccountDialog = ref(false);
const deleteConfirmText = ref('');

async function deleteAccount() {
  if (deleteConfirmText.value !== accountForm.value.email) {
    toast.add({
      title: 'Email does not match',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
    return;
  }

  try {
    // In a real app, you'd call an API to delete the account
    toast.add({
      title: 'Account deletion requested',
      description: 'This action cannot be undone',
      color: 'warning',
      icon: 'i-lucide-alert-triangle',
    });

    showDeleteAccountDialog.value = false;
    deleteConfirmText.value = '';
  }
  catch (error) {
    toast.add({
      title: 'Failed to delete account',
      description: error instanceof Error ? error.message : 'An error occurred',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
  }
}

// Timezone options - use browser's full list with user's timezone guaranteed
const timezones = computed(() => {
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Get all supported timezones from the browser
  let allTimezones: string[] = [];
  try {
    allTimezones = Intl.supportedValuesOf('timeZone');
  }
  catch {
    // Fallback for older browsers
    allTimezones = [
      'Africa/Cairo', 'Africa/Johannesburg', 'Africa/Lagos', 'Africa/Nairobi',
      'America/Anchorage', 'America/Argentina/Buenos_Aires', 'America/Bogota',
      'America/Chicago', 'America/Denver', 'America/Halifax', 'America/Lima',
      'America/Los_Angeles', 'America/Mexico_City', 'America/New_York',
      'America/Phoenix', 'America/Santiago', 'America/Sao_Paulo', 'America/Toronto',
      'America/Vancouver', 'Asia/Bangkok', 'Asia/Colombo', 'Asia/Dubai',
      'Asia/Hong_Kong', 'Asia/Jakarta', 'Asia/Jerusalem', 'Asia/Karachi',
      'Asia/Kolkata', 'Asia/Kuala_Lumpur', 'Asia/Manila', 'Asia/Seoul',
      'Asia/Shanghai', 'Asia/Singapore', 'Asia/Taipei', 'Asia/Tokyo',
      'Atlantic/Reykjavik', 'Australia/Melbourne', 'Australia/Perth',
      'Australia/Sydney', 'Europe/Amsterdam', 'Europe/Athens', 'Europe/Berlin',
      'Europe/Brussels', 'Europe/Dublin', 'Europe/Helsinki', 'Europe/Istanbul',
      'Europe/Lisbon', 'Europe/London', 'Europe/Madrid', 'Europe/Moscow',
      'Europe/Paris', 'Europe/Prague', 'Europe/Rome', 'Europe/Stockholm',
      'Europe/Vienna', 'Europe/Warsaw', 'Europe/Zurich', 'Pacific/Auckland',
      'Pacific/Honolulu', 'UTC',
    ];
  }

  // Ensure user's browser timezone is in the list
  if (!allTimezones.includes(browserTimezone)) {
    allTimezones = [browserTimezone, ...allTimezones];
  }

  return allTimezones;
});
</script>

<template>
  <UContainer>
    <div class="space-y-6">
      <!-- Page Header -->
      <div>
        <h1 class="text-3xl font-semibold text-stone-800 dark:text-stone-50">
          Settings
        </h1>
        <p class="mt-2 text-stone-600 dark:text-stone-400">
          Manage your account settings and preferences
        </p>
      </div>

      <!-- Account Section -->
      <UCard class="bg-white/80 shadow-sm backdrop-blur transition-colors duration-200 dark:border-stone-700 dark:bg-stone-800">
        <template #header>
          <div class="flex items-center gap-2">
            <Icon
              name="i-lucide-user"
              class="h-5 w-5"
            />
            <h2 class="text-lg font-medium text-stone-800 dark:text-stone-50">
              Account
            </h2>
          </div>
        </template>

        <div class="space-y-4">
          <UFormField
            label="Email"
            name="email"
          >
            <UInput
              v-model="accountForm.email"
              type="email"
              placeholder="your@email.com"
            />
            <template #hint>
              <div class="flex items-center gap-1 mt-1">
                <Icon
                  name="i-lucide-check-circle"
                  class="h-4 w-4 text-green-600"
                />
                <span class="text-xs text-stone-500 dark:text-stone-400">
                  Verified
                </span>
              </div>
            </template>
          </UFormField>

          <UFormField
            label="Full Name"
            name="fullName"
          >
            <UInput
              v-model="accountForm.fullName"
              placeholder="Your name"
            />
          </UFormField>

          <UFormField
            label="Timezone"
            name="timezone"
          >
            <select
              v-model="accountForm.timezone"
              class="w-full rounded-md border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400"
            >
              <option
                v-for="tz in timezones"
                :key="tz"
                :value="tz"
              >
                {{ tz }}
              </option>
            </select>
          </UFormField>

          <div class="flex items-center gap-3 pt-2">
            <UButton
              variant="ghost"
              @click="showPasswordDialog = true"
            >
              Change Password
            </UButton>
            <UButton
              color="primary"
              :loading="isSavingAccount"
              @click="saveAccountChanges"
            >
              Save Changes
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Preferences Section -->
      <UCard class="bg-white/80 shadow-sm backdrop-blur transition-colors duration-200 dark:border-stone-700 dark:bg-stone-800">
        <template #header>
          <div class="flex items-center gap-2">
            <Icon
              name="i-lucide-palette"
              class="h-5 w-5"
            />
            <h2 class="text-lg font-medium text-stone-800 dark:text-stone-50">
              Preferences
            </h2>
          </div>
        </template>

        <div class="space-y-6">
          <UFormField
            label="Default Stint Duration"
            name="defaultStintDuration"
          >
            <template v-if="isLoadingPreferences">
              <div class="h-8 bg-stone-100 dark:bg-stone-700 rounded animate-pulse" />
            </template>
            <template v-else>
              <input
                v-model.number="localDefaultStintDuration"
                type="range"
                :min="PREFERENCES.STINT_DURATION.MIN"
                :max="PREFERENCES.STINT_DURATION.MAX"
                step="5"
                class="w-full"
              >
              <div class="flex justify-between text-xs text-stone-500 dark:text-stone-400 mt-1">
                <span>{{ PREFERENCES.STINT_DURATION.MIN }}m</span>
                <span>{{ localDefaultStintDuration }}m</span>
                <span>{{ PREFERENCES.STINT_DURATION.MAX }}m</span>
              </div>
            </template>
          </UFormField>

          <UFormField
            label="Theme"
            name="theme"
            hint="Theme preference is stored locally in your browser"
          >
            <UColorModeSelect />
          </UFormField>

          <div class="space-y-4">
            <UFormField
              label="Celebration Animation"
              name="celebrationAnimation"
              hint="Show confetti when daily goal is reached"
            >
              <USwitch
                v-model="localCelebrationAnimation"
                :disabled="isLoadingPreferences"
              />
            </UFormField>

            <UFormField
              label="Desktop Notifications"
              name="desktopNotifications"
              hint="Get notified when stints complete"
            >
              <div class="flex items-center gap-3">
                <USwitch
                  v-model="localDesktopNotifications"
                  :disabled="isLoadingPreferences"
                />
                <UButton
                  v-if="!localDesktopNotifications"
                  size="sm"
                  variant="ghost"
                  @click="requestNotificationPermission"
                >
                  Enable
                </UButton>
              </div>
            </UFormField>
          </div>

          <UButton
            color="primary"
            :loading="isSavingPreferences"
            @click="savePreferences"
          >
            Save Preferences
          </UButton>
        </div>
      </UCard>

      <!-- Security Section -->
      <UCard class="bg-white/80 shadow-sm backdrop-blur transition-colors duration-200 dark:border-stone-700 dark:bg-stone-800">
        <template #header>
          <div class="flex items-center gap-2">
            <Icon
              name="i-lucide-shield"
              class="h-5 w-5"
            />
            <h2 class="text-lg font-medium text-stone-800 dark:text-stone-50">
              Security
            </h2>
          </div>
        </template>

        <div class="space-y-4">
          <div>
            <h3 class="text-sm font-medium text-stone-800 dark:text-stone-50 mb-3">
              Active Sessions
            </h3>
            <div
              v-if="activeSessions.length === 0"
              class="text-sm text-stone-500 dark:text-stone-400"
            >
              <p>Current session only</p>
            </div>
            <div
              v-else
              class="space-y-3"
            >
              <div
                v-for="session in activeSessions"
                :key="session.id"
                class="flex items-center justify-between p-3 rounded-lg border border-stone-200 dark:border-stone-700"
              >
                <div>
                  <div class="flex items-center gap-2">
                    <p class="font-medium">
                      {{ session.device }}
                    </p>
                    <UBadge
                      v-if="session.isCurrent"
                      color="success"
                      variant="soft"
                      size="sm"
                    >
                      Current
                    </UBadge>
                  </div>
                  <p class="text-sm text-stone-500 dark:text-stone-400">
                    {{ session.location }} · {{ session.lastActive }}
                  </p>
                </div>
                <UButton
                  v-if="!session.isCurrent"
                  size="sm"
                  variant="ghost"
                  color="error"
                  @click="logoutSession(session.id)"
                >
                  Logout
                </UButton>
              </div>
            </div>
          </div>

          <UButton
            variant="ghost"
            @click="showPasswordDialog = true"
          >
            Change Password
          </UButton>
        </div>
      </UCard>

      <!-- Privacy Section -->
      <UCard class="bg-white/80 shadow-sm backdrop-blur transition-colors duration-200 dark:border-stone-700 dark:bg-stone-800">
        <template #header>
          <div class="flex items-center gap-2">
            <Icon
              name="i-lucide-eye"
              class="h-5 w-5"
            />
            <h2 class="text-lg font-medium text-stone-800 dark:text-stone-50">
              Privacy
            </h2>
          </div>
        </template>

        <div class="space-y-4">
          <UButton
            color="primary"
            variant="outline"
            @click="exportData"
          >
            <Icon
              name="i-lucide-download"
              class="h-4 w-4 mr-2"
            />
            Export Data
          </UButton>

          <UFormField
            label="Analytics Opt-out"
            name="analyticsOptOut"
            hint="Disable usage analytics collection"
          >
            <USwitch v-model="analyticsOptOut" />
          </UFormField>

          <div class="pt-2 border-t border-stone-200 dark:border-stone-700">
            <UButton
              color="error"
              variant="outline"
              @click="showDeleteAccountDialog = true"
            >
              <Icon
                name="i-lucide-trash"
                class="h-4 w-4 mr-2"
              />
              Delete Account
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Subscription Section -->
      <UCard class="bg-white/80 shadow-sm backdrop-blur transition-colors duration-200 dark:border-stone-700 dark:bg-stone-800">
        <template #header>
          <div class="flex items-center gap-2">
            <Icon
              name="i-lucide-crown"
              class="h-5 w-5"
            />
            <h2 class="text-lg font-semibold">
              Subscription
            </h2>
          </div>
        </template>

        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium">
                Current Plan
              </p>
              <UBadge
                color="neutral"
                variant="soft"
                class="mt-1"
              >
                {{ subscription.plan }} Plan
              </UBadge>
            </div>
            <UButton
              variant="outline"
              color="primary"
            >
              Upgrade to Pro
            </UButton>
          </div>

          <div class="space-y-3 pt-2">
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm text-stone-600 dark:text-stone-400">
                  Active Projects
                </span>
                <span class="text-sm font-medium">
                  {{ subscription.activeProjects }} / {{ subscription.maxProjects }}
                </span>
              </div>
              <div class="h-2 bg-stone-100 dark:bg-stone-800 rounded overflow-hidden">
                <div
                  class="h-full bg-orange-600 transition-all duration-500"
                  :style="{ width: `${(subscription.activeProjects / subscription.maxProjects) * 100}%` }"
                />
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm text-stone-600 dark:text-stone-400">
                  Data Exports
                </span>
                <span class="text-sm font-medium">
                  {{ subscription.dataExports }} / {{ subscription.maxExports }}
                </span>
              </div>
              <div class="h-2 bg-stone-100 dark:bg-stone-800 rounded overflow-hidden">
                <div
                  class="h-full bg-green-600 transition-all duration-500"
                  :style="{ width: `${(subscription.dataExports / subscription.maxExports) * 100}%` }"
                />
              </div>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Password Change Dialog -->
    <UModal
      v-model:open="showPasswordDialog"
      title="Change Password"
      :ui="{ footer: 'justify-end' }"
    >
      <template #body>
        <div class="space-y-4">
          <UFormField
            label="Current Password"
            name="currentPassword"
          >
            <UInput
              v-model="passwordForm.currentPassword"
              type="password"
              placeholder="Enter current password"
            />
          </UFormField>

          <UFormField
            label="New Password"
            name="newPassword"
          >
            <UInput
              v-model="passwordForm.newPassword"
              type="password"
              placeholder="Enter new password"
            />
          </UFormField>

          <UFormField
            label="Confirm New Password"
            name="confirmPassword"
          >
            <UInput
              v-model="passwordForm.confirmPassword"
              type="password"
              placeholder="Confirm new password"
            />
          </UFormField>
        </div>
      </template>

      <template #footer>
        <UButton
          variant="ghost"
          @click="showPasswordDialog = false"
        >
          Cancel
        </UButton>
        <UButton
          color="primary"
          @click="changePassword"
        >
          Update Password
        </UButton>
      </template>
    </UModal>

    <!-- Delete Account Dialog -->
    <UModal
      v-model:open="showDeleteAccountDialog"
      title="Delete Account"
      :ui="{ footer: 'justify-end' }"
    >
      <template #body>
        <div class="space-y-4">
          <UAlert
            color="error"
            variant="soft"
            icon="i-lucide-alert-triangle"
          >
            This action cannot be undone. All your data will be permanently deleted.
          </UAlert>

          <UFormField
            label="Type your email to confirm"
            name="deleteConfirm"
          >
            <UInput
              v-model="deleteConfirmText"
              type="email"
              placeholder="your@email.com"
            />
          </UFormField>
        </div>
      </template>

      <template #footer>
        <UButton
          variant="ghost"
          @click="showDeleteAccountDialog = false"
        >
          Cancel
        </UButton>
        <UButton
          color="error"
          :disabled="deleteConfirmText !== accountForm.email"
          @click="deleteAccount"
        >
          Delete Account
        </UButton>
      </template>
    </UModal>
  </UContainer>
</template>
