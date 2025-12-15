<script setup lang="ts">
defineProps<{
  isActive: boolean
  isToggling: boolean
  variant: 'desktop' | 'mobile'
}>();

const emit = defineEmits<{
  'toggle-active': [value: boolean]
  'edit': []
}>();

const glassPanel = [
  'flex items-center gap-2 rounded-2xl pl-3 pr-2 py-2',
  'bg-white/20 dark:bg-white/[0.04]',
  'ring-1 ring-inset ring-slate-200/70 dark:ring-white/10',
  'backdrop-blur-md shadow-sm shadow-black/5 dark:shadow-black/20',
  'transition-colors hover:bg-white/30 dark:hover:bg-white/[0.06]',
].join(' ');

const glassButton = [
  'rounded-2xl',
  'bg-white/20 dark:bg-white/[0.04]',
  'ring-1 ring-inset ring-slate-200/70 dark:ring-white/10',
  'backdrop-blur-md shadow-sm shadow-black/5 dark:shadow-black/20',
  'hover:bg-white/30 dark:hover:bg-white/[0.06]',
  'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100',
  'transition-colors',
].join(' ');

function handleToggle() {
  emit('toggle-active', true);
}

function handleEdit() {
  emit('edit');
}
</script>

<template>
  <div class="flex items-center gap-2">
    <div :class="glassPanel">
      <!-- Desktop: shows "Active/Inactive" label with icon -->
      <span
        v-if="variant === 'desktop'"
        class="inline-flex items-center gap-1.5 text-xs font-semibold"
      >
        <UIcon
          :name="isActive ? 'i-lucide-badge-check' : 'i-lucide-ban'"
          class="w-3.5 h-3.5"
          :class="isActive ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-500'"
        />
        <span :class="isActive ? 'text-slate-700 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'">
          {{ isActive ? 'Active' : 'Inactive' }}
        </span>
      </span>

      <!-- Mobile: shows "Status" label -->
      <span
        v-else
        class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"
      >
        Status
      </span>

      <div class="h-5 w-px bg-slate-200/70 dark:bg-slate-700/50" />

      <UTooltip :text="isActive ? 'Deactivate project' : 'Activate project'">
        <USwitch
          :model-value="isActive"
          :loading="isToggling"
          :disabled="isToggling"
          size="lg"
          checked-icon="i-lucide-check"
          unchecked-icon="i-lucide-power"
          :aria-label="isActive ? 'Deactivate project' : 'Activate project'"
          @update:model-value="handleToggle"
        />
      </UTooltip>
    </div>

    <UTooltip text="Settings">
      <UButton
        icon="i-lucide-settings-2"
        color="neutral"
        variant="ghost"
        size="sm"
        :class="glassButton"
        aria-label="Edit project settings"
        @click="handleEdit"
      />
    </UTooltip>
  </div>
</template>
