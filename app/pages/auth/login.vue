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
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200 dark:bg-gray-950">
      <div class="max-w-md w-full space-y-8 text-gray-900 dark:text-gray-100">
        <div class="text-center space-y-3">
          <h2 class="text-3xl font-bold">
            Sign in to your account
          </h2>
          <p class="text-sm text-gray-600 dark:text-gray-300">
            Don't have an account?
            <NuxtLink
              to="/auth/register"
              class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Sign up here
            </NuxtLink>
          </p>
        </div>

        <UCard class="p-8 bg-white/80 shadow-sm backdrop-blur transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900/70">
          <UForm
            :schema="loginSchema"
            :state="state"
            class="space-y-6"
            @submit="handleLogin"
          >
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
                placeholder="Enter your password"
                autocomplete="current-password"
                :disabled="loading"
                class="w-full"
              />
            </UFormField>

            <div class="flex items-center justify-between text-gray-600 dark:text-gray-300">
              <UCheckbox
                v-model="state.remember"
                label="Remember me"
                :disabled="loading"
              />

              <NuxtLink
                to="/auth/forgot-password"
                class="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Forgot your password?
              </NuxtLink>
            </div>

            <UButton
              type="submit"
              :loading="loading"
              :disabled="loading"
              class="w-full"
              size="lg"
            >
              {{ loading ? 'Signing in...' : 'Sign in' }}
            </UButton>
          </UForm>

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
            class="mt-4"
          />
        </UCard>
      </div>
    </div>
  </UApp>
</template>
