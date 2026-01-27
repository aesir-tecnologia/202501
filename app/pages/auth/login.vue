<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import { loginSchema, type LoginPayload } from '~/schemas/auth';

definePageMeta({
  layout: false,
  middleware: 'guest',
});

useSeoMeta({
  title: 'Sign In - LifeStint',
  description: 'Sign in to your LifeStint account to start tracking your focus sessions.',
});

const appConfig = useAppConfig();
const supabase = useSupabaseClient();

const state = reactive<LoginPayload>({
  email: '',
  password: '',
  remember: false,
});

const loading = ref(false);
const error = ref('');
const success = ref('');

async function handleLogin(event: FormSubmitEvent<LoginPayload>) {
  loading.value = true;
  error.value = '';
  success.value = '';

  try {
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: event.data.email,
      password: event.data.password,
    });

    if (authError) {
      throw authError;
    }

    if (data.user) {
      if (!data.user.email_confirmed_at) {
        error.value = 'Please check your email and click the confirmation link before signing in.';
        return;
      }

      success.value = 'Successfully signed in! Redirecting...';

      navigateTo(appConfig.auth.redirectUrl);
    }
  }
  catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    switch (errorMessage) {
      case 'Invalid login credentials':
        error.value = 'Invalid email or password. Please try again.';
        break;
      case 'Email not confirmed':
        error.value = 'Please check your email and confirm your account before signing in.';
        break;
      case 'Too many requests':
        error.value = 'Too many login attempts. Please wait a moment and try again.';
        break;
      default:
        error.value = errorMessage || 'An unexpected error occurred. Please try again.';
    }
  }
  finally {
    loading.value = false;
  }
}

watch(() => state.email, () => {
  error.value = '';
  success.value = '';
});

watch(() => state.password, () => {
  error.value = '';
  success.value = '';
});
</script>

<template>
  <UApp>
    <div class="min-h-screen flex items-center justify-center bg-[#fffbf5] py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 dark:bg-stone-900">
      <div class="max-w-md w-full space-y-8 text-stone-800 dark:text-stone-50">
        <!-- Header Section -->
        <div class="text-center space-y-3">
          <NuxtLink
            to="/"
            class="inline-flex items-center gap-2 text-stone-500 hover:text-orange-700 dark:text-stone-400 dark:hover:text-orange-500 transition-colors mb-4"
          >
            <UIcon
              name="i-lucide-arrow-left"
              class="size-4"
            />
            <span class="text-sm font-medium">Back to home</span>
          </NuxtLink>
          <h2 class="text-3xl font-serif font-semibold text-stone-800 dark:text-stone-50">
            Welcome back
          </h2>
          <p class="text-sm text-stone-600 dark:text-stone-400">
            Don't have an account?
            <NuxtLink
              to="/auth/register"
              class="font-medium text-orange-700 hover:text-orange-800 dark:text-orange-500 dark:hover:text-orange-400 transition-colors"
            >
              Sign up here
            </NuxtLink>
          </p>
        </div>

        <!-- Form Card -->
        <UCard class="p-8 bg-white shadow-warm border border-stone-200 rounded-2xl transition-colors duration-300 dark:border-stone-700 dark:bg-stone-800">
          <UForm
            :schema="loginSchema"
            :state="state"
            class="space-y-6"
            @submit="handleLogin"
          >
            <!-- Email Field -->
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
                :disabled="loading"
                class="w-full"
                size="lg"
              />
            </UFormField>

            <!-- Password Field -->
            <UFormField
              label="Password"
              name="password"
              required
            >
              <UInput
                v-model="state.password"
                type="password"
                placeholder="Enter your password"
                autocomplete="current-password"
                :disabled="loading"
                class="w-full"
                size="lg"
              />
            </UFormField>

            <!-- Remember & Forgot -->
            <div class="flex items-center justify-between">
              <UCheckbox
                v-model="state.remember"
                :disabled="loading"
              >
                <template #label>
                  <span class="text-sm text-stone-600 dark:text-stone-400">Remember me</span>
                </template>
              </UCheckbox>

              <NuxtLink
                to="/auth/forgot-password"
                class="text-sm font-medium text-orange-700 hover:text-orange-800 dark:text-orange-500 dark:hover:text-orange-400 transition-colors"
              >
                Forgot your password?
              </NuxtLink>
            </div>

            <!-- Submit Button -->
            <UButton
              type="submit"
              color="primary"
              :loading="loading"
              :disabled="loading"
              class="w-full"
              size="lg"
            >
              {{ loading ? 'Signing in...' : 'Sign in' }}
            </UButton>
          </UForm>

          <!-- Error Alert -->
          <UAlert
            v-if="error"
            icon="i-lucide-triangle-alert"
            color="error"
            variant="soft"
            :title="error"
            class="mt-4"
          />

          <!-- Success Alert -->
          <UAlert
            v-if="success"
            icon="i-lucide-circle-check"
            color="success"
            variant="soft"
            :title="success"
            class="mt-4"
          />
        </UCard>
      </div>
    </div>
  </UApp>
</template>
