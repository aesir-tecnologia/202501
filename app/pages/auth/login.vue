<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: false,
  middleware: 'guest',
})

useSeoMeta({
  title: 'Sign In - LifeStint',
  description: 'Sign in to your LifeStint account to start tracking your focus sessions.',
})

const appConfig = useAppConfig()
const supabase = useSupabaseClient()

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  remember: z.boolean().optional(),
})

type LoginSchema = z.output<typeof loginSchema>

const state = reactive<LoginSchema>({
  email: '',
  password: '',
  remember: false,
})

const loading = ref(false)
const error = ref('')
const success = ref('')

async function handleLogin(event: FormSubmitEvent<LoginSchema>) {
  loading.value = true
  error.value = ''
  success.value = ''

  try {
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: event.data.email,
      password: event.data.password,
    })

    if (authError) {
      throw authError
    }

    if (data.user) {
      if (!data.user.email_confirmed_at) {
        error.value = 'Please check your email and click the confirmation link before signing in.'
        return
      }

      success.value = 'Successfully signed in! Redirecting...'

      navigateTo(appConfig.auth.redirectUrl)
    }
  }
  catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    switch (errorMessage) {
      case 'Invalid login credentials':
        error.value = 'Invalid email or password. Please try again.'
        break
      case 'Email not confirmed':
        error.value = 'Please check your email and confirm your account before signing in.'
        break
      case 'Too many requests':
        error.value = 'Too many login attempts. Please wait a moment and try again.'
        break
      default:
        error.value = errorMessage || 'An unexpected error occurred. Please try again.'
    }
  }
  finally {
    loading.value = false
  }
}

watch(() => state.email, () => {
  error.value = ''
  success.value = ''
})

watch(() => state.password, () => {
  error.value = ''
  success.value = ''
})
</script>

<template>
  <UApp>
    <div class="min-h-screen flex items-center justify-center bg-[#0a0e1a] py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <!-- Header Section -->
        <div class="text-center space-y-4">
          <h2 class="text-3xl font-bold text-white">
            Sign in to your account
          </h2>
          <p class="text-sm text-gray-400">
            Don't have an account?
            <NuxtLink
              to="/auth/register"
              class="font-medium text-[#15bf83] hover:text-[#2fd89a] transition-colors duration-200"
            >
              Sign up here
            </NuxtLink>
          </p>
        </div>

        <!-- Form Card -->
        <div class="bg-[#131628] border border-[#1a1f35] rounded-xl p-8 shadow-2xl backdrop-blur-sm">
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
              <template #label>
                <span class="text-white text-sm font-medium">Email address *</span>
              </template>
              <UInput
                v-model="state.email"
                type="email"
                placeholder="Enter your email"
                autocomplete="email"
                :disabled="loading"
                class="w-full bg-[#0f1320] border-[#1a1f35] text-white placeholder:text-gray-500 focus:border-[#15bf83] focus:ring-[#15bf83]/20"
                size="lg"
              />
            </UFormField>

            <!-- Password Field -->
            <UFormField
              label="Password"
              name="password"
              required
            >
              <template #label>
                <span class="text-white text-sm font-medium">Password *</span>
              </template>
              <UInput
                v-model="state.password"
                type="password"
                placeholder="Enter your password"
                autocomplete="current-password"
                :disabled="loading"
                class="w-full bg-[#0f1320] border-[#1a1f35] text-white placeholder:text-gray-500 focus:border-[#15bf83] focus:ring-[#15bf83]/20"
                size="lg"
              />
            </UFormField>

            <!-- Remember & Forgot -->
            <div class="flex items-center justify-between">
              <UCheckbox
                v-model="state.remember"
                :disabled="loading"
                class="text-white"
              >
                <template #label>
                  <span class="text-white text-sm">Remember me</span>
                </template>
              </UCheckbox>

              <NuxtLink
                to="/auth/forgot-password"
                class="text-sm font-medium text-[#15bf83] hover:text-[#2fd89a] transition-colors duration-200"
              >
                Forgot your password?
              </NuxtLink>
            </div>

            <!-- Submit Button -->
            <UButton
              type="submit"
              :loading="loading"
              :disabled="loading"
              class="w-full bg-[#15bf83] hover:bg-[#2fd89a] text-white font-semibold rounded-lg shadow-lg hover:shadow-[#15bf83]/25 transition-all duration-200"
              size="lg"
            >
              {{ loading ? 'Signing in...' : 'Sign in' }}
            </UButton>
          </UForm>

          <!-- Error Alert -->
          <UAlert
            v-if="error"
            icon="i-heroicons-exclamation-triangle"
            color="error"
            variant="soft"
            :title="error"
            class="mt-6 bg-red-950/50 border-red-800/50 text-red-200"
          />

          <!-- Success Alert -->
          <UAlert
            v-if="success"
            icon="i-heroicons-check-circle"
            color="success"
            variant="soft"
            :title="success"
            class="mt-6 bg-green-950/50 border-green-800/50 text-green-200"
          />
        </div>
      </div>
    </div>
  </UApp>
</template>

<style scoped>
/* Ensure custom input styles override Nuxt UI defaults */
:deep(.ui-input) {
  background-color: #0f1320 !important;
  border-color: #1a1f35 !important;
  color: white !important;
}

:deep(.ui-input:focus) {
  border-color: #15bf83 !important;
  ring-color: rgba(21, 191, 131, 0.2) !important;
}

:deep(.ui-input::placeholder) {
  color: #6b7280 !important;
}

/* Custom button styles */
:deep(.ui-button) {
  background-color: #15bf83 !important;
  color: white !important;
}

:deep(.ui-button:hover:not(:disabled)) {
  background-color: #2fd89a !important;
}

/* Checkbox styles */
:deep(.ui-checkbox) {
  color: white;
}

:deep(.ui-checkbox input:checked) {
  background-color: #15bf83 !important;
  border-color: #15bf83 !important;
}
</style>
