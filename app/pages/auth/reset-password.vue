<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200 dark:bg-gray-950">
    <div class="max-w-md w-full space-y-8 text-gray-900 dark:text-gray-100">
      <div class="text-center space-y-3">
        <h2 class="text-3xl font-bold">
          Set your new password
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-300">
          Enter your new password below
        </p>
      </div>

      <UCard class="p-8 bg-white/80 shadow-sm backdrop-blur transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900/70">
        <UForm
          :schema="resetPasswordSchema"
          :state="state"
          class="space-y-6"
          @submit="handleResetPassword"
        >
          <UFormField
            label="New Password"
            name="password"
            required
          >
            <UInput
              v-model="state.password"
              type="password"
              placeholder="Enter your new password"
              autocomplete="new-password"
              :disabled="loading"
            />
            <template #hint>
              <div class="text-xs text-gray-500 mt-1 dark:text-gray-400">
                Password must be at least 8 characters with uppercase, lowercase, number, and special character
              </div>
            </template>
          </UFormField>

          <UFormField
            label="Confirm New Password"
            name="confirmPassword"
            required
          >
            <UInput
              v-model="state.confirmPassword"
              type="password"
              placeholder="Confirm your new password"
              autocomplete="new-password"
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
            {{ loading ? 'Updating password...' : 'Update password' }}
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
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

// Page meta
definePageMeta({
  layout: false,
})

// SEO
useSeoMeta({
  title: 'Reset Password - LifeStint',
  description: 'Set your new LifeStint account password.',
})

// Password validation regex ensures length and required character sets
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

// Form validation schema
const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(passwordRegex, 'Password must contain uppercase, lowercase, number, and special character'),
  confirmPassword: z.string(),
}).refine(
  data => data.password === data.confirmPassword,
  {
    message: 'Passwords don\'t match',
    path: ['confirmPassword'],
  },
)

type ResetPasswordSchema = z.output<typeof resetPasswordSchema>

// Form state
const state = reactive<ResetPasswordSchema>({
  password: '',
  confirmPassword: '',
})

// UI state
const loading = ref(false)
const error = ref('')
const success = ref('')
const successDescription = ref('')

// Supabase client
const supabase = useSupabaseClient()

// Check if user has valid session for password reset
const { data: session } = await supabase.auth.getSession()
const hasValidSession = computed(() => Boolean(session?.session))

// Redirect if no valid session
if (!hasValidSession.value) {
  throw createError({
    statusCode: 401,
    statusMessage: 'Invalid or expired reset link. Please request a new password reset.',
  })
}

// Handle form submission
async function handleResetPassword(event: FormSubmitEvent<ResetPasswordSchema>) {
  loading.value = true
  error.value = ''
  success.value = ''
  successDescription.value = ''

  try {
    const { error: updateError } = await supabase.auth.updateUser({
      password: event.data.password,
    })

    if (updateError) {
      throw updateError
    }

    success.value = 'Password updated successfully!'
    successDescription.value = 'Your password has been updated. You can now sign in with your new password.'

    // Clear the form
    state.password = ''
    state.confirmPassword = ''

    // Redirect to login after success
    setTimeout(() => {
      navigateTo('/auth/login')
    }, 3000)
  }
  catch (err: unknown) {
    console.error('Reset password error:', err)

    // Handle specific error types
    const errorMessage = err instanceof Error ? err.message : String(err)
    switch (errorMessage) {
      case 'New password should be different from the old password.':
        error.value = 'Your new password must be different from your current password.'
        break
      case 'Password should be at least 6 characters':
        error.value = 'Password must be at least 6 characters long.'
        break
      case 'Auth session missing!':
        error.value = 'Your reset session has expired. Please request a new password reset.'
        break
      default:
        error.value = errorMessage || 'An error occurred while updating your password. Please try again.'
    }
  }
  finally {
    loading.value = false
  }
}

// Clear messages when user starts typing
watch(() => state.password, () => {
  error.value = ''
  success.value = ''
})

watch(() => state.confirmPassword, () => {
  error.value = ''
  success.value = ''
})
</script>
