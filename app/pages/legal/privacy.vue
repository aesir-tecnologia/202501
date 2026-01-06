<script setup lang="ts">
definePageMeta({
  layout: false,
});

useSeoMeta({
  title: 'Privacy Policy - LifeStint',
  description: 'Learn how LifeStint collects, uses, and protects your personal information.',
});
</script>

<template>
  <div class="min-h-screen bg-[#fffbf5] dark:bg-stone-900 text-stone-800 dark:text-stone-50">
    <!-- Header -->
    <header class="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-[#fffbf5]/80 dark:supports-[backdrop-filter]:bg-stone-900/80 border-b border-stone-200 dark:border-stone-700/50">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <NuxtLink
          to="/"
          class="flex items-center"
        >
          <span class="text-xl font-semibold tracking-tight font-serif">
            <span class="text-stone-900 dark:text-white">Life</span><span class="text-orange-600 dark:text-orange-500 italic">Stint</span>
          </span>
        </NuxtLink>
        <UColorModeButton aria-label="Toggle color mode" />
      </div>
    </header>

    <!-- Content -->
    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 class="text-3xl sm:text-4xl font-semibold font-serif text-stone-900 dark:text-stone-50">
        Privacy Policy
      </h1>
      <p class="mt-2 text-stone-500 dark:text-stone-400">
        Last updated: {{ new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }}
      </p>

      <div class="mt-8 prose prose-stone dark:prose-invert max-w-none">
        <h2>1. Information We Collect</h2>
        <p>
          LifeStint collects information you provide directly to us, including your email address
          when you create an account, and usage data about your focus sessions (stint start/end times,
          project names, and optional notes).
        </p>

        <h2>2. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide, maintain, and improve our services</li>
          <li>Send you technical notices and support messages</li>
          <li>Respond to your comments and questions</li>
          <li>Generate aggregated, anonymized analytics about service usage</li>
        </ul>

        <h2>3. Information Sharing</h2>
        <p>
          We do not sell, trade, or otherwise transfer your personal information to third parties.
          Your focus data remains private and is only accessible to you. We may share anonymized,
          aggregated statistics that cannot be used to identify you.
        </p>

        <h2>4. Data Security</h2>
        <p>
          We implement appropriate security measures to protect your personal information.
          All data is encrypted in transit using TLS and at rest using industry-standard encryption.
          We use Supabase for our backend infrastructure, which provides enterprise-grade security.
        </p>

        <h2>5. Data Retention</h2>
        <p>
          We retain your account information and focus session data for as long as your account is
          active. You can request deletion of your data at any time by contacting us or through
          your account settings.
        </p>

        <h2>6. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access your personal data</li>
          <li>Correct inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Export your data in a portable format (CSV)</li>
        </ul>

        <h2>7. Cookies</h2>
        <p>
          We use essential cookies only to maintain your session and preferences.
          We do not use tracking cookies or third-party analytics that track you across sites.
        </p>

        <h2>8. Changes to This Policy</h2>
        <p>
          We may update this privacy policy from time to time. We will notify you of any changes
          by posting the new policy on this page and updating the "Last updated" date.
        </p>

        <h2>9. Contact Us</h2>
        <p>
          If you have questions about this Privacy Policy, please contact us at
          <a
            href="mailto:privacy@lifestint.com"
            class="text-orange-600 dark:text-orange-500 hover:underline"
          >privacy@lifestint.com</a>.
        </p>
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-stone-200 dark:border-stone-700 mt-12">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-stone-500 dark:text-stone-400">
          <div class="flex items-center gap-2">
            <span class="font-semibold tracking-tight font-serif">
              <span class="text-stone-900 dark:text-white">Life</span><span class="text-orange-600 dark:text-orange-500 italic">Stint</span>
            </span>
            <span>© {{ new Date().getFullYear() }}</span>
          </div>
          <nav class="flex items-center gap-5">
            <NuxtLink
              to="/legal/privacy"
              class="text-stone-900 dark:text-white"
            >
              Privacy
            </NuxtLink>
            <NuxtLink
              to="/legal/terms"
              class="hover:text-stone-900 dark:hover:text-white"
            >
              Terms
            </NuxtLink>
          </nav>
        </div>
      </div>
    </footer>
  </div>
</template>
