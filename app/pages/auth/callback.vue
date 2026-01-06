<script setup lang="ts">
definePageMeta({
  layout: false,
});

useSeoMeta({
  title: 'Authenticating - LifeStint',
  description: 'Completing your authentication to LifeStint.',
});

const appConfig = useAppConfig();
const supabase = useSupabaseClient();

const loading = ref(true);
const error = ref('');
const success = ref(false);

async function handleAuthCallback() {
  try {
    // Get the current URL and check for auth parameters
    const { data, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    // Check if we have a valid session
    if (data.session && data.session.user) {
      success.value = true;
      navigateTo(appConfig.auth.redirectUrl, { replace: true });
    }
    else {
      // Check for URL query parameters (email confirmation)
      const route = useRoute();
      const callbackCode = route.query.code;

      // Handle email confirmation or password reset
      if (callbackCode && typeof callbackCode === 'string') {
        const hashParams = new URLSearchParams(callbackCode.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        if (accessToken && refreshToken) {
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (setSessionError) {
            throw setSessionError;
          }

          if (type === 'signup') {
            success.value = true;
            navigateTo(appConfig.auth.redirectUrl, { replace: true });
          }
          else if (type === 'recovery') {
            // Redirect to password reset page
            // navigateTo('/auth/reset-password', { replace: true })
            alert('Redirect TO reset password');
          }
          else {
            success.value = true;
            navigateTo(appConfig.auth.redirectUrl, { replace: true });
          }
        }
        else {
          throw new Error('Missing authentication tokens in callback URL');
        }
      }
      else {
        throw new Error('No valid session or authentication parameters found');
      }
    }
  }
  catch (err: unknown) {
    console.error('Auth callback error:', err);

    // Handle specific error types
    const errorMessage = err instanceof Error ? err.message : String(err);
    switch (errorMessage) {
      case 'Email link is invalid or has expired':
        error.value = 'This confirmation link has expired or is invalid. Please request a new one.';
        break;
      case 'Token has expired or is invalid':
        error.value = 'This authentication link has expired. Please sign in again.';
        break;
      case 'Email not confirmed':
        error.value = 'Please check your email and click the confirmation link.';
        break;
      default:
        error.value = errorMessage || 'An error occurred during authentication. Please try signing in again.';
    }
  }
  finally {
    loading.value = false;
  }
}

// Handle the callback when component mounts
onMounted(() => {
  handleAuthCallback();
});
</script>

<template>
  <UApp>
    <div class="min-h-screen flex items-center justify-center bg-[#fffbf5] transition-colors duration-300 dark:bg-stone-900">
      <div class="max-w-md w-full text-stone-800 dark:text-stone-50">
        <UCard class="p-8 text-center bg-white shadow-warm border border-stone-200 rounded-2xl transition-colors duration-300 dark:border-stone-700 dark:bg-stone-800">
          <div
            v-if="loading"
            class="space-y-4"
          >
            <UIcon
              name="i-lucide-loader-2"
              class="w-8 h-8 mx-auto text-orange-600 animate-spin dark:text-orange-500"
            />
            <h2 class="text-xl font-serif font-semibold">
              Verifying your account...
            </h2>
            <p class="text-stone-600 dark:text-stone-400">
              Please wait while we complete your authentication.
            </p>
          </div>

          <div
            v-else-if="error"
            class="space-y-4"
          >
            <UIcon
              name="i-lucide-triangle-alert"
              class="w-8 h-8 mx-auto text-red-500 dark:text-red-400"
            />
            <h2 class="text-xl font-serif font-semibold">
              Authentication Error
            </h2>
            <p class="text-stone-600 dark:text-stone-400">
              {{ error }}
            </p>
            <div class="flex flex-col sm:flex-row gap-3 justify-center">
              <UButton
                to="/auth/login"
                variant="solid"
                color="primary"
              >
                Back to Sign In
              </UButton>
              <UButton
                to="/auth/register"
                variant="outline"
                color="primary"
              >
                Create Account
              </UButton>
            </div>
          </div>

          <div
            v-else-if="success"
            class="space-y-4"
          >
            <UIcon
              name="i-lucide-circle-check"
              class="w-8 h-8 mx-auto text-green-600 dark:text-green-500"
            />
            <h2 class="text-xl font-serif font-semibold">
              Welcome to LifeStint!
            </h2>
            <p class="text-stone-600 dark:text-stone-400">
              Your account has been successfully verified. Redirecting to your dashboard...
            </p>
            <div class="flex justify-center">
              <UButton
                to="/"
                variant="solid"
                color="primary"
              >
                Go to Dashboard
              </UButton>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </UApp>
</template>
