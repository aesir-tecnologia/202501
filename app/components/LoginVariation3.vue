<template>
  <!-- iPhone Frame -->
  <div class="flex flex-col items-center">
    <h3 class="text-[#F5F7FA] text-lg font-semibold mb-4">
      Focus & Meditation
    </h3>
    <div class="relative">
      <!-- iPhone 14 Frame -->
      <div class="w-[375px] h-[812px] bg-black rounded-[55px] p-2 shadow-2xl">
        <div class="w-full h-full bg-gradient-to-b from-[#0B0C14] via-[#060709] to-[#11131B] rounded-[45px] overflow-hidden relative">
          <!-- Notch -->
          <div class="absolute top-0 left-1/2 transform -translate-x-1/2 w-[150px] h-[30px] bg-black rounded-b-2xl z-10" />

          <!-- Login Screen Content -->
          <div class="h-full flex flex-col px-6 pt-16 pb-8">
            <!-- Header with Breathing Circle -->
            <div class="text-center mb-10">
              <!-- Animated Breathing Circle -->
              <div class="relative mb-6">
                <div class="w-24 h-24 mx-auto relative">
                  <!-- Outer ring -->
                  <div class="absolute inset-0 rounded-full border-2 border-[#A855F7]/30 animate-pulse" />
                  <!-- Middle ring -->
                  <div class="absolute inset-2 rounded-full border border-[#34D399]/40" />
                  <!-- Inner core -->
                  <div class="absolute inset-4 rounded-full bg-gradient-to-br from-[#A855F7]/20 to-[#34D399]/20 backdrop-blur flex items-center justify-center">
                    <Icon
                      name="i-lucide-brain"
                      class="w-8 h-8 text-[#A855F7]"
                    />
                  </div>
                  <!-- Floating particles -->
                  <div class="absolute -top-1 left-6 w-1 h-1 bg-[#34D399] rounded-full animate-ping" />
                  <div
                    class="absolute top-4 -right-1 w-1 h-1 bg-[#A855F7] rounded-full animate-ping"
                    style="animation-delay: 1s"
                  />
                  <div
                    class="absolute -bottom-1 right-8 w-1 h-1 bg-[#F472B6] rounded-full animate-ping"
                    style="animation-delay: 2s"
                  />
                </div>
              </div>

              <h1 class="text-2xl font-light text-[#F5F7FA] tracking-wide mb-2">
                LifeStint
              </h1>
              <p class="text-[#B6BDCF] text-sm font-light">
                Find your focus. Stay present.
              </p>
            </div>

            <!-- Mindful Login Form -->
            <div class="flex-1 space-y-6">
              <!-- Breathing Prompt -->
              <div class="text-center py-4">
                <p class="text-[#B6BDCF] text-sm font-light leading-relaxed">
                  Take a moment to breathe.<br>
                  <span class="text-[#A855F7]">Ready to focus?</span>
                </p>
              </div>

              <!-- Zen-style Form -->
              <div class="space-y-6">
                <!-- Email Input - Minimal Design -->
                <div class="relative">
                  <input
                    type="email"
                    placeholder="Email"
                    class="w-full px-0 py-4 bg-transparent border-0 border-b border-[#1F2230] text-[#F5F7FA] placeholder-[#6C738A] focus:border-[#A855F7] focus:outline-none transition-colors text-center font-light"
                  >
                  <div class="absolute bottom-0 left-0 h-px bg-gradient-to-r from-transparent via-[#A855F7] to-transparent w-full transform scale-x-0 transition-transform focus-within:scale-x-100" />
                </div>

                <!-- Password Input - Minimal Design -->
                <div class="relative">
                  <input
                    type="password"
                    placeholder="Password"
                    class="w-full px-0 py-4 bg-transparent border-0 border-b border-[#1F2230] text-[#F5F7FA] placeholder-[#6C738A] focus:border-[#A855F7] focus:outline-none transition-colors text-center font-light"
                  >
                  <div class="absolute bottom-0 left-0 h-px bg-gradient-to-r from-transparent via-[#A855F7] to-transparent w-full transform scale-x-0 transition-transform focus-within:scale-x-100" />
                </div>
              </div>

              <!-- Mindfulness Toggle -->
              <div class="text-center py-6">
                <div class="bg-[#11131B]/50 backdrop-blur border border-white/10 rounded-2xl p-4">
                  <div class="flex items-center justify-center gap-3 mb-3">
                    <Icon
                      name="i-lucide-moon"
                      class="w-4 h-4 text-[#6C738A]"
                    />
                    <span class="text-[#B6BDCF] text-sm font-light">Focus Mode</span>
                    <Icon
                      name="i-lucide-sun"
                      class="w-4 h-4 text-[#A855F7]"
                    />
                  </div>
                  <div class="relative">
                    <input
                      type="checkbox"
                      checked
                      class="sr-only"
                    >
                    <div class="w-12 h-6 bg-gradient-to-r from-[#A855F7] to-[#34D399] rounded-full shadow-inner mx-auto" />
                    <div class="absolute w-5 h-5 bg-white rounded-full shadow left-1/2 top-0.5 transform translate-x-1 transition" />
                  </div>
                </div>
              </div>

              <!-- Breathing Sign In Button -->
              <div class="space-y-4">
                <button class="w-full bg-gradient-to-r from-[#A855F7]/80 to-[#34D399]/80 hover:from-[#A855F7] hover:to-[#34D399] text-[#F5F7FA] font-light py-4 px-6 rounded-2xl transition-all duration-500 backdrop-blur border border-white/20">
                  <div class="flex items-center justify-center gap-3">
                    <div class="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span class="text-base tracking-wide">Begin Focus Session</span>
                    <div
                      class="w-2 h-2 bg-white rounded-full animate-pulse"
                      style="animation-delay: 0.5s"
                    />
                  </div>
                </button>

                <!-- Gentle Alternative -->
                <div class="text-center">
                  <button class="text-[#B6BDCF] hover:text-[#F5F7FA] text-sm font-light transition-colors underline decoration-dotted underline-offset-4">
                    Practice without account
                  </button>
                </div>
              </div>
            </div>

            <!-- Mindful Footer -->
            <div class="text-center pt-6">
              <div class="flex justify-center items-center gap-2 mb-3">
                <div class="w-8 h-px bg-gradient-to-r from-transparent to-[#6C738A]" />
                <Icon
                  name="i-lucide-heart"
                  class="w-3 h-3 text-[#F472B6] animate-pulse"
                />
                <div class="w-8 h-px bg-gradient-to-l from-transparent to-[#6C738A]" />
              </div>
              <p class="text-[#6C738A] text-xs font-light">
                Mindful productivity for a balanced life
              </p>

              <!-- Meditation Quote -->
              <div class="mt-4 px-4">
                <p class="text-[#6C738A] text-xs italic font-light leading-relaxed">
                  "The present moment is the only time over which we have dominion."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Component for Login Variation 3 - Focus & Meditation
</script>
