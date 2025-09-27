<template>
  <UApp>
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200 dark:bg-gray-950">
      <div class="max-w-md w-full space-y-8 text-gray-900 dark:text-gray-100">
        <div class="text-center space-y-3">
          <h2 class="text-3xl font-bold">
            Reset your password
          </h2>
          <p class="text-sm text-gray-600 dark:text-gray-300">
            Enter your email address and we'll send you a reset link
          </p>
        </div>

        <UCard class="p-8 bg-white/80 shadow-sm backdrop-blur transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900/70">
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

          <div class="text-center mt-6 text-gray-600 dark:text-gray-300">
            <NuxtLink
              to="/auth/login"
              class="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Back to sign in
            </NuxtLink>
          </div>

          <UAlert
            v-if="error"
            icon="i-heroicons-exclamation-triangle"
            color="red"
            variant="soft"
            :title="error"
            class="mt-4"
          />

          <UAlert
            v-if="success"
            icon="i-heroicons-check-circle"
            color="green"
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
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

// Page meta
definePageMeta({
  layout: false,
  middleware: 'guest',
})

// SEO
useSeoMeta({
  title: 'Forgot Password - LifeStint',
  description: 'Reset your LifeStint account password.',
})

// Form validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type ForgotPasswordSchema = z.output<typeof forgotPasswordSchema>

// Form state
const state = reactive<ForgotPasswordSchema>({
  email: '',
})

// UI state
const loading = ref(false)
const error = ref('')
const success = ref('')
const successDescription = ref('')

// Supabase client
const supabase = useSupabaseClient()

// Handle form submission
async function handleForgotPassword(event: FormSubmitEvent<ForgotPasswordSchema>) {
  loading.value = true
  error.value = ''
  success.value = ''
  successDescription.value = ''

  try {
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      event.data.email,
      {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    )

    if (resetError) {
      throw resetError
    }

    success.value = 'Password reset link sent!'
    successDescription.value = `We've sent a password reset link to ${event.data.email}. Please check your inbox and click the link to reset your password.`

    // Clear the form
    state.email = ''
  }
  catch (err: unknown) {
    console.error('Forgot password error:', err)

    // Handle specific error types
    const errorMessage = err instanceof Error ? err.message : String(err)
    switch (errorMessage) {
      case 'Invalid email':
        error.value = 'Please enter a valid email address.'
        break
      case 'Email not found':
        error.value = 'No account found with this email address.'
        break
      case 'Email rate limit exceeded':
        error.value = 'Too many password reset requests. Please wait a moment and try again.'
        break
      default:
        error.value = errorMessage || 'An error occurred while sending the reset link. Please try again.'
    }
  }
  finally {
    loading.value = false
  }
}

// Clear messages when user starts typing
watch(() => state.email, () => {
  error.value = ''
  success.value = ''
})
</script>
