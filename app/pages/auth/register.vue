<template>
  <UApp>
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200 dark:bg-gray-950">
      <div class="max-w-md w-full space-y-8 text-gray-900 dark:text-gray-100">
        <div class="text-center space-y-3">
          <h2 class="text-3xl font-bold">
            Create your account
          </h2>
          <p class="text-sm text-gray-600 dark:text-gray-300">
            Already have an account?
            <NuxtLink
              to="/auth/login"
              class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Sign in here
            </NuxtLink>
          </p>
        </div>

        <UCard class="p-8 bg-white/80 shadow-sm backdrop-blur transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900/70">
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
                :disabled="loading"
                class="w-full"
              />
            </UFormField>
            <div class="text-xs text-gray-500 -mt-4 mb-2">
              Password must be at least 8 characters with uppercase, lowercase, number, and special character
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
                :disabled="loading"
                class="w-full"
              />
            </UFormField>

            <div class="space-y-3 text-gray-600 dark:text-gray-300">
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
                      class="text-primary-600 hover:text-primary-500 font-medium dark:text-primary-400 dark:hover:text-primary-300"
                      target="_blank"
                    >
                      Terms of Service
                    </NuxtLink>
                    and
                    <NuxtLink
                      to="/legal/privacy"
                      class="text-primary-600 hover:text-primary-500 font-medium dark:text-primary-400 dark:hover:text-primary-300"
                      target="_blank"
                    >
                      Privacy Policy
                    </NuxtLink>
                  </span>
                </template>
              </UCheckbox>

              <UCheckbox
                v-model="state.emailNotifications"
                :disabled="loading"
              >
                <template #label>
                  <span class="text-sm">
                    I would like to receive email updates about new features (optional)
                  </span>
                </template>
              </UCheckbox>
            </div>

            <UButton
              type="submit"
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
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: false,
  middleware: 'guest',
})

useSeoMeta({
  title: 'Sign Up - LifeStint',
  description: 'Create your LifeStint account to start tracking your focus sessions and boost your productivity.',
})

// Password validation regex ensures length and required character sets
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

// Form validation schema
const registerSchema = z.object({
  fullName: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(50, 'Full name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Full name can only contain letters and spaces'),
  email: z.string()
    .email('Please enter a valid email address')
    .toLowerCase(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(passwordRegex, 'Password must contain uppercase, lowercase, number, and special character'),
  confirmPassword: z.string(),
  acceptTerms: z.boolean()
    .refine(val => val, 'You must accept the terms and conditions'),
  emailNotifications: z.boolean().optional(),
}).refine(
  data => data.password === data.confirmPassword,
  {
    message: 'Passwords don\'t match',
    path: ['confirmPassword'],
  },
)

type RegisterSchema = z.output<typeof registerSchema>

// Form state
const state = reactive<RegisterSchema>({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false,
  emailNotifications: true,
})

// UI state
const loading = ref(false)
const error = ref('')
const success = ref('')
const successDescription = ref('')

// Supabase client
const supabase = useSupabaseClient()
const user = useAuthUser()

// Redirect if already logged in
watch(user, (newUser) => {
  if (newUser) {
    navigateTo('/dashboard')
  }
})

// Handle form submission
async function handleRegister(event: FormSubmitEvent<RegisterSchema>) {
  loading.value = true
  error.value = ''
  success.value = ''
  successDescription.value = ''

  try {
    const { data, error: authError } = await supabase.auth.signUp({
      email: event.data.email,
      password: event.data.password,
      options: {
        data: {
          full_name: event.data.fullName,
          email_notifications: event.data.emailNotifications || false,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (authError) {
      throw authError
    }

    if (data.user) {
      // Check if email is confirmed by looking at the user state
      // Note: Need to check Supabase user directly as useAuthUser transforms it
      const supabaseUserDirect = useSupabaseUser()
      if (supabaseUserDirect.value?.email_confirmed_at) {
        // Auto-confirmed (development mode)
        success.value = 'Account created successfully!'
        successDescription.value = 'You are now signed in. Redirecting to dashboard...'

        setTimeout(() => {
          navigateTo('/dashboard')
        }, 2000)
      }
      else {
        // Email confirmation required - redirect to verification page
        navigateTo({
          path: '/auth/verify-email',
          query: { email: event.data.email },
        })
      }
    }
  }
  catch (err: unknown) {
    console.error('Registration error:', err)

    // Handle specific error types
    const errorMessage = err instanceof Error ? err.message : String(err)
    switch (errorMessage) {
      case 'User already registered':
        error.value = 'An account with this email already exists. Please sign in instead.'
        break
      case 'Password should be at least 6 characters':
        error.value = 'Password must be at least 6 characters long.'
        break
      case 'Signup is disabled':
        error.value = 'Account registration is currently disabled. Please contact support.'
        break
      case 'Invalid email':
        error.value = 'Please enter a valid email address.'
        break
      default:
        error.value = errorMessage || 'An unexpected error occurred during registration. Please try again.'
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

watch(() => state.password, () => {
  error.value = ''
  success.value = ''
})

watch(() => state.confirmPassword, () => {
  error.value = ''
  success.value = ''
})
</script>
