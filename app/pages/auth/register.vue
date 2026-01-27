<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import { registerSchema, type RegisterPayload } from '~/schemas/auth';

definePageMeta({
  layout: false,
  middleware: 'guest',
  pageTransition: {
    name: 'auth-transition',
    mode: 'out-in',
  },
});

useSeoMeta({
  title: 'Sign Up - LifeStint',
  description: 'Create your LifeStint account to start tracking your focus sessions and boost your productivity.',
});

// Form state
const state = reactive<RegisterPayload>({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false,
});

// UI state
const loading = ref(false);
const error = ref('');
const success = ref('');
const successDescription = ref('');

// Password requirement checks
const hasMinLength = computed(() => state.password.length >= 8);
const hasUppercase = computed(() => /[A-Z]/.test(state.password));
const hasLowercase = computed(() => /[a-z]/.test(state.password));
const hasNumber = computed(() => /\d/.test(state.password));
const hasSpecialChar = computed(() => /[@$!%*?&]/.test(state.password));

// Password strength computation
const passwordStrength = computed(() => {
  if (!state.password) {
    return { level: 'none', percentage: 0, color: 'neutral' as const };
  }

  const requirementsMet = [
    hasMinLength.value,
    hasUppercase.value,
    hasLowercase.value,
    hasNumber.value,
    hasSpecialChar.value,
  ].filter(Boolean).length;

  // Bonus for extra length
  const lengthBonus = Math.min(state.password.length - 8, 4) * 0.1;
  const baseScore = requirementsMet / 5;
  const totalScore = Math.max(0, Math.min(baseScore + lengthBonus, 1));

  if (totalScore < 0.4) {
    return { level: 'Weak', percentage: totalScore * 100, color: 'error' as const };
  }
  else if (totalScore < 0.7) {
    return { level: 'Fair', percentage: totalScore * 100, color: 'warning' as const };
  }
  else if (totalScore < 0.9) {
    return { level: 'Good', percentage: totalScore * 100, color: 'info' as const };
  }
  else {
    return { level: 'Strong', percentage: totalScore * 100, color: 'success' as const };
  }
});

// Supabase client
const supabase = useSupabaseClient();
const user = useAuthUser();
const appConfig = useAppConfig();

// Redirect if already logged in
watch(user, (newUser) => {
  if (newUser) {
    navigateTo(appConfig.auth.redirectUrl);
  }
});

