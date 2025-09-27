<template>
  <!-- iPhone Frame -->
  <div class="flex flex-col items-center">
    <h3 class="text-[#F5F7FA] text-lg font-semibold mb-4">Professional Minimal</h3>
    <div class="relative">
      <!-- iPhone 14 Frame -->
      <div class="w-[375px] h-[812px] bg-black rounded-[55px] p-2 shadow-2xl">
        <div class="w-full h-full bg-[#060709] rounded-[45px] overflow-hidden relative">
          <!-- Notch -->
          <div class="absolute top-0 left-1/2 transform -translate-x-1/2 w-[150px] h-[30px] bg-black rounded-b-2xl z-10"></div>

          <!-- Login Screen Content -->
          <div class="h-full flex flex-col px-6 pt-16 pb-8">
            <!-- Header -->
            <div class="text-center mb-12">
              <div class="mb-6">
                <div class="w-16 h-16 bg-[#F97316] rounded-2xl mx-auto flex items-center justify-center mb-4">
                  <Icon name="lucide:target" class="w-8 h-8 text-[#0B0C14]" />
                </div>
                <h1 class="text-2xl font-bold text-[#F5F7FA] tracking-tight">LifeStint</h1>
              </div>
              <p class="text-[#B6BDCF] text-base">Focus tracking made simple</p>
            </div>

            <!-- Login Form -->
            <div class="flex-1 space-y-6">
              <div class="space-y-4">
                <!-- Email Input -->
                <div>
                  <label class="block text-[#B6BDCF] text-sm font-medium mb-2">Email</label>
                  <div class="relative">
                    <input
                      type="email"
                      placeholder="you@example.com"
                      class="w-full px-4 py-3 bg-[#121420] border border-[#1F2230] rounded-lg text-[#F5F7FA] placeholder-[#6C738A] focus:border-[#38BDF8] focus:ring-4 focus:ring-sky-400/25 transition-colors"
                    />
                  </div>
                </div>

                <!-- Password Input -->
                <div>
                  <label class="block text-[#B6BDCF] text-sm font-medium mb-2">Password</label>
                  <div class="relative">
                    <input
                      type="password"
                      placeholder="Enter your password"
                      class="w-full px-4 py-3 bg-[#121420] border border-[#1F2230] rounded-lg text-[#F5F7FA] placeholder-[#6C738A] focus:border-[#38BDF8] focus:ring-4 focus:ring-sky-400/25 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <!-- Remember & Forgot -->
              <div class="flex items-center justify-between">
                <label class="flex items-center">
                  <input type="checkbox" class="w-4 h-4 rounded border-[#1F2230] bg-[#121420] text-[#F97316] focus:ring-[#F97316]/25">
                  <span class="ml-2 text-sm text-[#B6BDCF]">Remember me</span>
                </label>
                <button class="text-sm text-[#38BDF8] hover:text-[#0EA5E9] transition-colors">
                  Forgot password?
                </button>
              </div>

              <!-- Sign In Button -->
              <button class="w-full bg-[#F97316] hover:bg-[#FB8A36] active:bg-[#DB650F] text-[#0B0C14] font-semibold py-3 px-6 rounded-full transition-colors shadow-inner">
                Sign In
              </button>

              <!-- Sign Up Link -->
              <div class="text-center">
                <span class="text-[#6C738A] text-sm">Don't have an account? </span>
                <button class="text-[#38BDF8] hover:text-[#0EA5E9] text-sm font-medium transition-colors">
                  Sign up
                </button>
              </div>
            </div>

            <!-- Footer -->
            <div class="text-center pt-4">
              <p class="text-[#6C738A] text-xs">Professional focus tracking for modern teams</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Component for Login Variation 1 - Professional Minimal
</script>