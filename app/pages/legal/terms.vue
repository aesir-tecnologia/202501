<script setup lang="ts">
definePageMeta({
  layout: false,
});

useSeoMeta({
  title: 'Terms of Service - LifeStint',
  description: 'Read the terms and conditions for using LifeStint.',
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
        Terms of Service
      </h1>
      <p class="mt-2 text-stone-500 dark:text-stone-400">
        Last updated: {{ new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }}
      </p>

      <div class="mt-8 prose prose-stone dark:prose-invert max-w-none">
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using LifeStint, you agree to be bound by these Terms of Service.
          If you do not agree to these terms, please do not use our service.
        </p>

        <h2>2. Description of Service</h2>
        <p>
          LifeStint is a focus tracking application that helps you manage work sessions ("stints")
          across multiple projects. The service includes features such as single active session
          enforcement, streak tracking, and professional reporting.
        </p>

        <h2>3. Account Registration</h2>
        <p>
          To use LifeStint, you must create an account with a valid email address.
          You are responsible for maintaining the security of your account credentials
          and for all activities that occur under your account.
        </p>

        <h2>4. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the service for any unlawful purpose</li>
          <li>Attempt to gain unauthorized access to our systems</li>
          <li>Interfere with or disrupt the service or servers</li>
          <li>Transmit any malicious code or content</li>
          <li>Resell or redistribute the service without permission</li>
        </ul>

        <h2>5. Subscription and Billing</h2>
        <p>
          LifeStint offers a free tier with limited features and a paid Pro subscription.
          Pro subscriptions are billed monthly. You may cancel your subscription at any time,
          and you will retain access to Pro features until the end of your billing period.
        </p>

        <h2>6. Data Ownership</h2>
        <p>
          You retain ownership of all data you create within LifeStint, including project names,
          stint records, and notes. We do not claim any intellectual property rights over your content.
          You may export your data at any time using our export features.
        </p>

        <h2>7. Service Availability</h2>
        <p>
          We strive to provide reliable service but do not guarantee uninterrupted access.
          We may perform maintenance or updates that temporarily affect availability.
          We are not liable for any losses resulting from service interruptions.
        </p>

        <h2>8. Limitation of Liability</h2>
        <p>
          LifeStint is provided "as is" without warranties of any kind. We are not liable for
          any indirect, incidental, or consequential damages arising from your use of the service.
          Our total liability is limited to the amount you paid us in the past 12 months.
        </p>

        <h2>9. Termination</h2>
        <p>
          We may suspend or terminate your account if you violate these terms or engage in
          abusive behavior. You may delete your account at any time through your account settings.
          Upon termination, your data will be deleted within 30 days.
        </p>

        <h2>10. Changes to Terms</h2>
        <p>
          We may update these terms from time to time. We will notify you of material changes
          via email or through the service. Continued use after changes constitutes acceptance
          of the new terms.
        </p>

        <h2>11. Governing Law</h2>
        <p>
          These terms are governed by the laws of the jurisdiction in which LifeStint operates.
          Any disputes will be resolved through binding arbitration or in the courts of that jurisdiction.
        </p>

        <h2>12. Contact</h2>
        <p>
          For questions about these Terms of Service, please contact us at
          <a
            href="mailto:legal@lifestint.com"
            class="text-orange-600 dark:text-orange-500 hover:underline"
          >legal@lifestint.com</a>.
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
              class="hover:text-stone-900 dark:hover:text-white"
            >
              Privacy
            </NuxtLink>
            <NuxtLink
              to="/legal/terms"
              class="text-stone-900 dark:text-white"
            >
              Terms
            </NuxtLink>
          </nav>
        </div>
      </div>
    </footer>
  </div>
</template>
