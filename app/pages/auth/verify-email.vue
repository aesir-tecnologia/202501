<template>
  <UApp>
    <div class="min-h-screen flex items-center justify-center bg-[#fffbf5] py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 dark:bg-stone-900">
      <div class="max-w-md w-full space-y-8 text-stone-800 dark:text-stone-50">
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
            Check your email
          </h2>
          <p class="text-sm text-stone-600 dark:text-stone-400">
            We've sent a verification link to your email address
          </p>
        </div>

        <UCard class="p-8 text-center bg-white shadow-warm border border-stone-200 rounded-2xl transition-colors duration-300 dark:border-stone-700 dark:bg-stone-800">
          <div class="space-y-6">
            <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
              <UIcon
                name="i-lucide-mail"
                class="h-6 w-6 text-green-700 dark:text-green-400"
              />
            </div>

            <div class="space-y-2">
              <h3 class="text-lg font-medium text-stone-800 dark:text-stone-50">
                Verification email sent
              </h3>
              <p class="text-sm text-stone-600 dark:text-stone-400">
                Please check your inbox and click the verification link to complete your registration.
                <span
                  v-if="email"
                  class="block font-medium mt-1 text-stone-800 dark:text-stone-200"
                >{{ email }}</span>
              </p>
            </div>

            <div class="space-y-3">
              <p class="text-xs text-stone-500 dark:text-stone-400">
                Didn't receive the email? Check your spam folder or click below to resend.
              </p>

              <UButton
                :loading="resending"
                :disabled="resending || cooldownActive"
                variant="outline"
                size="lg"
                class="w-full"
                @click="resendVerification"
              >
                {{ resendButtonText }}
              </UButton>

              <div
                v-if="cooldownActive"
                class="text-xs text-stone-500 dark:text-stone-400"
              >
                You can request another email in {{ cooldownSeconds }} seconds
              </div>
            </div>

            <UAlert
              v-if="resendError"
              icon="i-lucide-triangle-alert"
              color="error"
              variant="soft"
              :title="resendError"
              class="mt-4"
            />

            <UAlert
              v-if="resendSuccess"
              icon="i-lucide-circle-check"
              color="success"
              variant="soft"
              :title="resendSuccess"
              class="mt-4"
            />
          </div>

          <div class="mt-8 pt-6 border-t border-stone-200 dark:border-stone-700">
            <div class="space-y-2">
              <NuxtLink
                to="/auth/login"
                class="text-sm font-medium text-orange-700 hover:text-orange-800 dark:text-orange-500 dark:hover:text-orange-400 transition-colors"
              >
                Back to sign in
              </NuxtLink>
              <br>
              <NuxtLink
                to="/auth/register"
                class="text-sm text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 transition-colors"
              >
                Use a different email address
              </NuxtLink>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </UApp>
</template>

<script setup lang="ts">
// Page meta
definePageMeta({
  layout: false,
  middleware: 'guest',
});

// SEO
useSeoMeta({
  title: 'Verify Email - LifeStint',
  description: 'Verify your email address to complete your LifeStint account registration.',
});

// Get email from query params
const route = useRoute();
const email = ref(route.query.email as string || '');

// State
const resending = ref(false);
const resendError = ref('');
const resendSuccess = ref('');
const cooldownActive = ref(false);
const cooldownSeconds = ref(0);

// Computed
const resendButtonText = computed(() => {
  if (resending.value) return 'Sending...';
  if (cooldownActive.value) return `Resend in ${cooldownSeconds.value}s`;
  return 'Resend verification email';
});

// Supabase client
const supabase = useSupabaseClient();

// Cooldown timer
const COOLDOWN_DURATION = 60; // 60 seconds
let cooldownInterval: NodeJS.Timeout | null = null;

function startCooldown() {
  cooldownActive.value = true;
  cooldownSeconds.value = COOLDOWN_DURATION;

  cooldownInterval = setInterval(() => {
    cooldownSeconds.value--;

    if (cooldownSeconds.value <= 0) {
      cooldownActive.value = false;
      if (cooldownInterval) {
        clearInterval(cooldownInterval);
        cooldownInterval = null;
      }
    }
  }, 1000);
}

// Cleanup interval on unmount
onUnmounted(() => {
  if (cooldownInterval) {
    clearInterval(cooldownInterval);
  }
});

// Resend verification email
async function resendVerification() {
  if (!email.value) {
    resendError.value = 'Email address is required to resend verification';
    return;
  }

  if (cooldownActive.value) {
    return;
  }

  resending.value = true;
  resendError.value = '';
  resendSuccess.value = '';

  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.value,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      throw error;
    }

    resendSuccess.value = 'Verification email sent successfully!';
    startCooldown();
  }
  catch (err: unknown) {
    console.error('Resend verification error:', err);

    const errorMessage = err instanceof Error ? err.message : String(err);
    switch (errorMessage) {
      case 'Email rate limit exceeded':
        resendError.value = 'Too many requests. Please wait before requesting another email.';
        startCooldown();
        break;
      case 'User not found':
        resendError.value = 'No account found with this email address.';
        break;
      default:
        resendError.value = errorMessage || 'Failed to resend verification email. Please try again.';
    }
  }
  finally {
    resending.value = false;
  }
}

// Auto-clear success/error messages after a delay
watch(resendSuccess, (newValue) => {
  if (newValue) {
    setTimeout(() => {
      resendSuccess.value = '';
    }, 5000);
  }
});

watch(resendError, (newValue) => {
  if (newValue && !newValue.includes('rate limit') && !newValue.includes('Too many requests')) {
    setTimeout(() => {
      resendError.value = '';
    }, 5000);
  }
});
</script>
