<template>
  <UApp>
    <div class="min-h-screen flex items-center justify-center bg-[#fffbf5] py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 dark:bg-stone-900">
      <div class="max-w-md w-full space-y-8 text-stone-800 dark:text-stone-50">
        <div class="text-center space-y-3">
          <NuxtLink
            to="/"
            class="inline-flex items-center gap-2 text-stone-500 hover:text-orange-700 dark:text-stone-400 dark:hover:text-orange-500 transition-colors mb-4"
          >
            <UIcon name="i-lucide-arrow-left" class="size-4" />
            <span class="text-sm font-medium">Back to home</span>
          </NuxtLink>
          <h2 class="text-3xl font-serif font-semibold text-stone-800 dark:text-stone-50">
            Reset your password
          </h2>
          <p class="text-sm text-stone-600 dark:text-stone-400">
            Enter your email address and we'll send you a reset link
          </p>
        </div>

        <UCard class="p-8 bg-white shadow-warm border border-stone-200 rounded-2xl transition-colors duration-300 dark:border-stone-700 dark:bg-stone-800">
          <UForm
            :schema="forgotPasswordSchema"
            :state="state"
            class="space-y-6"
            @submit="handleForgotPassword"
          >
            <UFormField
              label="Email address"
              name="email"
              required
            >
              <UInput
                v-model="state.email"
                type="email"
                placeholder="Enter your email address"
                autocomplete="email"
                size="lg"
                :disabled="loading"
              />
            </UFormField>

            <UButton
              type="submit"
              :loading="loading"
              :disabled="loading"
              class="w-full"
              size="lg"
            >
              {{ loading ? 'Sending reset link...' : 'Send reset link' }}
            </UButton>
          </UForm>

          <div class="text-center mt-6 text-stone-600 dark:text-stone-400">
            <NuxtLink
              to="/auth/login"
              class="text-sm font-medium text-orange-700 hover:text-orange-800 dark:text-orange-500 dark:hover:text-orange-400 transition-colors"
            >
              Back to sign in
            </NuxtLink>
          </div>

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
</template>

<script setup lang="ts">
import { z } from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';

// Page meta
definePageMeta({
  layout: false,
  middleware: 'guest',
});

// SEO
useSeoMeta({
  title: 'Forgot Password - LifeStint',
  description: 'Reset your LifeStint account password.',
});

// Form validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordSchema = z.output<typeof forgotPasswordSchema>;

// Form state
const state = reactive<ForgotPasswordSchema>({
  email: '',
});

// UI state
const loading = ref(false);
const error = ref('');
const success = ref('');
const successDescription = ref('');

// Supabase client
const supabase = useSupabaseClient();

// Handle form submission
async function handleForgotPassword(event: FormSubmitEvent<ForgotPasswordSchema>) {
  loading.value = true;
  error.value = '';
  success.value = '';
  successDescription.value = '';

  try {
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      event.data.email,
      {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    );

    if (resetError) {
      throw resetError;
    }

    success.value = 'Password reset link sent!';
    successDescription.value = `We've sent a password reset link to ${event.data.email}. Please check your inbox and click the link to reset your password.`;

    // Clear the form
    state.email = '';
  }
  catch (err: unknown) {
    console.error('Forgot password error:', err);

    // Handle specific error types
    const errorMessage = err instanceof Error ? err.message : String(err);
    switch (errorMessage) {
      case 'Invalid email':
        error.value = 'Please enter a valid email address.';
        break;
      case 'Email not found':
        error.value = 'No account found with this email address.';
        break;
      case 'Email rate limit exceeded':
        error.value = 'Too many password reset requests. Please wait a moment and try again.';
        break;
      default:
        error.value = errorMessage || 'An error occurred while sending the reset link. Please try again.';
    }
  }
  finally {
    loading.value = false;
  }
}

// Clear messages when user starts typing
watch(() => state.email, () => {
  error.value = '';
  success.value = '';
});
</script>
