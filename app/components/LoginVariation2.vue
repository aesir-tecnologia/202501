<template>
  <!-- iPhone Frame -->
  <div class="flex flex-col items-center">
    <h3 class="text-[#F5F7FA] text-lg font-semibold mb-4">Data-Focused Analytics</h3>
    <div class="relative">
      <!-- iPhone 14 Frame -->
      <div class="w-[375px] h-[812px] bg-black rounded-[55px] p-2 shadow-2xl">
        <div class="w-full h-full bg-[#060709] rounded-[45px] overflow-hidden relative">
          <!-- Notch -->
          <div class="absolute top-0 left-1/2 transform -translate-x-1/2 w-[150px] h-[30px] bg-black rounded-b-2xl z-10"></div>

          <!-- Login Screen Content -->
          <div class="h-full flex flex-col px-6 pt-16 pb-8">
            <!-- Header with Analytics Preview -->
            <div class="text-center mb-8">
              <h1 class="text-2xl font-bold text-[#F5F7FA] tracking-tight mb-2">LifeStint</h1>
              <p class="text-[#B6BDCF] text-sm mb-6">Professional productivity analytics</p>

              <!-- Mini Analytics Preview -->
              <div class="bg-[#11131B] border border-white/10 rounded-xl p-4 mb-6">
                <div class="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div class="text-[#34D399] text-lg font-bold tracking-tight">127</div>
                    <div class="text-[#6C738A] text-xs">Focus Sessions</div>
                  </div>
                  <div>
                    <div class="text-[#38BDF8] text-lg font-bold tracking-tight">89%</div>
                    <div class="text-[#6C738A] text-xs">Success Rate</div>
                  </div>
                  <div>
                    <div class="text-[#A855F7] text-lg font-bold tracking-tight">42h</div>
                    <div class="text-[#6C738A] text-xs">This Week</div>
                  </div>
                </div>
                <!-- Mini Progress Chart -->
                <div class="mt-4">
                  <div class="flex items-end justify-between h-8 gap-1">
                    <div class="bg-[#34D399]/20 w-2 h-4 rounded-t"></div>
                    <div class="bg-[#34D399]/40 w-2 h-6 rounded-t"></div>
                    <div class="bg-[#34D399]/60 w-2 h-5 rounded-t"></div>
                    <div class="bg-[#34D399] w-2 h-8 rounded-t"></div>
                    <div class="bg-[#34D399]/80 w-2 h-7 rounded-t"></div>
                    <div class="bg-[#34D399]/60 w-2 h-5 rounded-t"></div>
                    <div class="bg-[#34D399]/30 w-2 h-3 rounded-t"></div>
                  </div>
                  <div class="text-[#6C738A] text-xs text-center mt-2">Weekly Focus Trend</div>
                </div>
              </div>
            </div>

            <!-- Login Form -->
            <div class="flex-1 space-y-4">
              <div class="text-center mb-4">
                <p class="text-[#B6BDCF] text-sm">Sign in to access your analytics</p>
              </div>

              <div class="space-y-4">
                <!-- Email Input with Icon -->
                <div class="relative">
                  <Icon name="lucide:mail" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6C738A]" />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    class="w-full pl-10 pr-4 py-3 bg-[#121420] border border-[#1F2230] rounded-lg text-[#F5F7FA] placeholder-[#6C738A] focus:border-[#38BDF8] focus:ring-4 focus:ring-sky-400/25 transition-colors"
                  />
                </div>

                <!-- Password Input with Icon -->
                <div class="relative">
                  <Icon name="lucide:lock" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6C738A]" />
                  <input
                    type="password"
                    placeholder="Enter your password"
                    class="w-full pl-10 pr-4 py-3 bg-[#121420] border border-[#1F2230] rounded-lg text-[#F5F7FA] placeholder-[#6C738A] focus:border-[#38BDF8] focus:ring-4 focus:ring-sky-400/25 transition-colors"
                  />
                  <Icon name="lucide:eye-off" class="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6C738A] cursor-pointer hover:text-[#B6BDCF]" />
                </div>
              </div>

              <!-- Advanced Options -->
              <div class="bg-[#11131B] border border-white/10 rounded-lg p-3">
                <label class="flex items-center justify-between">
                  <span class="text-[#B6BDCF] text-sm">Enable analytics dashboard</span>
                  <div class="relative">
                    <input type="checkbox" checked class="sr-only">
                    <div class="w-8 h-4 bg-[#38BDF8] rounded-full shadow-inner"></div>
                    <div class="absolute w-3 h-3 bg-white rounded-full shadow left-4 top-0.5 transform transition"></div>
                  </div>
                </label>
              </div>

              <!-- Sign In Button with Analytics Theme -->
              <button class="w-full bg-gradient-to-r from-[#38BDF8] to-[#0EA5E9] hover:from-[#0EA5E9] hover:to-[#0284C7] text-[#0B0C14] font-semibold py-3 px-6 rounded-lg transition-all shadow-lg">
                <div class="flex items-center justify-center gap-2">
                  <Icon name="lucide:trending-up" class="w-4 h-4" />
                  <span>Access Dashboard</span>
                </div>
              </button>

              <!-- Alternative Actions -->
              <div class="flex gap-2 text-xs">
                <button class="flex-1 bg-white/5 hover:bg-white/10 text-[#B6BDCF] py-2 px-3 rounded-lg transition-colors">
                  Demo Mode
                </button>
                <button class="flex-1 bg-white/5 hover:bg-white/10 text-[#B6BDCF] py-2 px-3 rounded-lg transition-colors">
                  Reset Password
                </button>
              </div>
            </div>

            <!-- Footer with Stats -->
            <div class="text-center pt-4 border-t border-white/10">
              <div class="flex justify-center gap-4 text-xs text-[#6C738A] mb-2">
                <span>2.3M+ Sessions Tracked</span>
                <span>99.9% Uptime</span>
              </div>
              <p class="text-[#6C738A] text-xs">Trusted by productivity professionals</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Component for Login Variation 2 - Data-Focused Analytics
</script>