<template>
  <div class="min-h-screen bg-[#060709] py-8 px-4">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-12">
        <h1 class="text-3xl font-bold text-[#F5F7FA] mb-4">
          Login Page Design Variations
        </h1>
        <p class="text-[#B6BDCF] text-lg">
          Three unique takes on the LifeStint login experience
        </p>
      </div>

      <!-- First Row: All three variations -->
      <div class="flex flex-wrap justify-center gap-8 mb-16">
        <LoginVariation1 />
        <LoginVariation2 />
        <LoginVariation3 />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Page meta
definePageMeta({
  layout: false,
})

// SEO
useSeoMeta({
  title: 'Design Showcase - LifeStint Login Variations',
  description: 'Three unique login page designs for LifeStint',
})
</script>