// Handle form submission
async function handleRegister(event: FormSubmitEvent<RegisterPayload>) {
  loading.value = true;
  error.value = '';
  success.value = '';
  successDescription.value = '';

  try {
    const { data, error: authError } = await supabase.auth.signUp({
      email: event.data.email,
      password: event.data.password,
      options: {
        data: {
          full_name: event.data.fullName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      throw authError;
    }

    if (data.user) {
      // Check if email is confirmed
      if (data.user.email_confirmed_at) {
        // Auto-confirmed (development mode)
        success.value = 'Account created successfully!';
        successDescription.value = 'You are now signed in. Redirecting to dashboard...';

        navigateTo(appConfig.auth.redirectUrl);
      }
      else {
        // Email confirmation required - redirect to verification page
        navigateTo({
          path: '/auth/verify-email',
          query: { email: event.data.email },
        });
      }
    }
  }
  catch (err: unknown) {
    console.error('Registration error:', err);

    // Handle specific error types
    const errorMessage = err instanceof Error ? err.message : String(err);
    switch (errorMessage) {
      case 'User already registered':
        error.value = 'An account with this email already exists. Please sign in instead.';
        break;
      case 'Password should be at least 6 characters':
        error.value = 'Password must be at least 6 characters long.';
        break;
      case 'Signup is disabled':
        error.value = 'Account registration is currently disabled. Please contact support.';
        break;
      case 'Invalid email':
        error.value = 'Please enter a valid email address.';
        break;
      default:
        error.value = errorMessage || 'An unexpected error occurred during registration. Please try again.';
    }
  }
  finally {
    loading.value = false;
  }
}

// Clear messages when user starts typing
watch([() => state.email, () => state.password, () => state.confirmPassword], () => {
  error.value = '';
  success.value = '';
});
</script>

<template>
  <div>
    <UApp>
      <div class="min-h-screen flex items-center justify-center bg-[#fffbf5] py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 dark:bg-stone-900">
        <div class="max-w-md w-full space-y-8 text-stone-800 dark:text-stone-50">
          <div class="text-center space-y-4">
            <!-- Logo -->
            <NuxtLink
              to="/"
              class="block"
            >
              <span class="text-2xl font-serif">
                <span class="text-stone-900 dark:text-white">Life</span><span class="italic text-orange-600 dark:text-orange-500">Stint</span>
              </span>
            </NuxtLink>

            <h2 class="text-3xl font-serif font-semibold text-stone-800 dark:text-stone-50">
              Create your account
            </h2>
            <p class="text-sm text-stone-600 dark:text-stone-400">
              Already have an account?
              <NuxtLink
                to="/auth/login"
                class="font-medium text-orange-700 hover:text-orange-800 dark:text-orange-500 dark:hover:text-orange-400 transition-colors"
              >
                Sign in here
              </NuxtLink>
            </p>
          </div>

          <UCard class="p-8 bg-white shadow-warm border border-stone-200 rounded-2xl transition-colors duration-300 dark:border-stone-700 dark:bg-stone-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <UForm
              :schema="registerSchema"
              :state="state"
              class="space-y-6"
              @submit="handleRegister"
            >
              <UFormField
                label="Full Name"
                name="fullName"
                required
              >
                <UInput
                  v-model="state.fullName"
                  placeholder="Enter your full name"
                  autocomplete="name"
                  size="lg"
                  :disabled="loading"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="Email address"
                name="email"
                required
              >
                <UInput
                  v-model="state.email"
                  type="email"
                  placeholder="Enter your email"
                  autocomplete="email"
                  size="lg"
                  :disabled="loading"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="Password"
                name="password"
                required
              >
                <UInput
                  v-model="state.password"
                  type="password"
                  placeholder="Create a password"
                  autocomplete="new-password"
                  size="lg"
                  :disabled="loading"
                  class="w-full"
                />
              </UFormField>

              <!-- Password Requirements Checklist -->
              <div
                v-if="state.password"
                class="text-xs space-y-1 -mt-4 mb-2"
              >
                <div
                  :class="hasMinLength ? 'text-success-700 dark:text-success-400' : 'text-stone-500 dark:text-stone-400'"
                  class="flex items-center gap-1.5"
                >
                  <UIcon
                    :name="hasMinLength ? 'i-lucide-check-circle' : 'i-lucide-circle'"
                    class="h-4 w-4"
                  />
                  <span>At least 8 characters</span>
                </div>
                <div
                  :class="hasUppercase ? 'text-success-700 dark:text-success-400' : 'text-stone-500 dark:text-stone-400'"
                  class="flex items-center gap-1.5"
                >
                  <UIcon
                    :name="hasUppercase ? 'i-lucide-check-circle' : 'i-lucide-circle'"
                    class="h-4 w-4"
                  />
                  <span>One uppercase letter</span>
                </div>
                <div
                  :class="hasLowercase ? 'text-success-700 dark:text-success-400' : 'text-stone-500 dark:text-stone-400'"
                  class="flex items-center gap-1.5"
                >
                  <UIcon
                    :name="hasLowercase ? 'i-lucide-check-circle' : 'i-lucide-circle'"
                    class="h-4 w-4"
                  />
                  <span>One lowercase letter</span>
                </div>
                <div
                  :class="hasNumber ? 'text-success-700 dark:text-success-400' : 'text-stone-500 dark:text-stone-400'"
                  class="flex items-center gap-1.5"
                >
                  <UIcon
                    :name="hasNumber ? 'i-lucide-check-circle' : 'i-lucide-circle'"
                    class="h-4 w-4"
                  />
                  <span>One number</span>
                </div>
                <div
                  :class="hasSpecialChar ? 'text-success-700 dark:text-success-400' : 'text-stone-500 dark:text-stone-400'"
                  class="flex items-center gap-1.5"
                >
                  <UIcon
                    :name="hasSpecialChar ? 'i-lucide-check-circle' : 'i-lucide-circle'"
                    class="h-4 w-4"
                  />
                  <span>One special character (@$!%*?&)</span>
                </div>
              </div>
              <div
                v-else
                class="text-xs text-stone-500 dark:text-stone-400 -mt-4 mb-2"
              >
                Password must be at least 8 characters with uppercase, lowercase, number, and special
                character
              </div>

              <!-- Password Strength Indicator -->
              <div
                v-if="state.password && passwordStrength.level !== 'none'"
                class="-mt-2 mb-4"
              >
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-xs font-medium text-stone-700 dark:text-stone-300">
                    Password Strength:
                  </span>
                  <span
                    class="text-xs font-semibold"
                    :class="{
                      'text-error-600 dark:text-error-400': passwordStrength.color === 'error',
                      'text-warning-600 dark:text-warning-400': passwordStrength.color === 'warning',
                      'text-info-600 dark:text-info-400': passwordStrength.color === 'info',
                      'text-success-600 dark:text-success-400': passwordStrength.color === 'success',
                    }"
                  >
                    {{ passwordStrength.level }}
                  </span>
                </div>
                <UProgress
                  :model-value="passwordStrength.percentage"
                  :color="passwordStrength.color"
                  size="sm"
                />
              </div>

              <UFormField
                label="Confirm Password"
                name="confirmPassword"
                required
              >
                <UInput
                  v-model="state.confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  autocomplete="new-password"
                  size="lg"
                  :disabled="loading"
                  class="w-full"
                />
              </UFormField>

              <div class="space-y-3 text-stone-600 dark:text-stone-400">
                <UCheckbox
                  v-model="state.acceptTerms"
                  :disabled="loading"
                  required
                >
                  <template #label>
                    <span class="text-sm">
                      I agree to the
                      <NuxtLink
                        to="/legal/terms"
                        class="text-orange-700 hover:text-orange-800 font-medium dark:text-orange-500 dark:hover:text-orange-400 transition-colors"
                        target="_blank"
                      >
                        Terms of Service
                      </NuxtLink>
                      and
                      <NuxtLink
                        to="/legal/privacy"
                        class="text-orange-700 hover:text-orange-800 font-medium dark:text-orange-500 dark:hover:text-orange-400 transition-colors"
                        target="_blank"
                      >
                        Privacy Policy
                      </NuxtLink>
                    </span>
                  </template>
                </UCheckbox>
              </div>

              <UButton
                type="submit"
                color="primary"
                :loading="loading"
                :disabled="loading || !state.acceptTerms"
                class="w-full"
                size="lg"
              >
                {{ loading ? 'Creating account...' : 'Create account' }}
              </UButton>
            </UForm>

            <UAlert
              v-if="error"
              icon="i-lucide-triangle-alert"
              color="error"
              variant="soft"
              :title="error"
              class="mt-4"
            />

            <UAlert
              v-if="success"
              icon="i-lucide-circle-check"
              color="success"
              variant="soft"
              :title="success"
              :description="successDescription"
              class="mt-4"
            />
          </UCard>
        </div>
      </div>
    </UApp>
  </div>
</template>
